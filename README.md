# 🚀 NoahPro CRM - Sistema Completo de Gestión de Leads

Sistema CRM profesional para gestión de leads, propuestas comerciales, chat en tiempo real y análisis de conversión.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Documentation](#api-documentation)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Funcionalidades Principales](#funcionalidades-principales)

## ✨ Características

### 🎯 Gestión de Leads
- ✅ Captura automática desde landing page
- ✅ Creación manual de leads
- ✅ Pipeline de ventas (Nuevo → Contactado → Cualificado → Propuesta → Ganado/Perdido)
- ✅ Búsqueda y filtrado avanzado
- ✅ Exportación a Excel

### 📄 Propuestas Comerciales
- ✅ Sistema de plantillas personalizables
- ✅ Generación automática de propuestas
- ✅ Envío por email con HTML profesional
- ✅ Tracking de visualización
- ✅ Sistema de comentarios
- ✅ Exportación a PDF

### 💬 Chat en Tiempo Real
- ✅ Widget de chat para landing page
- ✅ Panel de administración de conversaciones
- ✅ Notificaciones en tiempo real
- ✅ Historial de mensajes
- ✅ Configuración personalizable (colores, mensajes)

### 🔔 Sistema de Notificaciones
- ✅ Notificaciones push en navegador
- ✅ Notificaciones en tiempo real vía Socket.io
- ✅ Campana de notificaciones en dashboard
- ✅ Emails automáticos con plantillas HTML
- ✅ Notificaciones para: nuevos leads, propuestas vistas, comentarios, chat

### 📊 Analytics
- ✅ Tracking de visitas a landing page
- ✅ Métricas de conversión
- ✅ Análisis de fuentes de tráfico
- ✅ Estadísticas de leads por estado

### 🎨 Interfaz
- ✅ Modo oscuro/claro
- ✅ Diseño responsive
- ✅ Componentes reutilizables
- ✅ Animaciones suaves

## 🛠 Tecnologías

### Backend
- **Node.js** + **Express** - Framework web
- **PostgreSQL** - Base de datos
- **Socket.io** - Comunicación en tiempo real
- **Nodemailer** - Envío de emails
- **PDFKit** - Generación de PDFs
- **ExcelJS** - Generación de Excel
- **Swagger** - Documentación de API
- **JWT** - Autenticación
- **Bcrypt** - Hash de contraseñas

### Frontend
- **React** - Librería UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Socket.io Client** - Cliente WebSocket
- **UUID** - Generación de IDs únicos

## 📦 Instalación

### Prerrequisitos
- Node.js >= 16
- PostgreSQL >= 13
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd crm-app-tpv
```

### 2. Instalar dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Configurar base de datos

```bash
# Crear base de datos
createdb leads_db

# Ejecutar migraciones
cd backend
psql -U <tu_usuario> -d leads_db -f migrations/001_create_crm_settings.sql
psql -U <tu_usuario> -d leads_db -f migrations/002_add_chat_settings.sql
psql -U <tu_usuario> -d leads_db -f migrations/003_fix_proposal_templates.sql
psql -U <tu_usuario> -d leads_db -f migrations/004_create_notifications.sql
```

### 4. Configurar variables de entorno

Crear archivo `.env` en la carpeta `backend`:

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://usuario:password@localhost:5432/leads_db

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion
EMAIL_FROM=noreply@noahpro.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 5. Iniciar la aplicación

#### Backend
```bash
cd backend
npm run dev
```

#### Frontend
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002
- **API Docs**: http://localhost:3002/api-docs

## 🔧 Configuración

### Usuario Administrador por Defecto
```
Usuario: admin
Contraseña: admin
```

**⚠️ IMPORTANTE**: Cambiar la contraseña después del primer login.

### Resetear Contraseña de Admin
```bash
cd backend
node scripts/reset_password.js
```

### Configuración del Chat
1. Ir a Dashboard → Configuración
2. Sección "Configuración del Chat"
3. Personalizar:
   - Título del chat
   - Mensaje de bienvenida
   - Color principal
   - Habilitar/deshabilitar

### Configuración de Plantillas
1. Ir a Dashboard → Configuración
2. Sección "Plantillas de Propuestas"
3. Crear/editar plantillas
4. Marcar plantilla por defecto

## 📖 API Documentation

La documentación completa de la API está disponible en Swagger UI:

**URL**: http://localhost:3002/api-docs

### Endpoints Principales

#### Leads
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Crear lead
- `GET /api/leads/:id` - Obtener lead
- `PUT /api/leads/:id` - Actualizar lead
- `DELETE /api/leads/:id` - Eliminar lead

#### Propuestas
- `GET /api/proposals/lead/:leadId` - Propuestas de un lead
- `POST /api/proposals` - Crear propuesta
- `GET /api/proposals/public/:token` - Ver propuesta pública
- `GET /api/proposals/public/:token/download` - Descargar PDF

#### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `GET /api/notifications/unread-count` - Contador no leídas
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/mark-all-read` - Marcar todas

#### Exportación
- `GET /api/export/leads/excel` - Exportar leads a Excel

#### Chat
- Socket.io events: `join_room`, `send_message`, `typing`, etc.

## 📁 Estructura del Proyecto

```
crm-app-tpv/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── leadsController.js
│   │   ├── notificationsController.js
│   │   ├── proposalController.js
│   │   └── ...
│   ├── migrations/
│   │   ├── 001_create_crm_settings.sql
│   │   ├── 002_add_chat_settings.sql
│   │   ├── 003_fix_proposal_templates.sql
│   │   └── 004_create_notifications.sql
│   ├── routes/
│   │   ├── leads.js
│   │   ├── proposals.js
│   │   ├── notifications.js
│   │   └── ...
│   ├── services/
│   │   ├── emailService.js
│   │   ├── pdfService.js
│   │   ├── excelService.js
│   │   └── notificationService.js
│   ├── socket/
│   │   ├── chatHandler.js
│   │   └── socketInstance.js
│   ├── templates/
│   │   ├── welcome.html
│   │   ├── notification.html
│   │   └── proposal.html
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── LeadsDashboard.jsx
│   │   │   │   └── chat/
│   │   │   ├── landing/
│   │   │   │   ├── LandingPage.jsx
│   │   │   │   └── ChatWidget.jsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationBell.jsx
│   │   │   └── settings/
│   │   │       ├── SettingsPanel.jsx
│   │   │       └── TemplatesManager.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🎯 Funcionalidades Principales

### 1. Captura de Leads
Los leads se capturan automáticamente desde el formulario de la landing page y se envían:
- Email de bienvenida al lead
- Email de notificación al equipo de ventas
- Notificación push en el dashboard

### 2. Gestión de Pipeline
Mueve los leads a través del pipeline:
1. **Nuevo** - Lead recién capturado
2. **Contactado** - Primer contacto realizado
3. **Cualificado** - Lead validado
4. **Propuesta Enviada** - Propuesta comercial enviada
5. **Ganado** - Cliente convertido
6. **Perdido** - Oportunidad perdida

### 3. Creación de Propuestas
1. Seleccionar lead
2. Elegir plantilla (opcional)
3. Personalizar título, precio y descripción
4. Enviar → Se genera:
   - Link público único
   - Email con la propuesta
   - Notificación al equipo

### 4. Chat en Tiempo Real
- Los visitantes pueden chatear desde la landing page
- Los administradores responden desde el dashboard
- Historial persistente en base de datos
- Notificaciones en tiempo real

### 5. Exportación de Datos
- **Excel**: Exporta leads con filtros aplicados
- **PDF**: Descarga propuestas en formato profesional

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con Bcrypt
- ✅ CORS configurado
- ✅ Variables de entorno para secretos
- ✅ Validación de inputs
- ⚠️ **TODO**: Implementar rate limiting
- ⚠️ **TODO**: Añadir autenticación a rutas protegidas

## 🚀 Despliegue

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Servir la carpeta dist/ con nginx o similar
```

### Variables de Entorno en Producción
Asegúrate de configurar:
- `NODE_ENV=production`
- `DATABASE_URL` con la URL de producción
- `JWT_SECRET` con un secreto fuerte
- `FRONTEND_URL` con el dominio de producción
- Credenciales SMTP válidas

## 📝 Próximos Pasos

- [ ] Tests unitarios con Jest
- [ ] Tests de integración
- [ ] Autenticación en rutas protegidas
- [ ] Rate limiting
- [ ] Logs estructurados
- [ ] Monitoreo y alertas
- [ ] CI/CD pipeline

## 👥 Equipo

Desarrollado por **NoahPro**

## 📄 Licencia

Privado - Uso interno exclusivo

---

**¿Necesitas ayuda?** Contacta a desarrollo@noahpro.com
