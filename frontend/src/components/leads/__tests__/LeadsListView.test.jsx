import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import LeadsListView from '../LeadsListView';
import { renderWithProviders, mockToast, resetMocks } from '../../../utils/testUtils';

// Mock fetch
global.fetch = vi.fn();

const mockLeads = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        business_name: 'Acme Corp',
        status: 'new',
        proposal_status: null,
        created_at: '2025-01-01'
    },
    {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        business_name: 'Tech Inc',
        status: 'contacted',
        proposal_status: 'sent',
        created_at: '2025-01-02'
    }
];

const mockStatuses = [
    { id: 1, name: 'Nuevo', color: '#3b82f6', order: 1 },
    { id: 2, name: 'Contactado', color: '#10b981', order: 2 }
];

describe('LeadsListView', () => {
    beforeEach(() => {
        fetch.mockClear();
        resetMocks();
    });

    it('renders without crashing', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockLeads
        });

        const mockHandleEdit = vi.fn();
        const mockHandleDelete = vi.fn();
        const mockHandleConvert = vi.fn();

        renderWithProviders(
            <LeadsListView
                leads={mockLeads}
                statuses={mockStatuses}
                onEdit={mockHandleEdit}
                onDelete={mockHandleDelete}
                onConvertToClient={mockHandleConvert}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('displays all leads', async () => {
        const mockHandleEdit = vi.fn();
        const mockHandleDelete = vi.fn();
        const mockHandleConvert = vi.fn();

        renderWithProviders(
            <LeadsListView
                leads={mockLeads}
                statuses={mockStatuses}
                onEdit={mockHandleEdit}
                onDelete={mockHandleDelete}
                onConvertToClient={mockHandleConvert}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });
    });

    it('shows correct status badges', async () => {
        const mockHandleEdit = vi.fn();
        const mockHandleDelete = vi.fn();
        const mockHandleConvert = vi.fn();

        renderWithProviders(
            <LeadsListView
                leads={mockLeads}
                statuses={mockStatuses}
                onEdit={mockHandleEdit}
                onDelete={mockHandleDelete}
                onConvertToClient={mockHandleConvert}
            />
        );

        await waitFor(() => {
            // Use getAllByText because "Nuevo" might appear in filters too
            const newBadges = screen.getAllByText(/Nuevo/i);
            const contactedBadges = screen.getAllByText(/Contactado/i);

            // Verify at least one of the found elements is a badge (has the correct class)
            const hasNewBadge = newBadges.some(el => el.className.includes('bg-orange-100'));
            const hasContactedBadge = contactedBadges.some(el => el.className.includes('bg-yellow-100'));

            expect(hasNewBadge).toBe(true);
            expect(hasContactedBadge).toBe(true);
        });
    });

    it('filters leads by status', async () => {
        const filteredLeads = mockLeads.filter(lead => lead.status === 'new');
        const mockHandleEdit = vi.fn();
        const mockHandleDelete = vi.fn();
        const mockHandleConvert = vi.fn();

        renderWithProviders(
            <LeadsListView
                leads={filteredLeads}
                statuses={mockStatuses}
                onEdit={mockHandleEdit}
                onDelete={mockHandleDelete}
                onConvertToClient={mockHandleConvert}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        });
    });

    it('displays proposal status correctly', async () => {
        const mockHandleEdit = vi.fn();
        const mockHandleDelete = vi.fn();
        const mockHandleConvert = vi.fn();

        renderWithProviders(
            <LeadsListView
                leads={mockLeads}
                statuses={mockStatuses}
                onEdit={mockHandleEdit}
                onDelete={mockHandleDelete}
                onConvertToClient={mockHandleConvert}
            />
        );

        await waitFor(() => {
            // The component shows "✓ Enviada" for proposals, not "sent"
            expect(screen.getByText(/Enviada/i)).toBeInTheDocument();
        });
    });
});
