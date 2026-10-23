const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  title:           { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  genre:           { type: String, required: true, trim: true, maxlength: 40 },
  playersPerTeam:  { type: Number, required: true, min: 1 },
  maxRosterSize:   { type: Number, required: true, min: 1 },
  developer:       { type: mongoose.Schema.Types.ObjectId, ref: 'Developer', required: true }
});

// mirrors the MySQL CHECK(max_roster_size >= players_per_team)
gameSchema.pre('validate', function (next) {
  if (this.maxRosterSize < this.playersPerTeam) {
    return next(new Error('maxRosterSize must be >= playersPerTeam'));
  }
  next();
});

module.exports = mongoose.model('Game', gameSchema);
