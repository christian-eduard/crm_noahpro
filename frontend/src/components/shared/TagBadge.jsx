import React from 'react';

const TagBadge = ({ tag, onRemove, size = 'sm' }) => {
    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs',
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm'
    };

    return (
        <span
            className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} transition-all hover:shadow-md`}
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
                    ✕
                </button>
            )}
        </span>
    );
};

export default TagBadge;
