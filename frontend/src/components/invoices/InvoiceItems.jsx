import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const InvoiceItems = ({ items, onChange }) => {
    const addItem = () => {
        onChange([...items, { description: '', quantity: 1, price: 0, total: 0 }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Calculate total for this item
        if (field === 'quantity' || field === 'price') {
            const quantity = parseFloat(newItems[index].quantity) || 0;
            const price = parseFloat(newItems[index].price) || 0;
            newItems[index].total = quantity * price;
        }

        onChange(newItems);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                    Items de la Factura
                </label>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FiPlus className="w-4 h-4" />
                    Añadir Item
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 mb-3">No hay items en la factura</p>
                    <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <FiPlus className="w-4 h-4" />
                        Añadir Primer Item
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Descripción
                                    </label>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        placeholder="Descripción del servicio/producto"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Precio Unitario
                                    </label>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Total and Delete */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Total
                                    </label>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatCurrency(item.total)}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar item"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InvoiceItems;
