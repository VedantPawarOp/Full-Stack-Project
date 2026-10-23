document.addEventListener('DOMContentLoaded', async () => {
  requireLogin();
  renderNav('/admin.html');
  const user = getUser();
  if (user.role !== 'ADMIN') {
    document.querySelector('main').innerHTML = '<h1>Admin</h1><p>You must be an administrator to view this page.</p>';
    return;
  }

  await loadUsers();
  await loadDevelopersIntoSelect();

  document.getElementById('devForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/catalog/developers', { method: 'POST', body: { name: devName.value, country: devCountry.value } });
      showToast('Developer added'); e.target.reset(); await loadDevelopersIntoSelect();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('gameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/catalog/games', {
        method: 'POST',
        body: {
          title: gameTitle.value, genre: gameGenre.value, developer: gameDev.value,
          playersPerTeam: Number(gamePPT.value), maxRosterSize: Number(gameRoster.value)
        }
      });
      showToast('Game added'); e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('venueForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/catalog/venues', {
        method: 'POST',
        body: { name: venueName.value, city: venueCity.value, country: venueCountry.value, capacity: Number(venueCapacity.value) || undefined }
      });
      showToast('Venue added'); e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
  });

  const collectionSelect = document.getElementById('collectionSelect');
  collectionSelect.addEventListener('change', () => loadCollection(collectionSelect.value));
  await loadCollection('users');
});

async function loadUsers() {
  try {
    const { users } = await apiRequest('/admin/users');
    document.getElementById('userRows').innerHTML = users.map((u) => `
      <tr>
        <td>${u.fullName}</td><td>${u.email}</td><td>${u.role}</td>
        <td><span class="badge ${u.isActive ? 'ok' : 'danger'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
        <td><button type="button" class="secondary toggle-btn" data-id="${u._id}">Toggle</button></td>
      </tr>`).join('');
    document.querySelectorAll('.toggle-btn').forEach((btn) => btn.addEventListener('click', async () => {
      try { await apiRequest(`/admin/users/${btn.dataset.id}/toggle-active`, { method: 'PATCH' }); await loadUsers(); }
      catch (err) { showToast(err.message, 'error'); }
    }));
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadDevelopersIntoSelect() {
  const { developers } = await apiRequest('/catalog/developers');
  document.getElementById('gameDev').innerHTML = developers.map((d) => `<option value="${d._id}">${d.name}</option>`).join('');
}

async function loadCollection(name) {
  try {
    const data = await apiRequest(`/admin/collections/${name}`);
    document.getElementById('collectionOutput').textContent = JSON.stringify(data.docs, null, 2);
  } catch (err) { showToast(err.message, 'error'); }
}
