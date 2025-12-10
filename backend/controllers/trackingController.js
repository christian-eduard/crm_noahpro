const db = require('../config/database');

// Track proposal view
const trackProposalView = async (req, res) => {
    try {
        const { token } = req.params;
        const { duration } = req.body;

        // Get proposal ID from token
        const proposalResult = await db.query(
            'SELECT id, lead_id FROM proposals WHERE token = $1',
            [token]
        );

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        const proposal = proposalResult.rows[0];

        // Get client IP
        const ipAddress = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress;

        // Get user agent
        const userAgent = req.headers['user-agent'];

        // Save view
        await db.query(
            `INSERT INTO proposal_views (proposal_id, ip_address, user_agent, duration_seconds, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                proposal.id,
                ipAddress,
                userAgent,
                duration || 0,
                JSON.stringify({
                    referrer: req.headers.referer,
                    language: req.headers['accept-language']
                })
            ]
        );

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.emit('proposal_viewed', {
                proposalId: proposal.id,
                leadId: proposal.lead_id,
                viewedAt: new Date(),
                ipAddress: ipAddress?.split(',')[0] // First IP if multiple
            });
        }

        res.json({ message: 'Visualización registrada' });
    } catch (error) {
        console.error('Error tracking proposal view:', error);
        res.status(500).json({ error: 'Error al registrar visualización' });
    }
};

// Get proposal views
const getProposalViews = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT 
                id,
                viewed_at,
                ip_address,
                user_agent,
                duration_seconds,
                metadata
             FROM proposal_views
             WHERE proposal_id = $1
             ORDER BY viewed_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting proposal views:', error);
        res.status(500).json({ error: 'Error al obtener visualizaciones' });
    }
};

// Get proposal analytics
const getProposalAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await db.query(
            `SELECT 
                COUNT(*) as total_views,
                COUNT(DISTINCT ip_address) as unique_views,
                AVG(duration_seconds) as avg_duration,
                MAX(viewed_at) as last_viewed
             FROM proposal_views
             WHERE proposal_id = $1`,
            [id]
        );

        const viewsByDay = await db.query(
            `SELECT 
                DATE(viewed_at) as date,
                COUNT(*) as views
             FROM proposal_views
             WHERE proposal_id = $1
             GROUP BY DATE(viewed_at)
             ORDER BY date DESC
             LIMIT 30`,
            [id]
        );

        res.json({
            stats: stats.rows[0],
            viewsByDay: viewsByDay.rows
        });
    } catch (error) {
        console.error('Error getting proposal analytics:', error);
        res.status(500).json({ error: 'Error al obtener analytics' });
    }
};

module.exports = {
    trackProposalView,
    getProposalViews,
    getProposalAnalytics
};
