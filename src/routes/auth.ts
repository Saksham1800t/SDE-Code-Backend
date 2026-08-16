import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import SyncProfile from '../models/SyncProfile';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config/env';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email or username.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({ token: accessToken, refreshToken, username: user.username, email: user.email });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    user.refreshToken = refreshToken;
    await user.save();

    return res.json({ token: accessToken, refreshToken, username: user.username, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    const newAccessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired refresh token.' });
  }
});

router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Me query error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Deletes the User and their SyncProfile only — published Extension/Theme docs are left intact for installers.
router.delete('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    await SyncProfile.deleteOne({ user: req.userId });
    return res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
