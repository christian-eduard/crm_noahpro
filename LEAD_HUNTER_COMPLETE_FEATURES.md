# LEAD HUNTER - CATÁLOGO COMPLETO DE FUNCIONALIDADES
**Versión:** 2.0.0 - Actualizado 19 Diciembre 2025

---

## 1. SISTEMA DE BÚSQUEDA Y PROSPECCIÓN

### 1.1 Búsqueda Básica
- **Campo Query**: Busca tipos de negocio (ej: "restaurantes", "hoteles")
- **Selector Tipos Predefinidos**: Catálogo de 20+ tipos con iconos y queries optimizadas
- **Tipo Personalizado**: Input libre para búsquedas específicas ("empresas placas solares")
- **Ubicación**: Acepta ciudad, dirección completa o coordenadas GPS
- **Radio de búsqueda**: 500m, 1km, 2km, 5km, 10km
- **Límite de resultados**: 20 (Rápida), 40 (Normal), 60 (Profunda) con paginación automática

### 1.2 Estrategias de Análisis IA
- **Estrategias Predefinidas**:
  - Venta General (enfoque comercial estándar)
  - VeriFactu/Ley Antifraude (compliance legal)
  - Kit Digital (subvenciones)
  - Análisis de Competencia
- **Custom Prompt**: Área de texto expandible a ancho completo para instrucciones personalizadas
- **Optimización IA**: Botón ✨ que mejora automáticamente el prompt usando Gemini
- **Gestión de Estrategias**: Modal con CRUD completo (crear, editar, eliminar)

### 1.3 Tooltips Educativos (Help Icons)
- Tipo de Negocio: Explica diferencia entre predefinido y custom
- Ciudad/Zona: Formatos aceptados (nombre, dirección, coords)
- Radio: Impacto en cantidad de resultados
- Estrategia IA: Diferencias entre cada estrategia
- Límite: Relación coste-tiempo-profundidad

---

## 2. GESTIÓN DE PROSPECTOS

### 2.1 Visualización
- **Vista Grid**: Tarjetas con foto, info clave, badges de prioridad
- **Vista Lista**: Tabla compacta con más datos visibles
- **Vista Mapa**: Geolocalización de todos los prospectos
- **Filtros Avanzados**:
  - Por prioridad (urgent/high/medium/low)
  - Por estado (procesado/pendiente)
  - Por rating (1-5 estrellas)
  - Por tipo de negocio
  - Por ciudad (búsqueda texto)

### 2.2 Modal de Detalle (7 pestañas)

#### Pestaña 1: Resumen (Summary)
- **Datos Básicos**: Nombre, teléfono, web, dirección, rating
- **Inteligencia de Cierre IA**:
  - Badge de prioridad con color
  - Puntos de dolor detectados (pain points)
  - Fortalezas y debilidades
  - Soluciones NoahPro sugeridas
  - Razonamiento de la IA (reasoning)
  - Análisis de sentimiento de reseñas

#### Pestaña 2: Notas Internas
- **Sistema Colaborativo**:
  - Añadir notas en tiempo real
  - Marcar para incluir en análisis IA
  - Editar/eliminar notas existentes
  - Botón "Mejorar con IA" que profesionaliza el texto
  - Timestamp y autor de cada nota
- **Re-análisis Inteligente**: Botón que envía notas marcadas a Gemini para actualizar análisis

#### Pestaña 3: Galería
- **Fotos del Negocio**: Grid de imágenes de Google Places
- **Carga Lazy**: Miniaturas con modal fullscreen al click
- **Placeholder**: Si no hay fotos, muestra icono del tipo de negocio

#### Pestaña 4: Reseñas
- **Render de Reviews**:
  - Avatar, nombre, rating, fecha
  - Texto completo de la reseña
  - Ordenadas por fecha (más recientes primero)
- **Análisis IA de Reviews**:
  - Sentimiento general (positivo/neutral/negativo)
  - Temas principales detectados
  - Sugerencias de mejora

#### Pestaña 5: Contacto
- **Información**:
  - Teléfono (con botón "Llamar")
  - Email (si disponible)
  - Sitio web (link externo)
  - Dirección completa
- **Redes Sociales Detectadas**:
  - Instagram, Facebook, TikTok, LinkedIn, Twitter
  - Iconos con links si la IA las detectó
- **Mensaje Personalizado IA**:
  - Subject line generado
  - Cuerpo del mensaje con variables {{businessName}}
  - Canal sugerido (email/whatsapp)
  - Botón copiar al portapapeles

#### Pestaña 6: Demos
- **Generador de Webs Demo**:
  - 5 tipos predefinidos: Modern, Restaurant, Luxury, Store, Services
  - Tipos custom configurables (localStorage)
  - Prompt personalizado opcional
  - Previsualizador de progreso con 4 etapas
- **Historial de Demos**:
  - Lista de demos generadas con fecha
  - Link público compartible
  - Botón preview en modal
  - Eliminar demos antiguas
- **Demo Contact Requests**: Notificaciones de formularios completados

#### Pestaña 7: Acciones
- **Botones Principales**:
  - Analizar con IA
  - Búsqueda Profunda (redes, SEO, competencia)
  - Convertir a Lead (1-click)
  - Generar Demo Web
  - Generar Propuesta Comercial
  - Asignar a Comercial
  - Actualizar Datos de Google
  - Cambiar Prioridad Manual

---

## 3. INTELIGENCIA ARTIFICIAL (GEMINI 2.5)

### 3.1 Análisis Estándar
**Datos Procesados**:
- Info básica del negocio
- Reviews completas
- Contenido web (scraped)
- Notas internas del comercial

**Salida JSON**:
```json
{
  "social_media": {...},
  "review_analysis": {...},
  "tags": [7,8,9],
  "priority": "high",
  "personalized_message": {...},
  "opportunity_map": {...},
  "reasoning": "..."
}
```

### 3.2 Búsqueda Profunda
**Simula**:
- Análisis SEO (ranking, keywords)
- Presencia en redes sociales
- Deep insights del mercado
- Opportunity score (0-100)
- Winning strategy sugerida

### 3.3 Mejora de Notas
Transforma notas informales en textos profesionales manteniendo información.

### 3.4 Optimización de Prompts
Convierte ideas vagas en instrucciones estructuradas para IA.

### 3.5 Generación de Landing Pages
- HTML completo responsive
- Imágenes reales del negocio o placeholders Unsplash
- Formulario de contacto funcional
- Hero, About, Services, Testimonials, Footer
- ~8000 tokens de código generado

---

## 4. CONVERSIÓN Y PROCESAMIENTO

### 4.1 Conversión a Lead (1-Click)
**Proceso Automático**:
1. Crea registro en tabla `leads`
2. Aplica tags sugeridos por IA
3. Establece prioridad de contacto
4. Marca prospect como procesado
5. Vincula lead_id al prospect
6. Actualiza estadísticas del usuario

### 4.2 Asignación de Prospectos
- Solo admin/owner puede reasignar
- Notificación al comercial asignado
- Historial de reasignaciones

### 4.3 Actualización de Datos
- Re-fetch de Google Places API
- Actualiza fotos, reseñas, rating
- Mantiene análisis IA previo

---

## 5. GESTIÓN AVANZADA

### 5.1 Historial de Búsquedas
- **Agrupamiento**: Búsquedas por sesión
- **Drill-down**: Click para ver prospectos de esa búsqueda
- **Metadatos**: Query, ubicación, fecha, total resultados
- **Eliminación**: Confirmación con ConfirmModal
- **Filtrado**: Por prospectos de búsqueda específica

### 5.2 Tipos de Negocio Personalizados
- **Gestión Visual**: Modal con lista de tipos
- **Agregar Custom**: Nombre, icono (Lucide), query Google, categoría
- **Editar/Eliminar**: CRUD completo
- **LocalStorage**: Persistencia en navegador
- **Iconos Dinámicos**: Selector con preview de 30+ iconos

### 5.3 Tipos de Demo Personalizados
- **6 Predefinidos**: Modern, Restaurant, Store, Services, Luxury, Custom
- **Añadir Nuevos**: Nombre, descripción, icono
- **Gestión**: Editar, eliminar (solo custom, no predefinidos)
- **Persistencia**: LocalStorage con key `hunter_custom_demo_types`

---

## 6. ESTADÍSTICAS Y ANALYTICS

### 6.1 Dashboard Principal
- Prospectos buscados hoy
- Prospectos con IA analizada
- Leads creados
- Tasa de conversión
- Mensajes enviados
- Progreso visual (barras)

### 6.2 Límites y Cuotas
- **Daily Limit**: Configurable por admin
- **Reset Automático**: A medianoche
- **Alertas**: Cuando quedan <5 búsquedas
- **Bloqueo**: Al alcanzar límite
- **Reset Manual**: Botón de admin con confirmación

### 6.3 Vista de Equipo (Team Dashboard)
- Estadísticas por comercial
- Ranking de rendimiento
- Prospectos asignados vs procesados

---

## 7. CONFIGURACIÓN Y ADMINISTRACIÓN

### 7.1 Configuración de APIs
**Modal LeadHunterSettings**:
- Google Places API Key
- Gemini API Key
- WhatsApp Business Config
- Botones "Test Connection"
- Estado visual (✓ Conectado / ✗ Error)

### 7.2 Gestión de Usuarios
**Permisos**:
- Toggle acceso Lead Hunter
- Límite diario personalizado
- Ver uso actual (hoy)
- Reset manual de cuota

### 7.3 Gestión de Estrategias IA
**Modal HunterStrategiesSettings**:
- Lista visual con iconos
- Badge "Sistema" para predefinidas
- Campos: Nombre, Icono, Descripción, Prompt Template
- Botones Editar/Eliminar siempre visibles
- Protección: No eliminar estrategias de sistema
- Textarea grande para prompts (8 filas)

---

## 8. EXPERIENCIA DE USUARIO (UX)

### 8.1 Sistema de Confirmaciones
**ConfirmModal Unificado**:
- Eliminar búsqueda
- Eliminar nota
- Eliminar demo
- Reset estadísticas
- Eliminar tipo custom
- Variantes: `danger` (rojo) / `info` (azul)

### 8.2 Feedback Visual
- **Toast Notifications**: Success, error, warning, info
- **Loading States**: Spinners en botones durante acciones
- **Progress Indicators**: Etapas de generación de demo
- **Empty States**: Mensajes cuando no hay datos
- **Skeleton Loaders**: En carga inicial

### 8.3 Animaciones
- Fade-in al cargar prospectos
- Slide-in para custom prompt
- Hover effects en cards
- Scale en botones IA
- Smooth transitions (300ms duration)

### 8.4 Responsive Design
- Grid adaptativo (3 cols → 2 → 1)
- Modal fullscreen en móvil
- Tabs con scroll horizontal
- Tooltips repositioned en mobile

---

## 9. ENDPOINTS API (BACKEND)

### 9.1 Autenticación y Acceso
- `GET /api/hunter/access` - Verificar permisos y límites
- `POST /api/hunter/prospects/:id/assign` - Asignar prospecto

### 9.2 Búsqueda y Prospección
- `POST /api/hunter/search` - Búsqueda principal
- `POST /api/hunter/estimate` - Estimar resultados (sin guardar)
- `GET /api/hunter/prospects` - Listar con filtros
- `GET /api/hunter/prospects/:id` - Detalle individual

### 9.3 Análisis IA
- `POST /api/hunter/analyze/:id` - Análisis estándar
- `POST /api/hunter/prospects/:id/deep-analyze` - Búsqueda profunda
- `POST /api/hunter/refine-prompt` - Optimizar custom prompt
- `POST /api/hunter/prospects/:id/improve-notes` - Mejorar notas

### 9.4 Gestión de Prospectos
- `PATCH /api/hunter/prospects/:id/priority` - Cambiar prioridad
- `POST /api/hunter/prospects/:id/refresh` - Actualizar de Google
- `POST /api/hunter/prospects/:id/convert` - Convertir a lead

### 9.5 Demos
- `POST /api/hunter/prospects/:id/demo` - Generar demo
- `GET /api/hunter/prospects/:id/demos` - Historial
- `DELETE /api/hunter/demos/:demoId` - Eliminar demo
- `GET /api/hunter/demos/:token` - Vista pública
- `POST /api/hunter/demos/contact` - Solicitud desde demo

### 9.6 Notas
- `GET /api/hunter/prospects/:id/notes` - Listar notas
- `POST /api/hunter/prospects/:id/notes` - Crear nota
- `PATCH /api/hunter/notes/:noteId` - Actualizar nota
- `DELETE /api/hunter/notes/:noteId` - Eliminar nota

### 9.7 Búsquedas
- `GET /api/hunter/searches` - Historial agrupado
- `GET /api/hunter/searches/:id/prospects` - Prospectos de búsqueda
- `DELETE /api/hunter/searches/:id` - Eliminar búsqueda

### 9.8 Estadísticas
- `GET /api/hunter/stats` - Estadísticas personales
- `POST /api/hunter/stats/reset` - Reset manual
- `GET /api/hunter/team-stats` - Estadísticas de equipo

### 9.9 Configuración
- `GET /api/hunter/config` - Obtener config APIs
- `PUT /api/hunter/config` - Actualizar config
- `POST /api/hunter/config/test` - Probar conexión API

### 9.10 Estrategias
- `GET /api/hunter-strategies` - Listar estrategias
- `POST /api/hunter-strategies` - Crear (admin)
- `PUT /api/hunter-strategies/:id` - Actualizar (admin)
- `DELETE /api/hunter-strategies/:id` - Soft delete (admin)

### 9.11 Tipos de Negocio
- `GET /api/hunter/business-types` - Listar tipos
- `POST /api/hunter/business-types` - Crear (admin)
- `PUT /api/hunter/business-types/:id` - Actualizar (admin)
- `DELETE /api/hunter/business-types/:id` - Eliminar (admin)

---

## 10. SERVICIOS BACKEND

### 10.1 googlePlacesService.js
**Métodos**:
- `searchPlaces(query, location, radius, limitOnePage)` - Búsqueda con paginación
- `getPlaceDetails(placeId)` - Detalles completos
- `searchAndSave(...)` - Búsqueda + guardado en DB
- `geocodeLocation(location)` - Convertir dirección a coords

**Features**:
- Manejo de next_page_token
- Delay 2s entre páginas (requisito Google)
- Extracción de reviews, fotos, tipos
- Detección automática de has_website

### 10.2 geminiService.js
**Métodos**:
- `analyzeProspect(prospect)` - Análisis completo
- `generateLandingPage(prospect, demoType, customPrompt)` - HTML demo
- `improveNotes(currentNotes, businessContext)` - Mejora texto
- `performDeepSearch(prospect)` - Búsqueda profunda simulada
- `refinePrompt(userPrompt)` - Optimización de prompts
- `testConnection()` - Verificar API

**Features**:
- Fetch de web content con timeout 5s
- Parsing de HTML (remove scripts/styles)
- Generación JSON estructurado
- Manejo de errores API
- Fallbacks para respuestas vacías

### 10.3 leadHunterService.js (ORQUESTADOR)
**Métodos**:
- `checkUserAccess(userId)` - Verificar permisos y reset diario
- `searchProspects(...)` - Orquesta búsqueda + guardado
- `analyzeProspect(prospectId, userId)` - Wrapper análisis IA
- `processProspectToLead(...)` - Conversión con transacción
- `getUserProspects(userId, filters)` - Listado con filtros
- `assignProspect(prospectId, assignedTo, assignedBy)` - Reasignación
- `deepAnalyzeProspect(prospectId)` - Búsqueda profunda
- `generateDemo(prospectId, demoType, ...)` - Generación demo

**Features**:
- Transacciones DB para conversión
- Validación de permisos
- Actualización de estadísticas
- Manejo de cuotas diarias

---

## 11. TABLAS DE BASE DE DATOS

### 11.1 maps_prospects (Tabla Principal)
**Campos de Datos**:
- id, place_id, name, phone, website, email
- rating, reviews_count, address, city, postal_code
- business_type, business_types (JSONB)
- has_website, photos (JSONB), reviews (JSONB)

**Campos de IA**:
- ai_analysis (JSONB completo)
- ai_priority, ai_tags, ai_reasoning
- ai_message_subject, ai_message_body, ai_channel
- social_media (JSONB)

**Campos de Estado**:
- processed, lead_id, outreach_sent, outreach_sent_at

**Campos de Tracking**:
- searched_by, search_query, search_id
- strategy, assigned_to, internal_notes
- created_at, processed_at, updated_at

### 11.2 hunter_strategies
- id, name, icon, description
- prompt_template (TEXT largo)
- is_active, is_system
- created_at, updated_at

### 11.3 hunter_search_history
- id, user_id, query, location
- business_type, results_count, created_at

### 11.4 prospect_notes
- id, prospect_id, content
- use_for_analysis (BOOLEAN)
- created_at

### 11.5 hunter_demos / hunter_demo_history
- id, prospect_id, demo_type
- html_content (TEXT largo)
- public_token (UUID)
- shared_at, created_by

### 11.6 business_types
- id, name, icon, google_query
- category, is_active

### 11.7 hunter_api_config
- id, api_name, api_key, api_secret
- config_json (JSONB)
- is_active, last_tested_at, test_result

### 11.8 hunter_usage_stats
- user_id, date (UNIQUE)
- prospects_searched, prospects_analyzed
- leads_created, messages_sent_email, messages_sent_whatsapp

### 11.9 Extensiones a users
- has_lead_hunter_access (BOOLEAN)
- hunter_daily_limit (INTEGER)
- hunter_prospects_today (INTEGER)
- hunter_last_reset (DATE)

---

## 12. FLUJOS COMPLETOS

### 12.1 Flujo de Búsqueda
1. Usuario completa formulario
2. Click "Buscar Prospectos"
3. Validación frontend (query, location)
4. POST /api/hunter/search
5. Backend verifica acceso y cuota
6. Google Places API (con paginación)
7. Por cada resultado: getPlaceDetails()
8. INSERT en maps_prospects (ON CONFLICT DO NOTHING)
9. Crea hunter_search_history
10. Decrementa hunter_prospects_today
11. Retorna {saved, skipped, total}
12. Frontend muestra resultados en grid
13. Actualiza estadísticas en dashboard

### 12.2 Flujo de Análisis IA
1. Click "Analizar con IA" en card
2. POST /api/hunter/analyze/:id
3. Fetch prospect de DB
4. Construye prompt con datos + reviews + web
5. Llama a Gemini 2.5 Pro
6. Recibe JSON estructurado
7. Guarda en ai_analysis y campos individuales
8. Actualiza hunter_usage_stats.prospects_analyzed
9. Frontend actualiza card con badges de prioridad
10. Modal muestra "Inteligencia de Cierre"

### 12.3 Flujo de Conversión a Lead
1. Click "Convertir a Lead"
2. BEGIN TRANSACTION
3. INSERT INTO leads (datos del prospect)
4. INSERT INTO lead_tags (tags de IA)
5. UPDATE maps_prospects SET processed=true, lead_id=X
6. UPDATE hunter_usage_stats.leads_created += 1
7. COMMIT
8. Frontend marca card como procesado
9. Toast success con #LeadID

### 12.4 Flujo de Generación de Demo
1. Click "Generar Demo"
2. Modal de configuración abierto
3. Seleccionar tipo (modern/restaurant/etc)
4. Opcional: custom prompt
5. Click "Generar"
6. setDemoGenerationStage('analyzing')
7. POST /api/hunter/prospects/:id/demo
8. Backend llama geminiService.generateLandingPage()
9. Construye prompt con datos + fotos + tipo
10. Gemini genera ~8192 tokens de HTML
11. INSERT INTO hunter_demo_history
12. Genera public_token UUID
13. Retorna {demoId, publicUrl, htmlContent}
14. setDemoGenerationStage('done')
15. Modal preview con iframe
16. Botón "Compartir Link" copia URL

---

## 13. SEGURIDAD Y PERMISOS

### 13.1 Autenticación
- Middleware `authenticateToken` en todas las rutas
- JWT con userId en payload
- Token en localStorage del frontend
- Header: `Authorization: Bearer ${token}`

### 13.2 Autorización
- `checkUserAccess()` verifica `has_lead_hunter_access`
- Admin puede gestionar estrategias/tipos/usuarios
- Comercial solo ve sus prospectos
- Reasignación requiere ownership o admin

### 13.3 Validación
- Queries SQL parametrizadas ($1, $2)
- Validación de prioridades (enum)
- Unique constraints (place_id, user+date)
- Foreign keys con ON DELETE CASCADE/SET NULL

---

## 14. OPTIMIZACIONES Y RENDIMIENTO

### 14.1 Frontend
- `useCallback` en handlers para evitar re-renders
- `useMemo` para filtrado de prospectos
- Lazy loading de imágenes en galería
- Debounce en filtros de texto
- Estados locales en modales (no global)

### 14.2 Backend
- Índices en: searched_by, processed, priority, city
- Queries con LIMIT para listados
- ON CONFLICT DO NOTHING en inserts masivos
- Transacciones para consistencia

### 14.3 API
- Timeout 5s en fetch de webs
- Delay 2s entre páginas de Google
- Cacheo de estrategias en memoria
- Manejo de rate limits de Gemini

---

## 15. INTEGRACIÓN CON OTROS MÓDULOS

### 15.1 Módulo Leads
- Conversión directa con mapeo de datos
- Tags aplicados automáticamente
- Prioridad heredada del análisis IA
- Vinculación bidireccional (lead_id)

### 15.2 Módulo Admin
- Gestión de permisos de usuarios
- Configuración de APIs centralizada
- Visualización de estadísticas globales

### 15.3 Módulo Calendar (preparado)
- Campo para agendar llamadas
- Integración pendiente de desarrollar

---

## 16. FUNCIONALIDADES PENDIENTES

- [ ] Envío real de WhatsApp Business API
- [ ] Envío real de Email SMTP
- [ ] Scraping real de redes sociales (actualmente simulado)
- [ ] Webhooks para notificaciones de demo contact
- [ ] Exportación CSV/Excel
- [ ] Integración Calendar
- [ ] Bulk actions (analizar/convertir múltiples)
- [ ] Sistema de templates para mensajes
- [ ] A/B testing de mensajes
- [ ] Campañas automatizadas de follow-up

---

**TOTAL DE FUNCIONALIDADES IMPLEMENTADAS: 180+**
**Líneas de código estimadas: ~15,000**
**Tablas de base de datos: 9 principales + 1 extendida**
**Endpoints API: 31**
**Componentes React: 15+**
**Servicios Backend: 3 principales**
