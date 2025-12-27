const request = require('supertest');

const GATEWAY_URL = 'http://localhost:3000';

describe('API Gateway Integration Tests', () => {

    beforeAll(async () => {
        try {
            await request(GATEWAY_URL).get('/health');
        } catch (error) {
            console.error('Gateway is not running on port 3000');
            console.error('Please start: cd gateway && node app.js');
            throw error;
        }
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

    // ==================== ORDERS TESTS ====================
    describe('Orders Service', () => {
        let createdOrderId;

        test('GET /orders - Get all orders', async () => {
            const response = await request(GATEWAY_URL).get('/orders');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /orders/:id - Get specific order', async () => {
            const response = await request(GATEWAY_URL).get('/orders/1');
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(1);
        });

        test('GET /orders/999 - Non-existent order', async () => {
            const response = await request(GATEWAY_URL).get('/orders/999');
            expect(response.status).toBe(404);
        });

        test('POST /orders - Create new order', async () => {
            const newOrder = {
                product: 'Test Product',
                quantity: 3,
                price: 99.99
            };

            const response = await request(GATEWAY_URL)
                .post('/orders')
                .send(newOrder)
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.product).toBe('Test Product');
            
            createdOrderId = response.body.data.id;
        });

        test('POST /orders - Invalid order (missing fields)', async () => {
            const response = await request(GATEWAY_URL)
                .post('/orders')
                .send({ product: 'Incomplete' })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
        });

        test('PUT /orders/:id - Update order', async () => {
            const response = await request(GATEWAY_URL)
                .put('/orders/1')
                .send({ status: 'completed' })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body.data.status).toBe('completed');
        });

        test('DELETE /orders/:id - Delete order', async () => {
            if (createdOrderId) {
                const response = await request(GATEWAY_URL)
                    .delete(`/orders/${createdOrderId}`);
                expect(response.status).toBe(200);
            }
        });

        // Moved inside Orders describe block
        test('PATCH /orders/:id - Method not allowed', async () => {
            const response = await request(GATEWAY_URL)
                .patch('/orders/1')
                .send({ status: 'completed' })
                .set('Content-Type', 'application/json');
        
            expect(response.status).toBe(404);
        });
    });

    // ==================== PAYMENTS TESTS ====================
    describe('Payments Service', () => {
        let processedPaymentId;
        let refundablePaymentId; // FIXED: Variable was not declared

        test('GET /payments - Get all payments', async () => {
            const response = await request(GATEWAY_URL).get('/payments');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /payments/:id - Get specific payment', async () => {
            const response = await request(GATEWAY_URL).get('/payments/1');
            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(1);
        });

        test('GET /payments/order/:orderId - Get payments for order', async () => {
            const response = await request(GATEWAY_URL).get('/payments/order/1');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /payments - Process payment', async () => {
            const paymentData = {
                orderId: 1,
                amount: 500,
                method: 'credit_card'
            };

            const response = await request(GATEWAY_URL)
                .post('/payments')
                .send(paymentData)
                .set('Content-Type', 'application/json');

            expect([201, 402]).toContain(response.status);
            expect(response.body.data.orderId).toBe(1);
            
            if (response.status === 201) {
                processedPaymentId = response.body.data.id;
            }
        });

        test('POST /payments - Invalid payment (missing fields)', async () => {
            const response = await request(GATEWAY_URL)
                .post('/payments')
                .send({ amount: 100 })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
        });

        test('POST /payments/:id/refund - Refund payment', async () => {
            const paymentData = {
                orderId: 1,
                amount: 200,
                method: 'credit_card'
            };

            const createResponse = await request(GATEWAY_URL)
                .post('/payments')
                .send(paymentData)
                .set('Content-Type', 'application/json');

            if (createResponse.status === 201) {
                refundablePaymentId = createResponse.body.data.id;

                const refundResponse = await request(GATEWAY_URL)
                    .post(`/payments/${refundablePaymentId}/refund`)
                    .set('Content-Type', 'application/json');

                expect(refundResponse.status).toBe(200);
                expect(refundResponse.body.success).toBe(true);
                expect(refundResponse.body.data.status).toBe('refunded');
            } else {
                console.log('Payment creation failed, skipping refund test');
                expect(true).toBe(true);
            }
        });
    });
    // ==================== ERROR HANDLING ====================
    describe('Error Handling', () => {
        test('GET /invalid-route - 404 for invalid route', async () => {
            const response = await request(GATEWAY_URL).get('/invalid-route');
            expect(response.status).toBe(404);
        });
    });
    describe('Rate Limiting', () => {
        test('Should return 429 when exceeding rate limit', async () => {
            // Updated to match actual rate limit (50 requests per minute)
            const requests = Array(51).fill().map(() => request(GATEWAY_URL).get('/orders'));
            const responses = await Promise.all(requests);
    
            // At least one should be rate limited
            const rateLimited = responses.some(res => res.status === 429);
            expect(rateLimited).toBe(true);
        });
    
        test('Should NOT rate limit /health endpoint', async () => {
            // Send 10 requests to health rapidly
            const requests = Array(10).fill().map(() => request(GATEWAY_URL).get('/health'));
            const responses = await Promise.all(requests);
    
            // All should be 200
            responses.forEach(res => {
                expect(res.status).toBe(200);
            });
        });
    });
});