const express = require('express')
const cors = require('cors');
const requestIdMiddleware = require('../middleware/requestId.middleware');
const rateLimiter = require('../middleware/ratelimiter');
const requestValidator = require('../middleware/validation');
const config = require('../config/gateway.config');
const { sendError } = require('../utils/errorResponse');
const createServiceProxy = require('../middleware/proxy');

require('dotenv').config();

const app = express();
app.set('trust proxy', config.gateway.trustProxy);

// parse json payload
app.use(express.json({ limit: config.gateway.bodyLimit || '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.cors?.enabled === true) {
    app.use(cors(config.cors.options));
}

// Request ID tracing for each request
app.use(requestIdMiddleware);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: "Healthy",
        timestamp: new Date().toISOString(),
        environment: config.gateway.environment || "development",
    })
})

// Global limiter
if (config.gateway.rateLimit.enabled) {
    app.use(rateLimiter(config.gateway.rateLimit))
}

app.use(requestValidator)

Object.entries(config.services).forEach(([serviceKey, serviceConfig]) => {
    if (serviceConfig.enabled === false) {
        return;
    }
    const middlewares = []
    if (serviceConfig.rateLimit && serviceConfig.rateLimit.enabled) {
        middlewares.push(rateLimiter(serviceConfig.rateLimit));
    }
    middlewares.push(createServiceProxy(serviceConfig.name, serviceConfig));
    app.use(serviceConfig.route, ...middlewares);
    
    console.log(`✓ Service [${serviceConfig.name}] registered on ${serviceConfig.route}`);
});

app.get("/", (req, res) => {
    res.status(200).json({ 
        message: "Welcome to API Gateway!",
        version: '1.0.0',
        environment: config.gateway.environment
    })
})

app.use((req, res, next) => {
    sendError(res, 404, 'Not Found', 'The requested resource does not exist', req.requestId);
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] Error:`, err.message);
    sendError(res, err.status || 500, err.message || 'Internal Server Error', 'An unexpected error occurred', req.requestId);
})
module.exports = app