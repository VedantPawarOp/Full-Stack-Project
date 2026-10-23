const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema({
  name:    { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  country: { type: String, trim: true, maxlength: 50 },
  website: { type: String, trim: true, maxlength: 120 }
});

module.exports = mongoose.model('Developer', developerSchema);
