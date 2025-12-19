# Infraestructura y Despliegue - NoahPro CRM

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.x | Framework UI |
| **Vite** | 5.x | Build tool & dev server |
| **Tailwind CSS** | 3.x | Estilos utility-first |
| **Lucide React** | - | Iconografía |
| **React Grid Layout** | - | Dashboard personalizable |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18.x+ | Runtime |
| **Express.js** | 4.x | Framework API REST |
| **PostgreSQL** | 14+ | Base de datos principal |
| **JWT** | - | Autenticación |
| **Pusher** | - | WebSockets/Real-time |

---

## Entorno de Desarrollo Local

### Requisitos
- Node.js 18+
- PostgreSQL 14+
- Git

### Servidores de Desarrollo
| Servicio | Puerto | Comando |
|----------|--------|---------|
| Frontend (Vite) | `5173` | `cd frontend && npm run dev` |
| Backend (Express) | `3003` | `cd backend && npm start` |
| PostgreSQL | `5432` | Sistema local |

### Variables de Entorno (Dev)
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:3003/api

# Backend (.env)
PORT=3003
DATABASE_URL=postgresql://user:pass@localhost:5432/noahpro_dev
JWT_SECRET=your_secret
```

---

## Entorno de Producción

### Servidor
| Especificación | Valor |
|----------------|-------|
| **Proveedor** | VPS (Plesk) |
| **IP** | `213.165.69.127` |
| **Dominio** | `noahpro.es` |
| **OS** | Linux |
| **Panel** | Plesk |

### Servicios en Producción
| Servicio | Puerto | Gestor |
|----------|--------|--------|
| CRM API | `3003` | PM2 (`crm-noahpro-api`) |
| TPV API | `3002` | PM2 (`tpv-api`) |
| Frontend | - | Nginx (archivos estáticos) |
| PostgreSQL | `5432` | Sistema |

### Nginx (Reverse Proxy)
```nginx
# /etc/nginx/plesk.conf.d/vhosts/noahpro.es.conf
location /api/ {
    proxy_pass http://127.0.0.1:3003/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location / {
    root /var/www/vhosts/noahpro.es/app/frontend/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## Proceso de Despliegue

### 1. Build Local
```bash
cd frontend
npm run build
```

### 2. Push a Repositorio
```bash
git add .
git commit -m "Deploy: descripción del cambio"
git push origin main
```

### 3. Pull en Servidor
```bash
ssh root@213.165.69.127
cd /var/www/vhosts/noahpro.es/app
git pull origin main
```

### 4. Rebuild Frontend (si hay cambios)
```bash
cd frontend
npm install
npm run build
```

### 5. Reiniciar Backend (si hay cambios)
```bash
pm2 restart crm-noahpro-api
```

### 6. Verificar
```bash
pm2 status
curl https://noahpro.es/api/health
```

---

## Herramientas de Gestión

| Herramienta | Uso |
|-------------|-----|
| **PM2** | Gestión de procesos Node.js |
| **Git** | Control de versiones |
| **SSH** | Acceso remoto al servidor |
| **Plesk** | Panel de control del hosting |
| **Nginx** | Proxy inverso y servidor web |

---

## URLs de Acceso

| Entorno | URL |
|---------|-----|
| **Producción CRM** | `https://noahpro.es/crm/login` |
| **Producción TPV** | `https://demotpv.noahpro.es` |
| **Desarrollo Frontend** | `http://localhost:5173` |
| **Desarrollo API** | `http://localhost:3003/api` |
