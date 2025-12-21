---
description: Refactorización NoahPro CRM & Preparación Stormsboys Gateway
---

# 🚀 Plan de Implementación: AI Gateway Stormsboys

## Resumen Ejecutivo
Refactorizar el backend del CRM NoahPro para desacoplar la lógica de IA, implementar colas asíncronas, y preparar la arquitectura para el futuro AI Gateway Stormsboys.

---

## FASE 1: Base de Datos y Configuración ✅ COMPLETADO

### ✅ Tarea 1.1: Migración de Base de Datos
**Archivo:** `backend/migrations/034_ai_gateway_config.sql`
- Tabla `system_settings` creada
- Campos: ai_provider_mode, gateway_url, gateway_api_key, gateway_enabled, redis_url
- Columnas añadidas a hunter_api_config

### ✅ Tarea 1.2: Utilidad de Encriptación
**Archivo:** `backend/utils/encryption.js`
- AES-256-CBC encryption
- Funciones: encrypt(), decrypt(), hash(), isEncrypted()

### ✅ Tarea 1.3: Servicio de Configuración
**Archivo:** `backend/services/configService.js`
- Caching de configuración
- getGatewayConfig(), setGatewayConfig()
- testRedisConnection(), getSystemStatus()

---

## FASE 2: Refactorización Backend (Factory & Strategy Pattern) ✅ COMPLETADO

### ✅ Tarea 2.1: Interfaz Base AI Provider
**Archivo:** `backend/services/ai/IAProvider.js`
- Clase abstracta con métodos: analyzeProspect(), generateContent(), etc.

### ✅ Tarea 2.2: Direct Gemini Provider
**Archivo:** `backend/services/ai/DirectGeminiProvider.js`
- Lógica de Gemini movida con HTML sanitization integrada

### ✅ Tarea 2.3: Stormsboys Gateway Provider
**Archivo:** `backend/services/ai/StormsboysGatewayProvider.js`
- Payload estandarizado para gateway

### ✅ Tarea 2.4: AI Service Factory
**Archivo:** `backend/services/ai/AIServiceFactory.js`
- Factory con cache, getProvider(), setProviderMode()

---

## FASE 3: Optimización (Colas + Sanitización) ✅ COMPLETADO

### ✅ Tarea 3.1: Redis + BullMQ
- Redis instalado y corriendo
- Dependencias: bullmq, ioredis, cheerio

### ✅ Tarea 3.2: Configuración de Colas
**Archivo:** `backend/config/queue.js`
- Colas: hunter-analysis, hunter-demo, hunter-batch

### ✅ Tarea 3.3: Worker de Análisis
**Archivo:** `backend/workers/hunterWorker.js`
- Workers con rate limiting
- Notificaciones Pusher

### ✅ Tarea 3.4: HTML Sanitizer
**Archivo:** `backend/utils/htmlSanitizer.js`
- sanitizeForAI(), extractSections(), prepareForPrompt()

### ✅ Tarea 3.5: Endpoints Async
**Rutas:** `/analyze-async`, `/batch-analyze-async`
- Endpoints de cola con fallback a sync

---

## FASE 4: Frontend (Configuración UI) ✅ COMPLETADO

### ✅ Tarea 4.1: Componente AI Gateway Settings
**Archivo:** `frontend/src/components/settings/AIGatewaySettings.jsx`
- Toggle Switch para habilitar/deshabilitar gateway
- Configuración URL y API Key
- Test de conexiones
- Indicadores de estado

### ✅ Tarea 4.2: Integración en Settings
**Archivo:** `frontend/src/components/settings/LeadHunterSettings.jsx`
- Nueva tab "AI Gateway" añadida

---

## ✅ Todo Implementado

El sistema ahora está listo con:
- **Modo por defecto**: 'direct' (Gemini)
- **Switch fácil**: Cambiar a Stormsboys Gateway desde UI
- **Colas asíncronas**: Redis + BullMQ para procesamiento
- **Sanitización HTML**: Ahorro de tokens
- **UI completa**: Panel de configuración integrado

---

## Archivos Creados

```
backend/
├── migrations/
│   └── 034_ai_gateway_config.sql ✅
├── services/
│   ├── configService.js ✅
│   └── ai/
│       ├── IAProvider.js ✅
│       ├── DirectGeminiProvider.js ✅
│       ├── StormsboysGatewayProvider.js ✅
│       └── AIServiceFactory.js ✅
├── workers/
│   └── hunterWorker.js ✅
├── config/
│   └── queue.js ✅
└── utils/
    ├── encryption.js ✅
    └── htmlSanitizer.js ✅

frontend/
└── src/
    └── components/
        └── settings/
            └── AIGatewaySettings.jsx ✅
```

---

## Notas para Producción

- **Redis en Producción**: Configurar `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` en variables de entorno
- **ENCRYPTION_KEY**: Definir una clave segura de 32 caracteres en producción
- **Iniciar Workers**: Añadir el inicio de workers en el script de producción
- **Monitoreo**: Usar Bull Board o similar para monitorear colas
