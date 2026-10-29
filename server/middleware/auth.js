const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.JWT_SECRET;
}

// Mengembalikan true kalau request membawa token admin yang valid.
function isAdminRequest(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !getSecret()) return false;
  try {
    jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
    return true;
  } catch (err) {
    return false;
  }
}

// Melindungi route khusus admin.
function requireAuth(req, res, next) {
  if (!getSecret()) {
    return res.status(500).json({ success: false, message: "JWT_SECRET belum diatur di server." });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan." });
  }
  try {
    req.admin = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Sesi tidak valid atau sudah kedaluwarsa." });
  }
}

module.exports = { requireAuth, isAdminRequest };
