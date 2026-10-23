// ===================================================================
// app_user equivalent. One collection holds every role; role-specific
// fields are optional sub-fields instead of separate tables, which is
// the natural MongoDB (document) way to model what was 4 tables in SQL.
// ===================================================================
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
  },
  password: { type: String, required: true, minlength: 6 }, // stored as a bcrypt hash
  role: {
    type: String,
    required: true,
    enum: ['ADMIN', 'ORGANIZER', 'PLAYER', 'VIEWER']
  },
  phone:   { type: String, trim: true, maxlength: 20 },
  country: { type: String, trim: true, maxlength: 50 },
  isActive: { type: Boolean, default: true },

  // ---- role-specific fields (only the ones matching `role` are used) ----
  gamerTag:   { type: String, trim: true, maxlength: 40 }, // PLAYER
  birthDate:  { type: Date },                               // PLAYER
  team:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null }, // PLAYER
  isCaptain:  { type: Boolean, default: false },             // PLAYER

  organizationName: { type: String, trim: true, maxlength: 100 }, // ORGANIZER

  favouriteGame: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', default: null } // VIEWER
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

// gamer_tag only needs to be unique among players that actually set one
userSchema.index({ gamerTag: 1 }, { unique: true, partialFilterExpression: { gamerTag: { $type: 'string' } } });

module.exports = mongoose.model('User', userSchema);
