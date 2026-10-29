// Pabrik route untuk papan kiriman publik dengan moderasi:
// Pesan & Kesan, Shoutout, dan Confession.
//  - Siapa pun boleh kirim (dibatasi rate limit), kiriman baru belum tayang.
//  - Pengunjung hanya melihat yang sudah disetujui admin.
//  - Admin (token valid) melihat semua, bisa menyetujui/menyembunyikan dan menghapus.
const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth, isAdminRequest } = require("../middleware/auth");
const { clean, snapToList, wrap, rateLimit } = require("../lib/helpers");

function createBoard({ collection, fields, withLikes = false }) {
  const router = express.Router();

  const postLimit = rateLimit({
    max: 5,
    windowMs: 10 * 60 * 1000,
    message: "Terlalu banyak kiriman. Coba lagi beberapa menit lagi.",
  });
  const likeLimit = rateLimit({ max: 30, windowMs: 10 * 60 * 1000 });

  router.get("/", wrap(async (req, res) => {
    let list = snapToList(await db.ref(collection).once("value"));
    if (!isAdminRequest(req)) list = list.filter((item) => item.approved === true);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(list);
  }));

  router.post("/", postLimit, wrap(async (req, res) => {
    const body = req.body || {};
    const data = {};
    for (const f of fields) {
      let value = clean(body[f.key], f.max);
      if (f.options) {
        if (!f.options.includes(value)) value = f.options[0];
      } else if (!value && f.default) {
        value = f.default;
      }
      if (f.required && !value) {
        return res.status(400).json({ success: false, message: `${f.label} wajib diisi.` });
      }
      data[f.key] = value;
    }
    data.approved = false;
    data.createdAt = admin.database.ServerValue.TIMESTAMP;
    if (withLikes) data.likes = 0;
    await db.ref(collection).push(data);
    res.json({ success: true, message: "Terkirim. Akan tayang setelah disetujui admin." });
  }));

  if (withLikes) {
    router.patch("/:id/like", likeLimit, wrap(async (req, res) => {
      const ref = db.ref(`${collection}/${req.params.id}`);
      const snap = await ref.once("value");
      if (!snap.exists() || snap.val().approved !== true) {
        return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
      }
      const result = await ref.child("likes").transaction((n) => (n || 0) + 1);
      res.json({ success: true, likes: result.snapshot.val() });
    }));
  }

  router.patch("/:id/approve", requireAuth, wrap(async (req, res) => {
    const ref = db.ref(`${collection}/${req.params.id}`);
    const snap = await ref.once("value");
    if (!snap.exists()) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
    }
    const approved = !snap.val().approved;
    await ref.update({ approved });
    res.json({ success: true, approved });
  }));

  router.delete("/:id", requireAuth, wrap(async (req, res) => {
    await db.ref(`${collection}/${req.params.id}`).remove();
    res.json({ success: true });
  }));

  return router;
}

const MESSAGE_CATEGORIES = ["Pesan", "Kesan", "Kenangan", "Harapan"];
const SHOUT_TYPES = ["Terima kasih", "Selamat", "Semangat", "Maaf"];
const MOODS = ["Senang", "Sedih", "Galau", "Lucu"];

module.exports = {
  messages: createBoard({
    collection: "messages",
    fields: [
      { key: "name", label: "Nama", max: 100, default: "Anonim" },
      { key: "to", label: "Untuk", max: 100 },
      { key: "category", label: "Kategori", max: 20, options: MESSAGE_CATEGORIES },
      { key: "content", label: "Isi pesan", max: 1000, required: true },
    ],
  }),
  shoutouts: createBoard({
    collection: "shoutouts",
    fields: [
      { key: "from", label: "Dari", max: 100, default: "Anonim" },
      { key: "to", label: "Untuk", max: 100, required: true },
      { key: "type", label: "Jenis", max: 20, options: SHOUT_TYPES },
      { key: "message", label: "Pesan", max: 500, required: true },
    ],
  }),
  confessions: createBoard({
    collection: "confessions",
    withLikes: true,
    fields: [
      { key: "to", label: "Untuk", max: 100 },
      { key: "mood", label: "Suasana", max: 20, options: MOODS },
      { key: "content", label: "Cerita", max: 1500, required: true },
    ],
  }),
};
