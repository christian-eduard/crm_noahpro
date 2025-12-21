/**
 * SalesCopilotHUD
 * Heads-Up Display para asistencia en tiempo real durante llamadas.
 * Proporciona transcripción, análisis de sentimiento y manejo de objeciones.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Brain, X, Sparkles, MessageSquare, AlertTriangle, check,
    ThumbsUp, ThumbsDown, Activity
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

// Simulación de diálogo
const SIMULATED_DIALOGUE = [
    { speaker: 'sales', text: 'Hola, hablo con el responsable de marketing?' },
    { speaker: 'client', text: 'Sí, soy yo. ¿Quién llama?' },
    { speaker: 'sales', text: 'Le llamo de NoahPro para ofrecerle una solución de IA.' },
    { speaker: 'client', text: 'Mmm, la verdad es que ahora no tengo mucho tiempo.' },
    { speaker: 'sales', text: 'Entiendo, seré muy breve.' },
    { speaker: 'client', text: 'Además, ya trabajamos con otra agencia y nos va bien.' }, // Trigger objection: Competencia
    { speaker: 'sales', text: 'Genial. ¿Y están satisfechos con el ROI actual?' },
    { speaker: 'client', text: 'Bueno, es un poco caro para lo que hacen...' }, // Trigger objection: Precio
];

const OBJECTIONS_DB = {
    'tiempo': { title: 'No tengo tiempo', script: 'Entiendo perfectamente. Solo necesito 30 segundos para decirle que [Gancho de Valor]. Si no le interesa, colgamos.' },
    'agencia': { title: 'Ya tengo agencia', script: 'Excelente. No buscamos reemplazarla, sino auditar si están perdiendo oportunidades. ¿Sabe cuál es su coste por lead actual?' },
    'caro': { title: 'Es muy caro', script: 'La IA no es un gasto, es una inversión. NoahPro reduce un 80% sus costes operativos. ¿Cuánto gasta hoy en tareas manuales?' }
};

const SalesCopilotHUD = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [currentObjection, setCurrentObjection] = useState(null);
    const [sentiment, setSentiment] = useState(50); // 0-100 (50 neutral)
    const [dialogueIndex, setDialogueIndex] = useState(0);

    // Escuchar evento de activación
    useEffect(() => {
        const handleToggle = (e) => {
            setIsVisible(e.detail.active);
            if (e.detail.active) {
                // Reset session
                setTranscript([]);
                setDialogueIndex(0);
                setSentiment(50);
                setCurrentObjection(null);
                startSimulation();
            } else {
                stopSimulation();
            }
        };

        window.addEventListener('crm_copilot_toggle', handleToggle);
        return () => window.removeEventListener('crm_copilot_toggle', handleToggle);
    }, []);

    const intervalRef = useRef(null);

    const startSimulation = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        let index = 0;
        intervalRef.current = setInterval(() => {
            if (index >= SIMULATED_DIALOGUE.length) {
                clearInterval(intervalRef.current);
                return;
            }

            const line = SIMULATED_DIALOGUE[index];
            addTranscriptLine(line);
            analyzeText(line.text);

            index++;
            setDialogueIndex(index);
        }, 3000); // Nueva línea cada 3 segundos
    };

    const stopSimulation = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const addTranscriptLine = (line) => {
        setTranscript(prev => [...prev.slice(-4), line]); // Mantener solo últimas 5 líneas
    };

    const analyzeText = (text) => {
        const lower = text.toLowerCase();

        // Sentiment simulation
        if (lower.includes('no') || lower.includes('caro') || lower.includes('pero')) {
            setSentiment(prev => Math.max(0, prev - 15));
        } else if (lower.includes('sí') || lower.includes('claro') || lower.includes('interesante')) {
            setSentiment(prev => Math.min(100, prev + 15));
        }

        // Objection Detection
        if (lower.includes('tiempo') || lower.includes('ocupado')) setObjection('tiempo');
        if (lower.includes('agencia') || lower.includes('trabajamos con otra')) setObjection('agencia');
        if (lower.includes('caro') || lower.includes('precio') || lower.includes('presupuesto')) setObjection('caro');
    };

    const setObjection = (key) => {
        const obj = OBJECTIONS_DB[key];
        if (obj) {
            setCurrentObjection(obj);
            // Auto hide after 10s
            // setTimeout(() => setCurrentObjection(null), 10000);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:right-6 md:w-96 z-40 flex flex-col gap-4 pointer-events-none">
            {/* Main HUD Panel */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-500/30 overflow-hidden pointer-events-auto">
                <div className="p-3 bg-indigo-900/50 border-b border-indigo-500/30 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <span className="font-bold text-white text-sm">NoahPro Copilot</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                            <Activity className={`w-3 h-3 ${sentiment > 60 ? 'text-green-400' : sentiment < 40 ? 'text-red-400' : 'text-yellow-400'}`} />
                            <span className="text-xs font-mono text-gray-300">{sentiment}%</span>
                        </div>
                        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Transcription View */}
                <div className="p-4 space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                    {transcript.length === 0 && (
                        <div className="text-center text-gray-500 text-sm py-8 italic flex flex-col items-center">
                            <Brain className="w-8 h-8 mb-2 opacity-50" />
                            Escuchando conversación...
                        </div>
                    )}
                    {transcript.map((line, i) => (
                        <div key={i} className={`flex ${line.speaker === 'sales' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${line.speaker === 'sales'
                                ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 rounded-tr-none'
                                : 'bg-slate-700/50 text-gray-100 border border-slate-600/30 rounded-tl-none'
                                }`}>
                                <span className="text-xs font-bold opacity-50 block mb-1">
                                    {line.speaker === 'sales' ? 'TÚ' : 'CLIENTE'}
                                </span>
                                {line.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Smart Objection Card (Pops up when needed) */}
            {currentObjection && (
                <div className="bg-orange-900/90 backdrop-blur-md rounded-xl shadow-xl border border-orange-500/50 p-4 animate-slide-in-right pointer-events-auto">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0" />
                        <div>
                            <h4 className="font-bold text-orange-200 text-sm uppercase tracking-wider mb-1">
                                Objeción Detectada: {currentObjection.title}
                            </h4>
                            <p className="text-white text-sm leading-relaxed mb-3">
                                {currentObjection.script}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentObjection(null)}
                                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 px-3 py-1 rounded text-xs font-semibold border border-orange-500/30 transition-colors"
                                >
                                    Usar Argumento
                                </button>
                                <button
                                    onClick={() => setCurrentObjection(null)}
                                    className="text-orange-400/60 hover:text-orange-400 px-2 text-xs"
                                >
                                    Ignorar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesCopilotHUD;
