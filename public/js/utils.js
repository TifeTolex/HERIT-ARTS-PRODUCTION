// =====================
// ENV CONFIG
// =====================
const API_BASE = window.location.hostname.includes("localhost")
  ? "" // local dev
  : ""; // render deployment

// =====================
// SHORT SELECTORS
// =====================
export function $(selector, ctx = document) {
  return ctx.querySelector(selector);
}
export function $all(selector, ctx = document) {
  return Array.from(ctx.querySelectorAll(selector));
}

// =====================
// NAV ACTIVE + TOGGLE HANDLER
// =====================
export function setCurrentNav(href) {
  const link = document.querySelector(`nav a[href="${href}"]`);
  if (link) link.setAttribute("aria-current", "page");
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav");
  const menuToggle = document.querySelector(".menu-toggle");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (nav?.classList.contains("open") && !nav.contains(e.target) && !menuToggle.contains(e.target)) {
      nav.classList.remove("open");
    }
  });

  // Close nav when clicking any link
  document.querySelectorAll("nav a").forEach((link) =>
    link.addEventListener("click", () => nav.classList.remove("open"))
  );
});

// =====================
// TOAST HANDLER
// =====================
export function showToast(message, type = "info") {
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

  // prevent duplicates
  if (container.querySelector(`.toast[data-msg="${message}"]`)) return;

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

  setTimeout(() => {
    toast.firstElementChild.style.opacity = "1";
    toast.firstElementChild.style.transform = "translateY(0)";
  }, 20);

  setTimeout(() => {
    toast.firstElementChild.style.opacity = "0";
    toast.firstElementChild.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function toast(msg, type = "info") {
  showToast(msg, type);
}

// =====================
// AUTH HELPERS
// =====================
export function saveToken(token) {
  localStorage.setItem("token", token);
}
export function getToken() {
  return localStorage.getItem("token");
}
export function clearToken() {
  localStorage.removeItem("token");
}
export function requireAuthOrRedirect() {
  if (!getToken()) window.location.href = "/login.html";
}
export function logout() {
  clearToken();
  window.location.href = "/login.html";
}

// =====================
// API WRAPPER
// =====================
export async function api(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const msg = err.error || `Error ${res.status}: ${res.statusText}`;
      showToast(msg, "error");
      throw new Error(msg);
    }

    const data = await res.json();

    if (["POST", "PUT", "DELETE"].includes((options.method || "GET").toUpperCase())) {
      showToast("Login successful", "success");
    }

    return data;
  } catch (err) {
    showToast(err.message || "Network error", "error");
    throw err;
  }
}

// =====================
// TRIAL CHECK
// =====================
export function checkTrial() {
  const trialEndsAt = localStorage.getItem("trialEndsAt");
  const subStatus = localStorage.getItem("subscriptionStatus");
  if (!trialEndsAt) return;

  const expiry = new Date(trialEndsAt);
  const now = new Date();

  if (now > expiry && subStatus !== "active") {
    showToast("Your trial has ended. Please subscribe to continue.", "warning");
    setTimeout(() => (window.location.href = "/subscribe.html"), 2000);
  }
}

// =====================
// LOADING SPINNER HELPER
// =====================
if (!document.querySelector("#spinner-style")) {
  const style = document.createElement("style");
  style.id = "spinner-style";
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

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

    const reset = () => {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || textWhenDone || "Submit";
    };
    button._unloadHandler = reset;
    window.addEventListener("beforeunload", reset);
    window.addEventListener("pagehide", reset);
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || textWhenDone || "Submit";
    if (button._unloadHandler) {
      window.removeEventListener("beforeunload", button._unloadHandler);
      window.removeEventListener("pagehide", button._unloadHandler);
      delete button._unloadHandler;
    }
  }
}
