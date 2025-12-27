const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/errorResponse');

const rateLimiter = (serviceConfig) => {
    return rateLimit({
        windowMs: serviceConfig.windowMs,
        max: serviceConfig.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            const retryAfter = res.getHeader('Retry-After');

            console.warn(`[${req.requestId}] RATE_LIMIT_EXCEEDED: ${req.ip} on ${req.path} `+`(retry after ${retryAfter}s)`);
            sendError(res, 429, 'Too Many Requests', `Rate limit exceeded. Try again in ${retryAfter} seconds.`, req.requestId);
        }
    })
}

module.exports = rateLimiter;