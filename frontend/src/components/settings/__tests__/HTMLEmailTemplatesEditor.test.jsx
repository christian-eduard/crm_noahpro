import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HTMLEmailTemplatesEditor from '../HTMLEmailTemplatesEditor';
import { ToastContext } from '../../../contexts/ToastContext';

global.fetch = vi.fn();

const mockToast = {
    success: vi.fn(),
    error: vi.fn()
};

const renderWithToast = (component) => {
    return render(
        <ToastContext.Provider value={mockToast}>
            {component}
        </ToastContext.Provider>
    );
};

describe('HTMLEmailTemplatesEditor Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        Object.values(mockToast).forEach(fn => fn.mockClear());
        localStorage.setItem('crm_token', 'test-token');
    });

    describe('Initial Render', () => {
        it('should render template list', async () => {
            const mockTemplates = [
                { id: 'proposal', name: 'proposal.html', content: '<html></html>', updated_at: '2025-01-01' },
                { id: 'welcome', name: 'welcome.html', content: '<html></html>', updated_at: '2025-01-02' }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockTemplates
            });

            renderWithToast(<HTMLEmailTemplatesEditor />);

            await waitFor(() => {
                // The component uses emoji prefixes in getTemplateDisplayName
                expect(screen.getByText(/📧 Plantilla de Propuesta/i)).toBeInTheDocument();
                expect(screen.getByText(/👋 Plantilla de Bienvenida/i)).toBeInTheDocument();
            });
        });

        it('should show loading state', () => {
            fetch.mockImplementation(() => new Promise(() => { }));

            renderWithToast(<HTMLEmailTemplatesEditor />);

            // The component shows a Loader icon, not a role="status"
            const loader = document.querySelector('.animate-spin');
            expect(loader).toBeInTheDocument();
        });
    });
});
