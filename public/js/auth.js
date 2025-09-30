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
      businessName: document.getElementById('businessName')?.value.trim() || null,
      industry: document.getElementById('industry')?.value || null,
      role: document.getElementById('role')?.value || 'brand'
    };

    try {
      const { token, user } = await api('/api/auth/signup', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });

      saveToken(token);
      localStorage.setItem('role', user.role);
      if (user.trialEndsAt) {
        localStorage.setItem('trialEndsAt', user.trialEndsAt);
      }

      showToast("Signup successful!", "success");
      const planIntent = document.getElementById('planIntent')?.value;

      window.location.href = user.role === 'staff'
        ? '/staff.html'
        : (planIntent === 'now' ? '/subscriptions.html' : '/dashboard.html');

      signupForm.reset();
    } catch (e) {
      document.getElementById('password').value = '';
      showToast(e.message || "Signup failed", "error");
    }
  });
}

// ================== LOGIN ==================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value,
      role: document.getElementById('loginRole')?.value || null
    };

    try {
      const { token, user } = await api('/api/auth/login', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });

      saveToken(token);
      localStorage.setItem('role', user.role);
      if (user.trialEndsAt) {
        localStorage.setItem('trialEndsAt', user.trialEndsAt);
      }

      showToast("Login successful!", "success");

      window.location.href = user.role === 'staff'
        ? '/staff.html'
        : '/dashboard.html';

      loginForm.reset();
    } catch (e) {
      document.getElementById('loginPassword').value = '';
      showToast(e.message || "Login failed", "error");
    }
  });
}


// ================== REQUEST PASSWORD RESET ==================
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('rpEmail').value.trim();

    try {
      await api('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      showToast('If the email exists, a reset link has been sent.', "success");
      resetForm.reset();
    } catch (err) {
      showToast(err.message || 'Request failed', "error");
    }
  });
}
