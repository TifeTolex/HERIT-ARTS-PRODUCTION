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

export async function api(path, options = {}){
  const headers = options.headers || {};
  const token = getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[api] Using token:', token.slice(0, 10) + '...'); 
  } else {
    console.warn('[api] No token found for request to', path); 
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    let text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text }; // fallback if server sends plain text
    }

    if (!res.ok) {
      console.error('[api] Request failed', res.status, data);
      throw new Error(`${res.status} ${res.statusText}: ${data.error || text}`);
    }

    return data;
  } catch (e) {
    console.error('[api] Network or server error:', e);
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

  if (!trialEndsAt) return;

  const expiry = new Date(trialEndsAt);
  const now = new Date();

  if (now > expiry && subStatus !== 'active') {
    showToast('Your trial has ended. Please subscribe to continue.', 'warning', 5000);
    setTimeout(() => { window.location.href = '/subscribe.html'; }, 2000);
  }
}
