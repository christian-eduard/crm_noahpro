const db = require('../config/database');

// Track page visit
const trackVisit = async (req, res) => {
    try {
        const { page, referrer, sessionId } = req.body;
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.connection.remoteAddress;

        await db.query(
            `INSERT INTO visitor_analytics (session_id, page_url, referrer, user_agent, ip_address)
             VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, page, referrer, userAgent, ipAddress]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get analytics stats
const getAnalytics = async (req, res) => {
    try {
        const { period = '7' } = req.query; // days

        // Total visits
        const visitsResult = await db.query(
            `SELECT COUNT(*) as total_visits,
                    COUNT(DISTINCT session_id) as unique_visitors
             FROM visitor_analytics
             WHERE visited_at >= CURRENT_DATE - INTERVAL '${period} days'`
        );

        // Page views by page
        const pageViewsResult = await db.query(
            `SELECT page_url as page, COUNT(*) as views
             FROM visitor_analytics
             WHERE visited_at >= CURRENT_DATE - INTERVAL '${period} days'
             GROUP BY page_url
             ORDER BY views DESC`
        );

        // Referrers
        const referrersResult = await db.query(
            `SELECT referrer, COUNT(*) as count
             FROM visitor_analytics
             WHERE visited_at >= CURRENT_DATE - INTERVAL '${period} days'
               AND referrer IS NOT NULL
               AND referrer != ''
             GROUP BY referrer
             ORDER BY count DESC
             LIMIT 10`
        );

        // Visits by day
        const dailyVisitsResult = await db.query(
            `SELECT DATE(visited_at) as date, 
                    COUNT(*) as visits,
                    COUNT(DISTINCT session_id) as unique_visitors
             FROM visitor_analytics
             WHERE visited_at >= CURRENT_DATE - INTERVAL '${period} days'
             GROUP BY DATE(visited_at)
             ORDER BY date DESC`
        );

        res.json({
            summary: visitsResult.rows[0],
            pageViews: pageViewsResult.rows,
            referrers: referrersResult.rows,
            dailyVisits: dailyVisitsResult.rows
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get conversion funnel
const getConversionFunnel = async (req, res) => {
    try {
        const { period = '30' } = req.query;

        const result = await db.query(
            `SELECT 
                (SELECT COUNT(DISTINCT session_id) FROM visitor_analytics 
                 WHERE visited_at >= CURRENT_DATE - INTERVAL '${period} days') as visitors,
                (SELECT COUNT(*) FROM leads 
                 WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days') as leads,
                (SELECT COUNT(*) FROM leads 
                 WHERE status = 'qualified' 
                 AND created_at >= CURRENT_DATE - INTERVAL '${period} days') as qualified,
                (SELECT COUNT(*) FROM proposals 
                 WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days') as proposals,
                (SELECT COUNT(*) FROM proposals 
                 WHERE status = 'accepted' 
                 AND created_at >= CURRENT_DATE - INTERVAL '${period} days') as conversions`
        );

        const data = result.rows[0];
        const conversionRate = data.visitors > 0 ? (data.conversions / data.visitors * 100).toFixed(2) : 0;

        res.json({
            ...data,
            conversionRate: parseFloat(conversionRate)
        });
    } catch (error) {
        console.error('Error getting conversion funnel:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    trackVisit,
    getAnalytics,
    getConversionFunnel
};
