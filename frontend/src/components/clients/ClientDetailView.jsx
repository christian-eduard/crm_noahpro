import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Server, Globe, Lock, Eye, EyeOff, Database, User, Key, FileText, Edit2, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import ClientInvoices from './ClientInvoices';

const ClientDetailView = ({ clientId, onBack }) => {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info'); // 'info', 'installation', 'invoices'
    const [showPasswords, setShowPasswords] = useState({});

    // Installation Data
    const [formData, setFormData] = useState({});

    // Client Info Data
    const [isEditing, setIsEditing] = useState(false);
    const [clientForm, setClientForm] = useState({});

    const toast = useToast();

    useEffect(() => {
        fetchClientDetails();
    }, [clientId]);

    const fetchClientDetails = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/clients/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setClient(data);

                // Initialize Installation Form
                if (data.installation) {
                    setFormData(data.installation);
                }

                // Initialize Client Info Form
                setClientForm({
                    name: data.name || '',
                    nif: data.nif || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    postal_code: data.postal_code || '',
                    province: data.province || '',
                    country: data.country || ''
                });
            } else {
                toast.error('Error al cargar detalles del cliente');
            }
        } catch (error) {
            console.error('Error fetching client details:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClientFormChange = (e) => {
        const { name, value } = e.target;
        setClientForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClient = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify(clientForm)
            });

            if (response.ok) {
                toast.success('Información del cliente actualizada');
                setIsEditing(false);
                fetchClientDetails();
            } else {
                toast.error('Error al actualizar cliente');
            }
        } catch (error) {
            console.error('Error updating client:', error);
            toast.error('Error de conexión');
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSaveInstallation = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/clients/${clientId}/installation`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Datos de instalación actualizados');
                fetchClientDetails(); // Refresh data
            } else {
                toast.error('Error al guardar datos');
            }
        } catch (error) {
            console.error('Error saving installation:', error);
            toast.error('Error de conexión');
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando...</div>;
    if (!client) return <div className="p-8 text-center">Cliente no encontrado</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{client.email} • {client.phone}</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Información General
                    </button>
                    <button
                        onClick={() => setActiveTab('installation')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'installation'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Instalación Técnica
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Facturación
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {activeTab === 'info' && (
                    <div className="relative">
                        <div className="absolute top-0 right-0 flex gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300"
                                    >
                                        <X size={20} />
                                    </button>
                                    <button
                                        onClick={handleSaveClient}
                                        className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-full"
                                    >
                                        <Save size={20} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <Edit2 size={20} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial</label>
                                {isEditing ? (
                                    <input
                                        name="name"
                                        value={clientForm.name}
                                        onChange={handleClientFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{client.name}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIF/CIF</label>
                                {isEditing ? (
                                    <input
                                        name="nif"
                                        value={clientForm.nif}
                                        onChange={handleClientFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{client.nif || '-'}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                {isEditing ? (
                                    <input
                                        name="email"
                                        value={clientForm.email}
                                        onChange={handleClientFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{client.email}</div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                                {isEditing ? (
                                    <input
                                        name="phone"
                                        value={clientForm.phone}
                                        onChange={handleClientFormChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">{client.phone}</div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            name="address"
                                            placeholder="Dirección"
                                            value={clientForm.address}
                                            onChange={handleClientFormChange}
                                            className="col-span-2 w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <input
                                            name="city"
                                            placeholder="Ciudad"
                                            value={clientForm.city}
                                            onChange={handleClientFormChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <input
                                            name="postal_code"
                                            placeholder="C.P."
                                            value={clientForm.postal_code}
                                            onChange={handleClientFormChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <input
                                            name="province"
                                            placeholder="Provincia"
                                            value={clientForm.province}
                                            onChange={handleClientFormChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                        <input
                                            name="country"
                                            placeholder="País"
                                            value={clientForm.country}
                                            onChange={handleClientFormChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                                        {client.address}
                                        {(client.city || client.postal_code) && `, ${client.city} ${client.postal_code}`}
                                        {(client.province || client.country) && `, ${client.province} (${client.country})`}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'installation' && (
                    <div className="space-y-8">
                        {/* Server Details */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                <Server className="w-5 h-5 mr-2 text-orange-500" />
                                Servidor y Dominio
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dominio</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="domain"
                                            value={formData.domain || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                            placeholder="ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP del Servidor</label>
                                    <div className="relative">
                                        <Server className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="server_ip"
                                            value={formData.server_ip || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                            placeholder="192.168.1.1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Admin Access */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                <Lock className="w-5 h-5 mr-2 text-orange-500" />
                                Acceso Panel Admin
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Admin</label>
                                    <input
                                        type="text"
                                        name="admin_url"
                                        value={formData.admin_url || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                        placeholder="https://app.ejemplo.com/admin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
                                    <input
                                        type="text"
                                        name="admin_user"
                                        value={formData.admin_user || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.admin ? "text" : "password"}
                                            name="admin_password"
                                            value={formData.admin_password || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('admin')}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.admin ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Database Access */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                                <Database className="w-5 h-5 mr-2 text-orange-500" />
                                Base de Datos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre BD</label>
                                    <input
                                        type="text"
                                        name="db_name"
                                        value={formData.db_name || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario BD</label>
                                    <input
                                        type="text"
                                        name="db_user"
                                        value={formData.db_user || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña BD</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.db ? "text" : "password"}
                                            name="db_password"
                                            value={formData.db_password || ''}
                                            onChange={handleInputChange}
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('db')}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.db ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas Técnicas</label>
                            <textarea
                                name="notes"
                                rows="4"
                                value={formData.notes || ''}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                placeholder="Detalles adicionales sobre la instalación..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveInstallation}
                                className="flex items-center space-x-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Save size={20} />
                                <span>Guardar Cambios</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'invoices' && (
                    <ClientInvoices clientId={clientId} />
                )}
            </div>
        </div>
    );
};

export default ClientDetailView;
