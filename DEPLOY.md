# Despliegue en Plesk - CRM NoahPro

## Estructura de Ramas Git

- **`main`**: Rama de desarrollo (local)
- **`production`**: Rama de producción (servidor Plesk)

## Flujo de Trabajo

### 1. Desarrollo Local
```bash
# Trabajar en rama main
git checkout main
# ... hacer cambios ...
git add -A
git commit -m "Descripción del cambio"
git push origin main
```

### 2. Desplegar a Producción
```bash
# Mergear main a production
git checkout production
git merge main
git push origin production
git checkout main
```

### 3. En el Servidor (Plesk)
```bash
cd /var/www/vhosts/noahpro.es/app
git pull origin production

# Rebuild frontend si hay cambios
cd frontend
VITE_API_URL=https://noahpro.es/api npm run build
cp -r dist/* /var/www/vhosts/noahpro.es/httpdocs/

# Reiniciar backend si hay cambios
pm2 restart crm-noahpro-api
```

## Configuración del Servidor

### Ubicaciones importantes
- **Repositorio**: `/var/www/vhosts/noahpro.es/app`
- **Frontend servido**: `/var/www/vhosts/noahpro.es/httpdocs`
- **Backend .env**: `/var/www/vhosts/noahpro.es/app/backend/.env`
- **PM2 proceso**: `crm-noahpro-api`

### Archivo .env de Producción
El archivo `.env` NO está en Git. Debe configurarse manualmente en el servidor:

```bash
cat > /var/www/vhosts/noahpro.es/app/backend/.env << 'EOF'
PORT=3002
NODE_ENV=production
DATABASE_URL=postgresql://tpv:Zeta10zeta%40@localhost:5432/crm_tpv
LEADS_DATABASE_URL=postgresql://tpv:Zeta10zeta%40@localhost:5432/crm_tpv
JWT_SECRET=fbea55a01d8092ae42e182dafe43d4c28d71effa75a4e30f80db4306fcfb0e9b
FRONTEND_URL=https://noahpro.es
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
PUSHER_APP_ID=2086108
PUSHER_KEY=0815d25ee2bae406d7d9
PUSHER_SECRET=
PUSHER_CLUSTER=eu
EOF
```

## Script de Despliegue Rápido

Desde local, ejecutar:
```bash
# Deploy completo
sshpass -p 'PASSWORD' ssh root@213.165.69.127 '
cd /var/www/vhosts/noahpro.es/app && 
git pull origin production && 
cd frontend && 
VITE_API_URL=https://noahpro.es/api npm run build && 
rm -rf /var/www/vhosts/noahpro.es/httpdocs/* && 
cp -r dist/* /var/www/vhosts/noahpro.es/httpdocs/ && 
chown -R noahpro.es_zsz4d3nchf:psaserv /var/www/vhosts/noahpro.es/httpdocs/ && 
pm2 restart crm-noahpro-api
'
```

## Acceso SSH
- **Host**: 213.165.69.127
- **Usuario**: root
- **Dominio Plesk**: noahpro.es

## Base de Datos
- **Tipo**: PostgreSQL
- **Base de datos**: crm_tpv
- **Usuario**: tpv
- **Password**: Zeta10zeta@
