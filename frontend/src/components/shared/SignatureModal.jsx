import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureModal = ({ isOpen, onClose, onSubmit, proposalData }) => {
    const signatureRef = useRef(null);
    const [formData, setFormData] = useState({
        fullName: '',
        position: '',
        company: '',
        dni: '',
        email: '',
        phone: ''
    });
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const clearSignature = () => {
        signatureRef.current?.clear();
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Nombre completo requerido';
        if (!formData.position.trim()) newErrors.position = 'Cargo requerido';
        if (!formData.company.trim()) newErrors.company = 'Empresa requerida';
        if (!formData.dni.trim()) newErrors.dni = 'DNI/NIF requerido';
        if (!formData.email.trim()) newErrors.email = 'Email requerido';
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (signatureRef.current?.isEmpty()) {
            newErrors.signature = 'Firma requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const signatureData = signatureRef.current?.toDataURL();

        const submissionData = {
            ...formData,
            signature: signatureData,
            signedAt: new Date().toISOString(),
            proposalId: proposalData?.id
        };

        onSubmit(submissionData);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Firma de Propuesta</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                Por favor, complete sus datos y firme para aceptar la propuesta
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                    {/* Proposal Summary */}
                    {proposalData && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-2">Resumen de la Propuesta</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Título:</strong> {proposalData.title}</p>
                                <p><strong>Precio Total:</strong> {parseFloat(proposalData.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                                placeholder="Juan Pérez García"
                            />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cargo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className={`input ${errors.position ? 'border-red-500' : ''}`}
                                placeholder="Director General"
                            />
                            {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Empresa <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                className={`input ${errors.company ? 'border-red-500' : ''}`}
                                placeholder="Mi Empresa S.L."
                            />
                            {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                DNI/NIF <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.dni}
                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                className={`input ${errors.dni ? 'border-red-500' : ''}`}
                                placeholder="12345678A"
                            />
                            {errors.dni && <p className="text-xs text-red-500 mt-1">{errors.dni}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`input ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="juan@empresa.com"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="input"
                                placeholder="+34 600 000 000"
                            />
                        </div>
                    </div>

                    {/* Signature Pad */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Firma Digital <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                            <SignatureCanvas
                                ref={signatureRef}
                                canvasProps={{
                                    className: 'w-full h-48 cursor-crosshair',
                                    style: { touchAction: 'none' }
                                }}
                                backgroundColor="white"
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <button
                                type="button"
                                onClick={clearSignature}
                                className="text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                                Limpiar firma
                            </button>
                            {errors.signature && <p className="text-xs text-red-500">{errors.signature}</p>}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Firme en el recuadro usando su ratón o pantalla táctil
                        </p>
                    </div>

                    {/* Legal Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-xs text-gray-700">
                            <strong>Aviso Legal:</strong> Al firmar este documento, acepta los términos y condiciones
                            de la propuesta presentada. Esta firma tiene validez legal y vincula a las partes según
                            lo establecido en la Ley 6/2020 de servicios de la sociedad de la información y comercio electrónico.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Firmar y Aceptar Propuesta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignatureModal;
