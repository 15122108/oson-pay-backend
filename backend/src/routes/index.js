const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const txCtrl = require('../controllers/transactionController');
const cardCtrl = require('../controllers/cardController');

// ─── AUTH ───────────────────────────────────────────────
router.post('/auth/send-otp', authCtrl.sendOTP);
router.post('/auth/verify-otp', authCtrl.verifyOTP);
router.get('/auth/profile', auth, authCtrl.getProfile);
router.put('/auth/profile', auth, authCtrl.updateProfile);
router.post('/auth/logout', auth, authCtrl.logout);

// ─── TRANSACTIONS ────────────────────────────────────────
router.post('/transactions/send', auth, txCtrl.sendMoney);
router.post('/transactions/topup', auth, txCtrl.topUp);
router.get('/transactions', auth, txCtrl.getHistory);
router.get('/transactions/stats', auth, txCtrl.getStats);
router.get('/transactions/:id', auth, txCtrl.getTransaction);

// ─── CARDS ───────────────────────────────────────────────
router.get('/cards', auth, cardCtrl.getCards);
router.post('/cards', auth, cardCtrl.addCard);
router.put('/cards/:cardId/default', auth, cardCtrl.setDefault);
router.delete('/cards/:cardId', auth, cardCtrl.deleteCard);

// ─── HEALTH CHECK ────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
