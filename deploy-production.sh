#!/bin/bash
# Lead Hunter v2.0 - Script de Deployment Automatizado
# Servidor: noahpro.es (213.165.69.127)

set -e  # Exit on error

echo "🚀 Lead Hunter v2.0 - Deployment to Production"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
REPO_URL="https://github.com/christian-eduard/crm_noahpro.git"
APP_DIR="/var/www/crm-noahpro"
DB_NAME="crm_tpv"
DB_USER="tpv"
DB_PASS="Zeta10zeta@"
DOMAIN="noahpro.es"

echo -e "${YELLOW}Paso 1/10: Verificando pre-requisitos...${NC}"
# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL no encontrado. Instalando...${NC}"
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi
echo -e "${GREEN}✅ PostgreSQL instalado${NC}"

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando PM2...${NC}"
    sudo npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 instalado${NC}"

# Verificar Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Git...${NC}"
    sudo apt-get install -y git
fi
echo -e "${GREEN}✅ Git instalado${NC}"

echo ""
echo -e "${YELLOW}Paso 2/10: Preparando directorio de aplicación...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

echo ""
echo -e "${YELLOW}Paso 3/10: Clonando repositorio...${NC}"
if [ -d ".git" ]; then
    echo "Repositorio ya existe, pulling latest changes..."
    git pull origin main
else
    git clone $REPO_URL .
fi
git log --oneline -5
echo -e "${GREEN}✅ Código descargado${NC}"

echo ""
echo -e "${YELLOW}Paso 4/10: Configurando Base de Datos...${NC}"

# Verificar si la base de datos existe
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    echo "Creando base de datos $DB_NAME..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    echo -e "${GREEN}✅ Base de datos creada${NC}"
else
    echo -e "${GREEN}✅ Base de datos ya existe${NC}"
fi

# Ejecutar migraciones
echo "Ejecutando migraciones..."
cd backend/migrations
for migration in *.sql; do
    echo "  Ejecutando: $migration"
    PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f "$migration" 2>&1 | grep -v "already exists" || true
done
cd ../..
echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"

echo ""
echo -e "${YELLOW}Paso 5/10: Configurando Backend...${NC}"
cd backend

# Instalar dependencias
npm install --production

# Crear archivo .env
cat > .env << EOF
PORT=3002
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# APIs (ESTOS DEBES CONFIGURARLOS)
GEMINI_API_KEY=AIzaSyCq9nBOZXo7ZEVIbYGh_TruGy3PqrXKejk
GOOGLE_PLACES_API_KEY=TU_GOOGLE_PLACES_API_KEY

# CORS
FRONTEND_URL=https://$DOMAIN

# Session Secrets (generados aleatoriamente)
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
EOF

chmod 600 .env
echo -e "${GREEN}✅ Backend configurado${NC}"

echo ""
echo -e "${YELLOW}Paso 6/10: Configurando Frontend...${NC}"
cd ../frontend

# Instalar dependencias
npm install

# Crear .env.production
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF

# Build
echo "Building frontend (esto puede tardar 2-3 minutos)..."
npm run build

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Frontend built exitosamente${NC}"
    echo "Archivos generados:"
    ls -lh dist/ | head -10
else
    echo -e "${RED}❌ Error: dist/ no fue generado${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${YELLOW}Paso 7/10: Configurando Nginx...${NC}"

# Instalar Nginx si no existe
if ! command -v nginx &> /dev/null; then
    echo "Instalando Nginx..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Crear configuración del sitio
sudo tee /etc/nginx/sites-available/crm-noahpro > /dev/null << 'EOF'
server {
    listen 80;
    server_name noahpro.es www.noahpro.es;

    # Logs
    access_log /var/log/nginx/crm-access.log;
    error_log /var/log/nginx/crm-error.log;

    # Frontend (React SPA)
    location / {
        root /var/www/crm-noahpro/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts largos para generación de demos
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Assets con cache largo
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/crm-noahpro/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Tamaño máximo de upload (para formularios de contact)
    client_max_body_size 10M;
}
EOF

# Activar sitio
sudo ln -sf /etc/nginx/sites-available/crm-noahpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remover sitio default

# Test configuración
if sudo nginx -t; then
    echo -e "${GREEN}✅ Configuración de Nginx OK${NC}"
    sudo systemctl reload nginx
else
    echo -e "${RED}❌ Error en configuración de Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Paso 8/10: Configurando PM2...${NC}"
cd backend

# Crear configuración PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'crm-backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/crm-backend-error.log',
    out_file: '/var/log/pm2/crm-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
EOF

# Crear directorio de logs
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Iniciar aplicación
pm2 delete crm-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep "sudo" | bash || true

echo -e "${GREEN}✅ Backend iniciado con PM2${NC}"

echo ""
echo -e "${YELLOW}Paso 9/10: Configurando SSL con Certbot...${NC}"

# Instalar Certbot
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Obtener certificado SSL
echo "Obteniendo certificado SSL para $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo -e "${GREEN}✅ SSL configurado${NC}"

echo ""
echo -e "${YELLOW}Paso 10/10: Verificación final...${NC}"

# Test backend
echo "Testing backend..."
sleep 3
if curl -f http://localhost:3002/api/health &>/dev/null; then
    echo -e "${GREEN}✅ Backend respondiendo${NC}"
else
    echo -e "${RED}⚠️  Backend no responde en /api/health${NC}"
fi

# Test frontend
echo "Testing frontend..."
if curl -f http://localhost &>/dev/null; then
    echo -e "${GREEN}✅ Frontend accesible${NC}"
else
    echo -e "${RED}⚠️  Frontend no accesible${NC}"
fi

# Ver logs
echo ""
echo -e "${YELLOW}Últimas líneas de logs:${NC}"
pm2 logs crm-backend --lines 10 --nostream

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETADO${NC}"
echo "=============================================="
echo ""
echo "📊 Estado de la aplicación:"
pm2 status
echo ""
echo "🌐 URLs de acceso:"
echo "  - Frontend: https://$DOMAIN"
echo "  - API Health: https://$DOMAIN/api/health"
echo ""
echo "📝 Logs en tiempo real:"
echo "  pm2 logs crm-backend"
echo ""
echo "🔄 Reiniciar backend:"
echo "  pm2 restart crm-backend"
echo ""
echo "⚠️  IMPORTANTE: Configurar API keys en:"
echo "  $APP_DIR/backend/.env"
echo "  - GEMINI_API_KEY"
echo "  - GOOGLE_PLACES_API_KEY"
echo ""
