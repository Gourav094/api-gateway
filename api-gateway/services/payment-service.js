const express = require('express');
const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());

// In-memory storage
let payments = [
    { id: 1, orderId: 1, amount: 1200, method: 'credit_card', status: 'completed', transactionId: 'TXN001' },
    { id: 2, orderId: 2, amount: 50, method: 'paypal', status: 'completed', transactionId: 'TXN002' }
];

// Get all payments
app.get('/', (req, res) => {
    res.json({
        success: true,
        count: payments.length,
        data: payments
    });
});

// Get payment by ID
app.get('/:id', (req, res) => {
    const payment = payments.find(p => p.id === parseInt(req.params.id));
    
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    
    res.json({
        success: true,
        data: payment
    });
});

// Get payments by order ID
app.get('/order/:orderId', (req, res) => {
    const orderPayments = payments.filter(p => p.orderId === parseInt(req.params.orderId));
    
    res.json({
        success: true,
        count: orderPayments.length,
        data: orderPayments
    });
});

// Process payment
app.post('/', (req, res) => {
    const { orderId, amount, method } = req.body;
    
    if (!orderId || !amount || !method) {
        return res.status(400).json({
            success: false,
            message: 'Please provide orderId, amount, and payment method'
        });
    }
    
    // Simulate payment processing
    const isSuccess = Math.random() > 0.1; // 90% success rate
    
    const newPayment = {
        id: payments.length + 1,
        orderId,
        amount,
        method,
        status: isSuccess ? 'completed' : 'failed',
        transactionId: `TXN${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    
    payments.push(newPayment);
    
    res.status(isSuccess ? 201 : 402).json({
        success: isSuccess,
        message: isSuccess ? 'Payment processed successfully' : 'Payment failed',
        data: newPayment
    });
});

// Refund payment
app.post('/:id/refund', (req, res) => {
    const payment = payments.find(p => p.id === parseInt(req.params.id));
    
    if (!payment) {
        return res.status(404).json({
            success: false,
            message: 'Payment not found'
        });
    }
    
    if (payment.status !== 'completed') {
        return res.status(400).json({
            success: false,
            message: 'Only completed payments can be refunded'
        });
    }
    
    payment.status = 'refunded';
    payment.refundedAt = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Payment refunded successfully',
        data: payment
    });
});

// Health check
app.get('/health/check', (req, res) => {
    res.json({
        service: 'Payments Service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Payments Service running on port ${PORT}`);
});

module.exports = app;