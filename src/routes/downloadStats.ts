import { Router, Request, Response } from 'express';

const router = Router();

// The desktop app's repo — kept server-side only. A client-side fetch straight to GitHub would
// leak this (a private repo) in the browser's network tab; routing through here keeps it hidden
// while still surfacing the public download_count numbers GitHub tracks per release asset.
const GITHUB_REPO = 'Saksham1800t/SDE-Code-App';

interface DownloadStats {
  version: string | null;
  windowsDownloadCount: number;
  macDownloadCount: number;
  totalDownloadCount: number;
}

const EMPTY: DownloadStats = { version: null, windowsDownloadCount: 0, macDownloadCount: 0, totalDownloadCount: 0 };

// In-memory only — this process is the single source of truth, and a restart just repopulates
// it. GitHub's unauthenticated API caps at 60 requests/hour total; without a cache, real visitor
// traffic would exhaust that almost immediately.
const CACHE_TTL_MS = 5 * 60 * 1000;
// How soon a FAILED attempt is retried — much sooner than a successful one, so a transient
// GitHub/network hiccup self-heals quickly instead of serving wrong data for the full TTL.
const RETRY_AFTER_FAILURE_MS = 20 * 1000;

// The last successful fetch, kept indefinitely until superseded — a failed refresh attempt
// never overwrites this, so visitors always see the last known real numbers, not zeros.
let lastGood: { data: DownloadStats; fetchedAt: number } | null = null;
// When the most recent attempt (success or failure) happened, independent of lastGood — this is
// what decides whether to trigger a new fetch, so a failure is retried on its own short timer.
let lastAttempt: { at: number; ok: boolean } | null = null;
let inFlight: Promise<{ data: DownloadStats; ok: boolean }> | null = null;
// TEMPORARY — captures why the last attempt failed, surfaced only via ?debug=1. Remove once the
// root cause of the persistent (not just transient) failure is confirmed.
let lastErrorDetail: unknown = null;

function sumInstallerDownloads(assets: Array<{ name: string; download_count: number }>): number {
  // Only the real installers — .blockmap/.yml assets are fetched by the auto-updater's own
  // polling, not by someone actually downloading the app, and would inflate this number.
  return assets
    .filter((a) => {
      const n = a.name.toLowerCase();
      return n.endsWith('.exe') || n.endsWith('.dmg');
    })
    .reduce((sum, a) => sum + (a.download_count || 0), 0);
}

async function fetchFreshStats(): Promise<{ data: DownloadStats; ok: boolean }> {
  try {
    const [latestRes, allRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`),
    ]);

    if (!latestRes.ok || !allRes.ok) {
      lastErrorDetail = {
        latestStatus: latestRes.status,
        latestStatusText: latestRes.statusText,
        latestHeaders: Object.fromEntries(latestRes.headers.entries()),
        allStatus: allRes.status,
      };
      console.error('Download stats: GitHub API returned non-OK', lastErrorDetail);
      return { data: EMPTY, ok: false };
    }

    const latest: any = await latestRes.json();
    const assets: Array<{ name: string; download_count: number }> = latest.assets ?? [];
    const windowsAsset = assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
    const macAsset = assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));

    const all = await allRes.json();
    const totalDownloadCount = Array.isArray(all)
      ? all.reduce((sum: number, release: any) => sum + sumInstallerDownloads(release.assets ?? []), 0)
      : 0;

    return {
      data: {
        version: typeof latest.tag_name === 'string' ? latest.tag_name : null,
        windowsDownloadCount: windowsAsset?.download_count ?? 0,
        macDownloadCount: macAsset?.download_count ?? 0,
        totalDownloadCount,
      },
      ok: true,
    };
  } catch (err: any) {
    lastErrorDetail = { thrown: err?.message || String(err), code: err?.cause?.code };
    console.error('Fetch download stats from GitHub failed:', err);
    return { data: EMPTY, ok: false };
  }
}

async function getStats(): Promise<DownloadStats> {
  const now = Date.now();
  const ttl = lastAttempt?.ok === false ? RETRY_AFTER_FAILURE_MS : CACHE_TTL_MS;
  const isFresh = lastAttempt && now - lastAttempt.at < ttl;

  if (isFresh && lastGood) {
    return lastGood.data;
  }

  if (!inFlight) {
    inFlight = fetchFreshStats().finally(() => {
      inFlight = null;
    });
  }
  const { data, ok } = await inFlight;
  lastAttempt = { at: now, ok };

  if (ok) {
    lastGood = { data, fetchedAt: now };
    return data;
  }
  // Keep serving the last known good numbers through a failure, never zeros.
  return lastGood?.data ?? EMPTY;
}

// GET /api/download-stats - Cached, proxied GitHub release download counts.
// ?debug=1 is TEMPORARY, to see why fetchFreshStats is failing — remove alongside lastErrorDetail.
router.get('/', async (req: Request, res: Response) => {
  try {
    const stats = await getStats();
    if (req.query.debug === '1') {
      res.json({ ...stats, _lastErrorDetail: lastErrorDetail, _lastAttempt: lastAttempt });
      return;
    }
    res.json(stats);
  } catch (err: any) {
    console.error('Download stats route error:', err);
    res.status(500).json({ message: 'Failed to fetch download stats.', error: err.message });
  }
});

export default router;
