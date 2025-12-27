const { sendError } = require('../utils/errorResponse');
const config = require('../config/gateway.config');

const requestValidator = (req, res, next) => {
    if(['POST', 'PUT', 'PATCH'].includes(req.method)){
        const contentType = req.headers['content-type'];
        const contentLength = parseInt(req.headers['content-length']);
        
        if (!contentType) {
            console.warn(`[${req.requestId}] Missing Content-Type`);
            return sendError(res, 400, 'Bad Request', 'Missing Content-Type', req.requestId);
        }
    }
    next();
}
module.exports = requestValidator