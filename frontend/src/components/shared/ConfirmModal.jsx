import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = '¿Estás seguro?',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'warning' | 'info'
}) => {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-200',
            icon: 'text-red-600 dark:text-red-400'
        },
        warning: {
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-200 dark:border-orange-800',
            text: 'text-orange-800 dark:text-orange-200',
            icon: 'text-orange-600 dark:text-orange-400'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-200',
            icon: 'text-blue-600 dark:text-blue-400'
        }
    };

    const style = typeStyles[type] || typeStyles.danger;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 text-left">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
                <div className={`${style.bg} rounded-lg p-4 mb-4 border ${style.border}`}>
                    <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                        <div>
                            <h3 className={`font-bold ${style.text} mb-1`}>{title}</h3>
                            <p className={`text-sm ${style.text}`}>{message}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
