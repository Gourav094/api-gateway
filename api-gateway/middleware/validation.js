const requestValidator = (req, res, next) => {
    if(['POST', 'PUT', 'PATCH'].includes(req.method)){
        const contentType = req.headers['content-type'];

        const contentLength = parseInt(req.headers['content-length']);
        
        if (!contentType) {
            console.warn(`[${req.requestId}] Missing Content-Type`);
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Missing Content-Type',
                requestId: req.requestId
            });
        }
        if (contentLength > 10 * 1024 * 1024) { // 10MB Hard Limit
            return res.status(413).json({ error: "Payload too large (Max 10MB)" });
        }
    }
    next();
}
module.exports = requestValidator