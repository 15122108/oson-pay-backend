const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sendSMS, generateOTP } = require('../services/smsService');

// Step 1: Send OTP
async function sendOTP(req, res) {
  const { phone } = req.body;

  if (!phone || !/^\+998[0-9]{9}$/.test(phone)) {
    return res.status(400).json({ error: "Noto'g'ri telefon raqami" });
  }

  try {
    // Invalidate previous OTPs
    await db.query(
      `UPDATE otps SET is_used = TRUE WHERE phone = $1 AND is_used = FALSE`,
      [phone]
    );

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRES_MIN || 3) * 60 * 1000);

    await db.query(
      `INSERT INTO otps (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [phone, code, expiresAt]
    );

    const message = `PayFlow: Tasdiqlash kodi ${code}. ${process.env.OTP_EXPIRES_MIN || 3} daqiqa ichida amal qiladi.`;
    await sendSMS(phone, message);

    // Check if user exists
    const userResult = await db.query(`SELECT id, full_name FROM users WHERE phone = $1`, [phone]);
    const isNewUser = userResult.rows.length === 0;

    res.json({
      success: true,
      isNewUser,
      message: `Tasdiqlash kodi ${phone} ga yuborildi`,
      // Only in dev mode return the code
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });
  } catch (err) {
    console.error('sendOTP error:', err);
    res.status(500).json({ error: 'SMS yuborishda xatolik' });
  }
}

// Step 2: Verify OTP
async function verifyOTP(req, res) {
  const { phone, code, fullName } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: "Ma'lumotlar to'liq emas" });
  }

  try {
    // Find valid OTP
    const otpResult = await db.query(
      `SELECT * FROM otps 
       WHERE phone = $1 AND code = $2 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: "Kod noto'g'ri yoki muddati tugagan" });
    }

    // Mark OTP as used
    await db.query(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [otpResult.rows[0].id]);

    // Find or create user
    let user = null;
    const existingUser = await db.query(`SELECT * FROM users WHERE phone = $1`, [phone]);

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      await db.query(`UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = $1`, [user.id]);
    } else {
      // New user registration
      const newUser = await db.query(
        `INSERT INTO users (phone, full_name, is_verified) VALUES ($1, $2, TRUE) RETURNING *`,
        [phone, fullName || 'Foydalanuvchi']
      );
      user = newUser.rows[0];

      // Create wallet for new user
      await db.query(
        `INSERT INTO wallets (user_id, balance) VALUES ($1, 0)`,
        [user.id]
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Save session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, token, req.headers['user-agent'], req.ip, expiresAt]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.full_name,
        isVerified: user.is_verified,
      },
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ error: 'Tasdiqlashda xatolik' });
  }
}

// Get current user profile
async function getProfile(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.phone, u.full_name, u.avatar_url, u.is_verified, u.created_at,
              w.balance, w.currency
       FROM users u
       LEFT JOIN wallets w ON w.user_id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
}

// Update profile
async function updateProfile(req, res) {
  const { fullName } = req.body;

  try {
    await db.query(
      `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`,
      [fullName, req.userId]
    );
    res.json({ success: true, message: 'Profil yangilandi' });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
}

// Logout
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await db.query(`DELETE FROM sessions WHERE token = $1`, [token]);
    res.json({ success: true, message: 'Chiqildi' });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik' });
  }
}

module.exports = { sendOTP, verifyOTP, getProfile, updateProfile, logout };
