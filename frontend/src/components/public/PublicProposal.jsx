import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import SignatureModal from '../shared/SignatureModal';

const PublicProposal = () => {
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Moved hooks to top level to comply with Rules of Hooks
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    const toast = useToast();

    // Obtener el token de la URL (asumiendo ruta /proposal/:token)
    const token = window.location.pathname.split('/').pop();

    useEffect(() => {
        fetchProposal();
    }, [token]);

    useEffect(() => {
        if (proposal) {
            fetchComments();
        }
    }, [proposal]);

    const fetchProposal = async () => {
        try {
            const response = await fetch(`${API_URL}/proposals/public/${token}`);
            if (!response.ok) {
                throw new Error('Propuesta no encontrada o expirada');
            }
            const data = await response.json();
            setProposal(data);
            setAccepted(data.status === 'accepted'); // Set accepted status here

            // Track view
            trackProposalView(token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Track proposal view
    const trackProposalView = async (proposalToken) => {
        try {
            await fetch(`${API_URL}/tracking/proposals/${proposalToken}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: 0 })
            });
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    };

    const fetchComments = async () => {
        if (!proposal) return;
        try {
            const response = await fetch(`${API_URL}/proposals/${proposal.id}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setComments([]);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const response = await fetch(`${API_URL}/proposals/${proposal.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    author: proposal.lead_name,
                    authorType: 'client',
                    comment: newComment
                })
            });

            if (response.ok) {
                setNewComment('');
                fetchComments();
            } else {
                toast.error('Error al enviar el comentario');
            }
        } catch (err) {
            console.error('Error submitting comment:', err);
            toast.error('Error al enviar el comentario');
        }
        finally {
            setSubmittingComment(false);
        }
    };

    const handleAcceptProposal = () => {
        // Abrir modal de firma en lugar de aceptar directamente
        setShowSignatureModal(true);
    };

    const handleSignatureSubmit = async (signatureData) => {
        setAccepting(true);
        try {
            const response = await fetch(`${API_URL}/proposals/${proposal.id}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signatureData)
            });

            if (response.ok) {
                setAccepted(true);
                setShowSignatureModal(false);
                toast.success('¡Propuesta aceptada! Te hemos enviado un email de confirmación. Nuestro equipo te contactará pronto.');
            } else {
                const error = await response.json();
                toast.error(`Error al aceptar la propuesta: ${error.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error('Error accepting proposal:', err);
            toast.error('Error de conexión. Por favor intenta de nuevo más tarde.');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
                    <div className="text-5xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Lo sentimos</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!proposal) return null;

    const content = proposal.content_json || { items: [] };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header / Banner */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                            N
                        </div>
                        <span className="font-bold text-xl text-gray-900">NoahPro</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href={`mailto:contacto@noahpro.com`} className="text-sm text-gray-500 hover:text-gray-900">
                            ¿Dudas? Contáctanos
                        </a>
                        <Button
                            variant="primary"
                            onClick={handleAcceptProposal}
                            disabled={accepting || accepted}
                        >
                            {accepted ? '✅ Propuesta Aceptada' : accepting ? 'Aceptando...' : 'Aceptar Propuesta'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Proposal Header */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-10 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
                                <p className="opacity-90 text-lg">Preparada para: {proposal.lead_name} ({proposal.business_name})</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm opacity-75 mb-1">Fecha de emisión</p>
                                <p className="font-medium">{new Date(proposal.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="prose max-w-none text-gray-600">
                            <p className="text-lg leading-relaxed whitespace-pre-line">
                                {proposal.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pricing / Items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Resumen de la Inversión</h3>

                        <div className="space-y-4">
                            {/* Si hay items detallados en el JSON, los mostramos. Si no, mostramos el total */}
                            {content.items && content.items.length > 0 ? (
                                content.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-500">{item.description}</p>
                                        </div>
                                        <div className="font-medium text-gray-900">
                                            {parseFloat(item.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-gray-600">Servicios detallados en la descripción</span>
                                    <span className="font-medium text-gray-900">-</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Total (Impuestos no incluidos)</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {parseFloat(proposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Comentarios y Dudas</h3>

                        <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No hay comentarios aún. ¡Escribe si tienes alguna duda!</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className={`flex ${comment.author_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${comment.author_type === 'client'
                                            ? 'bg-orange-50 text-orange-900 rounded-br-none'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}>
                                            <div className="flex justify-between items-baseline mb-1 space-x-4">
                                                <span className="font-bold text-sm">{comment.author}</span>
                                                <span className="text-xs opacity-60">{new Date(comment.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm">{comment.comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleCommentSubmit} className="relative">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Escribe tu pregunta o comentario aquí..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                                rows="3"
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !newComment.trim()}
                                className="absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                                ➤
                            </button>
                        </form>
                    </div>
                </div>

                {/* Meeting Scheduler */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">¿Hablamos?</h3>
                                <p className="text-gray-500">Agenda una videollamada para resolver dudas en directo.</p>
                            </div>
                            <div className="text-4xl">📅</div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha y Hora Preferida</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    onChange={async (e) => {
                                        if (!e.target.value) return;
                                        const date = new Date(e.target.value);
                                        if (confirm(`¿Confirmar reunión para el ${date.toLocaleString()}?`)) {
                                            try {
                                                const response = await fetch(`${API_URL}/meetings`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        proposalId: proposal.id,
                                                        leadId: proposal.lead_id,
                                                        title: `Reunión sobre ${proposal.title}`,
                                                        description: 'Revisión de propuesta y dudas',
                                                        scheduledDate: date.toISOString(),
                                                        durationMinutes: 45
                                                    })
                                                });
                                                if (response.ok) {
                                                    toast.success('¡Reunión agendada! Te hemos enviado los detalles por email.');
                                                } else {
                                                    toast.error('Error al agendar. Inténtalo de nuevo.');
                                                }
                                            } catch (err) {
                                                toast.error('Error de conexión');
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="bg-orange-50 p-4 rounded-xl text-sm text-orange-800">
                                <p className="font-bold mb-2">Incluye:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Demo en vivo del TPV</li>
                                    <li>Resolución de dudas técnicas</li>
                                    <li>Asesoramiento sobre Verifactu</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terms & Acceptance */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Términos y Condiciones</h3>
                        <div className="text-sm text-gray-500 space-y-2 mb-8">
                            <p>1. Esta propuesta es válida por 15 días a partir de la fecha de emisión.</p>
                            <p>2. El pago se realizará según lo acordado en las condiciones generales.</p>
                            <p>3. NoahPro se compromete a la confidencialidad de los datos proporcionados.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div>
                                <h4 className="font-bold text-gray-900">¿Listo para empezar?</h4>
                                <p className="text-gray-600 text-sm">Acepta la propuesta para iniciar el proyecto inmediatamente.</p>
                            </div>
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto px-8 py-3 text-lg shadow-xl"
                                onClick={handleAcceptProposal}
                                disabled={accepting || accepted}
                            >
                                {accepted ? '✅ Propuesta Aceptada' : accepting ? 'Aceptando...' : 'Aceptar Propuesta'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            <SignatureModal
                isOpen={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                onSubmit={handleSignatureSubmit}
                proposalData={proposal}
            />

            {/* Footer */}
            <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} NoahPro. Todos los derechos reservados.
            </div>
        </div>
    );
};

export default PublicProposal;
