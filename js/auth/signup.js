/**
 * DevFlow Registration Controller
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { isValidEmail, validatePassword, validateRequired } from '../utils/validators.js';
import { STORAGE_KEYS } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

export function initSignupPage() {
  const form = document.getElementById('signup-form');
  const errorAlert = document.getElementById('signup-error-alert');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role')?.value || 'Full-Stack Developer';
      const submitBtn = form.querySelector('button[type="submit"]');

      const nameCheck = validateRequired(fullName, 'Full name');
      if (!nameCheck.isValid) {
        showError(nameCheck.message);
        return;
      }

      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }

      const passCheck = validatePassword(password);
      if (!passCheck.isValid) {
        showError(passCheck.message);
        return;
      }

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';

      try {
        if (isSupabaseConfigured() && supabaseClient) {
          const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: role
              }
            }
          });

          if (error) throw error;

          showToast('Account created successfully! Check your inbox or proceed to login.', 'success', 5000);
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1000);
        } else {
          // Local demo sign-up
          const user = {
            id: 'local-user-' + Date.now(),
            email,
            name: fullName,
            role
          };
          localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(user));
          showToast('Account initialized! Welcome to DevFlow.', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        }
      } catch (err) {
        showError(err.message || 'Registration failed. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    } else {
      showToast(msg, 'error');
    }
  }
}
