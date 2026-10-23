// ===================================================================
// Client-side validation & sanitization (Unit 1: "Validation using HTML
// attributes" + Unit 3: "RegExp, Forms, DOM ... secure form validation
// and sanitization (preventing script injection)").
// This is a defense-in-depth layer: the server re-validates everything
// in authController.js / the other controllers regardless.
// ===================================================================

const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  gamerTag: /^[A-Za-z0-9_]{3,20}$/,
  name: /^[A-Za-z][A-Za-z .'-]{1,79}$/
};

// Strips characters commonly used for script-injection / HTML injection
// before the value is ever written into the DOM or sent to the server.
function sanitizeInput(value) {
  return String(value)
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function validateField(value, type) {
  const v = sanitizeInput(value);
  switch (type) {
    case 'email':
      return PATTERNS.email.test(v) ? null : 'Enter a valid email address';
    case 'password':
      return v.length >= 6 ? null : 'Password must be at least 6 characters';
    case 'gamerTag':
      return PATTERNS.gamerTag.test(v) ? null : 'Gamer tag: 3-20 letters, numbers or underscore';
    case 'name':
      return v.length >= 2 ? null : 'Please enter a name';
    case 'required':
      return v.length > 0 ? null : 'This field is required';
    default:
      return null;
  }
}

// A field wrapped in an ancestor carrying the "hidden" class (e.g. the
// role-conditional gamerTag / organizationName fields on the register
// form) is not currently applicable, so it must not block submission.
function isFieldHidden(input) {
  return Boolean(input.closest('.hidden'));
}

// Wires up live validation for any <input data-validate="email"> etc.
// inside the given form element; returns true if the whole form is valid.
function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[data-validate]').forEach((input) => {
    const errorEl = formEl.querySelector(`[data-error-for="${input.name}"]`);
    if (isFieldHidden(input)) {
      if (errorEl) errorEl.textContent = '';
      return; // skip validating fields that aren't currently shown/relevant
    }
    const rule = input.dataset.validate;
    const message = validateField(input.value, rule);
    if (message) valid = false;
    if (errorEl) errorEl.textContent = message || '';
  });
  return valid;
}

function attachLiveValidation(formEl) {
  formEl.querySelectorAll('[data-validate]').forEach((input) => {
    input.addEventListener('input', () => {
      const errorEl = formEl.querySelector(`[data-error-for="${input.name}"]`);
      if (isFieldHidden(input)) {
        if (errorEl) errorEl.textContent = '';
        return;
      }
      const rule = input.dataset.validate;
      const message = validateField(input.value, rule);
      if (errorEl) errorEl.textContent = message || '';
    });
  });
}
