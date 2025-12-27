const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware');
const requestIdMiddleware = require('../middleware/requestId.middleware');
const rateLimiter = require('../middleware/ratelimiter');
const requestValidator = require('../middleware/validation');

const app = express();
app.set('trust proxy', 1);

app.use(requestIdMiddleware);

app.get('/health', (req,res) => {
    res.status(200).json({
        status: "Healthy",
        timestamp: new Date().toISOString()
    })
})

app.use(rateLimiter)

app.use(requestValidator)

const createProxyConfig = (target, serviceName) => ({
    target,
    changeOrigin: true,
    connectTimeout: 5000,
    proxyTimeout: 5000,
    pathRewrite: (path) => path.replace(new RegExp(`^/${serviceName.toLowerCase()}`), ''),
    on: {
        proxyReq: (proxyReq, req) => {
            proxyReq.setHeader('X-Request-ID', req.requestId);
            console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} -> ${serviceName}`);
        },
        proxyRes: (proxyRes, req) => {
            console.log(`[${req.requestId}] ${proxyRes.statusCode} from ${serviceName}`);
        },
        error: (err, req, res) => {
            console.error(`[${req.requestId}] (${serviceName}):`, err.message);

            if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
                return res.status(504).json({
                    error: 'Gateway Timeout',
                    message: `${serviceName} service took too long to respond.`,
                    requestId: req.requestId
                });
            }

            res.status(502).json({ 
                error: 'Bad Gateway',
                message: `${serviceName} service is unreachable.` 
            });
        }
    }
});

app.use('/orders', createProxyMiddleware(createProxyConfig('http://localhost:8000', 'Orders')));

app.use("/payments", createProxyMiddleware(createProxyConfig('http://localhost:8001', 'Payments')));


// parse json payload
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req,res) => {
    res.status(200).json({message: "Welcome to API Gateway!"})
})

// Global error handler
app.use((err, req, res, next) => {
    console.log('Error', err.message);
    res.status(500).json({
        error: err.message || "Internal server error"
    })
})
module.exports = app