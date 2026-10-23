// Reference-data CRUD for Game, Developer, Venue. Kept together since
// they're small and mostly ADMIN-managed lookup tables.
const Developer = require('../models/Developer');
const Game = require('../models/Game');
const Venue = require('../models/Venue');

exports.listDevelopers = async (req, res) => res.json({ developers: await Developer.find().sort({ name: 1 }) });
exports.createDeveloper = async (req, res) => {
  try { res.status(201).json({ developer: await Developer.create(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
};

exports.listGames = async (req, res) => res.json({ games: await Game.find().populate('developer', 'name').sort({ title: 1 }) });
exports.createGame = async (req, res) => {
  try { res.status(201).json({ game: await Game.create(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
};

exports.listVenues = async (req, res) => res.json({ venues: await Venue.find().sort({ city: 1 }) });
exports.createVenue = async (req, res) => {
  try { res.status(201).json({ venue: await Venue.create(req.body) }); }
  catch (err) { res.status(400).json({ error: err.message }); }
};
