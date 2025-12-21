import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LanguageSelector = ({ variant = 'default' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'es', label: 'Español', flag: 'es' },
        { code: 'en', label: 'English', flag: 'us' },
        { code: 'fr', label: 'Français', flag: 'fr' },
        { code: 'it', label: 'Italiano', flag: 'it' },
        { code: 'de', label: 'Deutsch', flag: 'de' },
        { code: 'ch', label: 'Schweiz', flag: 'ch' }
    ];

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('preferred_language', code);
        setIsOpen(false);
    };

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    // Variant para dashboard (compacto)
    if (variant === 'compact') {
        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    title="Change Language"
                >
                    <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="hidden md:inline text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                        {i18n.language}
                    </span>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                Select Language
                            </div>
                            {languages.map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => changeLanguage(l.code)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${i18n.language === l.code
                                            ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20'
                                            : 'text-gray-600 dark:text-gray-300 font-medium'
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <img
                                            src={`https://flagcdn.com/w40/${l.flag}.png`}
                                            alt={l.label}
                                            className="w-6 h-4 object-cover rounded shadow-sm"
                                        />
                                        {l.label}
                                    </span>
                                    {i18n.language === l.code && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Variant por defecto (landings)
    return (
        <div className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-2 border-white/30 hover:border-white/50 shadow-lg"
            >
                <Globe size={18} className="drop-shadow" />
                <span className="uppercase text-sm font-bold tracking-wide drop-shadow">{i18n.language}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 drop-shadow ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-40 overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Select Language
                        </div>
                        {languages.map(l => (
                            <button
                                key={l.code}
                                onClick={() => changeLanguage(l.code)}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === l.code
                                        ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20'
                                        : 'text-slate-600 dark:text-slate-300 font-medium'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <img
                                        src={`https://flagcdn.com/w40/${l.flag}.png`}
                                        alt={l.label}
                                        className="w-6 h-4 object-cover rounded shadow-sm"
                                    />
                                    {l.label}
                                </span>
                                {i18n.language === l.code && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSelector;
