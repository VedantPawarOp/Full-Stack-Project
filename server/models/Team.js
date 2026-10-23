const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true, trim: true, maxlength: 60 },
  game:         { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  organization: { type: String, trim: true, maxlength: 80 },
  country:      { type: String, required: true, trim: true, maxlength: 50 },
  status:       { type: String, enum: ['ACTIVE', 'INACTIVE', 'DISBANDED'], default: 'ACTIVE' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdOn:    { type: Date, default: Date.now },
  logoPath:     { type: String, default: null } // set by the multer file-upload route
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
