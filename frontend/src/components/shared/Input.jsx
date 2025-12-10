import React from 'react';

const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    error = '',
    required = false,
    disabled = false,
    className = '',
    icon = null,
    ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-2">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={`input w-full ${icon ? 'pl-10' : ''} ${error ? 'border-danger focus:ring-danger' : ''}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-danger">{error}</p>
            )}
        </div>
    );
};

export default Input;
