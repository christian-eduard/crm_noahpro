/**
 * Dojo
 * Entrenador de ventas con IA.
 * Permite a los comerciales practicar escenarios de venta contra un LLM (simulado/conectado).
 */
import React, { useState, useEffect } from 'react';
import {
    Swords, Play, Mic, MicOff, Volume2, Trophy, AlertCircle,
    RefreshCcw, SkipForward, BarChart
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';

const SCENARIOS = [
    {
        id: 'cold-call',
        title: 'Llamada Fría (Gatekeeper)',
        difficulty: 'Hard',
        description: 'Intenta pasar el filtro de la secretaria y conseguir hablar con el decisor.',
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 'objection-price',
        title: 'Manejo de Precio',
        difficulty: 'Medium',
        description: 'El cliente está interesado pero dice que es demasiado caro. Defiende el valor.',
        color: 'from-orange-500 to-red-400'
    },
    {
        id: 'closing',
        title: 'Cierre de Venta',
        difficulty: 'Hard',
        description: 'El cliente está al borde de comprar. Usa técnicas de cierre para firmar ahora.',
        color: 'from-green-500 to-emerald-400'
    },
    {
        id: 'angry-client',
        title: 'Cliente Insatisfecho',
        difficulty: 'Extreme',
        description: 'Un cliente furioso quiere cancelar. Calma la situación y retén la cuenta.',
        color: 'from-red-600 to-red-800'
    }
];

const Dojo = () => {
    const [activeScenario, setActiveScenario] = useState(null);
    const [gameState, setGameState] = useState('menu'); // menu, playing, feedback
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [score, setScore] = useState(0);

    // Speech Synthesis
    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    };

    const handleStart = (scenario) => {
        setActiveScenario(scenario);
        setGameState('playing');
        setTranscript([]);
        setScore(0);
        speak(`Iniciando simulación: ${scenario.title}. Prepárate.`);

        // Simular primera frase del cliente tras 2 seg
        setTimeout(() => {
            const intro = getIntroScript(scenario.id);
            addMessage('ai', intro);
            speak(intro);
        }, 2000);
    };

    const getIntroScript = (id) => {
        switch (id) {
            case 'cold-call': return '¿Sí? Digame, ¿de parte de quién?';
            case 'objection-price': return 'Me gusta la propuesta, pero la verdad es que se nos va totalmente de presupuesto.';
            case 'closing': return 'Bueno, no sé, tendría que pensarlo un par de días más...';
            case 'angry-client': return '¡Esto es inaceptable! ¡Quiero cancelar mi suscripción ahora mismo!';
            default: return 'Hola.';
        }
    };

    const addMessage = (sender, text) => {
        setTranscript(prev => [...prev, { sender, text }]);
    };

    const toggleMic = () => {
        if (isListening) {
            setIsListening(false);
            // Simular fin de turno de usuario
            // En implementacion real, SpeechRecognition onresult
            setTimeout(() => {
                respondAI();
            }, 1000);
        } else {
            setIsListening(true);
            // Simular input de usuario tras unos segundos (para demo sin micro real obligatorio)
            // O usar Web Speech API real si está disponible.
            // Para robustez de la demo, mostraré un botón "Hablar" que togglea estado.
        }
    };

    // Simulación simple de respuesta IA
    const respondAI = () => {
        const responses = [
            "Entiendo, pero sigo sin verlo claro.",
            "Eso suena interesante, cuéntame más.",
            "No estoy seguro de que eso encaje con nosotros.",
            "Vale, tiene sentido."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage('ai', randomResponse);
        speak(randomResponse);
    };

    const finishSimulation = () => {
        setGameState('feedback');
        setScore(Math.floor(Math.random() * 40) + 60); // Random score 60-100
    };

    const renderMenu = () => (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                    <Swords className="w-10 h-10 text-orange-500" />
                    Sales Dojo
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Entrena tus habilidades de venta contra la IA más avanzada.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SCENARIOS.map(scenario => (
                    <div
                        key={scenario.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform cursor-pointer group"
                        onClick={() => handleStart(scenario)}
                    >
                        <div className={`h-32 rounded-xl bg-gradient-to-br ${scenario.color} mb-6 flex items-center justify-center shadow-lg`}>
                            <Swords className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{scenario.title}</h3>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${scenario.difficulty === 'Hard' ? 'bg-orange-100 text-orange-600' :
                                    scenario.difficulty === 'Extreme' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {scenario.difficulty}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">{scenario.description}</p>
                        <Button className="w-full justify-center">
                            Entrar al Dojo <Play className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPlaying = () => (
        <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Swords className="w-5 h-5 text-orange-500" />
                        {activeScenario.title}
                    </h2>
                    <p className="text-sm text-gray-500">En curso...</p>
                </div>
                <Button variant="danger" onClick={() => finishSimulation()}>
                    Terminar Sesión
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 overflow-y-auto space-y-4 mb-6 border border-gray-200 dark:border-gray-700">
                {transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${msg.sender === 'user'
                                ? 'bg-orange-500 text-white rounded-tr-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm shadow-sm'
                            }`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {transcript.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <Swords className="w-16 h-16 mb-4" />
                        <p>El escenario está cargando...</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4">
                <button
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${isListening
                            ? 'bg-red-500 hover:bg-red-600 scale-110 ring-4 ring-red-500/30'
                            : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                    onClick={toggleMic}
                >
                    {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                </button>
                <div className="absolute right-8 text-xs text-gray-400 max-w-[200px]">
                    * En demo: Haz clic para hablar (simulado), clic de nuevo para enviar.
                </div>
            </div>
        </div>
    );

    const renderFeedback = () => (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold mb-2">¡Sesión Completada!</h2>
            <p className="text-gray-500 mb-8">Has sobrevivido al escenario {activeScenario.title}.</p>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-3xl font-bold text-orange-500 mb-1">{score}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Score</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-3xl font-bold text-blue-500 mb-1">A</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Tono</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="text-3xl font-bold text-green-500 mb-1">95%</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">Objetivos</div>
                </div>
            </div>

            <div className="text-left bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-8">
                <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-4 h-4" /> Feedback de la IA
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Has manejado bien la objeción inicial, pero podrías haber sido más agresivo en el cierre.
                    Intenta usar la técnica del "Doble Alternativa" la próxima vez.
                </p>
            </div>

            <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => setGameState('menu')}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Volver al Menú
                </Button>
                <Button onClick={() => handleStart(activeScenario)}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Repetir Escenario
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            {gameState === 'menu' && renderMenu()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'feedback' && renderFeedback()}
        </div>
    );
};

export default Dojo;
