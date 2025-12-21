import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar traducciones ES
import landingES from './locales/es/landing.json';
import recruitmentES from './locales/es/recruitment.json';
import dashboardES from './locales/es/dashboard.json';
import comercialES from './locales/es/comercial.json';

// Importar traducciones EN
import landingEN from './locales/en/landing.json';
import recruitmentEN from './locales/en/recruitment.json';
import dashboardEN from './locales/en/dashboard.json';
import comercialEN from './locales/en/comercial.json';

// Importar traducciones FR
import landingFR from './locales/fr/landing.json';
import dashboardFR from './locales/fr/dashboard.json';

// Importar traducciones IT
import landingIT from './locales/it/landing.json';
import recruitmentIT from './locales/it/recruitment.json';
import dashboardIT from './locales/it/dashboard.json';

// Importar traducciones DE
import landingDE from './locales/de/landing.json';
import recruitmentDE from './locales/de/recruitment.json';
import dashboardDE from './locales/de/dashboard.json';

// Importar traducciones CH
import landingCH from './locales/ch/landing.json';
import recruitmentCH from './locales/ch/recruitment.json';
import dashboardCH from './locales/ch/dashboard.json';

const resources = {
    es: {
        landing: landingES,
        recruitment: recruitmentES,
        dashboard: dashboardES,
        comercial: comercialES
    },
    en: {
        landing: landingEN,
        recruitment: recruitmentEN,
        dashboard: dashboardEN,
        comercial: comercialEN
    },
    fr: {
        landing: landingFR,
        recruitment: recruitmentES, // Fallback a ES hasta tener FR
        dashboard: dashboardFR,
        comercial: comercialES
    },
    it: {
        landing: landingIT,
        recruitment: recruitmentIT,
        dashboard: dashboardIT,
        comercial: comercialEN // Fallback a EN
    },
    de: {
        landing: landingDE,
        recruitment: recruitmentDE,
        dashboard: dashboardDE,
        comercial: comercialEN // Fallback a EN
    },
    ch: {
        landing: landingCH,
        recruitment: recruitmentCH,
        dashboard: dashboardCH,
        comercial: comercialEN // Fallback a EN
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'es',
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        },
        ns: ['landing', 'recruitment', 'dashboard', 'comercial'],
        defaultNS: 'landing'
    });

export default i18n;
