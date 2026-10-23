// Renders the shared header/nav into any element with id="siteHeader",
// and highlights the active page. Keeps every HTML file's <header> tiny.
function renderNav(activePage) {
  const user = getUser();
  const host = document.getElementById('siteHeader');
  if (!host) return;

  const links = [
    { href: '/dashboard.html', label: 'Dashboard' },
    { href: '/teams.html', label: 'Teams' },
    { href: '/tournaments.html', label: 'Tournaments' },
    { href: '/matches.html', label: 'Matches' },
    { href: '/leaderboard.html', label: 'Leaderboard' },
    { href: '/search.html', label: 'Search' }
  ];
  if (user && user.role === 'ADMIN') links.push({ href: '/admin.html', label: 'Admin' });

  const linkHtml = links.map(
    (l) => `<li><a href="${l.href}" class="${activePage === l.href ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  host.innerHTML = `
    <div class="nav-inner">
      <div class="brand">🏆 Esports Tournament Manager</div>
      <nav class="main-nav" aria-label="Primary"><ul>${linkHtml}</ul></nav>
      <div id="userBadge">
        ${user ? `${user.fullName} (${user.role}) <button class="secondary" id="logoutBtn">Log out</button>` : ''}
      </div>
    </div>`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = '/index.html';
    });
  }
}
