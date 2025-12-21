import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [theme, setTheme] = useState('light');
    const [autoMode, setAutoMode] = useState(true);

    // Detectar tema basado en hora del día
    const getAutoTheme = () => {
        const hour = new Date().getHours();
        // Modo oscuro de 20:00 a 6:00
        return (hour >= 20 || hour < 6) ? 'dark' : 'light';
    };

    // Inicializar tema e idioma
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const savedAutoMode = localStorage.getItem('autoMode');
        const savedLanguage = localStorage.getItem('preferred_language');

        // Cargar idioma preferido
        if (savedLanguage && i18n.language !== savedLanguage) {
            i18n.changeLanguage(savedLanguage);
        }

        if (savedAutoMode === 'false') {
            setAutoMode(false);
            setTheme(savedTheme || 'light');
        } else {
            setAutoMode(true);
            setTheme(getAutoTheme());
        }
    }, [i18n]);

    // Auto-switch basado en hora si está en modo auto
    useEffect(() => {
        if (!autoMode) return;

        const interval = setInterval(() => {
            setTheme(getAutoTheme());
        }, 60000); // Revisar cada minuto

        return () => clearInterval(interval);
    }, [autoMode]);

    // Aplicar clase al html
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setAutoMode(false);
        localStorage.setItem('autoMode', 'false');

        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const enableAutoMode = () => {
        setAutoMode(true);
        localStorage.setItem('autoMode', 'true');
        setTheme(getAutoTheme());
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, autoMode, enableAutoMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
