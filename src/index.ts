// Must be the first import, or later modules may read process.env before dotenv populates it.
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import dns from 'dns';
import extensionRoutes from './routes/extensions';
import themeRoutes from './routes/themes';
import suggestionRoutes from './routes/suggestions';
import { seedDefaultThemes } from './db/themeSeeder';
import Extension from './models/Extension';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.warn('DNS server override failed, using default resolvers:', e);
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// Railway (like Heroku/Vercel) puts the app behind a reverse proxy — without this, req.ip
// resolves to the proxy's own address for every request, which would put every visitor in the
// same bucket for the suggestions route's per-IP rate limit.
app.set('trust proxy', 1);

// Middleware configuration
app.use(cors());
app.use(express.json());

// Routes registry
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/suggestions', suggestionRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Catches anything a route/middleware passes to next(err) instead of handling itself (e.g.
// multer's disk-storage destination callback) and any synchronous throw Express itself catches.
// Must be registered after every other app.use()/route — Express identifies error middleware
// by its 4-parameter signature and only reaches it once something calls next(err). Without this,
// such an error falls through to Express's own default handler, which sends a bare/minimal
// response instead of the JSON shape every route here already returns for its own errors.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled request error:', err);
  res.status(500).json({ message: 'Internal server error.', error: err.message });
});

// Database connection & Server Boot
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');

    // Self-heals stale indexes (e.g. an old unique:true on Extension.id) that Mongoose won't auto-drop.
    await Extension.syncIndexes();

    // Seed default themes
    await seedDefaultThemes();

    app.listen(PORT, () => {
      console.log(`SDE Code Sync Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
