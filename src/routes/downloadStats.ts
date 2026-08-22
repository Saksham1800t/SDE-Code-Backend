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

// In-memory only — this process is the single source of truth for the cache, and a restart
// simply means the next request repopulates it. GitHub's unauthenticated API caps at 60
// requests/hour total; without this, real visitor traffic would exhaust that almost immediately
// and everyone would start seeing stale/failed data instead of just a slightly-delayed number.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { data: DownloadStats; fetchedAt: number } | null = null;
let inFlight: Promise<DownloadStats> | null = null;

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

async function fetchFreshStats(): Promise<DownloadStats> {
  try {
    const [latestRes, allRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`),
    ]);

    let version: string | null = null;
    let windowsDownloadCount = 0;
    let macDownloadCount = 0;
    let latestBody: any = null;

    if (latestRes.ok) {
      latestBody = await latestRes.json();
      const assets: Array<{ name: string; download_count: number }> = latestBody.assets ?? [];
      version = typeof latestBody.tag_name === 'string' ? latestBody.tag_name : null;
      const windowsAsset = assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
      const macAsset = assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));
      windowsDownloadCount = windowsAsset?.download_count ?? 0;
      macDownloadCount = macAsset?.download_count ?? 0;
    } else {
      latestBody = await latestRes.text().catch(() => null);
    }

    let totalDownloadCount = 0;
    let allBody: any = null;
    if (allRes.ok) {
      allBody = await allRes.json();
      if (Array.isArray(allBody)) {
        totalDownloadCount = allBody.reduce((sum: number, release: any) => sum + sumInstallerDownloads(release.assets ?? []), 0);
      }
    } else {
      allBody = await allRes.text().catch(() => null);
    }

    // TEMPORARY diagnostics — remove once the root cause of empty results is confirmed.
    console.log('download-stats debug:', {
      latestStatus: latestRes.status,
      latestOk: latestRes.ok,
      latestBodySample: typeof latestBody === 'string' ? latestBody.slice(0, 300) : Object.keys(latestBody || {}),
      allStatus: allRes.status,
      allOk: allRes.ok,
    });

    return {
      version,
      windowsDownloadCount,
      macDownloadCount,
      totalDownloadCount,
      _debug: {
        latestStatus: latestRes.status,
        latestOk: latestRes.ok,
        latestBodySample: typeof latestBody === 'string' ? latestBody.slice(0, 300) : null,
        allStatus: allRes.status,
        allOk: allRes.ok,
      },
    } as any;
  } catch (err: any) {
    console.error('Fetch download stats from GitHub failed:', err);
    return { ...EMPTY, _debug: { error: err?.message || String(err) } } as any;
  }
}

async function getStats(): Promise<DownloadStats> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  // Collapses concurrent requests that land during a cache miss into one upstream fetch,
  // instead of each one independently hitting GitHub.
  if (!inFlight) {
    inFlight = fetchFreshStats().finally(() => {
      inFlight = null;
    });
  }
  const data = await inFlight;
  cache = { data, fetchedAt: now };
  return data;
}

// GET /api/download-stats - Cached, proxied GitHub release download counts.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err: any) {
    console.error('Download stats route error:', err);
    res.status(500).json({ message: 'Failed to fetch download stats.', error: err.message });
  }
});

export default router;
