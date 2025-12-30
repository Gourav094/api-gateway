const express = require('express');
const request = require('supertest');
const http = require('http');

// Set environment variables BEFORE requiring the gateway app
process.env.ORDERS_RATE_LIMIT_MAX = '100'; // High limit so other tests don't hit it
process.env.ORDERS_RATE_LIMIT_WINDOW = '60000';
process.env.NODE_ENV = 'test'; // Set test environment

const gateway = require('../gateway/app');

let mockOrderServer;

const createMockOrderService = () => {
    const app = express();
    app.use(express.json());

    let orders = [
        { id: 1, product: 'Laptop', quantity: 1, price: 1200, status: 'pending' }
    ];

    app.get('/', (req, res) => {
        res.json({ success: true, data: orders });
    });

    app.get('/:id', (req, res) => {
        const order = orders.find(o => o.id === parseInt(req.params.id));
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({ success: true, data: order });
    });

    app.post('/', (req, res) => {
        const { product, quantity, price } = req.body;
        if (!product || !quantity || !price) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const newOrder = { id: orders.length + 1, product, quantity, price, status: 'pending' };
        orders.push(newOrder);
        res.status(201).json({ success: true, data: newOrder });
    });

    app.put('/:id', (req, res) => {
        const order = orders.find(o => o.id === parseInt(req.params.id));
        if (!order) return res.status(404).json({ success: false });
        Object.assign(order, req.body);
        res.json({ success: true, data: order });
    });

    app.delete('/:id', (req, res) => {
        const index = orders.findIndex(o => o.id === parseInt(req.params.id));
        if (index === -1) return res.status(404).json({ success: false });
        orders.splice(index, 1);
        res.json({ success: true, message: 'Order deleted' });
    });

    return app;
};

describe('API Gateway Integration Tests', () => {

    beforeAll((done) => {
        const app = createMockOrderService();
        mockOrderServer = app.listen(8000, () => {
            console.log('✓ Mock order service started on port 8000');
            done();
        });
    });

    afterAll((done) => {
        if (mockOrderServer) {
            mockOrderServer.close(() => {
                console.log('✓ Mock order service stopped');
                done();
            });
        } else {
            done();
        }
    });

    // ==================== GATEWAY TESTS ====================
    describe('Gateway Health & Info', () => {
        test('GET / - Welcome message', async () => {
            const response = await request(gateway).get('/');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Welcome to API Gateway!');
        });

        test('GET /health - Health check', async () => {
            const response = await request(gateway).get('/health');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('Healthy');
        });
    });

    // ==================== Routing and proxy ====================
    describe('Routing', () => {

        test('GET /orders - Get all orders', async () => {
            const response = await request(gateway).get('/orders');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('Returns 404 for invalid routes', async () => {
            const response = await request(gateway).get('/nonexistent');
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('requestId');
        });
    });
    // ==================== REQUEST ID ====================
    describe('Request ID Middleware', () => {
        test('Generates request ID if not provided', async () => {
            const response = await request(gateway).get('/orders');
            expect(response.headers['x-request-id']).toBeDefined();
        });

        test('Uses provided request ID', async () => {
            const response = await request(gateway)
                .get('/orders')
                .set('X-Request-ID', 'test-request-123');

            expect(response.headers['x-request-id']).toBe('test-request-123');
        });
    });
    // ==================== VALIDATION MIDDLEWARE ====================
    describe('Request validation', () => {

        test('Accepts valid JSON payload', async () => {
            const response = await request(gateway)
                .post('/orders')
                .set('Content-Type', 'application/json')
                .send({ product: 'Phone', quantity: 1, price: 500 });

            expect(response.status).toBe(201);
        });

        test('Rejects POST without Content-Type', async () => {
            const response = await request(gateway)
                .post('/orders')
                .send({ product: 'Test' });

            expect(response.status).toBe(400);
        });

    });

    // ==================== RATE LIMITING ====================
    describe('Rate Limiting', () => {

        test('Does not rate limit /health', async () => {
            for (let i = 0; i < 5; i++) {
                const response = await request(gateway).get('/health');
                expect(response.status).toBe(200);
            }
        });

    });
});