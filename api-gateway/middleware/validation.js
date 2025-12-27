const { sendError } = require('../utils/errorResponse');

const requestValidator = (req, res, next) => {
    if(['POST', 'PUT', 'PATCH'].includes(req.method)){
        const contentType = req.headers['content-type'];
        const contentLength = parseInt(req.headers['content-length']);
        
        if (!contentType) {
            console.warn(`[${req.requestId}] Missing Content-Type`);
            return sendError(res, 400, 'Bad Request', 'Missing Content-Type', req.requestId);
        }
        if (contentLength > 10 * 1024 * 1024) { // 10MB Hard Limit
            return sendError(res, 413, 'Payload Too Large', 'Payload too large (Max 10MB)', req.requestId);
        }
    }
    next();
}
module.exports = requestValidator