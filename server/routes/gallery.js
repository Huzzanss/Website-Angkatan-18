const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { clean, snapToList, wrap } = require("../lib/helpers");

const router = express.Router();

// Foto disimpan sebagai base64 di Realtime Database, jadi ukurannya dibatasi.
// (Frontend mengecilkan foto otomatis sebelum upload.)
// Metadata ada di "gallery", data gambar di "gallery_images", supaya daftar
// galeri ringan dan gambar baru diunduh browser satu per satu (dengan cache).
const MAX_FILE_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

router.get("/", wrap(async (req, res) => {
  const list = snapToList(await db.ref("gallery").once("value"))
    .map((item) => ({
      id: item.id,
      caption: item.caption || "",
      createdAt: item.createdAt,
      url: item.external ? item.url : `/api/gallery/${item.id}/image`,
    }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(list);
}));

// Kirim gambar sebagai berkas biasa agar bisa di-cache browser.
router.get("/:id/image", wrap(async (req, res) => {
  const snap = await db.ref(`gallery_images/${req.params.id}`).once("value");
  const img = snap.val();
  if (!img || !ALLOWED_TYPES.includes(img.contentType) || !img.data) {
    return res.status(404).json({ success: false, message: "Foto tidak ditemukan." });
  }
  res.set({
    "Content-Type": img.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });
  res.send(Buffer.from(img.data, "base64"));
}));

router.post("/upload", requireAuth, wrap(async (req, res) => {
  const { contentType, dataBase64 } = req.body || {};
  const caption = clean((req.body || {}).caption, 120);

  if (!dataBase64 || typeof dataBase64 !== "string" || !contentType) {
    return res.status(400).json({ success: false, message: "File tidak ditemukan." });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ success: false, message: "Format gambar harus JPG, PNG, WEBP, atau GIF." });
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(dataBase64)) {
    return res.status(400).json({ success: false, message: "Data foto tidak valid." });
  }
  if (Buffer.from(dataBase64, "base64").length > MAX_FILE_BYTES) {
    return res.status(400).json({ success: false, message: "Ukuran gambar maksimal 1.5MB." });
  }

  const ref = db.ref("gallery").push();
  await db.ref(`gallery_images/${ref.key}`).set({ contentType, data: dataBase64 });
  await ref.set({
    caption,
    external: false,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

router.post("/url", requireAuth, wrap(async (req, res) => {
  const url = clean((req.body || {}).url, 1000);
  const caption = clean((req.body || {}).caption, 120);
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    return res.status(400).json({ success: false, message: "URL tidak valid." });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return res.status(400).json({ success: false, message: "URL harus diawali http:// atau https://" });
  }
  const ref = await db.ref("gallery").push({
    url, caption,
    external: true,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

router.put("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`gallery/${req.params.id}`).update({ caption: clean((req.body || {}).caption, 120) });
  res.json({ success: true });
}));

router.delete("/:id", requireAuth, wrap(async (req, res) => {
  await db.ref(`gallery/${req.params.id}`).remove();
  await db.ref(`gallery_images/${req.params.id}`).remove();
  res.json({ success: true });
}));

module.exports = router;
