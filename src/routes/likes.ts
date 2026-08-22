import { Router, Request, Response } from 'express';
import Like from '../models/Like';

const router = Router();

const VISITOR_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;

// GET /api/likes?visitorId=... - Current like count, plus whether this visitor has liked (if provided).
router.get('/', async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.query;
    const count = await Like.countDocuments();
    let liked = false;
    if (typeof visitorId === 'string' && VISITOR_ID_RE.test(visitorId)) {
      liked = (await Like.exists({ visitorId })) !== null;
    }
    return res.json({ count, liked });
  } catch (err: any) {
    console.error('Fetch likes error:', err);
    return res.status(500).json({ message: 'Failed to fetch like count.', error: err.message });
  }
});

// POST /api/likes/toggle - Adds or removes this visitor's like, returns the new state.
router.post('/toggle', async (req: Request, res: Response) => {
  const { visitorId } = req.body;
  if (typeof visitorId !== 'string' || !VISITOR_ID_RE.test(visitorId)) {
    return res.status(400).json({ message: 'A valid visitorId is required.' });
  }

  try {
    const existing = await Like.findOne({ visitorId });
    if (existing) {
      await existing.deleteOne();
    } else {
      // Unique index on visitorId makes a duplicate double-click a no-op 11000 error, not a double count.
      await Like.create({ visitorId }).catch((err: any) => {
        if (err?.code !== 11000) throw err;
      });
    }
    const count = await Like.countDocuments();
    return res.json({ liked: !existing, count });
  } catch (err: any) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ message: 'Failed to update like.', error: err.message });
  }
});

export default router;
