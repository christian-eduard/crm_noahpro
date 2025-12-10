import React, { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AnalyticsTracker = () => {
    useEffect(() => {
        // Get or create session ID
        let sessionId = localStorage.getItem('analytics_session');
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem('analytics_session', sessionId);
        }

        // Track page view
        const trackPageView = async () => {
            try {
                await fetch('http://localhost:3002/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        page: window.location.pathname,
                        referrer: document.referrer
                    })
                });
            } catch (error) {
                console.error('Analytics tracking error:', error);
            }
        };

        trackPageView();

        // Track on route change (for SPAs)
        const handleRouteChange = () => {
            trackPageView();
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    return null; // This component doesn't render anything
};

export default AnalyticsTracker;
