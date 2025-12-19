import React, { useState, useEffect } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { PusherProvider } from './contexts/PusherContext';
import LandingPage from './components/landing/LandingPage';
import PublicProposal from './components/public/PublicProposal';
import CrmLogin from './components/auth/CrmLogin';
import LeadsDashboard from './components/admin/LeadsDashboard';
import CrmLayout from './components/layout/CrmLayout';
import InvoicesView from './components/invoices/InvoicesView';
import InvoiceForm from './components/invoices/InvoiceForm';
import InvoiceDetail from './components/invoices/InvoiceDetail';
import InvoicePublic from './components/invoices/InvoicePublic';
import CommercialDashboard from './components/commercial/CommercialDashboard';

import PublicDemoViewer from './components/hunter/PublicDemoViewer';

function App() {
    const [currentRoute, setCurrentRoute] = useState('/');
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('home');
    const [quickActionModal, setQuickActionModal] = useState(null); // 'lead' | 'proposal' | 'meeting' | null

    const handleQuickAction = (action) => {
        if (action === 'lead') {
            setActiveSection('leads');
            // Dispatch event to open lead modal in LeadsDashboard
            window.dispatchEvent(new CustomEvent('crm_quick_action', { detail: { action: 'new_lead' } }));
        } else if (action === 'proposal') {
            setActiveSection('proposals');
        } else if (action === 'meeting') {
            // For now, show toast about meeting feature
            window.dispatchEvent(new CustomEvent('crm_quick_action', { detail: { action: 'new_meeting' } }));
        }
    };

    useEffect(() => {
        const updateRoute = () => {
            const path = window.location.pathname;
            setCurrentRoute(path);
            setLoading(false);
        };

        // Initial load
        updateRoute();

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', updateRoute);

        // Listen for custom navigation events
        const handleNavigation = () => {
            updateRoute();
        };
        window.addEventListener('navigate', handleNavigation);

        return () => {
            window.removeEventListener('popstate', updateRoute);
            window.removeEventListener('navigate', handleNavigation);
        };
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-dark-300">Cargando...</p>
                    </div>
                </div>
            );
        }

        // Landing Page (ruta raíz)
        if (currentRoute === '/' || currentRoute === '/landing') {
            return <LandingPage />;
        }

        // Factura pública
        if (currentRoute.startsWith('/invoice/')) {
            return <InvoicePublic />;
        }

        // Propuesta pública
        if (currentRoute.startsWith('/proposal/')) {
            return <PublicProposal />;
        }

        // Demo Pública de Lead Hunter
        if (currentRoute.startsWith('/demo/')) {
            return <PublicDemoViewer />;
        }

        // Login CRM
        if (currentRoute === '/crm' || currentRoute === '/crm/login') {
            return <CrmLogin />;
        }

        // Check authentication for protected routes
        const crmToken = localStorage.getItem('crm_token');
        const isProtectedRoute = currentRoute.startsWith('/crm/') ||
            currentRoute.startsWith('/invoices');

        if (isProtectedRoute && !crmToken) {
            window.location.href = '/crm/login';
            return null;
        }

        // Dashboard CRM
        if (currentRoute === '/crm/dashboard') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (user.role === 'commercial') {
                return (

                    <CrmLayout
                        onLogout={() => {
                            localStorage.removeItem('crm_token');
                            localStorage.removeItem('user');
                            window.location.href = '/crm/login';
                        }}
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                        onQuickAction={handleQuickAction}
                    >
                        <CommercialDashboard activeSection={activeSection} />
                    </CrmLayout>
                );
            }

            return (
                <CrmLayout
                    onLogout={() => {
                        localStorage.removeItem('crm_token');
                        localStorage.removeItem('user');
                        window.location.href = '/crm/login';
                    }}
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    onQuickAction={handleQuickAction}
                >
                    <LeadsDashboard activeSection={activeSection} />
                </CrmLayout>
            );
        }

        // Fallback a landing
        return <LandingPage />;
    };

    return (
        <PusherProvider>
            <ToastProvider>
                {renderContent()}
            </ToastProvider>
        </PusherProvider>
    );
}

export default App;

