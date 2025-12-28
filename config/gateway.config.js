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
    cors: {
        enabled: false,              
        options: {
          origin: ['http://localhost:8000'],
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
          credentials: true,
          maxAge: 86400
        }
    },
    services: {
        orders: {
            name: 'orders',
            enabled: process.env.ORDERS_ENABLED !== 'false',
            target: process.env.ORDERS_TARGET || 'http://localhost:8000',
            route: '/orders',
            basePath: '/',
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
            basePath: '/',
            timeout: parseInt(process.env.ORDERS_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.PAYMENTS_RATE_LIMIT_WINDOW) || 60000, //per minute
                max: parseInt(process.env.PAYMENTS_RATE_LIMIT_MAX) || 50, // 50 req
                message: 'Payments service rate limit exceeded.'
            }
        },
        email:{
            name: 'email-service',
            enabled: process.env.EMAIL_ENABLED !== 'false',
            target: process.env.EMAIL_TARGET || 'http://localhost:4002',
            route: '/emails',
            basePath: '/',
            timeout: parseInt(process.env.EMAIL_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.EMAIL_RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.EMAIL_RATE_LIMIT_MAX) || 50,
                message: 'Email service rate limit exceeded.'
            }
        },
        chat:{
            name: 'chat-service',
            enabled: process.env.CHAT_ENABLED !== 'false',
            target: process.env.CHAT_TARGET || 'http://localhost:4005',
            route: '/chats',
            basePath: '/',
            timeout: parseInt(process.env.CHAT_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.CHAT_RATE_LIMIT_MAX) || 50,
                message: 'Chat service rate limit exceeded.'
            }
        },
        auth:{
            name: 'auth-service',
            enabled: process.env.AUTH_ENABLED !== 'false',
            target: process.env.AUTH_TARGET || 'http://localhost:4001',
            route: '/auth',
            basePath: '/api/v1',
            timeout: parseInt(process.env.AUTH_TIMEOUT) || 5000,
            rateLimit: {
                enabled: true,
                windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 60000,
                max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 50,
                message: 'Auth service rate limit exceeded.'
            }
        }
    },
    logging: {
        enabled: process.env.LOGGING_ENABLED !== 'false',
        level: process.env.LOG_LEVEL || 'info', // log, info, warn, error
        colorize: process.env.LOG_COLORIZE !== 'false',
        includeTimestamp: true
    }
}