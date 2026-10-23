document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/dashboard.html');

  try {
    const [{ teams }, { tournaments }, { matches }] = await Promise.all([
      apiRequest('/teams'),
      apiRequest('/tournaments'),
      apiRequest('/matches?status=COMPLETED')
    ]);

    document.getElementById('statTeams').textContent = teams.length;
    document.getElementById('statTournaments').textContent = tournaments.length;
    document.getElementById('statOngoing').textContent = tournaments.filter((t) => t.status === 'ONGOING').length;
    document.getElementById('statMatches').textContent = matches.length;

    const rows = tournaments.slice(0, 8).map((t) => `
      <tr>
        <td>${t.name}</td>
        <td>${t.game ? t.game.title : ''}</td>
        <td><span class="badge ${badgeClass(t.status)}">${t.status}</span></td>
        <td>${new Date(t.startDate).toLocaleDateString()}</td>
        <td><a href="/tournaments.html?id=${t._id}">View</a></td>
      </tr>`).join('');
    document.getElementById('tournamentRows').innerHTML = rows || '<tr><td colspan="5">No tournaments yet.</td></tr>';
  } catch (err) {
    showToast(err.message, 'error');
  }
});

function badgeClass(status) {
  if (status === 'ONGOING') return 'ok';
  if (status === 'COMPLETED') return 'warn';
  if (status === 'CANCELLED') return 'danger';
  return '';
}
