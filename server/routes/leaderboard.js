const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { clean, snapToList, wrap } = require("../lib/helpers");

const router = express.Router();

const BADGES = {
  "best-student": { label: "Siswa Terbaik", desc: "Prestasi akademik terbaik" },
  helpful: { label: "Suka Membantu", desc: "Selalu siap menolong teman" },
  funny: { label: "Paling Lucu", desc: "Penghibur suasana kelas" },
  smart: { label: "Paling Pintar", desc: "Cepat paham dan kritis" },
  creative: { label: "Paling Kreatif", desc: "Penuh ide dan karya" },
  leader: { label: "Pemimpin", desc: "Mengayomi dan menginspirasi" },
};

function normalize(entry) {
  const badges = Object.keys(entry.badges || {}).filter((k) => BADGES[k]);
  return { id: entry.id, name: entry.name, points: entry.points || 0, badges };
}

router.get("/", wrap(async (req, res) => {
  const entries = snapToList(await db.ref("leaderboard").once("value"))
    .map(normalize)
    .sort((a, b) => b.points - a.points || String(a.name).localeCompare(String(b.name), "id"));
  res.json({ entries, badges: BADGES });
}));

router.post("/", requireAuth, wrap(async (req, res) => {
  const name = clean((req.body || {}).name, 100);
  if (!name) return res.status(400).json({ success: false, message: "Nama wajib diisi." });
  const exists = snapToList(await db.ref("leaderboard").once("value"))
    .some((e) => String(e.name).toLowerCase() === name.toLowerCase());
  if (exists) return res.status(400).json({ success: false, message: "Nama itu sudah ada di leaderboard." });
  const ref = await db.ref("leaderboard").push({
    name, points: 0,
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

// Tambah/kurangi poin: { add: number }
router.patch("/:id/points", requireAuth, wrap(async (req, res) => {
  const add = Number((req.body || {}).add);
  if (!Number.isFinite(add) || !Number.isInteger(add) || Math.abs(add) > 10000) {
    return res.status(400).json({ success: false, message: "Jumlah poin harus bilangan bulat (maks. 10000)." });
  }
  const ref = db.ref(`leaderboard/${req.params.id}`);
  if (!(await ref.once("value")).exists()) {
    return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
  }
  const result = await ref.child("points").transaction((n) => Math.max((n || 0) + add, 0));
  await ref.update({ updatedAt: admin.database.ServerValue.TIMESTAMP });
  res.json({ success: true, points: result.snapshot.val() });
}));

// Beri/cabut badge: { badge }
router.patch("/:id/badge", requireAuth, wrap(async (req, res) => {
  const badge = (req.body || {}).badge;
  if (!BADGES[badge]) return res.status(400).json({ success: false, message: "Badge tidak dikenal." });
  const ref = db.ref(`leaderboard/${req.params.id}`);
  const snap = await ref.once("value");
  if (!snap.exists()) return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
  const has = !!(snap.val().badges || {})[badge];
  await ref.child(`badges/${badge}`).set(has ? null : true);
  res.json({ success: true, has: !has });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`leaderboard/${req.params.id}`).remove();
  res.json({ success: true });
}));

module.exports = router;
