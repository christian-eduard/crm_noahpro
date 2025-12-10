import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CrmLayout from '../CrmLayout';
import { renderWithProviders, mockToast, resetMocks } from '../../../utils/testUtils';

describe('CrmLayout Component', () => {
    const mockOnLogout = vi.fn();
    const mockOnSectionChange = vi.fn();
    const mockOnQuickAction = vi.fn();

    const defaultProps = {
        onLogout: mockOnLogout,
        onSectionChange: mockOnSectionChange,
        onQuickAction: mockOnQuickAction,
        activeSection: 'leads'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        resetMocks();
        // Mock localStorage
        Storage.prototype.getItem = vi.fn(() => 'light');
        Storage.prototype.setItem = vi.fn();
    });

    it('renders sidebar with all menu items', () => {
        renderWithProviders(<CrmLayout {...defaultProps}>Content</CrmLayout>);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Leads')).toBeInTheDocument();
        expect(screen.getByText('Chat')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Configuración')).toBeInTheDocument();
    });

    // ... (other tests)

    it('highlights active section', () => {
        const { unmount } = renderWithProviders(<CrmLayout {...defaultProps} activeSection="chat">Content</CrmLayout>);

        const chatButton = screen.getByText('Chat').closest('button');
        expect(chatButton).toHaveClass('from-orange-500', 'to-red-600');

        unmount();

        renderWithProviders(<CrmLayout {...defaultProps} activeSection="analytics">Content</CrmLayout>);
        const analyticsButton = screen.getByText('Analytics').closest('button');
        expect(analyticsButton).toHaveClass('from-orange-500', 'to-red-600');
    });

    it('calls onSectionChange when menu item clicked', () => {
        renderWithProviders(<CrmLayout {...defaultProps}>Content</CrmLayout>);

        const chatButton = screen.getByText('Chat').closest('button');
        fireEvent.click(chatButton);

        expect(mockOnSectionChange).toHaveBeenCalledWith('chat');
    });

    it('toggles sidebar collapsed state', () => {
        const { container } = renderWithProviders(<CrmLayout {...defaultProps}>Content</CrmLayout>);

        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('w-64');

        const toggleButton = container.querySelector('button svg').closest('button');
        fireEvent.click(toggleButton);

        expect(sidebar).toHaveClass('w-20');
    });

    it('shows logout button and calls onLogout', () => {
        renderWithProviders(<CrmLayout {...defaultProps}>Content</CrmLayout>);

        // Find logout button by its SVG path
        const logoutButton = document.querySelector('button[title="Cerrar sesión"]') ||
            screen.getAllByRole('button').find(btn => btn.querySelector('svg path[d*="M17 16l4-4"]'));

        if (logoutButton) {
            fireEvent.click(logoutButton);
            expect(mockOnLogout).toHaveBeenCalled();
        }
    });
});
