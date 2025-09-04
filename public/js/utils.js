// utils.js
const API_BASE = window.location.hostname.includes('localhost')
  ? '' // Local dev: use relative paths
  : ''; // Render deployment (same server serves API + frontend)

// If later you host frontend separately (like Vercel) and backend on Render,
// change the second '' to your backend URL, e.g.:
// : 'https://your-backend.onrender.com'

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

// backward compatibility for existing calls
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
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok){
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export function requireAuthOrRedirect(){
  if (!getToken()) { window.location.href = '/login.html'; }
}

export function logout(){ clearToken(); window.location.href = '/login.html'; }
