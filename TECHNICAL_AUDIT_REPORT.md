# 🔬 AUDITORÍA TÉCNICA COMPLETA - CRM NoahPro
## Informe para Migración a Microservicios y AI Gateway Enterprise

**Fecha:** 21 Diciembre 2025  
**Versión:** 1.0.0  
**Autor:** CTO Technical Audit  
**Objetivo:** Preparar migración a arquitectura de microservicios + Unified AI Gateway

---

## 📋 ÍNDICE EJECUTIVO

| Área | Estado | Complejidad Migración |
|------|--------|----------------------|
| Motor IA (Gemini) | ✅ Funcional | 🟡 Media |
| Integraciones APIs | ✅ 5+ APIs | 🟠 Alta |
| Base de Datos | ✅ PostgreSQL | 🟢 Baja |
| Infraestructura | ⚠️ Monolito | 🔴 Alta |
| Tiempo Real | ✅ Socket.io + Pusher | 🟡 Media |

---

## 1. PROPÓSITO Y FLUJO PRINCIPAL (The Core Loop)

### 1.1 ¿Qué problema resuelve?

**NoahPro CRM** es una plataforma B2B de **prospección inteligente y gestión de leads** orientada a:

1. **Negocios objetivo:** Empresas que venden soluciones TPV/Verifactu a hostelería, retail y servicios
2. **Problema resuelto:** Automatizar la búsqueda, cualificación y priorización de prospectos comerciales usando IA
3. **Propuesta de valor:** 
   - Scraping de Google Maps → Análisis IA → Priorización automática → Conversión a Lead
   - Generación automática de demos web personalizadas
   - Cumplimiento normativo Verifactu (Ley Antifraude 2025/2027)

### 1.2 Flujo de Usuario Más Complejo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO: PROSPECCIÓN → ANÁLISIS IA → LEAD                       │
└─────────────────────────────────────────────────────────────────────────────────┘

PASO 1: ENTRADA DE DATOS
┌──────────────┐
│ Comercial    │ → Introduce: "restaurantes en Madrid" + Radio 5km + Estrategia "VeriFactu"
└──────┬───────┘
       ↓
PASO 2: SCRAPING GOOGLE MAPS
┌──────────────────────────────────────────────────────────────────────────────────┐
│ googlePlacesService.searchAndSave()                                              │
│ ├─ POST /api/hunter/search                                                       │
│ ├─ Google Places TextSearch API (paginación: 20+20+20...)                        │
│ ├─ Google Places Details API (por cada place_id)                                 │
│ ├─ Delay 2s entre páginas (requisito Google)                                     │
│ ├─ Extrae: nombre, teléfono, web, rating, reviews, fotos                         │
│ └─ Calcula: Quality Score (0-100) + Opportunity Score + Digital Gaps             │
└──────────────────────────────────────────────────────────────────────────────────┘
       ↓
PASO 3: ANÁLISIS IA (SINCRÓNICO - Usuario espera)
┌──────────────────────────────────────────────────────────────────────────────────┐
│ geminiService.analyzeAndSave()                                                   │
│ ├─ POST /api/hunter/analyze/:id                                                  │
│ ├─ Fetch contenido web (timeout 5s)                                              │
│ ├─ Construye prompt: datos + reviews + web + notas + estrategia                  │
│ ├─ Gemini 2.0 Flash Exp (generationConfig: responseMimeType: 'application/json') │
│ └─ Parsea JSON → Guarda en ai_analysis, ai_priority, ai_tags                     │
└──────────────────────────────────────────────────────────────────────────────────┘
       ↓
PASO 4: DECISIÓN IA
┌──────────────────────────────────────────────────────────────────────────────────┐
│ SALIDA JSON DE GEMINI                                                            │
│ {                                                                                 │
│   "priority": "urgent" | "high" | "medium" | "low",                              │
│   "tags": [7, 8, 9],  // 7=Verifactu, 8=Demo, 9=SinWeb                           │
│   "personalized_message": { subject, body, channel },                            │
│   "opportunity_map": { strengths, weaknesses, pain_points, solutions },          │
│   "reasoning": "Restaurante sin web moderna. Alta probabilidad tickets manuales" │
│ }                                                                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
       ↓
PASO 5: ACCIÓN EJECUTADA
┌──────────────────────────────────────────────────────────────────────────────────┐
│ leadHunterService.processProspectToLead()                                        │
│ ├─ BEGIN TRANSACTION                                                             │
│ ├─ INSERT INTO leads (datos mapeados)                                            │
│ ├─ INSERT INTO lead_tags (tags de IA)                                            │
│ ├─ UPDATE maps_prospects SET processed=true, lead_id=X                           │
│ ├─ UPDATE hunter_usage_stats                                                     │
│ └─ COMMIT                                                                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 ¿Síncrono o Asíncrono?

| Operación | Tipo | Tiempo Max | Observación |
|-----------|------|-----------|-------------|
| Búsqueda Google Maps | **SÍNCRONO** | ~30s (60 resultados) | Usuario espera spinner |
| Análisis IA Individual | **SÍNCRONO** | ~5-15s | Usuario ve loading en card |
| Generación Demo Web | **SÍNCRONO** | ~15-30s | Progress stages visibles |
| Conversión a Lead | **SÍNCRONO** | <1s | Transacción DB |
| Notificaciones | **ASÍNCRONO** | Inmediato | Pusher + Socket.io |
| Emails Automáticos | **ASÍNCRONO** | node-cron | emailAutomationService |

**⚠️ BOTTLENECK IDENTIFICADO:** No hay cola de tareas (BullMQ/Celery). Operaciones pesadas bloquean el thread principal.

---

## 2. MOTOR DE IA Y "AUTOAPRENDIZAJE"

### 2.1 Modelo de IA Utilizado

```javascript
// backend/services/geminiService.js
model: 'gemini-2.0-flash-exp'
baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
```

- **Proveedor:** Google AI (Generative Language API)
- **Modelo:** `gemini-2.0-flash-exp` (experimental, alta velocidad)
- **Fallback configurado:** No hay fallback a otros proveedores (OpenAI, Anthropic)

### 2.2 Estructura del Prompt

#### System Prompt (Instrucciones base)

```javascript
getStrategyInstruction(strategy) {
  const context = `
    Eres un experto en ventas de sistemas TPV y normativa Verifactu.
    CONTEXTO DEL PRODUCTO - NoahPro TPV:
    - Sistema punto de venta con Verifactu integrado automático
    - Cumplimiento 100% de la Ley Antifraude
    - Gestión integral (mesas, inventario, delivery, reporting)
  `;
  
  // Estrategias específicas
  const strategies = {
    'verifactu': 'ENFOQUE: CUMPLIMIENTO LEGAL. Alertar sobre multas de 50.000€...',
    'digital_kit': 'ENFOQUE: KIT DIGITAL. Vender oportunidad de TPV GRATIS...',
    'competitor': 'ENFOQUE: MEJORA COMPETITIVA. Destacar ventajas sobre TPVs...',
    'general': 'ENFOQUE: VENTA CONSULTIVA. Detectar dolores del negocio...'
  };
}
```

#### User Prompt (Datos del prospecto)

```javascript
const prospectInfo = `
DATOS DEL NEGOCIO A ANALIZAR:
- Nombre: ${prospect.name}
- Tipo: ${prospect.business_type}
- Dirección: ${prospect.address}
- Teléfono: ${prospect.phone}
- Sitio Web: ${prospect.website || 'NO TIENE WEB'}
- Rating: ${prospect.rating} (${prospect.reviews_count} reseñas)
- NOTAS INTERNAS: ${prospect.internal_notes}

RESEÑAS RECIENTES:
${reviewsText}

CONTENIDO SITIO WEB (Extracto):
${webContent}

ANALIZA este negocio y devuelve el JSON con tu evaluación:
`;
```

#### Configuración de Generación

```javascript
generationConfig: {
  temperature: 0.7,
  maxOutputTokens: 1024,
  responseMimeType: 'application/json'  // Fuerza respuesta JSON
}
```

### 2.3 CRÍTICO: ¿Cómo funciona el "Autoaprendizaje"?

**🔴 RESPUESTA DIRECTA: NO HAY AUTOAPRENDIZAJE REAL**

| Técnica | ¿Implementado? | Detalles |
|---------|---------------|----------|
| **RAG** (Retrieval Augmented Generation) | ❌ NO | No hay base de datos vectorial (Pinecone, ChromaDB, Weaviate) |
| **Fine-tuning** | ❌ NO | No se entrena el modelo con datos propios |
| **Buffer Memory** | ⚠️ PARCIAL | Solo notas internas guardadas en `prospect_notes` |
| **Summary Memory** | ❌ NO | No se mantiene historial conversacional |
| **Embeddings** | ❌ NO | No se generan vectores de conocimiento |

#### ¿Qué se hace actualmente?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ "MEMORIA" ACTUAL = Notas Internas + Reseñas de Google + Contenido Web           │
└─────────────────────────────────────────────────────────────────────────────────┘

1. Comercial añade nota: "Hablé con dueño, interesado en factura electrónica"
   → INSERT INTO prospect_notes (prospect_id, content, use_for_analysis=TRUE)

2. Al re-analizar, se agregan las notas al prompt:
   → prospect.internal_notes = "NOTAS ADICIONALES: - Nota 1 - Nota 2"

3. Gemini recibe TODO el contexto en cada request (no hay memoria persistente)
```

#### ¿Cómo se actualiza el conocimiento?

| Tipo | Método | Frecuencia |
|------|--------|------------|
| Estrategias de IA | Tabla `hunter_strategies` | Manual (Admin) |
| Notas del comercial | Tabla `prospect_notes` | Tiempo real |
| Datos de Google | Re-fetch manual | Por demanda |
| Modelo base | Gemini API | Sin control |

**📊 RECOMENDACIÓN PARA MICROSERVICIOS:**
```
Implementar RAG con:
- ChromaDB/Pinecone para embeddings
- Indexar: casos de éxito, objeciones superadas, argumentarios
- Actualización: batch nocturno + incremental en cada cierre de venta
```

---

## 3. ECOSISTEMA DE APIs E INTEGRACIONES

### 3.1 Lista Exhaustiva de APIs Externas

| API | Servicio | Archivo | Autenticación |
|-----|----------|---------|---------------|
| **Google Places API** | Búsqueda negocios, detalles, fotos | `googlePlacesService.js` | API Key en DB |
| **Google Geocoding API** | Convertir direcciones a coords | `googlePlacesService.js` | Misma API Key |
| **Gemini 2.0 Flash** | Análisis IA, generación demos | `geminiService.js` | API Key en DB |
| **Instagram Graph API** | Stats de perfiles (opcional) | `socialMediaService.js` | Access Token + Business ID |
| **Facebook Graph API** | Stats de páginas (opcional) | `socialMediaService.js` | App ID + Secret |
| **Pusher** | Notificaciones real-time | `pusherService.js` | App ID + Key + Secret |
| **SMTP** | Envío de emails | `emailService.js` | Credenciales en DB |

### 3.2 Google Ecosystem - Detalle

```javascript
// googlePlacesService.js
baseUrl: 'https://maps.googleapis.com/maps/api/place'

// Endpoints utilizados:
1. Text Search:  /textsearch/json?query=X&location=lat,lng&radius=R
2. Nearby Search: /nearbysearch/json?keyword=X&location=lat,lng&radius=R
3. Place Details: /details/json?place_id=X&fields=...
4. Place Photos:  /photo?maxwidth=800&photoreference=X

// Geocoding (para ubicaciones por texto):
'https://maps.googleapis.com/maps/api/geocode/json?address=X'
```

### 3.3 ¿Qué es la API "Banana"?

**🔍 INVESTIGACIÓN:** No se encontró ninguna referencia a "Banana" en el código base.

Posibles interpretaciones:
- **Banana.dev:** Plataforma para GPUs serverless (NO utilizada)
- **API interna nombrada así:** No existe
- **Confusión con otro proyecto:** Verificar con el equipo

### 3.4 ¿Cómo se autentican las APIs?

```javascript
// Patrón: Lazy Loading desde tabla hunter_api_config
class GooglePlacesService {
  async getApiKey() {
    if (this.apiKey) return this.apiKey;
    
    const result = await db.query(
      "SELECT api_key FROM hunter_api_config WHERE api_name = 'google_places'"
    );
    this.apiKey = result.rows[0].api_key;
    return this.apiKey;
  }
}
```

```sql
-- Tabla de configuración
CREATE TABLE hunter_api_config (
  api_name VARCHAR(50) UNIQUE,  -- 'google_places', 'gemini_vertex', etc.
  api_key TEXT,
  api_secret TEXT,
  config_json JSONB,            -- Parámetros adicionales
  is_active BOOLEAN,
  last_tested_at TIMESTAMP,
  test_result VARCHAR(50)       -- 'success', 'failed'
);
```

**⚠️ PROBLEMAS DE SEGURIDAD:**
- API Keys en base de datos (mejor: Vault/Secret Manager)
- Sin rotación automática
- Sin auditoría de uso por API

---

## 4. ARQUITECTURA DE DATOS (Persistencia)

### 4.1 Base de Datos

| Tipo | Tecnología | Versión | Uso |
|------|------------|---------|-----|
| **Principal** | PostgreSQL | 14+ | Todos los datos |
| **Caché** | ❌ No hay | - | No implementado |
| **Vectorial** | ❌ No hay | - | No hay RAG |
| **Colas** | ❌ No hay | - | No hay Redis/BullMQ |

### 4.2 Esquema de Datos Crítico

#### Tablas Principales

```sql
-- LEADS (Clientes potenciales)
leads (
  id, name, email, phone, business_name,
  status,  -- 'new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'
  source,  -- 'landing_form', 'chat', 'manual', 'google_maps_hunter'
  assigned_commercial_id, commercial_code,
  created_at, updated_at
)

-- PROSPECTOS (Datos de Google Maps)
maps_prospects (
  id, place_id (UNIQUE),
  name, phone, website, email, rating, reviews_count,
  address, city, postal_code, business_type,
  
  -- Análisis IA
  ai_analysis (JSONB),      -- Respuesta completa de Gemini
  ai_priority,              -- 'urgent', 'high', 'medium', 'low'
  ai_tags INTEGER[],        -- IDs de tags sugeridos
  ai_reasoning TEXT,
  ai_message_subject, ai_message_body, ai_channel,
  
  -- Scoring
  quality_score,            -- 0-100 (calidad de datos)
  opportunity_score,        -- 0-100 (probabilidad de venta)
  digital_gaps JSONB,       -- ['no_web', 'no_social']
  
  -- Estado
  processed BOOLEAN,
  lead_id (FK → leads),
  searched_by (FK → users),
  assigned_to (FK → users)
)

-- HISTORIAL DE BÚSQUEDAS
hunter_search_history (
  id, user_id, query, location, business_type, results_count, created_at
)

-- ESTRATEGIAS DE IA
hunter_strategies (
  id, name, icon, description,
  prompt_template TEXT,     -- Instrucciones para Gemini
  is_system BOOLEAN         -- Protege estrategias por defecto
)

-- NOTAS COLABORATIVAS
prospect_notes (
  id, prospect_id, content, use_for_analysis BOOLEAN, created_at
)

-- DEMOS GENERADAS
hunter_demo_history (
  id, prospect_id, user_id, html_content TEXT, 
  template_name, public_token (UUID), views INTEGER
)
```

### 4.3 ¿Cómo se guardan los "Conocimientos Aprendidos"?

```sql
-- NO hay tabla específica de conocimientos.
-- El "aprendizaje" es:

1. ai_analysis JSONB en maps_prospects → Snapshot del análisis
2. prospect_notes → Notas manuales del comercial
3. hunter_strategies → Prompts configurables por admin
```

### 4.4 Archivos e Imágenes

| Tipo | Storage | Ruta |
|------|---------|------|
| Fotos de negocios | Google Places CDN | URLs en `photos JSONB` |
| Demos generadas | Base de datos | `html_content TEXT` |
| Uploads locales | Filesystem | `/backend/uploads/` |

**⚠️ NO se usa S3 ni Google Cloud Storage**

---

## 5. INFRAESTRUCTURA ACTUAL

### 5.1 ¿Dónde está alojado?

| Atributo | Valor |
|----------|-------|
| **Tipo** | VPS con Plesk |
| **IP** | `213.165.69.127` |
| **Dominio** | `noahpro.es` |
| **OS** | Linux |
| **Panel** | Plesk |

### 5.2 Stack Tecnológico

#### Backend

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Runtime | Node.js | 18.x+ |
| Framework | Express.js | 4.18.x |
| ORM/Query Builder | Raw SQL (pg) | 8.11.x |
| Validación | Zod | 4.x |
| Auth | JWT + bcryptjs | - |
| Logging | Winston | 3.x |
| Rate Limiting | express-rate-limit | 8.x |
| PDF | PDFKit | 0.17.x |
| Excel | ExcelJS | 4.x |
| Email | Nodemailer | 6.x |
| WebSockets | Socket.io | 4.8.x |
| Real-time | Pusher | 5.x |
| Cron | node-cron | 4.x |

#### Frontend

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Icons | Lucide React | - |
| Charts | Chart.js + react-chartjs-2 | - |
| Calendar | react-big-calendar | - |
| Maps | Leaflet + react-leaflet | - |
| Real-time | Socket.io-client + Pusher-js | - |
| Editor | TinyMCE React | - |

### 5.3 ¿Usamos colas de tareas?

**❌ NO HAY COLA DE TAREAS IMPLEMENTADA**

| Lo que existe | Cómo funciona |
|---------------|---------------|
| node-cron | Solo para tareas programadas simples |
| automationEngine | Ejecuta reglas síncronamente |
| emailAutomationService | Cron para follow-ups |

**📊 RECOMENDACIÓN:**
```
Implementar BullMQ + Redis para:
- Análisis IA en background
- Generación de demos
- Envío masivo de emails
- Webhooks retry
```

### 5.4 Gestión de Procesos

```bash
# Producción
pm2 restart crm-noahpro-api  # Puerto 3003
pm2 restart tpv-api          # Puerto 3002

# Nginx reverse proxy
location /api/ {
  proxy_pass http://127.0.0.1:3003/api/;
}
```

---

## 6. PUNTOS DE DOLOR Y COSTES (Bottlenecks)

### 6.1 ¿Dónde gastamos más dinero/recursos?

| Recurso | Consumo Estimado | Coste Mensual Est. |
|---------|------------------|-------------------|
| **Google Places API** | ~1000-5000 req/día | $50-200/mes |
| **Gemini API** | ~500-2000 análisis/día | $20-100/mes |
| **VPS Plesk** | 1 servidor | ~$30-50/mes |
| **Pusher** | Tiempo real | ~$0 (free tier) |

**💡 El mayor coste es Google Places API** (cada búsqueda = textSearch + N×details + N×photos)

### 6.2 ¿Qué procesos son lentos?

| Proceso | Tiempo | Causa |
|---------|--------|-------|
| Búsqueda 60 prospectos | ~30-45s | Delay 2s entre páginas Google + N calls a Details |
| Análisis IA (1 prospecto) | ~5-15s | Gemini + fetch web (5s timeout) + DB update |
| Generación Demo Web | ~15-30s | Gemini genera ~8000 tokens HTML |
| Búsqueda Profunda | ~10-20s | Llamada adicional a Gemini |

### 6.3 ¿Rate Limits encontrados?

| API | Límite | ¿Hemos tenido problemas? |
|-----|--------|-------------------------|
| Google Places | 50 QPM por defecto | ⚠️ Posible si búsquedas masivas |
| Gemini | Varía por modelo | ✅ No reportados |
| Instagram Graph | Muy restrictivo | ⚠️ Scraping como fallback |

### 6.4 Deuda Técnica Identificada

1. **Sin cola de tareas:** Operaciones IA bloquean thread principal
2. **Sin caché:** Cada request re-consulta DB para API keys
3. **Sin RAG:** No hay aprendizaje acumulativo
4. **Sin multi-tenancy:** Preparar para reventa requiere cambios importantes
5. **API Keys en DB:** Debería estar en Vault/Secret Manager
6. **Sin observabilidad:** No hay APM (Datadog, NewRelic)
7. **Monolito:** Todo en un único servicio Express

---

## 7. RECOMENDACIONES PARA UNIFIED AI GATEWAY

### 7.1 Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────────┐
│                      UNIFIED AI GATEWAY                          │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│ │ Rate Limiter│  │ API Router  │  │ Cost Tracker│              │
│ └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                     PROVIDER ADAPTERS                        │ │
│ │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │ │
│ │  │ Gemini │  │ OpenAI │  │ Claude │  │ Local  │            │ │
│ │  └────────┘  └────────┘  └────────┘  └────────┘            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                     TOOL ORCHESTRATOR                        │ │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│ │  │ Google Maps  │  │ Social Media │  │ Web Scraper  │      │ │
│ │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                     KNOWLEDGE LAYER (RAG)                    │ │
│ │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│ │  │ ChromaDB   │  │ Embeddings │  │ Memory     │            │ │
│ │  │ (Vectores) │  │ (OpenAI)   │  │ (Redis)    │            │ │
│ │  └────────────┘  └────────────┘  └────────────┘            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Microservicios Sugeridos

| Servicio | Responsabilidad | Tech Stack |
|----------|-----------------|------------|
| `gateway-api` | Routing, auth, rate limiting | Node/Fastify |
| `ai-orchestrator` | Unified LLM interface | Python/LangChain |
| `google-maps-service` | Scraping y normalización | Node.js |
| `knowledge-service` | RAG + embeddings | Python + ChromaDB |
| `notification-service` | Email, Push, SMS | Node.js |
| `billing-service` | Tracking de costes y usage | Node.js |

### 7.3 Prioridades de Migración

1. **FASE 1:** Extraer AI Gateway como servicio independiente
2. **FASE 2:** Implementar RAG con ChromaDB
3. **FASE 3:** Añadir BullMQ para operaciones async
4. **FASE 4:** Multi-tenancy para reventa
5. **FASE 5:** Observabilidad completa (Grafana, Prometheus)

---

## 8. ANEXOS TÉCNICOS

### 8.1 Dependencias Backend (package.json)

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^8.2.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^4.2.1",
    "node-pg-migrate": "^8.0.3",
    "nodemailer": "^6.9.3",
    "pdfkit": "^0.17.2",
    "pg": "^8.11.0",
    "pusher": "^5.2.0",
    "socket.io": "^4.8.1",
    "winston": "^3.18.3",
    "zod": "^4.1.13"
  }
}
```

### 8.2 Endpoints API Lead Hunter

```
GET  /api/hunter/access              - Verificar permisos
POST /api/hunter/search              - Búsqueda principal
POST /api/hunter/analyze/:id         - Análisis IA
POST /api/hunter/prospects/:id/convert - Convertir a lead
POST /api/hunter/prospects/:id/demo  - Generar demo web
GET  /api/hunter/prospects           - Listar con filtros
GET  /api/hunter/stats               - Estadísticas
GET  /api/hunter/config              - Configuración APIs
```

### 8.3 Tablas de Base de Datos (39 migraciones)

```
leads, proposals, chat_conversations, chat_messages,
users, tags, lead_tags, notifications, activities,
tasks, calendar_events, clients, invoices,
maps_prospects, hunter_search_history, hunter_strategies,
hunter_api_config, hunter_usage_stats, prospect_notes,
hunter_demo_history, business_types, automation_rules,
automation_logs, commercial_profiles, support_tickets...
```

---

**Documento preparado para:** Arquitecto externo  
**Próximos pasos:** Diseño de Unified AI Gateway + Plan de migración  
**Contacto técnico:** desarrollo@noahpro.com
