import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import SyncProfile from '../models/SyncProfile';
import User from '../models/User';
import Theme from '../models/Theme';

const router = Router();

router.post('/push', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { settings, keybindings, extensions, workflows, projectRules, snippets } = req.body;

  try {
    let profile = await SyncProfile.findOne({ user: req.userId });

    if (profile) {
      profile.settings = settings || profile.settings;
      profile.keybindings = keybindings || profile.keybindings;
      profile.extensions = extensions || profile.extensions;
      profile.workflows = workflows || profile.workflows;
      profile.projectRules = projectRules || profile.projectRules;
      profile.snippets = snippets || profile.snippets;
      profile.updatedAt = new Date();
    } else {
      profile = new SyncProfile({
        user: req.userId,
        settings: settings || {},
        keybindings: keybindings || [],
        extensions: extensions || [],
        workflows: workflows || [],
        projectRules: projectRules || [],
        snippets: snippets || {}
      });
    }

    await profile.save();

    // Reads profile.extensions (post-fallback), not the raw request field, so a settings-only push doesn't wipe theme entitlements.
    const themesList = await Theme.find({ id: { $in: profile.extensions || [] } });
    const themeIds = themesList.map(t => t.id);
    await User.findByIdAndUpdate(req.userId, {
      $set: { themes: themeIds }
    });

    res.json({ message: 'Sync profile updated successfully.', updatedAt: profile.updatedAt });
  } catch (err: any) {
    console.error('Push sync error:', err);
    res.status(500).json({ message: 'Failed to push sync profile.', error: err.message });
  }
});

router.get('/pull', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await SyncProfile.findOne({ user: req.userId });
    if (!profile) {
      return res.status(404).json({ message: 'No sync profile found for this user.' });
    }
    return res.json(profile);
  } catch (err: any) {
    console.error('Pull sync error:', err);
    return res.status(500).json({ message: 'Failed to pull sync profile.', error: err.message });
  }
});

// Pending-changes diffs merge into their own map instead of going through /push, so neither sync requires the other's fields.
const MAX_PENDING_DIFF_SIZE = 500_000; // ~500KB — mirrors the client-side cap in store/sync.ts

router.post('/push-pending-changes', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { folderKey, diff } = req.body;
  if (!folderKey || typeof diff !== 'string') {
    return res.status(400).json({ message: 'folderKey and diff are required.' });
  }
  if (diff.length > MAX_PENDING_DIFF_SIZE) {
    return res.status(413).json({ message: 'Diff is too large to sync (over 500KB) — commit or stash your changes first.' });
  }

  try {
    let profile = await SyncProfile.findOne({ user: req.userId });
    if (!profile) {
      profile = new SyncProfile({ user: req.userId });
    }
    profile.pendingChanges.set(folderKey, { diff, updatedAt: new Date() });
    await profile.save();
    return res.json({ message: 'Pending changes synced.', updatedAt: new Date() });
  } catch (err: any) {
    console.error('Push pending changes error:', err);
    return res.status(500).json({ message: 'Failed to push pending changes.', error: err.message });
  }
});

router.post('/clear-pending-changes', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { folderKey } = req.body;
  if (!folderKey) {
    return res.status(400).json({ message: 'folderKey is required.' });
  }

  try {
    const profile = await SyncProfile.findOne({ user: req.userId });
    if (profile) {
      profile.pendingChanges.delete(folderKey);
      await profile.save();
    }
    return res.json({ message: 'Pending changes cleared.' });
  } catch (err: any) {
    console.error('Clear pending changes error:', err);
    return res.status(500).json({ message: 'Failed to clear pending changes.', error: err.message });
  }
});

export default router;
