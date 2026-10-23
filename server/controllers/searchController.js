// ===================================================================
// Search tab equivalent. Demonstrates SELECT ... WHERE ... LIKE / IN /
// comparison operators (Unit 4 CO3 style queries) expressed as Mongo
// query operators ($regex, $in, $gte/$lte) instead of SQL.
// ===================================================================
const User = require('../models/User');
const Team = require('../models/Team');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');

exports.search = async (req, res) => {
  const { type, q } = req.query;
  if (!type) return res.status(400).json({ error: 'type is required: players | teams | tournaments | matches' });
  const regex = q ? new RegExp(q, 'i') : null;

  if (type === 'players') {
    const filter = { role: 'PLAYER' };
    if (regex) filter.$or = [{ fullName: regex }, { gamerTag: regex }];
    const players = await User.find(filter).select('fullName gamerTag team isCaptain').populate('team', 'name');
    return res.json({ players });
  }

  if (type === 'teams') {
    const filter = {};
    if (regex) filter.$or = [{ name: regex }, { country: regex }];
    const teams = await Team.find(filter).populate('game', 'title');
    return res.json({ teams });
  }

  if (type === 'tournaments') {
    const filter = {};
    if (regex) filter.name = regex;
    const tournaments = await Tournament.find(filter).populate('game', 'title');
    return res.json({ tournaments });
  }

  if (type === 'matches') {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const matches = await Match.find(filter).populate('team1', 'name').populate('team2', 'name').limit(100);
    return res.json({ matches });
  }

  res.status(400).json({ error: 'Unknown type' });
};
