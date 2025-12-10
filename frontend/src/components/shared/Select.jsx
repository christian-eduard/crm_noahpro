import React from 'react';

const Select = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    error = '',
    required = false,
    disabled = false,
    className = '',
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
            <select
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                className={`input ${error ? 'border-danger focus:ring-danger' : ''}`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-danger">{error}</p>
            )}
        </div>
    );
};

export default Select;
