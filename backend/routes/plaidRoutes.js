const express = require('express');
const router = express.Router();
const {
    createLinkToken,
    exchangePublicToken,
    syncTransactions
} = require('../controllers/plaidController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-link-token', protect, createLinkToken);
router.post('/exchange-public-token', protect, exchangePublicToken);
router.post('/sync-transactions', protect, syncTransactions);

module.exports = router;
