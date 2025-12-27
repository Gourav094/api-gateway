const { v4: uuidv4 } = require('uuid');

const requestIdMiddleware = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    
    console.log(`[${requestId}] [GATEWAY] ${req.method} ${req.originalUrl} - Request received`);
    
    next();
};

module.exports = requestIdMiddleware;