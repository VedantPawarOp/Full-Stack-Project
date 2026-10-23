document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/leaderboard.html');

  const { tournaments } = await apiRequest('/tournaments');
  const select = document.getElementById('standingsTournament');
  select.innerHTML = '<option value="">-- choose --</option>' + tournaments.map((t) => `<option value="${t._id}">${t.name}</option>`).join('');
  select.addEventListener('change', () => loadStandings(select.value));

  await loadPlayerStats();
});

async function loadStandings(tournamentId) {
  const body = document.getElementById('standingsRows');
  if (!tournamentId) { body.innerHTML = '<tr><td colspan="6">Select a tournament.</td></tr>'; return; }
  try {
    const { standings } = await apiRequest(`/leaderboard/tournament/${tournamentId}/standings`);
    body.innerHTML = standings.map((s, i) => `
      <tr><td>${i + 1}</td><td>${s.teamName}</td><td>${s.played}</td><td>${s.wins}</td><td>${s.losses}</td><td>${s.points}</td></tr>
    `).join('') || '<tr><td colspan="6">No completed matches yet.</td></tr>';
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadPlayerStats() {
  try {
    const { players } = await apiRequest('/leaderboard/players');
    document.getElementById('playerStatRows2').innerHTML = players.map((p, i) => `
      <tr>
        <td>${i + 1}</td><td>${p.gamerTag || p.fullName}</td>
        <td>${p.totalKills}</td><td>${p.totalDeaths}</td><td>${p.totalAssists}</td>
        <td>${p.kd}</td><td>${p.matchesPlayed}</td>
      </tr>`).join('') || '<tr><td colspan="7">No stats recorded yet.</td></tr>';
  } catch (err) { showToast(err.message, 'error'); }
}
