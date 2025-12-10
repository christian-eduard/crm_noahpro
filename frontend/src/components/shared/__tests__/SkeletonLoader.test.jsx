import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkeletonLoader from '../SkeletonLoader';

describe('SkeletonLoader', () => {
    it('renders card skeleton', () => {
        const { container } = render(<SkeletonLoader type="card" count={1} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders multiple skeletons', () => {
        const { container } = render(<SkeletonLoader type="card" count={3} />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons).toHaveLength(3);
    });

    it('renders table-row skeleton', () => {
        const { container } = render(<SkeletonLoader type="table-row" count={1} />);
        expect(container.querySelector('tr')).toBeInTheDocument();
    });

    it('renders stat skeleton', () => {
        const { container } = render(<SkeletonLoader type="stat" count={1} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders list-item skeleton', () => {
        const { container } = render(<SkeletonLoader type="list-item" count={1} />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
});
