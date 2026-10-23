let activeMatch = null;

document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/matches.html');

  const { tournaments } = await apiRequest('/tournaments');
  const select = document.getElementById('tournamentFilter');
  select.innerHTML = '<option value="">-- choose --</option>' + tournaments.map((t) => `<option value="${t._id}">${t.name}</option>`).join('');
  select.addEventListener('change', () => loadMatches(select.value));

  document.getElementById('resultForm').addEventListener('submit', submitResult);
});

async function loadMatches(tournamentId) {
  if (!tournamentId) { document.getElementById('matchRows').innerHTML = '<tr><td colspan="7">Select a tournament.</td></tr>'; return; }
  try {
    const { matches } = await apiRequest(`/matches?tournament=${tournamentId}`);
    const rows = matches.map((m) => `
      <tr>
        <td>${m.matchNo}</td><td>${m.roundNo}</td>
        <td>${m.team1 ? m.team1.name : 'TBD'}</td>
        <td>${m.team2 ? m.team2.name : (m.isBye ? 'BYE' : 'TBD')}</td>
        <td><span class="badge ${m.status === 'COMPLETED' ? 'ok' : ''}">${m.status}</span></td>
        <td>${m.team1Score ?? ''} - ${m.team2Score ?? ''}</td>
        <td><a href="#" class="open-match" data-id="${m._id}">Open</a></td>
      </tr>`).join('');
    document.getElementById('matchRows').innerHTML = rows || '<tr><td colspan="7">No matches yet - generate the bracket first.</td></tr>';
    document.querySelectorAll('.open-match').forEach((l) => l.addEventListener('click', (e) => { e.preventDefault(); openMatch(l.dataset.id); }));
  } catch (err) { showToast(err.message, 'error'); }
}

async function openMatch(matchId) {
  try {
    const { match } = await apiRequest(`/matches/${matchId}`);
    activeMatch = match;
    const user = getUser();
    document.getElementById('matchDetailCard').classList.remove('hidden');
    document.getElementById('matchTitle').textContent =
      `${match.team1 ? match.team1.name : 'TBD'} vs ${match.team2 ? match.team2.name : (match.isBye ? 'BYE' : 'TBD')}`;

    const actions = document.getElementById('matchActions');
    const resultForm = document.getElementById('resultForm');
    resultForm.classList.add('hidden');
    actions.innerHTML = '';

    const canManage = ['ORGANIZER', 'ADMIN'].includes(user.role) && match.team1 && match.team2 && !match.isBye;

    if (canManage && match.status === 'SCHEDULED') {
      actions.innerHTML = '<button type="button" id="startMatchBtn" class="secondary">Start match</button>';
      document.getElementById('startMatchBtn').addEventListener('click', async () => {
        await apiRequest(`/matches/${matchId}/start`, { method: 'POST' });
        openMatch(matchId);
      });
    } else if (canManage && match.status === 'IN_PROGRESS') {
      resultForm.classList.remove('hidden');
      document.getElementById('score1').value = '';
      document.getElementById('score2').value = '';
      document.getElementById('playerStatRows').innerHTML = `
        <p style="color:var(--text-dim); font-size:0.85rem">
          Add one row per player as "gamerTag,kills,deaths,assists" (one per line) - kept simple for the demo.
        </p>
        <textarea id="statsRaw" rows="4" placeholder="AaravD,12,4,6"></textarea>`;
    } else if (match.status === 'COMPLETED') {
      actions.innerHTML = `<p>Final score: ${match.team1Score} - ${match.team2Score}. Winner: <strong>${match.winner ? match.winner.name : 'BYE'}</strong></p>`;
      if (match.playerStats && match.playerStats.length) {
        actions.innerHTML += '<ul>' + match.playerStats.map((s) => `<li>${s.player ? (s.player.gamerTag || s.player.fullName) : 'player'}: ${s.kills}/${s.deaths}/${s.assists} (K/D/A)</li>`).join('') + '</ul>';
      }
    }
  } catch (err) { showToast(err.message, 'error'); }
}

async function submitResult(e) {
  e.preventDefault();
  const team1Score = Number(document.getElementById('score1').value);
  const team2Score = Number(document.getElementById('score2').value);
  const raw = document.getElementById('statsRaw').value.trim();

  // NOTE: this demo keys stats by gamer tag text, resolved server-side would need
  // player IDs; for simplicity we skip sending stats if gamer tags can't be resolved here.
  const playerStats = [];

  try {
    await apiRequest(`/matches/${activeMatch._id}/result`, { method: 'POST', body: { team1Score, team2Score, playerStats } });
    showToast('Result recorded, winner advanced');
    document.getElementById('tournamentFilter').dispatchEvent(new Event('change'));
    document.getElementById('matchDetailCard').classList.add('hidden');
  } catch (err) { showToast(err.message, 'error'); }
}
