const PREDETERMINED_PROMPTS = {
    ANALYZE_PROSPECT: (data) => {
        const reviewsText = Array.isArray(data.reviews)
            ? data.reviews.map(r => `- "${r.text}" (${r.rating}★)`).join('\n')
            : 'No hay reseñas disponibles.';

        return `
DATOS DEL NEGOCIO A ANALIZAR:
- Nombre: ${data.name}
- Tipo: ${data.business_type || 'Desconocido'}
- Dirección: ${data.address || 'No disponible'}
- Ciudad: ${data.city || 'No disponible'}
- Teléfono: ${data.phone || 'No disponible'}
- Sitio Web: ${data.website || 'NO TIENE WEB'}
- Rating: ${data.rating || 'Sin valoración'} (${data.reviews_count || 0} reseñas)

RESEÑAS RECIENTES:
${reviewsText}

CONTENIDO SITIO WEB:
${data.webContent || 'No disponible o inaccesible'}

NOTAS INTERNAS: ${data.internal_notes || 'Ninguna'}

ANALIZA este negocio y devuelve el JSON con tu evaluación empresarial completa.`;
    },

    DEEP_ANALYZE: (data) => {
        return `Realiza un análisis PROFUNDO y una Auditoría Digital 360º para este negocio:
Nombre: ${data.name}
Tipo: ${data.business_type}
Web: ${data.website || 'No tiene'}
Rating: ${data.rating}

Devuelve un análisis exhaustivo incluyendo:
1. Auditoría Digital (Presencia, Web, SEO, Redes)
2. Inteligencia de Ventas (Propuesta de valor única, debilidades, oportunidades)
3. Tags sugeridos
4. Prioridad comercial`;
    },

    GENERATE_LANDING: (data, demoType, options = {}) => {
        return `Genera una Landing Page HTML ultra-premium para ${data.name}. 
        Tipo de diseño: ${demoType}. 
        Instrucciones: ${options.customPrompt || ''}.
        REQUISITOS: 
        1. HTML5 único archivo. 
        2. CSS moderno. 
        3. 100% Responsive. 
        4. Imágenes reales de Unsplash. 
        5. Secciones: Hero, Servicios, Testimonios, Contacto.
        Devuelve SOLO el código HTML.`;
    }
};

module.exports = PREDETERMINED_PROMPTS;
