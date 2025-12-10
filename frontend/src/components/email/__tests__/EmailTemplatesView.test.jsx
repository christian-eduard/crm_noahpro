import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailTemplatesView from '../EmailTemplatesView';

describe('EmailTemplatesView', () => {
    it('renders without crashing', () => {
        render(<EmailTemplatesView />);
        expect(screen.getByText('Plantillas de Email')).toBeInTheDocument();
    });

    it('displays new template button', () => {
        render(<EmailTemplatesView />);
        expect(screen.getByText('Nueva Plantilla')).toBeInTheDocument();
    });

    it('opens modal when clicking new template', () => {
        render(<EmailTemplatesView />);
        const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i });
        fireEvent.click(newButton);

        expect(screen.getByRole('heading', { name: 'Nueva Plantilla' })).toBeInTheDocument();
    });

    it('displays available variables', () => {
        render(<EmailTemplatesView />);
        const newButton = screen.getByText('Nueva Plantilla');
        fireEvent.click(newButton);

        expect(screen.getByText(/Variables Disponibles/i)).toBeInTheDocument();
    });

    it('inserts variable when clicked', () => {
        render(<EmailTemplatesView />);
        const newButton = screen.getByText('Nueva Plantilla');
        fireEvent.click(newButton);

        const variableButton = screen.getByText('{{lead_name}}');
        fireEvent.click(variableButton);

        // Variable should be inserted in textarea
        const textarea = screen.getByRole('textbox', { name: /Cuerpo del Email/i });
        expect(textarea.value).toContain('{{lead_name}}');
    });
});
