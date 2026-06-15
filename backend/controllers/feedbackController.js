const Feedback = require('../models/Feedback');

const submitFeedback = async (req, res) => {
    const { sentiment, comment } = req.body;

    if (!sentiment) {
        return res.status(400).json({ message: 'Please select Like or Dislike' });
    }

    try {
        const feedback = await Feedback.create({
            userId: req.user ? req.user.id : null,
            sentiment,
            comment
        });

        res.status(201).json({ 
            success: true, 
            message: 'Thank you for your feedback! ❤️', 
            data: feedback 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFeedback = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const feedback = await Feedback.findAll({
            include: [{ model: require('../models/User'), attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitFeedback, getFeedback };
