// auth.js
import { api, saveToken, showToast } from './utils.js';

// ================== SIGNUP ==================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      businessName: document.getElementById('businessName').value.trim(),
      industry: document.getElementById('industry').value,
      brandColor: document.getElementById('brandColor')?.value || null,
      typography: document.getElementById('typography')?.value || null,
    };
    try {
      const { token } = await api('/api/auth/signup', { method:'POST', body: JSON.stringify(data) });
      saveToken(token);
      await api('/api/brands/onboard', { method:'POST', body: JSON.stringify(data) });
      const planIntent = document.getElementById('planIntent')?.value;
      showToast("Signup successful!", "success");
      window.location.href = planIntent === 'now' ? '/subscriptions.html' : '/dashboard.html';
    } catch (e) {
      showToast(e.message, "error");
    }
  });
}

// ================== LOGIN ==================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // ✅ stop reload

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role')?.value || 'brand';

    try {
      const { token } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      });
      saveToken(token);
      localStorage.setItem('role', role);
      showToast("Login successful!", "success");
      window.location.href = role === 'staff' ? '/staff.html' : '/dashboard.html';
    } catch (err) {
      showToast(err.message || 'Login failed', "error");
    }
  });
}

// ================== RESET PASSWORD ==================
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('rpEmail').value.trim();
    const otp = document.getElementById('rpCode').value.trim();
    const newPassword = document.getElementById('rpNew').value;

    try {
      await api('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
      showToast('Password reset successful. You can now log in.', "success");
    } catch (err) {
      showToast(err.message || 'Reset failed', "error");
    }
  });
}
