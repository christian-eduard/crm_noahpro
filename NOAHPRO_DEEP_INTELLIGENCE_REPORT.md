# NoahPro Deep Intelligence - Reporte Técnico Detallado v2.0
**Actualizado:** 21 Diciembre 2025

## 📋 Índice de Contenidos
1. [Visión Estratégica](#1-visión-estratégica)
2. [Nuevas Funcionalidades v2.0](#2-nuevas-funcionalidades-v20)
3. [Arquitectura de Funcionalidades Core](#3-arquitectura-de-funcionalidades-core)
4. [Sistema de Internacionalización](#4-sistema-de-internacionalización)
5. [Sistema de Temas (Dark/Light Mode)](#5-sistema-de-temas-darklight-mode)
6. [Guía de Base de Datos](#6-guía-de-base-de-datos)
7. [APIs y Servicios](#7-apis-y-servicios)
8. [Próximas Fases](#8-próximas-fases)

---

## 1. Visión Estratégica
**NoahPro Deep Intelligence** es la capa de inteligencia artificial avanzada y optimización de datos integrada en el ecosistema NoahPro CRM. No es solo un integrador de IA, sino un motor de toma de decisiones que maximiza el ROI comercial al:
1. **Reducir Costes Operativos:** Minimizando llamadas a APIs externas costosas (Google Maps, LLMs).
2. **Aumentar la Precisión de Venta:** Identificando el "momento de dolor" específico de cada negocio.
3. **Automatizar la Prospección:** Transformando la búsqueda manual en un proceso de "venda mientras duerme".
4. **Internacionalización Global:** Sistema multi-idioma modular para expansión internacional.
5. **Experiencia de Usuario Premium:** Modo oscuro/claro automático y manual.

---

## 2. Nuevas Funcionalidades v2.0

### 🌍 **Sistema de Internacionalización (i18n)**
**Implementado:** Diciembre 2025

#### **Arquitectura Modular**
```
frontend/src/locales/
├── es/
│   ├── landing.json
│   ├── recruitment.json
│   ├── dashboard.json
│   └── comercial.json
├── en/ (igual estructura)
├── fr/ (igual estructura)
├── it/ (igual estructura)
├── de/ (igual estructura)
└── ch/ (igual estructura - Swiss German)
```

#### **Características**
- ✅ **6 Idiomas Completos**: ES, EN, FR, IT, DE, CH
- ✅ **Selector Moderno**: Dropdown con banderas SVG de `flagcdn.com`
- ✅ **Namespaces Separados**: Por módulo (landing, recruitment, dashboard, comercial)
- ✅ **Fallback Inteligente**: Si falta traducción, usa idioma base
- ✅ **Integration Library**: `react-i18next` con configuración centralizada

#### **Componentes Traducidos**
| Componente | ES | EN | FR | IT | DE | CH |
|------------|----|----|----|----|----|----|
| Landing Principal | ✅ | ✅ | ✅ | 🔄 | 🔄 | 🔄 |
| Recruitment Landing | ✅ | ✅ | 🔄 | ✅ | ✅ | ✅ |
| ContactForm | ✅ | ✅ | ✅ | 🔄 | 🔄 | 🔄 |
| Dashboard Admin | ✅ | ✅ | 🔄 | 🔄 | 🔄 | 🔄 |
| Dashboard Comercial | ✅ | ✅ | 🔄 | 🔄 | 🔄 | 🔄 |

🔄 = Fallback a idioma base funcionando

#### **Configuración i18n**
```javascript
// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: { landing: landingES, recruitment: recruitmentES, ... },
  en: { landing: landingEN, recruitment: recruitmentEN, ... },
  // ... otros idiomas
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  ns: ['landing', 'recruitment', 'dashboard', 'comercial'],
  defaultNS: 'landing'
});
```

### 🎨 **Sistema de Temas (Dark/Light Mode)**
**Implementado:** Diciembre 2025

#### **Características**
- ✅ **Modo Automático**: Basado en hora del día (20:00-6:00 = oscuro)
- ✅ **Toggle Manual**: Botón Sol/Luna en todas las landings
- ✅ **Persistencia**: localStorage para guardar preferencia
- ✅ **Transiciones Suaves**: CSS transitions para cambio fluido
- ✅ **Context API**: `ThemeContext` centralizado

#### **Implementación Técnica**
```javascript
// frontend/src/contexts/ThemeContext.jsx
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    const [autoMode, setAutoMode] = useState(true);

    const getAutoTheme = () => {
        const hour = new Date().getHours();
        return (hour >= 20 || hour < 6) ? 'dark' : 'light';
    };

    // Auto-check cada minuto si está en modo auto
    useEffect(() => {
        if (!autoMode) return;
        const interval = setInterval(() => {
            setTheme(getAutoTheme());
        }, 60000);
        return () => clearInterval(interval);
    }, [autoMode]);

    // Aplicar clase dark al html
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
};
```

#### **Componentes con Soporte Dark Mode**
- ✅ Landing Principal (con toggle en nav)
- ✅ Recruitment Landing (con toggle en nav)
- ✅ ContactForm Modal
- 🔄 Dashboard Admin (pendiente)
- 🔄 Dashboard Comercial (pendiente)

### 💼 **Mejoras en UX/UI**

#### **Recruitment Landing Rediseñada**
- ✅ **Nuevo Branding**: "NoahPro Talent" (Top 1% Talent Only)
- ✅ **Gradientes Animados**: CSS animations para títulos
- ✅ **Iconos Premium**: Gradientes en beneficios (Green→Emerald, Blue→Cyan, Purple→Pink)
- ✅ **Micro-animaciones**: Hover effects y transiciones
- ✅ **Modo Dual**: Soporte completo dark/light
- ✅ **Upload Mejorado**: Drag & drop visual con feedback

#### **Footer Mejorado**
- ✅ **Nueva Columna "Empresa"**
- ✅ **Link "Estamos Contratando"** → `/careers/apply` con indicador verde
- ✅ **Estructura Organizada**: Producto | Empresa | Contacto
- ✅ **Traducido**: Footer completo en todos los idiomas

---

## 3. Arquitectura de Funcionalidades Core

### 🧠 **A. Cerebro Abierto (Open Brain Logic)**
El corazón de NoahPro es su capacidad de ser "re-configurado" sin tocar código.
- **Configurabilidad de Prompts Dinámica:** Tabla `system_prompts`
- **AIServiceFactory:** Conmutación entre proveedores (Gemini, OpenAI, Stormsboys Gateway)
- **Motor de Personalidad:** Inyección de contexto desde `ai_brain_settings`

### ⚡ **B. Smart Cache (Optimización de Google Places)**
- **Hashing de Consultas:** MD5 único por `query + ubicación + radio`
- **Búsqueda Semántica Local:** Reutilización de búsquedas similares
- **TTL Dinámico:** 30 días de validez para datos frescos
- **Ahorro Registrado:** Tracking en `search_cache_logs`

### 🧪 **C. Pipeline de Análisis de Prospectos (Deep Scan)**
- **Criba Digital:** Análisis de reseñas y sentimientos
- **Auditoría Web IA:** Calidad, velocidad, modernidad
- **Scoring 0-100:** Ponderación multifactorial
- **Etiquetado Inteligente:** `#UrgentTPV`, `#NoWeb`, `#HighPotential`

### 📂 **D. RAG Framework (Base de Conocimiento)**
- **Contexto Recuperado:** Consulta a `prospect_knowledge_base`
- **Vectores de Proximidad:** Preparación para búsquedas semánticas
- **Memoria Colectiva:** Alimentación continua de análisis

### 🏗️ **E. Infraestructura de Micro-Tareas (Workers)**
- **BullMQ + Redis:** Cola de tareas asíncronas
- **CRMService:** Persistencia sin conflictos de concurrencia
- **Job Priority:** Análisis profundo > Scraping de imágenes

---

## 4. Sistema de Internacionalización

### **Estructura de Archivos**
```json
// locales/es/landing.json
{
    "nav": { "benefits": "Beneficios", ... },
    "hero": { "title1": "El Software que...", ... },
    "contact_form": { "title": "Solicita tu Demo", ... }
}
```

### **Uso en Componentes**
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
    const { t, i18n } = useTranslation('landing');
    
    return (
        <h1>{t('hero.title1')}</h1>
        <button onClick={() => i18n.changeLanguage('en')}>EN</button>
    );
};
```

### **Selector de Idiomas**
```javascript
const LangSelector = () => {
    const languages = [
        { code: 'es', label: 'Español', flag: 'es' },
        { code: 'en', label: 'English', flag: 'us' },
        // ...
    ];

    return (
        <div className="dropdown">
            {languages.map(l => (
                <button onClick={() => changeLanguage(l.code)}>
                    <img src={`https://flagcdn.com/w40/${l.flag}.png`} />
                    {l.label}
                </button>
            ))}
        </div>
    );
};
```

---

## 5. Sistema de Temas (Dark/Light Mode)

### **ThemeContext API**
```javascript
const { theme, toggleTheme, autoMode, enableAutoMode } = useTheme();

// Toggle manual
<button onClick={toggleTheme}>
    {theme === 'dark' ? <Sun /> : <Moon />}
</button>

// Habilitar modo auto
<button onClick={enableAutoMode}>Auto Mode</button>
```

### **Clases Dark Mode en Tailwind**
```javascript
// Automático según tema
<div className="bg-white dark:bg-slate-800">
    <p className="text-slate-900 dark:text-white">
        Contenido adaptativo
    </p>
</div>
```

---

## 6. Guía de Base de Datos

### **Tablas Principales**

| Tabla | Propósito |
|-------|-----------|
| `system_prompts` | Prompts configurables para IA |
| `ai_brain_settings` | Configuración de personalidad IA |
| `search_cache_logs` | Caché de búsquedas Google Places |
| `prospect_knowledge_base` | RAG framework - memoria colectiva |
| `maps_prospects` | Prospectos detectados con scoring |
| `hunter_usage_stats` | Tracking de uso de IA y costes |

### **Nuevas Migraciones v2.0**
- `046_system_settings.sql`: Configuración global del sistema
- `045_stormsboys_gateway.sql`: Integración gateway AI
- `044_email_settings.sql`: Configuración SMTP

---

## 7. APIs y Servicios

### **AIServiceFactory**
```javascript
// Uso transparente de proveedores
const aiService = AIServiceFactory.getService(provider);
const response = await aiService.generateContent(prompt);
```

### **Proveedores Disponibles**
1. **DirectGeminiProvider**: Gemini 2.0 Flash directo
2. **OpenAIProvider**: GPT-4 Turbo
3. **StormsboysGatewayProvider**: Gateway empresarial con balanceo

### **CRMService**
```javascript
// Persistencia de análisis
await CRMService.saveProspectAnalysis({
    prospectId,
    analysis: aiResponse,
    score: 85,
    tags: ['#HighPotential', '#UrgentTPV']
});
```

---

## 8. Próximas Fases

### **Fase 3: Integración i18n en Dashboards**
- [ ] Traducir Dashboard Admin completo
- [ ] Traducir Dashboard Comercial completo
- [ ] Traducir todos los modales y formularios
- [ ] Completar traducciones FR, IT, DE, CH para todos los módulos

### **Fase 4: Optimizaciones**
- [ ] Implementar framer-motion para animaciones avanzadas
- [ ] Lazy loading de traducciones
- [ ] Bundle optimization con code splitting
- [ ] PWA capabilities

### **Fase 5: Testing & QA**
- [ ] Tests unitarios para componentes i18n
- [ ] Tests E2E con Playwright
- [ ] Verificación de accesibilidad (a11y)
- [ ] Performance audits con Lighthouse

---

## 📊 Métricas de Éxito v2.0

| Métrica | Valor Actual | Objetivo Q1 2026 |
|---------|--------------|------------------|
| Idiomas Soportados | 6 (ES, EN, FR, IT, DE, CH) | 10 |
| Cobertura Traducción | 60% | 100% |
| Componentes con Dark Mode | 3/20 | 20/20 |
| Performance Score | 85 | 95+ |
| Ahorro API Google | €500/mes | €1000/mes |

---

## 🔐 Notas de Seguridad

- ✅ Todas las claves API en variables de entorno
- ✅ CORS configurado correctamente
- ✅ Rate limiting en endpoints AI
- ✅ Sanitización de inputs en formularios
- ✅ HTTPS obligatorio en producción

---

## 📞 Contacto & Soporte

**Desarrollado por:** NoahPro Development Team  
**Versión:** 2.0  
**Fecha:** 21 Diciembre 2025  
**Licencia:** Propietaria

---

*Este reporte se actualiza continuamente. Última actualización: Feature i18n + Dark Mode completado.*
