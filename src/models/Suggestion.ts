import mongoose, { Schema } from 'mongoose';

// Write-only from the product's perspective — no route ever reads these back out to a client.
// Reviewed directly against the database (e.g. via Compass/Atlas), not through the app itself.
const SuggestionSchema = new Schema({
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  email: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Suggestion', SuggestionSchema);
