const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const { advanceWinner } = require('./tournamentController');
const matchEvents = require('../utils/matchEvents');

exports.listMatches = async (req, res) => {
  const { tournament, status } = req.query;
  const filter = {};
  if (tournament) filter.tournament = tournament;
  if (status) filter.status = status;
  const matches = await Match.find(filter)
    .populate('team1', 'name').populate('team2', 'name').populate('winner', 'name').populate('venue', 'name city')
    .sort({ roundNo: 1, matchNo: 1 });
  res.json({ matches });
};

exports.getMatch = async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('team1', 'name').populate('team2', 'name').populate('winner', 'name')
    .populate('playerStats.player', 'fullName gamerTag');
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json({ match });
};

exports.startMatch = async (req, res) => {
  const match = await Match.findByIdAndUpdate(req.params.id, { status: 'IN_PROGRESS' }, { new: true });
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json({ match });
};

// Record final score + per-player K/D/A, decide the winner, and auto-advance
// them into the next bracket slot (chk_m_winner_score / trg status-flow logic,
// reimplemented here as plain JS validation instead of SQL CHECK/triggers).
exports.recordResult = async (req, res) => {
  const { team1Score, team2Score, playerStats } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (!match.team1 || !match.team2) return res.status(400).json({ error: 'Both teams must be set (TBD match)' });
  if (team1Score === team2Score) return res.status(400).json({ error: 'Draws are not supported - this is a knockout bracket' });

  match.team1Score = team1Score;
  match.team2Score = team2Score;
  match.winner = team1Score > team2Score ? match.team1 : match.team2;
  match.status = 'COMPLETED';
  match.playerStats = Array.isArray(playerStats) ? playerStats : [];
  await match.save();

  await advanceWinner(match);

  const tournament = await Tournament.findById(match.tournament);
  matchEvents.emit('match:completed', { tournamentId: tournament._id, matchId: match._id, winnerId: match.winner });

  // if this was the last match (no nextMatch) the tournament is done
  const remaining = await Match.countDocuments({ tournament: match.tournament, status: { $ne: 'COMPLETED' } });
  if (remaining === 0 && tournament.status === 'ONGOING') {
    tournament.status = 'COMPLETED';
    await tournament.save();
  }

  res.json({ match });
};
