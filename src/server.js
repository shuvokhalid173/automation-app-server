// server entry point

const http = require('http');
const app = require('./app');
const config = require('./configs');

const server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port} in ${config.env} mode`);
});

// graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
