import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import Theme from '../models/Theme';
import User from '../models/User';
import { JWT_SECRET } from '../config/env';

const router = Router();

// GET /api/themes - Fetch themes visible to the user (default themes + user enabled themes)
router.get('/', async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let userId: string | undefined = undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
    } catch (e) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
  }

  try {
    let allowedThemeIds: string[] = [];
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.themes) {
        allowedThemeIds = user.themes;
      }
    }

    // Find themes that are either marked as default OR exist in the user's enabled themes list
    const filter: any = {
      $or: [
        { default: true },
        { id: { $in: allowedThemeIds } }
      ]
    };

    const themes = await Theme.find(filter);
    
    // Format the response for the frontend config list
    const formatted = themes.map(t => ({
      id: t.id,
      name: t.id,
      label: t.name,
      bgPrimary: t.colors.get('--bg-primary') || '#0d1117',
      bgSecondary: t.colors.get('--bg-secondary') || '#161b22',
      bgTertiary: t.colors.get('--bg-tertiary') || '#21262d',
      borderColor: t.colors.get('--border-color') || '#30363d',
      accentColor: t.colors.get('--accent-cyan') || '#58a6ff',
      accentSecondary: t.colors.get('--accent-cyan-glow') || 'rgba(88, 166, 255, 0.25)',
      textPrimary: t.colors.get('--text-primary') || '#c9d1d9',
      textSecondary: t.colors.get('--text-secondary') || '#8b949e',
      textMuted: t.colors.get('--text-muted') || '#484f58',
    }));

    return res.json(formatted);
  } catch (err: any) {
    console.error('Fetch themes error:', err);
    return res.status(500).json({ message: 'Failed to fetch themes.', error: err.message });
  }
});

export default router;
