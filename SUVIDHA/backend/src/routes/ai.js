const express = require('express');
const router = express.Router();
const axios = require('axios');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

// Stricter rate limit for AI endpoint — 10 req/min per IP
const aiLimiter = rateLimit({ windowMs: 60000, max: 10, message: { error: 'AI rate limit reached' } });

// POST /api/ai/chat — proxy to GPT-2 FastAPI server
router.post('/chat', aiLimiter, async (req, res, next) => {
    const schema = Joi.object({
        message: Joi.string().min(1).max(500).required(),
        language: Joi.string().valid('en', 'hi').default('en'),
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const aiUrl = process.env.AI_SERVER_URL;
    if (!aiUrl) return res.status(503).json({ error: 'AI server not configured' });

    try {
        const response = await axios.post(`${aiUrl}/chat`, {
            message: value.message,
            language: value.language,
        }, { timeout: 15000 });

        res.json({ success: true, reply: response.data.reply });
    } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            return res.status(503).json({ error: 'AI server is offline' });
        }
        next(err);
    }
});

module.exports = router;
