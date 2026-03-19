const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Generate unique reference
function generateReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PF${timestamp}${random}`;
}

// Calculate fee (0% for now, can be changed)
function calculateFee(amount, type) {
  if (type === 'send') return 0; // free transfers
  if (type === 'topup') return 0;
  return 0;
}

// Send money
async function sendMoney(req, res) {
  const { receiverPhone, amount, description, cardId } = req.body;
  const senderId = req.userId;

  if (!receiverPhone || !amount || amount <= 0) {
    return res.status(400).json({ error: "Ma'lumotlar noto'g'ri" });
  }

  if (amount < 1000) {
    return res.status(400).json({ error: "Minimum miqdor 1,000 UZS" });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Get sender wallet
    const senderWallet = await client.query(
      `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [senderId]
    );

    if (senderWallet.rows.length === 0) {
      throw new Error('Hamyon topilmadi');
    }

    const senderBalance = parseFloat(senderWallet.rows[0].balance);
    const fee = calculateFee(amount, 'send');
    const totalDebit = parseFloat(amount) + fee;

    if (senderBalance < totalDebit) {
      throw new Error("Hisobda mablag' yetarli emas");
    }

    // Find receiver
    const receiverResult = await client.query(
      `SELECT u.id, u.full_name, w.id as wallet_id FROM users u
       JOIN wallets w ON w.user_id = u.id
       WHERE u.phone = $1 AND u.is_active = TRUE FOR UPDATE`,
      [receiverPhone]
    );

    if (receiverResult.rows.length === 0) {
      throw new Error('Qabul qiluvchi topilmadi');
    }

    const receiver = receiverResult.rows[0];

    if (receiver.id === senderId) {
      throw new Error("O'z-o'zingizga pul yubora olmaysiz");
    }

    const reference = generateReference();

    // Debit sender
    await client.query(
      `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2`,
      [totalDebit, senderId]
    );

    // Credit receiver
    await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
      [amount, receiver.id]
    );

    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions 
       (sender_id, receiver_id, amount, fee, type, status, description, category, reference)
       VALUES ($1, $2, $3, $4, 'send', 'completed', $5, 'transfer', $6)
       RETURNING *`,
      [senderId, receiver.id, amount, fee, description || "Pul o'tkazma", reference]
    );

    // Create notification for receiver
    await client.query(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES ($1, $2, $3, 'transaction', $4)`,
      [
        receiver.id,
        'Pul keldi! 💰',
        `${amount.toLocaleString()} UZS qabul qildingiz`,
        JSON.stringify({ transactionId: txResult.rows[0].id, amount }),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      transaction: txResult.rows[0],
      message: `${amount.toLocaleString()} UZS ${receiver.full_name}ga yuborildi`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('sendMoney error:', err);
    res.status(400).json({ error: err.message || 'Xatolik yuz berdi' });
  } finally {
    client.release();
  }
}

// Top up wallet
async function topUp(req, res) {
  const { amount, cardNumber, description } = req.body;
  const userId = req.userId;

  if (!amount || amount < 1000) {
    return res.status(400).json({ error: "Minimum to'ldirish miqdori 1,000 UZS" });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reference = generateReference();

    // Add to wallet
    await client.query(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
      [amount, userId]
    );

    // Record transaction
    const txResult = await client.query(
      `INSERT INTO transactions (receiver_id, amount, type, status, description, reference)
       VALUES ($1, $2, 'topup', 'completed', $3, $4) RETURNING *`,
      [userId, amount, description || "Karta to'ldirish", reference]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, body, type)
       VALUES ($1, 'Hisob to\'ldirildi ✅', $2, 'topup')`,
      [userId, `${parseFloat(amount).toLocaleString()} UZS hisobingizga qo'shildi`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      transaction: txResult.rows[0],
      message: `${parseFloat(amount).toLocaleString()} UZS hisob to'ldirildi`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  } finally {
    client.release();
  }
}

// Get transaction history
async function getHistory(req, res) {
  const userId = req.userId;
  const { page = 1, limit = 20, type, status } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = `WHERE (t.sender_id = $1 OR t.receiver_id = $1)`;
    const params = [userId];
    let paramCount = 2;

    if (type) {
      whereClause += ` AND t.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    if (status) {
      whereClause += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    const result = await db.query(
      `SELECT 
        t.*,
        CASE WHEN t.sender_id = $1 THEN 'debit' ELSE 'credit' END as direction,
        s.full_name as sender_name, s.phone as sender_phone,
        r.full_name as receiver_name, r.phone as receiver_phone
       FROM transactions t
       LEFT JOIN users s ON s.id = t.sender_id
       LEFT JOIN users r ON r.id = t.receiver_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM transactions t ${whereClause}`,
      params
    );

    res.json({
      success: true,
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
}

// Get single transaction
async function getTransaction(req, res) {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await db.query(
      `SELECT t.*,
        CASE WHEN t.sender_id = $2 THEN 'debit' ELSE 'credit' END as direction,
        s.full_name as sender_name, s.phone as sender_phone,
        r.full_name as receiver_name, r.phone as receiver_phone
       FROM transactions t
       LEFT JOIN users s ON s.id = t.sender_id
       LEFT JOIN users r ON r.id = t.receiver_id
       WHERE t.id = $1 AND (t.sender_id = $2 OR t.receiver_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tranzaksiya topilmadi' });
    }

    res.json({ success: true, transaction: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
}

// Get statistics
async function getStats(req, res) {
  const userId = req.userId;
  const { period = '30' } = req.query; // days

  try {
    const stats = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN receiver_id = $1 AND type IN ('receive','topup') THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN sender_id = $1 AND type IN ('send','payment') THEN amount ELSE 0 END), 0) as total_out,
        COUNT(CASE WHEN sender_id = $1 OR receiver_id = $1 THEN 1 END) as total_count
       FROM transactions
       WHERE (sender_id = $1 OR receiver_id = $1)
         AND created_at >= NOW() - INTERVAL '${parseInt(period)} days'
         AND status = 'completed'`,
      [userId]
    );

    const wallet = await db.query(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        ...stats.rows[0],
        balance: wallet.rows[0]?.balance || 0,
        period: parseInt(period),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
}

module.exports = { sendMoney, topUp, getHistory, getTransaction, getStats };
