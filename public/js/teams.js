let currentGames = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/teams.html');
  const user = getUser();

  if (!['ORGANIZER', 'ADMIN'].includes(user.role)) {
    document.getElementById('createTeamCard').classList.add('hidden');
  }

  await loadGamesIntoSelect();
  await loadTeams();

  const form = document.getElementById('createTeamForm');
  attachLiveValidation(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    try {
      await apiRequest('/teams', {
        method: 'POST',
        body: {
          name: sanitizeInput(form.name.value),
          gameId: form.gameId.value,
          organization: sanitizeInput(form.organization.value || ''),
          country: sanitizeInput(form.country.value)
        }
      });
      showToast('Team created');
      form.reset();
      await loadTeams();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('teamFilter').addEventListener('input', (e) => loadTeams(e.target.value));
});

async function loadGamesIntoSelect() {
  const { games } = await apiRequest('/catalog/games');
  currentGames = games;
  const select = document.getElementById('teamGame');
  select.innerHTML = games.map((g) => `<option value="${g._id}">${g.title}</option>`).join('');
}

async function loadTeams(countryFilter) {
  try {
    const qs = countryFilter ? `?country=${encodeURIComponent(countryFilter)}` : '';
    const { teams } = await apiRequest('/teams' + qs);
    const rows = teams.map((t) => `
      <tr>
        <td>${t.name}</td>
        <td>${t.game ? t.game.title : ''}</td>
        <td>${t.country}</td>
        <td><span class="badge ok">${t.status}</span></td>
        <td><a href="#" data-team-id="${t._id}" class="view-team-link">View</a></td>
      </tr>`).join('');
    document.getElementById('teamRows').innerHTML = rows || '<tr><td colspan="5">No teams found.</td></tr>';

    document.querySelectorAll('.view-team-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showTeamDetail(link.dataset.teamId);
      });
    });
  } catch (err) { showToast(err.message, 'error'); }
}

async function showTeamDetail(teamId) {
  try {
    const { team, roster } = await apiRequest(`/teams/${teamId}`);
    document.getElementById('teamDetailCard').classList.remove('hidden');
    document.getElementById('teamDetailName').textContent = team.name;
    document.getElementById('teamDetailMeta').textContent = `${team.game ? team.game.title : ''} · ${team.country} · ${team.status}`;
    document.getElementById('teamRoster').innerHTML = roster.map(
      (p) => `<li>${p.fullName} (${p.gamerTag || 'no tag'})${p.isCaptain ? ' - Captain' : ''}</li>`
    ).join('') || '<li>No players yet</li>';

    const user = getUser();
    const joinBtn = document.getElementById('joinTeamBtn');
    joinBtn.classList.toggle('hidden', user.role !== 'PLAYER');
    joinBtn.onclick = async () => {
      try {
        await apiRequest(`/teams/${teamId}/join`, { method: 'POST' });
        showToast('Joined team');
        showTeamDetail(teamId);
      } catch (err) { showToast(err.message, 'error'); }
    };

    const captainControls = document.getElementById('captainControls');
    if (['ORGANIZER', 'ADMIN'].includes(user.role) && roster.length) {
      captainControls.innerHTML = `
        <div class="field" style="max-width:320px">
          <label for="captainSelect">Set captain</label>
          <select id="captainSelect">${roster.map((p) => `<option value="${p._id}">${p.fullName}</option>`).join('')}</select>
          <button type="button" id="setCaptainBtn" class="secondary">Set captain</button>
        </div>`;
      document.getElementById('setCaptainBtn').addEventListener('click', async () => {
        const playerId = document.getElementById('captainSelect').value;
        try {
          await apiRequest(`/teams/${teamId}/captain`, { method: 'POST', body: { playerId } });
          showToast('Captain updated');
          showTeamDetail(teamId);
        } catch (err) { showToast(err.message, 'error'); }
      });
    } else {
      captainControls.innerHTML = '';
    }
  } catch (err) { showToast(err.message, 'error'); }
}
