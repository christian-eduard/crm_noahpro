import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { ToastContext } from '../contexts/ToastContext';

// Mock toast provider for tests
export const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
};

// Utility to render components with ToastProvider
export const renderWithProviders = (component) => {
    return render(
        <ToastContext.Provider value={mockToast}>
            {component}
        </ToastContext.Provider>
    );
};

// Reset mocks before each test
export const resetMocks = () => {
    Object.values(mockToast).forEach(fn => fn.mockClear());
};
