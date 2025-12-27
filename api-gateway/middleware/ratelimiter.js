const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/errorResponse');

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[${req.requestId}] RATE_LIMIT_EXCEEDED: ${req.ip}`);
        sendError(res, 429, 'Too Many Requests', 'Rate limit exceeded. Try again in a minute.', req.requestId);
    }
})

module.exports = rateLimiter;