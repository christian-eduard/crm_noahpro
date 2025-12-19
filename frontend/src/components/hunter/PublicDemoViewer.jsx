import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

const PublicDemoViewer = () => {
    // Extract token from URL path: /demo/:token
    const token = window.location.pathname.split('/demo/')[1];
    const [htmlContent, setHtmlContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determines API URL based on environment
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

    useEffect(() => {
        const fetchDemo = async () => {
            try {
                const response = await fetch(`${API_URL}/hunter/public/demo/${token}`);
                if (!response.ok) {
                    throw new Error('Demo no encontrada o expirada');
                }
                const data = await response.json();
                setHtmlContent(data.html_content);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDemo();
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Cargando experiencia...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="bg-red-100 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">No pudimos cargar la demo</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <a href="/" className="text-blue-600 hover:underline font-medium">Volver al inicio</a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-white">
            <iframe
                srcDoc={htmlContent}
                title="Demo Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        </div>
    );
};

export default PublicDemoViewer;
