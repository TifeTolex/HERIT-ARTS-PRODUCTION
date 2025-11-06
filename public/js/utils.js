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
// =====================
// UNIVERSAL TOAST HANDLER
// Prevents duplicate messages
// =====================
export function showToast(message, type = "info") {
  // Reuse or create toast container
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  // 🚫 Prevent duplicate toasts with same text showing at once
  const existingToast = container.querySelector(`.toast[data-msg="${message}"]`);
  if (existingToast) {
    return; // skip duplicate
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.dataset.msg = message;
  toast.innerHTML = `
    <div style="
      background: ${type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#333"};
      color: white;
      padding: 12px 18px;
      border-radius: 6px;
      margin-top: 8px;
      font-size: 0.9rem;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s, transform 0.3s;
    ">
      ${message}
    </div>
  `;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.firstElementChild.style.opacity = "1";
    toast.firstElementChild.style.transform = "translateY(0)";
  }, 20);

  // Auto-remove after 3s
  setTimeout(() => {
    toast.firstElementChild.style.opacity = "0";
    toast.firstElementChild.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

    let data;
try {
  data = await res.json();
} catch {
  data = {};
}


   // ✅ Only show success toast if not manually handled
if (
  !path.includes('/login') &&
  !path.includes('/signup') &&
  ['POST', 'PUT', 'DELETE'].includes((options.method || 'GET').toUpperCase())
) {
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
// LOADING SPINNER HELPER (with auto-reset)
// =====================
export function setLoading(button, isLoading, textWhenDone = null) {
  if (!button) return;

  // --- Apply loading state ---
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

    // ✅ Automatically revert spinner if page unloads (redirect, reload, etc.)
    const unloadHandler = () => {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || textWhenDone || 'Submit';
    };

    // Save handler ref for cleanup
    button._unloadHandler = unloadHandler;

    window.addEventListener('beforeunload', unloadHandler);
    window.addEventListener('pagehide', unloadHandler);
  }

  // --- Reset to default ---
  else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || textWhenDone || 'Submit';

    // Remove event listeners if present
    if (button._unloadHandler) {
      window.removeEventListener('beforeunload', button._unloadHandler);
      window.removeEventListener('pagehide', button._unloadHandler);
      delete button._unloadHandler;
    }
  }
}

      // Button will reset when page reloads, or manually call setLoading(btn, false) in JS after async work
  
