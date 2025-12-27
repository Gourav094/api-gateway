const rateLimit = require('express-rate-limit');


const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[${req.requestId}] RATE_LIMIT_EXCEEDED: ${req.ip}`);
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in a minute.`,
            requestId: req.requestId
        });
    }
})

module.exports = rateLimiter;