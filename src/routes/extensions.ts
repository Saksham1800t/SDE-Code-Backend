import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Extension from '../models/Extension';
import Theme from '../models/Theme';
import User from '../models/User';

const router = Router();

// Escapes regex metacharacters so search input can't trigger catastrophic-backtracking ReDoS via new RegExp().
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/extensions');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

router.get('/', async (req, res) => {
  const { query, provides, categories, tags } = req.query;

  try {
    const filter: any = { isPublic: true };

    if (query) {
      const regex = new RegExp(escapeRegExp(String(query)), 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { id: regex },
        { publisher: regex }
      ];
    }

    if (provides) {
      filter.provides = { $in: String(provides).split(',') };
    }

    if (categories) {
      filter.categories = { $in: String(categories).split(',') };
    }

    if (tags) {
      filter.tags = { $in: String(tags).split(',') };
    }

    const list = await Extension.find(filter)
      .select('-zipPath')
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err: any) {
    console.error('List extensions error:', err);
    res.status(500).json({ message: 'Failed to query extensions.', error: err.message });
  }
});

router.post('/publish', authenticateToken, upload.single('bundle'), async (req: AuthRequest, res: Response) => {
  // publisher is deliberately not destructured from req.body — it must come from the authenticated user, not the client.
  const { id, name, version, description, provides, dependsOn, isPublic, templateConfig, categories, tags } = req.body;

  if (!id || !name || !version) {
    // Clean up the bundle multer already wrote to disk, or a malformed retried request leaves orphaned files forever.
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Extension id, name, and version are required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Extension bundle zip file is required.' });
  }

  try {
    const author = await User.findById(req.userId).select('username');
    if (!author) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ message: 'Invalid session.' });
    }
    const publisher = author.username;

    const existing = await Extension.findOne({ id, version });
    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: `Version ${version} of extension "${id}" is already published.` });
    }

    // Parse arrays
    const parsedProvides = typeof provides === 'string' ? JSON.parse(provides) : (provides || []);
    const parsedDepends = typeof dependsOn === 'string' ? JSON.parse(dependsOn) : (dependsOn || []);
    const parsedTemplateConfig = typeof templateConfig === 'string' ? JSON.parse(templateConfig) : (templateConfig || {});
    const parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : (categories || []);
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);

    const extension = new Extension({
      id,
      name,
      version,
      description: description || '',
      publisher,
      isPublic: isPublic !== 'false',
      provides: parsedProvides,
      dependsOn: parsedDepends,
      categories: parsedCategories,
      tags: parsedTags,
      zipPath: req.file.path,
      size: req.file.size,
      author: req.userId
    });

    await extension.save();

    // Save to Theme collection if this extension is a theme
    if (parsedTemplateConfig.templateType === 'theme' && parsedTemplateConfig.themeColors) {
      const colors = parsedTemplateConfig.themeColors;
      const formattedColors = {
        '--bg-primary': colors.bgPrimary,
        '--bg-secondary': colors.bgSecondary,
        '--text-primary': colors.textPrimary,
        '--text-secondary': colors.textSecondary,
        '--accent-cyan': colors.accentCyan,
        '--accent-cyan-glow': colors.accentGlow,
        '--border-color': colors.borderColor
      };

      await Theme.findOneAndUpdate(
        { id },
        {
          id,
          name: name,
          colors: formattedColors,
          default: false,
          author: req.userId
        },
        { upsert: true, new: true }
      );
    }

    return res.status(201).json({
      message: 'Extension published successfully.',
      extension: {
        id: extension.id,
        name: extension.name,
        version: extension.version,
        publisher: extension.publisher
      }
    });
  } catch (err: any) {
    console.error('Publish extension error:', err);
    // clean up file on DB save failure
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: 'Failed to publish extension.', error: err.message });
  }
});

router.get('/download/:id/:version', async (req, res) => {
  const { id, version } = req.params;

  try {
    // isPublic: true is required here — this route has no auth, so it must not let private/unlisted bundles be downloaded.
    const ext = await Extension.findOne({ id, version, isPublic: true });
    if (!ext) {
      return res.status(404).json({ message: 'Requested extension version not found.' });
    }

    if (!fs.existsSync(ext.zipPath)) {
      return res.status(404).json({ message: 'Extension package file missing from storage.' });
    }

    return res.download(ext.zipPath, `${ext.id}-${ext.version}.zip`);
  } catch (err: any) {
    console.error('Download extension error:', err);
    res.status(500).json({ message: 'Failed to download extension.', error: err.message });
  }
});

export default router;
