import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <div className="modal-backdrop animate-fade-in" onClick={onClose}>
            <div
                className={`bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 w-full ${sizeClasses[size]} animate-slide-in max-h-[85vh] flex flex-col transition-colors duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between shrink-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="p-6 overflow-y-auto flex-1 min-h-0 text-gray-900 dark:text-dark-50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
