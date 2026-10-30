/* Angkatan 18 - skrip bersama untuk semua halaman.
   Membuat navbar & footer, tema, tombol suara, toast, dan helper API.
   Setiap halaman memuat file ini dan memakai <body data-root="..." data-page="...">. */
(function () {
  "use strict";

  var body = document.body;
  var ROOT = body.getAttribute("data-root") || "";
  var PAGE = body.getAttribute("data-page") || "";
  var TOKEN_KEY = "a18_admin_token";

  /* ---------- IKON (SVG inline, tanpa emoji) ---------- */
  var ICONS = {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    shout: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    hidden: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    forum: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
    poll: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-1.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98 1.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
    edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    cap: '<path d="M22 10 12 4 2 10l10 6 10-6Z"/><path d="M6 12.5V17c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
  };

  function icon(name, size) {
    size = size || 18;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  /* ---------- UTIL ---------- */
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  function formatDate(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function relativeTime(ts) {
    if (!ts) return "";
    var min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return "Baru saja";
    if (min < 60) return min + " menit lalu";
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + " jam lalu";
    var day = Math.floor(hr / 24);
    if (day < 30) return day + " hari lalu";
    return formatDate(ts);
  }

  var PALETTE = ["#1f7a5c", "#2f6fb0", "#b03a6c", "#a8661a", "#6a4fbf", "#b03a3a"];
  function avatarColor(name) {
    var h = 0, s = String(name || "");
    for (var i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return PALETTE[Math.abs(h) % PALETTE.length];
  }
  function initials(name) {
    var parts = String(name || "?").trim().split(/\s+/).slice(0, 2);
    return parts.map(function (p) { return p.charAt(0); }).join("").toUpperCase() || "?";
  }

  /* ---------- TOKEN ADMIN ---------- */
  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function setToken(t) { sessionStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

  /* ---------- API ---------- */
  // opts: { method, body, auth }  (auth:true = kirim token admin)
  function api(path, opts) {
    opts = opts || {};
    var headers = {};
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    if (opts.auth && getToken()) headers.Authorization = "Bearer " + getToken();
    return fetch("/api" + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) {
          if (res.status === 401 && opts.auth) clearToken();
          var err = new Error((data && data.message) || "Permintaan gagal (" + res.status + ").");
          err.status = res.status;
          throw err;
        }
        return data;
      });
    }, function () {
      throw new Error("Tidak bisa terhubung ke server. Cek koneksi internet.");
    });
  }

  /* ---------- TOAST ---------- */
  var toastTimer;
  function toast(msg, type) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast show" + (type === "error" ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2800);
  }

  /* ---------- KOMPRES FOTO (dipakai upload publik & admin) ---------- */
  // Mengecilkan foto jadi JPEG <= maxBytes. Mengembalikan Promise<string base64>.
  function compressImage(file, maxBytes) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var longest = Math.max(img.width, img.height);
        var side = Math.min(1280, longest);
        for (var attempt = 0; attempt < 6; attempt++) {
          var scale = side / longest;
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          var q = 0.82;
          var data = c.toDataURL("image/jpeg", q).split(",")[1];
          while (data.length * 0.75 > maxBytes && q > 0.45) {
            q -= 0.1;
            data = c.toDataURL("image/jpeg", q).split(",")[1];
          }
          if (data.length * 0.75 <= maxBytes) { resolve(data); return; }
          side = Math.round(side * 0.8);
        }
        reject(new Error("Foto terlalu besar untuk dikecilkan. Pilih foto lain."));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error((file && file.name ? file.name : "File") + " bukan gambar yang valid."));
      };
      img.src = url;
    });
  }

  /* ---------- TEMA ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("a18_theme", theme);
  }

  /* ---------- NAVBAR & FOOTER ---------- */
  var MAIN_LINKS = [
    { key: "home", label: "Home", href: ROOT + "index.html" },
    { key: "students", label: "Siswa", href: ROOT + "page/students/students.html" },
    { key: "gallery", label: "Galeri", href: ROOT + "page/gallery/gallery.html" },
    { key: "announcements", label: "Pengumuman", href: ROOT + "page/announcements/announcements.html" }
  ];
  var MORE_LINKS = [
    { key: "messages", label: "Pesan & Kesan", href: ROOT + "page/messages/messages.html" },
    { key: "shoutout", label: "Shoutout", href: ROOT + "page/shoutout/shoutout.html" },
    { key: "confession", label: "Confession", href: ROOT + "page/confession/confession.html" },
    { key: "forum", label: "Forum", href: ROOT + "page/forum/forum.html" },
    { key: "polling", label: "Polling", href: ROOT + "page/polling/polling.html" },
    { key: "timecapsule", label: "Time Capsule", href: ROOT + "page/timecapsule/timecapsule.html" },
    { key: "leaderboard", label: "Leaderboard", href: ROOT + "page/leaderboard/leaderboard.html" },
    { key: "wordle", label: "Wordle", href: ROOT + "page/wordle/wordle.html" }
  ];

  function linkHTML(l) {
    return '<a href="' + l.href + '"' + (l.key === PAGE ? ' class="active" aria-current="page"' : "") + ">" + esc(l.label) + "</a>";
  }

  function buildHeader() {
    var host = document.getElementById("siteHeader");
    if (!host) return;
    var moreActive = MORE_LINKS.some(function (l) { return l.key === PAGE; });
    host.outerHTML =
      '<nav class="navbar"><div class="nav-container">' +
      '<a class="nav-logo" id="navLogo" href="' + ROOT + 'index.html">' + icon("cap", 20) + "<span>Angkatan 18</span></a>" +
      '<button class="nav-toggle" id="navToggle" aria-label="Buka menu" aria-expanded="false">' + icon("menu", 18) + "</button>" +
      '<div class="nav-right" id="navRight">' +
      '<ul class="nav-links">' +
      MAIN_LINKS.map(function (l) { return "<li>" + linkHTML(l) + "</li>"; }).join("") +
      '<li class="nav-more"><button class="nav-more-btn" id="moreBtn" aria-expanded="false"' + (moreActive ? ' style="color:var(--text)"' : "") + ">Lainnya " + icon("chevron", 13) + "</button>" +
      '<ul class="nav-dropdown" id="navDropdown">' +
      MORE_LINKS.map(function (l) { return "<li>" + linkHTML(l) + "</li>"; }).join("") +
      "</ul></li></ul>" +
      '<div class="nav-actions">' +
      '<button class="theme-toggle" id="sfxToggle" aria-label="Efek suara" title="Efek suara">' +
      '<svg class="icon-sfx-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>' +
      '<svg class="icon-sfx-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m17 9 4 6M21 9l-4 6"/></svg></button>' +
      '<button class="theme-toggle" id="bgmToggle" aria-label="Musik latar" title="Musik latar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></button>' +
      '<button class="theme-toggle" id="themeToggle" aria-label="Ganti tema" title="Ganti tema">' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg></button>' +
      "</div></div></div></nav>";
  }

  function buildFooter() {
    var host = document.getElementById("siteFooter");
    if (!host) return;
    host.outerHTML = '<footer class="footer"><p>&copy; ' + new Date().getFullYear() + " Angkatan 18 &mdash; SMP Islam Bunga Bangsa Samarinda</p></footer>";
  }

  function ensureToast() {
    if (document.getElementById("toast")) return;
    var el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    body.appendChild(el);
  }

  function wireHeader() {
    var moreBtn = document.getElementById("moreBtn");
    var dropdown = document.getElementById("navDropdown");
    var navToggle = document.getElementById("navToggle");
    var navRight = document.getElementById("navRight");

    if (moreBtn && dropdown) {
      moreBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = dropdown.classList.toggle("show");
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.addEventListener("click", function (e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove("show");
          moreBtn.setAttribute("aria-expanded", "false");
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && dropdown.classList.contains("show")) {
          dropdown.classList.remove("show");
          moreBtn.setAttribute("aria-expanded", "false");
          moreBtn.focus();
        }
      });
    }
    if (navToggle && navRight) {
      navToggle.addEventListener("click", function () {
        var open = navRight.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        toast(next === "dark" ? "Mode gelap aktif" : "Mode terang aktif");
      });
    }

    var sfxToggle = document.getElementById("sfxToggle");
    if (sfxToggle && typeof isSfxEnabled === "function") {
      document.documentElement.setAttribute("data-sfx", isSfxEnabled() ? "on" : "off");
      sfxToggle.addEventListener("click", function () {
        var on = !isSfxEnabled();
        setSfxEnabled(on);
        document.documentElement.setAttribute("data-sfx", on ? "on" : "off");
        if (on) playSfx("success");
        toast(on ? "Efek suara nyala" : "Efek suara mati");
      });
    }

    var bgmToggle = document.getElementById("bgmToggle");
    if (bgmToggle && typeof toggleBgm === "function") {
      bgmToggle.addEventListener("click", function () {
        var playing = toggleBgm();
        bgmToggle.classList.toggle("bgm-active", playing);
        toast(playing ? "Musik latar nyala" : "Musik latar mati");
      });
    }

    /* Rahasia: klik logo 5x -> halaman login admin */
    var logo = document.getElementById("navLogo");
    var clicks = 0, clickTimer;
    if (logo) {
      logo.addEventListener("click", function (e) {
        clicks++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clicks = 0; }, 2200);
        if (clicks === 3) toast("Terus...");
        if (clicks >= 5) {
          e.preventDefault();
          clicks = 0;
          toast("Membuka panel admin...");
          setTimeout(function () { location.href = ROOT + "page/login/login.html"; }, 500);
        }
      });
    }

    /* Rahasia: ketik "admin" di luar kolom isian -> halaman login */
    var buffer = "", bufferTimer;
    window.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (["INPUT", "TEXTAREA", "SELECT"].indexOf(tag) !== -1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (PAGE === "wordle") return;
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-5);
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(function () { buffer = ""; }, 1500);
      if (buffer === "admin") location.href = ROOT + "page/login/login.html";
    });

    /* Suara klik halus pada tombol (hanya jika efek suara nyala) */
    document.addEventListener("click", function (e) {
      if (typeof playSfx === "function" && e.target.closest && e.target.closest("button, .btn, a.feature-card, a.menu-card")) {
        playSfx("click");
      }
    });
  }

  /* ---------- PUBLIK ---------- */
  window.A18 = {
    ROOT: ROOT, PAGE: PAGE,
    api: api, icon: icon, esc: esc, toast: toast, compressImage: compressImage,
    formatDate: formatDate, relativeTime: relativeTime,
    avatarColor: avatarColor, initials: initials,
    getToken: getToken, setToken: setToken, clearToken: clearToken,
    isAdmin: function () { return !!getToken(); }
  };

  // Tema awal (cadangan; halaman juga memasangnya lebih awal di <head> agar tidak berkedip).
  if (!document.documentElement.getAttribute("data-theme")) {
    var saved = localStorage.getItem("a18_theme");
    document.documentElement.setAttribute("data-theme", saved || "dark");
  }

  buildHeader();
  buildFooter();
  ensureToast();
  wireHeader();

  // Link "Lewati ke konten" untuk pengguna keyboard / pembaca layar.
  var mainEl = document.querySelector("main");
  if (mainEl) {
    if (!mainEl.id) mainEl.id = "main";
    var skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#" + mainEl.id;
    skip.textContent = "Lewati ke konten";
    body.insertBefore(skip, body.firstChild);
  }

  // Isi ikon otomatis: <span data-icon="users" data-size="24"></span>
  Array.prototype.forEach.call(document.querySelectorAll("[data-icon]"), function (el) {
    el.innerHTML = icon(el.getAttribute("data-icon"), parseInt(el.getAttribute("data-size"), 10) || 24);
  });
})();
