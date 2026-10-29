// Firebase Admin SDK - satu-satunya tempat yang boleh bicara ke Firebase.
// Browser tidak pernah melihat kredensial ini.
// Foto disimpan sebagai teks base64 di Realtime Database (tanpa Firebase
// Storage, karena Storage butuh paket berbayar).
require("dotenv").config();
const admin = require("firebase-admin");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
  .replace(/^"|"$/g, "")
  .replace(/\\n/g, "\n");
const databaseURL = process.env.FIREBASE_DATABASE_URL;

let ready = false;
let initError = "";

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
  initError =
    "Firebase belum dikonfigurasi. Isi FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, dan FIREBASE_DATABASE_URL di file .env.";
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        databaseURL,
      });
    }
    ready = true;
  } catch (err) {
    initError = "Kredensial Firebase tidak valid: " + err.message;
  }
}

if (!ready) console.warn("[firebase] " + initError);

// db baru dibuat kalau Firebase siap; route lain dilindungi middleware di app.js.
const db = ready ? admin.database() : null;

module.exports = { admin, db, isReady: () => ready, initError: () => initError };
