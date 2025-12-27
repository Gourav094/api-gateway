const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;


const orderProxy = createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 11000,
    pathRewrite: {
        '^/orders': '' // remove /orders prefix before forwaring the whole endpoint
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY RESPONSE] ${proxyRes.statusCode} from orders service`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]:', err.message);
        res.status(503).json({ 
            error: 'Orders service unavailable',
            message: err.message 
        });
    }
})

const paymentProxy = createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 11000,
    pathRewrite: {
        '^/payments': ''
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY RESPONSE] ${proxyRes.statusCode} from payments service`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]:', err.message);
        res.status(503).json({ 
            error: 'Payment service unavailable',
            message: err.message 
        });
    }
})


app.use('/orders', orderProxy);

app.use("/payments", paymentProxy);


// parse json payload
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req,res) => {
    res.status(200).json({message: "Welcome to API Gateway!"})
})

app.get('/health', (req,res) => {
    res.status(200).json({
        status: "Healthy",
        timestamp: new Date().toISOString()
    })
})



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

module.exports = app;