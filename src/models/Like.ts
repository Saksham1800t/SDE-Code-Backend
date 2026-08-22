import mongoose, { Schema } from 'mongoose';

// One document per distinct visitor (a client-generated id persisted in localStorage) — the
// count is just this collection's document count, and toggling is an upsert/delete on visitorId
// rather than an increment/decrement counter, so it can never drift or double-count a retry.
const LikeSchema = new Schema({
  visitorId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Like', LikeSchema);
