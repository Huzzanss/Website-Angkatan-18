// Login admin (hanya password). Mengeluarkan JWT yang disimpan frontend.
const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;
const attempts = new Map(); // per IP, hilang saat server restart

// Bandingkan password dengan waktu konstan.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  const now = Date.now();
  const record = attempts.get(req.ip) || { count: 0, lockedUntil: 0 };

  if (!process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "ADMIN_PASSWORD / JWT_SECRET belum diatur di server." });
  }
  if (record.lockedUntil > now) {
    const sec = Math.ceil((record.lockedUntil - now) / 1000);
    return res.status(429).json({ success: false, message: `Terlalu banyak percobaan. Coba lagi dalam ${sec} detik.` });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "Password wajib diisi." });
  }

  if (safeEqual(password, process.env.ADMIN_PASSWORD)) {
    attempts.delete(req.ip);
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "2h" });
    return res.json({ success: true, token, expiresIn: 2 * 60 * 60 });
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    record.count = 0;
  }
  attempts.set(req.ip, record);
  return res.status(401).json({ success: false, message: "Password salah." });
});

// Dipakai halaman admin untuk memastikan sesi masih berlaku.
router.get("/check", requireAuth, (req, res) => res.json({ success: true }));

module.exports = router;
