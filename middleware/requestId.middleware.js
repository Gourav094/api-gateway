const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    console.log(`[${requestId}] [GATEWAY] ${req.method} ${req.originalUrl} - Request received`);
    
    next();
};

module.exports = requestIdMiddleware;