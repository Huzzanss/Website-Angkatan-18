const express = require("express");
const { db, admin } = require("../config/firebaseAdmin");
const { requireAuth, isAdminRequest } = require("../middleware/auth");
const { clean, snapToList, wrap, rateLimit } = require("../lib/helpers");

const router = express.Router();

// Foto disimpan sebagai base64 di Realtime Database, jadi ukurannya dibatasi.
// Metadata ada di "gallery", data gambar di "gallery_images", supaya daftar
// galeri ringan dan gambar diunduh browser satu per satu (dengan cache).
const ADMIN_MAX_BYTES = 1.5 * 1024 * 1024;
const PUBLIC_MAX_BYTES = 1 * 1024 * 1024;
const MAX_PENDING = 40; // batas antrean foto yang belum disetujui
const ADMIN_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PUBLIC_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Tebak tipe file dari isinya (bukan dari klaim pengirim).
function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.length > 6 && buf.slice(0, 3).toString("ascii") === "GIF") return "image/gif";
  return null;
}

// Validasi kiriman gambar. Mengembalikan { error } atau { contentType, buffer }.
function checkImage(body, allowedTypes, maxBytes) {
  const { contentType, dataBase64 } = body || {};
  if (!dataBase64 || typeof dataBase64 !== "string" || !contentType) return { error: "File tidak ditemukan." };
  if (!allowedTypes.includes(contentType)) {
    return { error: "Format gambar harus " + allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ") + "." };
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(dataBase64)) return { error: "Data foto tidak valid." };
  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.length > maxBytes) return { error: "Ukuran gambar maksimal " + (maxBytes / 1024 / 1024).toFixed(1).replace(".0", "") + "MB." };
  if (sniff(buffer) !== contentType) return { error: "Isi file tidak cocok dengan format gambar." };
  return { contentType, buffer };
}

const submitShort = rateLimit({
  max: 3,
  windowMs: 10 * 60 * 1000,
  message: "Terlalu banyak foto dikirim. Coba lagi beberapa menit lagi.",
});
const submitDaily = rateLimit({
  max: 10,
  windowMs: 24 * 60 * 60 * 1000,
  message: "Batas kiriman foto hari ini sudah tercapai. Coba lagi besok.",
});

// Pengunjung hanya melihat foto yang sudah disetujui. Admin melihat semua.
router.get("/", wrap(async (req, res) => {
  const isAdmin = isAdminRequest(req);
  let list = snapToList(await db.ref("gallery").once("value"));
  if (!isAdmin) list = list.filter((item) => item.approved === true);
  const out = list
    .map((item) => {
      const row = {
        id: item.id,
        caption: item.caption || "",
        createdAt: item.createdAt,
        url: item.external ? item.url : `/api/gallery/${item.id}/image`,
      };
      if (isAdmin) {
        row.approved = item.approved === true;
        row.uploader = item.uploader || "";
        row.external = !!item.external;
      }
      return row;
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(out);
}));

// Kirim gambar sebagai berkas biasa agar bisa di-cache browser.
// Foto yang belum disetujui hanya bisa dilihat admin (dan tidak di-cache).
router.get("/:id/image", wrap(async (req, res) => {
  const meta = (await db.ref(`gallery/${req.params.id}`).once("value")).val();
  if (!meta || meta.external) {
    return res.status(404).json({ success: false, message: "Foto tidak ditemukan." });
  }
  const approved = meta.approved === true;
  if (!approved && !isAdminRequest(req)) {
    return res.status(404).json({ success: false, message: "Foto tidak ditemukan." });
  }
  const img = (await db.ref(`gallery_images/${req.params.id}`).once("value")).val();
  if (!img || !PUBLIC_TYPES.concat(ADMIN_TYPES).includes(img.contentType) || !img.data) {
    return res.status(404).json({ success: false, message: "Foto tidak ditemukan." });
  }
  res.set({
    "Content-Type": img.contentType,
    "Cache-Control": approved ? "public, max-age=31536000, immutable" : "private, no-store",
  });
  res.send(Buffer.from(img.data, "base64"));
}));

// Upload oleh admin: langsung tayang.
router.post("/upload", requireAuth, wrap(async (req, res) => {
  const result = checkImage(req.body, ADMIN_TYPES, ADMIN_MAX_BYTES);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  const caption = clean((req.body || {}).caption, 120);

  const ref = db.ref("gallery").push();
  await db.ref(`gallery_images/${ref.key}`).set({ contentType: result.contentType, data: result.buffer.toString("base64") });
  await ref.set({
    caption,
    external: false,
    approved: true,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

// Kiriman publik: masuk antrean, belum tayang sampai disetujui admin.
router.post("/submit", submitShort, submitDaily, wrap(async (req, res) => {
  const result = checkImage(req.body, PUBLIC_TYPES, PUBLIC_MAX_BYTES);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  const caption = clean((req.body || {}).caption, 120);
  const uploader = clean((req.body || {}).uploader, 60) || "Anonim";

  const pending = snapToList(await db.ref("gallery").once("value")).filter((g) => g.approved !== true).length;
  if (pending >= MAX_PENDING) {
    return res.status(503).json({
      success: false,
      message: "Antrean foto sedang penuh. Coba lagi nanti setelah admin meninjau kiriman.",
    });
  }

  const ref = db.ref("gallery").push();
  await db.ref(`gallery_images/${ref.key}`).set({ contentType: result.contentType, data: result.buffer.toString("base64") });
  await ref.set({
    caption,
    uploader,
    external: false,
    approved: false,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, message: "Foto terkirim. Akan tayang setelah disetujui admin." });
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
    approved: true,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });
  res.json({ success: true, id: ref.key });
}));

router.patch("/:id/approve", requireAuth, wrap(async (req, res) => {
  const ref = db.ref(`gallery/${req.params.id}`);
  const snap = await ref.once("value");
  if (!snap.exists()) return res.status(404).json({ success: false, message: "Foto tidak ditemukan." });
  const approved = snap.val().approved !== true;
  await ref.update({ approved });
  res.json({ success: true, approved });
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
