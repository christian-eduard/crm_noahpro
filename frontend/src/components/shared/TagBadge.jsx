import React from 'react';
import { X } from 'lucide-react';

const TagBadge = ({ tag, onRemove, size = 'sm' }) => {
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm'
    };

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} transition-all`}
            style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                border: `1px solid ${tag.color}40`
            }}
        >
            {tag.name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(tag.id);
                    }}
                    className="ml-1 hover:opacity-70 transition-opacity"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
};

/**
 * TagsList - Lista horizontal de tags con límite visible
 */
export const TagsList = ({ tags = [], maxVisible = 2, size = 'xs', onRemove }) => {
    if (!tags || tags.length === 0) return null;

    const visibleTags = tags.slice(0, maxVisible);
    const remainingCount = tags.length - maxVisible;

    return (
        <div className="flex flex-wrap gap-1 items-center">
            {visibleTags.map(tag => (
                <TagBadge
                    key={tag.id}
                    tag={tag}
                    size={size}
                    onRemove={onRemove}
                />
            ))}
            {remainingCount > 0 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    +{remainingCount}
                </span>
            )}
        </div>
    );
};

export default TagBadge;

