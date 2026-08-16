import mongoose, { Schema } from 'mongoose';

const ExtensionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  id: {
    type: String,
    required: true,
    // unique: true intentionally omitted — the compound {id,version} index below is the real constraint.
    trim: true
  },
  version: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  publisher: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  provides: {
    type: [String],
    default: []
  },
  dependsOn: {
    type: [String],
    default: []
  },
  categories: {
    type: [String],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  zipPath: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness of version per extension ID
ExtensionSchema.index({ id: 1, version: 1 }, { unique: true });

export default mongoose.model('Extension', ExtensionSchema);
