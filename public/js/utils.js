// utils.js
const API_BASE = window.location.hostname.includes('localhost')
  ? '' // Local dev: use relative paths
  : ''; // Render deployment (same server serves API + frontend)

export function $(selector, ctx = document){ return ctx.querySelector(selector); }
export function $all(selector, ctx = document){ return Array.from(ctx.querySelectorAll(selector)); }

export function setCurrentNav(href){
  const link = document.querySelector(`nav a[href="${href}"]`);
  if (link) link.setAttribute('aria-current','page');
}

// =====================
// TOAST SYSTEM
// =====================
export function showToast(message, type = 'info', timeout = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '.5rem'
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  Object.assign(toast.style, {
    padding: '.75rem 1rem',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: '500',
    boxShadow: '0 4px 10px rgba(0,0,0,.15)',
    opacity: '0',
    transform: 'translateY(-10px)',
    transition: 'all .3s ease'
  });

  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb',
    warning: '#d97706'
  };
  toast.style.background = colors[type] || colors.info;

  toast.textContent = message;
  container.appendChild(toast);

  // animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // auto remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, timeout);
}

// backward compatibility
export function toast(msg, type='info'){ showToast(msg, type); }

// =====================
// AUTH HELPERS
// =====================
export function saveToken(token){ localStorage.setItem('token', token); }
export function getToken(){ return localStorage.getItem('token'); }
export function clearToken(){ localStorage.removeItem('token'); }

// =====================
// API HELPER (with error toasts)
// =====================
export async function api(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const message = err.error || `Error ${res.status}: ${res.statusText}`;

      // 🔴 Show error toast automatically
      showToast(message, 'error');
      throw new Error(message);
    }

    const data = await res.json();

    // Optional: show success toast for POST/PUT/DELETE (not GET)
    if (['POST','PUT','DELETE'].includes((options.method || 'GET').toUpperCase())) {
      showToast('Action completed successfully', 'success');
    }

    return data;
  } catch (e) {
    showToast(e.message || 'Network error', 'error');
    throw e;
  }
}

export function requireAuthOrRedirect(){
  if (!getToken()) { window.location.href = '/login.html'; }
}

export function logout(){ clearToken(); window.location.href = '/login.html'; }

// =====================
// TRIAL CHECK
// =====================
export function checkTrial() {
  const trialEndsAt = localStorage.getItem('trialEndsAt');
  const subStatus = localStorage.getItem('subscriptionStatus');

  if (!trialEndsAt) return; // no trial info, skip

  const expiry = new Date(trialEndsAt);
  const now = new Date();

  if (now > expiry && subStatus !== 'active') {
    showToast('Your trial has ended. Please subscribe to continue.', 'warning', 5000);
    setTimeout(() => { window.location.href = '/subscribe.html'; }, 2000);
  }
  
}
// =====================
// LOADING SPINNER HELPER
// =====================
export function setLoading(button, isLoading, textWhenDone = null) {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <span class="spinner" style="
        border: 2px solid #fff;
        border-top: 2px solid transparent;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: inline-block;
        margin-right: 6px;
        animation: spin 0.6s linear infinite;
        vertical-align: middle;
      "></span> Processing...
    `;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || textWhenDone || 'Submit';
  }
}

// Add spin animation globally if not present
if (!document.querySelector('#spinner-style')) {
  const style = document.createElement('style');
  style.id = 'spinner-style';
  style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }`;
  document.head.appendChild(style);
}


// Add spin animation globally if not present
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

// =====================
// AUTO SPINNER FOR ALL FORMS
// =====================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form').forEach(form => {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    form.addEventListener('submit', () => {
      setLoading(submitBtn, true);
      // Button will reset when page reloads, or manually call setLoading(btn, false) in JS after async work
    });
  });
});
