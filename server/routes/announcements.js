const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { clean, snapToList, wrap } = require("../lib/helpers");

const router = express.Router();
const PRIORITIES = ["high", "medium", "low"];

function parse(body) {
  const title = clean(body.title, 200);
  const text = clean(body.body, 3000);
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "low";
  return { title, text, priority };
}

router.get("/", wrap(async (req, res) => {
  const list = snapToList(await db.ref("announcements").once("value"))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(list);
}));

router.post("/", requireAuth, wrap(async (req, res) => {
  const { title, text, priority } = parse(req.body || {});
  if (!title || !text) {
    return res.status(400).json({ success: false, message: "Judul dan isi wajib diisi." });
  }
  const ref = await db.ref("announcements").push({
    title, body: text, priority,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

router.put("/:id", requireAuth, wrap(async (req, res) => {
  const { title, text, priority } = parse(req.body || {});
  if (!title || !text) {
    return res.status(400).json({ success: false, message: "Judul dan isi wajib diisi." });
  }
  const ref = db.ref(`announcements/${req.params.id}`);
  if (!(await ref.once("value")).exists()) {
    return res.status(404).json({ success: false, message: "Pengumuman tidak ditemukan." });
  }
  await ref.update({ title, body: text, priority });
  res.json({ success: true });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`announcements/${req.params.id}`).remove();
  res.json({ success: true });
}));

module.exports = router;
