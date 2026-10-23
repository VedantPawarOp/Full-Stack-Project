// Small fetch wrapper shared by every page. Keeps the auth token in
// localStorage and attaches it automatically (Unit 3: DOM + fetch, used
// instead of XMLHttpRequest).
const API_BASE = '/api';

function getToken() { return localStorage.getItem('esports_token'); }
function getUser() {
  const raw = localStorage.getItem('esports_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('esports_token', token);
  localStorage.setItem('esports_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('esports_token');
  localStorage.removeItem('esports_user');
}

async function apiRequest(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined
  });

  let data = {};
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) { alert(message); return; }
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function requireLogin() {
  if (!getToken()) {
    window.location.href = '/index.html';
  }
}
