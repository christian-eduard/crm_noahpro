/**
 * InterviewRoom
 * Sala de entrevistas asíncrona con IA.
 * Utiliza Web Speech API para TTS (Text-to-Speech) y STT (Speech-to-Text).
 */
import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';
import { Mic, MicOff, Volume2, StopCircle, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const InterviewRoom = () => {
    // Estado de la sesión
    const [token, setToken] = useState(null);
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('initializing'); // initializing, setup, ready, interviewing, completing, finished

    // Estado de la entrevista
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [answers, setAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0); // Para límite por pregunta si lo hubiera

    // Referencias Web Speech API
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        // Extraer token de la URL
        const path = window.location.pathname;
        const urlToken = path.split('/interview-room/')[1];

        if (!urlToken) {
            setError('Token de entrevista no válido');
            setLoading(false);
            return;
        }

        setToken(urlToken);
        validateToken(urlToken);

        // Cleanup al desmontar
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const validateToken = async (t) => {
        try {
            const response = await fetch(`${API_URL}/recruitment/interview/${t}`);
            if (response.ok) {
                const data = await response.json();
                setSessionData(data);
                setStatus('setup');
            } else {
                setError('La entrevista ha expirado o no es válida');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const startInterview = () => {
        setStatus('interviewing');
        // Pequeño delay para transición
        setTimeout(() => {
            askQuestion(0);
        }, 1000);
    };

    const askQuestion = (index) => {
        const questions = sessionData.template.questions;
        if (index >= questions.length) {
            finishInterview();
            return;
        }

        setCurrentQuestionIndex(index);
        const questionText = questions[index].question; // Ajustar según estructura JSON questions

        speak(questionText, () => {
            // Callback cuando termina de hablar: empezar a escuchar
            startListening();
        });
    };

    const speak = (text, onEnd) => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };

        setIsSpeaking(true);
        synthRef.current.speak(utterance);
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    // Interim visual feedback
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev + ' ' + finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            // Si se detiene y no hemos terminado, reactivarlo o dejarlo así para control manual
            if (isListening) setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListeningAndNext = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);

        // Guardar respuesta
        const currentQ = sessionData.template.questions[currentQuestionIndex];
        const newAnswer = {
            questionId: currentQ.id || currentQuestionIndex,
            question: currentQ.question,
            answer: transcript.trim() || "(Sin respuesta audible)"
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);
        setTranscript('');

        // Siguiente
        setTimeout(() => {
            askQuestion(currentQuestionIndex + 1);
        }, 1000);
    };

    const finishInterview = async () => {
        setStatus('completing');

        try {
            await fetch(`${API_URL}/recruitment/interview/${token}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers,
                    durationSeconds: 0 // Calcular real
                })
            });
            setStatus('finished');
        } catch (err) {
            console.error(err);
            setError("Error al guardar la entrevista. Contacta soporte.");
        }
    };

    // Render Logic ==========================================

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl max-w-md text-center border border-red-900/50">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        </div>
    );

    if (status === 'setup') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="max-w-xl w-full relative z-10">
                    <div className="text-center mb-10">
                        <div className="inline-block p-3 rounded-full bg-orange-500/20 mb-4">
                            <Mic className="w-8 h-8 text-orange-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Entrevista con NoahPro AI</h1>
                        <p className="text-gray-400">
                            Hola <strong>{sessionData?.candidate?.full_name}</strong>. Estás a punto de iniciar tu entrevista para el puesto de <strong>Sales Representative</strong>.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl mb-8">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Instrucciones:
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li>1. Asegúrate de estar en un lugar silencioso.</li>
                            <li>2. La IA te hará una serie de preguntas consecutivas.</li>
                            <li>3. Habla claro y pausado después de que la IA termine.</li>
                            <li>4. Pulsa "Terminar Respuesta" cuando acabes de hablar.</li>
                        </ul>
                    </div>

                    <button
                        onClick={startInterview}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transition-all transform hover:scale-[1.02]"
                    >
                        Comenzar Entrevista
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'interviewing') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800">
                    <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${((currentQuestionIndex) / (sessionData.template.questions.length || 1)) * 100}%` }}
                    />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
                    {/* Visualizer Circle */}
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ${isSpeaking ? 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.3)] scale-110' : isListening ? 'bg-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.3)] scale-110' : 'bg-slate-800'}`}>
                        {isSpeaking ? (
                            <Volume2 className="w-12 h-12 text-indigo-400 animate-pulse" />
                        ) : isListening ? (
                            <Mic className="w-12 h-12 text-green-400 animate-bounce" />
                        ) : (
                            <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                        )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 max-w-2xl leading-relaxed">
                        {sessionData.template.questions[currentQuestionIndex]?.question}
                    </h2>

                    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 w-full max-w-2xl min-h-[100px] border border-slate-700 mb-8 flex items-center justify-center">
                        <p className="text-lg text-gray-300 italic">
                            {transcript || (
                                <span className="text-gray-600">
                                    {isListening ? "Escuchando tu respuesta..." : isSpeaking ? "IA hablando..." : "..."}
                                </span>
                            )}
                        </p>
                    </div>

                    {isListening && (
                        <button
                            onClick={stopListeningAndNext}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3 rounded-full font-semibold transition-all flex items-center gap-2"
                        >
                            <StopCircle className="w-5 h-5" /> Terminar Respuesta
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'finished') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-lg">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">¡Entrevista Completada!</h1>
                    <p className="text-gray-400 mb-8">
                        Hemos registrado tus respuestas correctamente. Nuestra IA analizará la sesión y notificará al equipo de reclutamiento.
                        Recibirás noticias pronto.
                    </p>
                    <a href="/" className="text-orange-500 hover:text-orange-400 font-medium">Volver al inicio</a>
                </div>
            </div>
        );
    }

    return null;
};

export default InterviewRoom;
