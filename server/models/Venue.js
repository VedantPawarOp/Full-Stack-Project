const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 80 },
  city:     { type: String, required: true, trim: true, maxlength: 50 },
  country:  { type: String, required: true, trim: true, maxlength: 50 },
  capacity: { type: Number, min: 1 }
});

venueSchema.index({ name: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('Venue', venueSchema);
