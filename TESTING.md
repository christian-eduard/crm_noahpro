# Testing Guide - CRM Application

## 📋 Overview

Este proyecto incluye una suite completa de tests unitarios y de integración usando:
- **Backend**: Jest + Supertest
- **Frontend**: Vitest + React Testing Library

**Total de tests implementados**: 40 tests

---

## 🚀 Ejecución de Tests

### Backend

```bash
cd backend

# Ejecutar todos los tests
npm test

# Modo watch (re-ejecuta al guardar cambios)
npm run test:watch

# Con reporte de coverage
npm run test:coverage
```

### Frontend

```bash
cd frontend

# Ejecutar todos los tests
npm test

# UI interactiva
npm run test:ui

# Con reporte de coverage
npm run test:coverage
```

---

## 📊 Tests Implementados

### Backend Tests (14 tests totales)

#### 1. `proposals.test.js` - 6 tests
- ✅ POST `/api/proposals/:id/accept` - Should accept proposal
- ✅ Verifica actualización de status a 'accepted'
- ✅ Verifica actualización de lead a 'won'
- ✅ Retorna 404 para propuesta no existente
- ✅ Crea registro de actividad
- ✅ GET `/api/proposals/public/:token` - Retorna datos de propuesta
- ✅ Actualiza viewed_at en primera vista
- ✅ Retorna 404 para token inválido

#### 2. `leads.test.js` - 8 tests
- ✅ GET `/api/leads` - Retorna todos los leads
- ✅ Filtra leads por status
- ✅ Busca leads por nombre
- ✅ POST `/api/leads` - Crea nuevo lead
- ✅ Retorna 400 si faltan campos requeridos
- ✅ Maneja emails duplicados
- ✅ GET `/api/leads/:id` - Retorna lead específico
- ✅ PUT `/api/leads/:id` - Actualiza lead

### Frontend Tests (26 tests totales)

#### 3. `PublicProposal.test.jsx` - 8 tests
- ✅ Renderiza título y descripción
- ✅ Muestra precio formateado
- ✅ Muestra botón aceptar propuesta
- ✅ Maneja flujo de aceptación
- ✅ Muestra estado deshabilitado cuando ya aceptada
- ✅ Maneja envío de comentarios
- ✅ Muestra estado de error

#### 4. `TagBadge.test.jsx` - 7 tests
- ✅ Renderiza nombre de tag
- ✅ Aplica color de fondo correcto
- ✅ Llama onRemove al hacer click en ✕
- ✅ No muestra botón de remover sin onRemove
- ✅ Detiene propagación de eventos
- ✅ Renderiza con diferentes tamaños
- ✅ Aplica clases de hover

#### 5. `CrmLayout.test.jsx` - 11 tests
- ✅ Renderiza sidebar con todos los items
- ✅ Renderiza contenido hijo
- ✅ Muestra botón "+ Nuevo"
- ✅ Abre dropdown de acciones rápidas
- ✅ Llama onQuickAction con 'lead'
- ✅ Llama onQuickAction con 'proposal'
- ✅ Llama onQuickAction con 'meeting'
- ✅ Cierra dropdown al hacer click en backdrop
- ✅ Resalta sección activa
- ✅ Llama onSectionChange al hacer click
- ✅ Toggle sidebar colapsado

---

## 🎯 Coverage Threshold

Configurado para mantener mínimo **70% de coverage** en:
- ✅ Branches
- ✅ Functions
- ✅ Lines
- ✅ Statements

---

## 📁 Estructura de Archivos

```
backend/
├── jest.config.js
├── __tests__/
│   ├── setup.js
│   └── routes/
│       ├── proposals.test.js
│       └── leads.test.js

frontend/
├── vite.config.js (con configuración test)
├── src/
│   ├── setupTests.js
│   └── components/
│       ├── public/
│       │   └── __tests__/
│       │       └── PublicProposal.test.jsx
│       ├── shared/
│       │   └── __tests__/
│       │       └── TagBadge.test.jsx
│       └── layout/
│           └── __tests__/
│               └── CrmLayout.test.jsx
```

---

## 🛠️ Configuración

### Backend (Jest)

`jest.config.js`:
- Test environment: Node
- Coverage threshold: 70%
- Timeout: 10s
- Setup file con mocks de env

### Frontend (Vitest)

`vite.config.js`:
- Environment: jsdom
- Setup file con mocks globales
- Coverage reporters: text, json, html

---

## 🔍 Ejemplos de Uso

### Testing Endpoint con Supertest

```javascript
it('should accept a proposal', async () => {
  const res = await request(app)
    .post(`/api/proposals/${proposalId}/accept`)
    .expect(200);

  expect(res.body.message).toContain('aceptada');
});
```

### Testing Componente React

```javascript
it('renders tag name correctly', () => {
  render(<TagBadge tag={mockTag} />);
  expect(screen.getByText('Urgente')).toBeInTheDocument();
});
```

---

## ⚡ Tips

1. **Modo Watch**: Usa `npm run test:watch` durante desarrollo
2. **Debug**: Usa `console.log` dentro de tests si es necesario
3. **Mock Data**: Crea data de prueba en `beforeAll` y limpia en `afterAll`
4. **Async Tests**: Siempre usa `async/await` con `waitFor` para operaciones asíncronas

---

## 📈 Coverage Reports

Ejecuta `npm run test:coverage` para generar reportes HTML:

```bash
# Backend
cd backend && npm run test:coverage
# Ver reporte en: coverage/index.html

# Frontend
cd frontend && npm run test:coverage
# Ver reporte en: coverage/index.html
```

---

## 🐛 Troubleshooting

### Error: Cannot find module
```bash
# Reinstalar dependencias
npm install
```

### Tests muy lentos
```bash
# Aumentar timeout en jest.config.js
testTimeout: 15000
```

### Error de conexión a BD
```bash
# Verificar que PostgreSQL está corriendo
# Los tests usan la misma DB que development
```

---

## ✅ Checklist Pre-Deploy

- [ ] Todos los tests pasan
- [ ] Coverage > 70%
- [ ] No hay tests skipped (it.skip)
- [ ] No hay console.logs olvidados  
- [ ] Cleanup de datos de prueba funciona

---

**Última actualización**: 3 de diciembre de 2025  
**Mantenedor**: Equipo NoahPro
