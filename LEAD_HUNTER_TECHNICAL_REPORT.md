# INFORME TÉCNICO: Lead Hunter AI & Compliance Verifactu
**Versión del Sistema:** 1.0.0  
**Fecha:** 19 de Diciembre 2025  
**Autor:** CTO Technical Team

---

## 1. ARQUITECTURA DE DATOS Y RELACIONES

### 1.1 Esquema de Base de Datos

#### Tablas Principales

**`maps_prospects`** - Núcleo del sistema de prospección
```sql
- id (SERIAL PRIMARY KEY)
- place_id (VARCHAR UNIQUE) -- ID único de Google Places
- name, phone, website, email
- rating (DECIMAL 2,1), reviews_count (INTEGER)
- address, city, postal_code
- business_type (VARCHAR), business_types (JSONB)
- has_website (BOOLEAN)

-- Análisis de IA (Gemini 2.5)
- ai_analysis (JSONB) -- Respuesta completa de Gemini
- ai_priority (VARCHAR) -- urgent|high|medium|low
- ai_tags (INTEGER[]) -- Array de IDs de tags
- ai_reasoning (TEXT)
- ai_message_subject, ai_message_body (TEXT)
- ai_channel (VARCHAR) -- email|whatsapp

-- Social Media & Reviews
- social_media (JSONB) -- {instagram, facebook, tiktok, linkedin, twitter}
- reviews (JSONB) -- Array de reseñas de Google
- photos (JSONB) -- URLs de fotos del negocio

-- Estado de procesamiento
- processed (BOOLEAN)
- lead_id (FK → leads.id)
- outreach_sent (BOOLEAN)
- outreach_sent_at (TIMESTAMP)

-- Tracking y Asignación
- searched_by (FK → users.id)
- search_query (VARCHAR)
- search_id (FK → hunter_search_history.id)
- strategy (VARCHAR) -- ID de estrategia aplicada
- assigned_to (FK → users.id)
- internal_notes (TEXT)
- created_at, processed_at, updated_at (TIMESTAMPS)
```

**`hunter_strategies`** - Estrategias de análisis IA configurables
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR) -- "Venta General", "VeriFactu", etc.
- icon (VARCHAR) -- Nombre del icono Lucide
- description (TEXT)
- prompt_template (TEXT) -- Instrucciones completas para Gemini
- is_active (BOOLEAN)
- is_system (BOOLEAN) -- Protege estrategias por defecto
- created_at, updated_at (TIMESTAMPS)
```

**`hunter_search_history`** - Historial de búsquedas agrupadas
```sql
- id (SERIAL PRIMARY KEY)
- user_id (FK → users.id)
- query (VARCHAR) -- "restaurantes", "peluquerías", etc.
- location (VARCHAR) -- "Madrid", "Barcelona Centro"
- business_type (VARCHAR)
- results_count (INTEGER)
- created_at (TIMESTAMP)
```

**`hunter_api_config`** - Configuración centralizada de APIs
```sql
- id (SERIAL PRIMARY KEY)
- api_name (VARCHAR UNIQUE) -- 'google_places', 'gemini_vertex', 'whatsapp_business'
- api_key, api_secret (TEXT)
- config_json (JSONB) -- Parámetros específicos
- is_active (BOOLEAN)
- last_tested_at (TIMESTAMP)
- test_result (VARCHAR) -- success|failed|pending
- updated_at, updated_by (FK → users.id)
```

**`hunter_usage_stats`** - Métricas diarias por usuario
```sql
- user_id + date (UNIQUE constraint)
- prospects_searched, prospects_analyzed (INTEGER)
- leads_created (INTEGER)
- messages_sent_email, messages_sent_whatsapp (INTEGER)
```

**`prospect_notes`** - Sistema de notas colaborativas
```sql
- id (SERIAL PRIMARY KEY)
- prospect_id (FK → maps_prospects.id)
- content (TEXT)
- use_for_analysis (BOOLEAN) -- ¿Enviar a la IA?
- created_at (TIMESTAMP)
```

**`hunter_demos`** - Demos generadas automáticamente
```sql
- id (SERIAL PRIMARY KEY)
- prospect_id (FK → maps_prospects.id)
- demo_type (VARCHAR) -- 'modern', 'restaurant', 'luxury', etc.
- html_content (TEXT) -- Landing page completa
- public_token (VARCHAR UNIQUE) -- Token para acceso público
- shared_at, created_by (FK → users.id)
```

**`business_types`** - Catálogo de tipos de negocio
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR) -- "Restaurantes", "Hoteles"
- icon (VARCHAR) -- Icono Lucide
- google_query (VARCHAR) -- Término exacto para Google Places API
- category (VARCHAR) -- 'hosteleria', 'retail', 'servicios'
- is_active (BOOLEAN)
```

#### Extensiones a Tablas Existentes

**`users`**
```sql
+ has_lead_hunter_access (BOOLEAN)
+ hunter_daily_limit (INTEGER DEFAULT 50)
+ hunter_prospects_today (INTEGER DEFAULT 0)
+ hunter_last_reset (DATE) -- Reset diario automático
```

---

### 1.2 Flujo de Datos: De Google Maps a Lead Asignado

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: SCRAPING & INGESTA                                      │
└─────────────────────────────────────────────────────────────────┘
   ↓
   1. Usuario introduce: "restaurantes en Madrid" + radio 5km
   2. googlePlacesService.searchPlaces() → Google Places API
      - Paginación automática (20 + 20 + 20...) hasta maxResults
      - Delay de 2s entre páginas (requisito de Google)
   3. Por cada resultado:
      - googlePlacesService.getPlaceDetails(place_id)
      - Extrae: nombre, teléfono, web, rating, reviews, fotos
   4. Inserción en maps_prospects (ON CONFLICT DO NOTHING)
      - Crea registro search_history
      - Vincula prospect.search_id → history.id

┌─────────────────────────────────────────────────────────────────┐
│ FASE 2: ANÁLISIS INTELIGENTE (IA)                               │
└─────────────────────────────────────────────────────────────────┘
   ↓
   5. geminiService.analyzeProspect(prospect)
      a) Construye prompt con: 
         - Datos del negocio (nombre, tipo, ubicación)
         - Reseñas recientes (texto + rating)
         - Contenido web (scraped si existe)
         - Notas internas del comercial (si existen)
         - Estrategia seleccionada (VeriFactu, Kit Digital, etc.)
      
      b) Llama a Gemini 2.5 Pro con:
         - system_instruction: prompt_template de la estrategia
         - generationConfig: { responseMimeType: 'application/json' }
      
      c) Recibe JSON estructurado:
         {
           "social_media": {...},
           "review_analysis": {...},
           "tags": [7, 8, 9],
           "priority": "high",
           "personalized_message": {
             "subject": "...",
             "body": "...",
             "channel": "whatsapp"
           },
           "opportunity_map": {...},
           "reasoning": "..."
         }
      
   6. Guarda en maps_prospects:
      - ai_analysis (JSON completo)
      - ai_priority, ai_tags, ai_reasoning
      - ai_message_subject, ai_message_body, ai_channel

┌─────────────────────────────────────────────────────────────────┐
│ FASE 3: PROCESAMIENTO COMERCIAL                                 │
└─────────────────────────────────────────────────────────────────┘
   ↓
   7. Comercial revisa en dashboard:
      - Filtros: Prioridad, Ciudad, Procesado, Tags
      - Modal de detalle con análisis IA completo
      - Puede:
         a) Añadir notas (→ prospect_notes, use_for_analysis=true)
         b) Re-analizar con IA (re-ejecuta Gemini con nuevas notas)
         c) Asignar a otro comercial (assigned_to)
         d) Generar demo web (→ hunter_demos)
   
   8. Conversión a Lead (1-Click):
      leadHunterService.processProspectToLead(prospectId)
      - Crea registro en tabla leads
      - Aplica tags sugeridos por IA
      - Establece prioridad y fecha de contacto
      - Marca prospect.processed = true
      - Actualiza prospect.lead_id

┌─────────────────────────────────────────────────────────────────┐
│ FASE 4: OUTREACH AUTOMATIZADO                                   │
└─────────────────────────────────────────────────────────────────┘
   ↓
   9. Envío según ai_channel:
      - Email: usa ai_message_subject + ai_message_body
      - WhatsApp: formato texto plano con personalización
   10. Actualiza: outreach_sent = true, outreach_sent_at = NOW()
```

---

## 2. MOTOR DE INTELIGENCIA: GEMINI 2.5 PRO + VERTEX AI

### 2.1 Lógica de Compliance Verifactu

La IA evalúa el cumplimiento mediante un sistema de **inferencia basado en señales**:

#### Señales de Incumplimiento Detectadas

1. **Ausencia de Web Moderna** (PESO: 30%)
   - Si `website === null` → Alta probabilidad de software manual
   - Si web existe pero no menciona "facturación electrónica" → Sospecha media

2. **Tipo de Negocio Obligado** (PESO: 40%)
   - Hostelería (restaurantes, bares, cafeterías): **Obligatorio VeriFactu**
   - Retail físico (tiendas, boutiques): **Obligatorio**
   - Servicios profesionales: Recomendado

3. **Análisis de Reseñas** (PESO: 20%)
   - Menciones de "ticket manual", "recibo a mano" → Incumplimiento confirmado
   - Quejas sobre "no factura" → Señal de alerta

4. **Antigüedad Percibida** (PESO: 10%)
   - Rating bajo + pocas reseñas + no web → Negocio tradicional → Mayor riesgo

#### Prompt Template VeriFactu (Ejemplo)
```javascript
const verifactuPrompt = `
CONTEXTO: Ley Antifraude 2025/2027 - España
OBLIGACIÓN: Todos los negocios de hostelería y retail deben usar software certificado.
MULTAS: Hasta 50.000€ por incumplimiento.

ANALIZA:
- Nombre: ${prospect.name}
- Tipo: ${prospect.business_type}
- Web: ${prospect.website || 'NO TIENE'}
- Reseñas: ${reviewsText}

DETERMINA:
1. ¿Es un negocio obligado por VeriFactu? (SI/NO)
2. ¿Hay indicios de software no certificado? (SI/NO/DESCONOCIDO)
3. Prioridad: urgent si cumple ambos, high si solo el primero

SALIDA JSON:
{
  "tags": [7], // ID 7 = "Interesado Verifactu"
  "priority": "urgent|high",
  "reasoning": "Restaurante sin web moderna. Alta probabilidad de tickets manuales..."
}
`;
```

### 2.2 Estructura del JSON de Salida

```typescript
interface GeminiAnalysisResponse {
  // Social Media Detection
  social_media: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
    linkedin?: string | null;
    twitter?: string | null;
  };

  // Review Sentiment Analysis
  review_analysis: {
    sentiment: 'positivo' | 'neutral' | 'negativo';
    main_topics: string[]; // ["calidad comida", "tiempo espera", ...]
    improvement_suggestions: string[]; // ["Mejorar atención al cliente", ...]
  };

  // Tag Assignment (IDs predefinidos)
  tags: number[]; // [7, 8, 9] → Verifactu, Demo, SinWeb

  // Priority Level
  priority: 'urgent' | 'high' | 'medium' | 'low';

  // Personalized Outreach
  personalized_message: {
    subject: string; // "🚨 Evita multas de Hacienda"
    body: string; // "Hola {{businessName}}, detectamos que..."
    channel: 'email' | 'whatsapp';
  };

  // Opportunity Analysis
  opportunity_map: {
    strengths: string[]; // ["Buena ubicación", "Alta puntuación"]
    weaknesses: string[]; // ["Sin presencia digital", "Reseñas negativas"]
    pain_points: string[]; // ["Gestión manual", "Sin control stock"]
    solutions: string[]; // ["TPV NoahPro con Verifactu", ...]
  };

  // AI Reasoning
  reasoning: string; // Explicación del análisis
}
```

### 2.3 Mapeo Backend → Frontend

```javascript
// backend/services/geminiService.js
const analysis = await gemini.generateContent(...);
const parsed = JSON.parse(analysis.text);

// Guardado en DB
await db.query(`
  UPDATE maps_prospects SET
    ai_analysis = $1,
    ai_priority = $2,
    ai_tags = $3,
    ai_reasoning = $4,
    ai_message_subject = $5,
    ai_message_body = $6,
    ai_channel = $7
  WHERE id = $8
`, [
  JSON.stringify(parsed), // Completo para auditoría
  parsed.priority,
  parsed.tags,
  parsed.reasoning,
  parsed.personalized_message.subject,
  parsed.personalized_message.body,
  parsed.personalized_message.channel,
  prospectId
]);

// Frontend: LeadHunterDashboard.jsx
const priorityColors = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700'
};

// Renderizado de badges
<span className={priorityColors[prospect.ai_priority]}>
  {prospect.ai_priority.toUpperCase()}
</span>
```

---

## 3. ECOSISTEMA DE SERVICIOS Y APIS

### 3.1 Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPA DE SERVICIOS (backend/services/)                           │
└─────────────────────────────────────────────────────────────────┘

googlePlacesService.js
  ├─ searchPlaces(query, location, radius, limitOnePage)
  │  ├─ Construye URL: https://maps.googleapis.com/maps/api/place/textsearch/json
  │  ├─ Parámetros: query="restaurantes", location="Madrid", radius=5000
  │  ├─ Paginación: next_page_token (delay 2s entre páginas)
  │  └─ Retorna: Array<{place_id, name, rating, ...}>
  │
  ├─ getPlaceDetails(place_id)
  │  ├─ URL: .../place/details/json?place_id=XXX
  │  ├─ Fields: name, formatted_phone_number, website, rating, reviews, photos
  │  └─ Retorna: Objeto detallado del negocio
  │
  └─ searchAndSave(query, location, userId, radius, strategy, maxResults)
      ├─ Ejecuta searchPlaces() recursivamente hasta alcanzar maxResults
      ├─ Por cada resultado: getPlaceDetails() + INSERT INTO maps_prospects
      ├─ Crea hunter_search_history
      └─ Actualiza hunter_usage_stats

geminiService.js
  ├─ analyzeProspect(prospect)
  │  ├─ Construye prompt con: datos negocio + reseñas + web content + notas
  │  ├─ Selecciona estrategia: getStrategyInstruction(strategy)
  │  ├─ Llama a Gemini API:
  │  │  POST /v1beta/models/gemini-2.0-flash-exp:generateContent
  │  │  Body: { system_instruction, contents, generationConfig }
  │  └─ Parsea JSON y valida estructura
  │
  ├─ generateLandingPage(prospect, demoType, customPrompt)
  │  ├─ Construye prompt de diseño web
  │  ├─ Incluye fotos del negocio (si existen) o placeholders de Unsplash
  │  ├─ Genera HTML completo con formulario de contacto
  │  └─ Retorna: código HTML listo para renderizar
  │
  ├─ improveNotes(currentNotes, businessContext)
  │  ├─ Prompt: "Reescribe estas notas de forma profesional"
  │  └─ Retorna: texto mejorado
  │
  ├─ performDeepSearch(prospect)
  │  ├─ Simula búsqueda en redes sociales y SEO
  │  └─ Retorna: { social_media, seo_analysis, deep_insights }
  │
  └─ refinePrompt(userPrompt)
      ├─ Optimiza prompts personalizados del usuario
      └─ Retorna: prompt estructurado y profesional

leadHunterService.js (ORQUESTADOR PRINCIPAL)
  ├─ checkUserAccess(userId)
  │  ├─ Verifica: has_lead_hunter_access = true
  │  ├─ Resetea contador si es nuevo día
  │  └─ Valida: hunter_prospects_today < hunter_daily_limit
  │
  ├─ searchProspects(query, location, userId, radius, strategy, maxResults)
  │  ├─ Verifica acceso (checkUserAccess)
  │  ├─ Llama a googlePlacesService.searchAndSave()
  │  ├─ Descuenta 1 búsqueda: hunter_prospects_today += 1
  │  └─ Retorna: { saved, skipped, total }
  │
  ├─ analyzeProspect(prospectId, userId)
  │  ├─ Valida permisos
  │  ├─ Llama a geminiService.analyzeAndSave()
  │  └─ Actualiza estadísticas
  │
  ├─ processProspectToLead(prospectId, userId, customData)
  │  ├─ BEGIN TRANSACTION
  │  ├─ INSERT INTO leads (nombre, email, teléfono, prioridad)
  │  ├─ INSERT INTO lead_tags (lead_id, tag_id) -- Aplica tags de IA
  │  ├─ UPDATE maps_prospects SET processed=true, lead_id=X
  │  ├─ COMMIT
  │  └─ Retorna: lead creado
  │
  └─ generateDemo(prospectId, userId, demoType, customPrompt)
      ├─ Llama a geminiService.generateLandingPage()
      ├─ INSERT INTO hunter_demos (html_content, public_token)
      └─ Retorna: { demoId, publicUrl }
```

### 3.2 Flujo de Autenticación y Uso de Credenciales

```javascript
// 1. CONFIGURACIÓN INICIAL (Admin Panel)
// → frontend/src/components/settings/LeadHunterSettings.jsx
<input name="googlePlacesApiKey" />
<input name="geminiApiKey" />
<button onClick={testConnection}>Probar Conexión</button>

// 2. GUARDADO EN DB
POST /api/hunter/config
{
  "api_name": "google_places",
  "api_key": "AIzaSy...",
  "config_json": { "dailyLimit": 1000 }
}

INSERT INTO hunter_api_config (api_name, api_key, ...) VALUES (...);

// 3. USO EN SERVICIOS (Lazy Loading)
class GooglePlacesService {
  constructor() {
    this.apiKey = null; // No cargado en memoria
  }

  async getConfig() {
    // Solo se consulta cuando se necesita
    const result = await db.query(
      "SELECT api_key FROM hunter_api_config WHERE api_name = 'google_places'"
    );
    this.apiKey = result.rows[0].api_key;
  }

  async searchPlaces(...) {
    if (!this.apiKey) await this.getConfig();
    const url = `https://maps.googleapis.com/.../json?key=${this.apiKey}`;
    // ...
  }
}

// 4. SEGURIDAD
// - Las API keys NUNCA se envían al frontend
// - Solo el admin puede configurarlas
// - La ruta POST /api/hunter/config tiene middleware isAdmin
// - Las credenciales se leen desde DB en cada servicio (no en variables de entorno)
```

---

## 4. FUNCIONALIDADES DE USUARIO (FRONTEND)

### 4.1 Vista Comercial

**Componente Principal:** `LeadHunterDashboard.jsx`

#### Sistema de Tooltips Educativos
```jsx
// Ejemplo: Tooltip en campo "Tipo de Negocio"
<label className="flex items-center gap-1">
  Tipo de Negocio
  <span className="relative group cursor-help">
    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
    <span className="absolute bottom-full left-0 mb-2 w-64 p-2 
                     bg-gray-900 text-white text-[10px] rounded-lg 
                     opacity-0 group-hover:opacity-100 transition-opacity 
                     pointer-events-none z-50 leading-tight">
      Selecciona una categoría predefinida o elige "Personalizado" 
      para escribir exactamente lo que buscas (ej: "Empresas de placas solares").
    </span>
  </span>
</label>
```

**Ubicaciones de Tooltips:**
- **Tipo de Negocio:** Explica opciones predefinidas vs custom
- **Ciudad/Zona:** Acepta nombres de ciudad, direcciones o coordenadas
- **Radio:** Impacto en número de resultados
- **Estrategia IA:** Diferencias entre VeriFactu, Kit Digital, etc.
- **Límite de resultados:** Relación entre 20 (Rápida), 40 (Normal), 60 (Profunda)

#### Filtrado Avanzado
```jsx
const [filterPriority, setFilterPriority] = useState('all');
const [filterProcessed, setFilterProcessed] = useState('all');
const [filterCity, setFilterCity] = useState('');

// Filtrado reactivo
const filteredProspects = prospects.filter(p => {
  if (filterPriority !== 'all' && p.ai_priority !== filterPriority) return false;
  if (filterProcessed !== 'all') {
    const isProcessed = filterProcessed === 'processed';
    if (p.processed !== isProcessed) return false;
  }
  if (filterCity && !p.city.toLowerCase().includes(filterCity.toLowerCase())) return false;
  return true;
});

// UI de filtros
<select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
  <option value="all">Todas las prioridades</option>
  <option value="urgent">🔴 Urgente</option>
  <option value="high">🟠 Alta</option>
  <option value="medium">🟡 Media</option>
  <option value="low">🟢 Baja</option>
</select>
```

#### Sistema de Conversión en 1-Click
```jsx
const handleConvertToLead = async (prospectId) => {
  try {
    const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/convert`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    if (res.ok) {
      toast.success(`Lead #${data.lead.id} creado correctamente`);
      // Actualiza UI: marca prospect como procesado
      setProspects(prev => prev.map(p => 
        p.id === prospectId ? { ...p, processed: true, lead_id: data.lead.id } : p
      ));
    }
  } catch (error) {
    toast.error('Error al convertir a lead');
  }
};

// Botón en modal de detalle
<Button onClick={() => handleConvertToLead(selectedProspect.id)}>
  <Check className="w-4 h-4 mr-2" />
  Convertir a Lead
</Button>
```

**Flujo de conversión:**
1. Click en "Convertir a Lead"
2. Backend crea registro en `leads` con datos del prospect
3. Aplica tags sugeridos por IA (`ai_tags`)
4. Establece prioridad de contacto (`ai_priority`)
5. Marca `processed = true` en `maps_prospects`
6. Retorna lead creado
7. Frontend actualiza UI sin recargar página

#### Modal de Detalle de Prospecto
```jsx
// Componente ProspectDetailModal
<Modal isOpen={!!selectedProspect} size="xxl">
  <div className="grid grid-cols-3 gap-6">
    {/* Columna 1: Info Básica */}
    <div>
      <h2>{prospect.name}</h2>
      <p>{prospect.phone}</p>
      <a href={prospect.website}>🌐 Ver web</a>
      <div>
        <Star rating={prospect.rating} />
        ({prospect.reviews_count} reseñas)
      </div>
    </div>

    {/* Columna 2: Análisis de IA */}
    <div>
      <h3>Inteligencia de Cierre</h3>
      <Badge priority={prospect.ai_priority}>
        {prospect.ai_priority}
      </Badge>
      
      <h4>Puntos de Dolor Detectados:</h4>
      <ul>
        {prospect.ai_analysis.opportunity_map.pain_points.map(pain =>
          <li key={pain}>• {pain}</li>
        )}
      </ul>

      <h4>Soluciones Sugeridas:</h4>
      <ul>
        {prospect.ai_analysis.opportunity_map.solutions.map(sol =>
          <li key={sol}>✓ {sol}</li>
        )}
      </ul>
    </div>

    {/* Columna 3: Acciones */}
    <div>
      <Button onClick={handleConvertToLead}>Convertir a Lead</Button>
      <Button onClick={handleGenerateDemo}>Generar Demo</Button>
      <Button onClick={handleSendWhatsApp}>Enviar WhatsApp</Button>
    </div>
  </div>
</Modal>
```

### 4.2 Vista Administrador

**Componente:** `LeadHunterSettings.jsx` + `HunterStrategiesSettings.jsx`

#### Control de Permisos
```jsx
// Panel de Usuarios
<table>
  <thead>
    <tr>
      <th>Comercial</th>
      <th>Acceso Lead Hunter</th>
      <th>Límite Diario</th>
      <th>Usado Hoy</th>
    </tr>
  </thead>
  <tbody>
    {users.filter(u => u.role === 'commercial').map(user =>
      <tr key={user.id}>
        <td>{user.full_name}</td>
        <td>
          <Toggle 
            checked={user.has_lead_hunter_access}
            onChange={checked => updateUserAccess(user.id, checked)}
          />
        </td>
        <td>
          <input 
            type="number" 
            value={user.hunter_daily_limit}
            onChange={e => updateUserLimit(user.id, e.target.value)}
          />
        </td>
        <td>{user.hunter_prospects_today} / {user.hunter_daily_limit}</td>
      </tr>
    )}
  </tbody>
</table>

// Handler de actualización
const updateUserAccess = async (userId, hasAccess) => {
  await fetch(`${API_URL}/admin/users/${userId}/hunter-access`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ has_lead_hunter_access: hasAccess })
  });
  fetchUsers(); // Refresca lista
};
```

#### Gestión de APIs
```jsx
// Configuración de Google Places
<div className="api-config-card">
  <h3>Google Places API</h3>
  <input 
    type="password" 
    placeholder="AIzaSy..."
    value={googleApiKey}
    onChange={e => setGoogleApiKey(e.target.value)}
  />
  <Button onClick={() => testApi('google_places')}>
    Probar Conexión
  </Button>
  <span className={apiStatus === 'success' ? 'text-green-500' : 'text-red-500'}>
    {apiStatus === 'success' ? '✓ Conectado' : '✗ Error'}
  </span>
</div>

// Test de conexión
const testApi = async (apiName) => {
  const res = await fetch(`${API_URL}/hunter/config/test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_name: apiName })
  });
  const data = await res.json();
  setApiStatus(data.success ? 'success' : 'failed');
  toast[data.success ? 'success' : 'error'](data.message);
};
```

#### Gestión de Estrategias de IA
```jsx
// Componente HunterStrategiesSettings

// Lista de estrategias
{strategies.map(strategy =>
  <div key={strategy.id} className="strategy-card">
    <div className="flex items-center gap-4">
      <Icon name={strategy.icon} />
      <div>
        <h4>{strategy.name}</h4>
        <p className="text-sm text-gray-500">{strategy.description}</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button onClick={() => setEditingStrategy(strategy)}>
        <Edit2 className="w-4 h-4" />
      </button>
      {!strategy.is_system && (
        <button onClick={() => handleDeleteClick(strategy.id)}>
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
)}

// Editor de estrategia
{editingStrategy && (
  <form onSubmit={handleSubmit}>
    <input 
      name="name" 
      value={editingStrategy.name}
      onChange={e => setEditingStrategy({...editingStrategy, name: e.target.value})}
    />
    <textarea 
      name="prompt_template"
      rows={8}
      placeholder="Instrucciones completas para Gemini..."
      value={editingStrategy.prompt_template}
    />
    <Button type="submit">Guardar Estrategia</Button>
  </form>
)}
```

---

## 5. AUTOMATIZACIÓN DE OUTREACH

### 5.1 Generación de Mensajes Personalizados

**Motor de Plantillas:**
```javascript
// backend/services/geminiService.js

// 1. Gemini genera mensaje base
const messageTemplate = analysis.personalized_message.body;
// → "Hola {{businessName}}, detectamos que tu {{businessType}} en {{city}}..."

// 2. Backend reemplaza variables
const personalizeMessage = (template, prospect) => {
  return template
    .replace(/{{businessName}}/g, prospect.name)
    .replace(/{{businessType}}/g, prospect.business_type)
    .replace(/{{city}}/g, prospect.city)
    .replace(/{{rating}}/g, prospect.rating)
    .replace(/{{phone}}/g, prospect.phone || 'tu negocio');
};

// 3. Resultado final
const finalMessage = personalizeMessage(messageTemplate, prospect);
// → "Hola Restaurante La Esquina, detectamos que tu restaurante en Madrid..."
```

**Ejemplo de Mensaje Generado:**
```
Canal: WhatsApp
Asunto: N/A (directo)
Cuerpo:
"
Hola Restaurante La Esquina 👋

Soy Christian de NoahPro. He visto que tu restaurante en Madrid 
tiene muy buenas reseñas (4.5⭐), pero aún no usas facturación 
electrónica obligatoria.

⚠️ Desde 2025, Hacienda multa hasta 50.000€ a negocios sin 
software certificado VeriFactu.

✅ Te ofrezco:
- TPV 100% certificado
- 0€ instalación si decides antes del viernes
- Formación incluida

¿Te viene bien que te llame mañana a las 11h?
"
```

### 5.2 Sistema de Demos Automáticas

**Proceso de Generación:**
```javascript
// 1. Usuario selecciona tipo de demo
const demoTypes = ['modern', 'restaurant', 'luxury', 'store', 'services'];

// 2. Frontend solicita generación
const handleGenerateDemo = async (prospectId, demoType) => {
  setGenerating(true);
  const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/demo`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      demoType,
      customPrompt: customInstructions // Opcional
    })
  });

  const data = await res.json();
  
  // 3. Muestra preview en modal
  setDemoPreview(data.html_content);
  setDemoPublicUrl(data.publicUrl);
  setGenerating(false);
};

// 4. Backend (geminiService.generateLandingPage)
const prompt = `
Crea una landing page HTML moderna para:
- Negocio: ${prospect.name}
- Tipo: ${prospect.business_type}
- Ciudad: ${prospect.city}
- Estilo: ${demoType} (modern/restaurant/luxury)

REQUISITOS:
- Hero section con imagen de fondo
- Sección "Sobre Nosotros"
- Galería de servicios/productos
- Testimonios (3 ficticios basados en las reseñas reales)
- Formulario de contacto que envía a /api/hunter/demos/contact
- Footer con info de contacto

IMÁGENES:
${prospect.photos.length > 0 
  ? 'Usa estas fotos reales del negocio:\n' + prospect.photos.join('\n')
  : 'Usa placeholders de https://images.unsplash.com/...'
}

SALIDA: Solo código HTML. Sin markdown. Empieza con <!DOCTYPE html>.
`;

// 5. Gemini genera HTML completo (~8192 tokens)
// 6. Se guarda en hunter_demos con token único
// 7. URL pública: https://crm.noahpro.es/demos/{public_token}
```

**Estructura de Demo Generada:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Restaurante La Esquina - Madrid</title>
  <style>
    /* CSS moderno con variables, grid, flexbox */
    :root {
      --primary: #FF6B35;
      --secondary: #004E89;
    }
    body { font-family: 'Inter', sans-serif; }
    .hero { 
      background: url('foto-real.jpg') center/cover;
      height: 100vh;
    }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Restaurante La Esquina</h1>
    <p>Cocina tradicional en el corazón de Madrid</p>
    <button>Reserva Ahora</button>
  </section>
  
  <section class="about">...</section>
  <section class="menu">...</section>
  <section class="testimonials">...</section>
  
  <section class="contact">
    <form id="contactForm">
      <input name="name" placeholder="Tu nombre" required>
      <input name="email" type="email" placeholder="Email" required>
      <input name="phone" placeholder="Teléfono">
      <textarea name="message" placeholder="Mensaje"></textarea>
      <button type="submit">Enviar Solicitud</button>
    </form>
  </section>

  <script>
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const res = await fetch('/api/hunter/demos/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: '${prospect.id}',
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message')
        })
      });

      if (res.ok) {
        alert('¡Solicitud enviada! Nos pondremos en contacto pronto.');
        e.target.reset();
      }
    });
  </script>
</body>
</html>
```

### 5.3 Protocolo de Envío

#### Email (SMTP)
```javascript
// backend/services/emailService.js (hipotético, no implementado aún)
const sendProspectEmail = async (prospectId) => {
  const prospect = await getProspect(prospectId);
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: prospect.email,
    subject: prospect.ai_message_subject,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>${prospect.ai_message_subject}</h2>
        <p>${prospect.ai_message_body.replace(/\n/g, '<br>')}</p>
        
        <a href="${demoUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #FF6B35;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        ">
          Ver Demo de tu Web
        </a>

        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Este mensaje fue generado automáticamente por NoahPro AI.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  
  // Actualizar prospect
  await db.query(`
    UPDATE maps_prospects 
    SET outreach_sent = true, 
        outreach_sent_at = NOW() 
    WHERE id = $1
  `, [prospectId]);
};
```

#### WhatsApp (Meta Business API)
```javascript
// backend/services/whatsappService.js (hipotético)
const sendWhatsAppMessage = async (prospectId) => {
  const prospect = await getProspect(prospectId);
  const config = await getWhatsAppConfig();
  
  const payload = {
    messaging_product: "whatsapp",
    to: prospect.phone.replace(/\s/g, ''), // +34612345678
    type: "text",
    text: {
      body: prospect.ai_message_body + `\n\n🔗 Ver demo: ${demoUrl}`
    }
  };

  const res = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error('WhatsApp send failed');
  
  await db.query(`UPDATE maps_prospects SET outreach_sent = true WHERE id = $1`, [prospectId]);
};
```

---

## 6. DICCIONARIO DE TAGS Y PRIORIDADES

### 6.1 Tags del Sistema (tabla `tags`)

| ID | Nombre | Color | Descripción | Criterio de Asignación IA |
|----|--------|-------|-------------|---------------------------|
| 1 | Restaurante | `#4CAF50` | Negocio de hostelería | `business_types` contiene "restaurant", "bar", "cafe" |
| 2 | Hotel | `#2196F3` | Alojamiento | `business_types` contiene "lodging", "hotel" |
| 3 | Retail | `#9C27B0` | Comercio minorista | `business_types` contiene "store", "shop", "clothing" |
| 4 | Franquicia | `#FF9800` | Cadena de negocios | Más de 5 ubicaciones con mismo nombre en la ciudad |
| 5 | Interesado Verifactu | `#00BCD4` | Obligado por ley antifraude | `business_type` en ['restaurant', 'bar', 'retail'] AND (`website` is null OR `reviews` mencionan "ticket manual") |
| 6 | Requiere Demo | `#E91E63` | Necesita ver producto | `rating` < 3.5 OR `reviews_count` < 10 AND `website` is null |
| 7 | Sin Web | `#607D8B` | No tiene presencia digital | `website` is null OR `website` no responde |
| 8 | Lead Hunter | `#FF5722` | Prospecto del módulo Lead Hunter | Asignado automáticamente a todos los prospects |

### 6.2 Matriz de Prioridades

```typescript
type Priority = 'urgent' | 'high' | 'medium' | 'low';

const priorityLogic = (prospect, strategy) => {
  let score = 0;
  
  // FACTOR 1: Obligación Legal (si estrategia = VeriFactu)
  if (strategy === 'verifactu') {
    if (isObligadoVerifactu(prospect)) score += 40;
    if (!prospect.website) score += 20;
  }

  // FACTOR 2: Ausencia de Web
  if (!prospect.website) score += 15;

  // FACTOR 3: Rating Bajo (oportunidad de mejora)
  if (prospect.rating < 3.0) score += 10;
  if (prospect.rating >= 4.5) score -= 5; // Muy buenos ya están optimizados

  // FACTOR 4: Reseñas Negativas Recientes
  const negativeReviews = prospect.reviews.filter(r => r.rating <= 2).length;
  if (negativeReviews > 3) score += 10;

  // FACTOR 5: Competencia (si estrategia = competitor)
  if (strategy === 'competitor') {
    const competitorsInArea = await countCompetitors(prospect.city, prospect.business_type);
    if (competitorsInArea > 10) score += 15; // Mercado saturado
  }

  // FACTOR 6: Volumen de Reseñas (indicador de tamaño)
  if (prospect.reviews_count > 100) score += 10; // Negocio grande
  if (prospect.reviews_count < 5) score -= 10; // Negocio muy pequeño

  // MAPEO A PRIORIDAD
  if (score >= 60) return 'urgent';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
};
```

**Ejemplos de Clasificación:**

| Caso | Score | Prioridad | Razonamiento |
|------|-------|-----------|--------------|
| Restaurante sin web + rating 3.2 + 8 reseñas negativas | 40 + 15 + 10 + 10 = **75** | **urgent** | Obligado VeriFactu + sin presencia digital + problemas de gestión |
| Hotel con web + rating 4.8 + 200 reseñas | 0 - 5 + 10 = **5** | **low** | Ya están optimizados, poco margen de mejora |
| Tienda de ropa + rating 3.5 + sin web + 50 reseñas | 40 + 15 + 10 = **65** | **urgent** | Obligado Verifactu + sin web + tamaño medio |
| Peluquería + rating 4.0 + con web + 30 reseñas | 0 + 0 + 0 = **0** | **low** | Negocio estable con presencia digital |

### 6.3 Validación de Tags Asignados

```sql
-- Query de auditoría: Verificar coherencia de tags
SELECT 
  mp.id,
  mp.name,
  mp.business_type,
  mp.website IS NULL as sin_web,
  mp.ai_priority,
  mp.ai_tags,
  array_agg(t.name) as tag_names
FROM maps_prospects mp
LEFT JOIN unnest(mp.ai_tags) tag_id ON true
LEFT JOIN tags t ON t.id = tag_id
WHERE mp.ai_analysis IS NOT NULL
GROUP BY mp.id
HAVING 
  -- Validar: Si "Sin Web" en tags, website debe ser NULL
  ('Sin Web' = ANY(array_agg(t.name)) AND mp.website IS NOT NULL)
  OR
  -- Validar: Si "Interesado Verifactu" en tags, debe ser hostelería/retail
  ('Interesado Verifactu' = ANY(array_agg(t.name)) 
   AND mp.business_type NOT IN ('restaurant', 'bar', 'cafe', 'store'));

-- Resultado esperado: 0 filas (sin inconsistencias)
```

---

## 7. MÉTRICAS Y MONITORIZACIÓN

### 7.1 Dashboard de Estadísticas

```sql
-- Query principal para stats de comercial
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) FILTER (WHERE processed = false) as prospectos_pendientes,
  COUNT(*) FILTER (WHERE processed = true) as leads_creados,
  COUNT(*) FILTER (WHERE ai_priority = 'urgent') as prioridad_urgente,
  COUNT(*) FILTER (WHERE outreach_sent = true) as mensajes_enviados,
  AVG(rating) as rating_promedio
FROM maps_prospects
WHERE searched_by = :userId
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

### 7.2 Alertas y Límites

```javascript
// Verificación de cuota diaria
const dailyUsage = user.hunter_prospects_today;
const dailyLimit = user.hunter_daily_limit;
const remaining = dailyLimit - dailyUsage;

if (remaining <= 5) {
  toast.warning(`Solo te quedan ${remaining} búsquedas hoy`);
}

if (remaining === 0) {
  toast.error('Has alcanzado tu límite diario. Vuelve mañana o contacta al administrador.');
  disableSearchButton();
}
```

---

## 8. ROADMAP TÉCNICO

### 8.1 Funcionalidades Pendientes

- [ ] **Integración WhatsApp Business API** (actualmente preparado pero sin implementar envío real)
- [ ] **Email Automation Service** (SMTP configurado pero sin servicio de envío)
- [ ] **Deep Search Real** (actualmente es simulación con IA, falta scraping real de redes sociales)
- [ ] **Webhooks para eventos** (notificaciones cuando un demo recibe solicitud de contacto)
- [ ] **Exportación a CSV/Excel** de prospectos filtrados
- [ ] **Integración con Calendar** para agendar llamadas desde el modal de prospecto

### 8.2 Mejoras de Rendimiento

- [ ] **Cacheo de respuestas de IA** (evitar re-analizar prospectos similares)
- [ ] **Queue System** para generación masiva de demos (evitar timeouts)
- [ ] **Paginación en backend** (actualmente se cargan todos los prospectos en memoria)
- [ ] **Optimización de queries** con índices compuestos

---

## 9. CONCLUSIONES TÉCNICAS

### 9.1 Arquitectura Lograda

✅ **Backend modular**: Servicios independientes (Google Places, Gemini, Lead Hunter)  
✅ **Frontend reactivo**: Estados optimizados con `useCallback` y `useMemo`  
✅ **Base de datos normalizada**: Sin redundancia, con constraints y relaciones FK claras  
✅ **Seguridad**: API keys en DB, autenticación JWT, middleware de roles  
✅ **Escalabilidad**: Preparado para agregar nuevas estrategias sin modificar código  

### 9.2 Puntos de Integración

El sistema se integra perfectamente con:
- **Módulo Leads**: Conversión directa con mapeo de tags
- **Módulo Emails**: Preparado para campaña automatizada
- **Módulo Calendar**: Listo para agendar follow-ups
- **Admin Panel**: Control total de permisos y configuraciones

### 9.3 Dependencias Críticas

- **Google Places API**: Requiere facturación activa (costo variable por consulta)
- **Gemini 2.0 Flash**: Límite de 50 requests/min en tier gratuito
- **PostgreSQL 14+**: Funciones JSONB obligatorias

---

**Documento generado:** 19 Diciembre 2025  
**Versión:** 1.0.0  
**Próxima revisión:** Tras implementar WhatsApp/Email real
