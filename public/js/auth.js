// Powers index.html: login + register forms, role-dependent fields,
// client-side validation before hitting the API.
document.addEventListener('DOMContentLoaded', () => {
  if (getToken()) { window.location.href = '/dashboard.html'; return; }

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  attachLiveValidation(loginForm);
  attachLiveValidation(registerForm);

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(loginForm)) return;
    const email = sanitizeInput(loginForm.email.value);
    const password = loginForm.password.value;
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
      setSession(data.token, data.user);
      window.location.href = '/dashboard.html';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  const roleSelect = document.getElementById('regRole');
  const gamerTagField = document.getElementById('gamerTagField');
  const orgNameField = document.getElementById('orgNameField');
  function syncRoleFields() {
    gamerTagField.classList.toggle('hidden', roleSelect.value !== 'PLAYER');
    orgNameField.classList.toggle('hidden', roleSelect.value !== 'ORGANIZER');
    // clear any leftover error text for fields that just became hidden
    registerForm.querySelectorAll('[data-error-for]').forEach((el) => {
      const input = registerForm.querySelector(`[name="${el.dataset.errorFor}"]`);
      if (input && isFieldHidden(input)) el.textContent = '';
    });
  }
  roleSelect.addEventListener('change', syncRoleFields);
  syncRoleFields();

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(registerForm)) return;
    const payload = {
      fullName: sanitizeInput(registerForm.fullName.value),
      email: sanitizeInput(registerForm.email.value),
      password: registerForm.password.value,
      role: registerForm.role.value,
      gamerTag: sanitizeInput(registerForm.gamerTag.value || ''),
      organizationName: sanitizeInput(registerForm.organizationName.value || '')
    };
    try {
      const data = await apiRequest('/auth/register', { method: 'POST', body: payload });
      setSession(data.token, data.user);
      showToast('Account created!');
      window.location.href = '/dashboard.html';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
});
