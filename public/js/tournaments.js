let myTeams = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/tournaments.html');
  const user = getUser();

  if (!['ORGANIZER', 'ADMIN'].includes(user.role)) {
    document.getElementById('createTournamentCard').classList.add('hidden');
  }

  await loadGamesIntoSelect();
  await loadTournaments();

  const form = document.getElementById('createTournamentForm');
  attachLiveValidation(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    try {
      await apiRequest('/tournaments', {
        method: 'POST',
        body: {
          name: sanitizeInput(form.name.value),
          gameId: form.gameId.value,
          maxTeams: Number(form.maxTeams.value),
          entryFee: Number(form.entryFee.value || 0),
          regOpen: form.regOpen.value,
          regClose: form.regClose.value,
          startDate: form.startDate.value,
          endDate: form.endDate.value
        }
      });
      showToast('Tournament created (status: DRAFT)');
      form.reset();
      await loadTournaments();
    } catch (err) { showToast(err.message, 'error'); }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('id')) showDetail(params.get('id'));
});

async function loadGamesIntoSelect() {
  const { games } = await apiRequest('/catalog/games');
  document.getElementById('tGame').innerHTML = games.map((g) => `<option value="${g._id}">${g.title}</option>`).join('');
}

async function loadTournaments() {
  try {
    const { tournaments } = await apiRequest('/tournaments');
    const rows = tournaments.map((t) => `
      <tr>
        <td>${t.name}</td>
        <td>${t.game ? t.game.title : ''}</td>
        <td><span class="badge ${badgeClass(t.status)}">${t.status}</span></td>
        <td>${t.registrations ? t.registrations.length : 0}/${t.maxTeams}</td>
        <td><a href="#" class="view-link" data-id="${t._id}">View</a></td>
      </tr>`).join('');
    document.getElementById('tournamentRows').innerHTML = rows || '<tr><td colspan="5">No tournaments yet.</td></tr>';
    document.querySelectorAll('.view-link').forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); showDetail(l.dataset.id); }));
  } catch (err) { showToast(err.message, 'error'); }
}

function badgeClass(status) {
  if (status === 'ONGOING') return 'ok';
  if (status === 'COMPLETED') return 'warn';
  if (status === 'CANCELLED') return 'danger';
  return '';
}

async function showDetail(id) {
  try {
    const { tournament } = await apiRequest(`/tournaments/${id}`);
    const user = getUser();
    const card = document.getElementById('detailCard');
    card.classList.remove('hidden');
    document.getElementById('detailName').textContent = tournament.name;
    document.getElementById('detailMeta').textContent =
      `${tournament.game.title} · ${tournament.status} · ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`;

    document.getElementById('registrationList').innerHTML = tournament.registrations.map(
      (r) => `<li>${r.team.name} ${r.seed ? `(seed ${r.seed})` : ''} - ${r.status}</li>`
    ).join('') || '<li>No teams registered yet.</li>';

    renderOrganizerControls(tournament, user);
    await renderRegisterTeamField(tournament, user);
    await renderBracket(tournament);
  } catch (err) { showToast(err.message, 'error'); }
}

function renderOrganizerControls(tournament, user) {
  const el = document.getElementById('organizerControls');
  if (!['ORGANIZER', 'ADMIN'].includes(user.role)) { el.innerHTML = ''; return; }

  const buttons = [];
  if (tournament.status === 'DRAFT') buttons.push(['Open registration', `/tournaments/${tournament._id}/open-registration`]);
  if (tournament.status === 'REGISTRATION_OPEN') buttons.push(['Close registration', `/tournaments/${tournament._id}/close-registration`]);
  if (tournament.status === 'REGISTRATION_CLOSED') buttons.push(['Start & generate bracket', `/tournaments/${tournament._id}/start`]);

  el.innerHTML = buttons.map(([label], i) => `<button type="button" data-i="${i}" class="secondary">${label}</button>`).join(' ');
  el.querySelectorAll('button').forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(buttons[i][1], { method: 'POST' });
        showToast(buttons[i][0] + ' done');
        showDetail(tournament._id);
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

async function renderRegisterTeamField(tournament, user) {
  const field = document.getElementById('registerTeamField');
  const canRegister = ['ORGANIZER', 'ADMIN'].includes(user.role) && tournament.status === 'REGISTRATION_OPEN';
  field.classList.toggle('hidden', !canRegister);
  if (!canRegister) return;

  const { teams } = await apiRequest(`/teams?game=${tournament.game._id}`);
  myTeams = teams;
  document.getElementById('registerTeamSelect').innerHTML = teams.map((t) => `<option value="${t._id}">${t.name}</option>`).join('');
  document.getElementById('registerTeamBtn').onclick = async () => {
    const teamId = document.getElementById('registerTeamSelect').value;
    try {
      await apiRequest(`/tournaments/${tournament._id}/register-team`, { method: 'POST', body: { teamId } });
      showToast('Team registered');
      showDetail(tournament._id);
    } catch (err) { showToast(err.message, 'error'); }
  };
}

async function renderBracket(tournament) {
  const view = document.getElementById('bracketView');
  try {
    const { matches } = await apiRequest(`/matches?tournament=${tournament._id}`);
    if (!matches.length) { view.innerHTML = '<p>Bracket not generated yet.</p>'; return; }

    const rounds = {};
    matches.forEach((m) => { (rounds[m.roundNo] = rounds[m.roundNo] || []).push(m); });

    view.innerHTML = Object.keys(rounds).sort((a, b) => a - b).map((roundNo) => `
      <div class="bracket-round">
        <strong>Round ${roundNo}</strong>
        ${rounds[roundNo].map((m) => `
          <div class="bracket-match">
            <div class="side ${m.winner && m.winner._id === (m.team1 && m.team1._id) ? 'win' : ''}">
              <span>${m.team1 ? m.team1.name : 'TBD'}</span><span>${m.team1Score ?? ''}</span>
            </div>
            <div class="side ${m.winner && m.winner._id === (m.team2 && m.team2._id) ? 'win' : ''}">
              <span>${m.team2 ? m.team2.name : (m.isBye ? 'BYE' : 'TBD')}</span><span>${m.team2Score ?? ''}</span>
            </div>
          </div>`).join('')}
      </div>`).join('');
  } catch (err) { view.innerHTML = '<p>Could not load bracket.</p>'; }
}
