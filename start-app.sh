#!/bin/bash
# Script de inicio para CRM App TPV
# Uso: ./start-app.sh [start|stop|status|restart]

PROJECT_DIR="/Users/cex/Desktop/Crm App Tpv"
BACKEND_LOG="/tmp/crm_backend.log"
FRONTEND_LOG="/tmp/crm_frontend.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

stop_services() {
    echo -e "${YELLOW}Parando servicios...${NC}"
    pkill -9 -f "node.*start.js" 2>/dev/null
    pkill -9 -f "vite.*5174" 2>/dev/null
    pkill -9 -f "esbuild" 2>/dev/null
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    lsof -ti:5174 | xargs kill -9 2>/dev/null
    sleep 1
    echo -e "${GREEN}Servicios parados${NC}"
}

start_backend() {
    echo -e "${YELLOW}Iniciando backend...${NC}"
    cd "$PROJECT_DIR/backend"
    (node start.js < /dev/null > "$BACKEND_LOG" 2>&1 &)
    echo $! > /tmp/crm_backend.pid
    sleep 3
    if curl -s http://localhost:3002/health > /dev/null; then
        echo -e "${GREEN}✓ Backend OK en http://localhost:3002${NC}"
    else
        echo -e "${RED}✗ Backend falló al iniciar. Ver $BACKEND_LOG${NC}"
        cat "$BACKEND_LOG" | tail -20
        return 1
    fi
}

start_frontend() {
    echo -e "${YELLOW}Iniciando frontend...${NC}"
    cd "$PROJECT_DIR/frontend"
    (npm run dev < /dev/null > "$FRONTEND_LOG" 2>&1 &)
    echo $! > /tmp/crm_frontend.pid
    sleep 4
    if curl -s http://localhost:5174 > /dev/null; then
        echo -e "${GREEN}✓ Frontend OK en http://localhost:5174${NC}"
    else
        echo -e "${RED}✗ Frontend falló. Ver $FRONTEND_LOG${NC}"
        cat "$FRONTEND_LOG" | tail -20
        return 1
    fi
}

show_status() {
    echo -e "${YELLOW}Estado de servicios:${NC}"
    if curl -s -m 3 http://localhost:3002/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend: RUNNING (port 3002)${NC}"
    else
        echo -e "${RED}✗ Backend: STOPPED${NC}"
    fi
    if curl -s -m 3 http://localhost:5174 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend: RUNNING (port 5174)${NC}"
    else
        echo -e "${RED}✗ Frontend: STOPPED${NC}"
    fi
}

case "${1:-start}" in
    start)
        stop_services
        start_backend && start_frontend
        echo ""
        show_status
        echo ""
        echo -e "${GREEN}Aplicación lista en: http://localhost:5174${NC}"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_backend && start_frontend
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        echo "=== Backend Log ===" && tail -30 "$BACKEND_LOG"
        echo ""
        echo "=== Frontend Log ===" && tail -30 "$FRONTEND_LOG"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
