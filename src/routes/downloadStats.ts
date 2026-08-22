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

    if (latestRes.ok) {
      const latest: any = await latestRes.json();
      const assets: Array<{ name: string; download_count: number }> = latest.assets ?? [];
      version = typeof latest.tag_name === 'string' ? latest.tag_name : null;
      const windowsAsset = assets.find((a) => a.name.toLowerCase().endsWith('.exe'));
      const macAsset = assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));
      windowsDownloadCount = windowsAsset?.download_count ?? 0;
      macDownloadCount = macAsset?.download_count ?? 0;
    }

    let totalDownloadCount = 0;
    if (allRes.ok) {
      const all = await allRes.json();
      if (Array.isArray(all)) {
        totalDownloadCount = all.reduce((sum: number, release: any) => sum + sumInstallerDownloads(release.assets ?? []), 0);
      }
    }

    return { version, windowsDownloadCount, macDownloadCount, totalDownloadCount };
  } catch (err) {
    console.error('Fetch download stats from GitHub failed:', err);
    return EMPTY;
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
