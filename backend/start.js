#!/usr/bin/env node
// Script de inicio rápido para diagnóstico
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const http = require('http');
const logger = require('./config/logger');

const app = express();
const server = http.createServer(app);

// Cargar Socket.io
const socketIO = require('socket.io');
const io = socketIO(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5174', methods: ['GET', 'POST'] }
});
const socketInstance = require('./socket/socketInstance');
socketInstance.initSocketIO(io);
const chatHandler = require('./socket/chatHandler');
chatHandler(io);

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'leads-backend', timestamp: new Date().toISOString() });
});

// Cargar rutas de forma segura
const routes = [
    { path: '/api/leads', module: './routes/leads' },
    { path: '/api/proposals', module: './routes/proposals' },
    { path: '/api/proposal-templates', module: './routes/proposalTemplates' },
    { path: '/api/chat', module: './routes/chat' },
    { path: '/api/meetings', module: './routes/meetings' },
    { path: '/api/auth', module: './routes/auth' },
    { path: '/api/analytics', module: './routes/analytics' },
    { path: '/api/export', module: './routes/export' },
    { path: '/api/tracking', module: './routes/tracking' },
    { path: '/api/settings', module: './routes/settings' },
    { path: '/api/notifications', module: './routes/notifications' },
    { path: '/api/tags', module: './routes/tags' },
    { path: '/api/activities', module: './routes/activities' },
    { path: '/api/leads/bulk', module: './routes/bulk' },
    { path: '/api/tasks', module: './routes/tasks' },
    { path: '/api/calendar', module: './routes/calendar' },
    { path: '/api/clients', module: './routes/clients' },
    { path: '/api/users', module: './routes/users' },
    { path: '/api/email-templates', module: './routes/emailTemplates' },
    { path: '/api/invoices', module: './routes/invoices' },
    { path: '/api/invoices/public', module: './routes/invoicesPublic' },
    { path: '/api/commercials', module: './routes/commercials' },
    { path: '/api/training', module: './routes/training' },
    { path: '/api/support', module: './routes/support' },
];

routes.forEach(({ path, module }) => {
    try {
        app.use(path, require(module));
        console.log(`✅ Loaded: ${path}`);
    } catch (err) {
        console.error(`❌ Error loading ${path}: ${err.message}`);
    }
});

// Error handling
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`);
    console.log(`💬 Socket.io initialized`);
});

module.exports = app;
