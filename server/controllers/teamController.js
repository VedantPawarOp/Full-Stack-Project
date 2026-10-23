const Team = require('../models/Team');
const User = require('../models/User');
const Game = require('../models/Game');

// CREATE (Unit 4: MongoDB CRUD)
exports.createTeam = async (req, res) => {
  try {
    const { name, gameId, organization, country } = req.body;
    if (!name || !gameId || !country) return res.status(400).json({ error: 'name, gameId and country are required' });

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const team = await Team.create({ name, game: gameId, organization, country, createdBy: req.user._id });
    res.status(201).json({ team });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ - list, with simple filtering (used by the Search page too)
exports.listTeams = async (req, res) => {
  const { game, country, status } = req.query;
  const filter = {};
  if (game) filter.game = game;
  if (country) filter.country = new RegExp(country, 'i');
  if (status) filter.status = status;

  const teams = await Team.find(filter).populate('game', 'title genre').sort({ name: 1 });
  res.json({ teams });
};

exports.getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id).populate('game');
  if (!team) return res.status(404).json({ error: 'Team not found' });
  const roster = await User.find({ team: team._id }).select('fullName gamerTag isCaptain');
  res.json({ team, roster });
};

// UPDATE
exports.updateTeam = async (req, res) => {
  const { organization, country, status } = req.body;
  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { $set: { organization, country, status } },
    { new: true, runValidators: true }
  );
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ team });
};

// DELETE
exports.deleteTeam = async (req, res) => {
  const team = await Team.findByIdAndDelete(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  await User.updateMany({ team: team._id }, { $set: { team: null, isCaptain: false } });
  res.json({ message: 'Team deleted' });
};

// File upload (Unit 3: Upload Files) - team logo
exports.uploadLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { $set: { logoPath: `/uploads/${req.file.filename}` } },
    { new: true }
  );
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json({ team });
};

// Roster management: join / leave / set captain
exports.joinTeam = async (req, res) => {
  if (req.user.role !== 'PLAYER') return res.status(403).json({ error: 'Only players can join a team' });
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const rosterCount = await User.countDocuments({ team: team._id });
  const game = await Game.findById(team.game);
  if (rosterCount >= game.maxRosterSize) return res.status(400).json({ error: 'Roster is full' });

  req.user.team = team._id;
  await req.user.save();
  res.json({ message: `Joined ${team.name}` });
};

exports.setCaptain = async (req, res) => {
  const { playerId } = req.body;
  const player = await User.findOne({ _id: playerId, team: req.params.id, role: 'PLAYER' });
  if (!player) return res.status(404).json({ error: 'Player not found on this team' });

  // one captain per team: unset any existing captain first
  await User.updateMany({ team: req.params.id }, { $set: { isCaptain: false } });
  player.isCaptain = true;
  await player.save();
  res.json({ message: `${player.fullName} is now captain` });
};
