// auth.js (static demo auth)

const $ = (sel) => document.querySelector(sel);

const LS_AUTH = "nsats_demo_authed";
const LS_THEME = "maildemo_theme";

// Demo credentials (prefilled)
const DEMO_USER = "demo_user@nsats.com";
const DEMO_PASS = "123@123"; // you can change this

function initTheme() {
  const theme = localStorage.getItem(LS_THEME) || "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = localStorage.getItem(LS_THEME) || "dark";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(LS_THEME, next);
  document.documentElement.setAttribute("data-theme", next);
}

function showError(msg) {
  const el = $("#loginError");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  const el = $("#loginError");
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

(function main() {
  initTheme();

  // If already authed, go straight to app
  if (localStorage.getItem(LS_AUTH) === "1") {
    window.location.href = "app-index.html";
    return;
  }

  // Prefill
  $("#loginUser").value = DEMO_USER;
  $("#loginPass").value = DEMO_PASS;

  $("#toggleTheme")?.addEventListener("click", toggleTheme);

  $("#signInBtn")?.addEventListener("click", () => {
    clearError();

    const u = $("#loginUser").value.trim();
    const p = $("#loginPass").value;

    if (u !== DEMO_USER || p !== DEMO_PASS) {
      showError("Invalid credentials (demo). Use the pre-filled values.");
      return;
    }

    localStorage.setItem(LS_AUTH, "1");
    window.location.href = "app-index.html";
  });

  // Enter key submits
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#signInBtn")?.click();
  });
})();