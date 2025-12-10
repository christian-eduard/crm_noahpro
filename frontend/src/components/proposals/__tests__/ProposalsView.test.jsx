import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ProposalsView from '../ProposalsView';

describe('ProposalsView', () => {
    const mockProposals = [
        {
            id: 1,
            title: 'Propuesta A',
            lead_name: 'Juan Pérez',
            lead_email: 'juan@example.com',
            status: 'pending',
            created_at: '2025-12-01',
            views: 5,
            email_opened: true
        },
        {
            id: 2,
            title: 'Propuesta B',
            lead_name: 'María García',
            lead_email: 'maria@example.com',
            status: 'accepted',
            created_at: '2025-12-02',
            views: 10,
            email_opened: false
        }
    ];

    beforeEach(() => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockProposals)
            })
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders without crashing', () => {
        render(<ProposalsView />);
        expect(screen.getByText('Propuestas')).toBeInTheDocument();
    });

    it('displays stats cards', async () => {
        render(<ProposalsView />);
        // Wait for data to load
        await screen.findByText('Total');

        // Use getAllByText as these terms appear in stats and filters
        const pendingElements = screen.getAllByText('Pendientes');
        expect(pendingElements.length).toBeGreaterThan(0);

        const acceptedElements = screen.getAllByText('Aceptadas');
        expect(acceptedElements.length).toBeGreaterThan(0);
    });

    it('filters proposals by status', async () => {
        render(<ProposalsView />);
        await screen.findByText('Propuesta A');

        const filterSelect = screen.getByDisplayValue('Todos los estados');
        fireEvent.change(filterSelect, { target: { value: 'pending' } });

        expect(screen.getByText('Propuesta A')).toBeInTheDocument();
    });

    it('searches proposals by title', async () => {
        render(<ProposalsView />);
        await screen.findByText('Propuesta A');

        const searchInput = screen.getByPlaceholderText(/Buscar por título/i);
        fireEvent.change(searchInput, { target: { value: 'Propuesta A' } });

        expect(screen.getByText('Propuesta A')).toBeInTheDocument();
    });
});
