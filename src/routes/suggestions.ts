import { Router, Request, Response } from 'express';
import Suggestion from '../models/Suggestion';

const router = Router();

// Minimal in-memory sliding-window limiter — this endpoint has no auth, so it's the only thing
// standing between it and a script flooding the database. Resets on server restart, which is
// fine at this traffic scale; not meant to survive a determined attacker, just casual spam.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const submissionLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_PER_WINDOW) {
    submissionLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return false;
}

// POST /api/suggestions - Saves a suggestion. Deliberately no GET: this data is never shown
// back to any client, only reviewed directly against the database.
router.post('/', async (req: Request, res: Response) => {
  const { message, email } = req.body;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ message: 'A suggestion message is required.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ message: 'Suggestion is too long (2000 characters max).' });
  }
  if (email !== undefined && (typeof email !== 'string' || email.length > 200)) {
    return res.status(400).json({ message: 'Invalid email.' });
  }

  const ip = req.ip || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ message: 'Too many suggestions submitted — try again later.' });
  }

  try {
    await Suggestion.create({ message: message.trim(), email: email?.trim() || undefined });
    return res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('Save suggestion error:', err);
    return res.status(500).json({ message: 'Failed to save suggestion.', error: err.message });
  }
});

export default router;
