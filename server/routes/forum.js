const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { clean, snapToList, wrap, rateLimit } = require("../lib/helpers");

const router = express.Router();
const CATEGORIES = ["Umum", "Tanya Jawab", "Curhat", "Info"];
const TS = () => admin.database.ServerValue.TIMESTAMP;

const writeLimit = rateLimit({
  max: 8,
  windowMs: 10 * 60 * 1000,
  message: "Terlalu banyak kiriman. Coba lagi beberapa menit lagi.",
});

router.get("/", wrap(async (req, res) => {
  const list = snapToList(await db.ref("forum").once("value"))
    .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
  res.json(list);
}));

router.get("/:id", wrap(async (req, res) => {
  const snap = await db.ref(`forum/${req.params.id}`).once("value");
  if (!snap.exists()) {
    return res.status(404).json({ success: false, message: "Thread tidak ditemukan." });
  }
  const replies = snapToList(await db.ref(`forum_replies/${req.params.id}`).once("value"))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  res.json({ thread: { id: snap.key, ...snap.val() }, replies });
}));

router.post("/", writeLimit, wrap(async (req, res) => {
  const body = req.body || {};
  const title = clean(body.title, 150);
  const content = clean(body.content, 3000);
  const author = clean(body.author, 100) || "Anonim";
  const category = CATEGORIES.includes(body.category) ? body.category : CATEGORIES[0];
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Judul dan isi wajib diisi." });
  }
  const ref = await db.ref("forum").push({
    title, content, author, category,
    replies: 0,
    createdAt: TS(),
    lastActivity: TS(),
  });
  res.json({ success: true, id: ref.key });
}));

router.post("/:id/replies", writeLimit, wrap(async (req, res) => {
  const body = req.body || {};
  const content = clean(body.content, 2000);
  const author = clean(body.author, 100) || "Anonim";
  if (!content) {
    return res.status(400).json({ success: false, message: "Balasan tidak boleh kosong." });
  }
  const threadRef = db.ref(`forum/${req.params.id}`);
  if (!(await threadRef.once("value")).exists()) {
    return res.status(404).json({ success: false, message: "Thread tidak ditemukan." });
  }
  await db.ref(`forum_replies/${req.params.id}`).push({ author, content, createdAt: TS() });
  await threadRef.child("replies").transaction((n) => (n || 0) + 1);
  await threadRef.update({ lastActivity: TS() });
  res.json({ success: true });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`forum/${req.params.id}`).remove();
  await db.ref(`forum_replies/${req.params.id}`).remove();
  res.json({ success: true });
}));

router.delete("/:id/replies/:rid", requireAuth, wrap(async (req, res) => {
  const replyRef = db.ref(`forum_replies/${req.params.id}/${req.params.rid}`);
  if ((await replyRef.once("value")).exists()) {
    await replyRef.remove();
    await db.ref(`forum/${req.params.id}/replies`).transaction((n) => Math.max((n || 1) - 1, 0));
  }
  res.json({ success: true });
}));

module.exports = router;
