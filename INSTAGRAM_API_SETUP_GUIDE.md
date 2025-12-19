# Guía de Configuración: Instagram Graph API

## Paso 1: Crear Facebook App

### 1.1 Acceder a Facebook Developers
1. Ve a https://developers.facebook.com
2. Inicia sesión con tu cuenta de Facebook
3. Click en "Mis Apps" → "Crear App"

### 1.2 Configurar la App
- **Tipo de App**: Negocios
- **Nombre**: "NoahPro CRM Lead Hunter"
- **Email de contacto**: tu@email.com
- **Categoría**: Negocio y Páginas

### 1.3 Añadir Producto "Instagram Graph API"
- En el dashboard de la app, busca "Instagram"
- Click en "Configurar" en "Instagram Graph API"

---

## Paso 2: Crear/Vincular Cuenta de Instagram Business

### 2.1 Requisitos Previos
Tu cuenta de Instagram DEBE ser:
- **Cuenta profesional** (Business o Creator)
- **Vinculada a una Página de Facebook**

### 2.2 Convertir cuenta personal a Business
1. Instagram App → Configuración → Cuenta
2. "Cambiar tipo de cuenta" → "Cuenta profesional"
3. Selecciona categoría (ej: "Servicios empresariales")
4. Conecta con Página de Facebook existente o crea una nueva

---

## Paso 3: Obtener Access Token

### 3.1 Access Token de Prueba (válido 1 hora)
1. En Facebook Developers → Tu App
2. Tools → Graph API Explorer
3. Selecciona tu App en el dropdown
4. Permisos necesarios:
   - `instagram_basic`
   - `instagram_manage_insights`  
   - `pages_read_engagement`
5. Click "Generate Access Token"
6. Copia el token

### 3.2 Convertir a Long-Lived Token (válido 60 días)
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TOKEN_CORTO"
```

Respuesta:
```json
{
  "access_token": "EAAxxxxx...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

### 3.3 Obtener Instagram Business Account ID
```bash
curl -i -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=TU_ACCESS_TOKEN"
```

Esto devuelve tus Páginas de Facebook. Busca la que está vinculada a tu Instagram:

```bash
curl -i -X GET "https://graph.facebook.com/v18.0/{PAGE_ID}?fields=instagram_business_account&access_token=TU_ACCESS_TOKEN"
```

Respuesta:
```json
{
  "instagram_business_account": {
    "id": "1234567890123456" // ← Este es tu Business Account ID
  },
  "id": "page_id"
}
```

---

## Paso 4: Configurar en NoahPro CRM

### 4.1 Ir a Configuración Lead Hunter
1. Admin Panel → Lead Hunter → Configuración
2. Sección "APIs de Redes Sociales"

### 4.2 Completar Campos Instagram Graph API
```json
{
  "businessAccountId": "1234567890123456",
  "accessToken": "EAAxxxxx...",
  "method": "api"
}
```

### 4.3 Test de Conexión
- Click en "Probar Instagram API"
- Debe devolver: ✓ Conexión exitosa

---

## Paso 5: Renovación Automática de Token (Opcional pero Recomendado)

### 5.1 Problema
Los Long-Lived Tokens expiran cada 60 días.

### 5.2 Solución: Never-Expiring Token
Requiere que la App esté en "Modo Desarrollo Aprobado":

1. Facebook Developers → Tu App → App Review
2. Solicita aprobación para `instagram_basic` y `pages_read_engagement`
3. Una vez aprobada, el token no expirará mientras se use cada 60 días

### 5.3 Auto-refresh (Backend)
Implementar job que renueva el token cada 50 días:

```javascript
// backend/jobs/refreshInstagramToken.js
const cron = require('node-cron');

// Ejecutar cada 50 días
cron.schedule('0 0 */50 * *', async () => {
  const config = await getInstagramConfig();
  const newToken = await refreshAccessToken(config.accessToken);
  await updateInstagramConfig({ accessToken: newToken });
  console.log('✓ Instagram token renovado');
});
```

---

## Troubleshooting

### Error: "Invalid OAuth access token"
- **Causa**: Token expirado
- **Solución**: Generar nuevo long-lived token

### Error: "Business account not found"
- **Causa**: `businessAccountId` incorrecto
- **Solución**: Volver a obtener el ID con el endpoint `/me/accounts`

### Error: "Insufficient permissions"
- **Causa**: Faltan permisos en el token
- **Solución**: Regenerar token con todos los permisos marcados

### Scraping funciona pero API no
- **Causa**: Configuración incorrecta o token inválido
- **Solución**: El sistema automáticamente usa scraping como fallback

---

## Límites de Rate

### Instagram Graph API
- **200 llamadas por hora** por usuario
- **5 llamadas por segundo**

Con 100 prospectos/día:
- Extracción de handle: No consume API (es scraping)
- Solo llamamos API si detectamos handle válido
- Estimado: 30-50 llamadas/día (dentro del límite)

---

## Alternativa: Solo Scraping

Si no quieres configurar la API, el sistema funcionará con scraping:

```json
{
  "method": "scraping"
}
```

**Pros**:
- No requiere configuración
- Funciona inmediatamente

**Contras**:
- Menos datos (sin engagement rate preciso)
- Menos fiable (Instagram puede bloquear)
- Más lento

---

## Referencias Oficiales

- Documentación Instagram Graph API: https://developers.facebook.com/docs/instagram-api
- Business Discovery: https://developers.facebook.com/docs/instagram-api/guides/business-discovery
- Access Tokens: https://developers.facebook.com/docs/facebook-login/guides/access-tokens
