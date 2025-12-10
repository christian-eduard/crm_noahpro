import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TagBadge from '../TagBadge';

describe('TagBadge Component', () => {
    const mockTag = {
        id: 1,
        name: 'Urgente',
        color: '#EF4444'
    };

    it('renders tag name correctly', () => {
        render(<TagBadge tag={mockTag} />);
        expect(screen.getByText('Urgente')).toBeInTheDocument();
    });

    it('applies correct background color with opacity', () => {
        const { container } = render(<TagBadge tag={mockTag} />);
        const badge = container.firstChild;

        expect(badge).toHaveStyle({
            backgroundColor: `${mockTag.color}20`,
            color: mockTag.color
        });
    });

    it('calls onRemove when remove button clicked', () => {
        const mockRemove = vi.fn();
        render(<TagBadge tag={mockTag} onRemove={mockRemove} />);

        const removeButton = screen.getByText('✕');
        fireEvent.click(removeButton);

        expect(mockRemove).toHaveBeenCalledWith(mockTag.id);
    });

    it('does not show remove button when onRemove not provided', () => {
        render(<TagBadge tag={mockTag} />);
        expect(screen.queryByText('✕')).not.toBeInTheDocument();
    });

    it('stops event propagation on remove click', () => {
        const mockRemove = vi.fn();
        const mockParentClick = vi.fn();

        const { container } = render(
            <div onClick={mockParentClick}>
                <TagBadge tag={mockTag} onRemove={mockRemove} />
            </div>
        );

        const removeButton = screen.getByText('✕');
        fireEvent.click(removeButton);

        expect(mockRemove).toHaveBeenCalledWith(mockTag.id);
        // Parent click should not be triggered due to stopPropagation
        expect(mockParentClick).not.toHaveBeenCalled();
    });

    it('renders with different sizes', () => {
        const { rerender, container } = render(<TagBadge tag={mockTag} size="xs" />);
        let badge = container.firstChild;
        expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');

        rerender(<TagBadge tag={mockTag} size="sm" />);
        badge = container.firstChild;
        expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');

        rerender(<TagBadge tag={mockTag} size="md" />);
        badge = container.firstChild;
        expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies hover classes', () => {
        const { container } = render(<TagBadge tag={mockTag} />);
        const badge = container.firstChild;

        expect(badge).toHaveClass('transition-all', 'hover:shadow-md');
    });
});
