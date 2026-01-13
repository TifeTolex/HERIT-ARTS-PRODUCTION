// auth.js
import { api, saveToken, showToast, setLoading } from './utils.js';

// ================== SIGNUP ==================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signupForm.querySelector('button[type="submit"]');

    const data = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      businessName: document.getElementById('businessName')?.value.trim() || null,
      industry: document.getElementById('industry')?.value || null,
      role: document.getElementById('role')?.value || 'brand',
    };

    try {
      setLoading(btn, true);

      const { token, user } = await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      saveToken(token);
      localStorage.setItem('role', user.role);
      // if (user.trialEndsAt) localStorage.setItem('trialEndsAt', user.trialEndsAt);

      showToast('Signup successful!', 'success');

      const planIntent = document.getElementById('planIntent')?.value;
      const redirectTo =
        user.role === 'staff'
          ? '/staff.html'
          : planIntent === 'now'
          ? '/subscriptions.html'
          : '/dashboard.html';

      setTimeout(() => (window.location.href = redirectTo), 600);
      signupForm.reset();
    } catch (err) {
      setLoading(btn, false);
      document.getElementById('password').value = '';
      showToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ================== LOGIN ==================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type="submit"]');

    const data = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role: document.getElementById('role')?.value || null,
    };

    try {
      setLoading(btn, true);

      const { token, user } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      saveToken(token);
      localStorage.setItem('role', user.role);
      // if (user.trialEndsAt) localStorage.setItem('trialEndsAt', user.trialEndsAt);

      showToast('Login successful!', 'success');

      const redirectTo = user.role === 'staff' ? '/staff.html' : '/dashboard.html';
      setTimeout(() => (window.location.href = redirectTo), 600);
      loginForm.reset();
    } catch (err) {
      setLoading(btn, false);
      const passInput = document.getElementById('loginPassword') || document.getElementById('password');
      if (passInput) passInput.value = '';
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}

// ================== REQUEST PASSWORD RESET ==================
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = resetForm.querySelector('button[type="submit"]');
    const email = document.getElementById('rpEmail').value.trim();

    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    try {
      setLoading(btn, true);

      await api('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      showToast('If the email exists, a reset link has been sent.', 'success');
      resetForm.reset();
    } catch (err) {
      showToast(err.message || 'Request failed', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
}
