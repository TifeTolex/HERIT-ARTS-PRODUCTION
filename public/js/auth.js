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
      brandColor: document.getElementById('brandColor')?.value || null,
      typography: document.getElementById('typography')?.value || null,
      role: document.getElementById('role')?.value || 'brand' // 👈 allow brand/staff
    };

    try {
      const { token, role } = await api('/api/auth/signup', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });

      saveToken(token);
      localStorage.setItem('role', role || data.role);
      showToast("Signup successful!", "success");

      const planIntent = document.getElementById('planIntent')?.value;
      window.location.href = (role || data.role) === 'staff'
        ? '/staff.html'
        : (planIntent === 'now' ? '/subscriptions.html' : '/dashboard.html');
    } catch (e) {
      showToast(e.message || "Signup failed", "error");
    }
  });
}

// ================== LOGIN ==================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const chosenRole = document.getElementById('role')?.value;

    try {
      const { token, role } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: chosenRole })
      });

      const finalRole = role || chosenRole || 'brand';
      saveToken(token);
      localStorage.setItem('role', finalRole);

      showToast("Login successful!", "success");
      window.location.href = finalRole === 'staff' ? '/staff.html' : '/dashboard.html';
    } catch (err) {
      showToast(err.message || 'Invalid credentials', "error");
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

