const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { clean, snapToList, wrap, rateLimit } = require("../lib/helpers");

const router = express.Router();
const voteLimit = rateLimit({ max: 30, windowMs: 10 * 60 * 1000 });

// Firebase bisa mengembalikan options sebagai array atau object; samakan jadi array.
function normalize(poll) {
  const options = Array.isArray(poll.options) ? poll.options : Object.values(poll.options || {});
  return { ...poll, options: options.filter(Boolean).map((o) => ({ text: o.text, votes: o.votes || 0 })) };
}

router.get("/", wrap(async (req, res) => {
  const list = snapToList(await db.ref("polls").once("value"))
    .map(normalize)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(list);
}));

router.post("/", requireAuth, wrap(async (req, res) => {
  const question = clean((req.body || {}).question, 200);
  const rawOptions = Array.isArray((req.body || {}).options) ? req.body.options : [];
  const options = rawOptions.map((o) => clean(o, 100)).filter(Boolean).slice(0, 8);
  if (!question || options.length < 2) {
    return res.status(400).json({ success: false, message: "Pertanyaan dan minimal 2 opsi wajib diisi." });
  }
  const optionMap = {};
  options.forEach((text, i) => { optionMap[i] = { text, votes: 0 }; });
  const ref = await db.ref("polls").push({
    question,
    options: optionMap,
    active: true,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

// Vote publik: { index }
router.patch("/:id/vote", voteLimit, wrap(async (req, res) => {
  const index = Number((req.body || {}).index);
  const snap = await db.ref(`polls/${req.params.id}`).once("value");
  if (!snap.exists()) {
    return res.status(404).json({ success: false, message: "Polling tidak ditemukan." });
  }
  const poll = normalize({ id: snap.key, ...snap.val() });
  if (poll.active === false) {
    return res.status(400).json({ success: false, message: "Polling ini sudah ditutup." });
  }
  if (!Number.isInteger(index) || index < 0 || index >= poll.options.length) {
    return res.status(400).json({ success: false, message: "Pilihan tidak valid." });
  }
  await db.ref(`polls/${req.params.id}/options/${index}/votes`).transaction((n) => (n || 0) + 1);
  res.json({ success: true });
}));

// Buka/tutup polling
router.patch("/:id/toggle", requireAuth, wrap(async (req, res) => {
  const ref = db.ref(`polls/${req.params.id}`);
  const snap = await ref.once("value");
  if (!snap.exists()) {
    return res.status(404).json({ success: false, message: "Polling tidak ditemukan." });
  }
  const active = snap.val().active === false;
  await ref.update({ active });
  res.json({ success: true, active });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`polls/${req.params.id}`).remove();
  res.json({ success: true });
}));

module.exports = router;
