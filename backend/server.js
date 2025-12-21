const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const http = require('http');
const path = require('path');
const logger = require('./config/logger');
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const socketIO = require('socket.io');
const io = socketIO(server, {
    cors: {
        origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize socket instance for use in other modules
const socketInstance = require('./socket/socketInstance');
socketInstance.initSocketIO(io);

// Setup chat handler
const chatHandler = require('./socket/chatHandler');
chatHandler(io);

const PORT = process.env.PORT || 3002;

// Trust proxy for production (behind Nginx/load balancer)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Standard Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit -* ` headers
    legacyHeaders: false, // Disable the `X - RateLimit -* ` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Swagger Documentation (temporarily disabled due to startup issues)
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('./config/swagger');

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//     customCss: '.swagger-ui .topbar { display: none }',
//     customSiteTitle: 'NoahPro CRM API Docs'
// }));

// // API JSON endpoint
// app.get('/api-docs.json', (req, res) => {
//     res.setHeader('Content-Type', 'application/json');
//     res.send(swaggerSpec);
// });

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} `);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'leads-backend', timestamp: new Date().toISOString() });
});

// Routes
const trackingRoutes = require('./routes/tracking'); // Added import for tracking routes
app.use('/api/leads', require('./routes/leads'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/proposal-templates', require('./routes/proposalTemplates'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/export', require('./routes/export'));
app.use('/api/tracking', trackingRoutes); // Added use for tracking routes
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/leads/bulk', require('./routes/bulk'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/users', require('./routes/users'));
app.use('/api/email-templates', require('./routes/emailTemplates'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/invoices/public', require('./routes/invoicesPublic'));
app.use('/api/commercials', require('./routes/commercials'));
app.use('/api/training', require('./routes/training'));
app.use('/api/support', require('./routes/support'));
app.use('/api/automation', require('./routes/automation'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/hunter', require('./routes/leadHunter'));
app.use('/api/business-types', require('./routes/businessTypes'));
app.use('/api/hunter-strategies', require('./routes/hunterStrategies'));
app.use('/api/brain', require('./routes/brain'));
app.use('/api/calls', require('./routes/calls'));

// Initialize automation engine and services
const automationEngine = require('./services/automationEngine');
const webhookService = require('./services/webhookService');
const emailAutomation = require('./services/emailAutomationService');

// Load rules and webhooks on startup
(async () => {
    await automationEngine.loadRules();
    automationEngine.setupTimeTriggers();
    await webhookService.loadWebhooks();
    emailAutomation.setupCron();
})();

// Error handling
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message} `, { stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path} `);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(PORT, () => {
    logger.info(`🚀 Leads Backend running on port ${PORT}`);
    logger.info(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`);
    logger.info(`💬 Socket.io initialized`);
});

module.exports = app;
