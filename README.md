# Website Angkatan 18

Website Angkatan 18 SMP Islam Bunga Bangsa Samarinda (2026-2029).
Frontend statis (HTML/CSS/JS) + Express API + Firebase Realtime Database.

## Menjalankan di komputer

1. `npm install`
2. Isi `.env` (lihat `.env.example`). Bagian Firebase diambil dari file JSON service account:
   Firebase Console > Project settings > Service accounts > Generate new private key.
   - `project_id`   -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key`  -> `FIREBASE_PRIVATE_KEY` (satu baris, `\n` dibiarkan)
3. `npm start`, lalu buka http://localhost:3000
4. Cek koneksi database: http://localhost:3000/api/health (harus `"firebase": true`)

## Admin

- Klik logo "Angkatan 18" 5 kali, atau ketik `admin` di halaman mana pun, atau buka `/page/login/login.html`.
- Password ada di `ADMIN_PASSWORD` (`.env`). Sesi berlaku 2 jam.
- Panel admin: pengumuman, galeri, moderasi (pesan, shoutout, confession), forum, polling, time capsule, leaderboard.
- Pesan & Kesan, Shoutout, dan Confession baru tayang setelah disetujui admin.
- Daftar siswa ada di `students-data.js` (bukan di database). Untuk menambah atau mengubah siswa, edit file itu, simpan, lalu deploy ulang.

## Deploy ke Vercel

1. Push ke GitHub, import project di Vercel.
2. Isi Environment Variables yang sama dengan `.env`
   (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL,
   JWT_SECRET, ADMIN_PASSWORD, ALLOWED_ORIGINS, TIMECAPSULE_UNLOCK).
3. Deploy. File statis dilayani Vercel, `/api/*` ditangani `api/index.js`.

## Struktur

```
index.html, style.css, common.js, sound.js, students-data.js, favicon.svg
page/<nama>/<nama>.html   students, gallery, announcements, messages, shoutout,
                          confession, forum, polling, timecapsule, leaderboard,
                          wordle, login, admin
server/app.js             Express app (dipakai lokal & Vercel)
server/server.js          Entry lokal (+ file statis)
server/routes/            API per fitur
server/config, middleware, lib
api/index.js              Entry Vercel
Penting/                  Referensi lama (UI), tidak dipakai & tidak ikut git
```

## Catatan keamanan

- Jangan commit `.env`. Kunci Firebase memberi akses penuh ke database.
- Server lokal hanya menyajikan file frontend, bukan seluruh folder project.
- Foto disimpan sebagai base64 di Realtime Database (dikecilkan otomatis, maks 1.5 MB per foto).
