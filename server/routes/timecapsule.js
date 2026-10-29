const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth, isAdminRequest } = require("../middleware/auth");
const { clean, snapToList, wrap, rateLimit } = require("../lib/helpers");

const router = express.Router();
const postLimit = rateLimit({
  max: 3,
  windowMs: 10 * 60 * 1000,
  message: "Terlalu banyak kiriman. Coba lagi beberapa menit lagi.",
});

function unlockDate() {
  const d = new Date(process.env.TIMECAPSULE_UNLOCK || "2029-09-09T00:00:00+08:00");
  return isNaN(d.getTime()) ? new Date("2029-09-09T00:00:00+08:00") : d;
}

// Pesan hanya terbuka setelah tanggal buka (admin tetap bisa melihat untuk moderasi).
router.get("/", wrap(async (req, res) => {
  const list = snapToList(await db.ref("timecapsule").once("value"))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const date = unlockDate();
  const unlocked = Date.now() >= date.getTime();
  const canSee = unlocked || isAdminRequest(req);
  res.json({
    unlocked,
    unlockDate: date.toISOString(),
    count: list.length,
    messages: canSee ? list : [],
  });
}));

router.post("/", postLimit, wrap(async (req, res) => {
  const body = req.body || {};
  const author = clean(body.author, 100);
  const content = clean(body.content, 2000);
  const dream = clean(body.dream, 200);
  if (!author || !content) {
    return res.status(400).json({ success: false, message: "Nama dan pesan wajib diisi." });
  }
  await db.ref("timecapsule").push({
    author, content, dream,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`timecapsule/${req.params.id}`).remove();
  res.json({ success: true });
}));

module.exports = router;
