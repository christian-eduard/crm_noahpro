import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PublicProposal from '../PublicProposal';
import { ToastProvider } from '../../../contexts/ToastContext';

// Helper to render with providers
const renderWithProviders = (component) => {
    return render(
        <ToastProvider>
            {component}
        </ToastProvider>
    );
};

// Mock global fetch
global.fetch = vi.fn();
global.alert = vi.fn();
global.confirm = vi.fn();

// Mock SignatureModal to avoid canvas issues and simplify testing
vi.mock('../../shared/SignatureModal', () => ({
    default: ({ isOpen, onClose, onSubmit }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="signature-modal">
                <button onClick={() => onSubmit({
                    fullName: 'Test User',
                    signature: 'data:image/png;base64,test'
                })}>
                    Confirmar Firma
                </button>
                <button onClick={onClose}>Cancelar</button>
            </div>
        );
    }
}));

describe('PublicProposal Component', () => {
    const mockProposal = {
        id: 1,
        title: 'Test Proposal',
        description: 'This is a test proposal description',
        total_price: 5000,
        lead_name: 'John Doe',
        business_name: 'Test Corp',
        status: 'viewed',
        created_at: '2025-01-01T00:00:00Z',
        content_json: { items: [] }
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup URL
        window.history.pushState({}, '', '/proposal/test-token-123');

        // Default mock implementation for fetch
        global.fetch.mockImplementation((url) => {
            if (url.includes('/public/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProposal
                });
            }
            if (url.includes('/comments')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => []
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders proposal title and description', async () => {
        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            expect(screen.getByText('Test Proposal')).toBeInTheDocument();
        });

        expect(screen.getByText(/This is a test proposal/)).toBeInTheDocument();
    });

    it('displays total price correctly formatted', async () => {
        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            const totalLabel = screen.getByText('Total (Impuestos no incluidos)');
            const priceElement = totalLabel.nextElementSibling;
            expect(priceElement.textContent).toMatch(/5[.,]?000/);
        });
    });

    it('shows accept proposal button', async () => {
        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            const buttons = screen.getAllByText('Aceptar Propuesta');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    it('handles accept proposal flow', async () => {
        // Override fetch for this specific test
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/accept') && options?.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ message: 'Propuesta aceptada exitosamente' })
                });
            }
            // Fallback to default behavior
            if (url.includes('/public/')) return Promise.resolve({ ok: true, json: async () => mockProposal });
            if (url.includes('/comments')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.reject(new Error('Unknown URL'));
        });

        renderWithProviders(<PublicProposal />);

        // 1. Open modal
        await waitFor(() => {
            expect(screen.getAllByText('Aceptar Propuesta')[0]).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByText('Aceptar Propuesta')[0]);

        // 2. Check modal is open
        await waitFor(() => {
            expect(screen.getByTestId('signature-modal')).toBeInTheDocument();
        });

        // 3. Submit signature
        fireEvent.click(screen.getByText('Confirmar Firma'));

        // 4. Verify API call
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/accept'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Test User')
                })
            );
        });
    });

    it('shows disabled state when already accepted', async () => {
        const acceptedProposal = { ...mockProposal, status: 'accepted' };

        global.fetch.mockImplementation((url) => {
            if (url.includes('/public/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => acceptedProposal
                });
            }
            if (url.includes('/comments')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => []
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });

        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            const acceptedButtons = screen.getAllByText(/✅ Propuesta Aceptada/);
            expect(acceptedButtons.length).toBeGreaterThan(0);
            expect(acceptedButtons[0]).toBeDisabled();
        });
    });

    it('handles comment submission', async () => {
        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Escribe tu pregunta/)).toBeInTheDocument();
        });

        const textarea = screen.getByPlaceholderText(/Escribe tu pregunta/);
        fireEvent.change(textarea, { target: { value: 'Test comment' } });

        // Mock comment submission response
        global.fetch.mockImplementation((url, options) => {
            if (url.includes('/comments') && options?.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true })
                });
            }
            // Defaults
            if (url.includes('/public/')) return Promise.resolve({ ok: true, json: async () => mockProposal });
            if (url.includes('/comments')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.reject(new Error('Unknown URL'));
        });

        const form = textarea.closest('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/comments'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('displays error state when proposal not found', async () => {
        global.fetch.mockImplementation((url) => {
            if (url.includes('/public/')) {
                return Promise.resolve({
                    ok: false,
                    status: 404
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        renderWithProviders(<PublicProposal />);

        await waitFor(() => {
            expect(screen.getByText(/Lo sentimos/)).toBeInTheDocument();
        });
    });
});
