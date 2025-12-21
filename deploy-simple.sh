#!/bin/bash
# Lead Hunter v2.0 - Deployment SIMPLIFICADO (usa BD existente)
set -e

echo "🚀 Lead Hunter v2.0 - Deployment to Production"
echo "=============================================="

# Variables
REPO_URL="https://github.com/christian-eduard/crm_noahpro.git"
APP_DIR="/var/www/crm-noahpro"
DB_NAME="crm_tpv"
DB_USER="tpv"
DB_PASS="Zeta10zeta@"
DOMAIN="noahpro.es"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1/8: Instalando dependencias básicas...${NC}"
apt-get update -qq
apt-get install -y -qq git nginx certbot python3-certbot-nginx > /dev/null 2>&1

# Verificar/Instalar Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi

# Verificar/Instalar PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 > /dev/null 2>&1
fi

echo -e  "${GREEN}✅ Dependencias listas${NC}"

echo -e "${YELLOW}2/8: Clonando código...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR
if [ -d ".git" ]; then
    git pull origin main
else
    git clone $REPO_URL .
fi
echo -e "${GREEN}✅$(git log --oneline -1)${NC}"

echo -e "${YELLOW}3/8: Ejecutando migraciones de BD...${NC}"
cd backend/migrations
for f in *.sql; do
    PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f "$f" 2>&1 | grep -v "already exists" | grep -v "^$" || true
done
echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"

echo -e "${YELLOW}4/8: Configurando Backend...${NC}"
cd ../
npm install --production --silent

cat > .env << EOF
PORT=3002
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
GEMINI_API_KEY=AIzaSyCq9nBOZXo7ZEVIbYGh_TruGy3PqrXKejk
GOOGLE_PLACES_API_KEY=PENDIENTE_CONFIGURAR
FRONTEND_URL=https://$DOMAIN
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
EOF
chmod 600 .env
echo -e "${GREEN}✅ Backend configurado${NC}"

echo -e "${YELLOW}5/8: Building Frontend...${NC}"
cd ../frontend
npm install --silent
cat > .env.production << EOF
VITE_API_URL=https://$DOMAIN/api
EOF
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ Frontend built (dist/ generado)${NC}"

echo -e "${YELLOW}6/8: Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/crm-noahpro << 'NGINX_EOF'
server {
    listen 80;
    server_name noahpro.es www.noahpro.es;
    
    location / {
        root /var/www/crm-noahpro/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/crm-noahpro/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/crm-noahpro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx configurado${NC}"

echo -e "${YELLOW}7/8: Iniciando Backend con PM2...${NC}"
cd $APP_DIR/backend
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'crm-backend',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production' },
    error_file: '/var/log/pm2/crm-error.log',
    out_file: '/var/log/pm2/crm-out.log',
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
PM2_EOF

mkdir -p /var/log/pm2
pm2 delete crm-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -n 1 | bash || true
echo -e "${GREEN}✅ Backend iniciado${NC}"

echo -e "${YELLOW}8/8: Configurando SSL...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect 2>&1 | grep -E "(Successfully|Congratulations)" || echo "SSL ya configurado o pendiente"
echo -e "${GREEN}✅ SSL configurado${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETADO${NC}"
echo "=============================================="
pm2 status
echo ""
echo "🌐 Acceder: https://$DOMAIN"
echo "📊 Logs: pm2 logs crm-backend"
echo ""
