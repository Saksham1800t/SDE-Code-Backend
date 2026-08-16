import mongoose, { Schema } from 'mongoose';

const ThemeSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  colors: {
    type: Map,
    of: String,
    required: true
  },
  default: {
    type: Boolean,
    default: false
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Theme', ThemeSchema);
