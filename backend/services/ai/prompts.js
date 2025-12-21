/**
 * NoahPro AI Prompts - Detección Multi-Servicio
 * Tarea 3: Scoring Financiero y Categorización
 */

const PREDETERMINED_PROMPTS = {
    ANALYZE_PROSPECT: (data) => {
        const reviewsText = Array.isArray(data.reviews)
            ? data.reviews.map(r => `- "${r.text}" (${r.rating}★)`).join('\n')
            : 'No hay reseñas disponibles.';

        return `
ERES UN ANALISTA COMERCIAL EXPERTO. Tu objetivo es identificar OPORTUNIDADES DE VENTA para nuestros servicios.

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

=== SERVICIOS QUE VENDEMOS ===
1. **TPV/Datáfonos** - Detecta: "solo efectivo", "no acepta tarjeta", "pago cash", "caja"
2. **Diseño Web** - Detecta: sin website, web anticuada, no responsive, diseño antiguo
3. **Marketing Digital** - Detecta: pocas reseñas, mala reputación online, sin visibilidad
4. **Branding/Diseño** - Detecta: fotos de baja calidad, sin logo profesional, imagen anticuada
5. **Desarrollo Apps** - Detecta: negocio con procesos complejos, necesita reservas, pedidos
6. **Gestión Redes** - Detecta: sin Instagram, sin Facebook, sin TikTok, redes abandonadas
7. **Kit Digital/Verifactu** - Detecta: negocio sin digitalizar, facturación manual, cumplimiento normativo

=== CÁLCULO DE SCORE ===
- Sin Web: +20 puntos
- TPV Antiguo/Solo efectivo: +15 puntos  
- Malas Reseñas (<3.5 estrellas): +15 puntos
- Sin Redes Sociales: +10 puntos
- Fotos de baja calidad: +10 puntos
- Negocio complejo sin app: +10 puntos
- Necesita Kit Digital/Verifactu: +10 puntos

RESPONDE EN JSON CON ESTE FORMATO EXACTO:
{
  "priority": "Urgente|Alta|Media|Baja",
  "score": 0-100,
  "tags": ["Sin Web", "Verifactu", "Kit Digital", "Sin Redes", "TPV Antiguo", "Malas Reseñas"],
  "reasoning": "Breve explicación de por qué es buen cliente (max 2 líneas)",
  "suggested_pitch": "Frase de apertura para el comercial",
  "opportunities": {
    "needs_tpv": true/false,
    "needs_web": true/false,
    "needs_marketing": true/false,
    "needs_design": true/false,
    "needs_app": true/false,
    "needs_social": true/false,
    "needs_kit_digital": true/false
  },
  "digital_audit": {
    "web_quality": "Buena|Regular|Mala|No tiene",
    "social_presence": "Activa|Inactiva|No tiene",
    "reputation": "Buena|Media|Mala",
    "digitalization_level": "Alto|Medio|Bajo|Nulo"
  }
}`;
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
4. Prioridad comercial
5. Servicios recomendados: TPV, Web, Marketing, Apps, Redes, Kit Digital`;
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
