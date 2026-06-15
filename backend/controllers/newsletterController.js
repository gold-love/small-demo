const Newsletter = require('../models/Newsletter');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeNewsletter = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const existing = await Newsletter.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        await Newsletter.create({ email });
        res.status(201).json({ message: 'Successfully subscribed to the newsletter!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { subscribeNewsletter };
