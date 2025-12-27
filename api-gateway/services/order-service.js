const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// In-memory storage
let orders = [
    { id: 1, product: 'Laptop', quantity: 1, price: 1200, status: 'pending' },
    { id: 2, product: 'Mouse', quantity: 2, price: 25, status: 'completed' }
];

app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || req.headers['X-Request-ID'] || 'no-id';
    console.log(`[${requestId}] [ORDERS SERVICE] ${req.method} ${req.path}`); 
    next();
});

// Get all orders
app.get('/', (req, res) => {
    res.json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// Get order by ID
app.get('/orderId/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }
    
    res.json({
        success: true,
        data: order
    });
});

// Create new order
app.post('/', (req, res) => {
    const { product, quantity, price } = req.body;
    
    if (!product || !quantity || !price) {
        return res.status(400).json({
            success: false,
            message: 'Please provide product, quantity, and price'
        });
    }
    
    const newOrder = {
        id: orders.length + 1,
        product,
        quantity,
        price,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    
    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: newOrder
    });
});

// Update order
app.put('/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }
    
    const { product, quantity, price, status } = req.body;
    
    if (product) order.product = product;
    if (quantity) order.quantity = quantity;
    if (price) order.price = price;
    if (status) order.status = status;
    order.updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Order updated successfully',
        data: order
    });
});

// Delete order
app.delete('/:id', (req, res) => {
    const orderIndex = orders.findIndex(o => o.id === parseInt(req.params.id));
    
    if (orderIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Order not found'
        });
    }
    
    orders.splice(orderIndex, 1);
    
    res.json({
        success: true,
        message: 'Order deleted successfully'
    });
});

// Health check
app.get('/health/check', (req, res) => {
    res.json({
        service: 'Orders Service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Orders Service running on port ${PORT}`);
});

module.exports = app;