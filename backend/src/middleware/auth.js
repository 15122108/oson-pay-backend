const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mavjud emas' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.phone = decoded.phone;

    // Check if session still valid
    const session = await db.query(
      `SELECT id FROM sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (session.rows.length === 0) {
      return res.status(401).json({ error: 'Session muddati tugagan' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz' });
  }
}

module.exports = authMiddleware;
