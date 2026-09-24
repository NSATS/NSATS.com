// app.js (Step C: Suite navigation + dummy apps while preserving Mail UX)
// Includes: mega menu -> view switch (Mail/Drive/Contacts/Documents/Sharing),
// dummy data renderers for each section, keeps mail threading/paging/bulk/compose/resizers/theme/toast.

// Demo auth guard
(function authGuard(){
  const authed = localStorage.getItem("nsats_demo_authed") === "1";
  const onLoginPage = /login\.html$/i.test(location.pathname);
  if (!authed && !onLoginPage) {
    window.location.href = "login.html";
  }
})();

const $ = (sel) => document.querySelector(sel);

const PAGE_SIZE = 20;

const LS = {
  theme: "maildemo_theme",
  deleted: "maildemo_deleted",
  unread: "maildemo_unread",
  starred: "maildemo_starred",
  sidebarW: "maildemo_sidebar_w",
  listW: "maildemo_list_w",
  settings: "maildemo_settings",
  expanded: "maildemo_expanded_threads",
  activeView: "maildemo_active_view",
};

const defaultSettings = {
  clickMakesUnread: true,
};

const state = {
  // Views: mail | drive | contacts | documents | sharing
  activeView: localStorage.getItem(LS.activeView) || "mail",

  folderId: "inbox",

  selectedThread: null,
  selectedThreads: new Set(),
  lastCheckedIndex: null,

  search: "",
  sort: "date_desc",
  page: 1,

  theme: localStorage.getItem(LS.theme) || "dark",

  deleted: new Set(JSON.parse(localStorage.getItem(LS.deleted) || "[]")),
  unread: new Set(JSON.parse(localStorage.getItem(LS.unread) || "[]")),
  starred: new Set(JSON.parse(localStorage.getItem(LS.starred) || "[]")),
  expandedThreads: new Set(JSON.parse(localStorage.getItem(LS.expanded) || "[]")),

  settings: (() => {
    try {
      return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(LS.settings) || "{}")) };
    } catch {
      return { ...defaultSettings };
    }
  })(),

  // App selections
  driveSelectedId: null,
  contactsSelectedId: null,
  docsSelectedId: null,
  sharingSelectedId: null,
};

function persist() {
  localStorage.setItem(LS.theme, state.theme);
  localStorage.setItem(LS.deleted, JSON.stringify([...state.deleted]));
  localStorage.setItem(LS.unread, JSON.stringify([...state.unread]));
  localStorage.setItem(LS.starred, JSON.stringify([...state.starred]));
  localStorage.setItem(LS.settings, JSON.stringify(state.settings));
  localStorage.setItem(LS.expanded, JSON.stringify([...state.expandedThreads]));
  localStorage.setItem(LS.activeView, state.activeView);
}

function initTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

/* =========================
   Toast
   ========================= */
let toastTimer = null;
function showToast(message = "Decompressing in progress..", ms = 1200) {
  const toast = $("#toast");
  if (!toast) return;
  const card = toast.querySelector(".toast-card");
  if (card) card.textContent = message;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), Math.min(Math.max(ms, 500), 2000));
}

/* =========================
   Resizable panes
   ========================= */
function setCSSVar(name, px) {
  document.documentElement.style.setProperty(name, `${px}px`);
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function loadPaneSizes() {
  const sidebarW = parseInt(localStorage.getItem(LS.sidebarW) || "260", 10);
  const listW = parseInt(localStorage.getItem(LS.listW) || "420", 10);
  setCSSVar("--sidebar-w", sidebarW);
  setCSSVar("--list-w", listW);
}
function savePaneSizes(sidebarW, listW) {
  if (typeof sidebarW === "number") localStorage.setItem(LS.sidebarW, String(sidebarW));
  if (typeof listW === "number") localStorage.setItem(LS.listW, String(listW));
}

function initResizers() {
  const resSidebar = $("#resizerSidebar");
  const resContent = $("#resizerContent");
  const layout = document.querySelector(".layout");
  const content = document.querySelector(".content");
  if (!layout) return;

  const minSidebar = 180;
  const minList = 320;
  const minPreview = 360;

  function startDrag(which, startX) {
    document.body.classList.add("is-resizing");

    const layoutRect = layout.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();

    const startSidebarW =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w"), 10) || 260;
    const startListW =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue("--list-w"), 10) || 420;

    function onMove(ev) {
      if (ev.cancelable) ev.preventDefault();
      const x = ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX;
      const dx = x - startX;

      if (which === "sidebar") {
        const maxSidebar = Math.max(minSidebar, layoutRect.width - 10 - (minList + minPreview));
        const next = clamp(startSidebarW + dx, minSidebar, maxSidebar);
        setCSSVar("--sidebar-w", next);
        savePaneSizes(next, null);
      }

      if (which === "content" && contentRect) {
        const maxList = Math.max(minList, contentRect.width - 10 - minPreview);
        const next = clamp(startListW + dx, minList, maxList);
        setCSSVar("--list-w", next);
        savePaneSizes(null, next);
      }
    }

    function onUp() {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }

  if (resSidebar) {
    resSidebar.addEventListener("mousedown", (e) => startDrag("sidebar", e.clientX));
    resSidebar.addEventListener(
      "touchstart",
      (e) => e.touches?.length && startDrag("sidebar", e.touches[0].clientX),
      { passive: true }
    );
  }

  // Resizer exists only in Mail view; safe to wire even if hidden
  if (resContent && content) {
    resContent.addEventListener("mousedown", (e) => startDrag("content", e.clientX));
    resContent.addEventListener(
      "touchstart",
      (e) => e.touches?.length && startDrag("content", e.touches[0].clientX),
      { passive: true }
    );
  }
}

/* =========================
   Utilities
   ========================= */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function computeUnread(m) {
  if (state.unread.has(m.id)) return true;
  if (state.unread.has("!" + m.id)) return false;
  return !!m.unread;
}

function normalizeSubject(subj) {
  let s = String(subj || "").trim();
  for (let i = 0; i < 6; i++) {
    const next = s.replace(/^\s*(re|fw|fwd)\s*:\s*/i, "");
    if (next === s) break;
    s = next.trim();
  }
  s = s.replace(/\s+/g, " ").trim();
  return s || "(no subject)";
}

function threadKeyFor(m) {
  return normalizeSubject(m.subject).toLowerCase();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================
   View switching (NEW)
   ========================= */
const viewIds = {
  mail: "#viewMail",
  drive: "#viewDrive",
  contacts: "#viewContacts",
  documents: "#viewDocuments",
  sharing: "#viewSharing",
};

function showView(view) {
  const next = viewIds[view] ? view : "mail";
  state.activeView = next;
  persist();

  Object.entries(viewIds).forEach(([k, id]) => {
    const el = document.querySelector(id);
    if (!el) return;
    el.classList.toggle("hidden", k !== next);
  });

  // Search/sort apply only to Mail
  const search = $("#searchInput");
  const sort = $("#sortSelect");
  if (search) search.disabled = next !== "mail";
  if (sort) sort.disabled = next !== "mail";

  // Compose is mail-specific for demo
  const compose = $("#composeBtn");
  if (compose) compose.disabled = next !== "mail";

  // When leaving mail, close mega menu and clear mail list selection highlight
  closeMegaMenu();

  // Render the correct view content
  renderAll();
}

/* =========================
   Mega menu
   ========================= */
// function closeMegaMenu() {
//   const menu = $("#megaMenu");
//   const btn = $("#megaMenuBtn");
//   if (!menu || !btn) return;
//   menu.classList.add("hidden");
//   btn.setAttribute("aria-expanded", "false");
// }

function closeMegaMenu() {
  const menu = $("#megaMenu");
  const btn = $("#megaMenuBtn");
  if (!menu || !btn) return;

  menu.classList.add("hidden");
  btn.setAttribute("aria-expanded", "false");

  // Remove highlight
  btn.classList.remove("open");
}

// function toggleMegaMenu() {
//   const menu = $("#megaMenu");
//   const btn = $("#megaMenuBtn");
//   if (!menu || !btn) return;
// 
//   const isHidden = menu.classList.contains("hidden");
//   if (isHidden) {
//     menu.classList.remove("hidden");
//     btn.setAttribute("aria-expanded", "true");
//   } else {
//     closeMegaMenu();
//   }
// }

function toggleMegaMenu() {
  const menu = $("#megaMenu");
  const btn = $("#megaMenuBtn");
  if (!menu || !btn) return;

  const isHidden = menu.classList.contains("hidden");

  if (isHidden) {
    menu.classList.remove("hidden");
    btn.setAttribute("aria-expanded", "true");

    // Highlight button
    btn.classList.add("open");
  } else {
    closeMegaMenu();
  }
}

function wireMegaMenu() {
  const btn = $("#megaMenuBtn");
  const menu = $("#megaMenu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMegaMenu();
  });

  // Click on menu items -> toast + switch view
  menu.querySelectorAll(".mega-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const key = item.getAttribute("data-mega") || "";
      const label = item.querySelector(".mega-title")?.textContent?.trim() || item.textContent.trim() || "Item";

      showToast(`Decompressing and opening ${label}…`, 900);
      closeMegaMenu();

    //   if (key === "drive") showView("drive");
//       else if (key === "contacts") showView("contacts");
//       else if (key === "documents") showView("documents");
//       else if (key === "sharing") showView("sharing");
if (key === "mail") showView("mail");
else if (key === "drive") showView("drive");
else if (key === "contacts") showView("contacts");
else if (key === "documents") showView("documents");
else if (key === "sharing") showView("sharing");
    });
  });

  // Outside click closes
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!menu.classList.contains("hidden")) {
      if (target === btn || btn.contains(target)) return;
      if (menu.contains(target)) return;
      closeMegaMenu();
    }
  });
}

/* =========================
   Mail: data -> threads -> pagination
   ========================= */
function getMessagesForCurrentView() {
  const all = window.MAIL_DEMO_DATA.messages;

  let msgs =
    state.folderId === "trash"
      ? all.filter((m) => state.deleted.has(m.id))
      : all.filter((m) => !state.deleted.has(m.id));

  if (state.folderId === "starred") {
    msgs = msgs.filter((m) => state.starred.has(m.id));
  } else if (state.folderId !== "trash") {
    msgs = msgs.filter((m) => m.folder === state.folderId);
  }

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    msgs = msgs.filter((m) =>
      (m.from + " " + m.subject + " " + m.body).toLowerCase().includes(q)
    );
  }

  msgs = msgs.map((m) => ({ ...m, unread: computeUnread(m), starred: state.starred.has(m.id) }));

  const sorters = {
    date_desc: (a, b) => new Date(b.date) - new Date(a.date),
    date_asc: (a, b) => new Date(a.date) - new Date(b.date),
    from_asc: (a, b) => a.from.localeCompare(b.from),
    subject_asc: (a, b) => a.subject.localeCompare(b.subject),
  };
  msgs.sort(sorters[state.sort] || sorters.date_desc);

  return msgs;
}

function buildThreads(messages) {
  const map = new Map();
  for (const m of messages) {
    const key = threadKeyFor(m);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  }

  const threads = [];
  for (const [key, msgs] of map.entries()) {
    const timeline = [...msgs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = [...msgs].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const unreadCount = msgs.reduce((acc, m) => acc + (m.unread ? 1 : 0), 0);
    const starredAny = msgs.some((m) => m.starred);

    const participants = Array.from(
      new Set(msgs.map((m) => String(m.from).replace(/<.*?>/g, "").trim()))
    )
      .slice(0, 3)
      .join(", ");

    threads.push({
      key,
      subjectNorm: normalizeSubject(latest.subject),
      latest,
      timeline,
      count: msgs.length,
      unreadCount,
      starred: starredAny,
      participants,
    });
  }

  threads.sort((a, b) => new Date(b.latest.date) - new Date(a.latest.date));
  return threads;
}

function getPaginationMeta(total) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, state.page), pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return { pageCount, page, start, end };
}

function getThreadsPaginated() {
  const msgs = getMessagesForCurrentView();
  const threads = buildThreads(msgs);
  const meta = getPaginationMeta(threads.length);
  state.page = meta.page;
  return { threads, meta, pageItems: threads.slice(meta.start, meta.end) };
}

/* =========================
   Folder unread counts
   ========================= */
function folderUnreadCount(folderId) {
  const all = window.MAIL_DEMO_DATA.messages;

  let relevant =
    folderId === "trash"
      ? all.filter((m) => state.deleted.has(m.id))
      : all.filter((m) => !state.deleted.has(m.id));

  if (folderId === "starred") relevant = relevant.filter((m) => state.starred.has(m.id));
  else if (folderId !== "trash") relevant = relevant.filter((m) => m.folder === folderId);

  return relevant.reduce((acc, m) => acc + (computeUnread(m) ? 1 : 0), 0);
}

/* =========================
   Mail: render folders
   ========================= */
function renderFolders() {
  const nav = $("#folderList");
  if (!nav) return;

  nav.innerHTML = "";

  // Sidebar is mail-only concept; keep it visible but disable active state outside Mail
  window.MAIL_DEMO_DATA.folders.forEach((f) => {
    const unread = folderUnreadCount(f.id);
    const el = document.createElement("div");
    const disabled = state.activeView !== "mail";
    el.className =
      "folder" +
      (!disabled && state.folderId === f.id ? " active" : "") +
      (disabled ? " disabled" : "");

    el.style.opacity = disabled ? "0.55" : "1";

    el.innerHTML = `
      <div class="name"><span>${f.icon}</span><span>${escapeHtml(f.name)}</span></div>
      ${unread ? `<span class="badge">${unread}</span>` : `<span class="badge" style="opacity:.35">0</span>`}
    `;

    el.addEventListener("click", () => {
      if (state.activeView !== "mail") {
        showToast("Switch to Mail to use folders.", 900);
        return;
      }

      state.folderId = f.id;
      state.selectedThread = null;
      state.selectedThreads.clear();
      state.lastCheckedIndex = null;
      state.page = 1;

      const listTitle = $("#listTitle");
      if (listTitle) listTitle.textContent = f.name;

      renderAll();
    });

    nav.appendChild(el);
  });
}

/* =========================
   Bulk toolbar (Mail only)
   ========================= */
function ensureBulkToolbar() {
  const host = document.querySelector("#viewMail .list-pane");
  if (!host) return;

  let bar = $("#bulkBar");
  if (bar) return;

  bar = document.createElement("div");
  bar.id = "bulkBar";
  bar.style.cssText = `
    position: sticky;
    bottom: 0;
    z-index: 15;
    display: none;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    background: linear-gradient(to bottom, var(--panel), var(--panel2));
  `;

  bar.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;min-width:0;">
      <span id="bulkCount" style="color:var(--muted);font-size:12px;white-space:nowrap;">0 selected</span>
      <button id="bulkStar" class="btn small">Star</button>
      <button id="bulkUnread" class="btn small">Toggle unread</button>
      <button id="bulkArchive" class="btn small">Archive</button>
      <button id="bulkDelete" class="btn small danger">Delete</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <select id="bulkMove" class="select" title="Move to">
        <option value="" selected>Move to…</option>
      </select>
      <button id="bulkClear" class="btn small">Clear</button>
    </div>
  `;

  host.appendChild(bar);

  const move = $("#bulkMove");
  const movable = window.MAIL_DEMO_DATA.folders.filter((f) => !["starred", "trash"].includes(f.id));
  movable.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.name;
    move.appendChild(opt);
  });

  $("#bulkClear").addEventListener("click", () => {
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#bulkDelete").addEventListener("click", () => deleteSelectedThreads());
  $("#bulkUnread").addEventListener("click", () => toggleUnreadForThreads());
  $("#bulkArchive").addEventListener("click", () => moveThreadsToFolder("archive"));
  $("#bulkStar").addEventListener("click", () => toggleStarForThreads());

  move.addEventListener("change", () => {
    const target = move.value;
    if (!target) return;
    moveThreadsToFolder(target);
    move.value = "";
  });
}

function updateBulkToolbarVisibility() {
  const bar = $("#bulkBar");
  if (!bar) return;
  const count = state.selectedThreads.size;
  bar.style.display = state.activeView === "mail" && count > 0 ? "flex" : "none";
  const label = $("#bulkCount");
  if (label) label.textContent = `${count} selected`;
}

/* =========================
   Mail: pagination + select all
   ========================= */
function renderPagination(meta) {
  const prev = $("#prevPage");
  const next = $("#nextPage");
  const info = $("#pageInfo");
  if (!prev || !next || !info) return;

  info.textContent = `Page ${meta.page} / ${meta.pageCount}`;
  prev.disabled = meta.page <= 1;
  next.disabled = meta.page >= meta.pageCount;
}

function updateSelectAllControl(pageItems) {
  const selAll = $("#selectAll");
  if (!selAll) return;

  if (!pageItems.length) {
    selAll.checked = false;
    selAll.indeterminate = false;
    return;
  }

  const countOnPage = pageItems.reduce((acc, t) => acc + (state.selectedThreads.has(t.key) ? 1 : 0), 0);
  selAll.checked = countOnPage === pageItems.length;
  selAll.indeterminate = countOnPage > 0 && countOnPage < pageItems.length;
}

/* =========================
   Mail: render list + preview
   ========================= */
function renderMail() {
  ensureBulkToolbar();

  const list = $("#messageList");
  if (!list) return;

  const { threads, meta, pageItems } = getThreadsPaginated();
  list.innerHTML = "";
  renderPagination(meta);

  if (!threads.length) {
    const empty = document.createElement("div");
    empty.className = "msg";
    empty.style.opacity = 0.7;
    empty.textContent = "No messages found.";
    list.appendChild(empty);
    renderMailPreview(null);
    updateSelectAllControl([]);
    updateBulkToolbarVisibility();
    return;
  }

  if (!pageItems.length) {
    state.page = 1;
    return renderMail();
  }

  if (!state.selectedThread || !pageItems.some((t) => t.key === state.selectedThread)) {
    state.selectedThread = pageItems[0].key;
  }

  pageItems.forEach((t, idx) => {
    const isChecked = state.selectedThreads.has(t.key);
    const isActive = t.key === state.selectedThread;
    const unread = t.unreadCount > 0;

    const el = document.createElement("div");
    el.className = "msg" + (unread ? " unread" : "") + (isActive ? " active" : "");
    el.setAttribute("role", "option");
    el.tabIndex = 0;

    const snippet = t.latest.body.replace(/\s+/g, " ").slice(0, 260);

    el.innerHTML = `
      <div class="row">
        <div class="row-left" style="min-width:0;">
          <input class="msg-check" type="checkbox" data-thread="${escapeHtml(t.key)}" ${isChecked ? "checked" : ""} />
          <button class="star-btn" title="Star" aria-label="Star thread"
            style="border:none;background:transparent;cursor:pointer;padding:0 2px;font-size:14px;color:${t.starred ? "var(--accent)" : "var(--muted)"};">${t.starred ? "★" : "☆"}</button>
          <div class="from" style="min-width:0;max-width:260px;">
            ${unread ? `<span class="dot"></span>` : ""}${escapeHtml(t.participants || t.latest.from)}
            ${t.count > 1 ? `<span style="margin-left:8px;color:var(--muted);font-size:12px;">(${t.count})</span>` : ""}
          </div>
        </div>
        <div class="date">${formatDate(t.latest.date)}</div>
      </div>
      <div class="subject">${escapeHtml(t.subjectNorm)}</div>
      <div class="snippet">${escapeHtml(snippet)}</div>
    `;

    el.querySelector(".msg-check").addEventListener("click", (e) => {
      e.stopPropagation();

      if (e.shiftKey && state.lastCheckedIndex !== null) {
        const a = Math.min(state.lastCheckedIndex, idx);
        const b = Math.max(state.lastCheckedIndex, idx);
        const shouldSelect = !state.selectedThreads.has(t.key);
        for (let i = a; i <= b; i++) {
          const key = pageItems[i].key;
          if (shouldSelect) state.selectedThreads.add(key);
          else state.selectedThreads.delete(key);
        }
      } else {
        if (state.selectedThreads.has(t.key)) state.selectedThreads.delete(t.key);
        else state.selectedThreads.add(t.key);
      }

      state.lastCheckedIndex = idx;
      renderAll();
    });

    el.querySelector(".star-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStarForThread(t.key);
      renderAll();
    });

    el.addEventListener("click", () => {
      if (state.settings.clickMakesUnread) {
        if (!t.latest.unread) {
          state.unread.add(t.latest.id);
          state.unread.delete("!" + t.latest.id);
          persist();
        }
      }
      state.selectedThread = t.key;
      renderAll();
    });

    list.appendChild(el);
  });

  updateSelectAllControl(pageItems);
  updateBulkToolbarVisibility();

  const selected = pageItems.find((t) => t.key === state.selectedThread) || pageItems[0];
  renderMailPreview(selected || null);
}

function renderMailPreview(thread) {
  const preview = $("#preview");
  const replyBtn = $("#replyBtn");
  const forwardBtn = $("#forwardBtn");

  if (!preview) return;

  if (!thread) {
    preview.className = "preview empty";
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📨</div>
        <div class="empty-title">Select a message</div>
        <div class="empty-subtitle">This is a static demo with mock data.</div>
      </div>
    `;
    if (replyBtn) replyBtn.disabled = true;
    if (forwardBtn) forwardBtn.disabled = true;
    return;
  }

  const expanded = state.expandedThreads.has(thread.key);
  const maxVisible = 4;

  const timeline = thread.timeline;
  const visibleTimeline = expanded ? timeline : timeline.slice(0, maxVisible);
  const hiddenCount = Math.max(0, timeline.length - visibleTimeline.length);

  const header = `
    <header class="mail-head">
      <div style="min-width:0;">
        <h2 class="mail-subject">${escapeHtml(thread.subjectNorm)}</h2>
        <div class="meta">
          <div><b>Messages:</b> ${thread.count}</div>
          <div><b>Unread:</b> ${thread.unreadCount}</div>
          <div><b>Folder:</b> ${escapeHtml(state.folderId)}</div>
        </div>
      </div>
      <div class="meta" style="text-align:right;white-space:nowrap;">
        <div><b>Starred:</b> ${thread.starred ? "Yes" : "No"}</div>
      </div>
    </header>
  `;

  const cards = visibleTimeline
    .map((m) => {
      const unread = m.unread ? "Unread" : "Read";
      const star = state.starred.has(m.id) ? "★" : "☆";
      return `
        <div class="thread-card" style="border:1px solid var(--border);border-radius:14px;padding:12px;margin-top:10px;background:rgba(255,255,255,.02)">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div style="min-width:0;">
              <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${escapeHtml(m.from)}
              </div>
              <div style="color:var(--muted);font-size:12px;line-height:1.45;margin-top:4px;">
                <div><b>To:</b> ${escapeHtml(m.to)}</div>
                <div><b>Date:</b> ${escapeHtml(new Date(m.date).toLocaleString())}</div>
              </div>
            </div>
            <div style="text-align:right;color:var(--muted);font-size:12px;white-space:nowrap;">
              <div><b>Status:</b> ${unread}</div>
              <button data-star="${escapeHtml(m.id)}"
                style="margin-top:6px;border:1px solid var(--border);background:var(--panel);color:${state.starred.has(m.id) ? "var(--accent)" : "var(--muted)"};border-radius:10px;padding:4px 8px;cursor:pointer;">
                ${star} Star
              </button>
            </div>
          </div>
          <div style="margin-top:10px;white-space:pre-wrap;line-height:1.55;">${escapeHtml(m.body)}</div>
        </div>
      `;
    })
    .join("");

  preview.className = "preview";
  preview.innerHTML = `
    ${header}
    <div style="margin-top:6px;color:var(--muted);font-size:12px;">
      Conversation view (static demo). Showing ${visibleTimeline.length}${hiddenCount ? ` of ${timeline.length}` : ""} messages.
    </div>
    ${cards}
    <div class="preview-more ${hiddenCount ? "" : "hidden"}">
      <button id="showMoreThread" class="btn small">
        Show ${hiddenCount} more message${hiddenCount === 1 ? "" : "s"}
      </button>
    </div>
  `;

  preview.querySelectorAll("button[data-star]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-star");
      if (!id) return;
      if (state.starred.has(id)) state.starred.delete(id);
      else state.starred.add(id);
      persist();
      renderAll();
    });
  });

  const moreBtn = $("#showMoreThread");
  if (moreBtn && hiddenCount) {
    moreBtn.addEventListener("click", () => {
      state.expandedThreads.add(thread.key);
      persist();
      renderAll();
    });
  }

  if (replyBtn) replyBtn.disabled = false;
  if (forwardBtn) forwardBtn.disabled = false;
}

/* =========================
   Mail actions
   ========================= */
function toggleStarForThread(threadKey) {
  const allMsgs = window.MAIL_DEMO_DATA.messages;
  const ids = allMsgs.filter((m) => threadKeyFor(m) === threadKey).map((m) => m.id);
  const anyStarred = ids.some((id) => state.starred.has(id));

  ids.forEach((id) => {
    if (anyStarred) state.starred.delete(id);
    else state.starred.add(id);
  });

  persist();
}

function toggleStarForThreads() {
  const keys = [...state.selectedThreads];
  if (!keys.length) return;

  const allMsgs = window.MAIL_DEMO_DATA.messages;
  const anyStarred = keys.some((k) =>
    allMsgs.some((m) => threadKeyFor(m) === k && state.starred.has(m.id))
  );

  keys.forEach((k) => {
    const ids = allMsgs.filter((m) => threadKeyFor(m) === k).map((m) => m.id);
    ids.forEach((id) => {
      if (anyStarred) state.starred.delete(id);
      else state.starred.add(id);
    });
  });

  persist();
  renderAll();
}

function toggleUnreadForThreads() {
  const keys = [...state.selectedThreads];
  if (!keys.length) return;

  const allMsgs = window.MAIL_DEMO_DATA.messages;

  keys.forEach((k) => {
    const ids = allMsgs.filter((m) => threadKeyFor(m) === k).map((m) => m.id);
    const anyUnread = ids.some((id) => {
      const msg = allMsgs.find((m) => m.id === id);
      if (!msg) return false;
      return computeUnread(msg);
    });

    ids.forEach((id) => {
      if (anyUnread) {
        state.unread.delete(id);
        state.unread.add("!" + id);
      } else {
        state.unread.add(id);
        state.unread.delete("!" + id);
      }
    });
  });

  persist();
  renderAll();
}

function deleteSelectedThreads() {
  const keys = [...state.selectedThreads];
  if (!keys.length) return;

  const allMsgs = window.MAIL_DEMO_DATA.messages;
  const inTrash = state.folderId === "trash";

  keys.forEach((k) => {
    const ids = allMsgs.filter((m) => threadKeyFor(m) === k).map((m) => m.id);
    ids.forEach((id) => {
      if (inTrash) state.deleted.delete(id);
      else state.deleted.add(id);
    });
  });

  persist();
  state.selectedThreads.clear();
  state.lastCheckedIndex = null;
  state.selectedThread = null;
  renderAll();
}

function moveThreadsToFolder(folderId) {
  const keys = [...state.selectedThreads];
  if (!keys.length) return;

  const allMsgs = window.MAIL_DEMO_DATA.messages;

  keys.forEach((k) => {
    allMsgs.forEach((m) => {
      if (threadKeyFor(m) !== k) return;

      if (folderId === "trash") {
        state.deleted.add(m.id);
      } else {
        state.deleted.delete(m.id);
        m.folder = folderId;
      }
    });
  });

  keys.forEach((k) => state.expandedThreads.delete(k));

  persist();
  showToast(`Decompressing in progress..`, 900);
  state.selectedThreads.clear();
  state.lastCheckedIndex = null;
  state.selectedThread = null;
  renderAll();
}

/* =========================
   Compose (Mail)
   ========================= */
function openCompose() {
  if (state.activeView !== "mail") return;
  closeMegaMenu();
  $("#modalBackdrop")?.classList.remove("hidden");
  $("#composeModal")?.classList.remove("hidden");
  $("#composeTo")?.focus();
}
function closeCompose() {
  $("#modalBackdrop")?.classList.add("hidden");
  $("#composeModal")?.classList.add("hidden");
}

function saveDraft() {
  const ME = "demo_user@nsats.com";
  const to = $("#composeTo")?.value.trim() || "unknown@example.com";
  const subject = $("#composeSubject")?.value.trim() || "(no subject)";
  const body = $("#composeBody")?.value.trim() || "";
  const id = "d_" + Math.random().toString(16).slice(2);

  window.MAIL_DEMO_DATA.messages.push({
    id,
    folder: "drafts",
    from: ME,
    to,
    subject,
    date: new Date().toISOString(),
    unread: false,
    body,
  });

  closeCompose();
  showView("mail");
  state.folderId = "drafts";
  $("#listTitle") && ($("#listTitle").textContent = "Drafts");
  state.selectedThread = null;
  state.selectedThreads.clear();
  state.page = 1;
  renderAll();
}

function sendFake() {
  const ME = "demo_user@nsats.com";
  const to = $("#composeTo")?.value.trim() || "unknown@example.com";
  const subject = $("#composeSubject")?.value.trim() || "(no subject)";
  const body = $("#composeBody")?.value.trim() || "";
  const id = "s_" + Math.random().toString(16).slice(2);

  window.MAIL_DEMO_DATA.messages.push({
    id,
    folder: "sent",
    from: ME,
    to,
    subject,
    date: new Date().toISOString(),
    unread: false,
    body,
  });

  closeCompose();
  showView("mail");
  state.folderId = "sent";
  $("#listTitle") && ($("#listTitle").textContent = "Sent");
  state.selectedThread = null;
  state.selectedThreads.clear();
  state.page = 1;
  renderAll();
}

/* =========================
   Dummy app data + renderers (NEW)
   ========================= */
const DUMMY = {
  drive: (() => {
    const items = [];
    const now = Date.now();
    for (let i = 1; i <= 120; i++) {
      const isFolder = i % 9 === 0;
      items.push({
        id: "drv_" + i,
        type: isFolder ? "folder" : "file",
        name: isFolder ? `Project Folder ${i}` : `Document_${i}.pdf`,
        owner: i % 3 === 0 ? "Security Ops" : "demo_user@nsats.com",
        modified: new Date(now - i * 3600 * 1000).toISOString(),
        size: isFolder ? "-" : `${(i % 42) + 1} MB`,
        body:
`This is a static Drive item.

Name: ${isFolder ? `Project Folder ${i}` : `Document_${i}.pdf`}
Type: ${isFolder ? "Folder" : "File"}
Owner: ${i % 3 === 0 ? "Security Ops" : "demo_user@nsats.com"}

Notes:
- This is mock data for UI testing.
- Previews and actions are non-functional in this demo.`,
      });
    }
    return items;
  })(),

  contacts: (() => {
    const items = [];
    const depts = ["Security", "Finance", "Legal", "Engineering", "Ops", "Sales"];
    for (let i = 1; i <= 160; i++) {
      const dept = depts[i % depts.length];
      items.push({
        id: "ct_" + i,
        name: `Contact ${i} (${dept})`,
        email: `contact${i}@nsats.com`,
        phone: `+000 5${String(10000000 + i).slice(1)}`,
        body:
`Contact profile (static demo)

Name: Contact ${i}
Department: ${dept}
Email: contact${i}@nsats.com
Phone: +971 5${String(10000000 + i).slice(1)}

Notes:
- This is dummy data for a polished contacts experience.
- “Email” and “Call” actions can be wired later.`,
      });
    }
    return items;
  })(),

  documents: (() => {
    const items = [];
    const types = ["Doc", "PDF", "Draft", "Memo"];
    const now = Date.now();
    for (let i = 1; i <= 140; i++) {
      const t = types[i % types.length];
      items.push({
        id: "doc_" + i,
        title: `${t}: Internal Note ${i}`,
        author: i % 2 ? "demo_user@nsats.com" : "Project Team",
        updated: new Date(now - i * 5400 * 1000).toISOString(),
        status: i % 5 === 0 ? "Review" : "Active",
        body:
`Document preview (static demo)

Title: ${t}: Internal Note ${i}
Author: ${i % 2 ? "demo_user@nsats.com" : "Project Team"}
Status: ${i % 5 === 0 ? "Review" : "Active"}

Body:
This is placeholder text for a document preview pane. It is intentionally multi-line to make the UI feel realistic.

Sections:
1) Summary
2) Notes
3) Action items`,
      });
    }
    return items;
  })(),

  sharing: (() => {
    const items = [];
    const perms = ["Viewer", "Editor", "Restricted"];
    const now = Date.now();
    for (let i = 1; i <= 150; i++) {
      const perm = perms[i % perms.length];
      items.push({
        id: "sh_" + i,
        label: `Share link ${i}`,
        target: i % 2 ? `Document_${i}.pdf` : `Project Folder ${i}`,
        permission: perm,
        expiry: i % 4 === 0 ? "Never" : `In ${i % 30 + 1} days`,
        created: new Date(now - i * 7200 * 1000).toISOString(),
        body:
`Sharing details (static demo)

Link: https://share.nsats.com/demo/${i}
Target: ${i % 2 ? `Document_${i}.pdf` : `Project Folder ${i}`}
Permission: ${perm}
Expiry: ${i % 4 === 0 ? "Never" : `In ${i % 30 + 1} days`}
Created: ${new Date(now - i * 7200 * 1000).toLocaleString()}

Notes:
- Copy/Revoke buttons can be wired later.
- This is dummy data for layout realism.`,
      });
    }
    return items;
  })(),
};

function renderDrive() {
  const list = $("#driveList");
  const preview = $("#drivePreview");
  if (!list || !preview) return;

  list.innerHTML = "";
  const items = DUMMY.drive;

  const selected = items.find((x) => x.id === state.driveSelectedId) || null;

  items.slice(0, 60).forEach((it) => {
    const el = document.createElement("div");
    el.className = "msg" + (it.id === state.driveSelectedId ? " active" : "");
    el.innerHTML = `
      <div class="row">
        <div class="from">${it.type === "folder" ? "🗂️" : "📄"} ${escapeHtml(it.name)}</div>
        <div class="date">${formatDate(it.modified)}</div>
      </div>
      <div class="subject">${escapeHtml(it.owner)} · ${escapeHtml(it.size)}</div>
      <div class="snippet">${escapeHtml("Modified " + new Date(it.modified).toLocaleString())}</div>
    `;
    el.addEventListener("click", () => {
      state.driveSelectedId = it.id;
      renderAll();
    });
    list.appendChild(el);
  });

  if (!selected) {
    preview.className = "preview empty";
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗂️</div>
        <div class="empty-title">Select a file or folder</div>
        <div class="empty-subtitle">This is a static Drive demo.</div>
      </div>
    `;
    $("#driveShare") && ($("#driveShare").disabled = true);
    $("#driveDownload") && ($("#driveDownload").disabled = true);
    return;
  }

  preview.className = "preview";
  preview.innerHTML = `
    <header class="mail-head">
      <div style="min-width:0;">
        <h2 class="mail-subject">${escapeHtml(selected.name)}</h2>
        <div class="meta">
          <div><b>Type:</b> ${escapeHtml(selected.type)}</div>
          <div><b>Owner:</b> ${escapeHtml(selected.owner)}</div>
          <div><b>Size:</b> ${escapeHtml(selected.size)}</div>
          <div><b>Modified:</b> ${escapeHtml(new Date(selected.modified).toLocaleString())}</div>
        </div>
      </div>
      <div class="meta" style="text-align:right">
        <div><b>Access:</b> Private</div>
      </div>
    </header>
    <div class="mail-body">${escapeHtml(selected.body)}</div>
  `;

  $("#driveShare") && ($("#driveShare").disabled = false);
  $("#driveDownload") && ($("#driveDownload").disabled = selected.type === "folder");
}

function renderContacts() {
  const list = $("#contactsList");
  const preview = $("#contactsPreview");
  if (!list || !preview) return;

  list.innerHTML = "";
  const items = DUMMY.contacts;

  const selected = items.find((x) => x.id === state.contactsSelectedId) || null;

  items.slice(0, 80).forEach((it) => {
    const el = document.createElement("div");
    el.className = "msg" + (it.id === state.contactsSelectedId ? " active" : "");
    el.innerHTML = `
      <div class="row">
        <div class="from">👤 ${escapeHtml(it.name)}</div>
        <div class="date">${escapeHtml(it.email)}</div>
      </div>
      <div class="subject">${escapeHtml(it.phone)}</div>
      <div class="snippet">${escapeHtml("Tap to view full profile and actions.")}</div>
    `;
    el.addEventListener("click", () => {
      state.contactsSelectedId = it.id;
      renderAll();
    });
    list.appendChild(el);
  });

  if (!selected) {
    preview.className = "preview empty";
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">Select a contact</div>
        <div class="empty-subtitle">This is a static Contacts demo.</div>
      </div>
    `;
    $("#contactsEmail") && ($("#contactsEmail").disabled = true);
    $("#contactsCall") && ($("#contactsCall").disabled = true);
    return;
  }

  preview.className = "preview";
  preview.innerHTML = `
    <header class="mail-head">
      <div style="min-width:0;">
        <h2 class="mail-subject">${escapeHtml(selected.name)}</h2>
        <div class="meta">
          <div><b>Email:</b> ${escapeHtml(selected.email)}</div>
          <div><b>Phone:</b> ${escapeHtml(selected.phone)}</div>
        </div>
      </div>
      <div class="meta" style="text-align:right">
        <div><b>Status:</b> Active</div>
      </div>
    </header>
    <div class="mail-body">${escapeHtml(selected.body)}</div>
  `;

  $("#contactsEmail") && ($("#contactsEmail").disabled = false);
  $("#contactsCall") && ($("#contactsCall").disabled = false);
}

function renderDocuments() {
  const list = $("#docsList");
  const preview = $("#docsPreview");
  if (!list || !preview) return;

  list.innerHTML = "";
  const items = DUMMY.documents;

  const selected = items.find((x) => x.id === state.docsSelectedId) || null;

  items.slice(0, 80).forEach((it) => {
    const el = document.createElement("div");
    el.className = "msg" + (it.id === state.docsSelectedId ? " active" : "");
    el.innerHTML = `
      <div class="row">
        <div class="from">📄 ${escapeHtml(it.title)}</div>
        <div class="date">${formatDate(it.updated)}</div>
      </div>
      <div class="subject">${escapeHtml(it.author)} · ${escapeHtml(it.status)}</div>
      <div class="snippet">${escapeHtml("Updated " + new Date(it.updated).toLocaleString())}</div>
    `;
    el.addEventListener("click", () => {
      state.docsSelectedId = it.id;
      renderAll();
    });
    list.appendChild(el);
  });

  if (!selected) {
    preview.className = "preview empty";
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-title">Select a document</div>
        <div class="empty-subtitle">This is a static Documents demo.</div>
      </div>
    `;
    $("#docsExport") && ($("#docsExport").disabled = true);
    $("#docsShare") && ($("#docsShare").disabled = true);
    return;
  }

  preview.className = "preview";
  preview.innerHTML = `
    <header class="mail-head">
      <div style="min-width:0;">
        <h2 class="mail-subject">${escapeHtml(selected.title)}</h2>
        <div class="meta">
          <div><b>Author:</b> ${escapeHtml(selected.author)}</div>
          <div><b>Status:</b> ${escapeHtml(selected.status)}</div>
          <div><b>Updated:</b> ${escapeHtml(new Date(selected.updated).toLocaleString())}</div>
        </div>
      </div>
      <div class="meta" style="text-align:right">
        <div><b>Visibility:</b> Internal</div>
      </div>
    </header>
    <div class="mail-body">${escapeHtml(selected.body)}</div>
  `;

  $("#docsExport") && ($("#docsExport").disabled = false);
  $("#docsShare") && ($("#docsShare").disabled = false);
}

function renderSharing() {
  const list = $("#sharingList");
  const preview = $("#sharingPreview");
  if (!list || !preview) return;

  list.innerHTML = "";
  const items = DUMMY.sharing;

  const selected = items.find((x) => x.id === state.sharingSelectedId) || null;

  items.slice(0, 90).forEach((it) => {
    const el = document.createElement("div");
    el.className = "msg" + (it.id === state.sharingSelectedId ? " active" : "");
    el.innerHTML = `
      <div class="row">
        <div class="from">🔗 ${escapeHtml(it.label)}</div>
        <div class="date">${escapeHtml(it.permission)}</div>
      </div>
      <div class="subject">${escapeHtml(it.target)}</div>
      <div class="snippet">${escapeHtml("Expiry: " + it.expiry + " · Created " + new Date(it.created).toLocaleDateString())}</div>
    `;
    el.addEventListener("click", () => {
      state.sharingSelectedId = it.id;
      renderAll();
    });
    list.appendChild(el);
  });

  if (!selected) {
    preview.className = "preview empty";
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔗</div>
        <div class="empty-title">Select a share link</div>
        <div class="empty-subtitle">This is a static File sharing demo.</div>
      </div>
    `;
    $("#shareCopy") && ($("#shareCopy").disabled = true);
    $("#shareRevoke") && ($("#shareRevoke").disabled = true);
    return;
  }

  preview.className = "preview";
  preview.innerHTML = `
    <header class="mail-head">
      <div style="min-width:0;">
        <h2 class="mail-subject">${escapeHtml(selected.label)}</h2>
        <div class="meta">
          <div><b>Target:</b> ${escapeHtml(selected.target)}</div>
          <div><b>Permission:</b> ${escapeHtml(selected.permission)}</div>
          <div><b>Expiry:</b> ${escapeHtml(selected.expiry)}</div>
        </div>
      </div>
      <div class="meta" style="text-align:right">
        <div><b>Created:</b> ${escapeHtml(new Date(selected.created).toLocaleDateString())}</div>
      </div>
    </header>
    <div class="mail-body">${escapeHtml(selected.body)}</div>
  `;

  $("#shareCopy") && ($("#shareCopy").disabled = false);
  $("#shareRevoke") && ($("#shareRevoke").disabled = false);
}

/* =========================
   Wiring
   ========================= */
function wireUI() {
  wireMegaMenu();

  // Logout button
$("#logoutBtn")?.addEventListener("click", () => {
  showToast("Ending secure session…", 1000);

  setTimeout(() => {
    localStorage.removeItem("nsats_demo_authed");
    window.location.href = "login.html";
  }, 900);
});


  $("#searchInput")?.addEventListener("input", (e) => {
    if (state.activeView !== "mail") return;
    state.search = e.target.value;
    state.page = 1;
    state.selectedThread = null;
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#clearSearch")?.addEventListener("click", () => {
    if (state.activeView !== "mail") return;
    state.search = "";
    const input = $("#searchInput");
    if (input) input.value = "";
    state.page = 1;
    state.selectedThread = null;
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#sortSelect")?.addEventListener("change", (e) => {
    if (state.activeView !== "mail") return;
    state.sort = e.target.value;
    state.page = 1;
    state.selectedThread = null;
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#toggleTheme")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    initTheme();
    persist();
  });

  $("#markUnreadBtn")?.addEventListener("click", () => {
    if (state.activeView !== "mail") return;
    if (state.selectedThreads.size === 0 && state.selectedThread) {
      state.selectedThreads.add(state.selectedThread);
    }
    toggleUnreadForThreads();
  });

  $("#deleteBtn")?.addEventListener("click", () => {
    if (state.activeView !== "mail") return;
    if (state.selectedThreads.size === 0 && state.selectedThread) {
      state.selectedThreads.add(state.selectedThread);
    }
    deleteSelectedThreads();
  });

  $("#selectAll")?.addEventListener("change", (e) => {
    if (state.activeView !== "mail") return;
    const { pageItems } = getThreadsPaginated();
    if (e.target.checked) pageItems.forEach((t) => state.selectedThreads.add(t.key));
    else pageItems.forEach((t) => state.selectedThreads.delete(t.key));
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#prevPage")?.addEventListener("click", () => {
    if (state.activeView !== "mail") return;
    showToast("Decompressing in progress..", 1200);
    state.page = Math.max(1, state.page - 1);
    state.selectedThread = null;
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#nextPage")?.addEventListener("click", () => {
    if (state.activeView !== "mail") return;
    showToast("Decompressing in progress..", 1200);
    state.page = state.page + 1;
    state.selectedThread = null;
    state.selectedThreads.clear();
    state.lastCheckedIndex = null;
    renderAll();
  });

  $("#composeBtn")?.addEventListener("click", openCompose);
  $("#closeCompose")?.addEventListener("click", closeCompose);
  $("#modalBackdrop")?.addEventListener("click", closeCompose);
  $("#saveDraft")?.addEventListener("click", saveDraft);
  $("#sendFake")?.addEventListener("click", sendFake);

  // Suite buttons inside app panes (static behavior)
  $("#driveNewFolder")?.addEventListener("click", () => showToast("Creating folder…", 900));
  $("#driveUpload")?.addEventListener("click", () => showToast("Uploading…", 900));
  $("#driveShare")?.addEventListener("click", () => showToast("Sharing…", 900));
  $("#driveDownload")?.addEventListener("click", () => showToast("Downloading…", 900));

  $("#contactsNew")?.addEventListener("click", () => showToast("Creating contact…", 900));
  $("#contactsEmail")?.addEventListener("click", () => showToast("Opening mail composer…", 900));
  $("#contactsCall")?.addEventListener("click", () => showToast("Dialing…", 900));

  $("#docsNew")?.addEventListener("click", () => showToast("Creating document…", 900));
  $("#docsImport")?.addEventListener("click", () => showToast("Importing…", 900));
  $("#docsExport")?.addEventListener("click", () => showToast("Exporting…", 900));
  $("#docsShare")?.addEventListener("click", () => showToast("Sharing…", 900));

  $("#shareNewLink")?.addEventListener("click", () => showToast("Generating link…", 900));
  $("#shareCopy")?.addEventListener("click", () => showToast("Copied link.", 900));
  $("#shareRevoke")?.addEventListener("click", () => showToast("Revoked link.", 900));

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (e.key === "Escape") {
      closeMegaMenu();
      closeCompose();
      $("#searchInput")?.blur();
      return;
    }

    if (state.activeView !== "mail") return;

    const { meta, pageItems } = getThreadsPaginated();
    const idx = pageItems.findIndex((t) => t.key === state.selectedThread);

    if (e.key === "j") {
      const nextItem = pageItems[Math.min(idx + 1, pageItems.length - 1)];
      if (nextItem) state.selectedThread = nextItem.key;
      renderAll();
    } else if (e.key === "k") {
      const prevItem = pageItems[Math.max(idx - 1, 0)];
      if (prevItem) state.selectedThread = prevItem.key;
      renderAll();
    } else if (e.key === "u") {
      if (state.selectedThreads.size === 0 && state.selectedThread) state.selectedThreads.add(state.selectedThread);
      toggleUnreadForThreads();
    } else if (e.key === "Delete") {
      if (state.selectedThreads.size === 0 && state.selectedThread) state.selectedThreads.add(state.selectedThread);
      deleteSelectedThreads();
    } else if (e.key === "/") {
      e.preventDefault();
      $("#searchInput")?.focus();
    } else if (e.key === "ArrowLeft") {
      if (meta.page > 1) {
        showToast("Decompressing in progress..", 1200);
        state.page -= 1;
        state.selectedThread = null;
        state.selectedThreads.clear();
        state.lastCheckedIndex = null;
        renderAll();
      }
    } else if (e.key === "ArrowRight") {
      if (meta.page < meta.pageCount) {
        showToast("Decompressing in progress..", 1200);
        state.page += 1;
        state.selectedThread = null;
        state.selectedThreads.clear();
        state.lastCheckedIndex = null;
        renderAll();
      }
    }
  });
}

/* =========================
   Master render
   ========================= */
function renderAll() {
  renderFolders();

  if (state.activeView === "mail") {
    renderMail();
  } else if (state.activeView === "drive") {
    renderDrive();
  } else if (state.activeView === "contacts") {
    renderContacts();
  } else if (state.activeView === "documents") {
    renderDocuments();
  } else if (state.activeView === "sharing") {
    renderSharing();
  } else {
    showView("mail");
  }
}

/* =========================
   Boot
   ========================= */
(function main() {
  initTheme();
  loadPaneSizes();
  initResizers();
  wireUI();

  // Sync initial view
  showView(state.activeView);

  // Ensure list title
  $("#listTitle") && ($("#listTitle").textContent = "Inbox");
  renderAll();
})();