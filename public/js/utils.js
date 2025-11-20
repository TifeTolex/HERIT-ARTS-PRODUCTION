// =====================
// ENV CONFIG
// =====================
const API_BASE = window.location.hostname.includes("localhost")
  ? ""
  : "";

// =====================
// SHORT SELECTORS
// =====================
export const $ = (s, c = document) => c.querySelector(s);
export const $all = (s, c = document) => Array.from(c.querySelectorAll(s));

// =====================
// NAV HANDLER
// =====================
export function setCurrentNav(href) {
  const link = document.querySelector(`nav a[href="${href}"]`);
  if (link) link.setAttribute("aria-current", "page");
}

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector("nav");
  const toggle = document.querySelector(".menu-toggle");

  if (toggle && nav) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (nav?.classList.contains("open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove("open");
    }
  });

  document.querySelectorAll("nav a").forEach((l) =>
    l.addEventListener("click", () => nav.classList.remove("open"))
  );
});

// =====================
// TOAST - SAFE VERSION
// =====================
export function toast(message, type = "info") {
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.style.position = "fixed";
    box.style.bottom = "20px";
    box.style.right = "20px";
    box.style.zIndex = 999999;
    document.body.appendChild(box);
  }

  const item = document.createElement("div");
  item.className = "toast-item";
  item.style.background = type === "error" ? "#f44336" : type === "success" ? "#4caf50" : "#333";
  item.style.color = "#fff";
  item.style.padding = "12px 18px";
  item.style.borderRadius = "6px";
  item.style.marginTop = "8px";
  item.style.opacity = "0";
  item.style.transition = "opacity .25s";
  item.textContent = message;

  box.appendChild(item);

  setTimeout(() => (item.style.opacity = "1"), 50);
  setTimeout(() => {
    item.style.opacity = "0";
    setTimeout(() => item.remove(), 300);
  }, 3000);
}

// =====================
// AUTH HELPERS
// =====================
export const saveToken = (t) => localStorage.setItem("token", t);
export const getToken = () => localStorage.getItem("token");
export const clearToken = () => localStorage.removeItem("token");

export function requireAuthOrRedirect() {
  if (!getToken()) window.location.href = "/login.html";
}

export function logout() {
  clearToken();
  window.location.href = "/login.html";
}

// =====================
// API WRAPPER — BULLETPROOF VERSION
// =====================
export async function api(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  let res;

  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (err) {
    toast("Network error", "error");
    throw err;
  }

  const text = await res.text();

  // Try to parse JSON safely
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    // HTML or other text → show fallback
    toast("Server returned unexpected response", "error");
    throw new Error("Invalid JSON from server");
  }

  // Handle non-OK statuses
  if (!res.ok) {
    const msg = data.error || data.message || `Error ${res.status}`;
    toast(msg, "error");
    throw new Error(msg);
  }

  return data;
}

// =====================
// LOADING BUTTON
// =====================
export function setLoading(btn, state, restoreText) {
  if (!btn) return;

  if (state) {
    btn.disabled = true;
    btn.dataset.old = btn.innerHTML;
    btn.innerHTML = `<span style="
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: inline-block;
      animation: spin 0.6s linear infinite;
    "></span>`;
  } else {
    btn.disabled = false;
    btn.innerHTML = restoreText || btn.dataset.old || "Submit";
  }
}
