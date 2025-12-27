module.exports = {
    gateway: {
        port: process.env.PORT || 3000,
        trustProxy: 1,
        bodyLimit: '1mb',
        environment: process.env.NODE_ENV || 'development',
        maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE) || 10 * 1024 * 1024,
        rateLimit: {
            enabled: true,
            windowMs: 60000,
            max: 100
        }
    },
    services: {
        orders: {
            name: 'orders',
            enabled: process.env.ORDERS_ENABLED !== 'false',
            target: process.env.ORDERS_TARGET || 'http://localhost:8000',
            route: '/orders',
            timeout: parseInt(process.env.ORDERS_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.ORDERS_RATE_LIMIT_WINDOW) || 60000, //per minute
                max: parseInt(process.env.ORDERS_RATE_LIMIT_MAX) || 50, // 50 req
                message: 'Orders service rate limit exceeded.'
            }
        },
        payment: {
            name: 'payments',
            enabled: process.env.PAYMENTS_ENABLED !== 'false',
            target: process.env.PAYMENTS_TARGET || 'http://localhost:8001',
            route: '/payments',
            timeout: parseInt(process.env.ORDERS_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.PAYMENTS_RATE_LIMIT_WINDOW) || 60000, //per minute
                max: parseInt(process.env.PAYMENTS_RATE_LIMIT_MAX) || 50, // 50 req
                message: 'Payments service rate limit exceeded.'
            }
        },
    },
    logging: {
        enabled: process.env.LOGGING_ENABLED !== 'false',
        level: process.env.LOG_LEVEL || 'info', // log, info, warn, error
        colorize: process.env.LOG_COLORIZE !== 'false',
        includeTimestamp: true
    }
}