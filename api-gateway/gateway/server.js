const app = require('./app');

const PORT = process.env.PORT || 3000;

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

