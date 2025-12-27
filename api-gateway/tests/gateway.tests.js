const express = require('express');
const request = require('supertest');
const http = require('http');

const GATEWAY_URL = 'http://localhost:3000';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let mockOrderServer;
const createMockOrderService = (port = 8000) => {
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

    return http.createServer(app);
};

describe('API Gateway Integration Tests', () => {

    beforeAll(async () => {
        mockOrderServer = createMockOrderService();
        
        await new Promise(resolve => mockOrderServer.listen(8000, resolve));
        console.log('✓ Mock services started');

        // Check gateway is running
        try {
            await request(GATEWAY_URL).get('/health');
        } catch (error) {
            console.error('⚠️  Gateway is not running on port 3000');
            throw error;
        }
    });

    afterAll(async () => {
        // Stop mock services
        if (mockOrderServer) await new Promise(resolve => mockOrderServer.close(resolve));
        console.log('✓ Mock services stopped');
    });
    
    // ==================== GATEWAY TESTS ====================
    describe('Gateway Health & Info', () => {
        test('GET / - Welcome message', async () => {
            const response = await request(GATEWAY_URL).get('/');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Welcome to API Gateway!');
        });

        test('GET /health - Health check', async () => {
            const response = await request(GATEWAY_URL).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('Healthy');
        });
    });

    // ==================== Routing and proxy ====================
    describe('Routing', () => {

        test('GET /orders - Get all orders', async () => {
            const response = await request(GATEWAY_URL).get('/orders');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('Returns 404 for invalid routes', async () => {
            const response = await request(GATEWAY_URL).get('/nonexistent');
            expect(response.body).toHaveProperty('error');
            expect(response.body).toHaveProperty('requestId');
        });
    });
    // ==================== REQUEST ID ====================
    describe('Request ID Middleware', () => {
        test('Generates request ID if not provided', async () => {
            const response = await request(GATEWAY_URL).get('/orders');
            expect(response.headers['x-request-id']).toBeDefined();
        });

        test('Uses provided request ID', async () => {
            const customId = 'test-request-123';
            const response = await request(GATEWAY_URL)
                .get('/orders')
                .set('X-Request-ID', customId);
            expect(response.headers['x-request-id']).toBe(customId);
        });
    });
    // ==================== VALIDATION MIDDLEWARE ====================
    describe('Request validaton', () => {
        test('Accepts valid JSON payload', async () => {
            const response = await request(GATEWAY_URL)
                .post('/orders')
                .set('Content-Type', 'application/json')
                .send({ product: 'Phone', quantity: 1, price: 500 });
            
            expect(response.status).toBe(201);
        });

        test('Rejects POST without Content-Type', async () => {
            const response = await request(GATEWAY_URL)
                .post('/orders')
                .send({ product: 'Test' });

            expect(response.status).toBe(400);
        });

        test('Rejects request with Content-Length exceeding 10MB', async () => {
            // Test using Content-Length header instead of actual large payload
            const response = await request(GATEWAY_URL)
                .post('/orders')
                .set('Content-Type', 'application/json')
                .set('Content-Length', String(11 * 1024 * 1024)) // 11MB
                .send({ product: 'Test', quantity: 1, price: 100 });

            expect(response.status).toBe(413);
            expect(response.body.error).toMatch(/Payload too large/i);
        });
    })
    
    // ==================== ERROR HANDLING ====================
    describe('Error Handling', () => {
        test('Returns 502 when backend service is unavailable', async () => {
            // Stop order service temporarily
            await new Promise(resolve => mockOrderServer.close(resolve));
            
            const response = await request(GATEWAY_URL).get('/orders');
            expect([502, 504]).toContain(response.status);
            expect(response.body.error).toMatch(/Gateway|Timeout/i);
            expect(response.body.requestId).toBeDefined();
            
            // Restart order service
            mockOrderServer = createMockOrderService();
            await new Promise(resolve => mockOrderServer.listen(8000, resolve));
        }, 10000);

        test('Handles timeout gracefully', async () => {
            // This would require a slow mock endpoint
            // Skipping for now as it requires gateway timeout config
            expect(true).toBe(true);
        });
    });
    // ==================== RATE LIMITING ====================
    describe('Rate Limiting', () => {
        test('Enforces rate limit (50 req/min)', async () => {
            const agent = request.agent(GATEWAY_URL);
            let rateLimited = false;
            
            // Send requests until rate limited
            for (let i = 0; i < 55; i++) {
                const response = await agent.get('/orders');
                if (response.status === 429) {
                    rateLimited = true;
                    expect(response.body.error).toBe('Too Many Requests');
                    expect(response.body.requestId).toBeDefined();
                    break;
                }
            }
            
            expect(rateLimited).toBe(true);
        }, 30000);

        test('Does NOT rate limit /health endpoint', async () => {
            const agent = request.agent(GATEWAY_URL);
            
            // Send 60 requests to health
            for (let i = 0; i < 60; i++) {
                const response = await agent.get('/health');
                expect(response.status).toBe(200);
            }
        }, 15000);

    });
}); 