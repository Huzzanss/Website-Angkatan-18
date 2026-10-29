// Entry point development lokal: file statis + API dalam satu server.
// (Di Vercel dipakai api/index.js, bukan file ini.)
const path = require("path");
const express = require("express");
const app = require("./app");

const ROOT = path.join(__dirname, "..");

// Hanya sajikan file frontend. JANGAN sajikan seluruh folder project,
// karena akan membuka .env dan kode server ke publik.
["index.html", "style.css", "common.js", "sound.js", "students-data.js", "favicon.svg"].forEach((file) => {
  app.get("/" + file, (req, res) => res.sendFile(path.join(ROOT, file)));
});
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.use("/page", express.static(path.join(ROOT, "page")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
