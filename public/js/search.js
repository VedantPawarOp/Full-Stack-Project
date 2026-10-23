document.addEventListener('DOMContentLoaded', () => {
  requireLogin();
  renderNav('/search.html');
  document.getElementById('searchForm').addEventListener('submit', runSearch);
});

async function runSearch(e) {
  e.preventDefault();
  const type = document.getElementById('searchType').value;
  const q = document.getElementById('searchQuery').value.trim();
  try {
    const data = await apiRequest(`/search?type=${type}&q=${encodeURIComponent(q)}`);
    renderResults(type, data[type] || []);
  } catch (err) { showToast(err.message, 'error'); }
}

function renderResults(type, items) {
  const head = document.getElementById('resultsHead');
  const body = document.getElementById('resultsBody');

  if (type === 'players') {
    head.innerHTML = '<tr><th>Name</th><th>Gamer tag</th><th>Team</th></tr>';
    body.innerHTML = items.map((p) => `<tr><td>${p.fullName}</td><td>${p.gamerTag || ''}</td><td>${p.team ? p.team.name : '-'}</td></tr>`).join('');
  } else if (type === 'teams') {
    head.innerHTML = '<tr><th>Name</th><th>Game</th><th>Country</th></tr>';
    body.innerHTML = items.map((t) => `<tr><td>${t.name}</td><td>${t.game ? t.game.title : ''}</td><td>${t.country}</td></tr>`).join('');
  } else if (type === 'tournaments') {
    head.innerHTML = '<tr><th>Name</th><th>Game</th><th>Status</th></tr>';
    body.innerHTML = items.map((t) => `<tr><td>${t.name}</td><td>${t.game ? t.game.title : ''}</td><td>${t.status}</td></tr>`).join('');
  } else {
    head.innerHTML = '<tr><th>Team 1</th><th>Team 2</th><th>Status</th></tr>';
    body.innerHTML = items.map((m) => `<tr><td>${m.team1 ? m.team1.name : 'TBD'}</td><td>${m.team2 ? m.team2.name : 'TBD'}</td><td>${m.status}</td></tr>`).join('');
  }
  if (!items.length) body.innerHTML = '<tr><td>No results.</td></tr>';
}
