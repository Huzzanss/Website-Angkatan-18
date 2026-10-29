// Express app TANPA app.listen(). Dipakai oleh dua entry point:
//  - server/server.js -> development lokal (menambah file statis + listen)
//  - api/index.js     -> Vercel (file statis dilayani Vercel sendiri)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const firebase = require("./config/firebaseAdmin");

const app = express();
app.set("trust proxy", 1); // req.ip akurat di balik proxy Vercel

// CORS: hanya origin situs sendiri yang boleh memanggil API dari browser.
// Origin yang sama dengan host server selalu diizinkan, ditambah daftar ALLOWED_ORIGINS.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map((o) => o.trim()).filter(Boolean);

app.use(cors((req, callback) => {
  const origin = req.header("Origin");
  let sameHost = false;
  try { sameHost = !!origin && new URL(origin).host === req.header("Host"); } catch (e) { /* abaikan */ }
  const ok = !origin || sameHost || allowedOrigins.includes(origin);
  callback(ok ? null : new Error("Origin tidak diizinkan oleh CORS."), { origin: ok });
}));

// Batas dinaikkan agar foto base64 muat (lihat routes/gallery.js).
app.use(express.json({ limit: "4mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, firebase: firebase.isReady(), message: firebase.isReady() ? "OK" : firebase.initError() });
});

// Login admin tidak butuh database; semua route lain butuh Firebase siap.
app.use("/api/auth", require("./routes/auth"));
app.use("/api", (req, res, next) => {
  if (!firebase.isReady()) {
    return res.status(503).json({ success: false, message: "Server belum terhubung ke database. Hubungi admin." });
  }
  next();
});

const boards = require("./routes/boards");
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/messages", boards.messages);
app.use("/api/shoutouts", boards.shoutouts);
app.use("/api/confessions", boards.confessions);
app.use("/api/forum", require("./routes/forum"));
app.use("/api/polls", require("./routes/polling"));
app.use("/api/timecapsule", require("./routes/timecapsule"));
app.use("/api/leaderboard", require("./routes/leaderboard"));

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

// Penanganan error terakhir (JSON rusak, CORS, dll).
app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Data terlalu besar." });
  }
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Format data tidak valid." });
  }
  if (err && /CORS/.test(err.message)) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Terjadi kesalahan di server." });
});

module.exports = app;
