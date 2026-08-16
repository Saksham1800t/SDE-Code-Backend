import mongoose, { Schema } from 'mongoose';

const SyncProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  settings: {
    type: Map,
    of: String,
    default: {}
  },
  snippets: {
    type: Map,
    of: String, // languageId -> raw personal snippet file content (verbatim JSONC text)
    default: {}
  },
  keybindings: {
    type: [Schema.Types.Mixed], // array of keybinding configurations
    default: []
  },
  extensions: {
    type: [String], // array of enabled extension IDs
    default: []
  },
  workflows: {
    type: [Schema.Types.Mixed], // array of workflows JSON
    default: []
  },
  projectRules: {
    type: [Schema.Types.Mixed], // array of rules JSON
    default: []
  },
  // Keyed by workspace folder path since a user can have in-progress work across multiple projects at once.
  pendingChanges: {
    type: Map,
    of: new Schema({ diff: String, updatedAt: Date }, { _id: false }),
    default: {}
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SyncProfile', SyncProfileSchema);
