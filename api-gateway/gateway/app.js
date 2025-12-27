const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware');
const requestIdMiddleware = require('../middleware/requestId.middleware');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(requestIdMiddleware);

app.get('/health', (req,res) => {
    res.status(200).json({
        status: "Healthy",
        timestamp: new Date().toISOString()
    })
})

const createProxyConfig = (target, serviceName) => ({
    target,
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 11000,
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
            res.status(503).json({ 
                error: `${serviceName} service unavailable`,
                message: err.message 
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

const server = app.listen(PORT,() => {
    console.log(` Api gateway running on ${PORT}`)
})

process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

