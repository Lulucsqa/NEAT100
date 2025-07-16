const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

console.log('Starting server...');
console.log('Current directory:', __dirname);

// Serve arquivos estáticos
app.use(express.static(__dirname));
console.log('Static files middleware configured');

// Rota principal
app.get('/', (req, res) => {
    console.log('Received request for /');
    try {
        const indexPath = path.join(__dirname, 'index.html');
        console.log('Serving index.html from:', indexPath);
        res.sendFile(indexPath);
    } catch (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error serving index.html');
    }
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Error in middleware:', err);
    res.status(500).send('Something broke!');
});

// Inicia o servidor
try {
    const server = app.listen(port, '0.0.0.0', (err) => {
        if (err) {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
        console.log(`Server running at http://localhost:${port}`);
        console.log('Press Ctrl+C to stop');
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
    });
} catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
}
