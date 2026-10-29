// Helper kecil yang dipakai banyak route.

// Bersihkan teks input: pastikan string, trim, potong sesuai batas.
function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

// Ubah snapshot Firebase (object keyed by id) jadi array [{id, ...data}].
function snapToList(snap) {
  const val = snap.val() || {};
  return Object.entries(val).map(([id, data]) => ({ id, ...data }));
}

// Bungkus handler async supaya error tidak membuat server crash.
function wrap(handler) {
  return (req, res) =>
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error(`[${req.method} ${req.originalUrl}]`, err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan di server." });
      }
    });
}

// Rate limit sederhana per IP (memori proses; cukup untuk web kelas).
function rateLimit({ max, windowMs, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({
        success: false,
        message: message || "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
      });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}

module.exports = { clean, snapToList, wrap, rateLimit };
