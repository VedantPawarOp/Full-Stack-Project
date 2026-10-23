const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name:              { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  game:              { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  organizer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue:             { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null }, // null = online
  regOpen:           { type: Date, required: true },
  regClose:          { type: Date, required: true },
  startDate:         { type: Date, required: true },
  endDate:           { type: Date, required: true },
  maxTeams:          { type: Number, required: true, min: 4, max: 32 },
  entryFee:          { type: Number, default: 0, min: 0 },
  matchDurationMin:  { type: Number, default: 60, min: 1 },
  status: {
    type: String,
    enum: ['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  // embedded registrations: Team <-> Tournament (M:N) with attributes, the MongoDB way
  registrations: [{
    team:         { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    registeredOn: { type: Date, default: Date.now },
    seed:         { type: Number, default: null },
    status:       { type: String, enum: ['APPROVED', 'REJECTED', 'WITHDRAWN'], default: 'APPROVED' },
    feePaid:      { type: Boolean, default: false }
  }],
  prizes: [{
    finishPosition: { type: Number, min: 1, max: 8 },
    prizeAmount:    { type: Number, min: 0 },
    prizeDetails:   String,
    team:           { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null }
  }]
}, { timestamps: true });

tournamentSchema.pre('validate', function (next) {
  if (!(this.regOpen <= this.regClose && this.regClose <= this.startDate && this.startDate <= this.endDate)) {
    return next(new Error('Dates must satisfy regOpen <= regClose <= startDate <= endDate'));
  }
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);
