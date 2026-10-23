// ===================================================================
// `matches` equivalent (named Match here; no reserved-word clash in Mongo).
// Bracket pointers (nextMatch/nextSlot) mirror the SQL self-referencing FKs
// and let the server auto-advance winners through a single-elimination bracket.
// ===================================================================
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament:  { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  matchNo:     { type: Number, required: true },
  roundNo:     { type: Number, required: true, min: 1 },
  team1:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  team2:       { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  venue:       { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },
  scheduledAt: { type: Date, required: true },
  status:      { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  isBye:       { type: Boolean, default: false },
  team1Score:  { type: Number, default: null, min: 0 },
  team2Score:  { type: Number, default: null, min: 0 },
  winner:      { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },

  // bracket advancement pointers
  nextMatch:   { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
  nextSlot:    { type: Number, enum: [1, 2, null], default: null },

  // embedded per-player stat lines for this match (K/D/A)
  playerStats: [{
    player:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kills:   { type: Number, default: 0, min: 0 },
    deaths:  { type: Number, default: 0, min: 0 },
    assists: { type: Number, default: 0, min: 0 }
  }]
}, { timestamps: true });

matchSchema.index({ tournament: 1, matchNo: 1 }, { unique: true });
matchSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Match', matchSchema);
