const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');

const COLLECTIONS = { users: User, teams: Team, tournaments: Tournament, matches: Match };

exports.listUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
};

exports.toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `${user.fullName} is now ${user.isActive ? 'active' : 'inactive'}` });
};

// raw table/collection browser, like the Admin tab in the reference app
exports.browseCollection = async (req, res) => {
  const { name } = req.params;
  const Model = COLLECTIONS[name];
  if (!Model) return res.status(404).json({ error: `Unknown collection: ${name}` });
  const docs = await Model.find().limit(100).lean();
  res.json({ collection: name, count: docs.length, docs });
};
