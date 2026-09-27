/**
 * DevFlow Input Validators
 */

export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long.'
    };
  }
  return { isValid: true };
}

export function validateRequired(value, fieldName = 'Field') {
  if (!value || String(value).trim() === '') {
    return {
      isValid: false,
      message: `${fieldName} is required.`
    };
  }
  return { isValid: true };
}
