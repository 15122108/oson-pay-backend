const db = require('../config/database');

// Get user cards
async function getCards(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM cards WHERE user_id = $1 AND is_active = TRUE ORDER BY is_default DESC, created_at ASC`,
      [req.userId]
    );
    res.json({ success: true, cards: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik' });
  }
}

// Add card
async function addCard(req, res) {
  const { cardNumber, cardHolder, expiryMonth, expiryYear, cardType } = req.body;

  if (!cardNumber || cardNumber.length !== 16) {
    return res.status(400).json({ error: "Karta raqami noto'g'ri" });
  }

  try {
    // Check if card already exists for this user
    const existing = await db.query(
      `SELECT id FROM cards WHERE card_number = $1 AND user_id = $2`,
      [cardNumber, req.userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu karta allaqachon qo\'shilgan' });
    }

    // Check if user has no cards (first card = default)
    const cardCount = await db.query(
      `SELECT COUNT(*) FROM cards WHERE user_id = $1 AND is_active = TRUE`,
      [req.userId]
    );
    const isDefault = parseInt(cardCount.rows[0].count) === 0;

    // Card colors based on type
    const colors = {
      uzcard: { from: '#6C63FF', to: '#9B59FF' },
      humo: { from: '#00D4AA', to: '#0099CC' },
      visa: { from: '#1A1A2E', to: '#16213E' },
      mastercard: { from: '#FF4B6E', to: '#FF8C00' },
    };
    const color = colors[cardType] || colors.uzcard;

    const result = await db.query(
      `INSERT INTO cards (user_id, card_number, card_holder, expiry_month, expiry_year, card_type, is_default, color_from, color_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.userId, cardNumber, cardHolder, expiryMonth, expiryYear, cardType || 'uzcard', isDefault, color.from, color.to]
    );

    res.json({ success: true, card: result.rows[0], message: 'Karta qo\'shildi' });
  } catch (err) {
    res.status(500).json({ error: 'Karta qo\'shishda xatolik' });
  }
}

// Set default card
async function setDefault(req, res) {
  const { cardId } = req.params;
  try {
    await db.query(`UPDATE cards SET is_default = FALSE WHERE user_id = $1`, [req.userId]);
    await db.query(
      `UPDATE cards SET is_default = TRUE WHERE id = $1 AND user_id = $2`,
      [cardId, req.userId]
    );
    res.json({ success: true, message: 'Asosiy karta o\'rnatildi' });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik' });
  }
}

// Delete card
async function deleteCard(req, res) {
  const { cardId } = req.params;
  try {
    await db.query(
      `UPDATE cards SET is_active = FALSE WHERE id = $1 AND user_id = $2`,
      [cardId, req.userId]
    );
    res.json({ success: true, message: 'Karta o\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik' });
  }
}

module.exports = { getCards, addCard, setDefault, deleteCard };
