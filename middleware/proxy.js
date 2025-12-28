const { createProxyMiddleware } = require('http-proxy-middleware');
const { sendError } = require('../utils/errorResponse');
const config = require("../config/gateway.config")

function fixProxyRequestBody(proxyReq, req) {
    // Only if body was parsed
    if (!req.body) return;

    // Only for JSON requests that Express parsed
    if (!req.is('application/json')) return;

    const bodyData = JSON.stringify(req.body);

    // Preserve original content-type if present
    const contentType = req.headers['content-type'] || 'application/json';

    proxyReq.setHeader('Content-Type', contentType);
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

    proxyReq.write(bodyData);
}

const createServiceProxy = (serviceName, serviceConfig) => {
    const internalPath = serviceConfig.basePath || '';
    return createProxyMiddleware({
        target: serviceConfig.target,
        changeOrigin: true,
        proxyTimeout: serviceConfig.timeout,
        timeout: serviceConfig.timeout,
        pathRewrite: (path) => {
            const rewrittenPath = internalPath + path;
            return rewrittenPath.replace(/\/+/g, '/');
        },
        on: {
            proxyReq: (proxyReq, req) => {
                proxyReq.setHeader('X-Request-ID', req.requestId);

                fixProxyRequestBody(proxyReq, req);
                // logging
                if (config.logging.enabled) {
                    const level = config.logging.level || 'info';
                    console[level](
                        `[${req.requestId}] ➜ ${serviceName}: ${req.method} ${req.originalUrl} -> ${serviceConfig.target}${proxyReq.path}`
                    );
                }
            },
            proxyRes: (proxyRes, req) => {
                // Log response
                if (config.logging.enabled) {
                    console.info(
                        `[${req.requestId}] ← ${serviceName}: ${proxyRes.statusCode} (${proxyRes.headers['content-length'] || 0} bytes)`
                    );
                }
            },
            error: (err, req, res) => {
                console.error(`[${req.requestId}] (${serviceName}):`, err.message);
    
                if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
                    return sendError(res, 504, 'Gateway Timeout', `${serviceName} service took too long to respond.`, req.requestId);
                }
                if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                    return sendError(res, 502, 'Bad Gateway', `${serviceName} service is currently unreachable`, req.requestId);
                }
                sendError(res, 502, 'Bad Gateway', 'An unexpected error occurred while proxying the request', req.requestId);
            }
        }
    })
}

module.exports = createServiceProxy;