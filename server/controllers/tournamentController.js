const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');
const matchEvents = require('../utils/matchEvents');

exports.createTournament = async (req, res) => {
  try {
    const body = { ...req.body, organizer: req.user._id, status: 'DRAFT' };
    const tournament = await Tournament.create(body);
    res.status(201).json({ tournament });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listTournaments = async (req, res) => {
  const { status, game } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (game) filter.game = game;
  const tournaments = await Tournament.find(filter)
    .populate('game', 'title').populate('venue', 'name city').populate('organizer', 'fullName organizationName')
    .sort({ startDate: 1 });
  res.json({ tournaments });
};

exports.getTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('game').populate('venue').populate('organizer', 'fullName organizationName')
    .populate('registrations.team', 'name country');
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ tournament });
};

exports.openRegistration = async (req, res) => {
  const t = await Tournament.findByIdAndUpdate(req.params.id, { status: 'REGISTRATION_OPEN' }, { new: true });
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ tournament: t });
};

exports.registerTeam = async (req, res) => {
  const { teamId, seed } = req.body;
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  if (tournament.status !== 'REGISTRATION_OPEN') return res.status(400).json({ error: 'Registration is not open' });
  if (tournament.registrations.length >= tournament.maxTeams) return res.status(400).json({ error: 'Tournament is full' });

  const team = await Team.findById(teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  if (String(team.game) !== String(tournament.game)) return res.status(400).json({ error: 'Team plays a different game' });

  const already = tournament.registrations.some((r) => String(r.team) === String(teamId));
  if (already) return res.status(409).json({ error: 'Team already registered' });

  tournament.registrations.push({ team: teamId, seed: seed || null });
  await tournament.save();

  matchEvents.emit('team:registered', { tournamentId: tournament._id, teamId });
  res.status(201).json({ tournament });
};

exports.closeRegistration = async (req, res) => {
  const t = await Tournament.findByIdAndUpdate(req.params.id, { status: 'REGISTRATION_CLOSED' }, { new: true });
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ tournament: t });
};

// Generates a single-elimination bracket (simplified vs. the reference
// project's double-elimination BracketPlan.java, but demonstrates the
// same relational idea: matches with next-match pointers).
exports.startAndGenerateBracket = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  if (tournament.status !== 'REGISTRATION_CLOSED') {
    return res.status(400).json({ error: 'Close registration before starting the tournament' });
  }

  const teams = tournament.registrations
    .filter((r) => r.status === 'APPROVED')
    .sort((a, b) => (a.seed || 999) - (b.seed || 999))
    .map((r) => r.team);

  if (teams.length < 2) return res.status(400).json({ error: 'Need at least 2 registered teams' });

  // round up to the next power of two, padding with byes
  let bracketSize = 2;
  while (bracketSize < teams.length) bracketSize *= 2;
  const slots = [...teams];
  while (slots.length < bracketSize) slots.push(null); // null = bye

  await Match.deleteMany({ tournament: tournament._id }); // clean slate if re-generating

  // Build round 1 matches
  let matchNo = 1;
  let roundMatches = [];
  const scheduleBase = new Date(tournament.startDate);

  for (let i = 0; i < slots.length; i += 2) {
    const team1 = slots[i], team2 = slots[i + 1];
    const isBye = team1 === null || team2 === null;
    const scheduledAt = new Date(scheduleBase.getTime() + (matchNo - 1) * tournament.matchDurationMin * 60000);

    const match = await Match.create({
      tournament: tournament._id,
      matchNo: matchNo++,
      roundNo: 1,
      team1: team1 || team2, // if one side is a bye, the present team sits in team1
      team2: isBye ? null : team2,
      venue: tournament.venue,
      scheduledAt,
      status: isBye ? 'COMPLETED' : 'SCHEDULED',
      isBye,
      winner: isBye ? (team1 || team2) : null
    });
    roundMatches.push(match);
  }

  // Build subsequent rounds (empty TBD matches) and wire next-match pointers
  let round = 2;
  let prevRound = roundMatches;
  while (prevRound.length > 1) {
    const thisRound = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      const scheduledAt = new Date(scheduleBase.getTime() + (matchNo - 1) * tournament.matchDurationMin * 60000);
      const match = await Match.create({
        tournament: tournament._id,
        matchNo: matchNo++,
        roundNo: round,
        scheduledAt,
        status: 'SCHEDULED'
      });
      prevRound[i].nextMatch = match._id; prevRound[i].nextSlot = 1; await prevRound[i].save();
      if (prevRound[i + 1]) { prevRound[i + 1].nextMatch = match._id; prevRound[i + 1].nextSlot = 2; await prevRound[i + 1].save(); }
      thisRound.push(match);
    }
    prevRound = thisRound;
    round++;
  }

  // propagate any round-1 byes into round 2 automatically
  for (const m of roundMatches) {
    if (m.isBye && m.nextMatch) await advanceWinner(m);
  }

  tournament.status = 'ONGOING';
  await tournament.save();

  const allMatches = await Match.find({ tournament: tournament._id }).sort({ roundNo: 1, matchNo: 1 });
  res.json({ tournament, matches: allMatches });
};

async function advanceWinner(match) {
  if (!match.nextMatch || !match.winner) return;
  const next = await Match.findById(match.nextMatch);
  if (!next) return;
  if (match.nextSlot === 1) next.team1 = match.winner; else next.team2 = match.winner;
  await next.save();
}

module.exports.advanceWinner = advanceWinner;
