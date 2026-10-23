// ===================================================================
// MongoDB Aggregation (Unit 4: "Aggregation, Indexes").
// Equivalent of fn_team_points / fn_player_kd / the leaderboard view
// in the reference project, built as an aggregation pipeline instead
// of SQL functions + a view.
// ===================================================================
const mongoose = require('mongoose');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// Team standings for one tournament: win=3pts, loss=1pt (participation), bye excluded from played count
exports.teamStandings = async (req, res) => {
  const tournamentId = req.params.tournamentId;
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

  const pipeline = [
    { $match: { tournament: new mongoose.Types.ObjectId(tournamentId), status: 'COMPLETED', isBye: false } },
    {
      $project: {
        teams: [
          { team: '$team1', won: { $eq: ['$winner', '$team1'] } },
          { team: '$team2', won: { $eq: ['$winner', '$team2'] } }
        ]
      }
    },
    { $unwind: '$teams' },
    {
      $group: {
        _id: '$teams.team',
        played: { $sum: 1 },
        wins: { $sum: { $cond: ['$teams.won', 1, 0] } },
        losses: { $sum: { $cond: ['$teams.won', 0, 1] } }
      }
    },
    { $addFields: { points: { $add: [{ $multiply: ['$wins', 3] }, '$losses'] } } },
    { $sort: { points: -1, wins: -1 } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$team._id', teamName: '$team.name', played: 1, wins: 1, losses: 1, points: 1 } }
  ];

  const standings = await Match.aggregate(pipeline);
  res.json({ tournament: tournament.name, standings });
};

// Player K/D/A ranking across ALL matches (or filtered to one tournament)
exports.playerStats = async (req, res) => {
  const { tournamentId } = req.query;
  const matchFilter = { status: 'COMPLETED' };
  if (tournamentId) matchFilter.tournament = new mongoose.Types.ObjectId(tournamentId);

  const pipeline = [
    { $match: matchFilter },
    { $unwind: '$playerStats' },
    {
      $group: {
        _id: '$playerStats.player',
        totalKills: { $sum: '$playerStats.kills' },
        totalDeaths: { $sum: '$playerStats.deaths' },
        totalAssists: { $sum: '$playerStats.assists' },
        matchesPlayed: { $sum: 1 }
      }
    },
    {
      $addFields: {
        kd: { $round: [{ $divide: ['$totalKills', { $cond: [{ $eq: ['$totalDeaths', 0] }, 1, '$totalDeaths'] }] }, 2] }
      }
    },
    { $sort: { kd: -1, totalKills: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'player' } },
    { $unwind: '$player' },
    {
      $project: {
        _id: 0, playerId: '$player._id', fullName: '$player.fullName', gamerTag: '$player.gamerTag',
        totalKills: 1, totalDeaths: 1, totalAssists: 1, matchesPlayed: 1, kd: 1
      }
    }
  ];

  const players = await Match.aggregate(pipeline);
  res.json({ players });
};
