/**
 * DevFlow Login Controller
 */

import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { isValidEmail, validateRequired } from '../utils/validators.js';
import { STORAGE_KEYS } from '../utils/helpers.js';
import { showToast } from '../utils/notifications.js';

export function initLoginPage() {
  const form = document.getElementById('login-form');
  const demoLoginBtn = document.getElementById('demo-login-btn');
  const errorAlert = document.getElementById('login-error-alert');

  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', () => {
      const demoUser = {
        id: 'demo-dev-id',
        email: 'developer@devflow.local',
        name: 'Alex Rivera',
        role: 'Senior Full-Stack Engineer'
      };
      localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(demoUser));
      showToast('Logged in with Demo Developer profile!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 400);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorAlert) errorAlert.style.display = 'none';

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return;
      }

      if (!password) {
        showError('Please enter your password.');
        return;
      }

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

      try {
        if (isSupabaseConfigured() && supabaseClient) {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          showToast('Welcome back to DevFlow!', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 500);
        } else {
          // Local demo sign-in
          const user = {
            id: 'local-user-' + Date.now(),
            email,
            name: email.split('@')[0],
            role: 'Full-Stack Developer'
          };
          localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(user));
          showToast('Logged in successfully (Demo Session)', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 500);
        }
      } catch (err) {
        showError(err.message || 'Failed to authenticate. Please check your credentials.');
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
