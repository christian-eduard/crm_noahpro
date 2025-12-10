import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersSettings from '../UsersSettings';
import { ToastContext } from '../../../contexts/ToastContext';

// Mock fetch
global.fetch = vi.fn();

const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
};

const renderWithToast = (component) => {
    return render(
        <ToastContext.Provider value={mockToast}>
            {component}
        </ToastContext.Provider>
    );
};

describe('UsersSettings Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        Object.values(mockToast).forEach(fn => fn.mockClear());
        localStorage.setItem('crm_token', 'test-token');
    });

    describe('Initial Render', () => {
        it('should render users list', async () => {
            const mockUsers = [
                { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', created_at: '2025-01-01' },
                { id: 2, username: 'user1', email: 'user1@test.com', role: 'user', created_at: '2025-01-02' }
            ];

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockUsers
            });

            renderWithToast(<UsersSettings />);

            // Wait for the users to be rendered - they appear in the table
            await waitFor(() => {
                expect(screen.getByText('admin@test.com')).toBeInTheDocument();
                expect(screen.getByText('user1@test.com')).toBeInTheDocument();
            });
        });

        it('should show loading state initially', () => {
            fetch.mockImplementation(() => new Promise(() => { }));

            renderWithToast(<UsersSettings />);

            // The component shows a spinner div, not text
            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });

        it('should show error message on fetch failure', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            renderWithToast(<UsersSettings />);

            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith('Error al cargar usuarios');
            }, { timeout: 3000 });
        });
    });
});
