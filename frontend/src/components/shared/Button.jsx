import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    onClick,
    disabled = false,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseClasses = 'btn';

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        success: 'btn-success',
        danger: 'btn-danger',
        ghost: 'btn-ghost',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
