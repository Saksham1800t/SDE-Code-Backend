// Must be the first import, or later modules may read process.env before dotenv populates it.
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import dns from 'dns';
import extensionRoutes from './routes/extensions';
import themeRoutes from './routes/themes';
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


// Middleware configuration
app.use(cors());
app.use(express.json());

// Routes registry
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/themes', themeRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
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
