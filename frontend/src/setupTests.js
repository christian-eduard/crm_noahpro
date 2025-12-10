import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.confirm
global.confirm = vi.fn(() => true);

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Notification API
global.Notification = {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
};
