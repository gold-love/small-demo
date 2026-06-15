const express = require('express');
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getFeedback);

// Public can submit feedback, but if logged in, we'll track the user
router.post('/', (req, res, next) => {
    // Optional auth: try to find user but don't block if not logged in
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
}, submitFeedback);

module.exports = router;
