# Lead Hunter Dashboard - Arquitectura Modular

## ✅ Estado Actual (FUNCIONANDO)

### Componentes Principales
1. **LeadHunterDashboard.jsx** (640 líneas)
   - Componente principal
   - Gestión de estado y lógica de negocio
   - Búsqueda de prospectos
   - Integración con API

2. **ProspectCard.jsx** (180 líneas)
   - Tarjeta individual de prospecto
   - Badges de prioridad, RRSS, análisis IA
   - Acciones rápidas
   - Preview de análisis

3. **ProspectDetailModal.jsx** (400 líneas)
   - Modal de detalle del prospecto
   - Tabs: Resumen, Análisis IA, Galería, Reseñas, Instagram, Facebook
   - Header con gradiente naranja/rojo
   - Iconos de RRSS detectadas

### Funcionalidades Implementadas
- ✅ Búsqueda de prospectos con IA
- ✅ Análisis de prospectos
- ✅ Búsqueda profunda (deep analyze)
- ✅ Conversión a leads
- ✅ Historial de búsquedas
- ✅ Estadísticas del dashboard
- ✅ Filtros de prospectos
- ✅ Detección automática de RRSS
- ✅ Modal de confirmación para reset
- ✅ Badges de prioridad en tarjetas
- ✅ Modal de detalle con tabs

### Helper Functions
```javascript
getSocialUrl(urlOrObj) // Extrae URL de string u objeto
isSocialMediaUrl(url) // Detecta si es red social
getDetectedSocialMedia(prospect) // Detecta RRSS desde website o social_media
  // Returns: { instagram, facebook, hasRealWeb }
getPriorityColor(priority) // Color según prioridad
```

## 📋 Pendientes para Futuras Sesiones

### 1. Tab Actividad (Priority: HIGH)
- [ ] Implementar timeline de notas
- [ ] Iconos IA bonitos
- [ ] Notas manuales vs IA
- [ ] Botón actualizar funcional

### 2. Tab Galería (Priority: MEDIUM)
- [ ] Marcar imágenes top
- [ ] Texto explicativo
- [ ] Búsqueda de más fotos funcional
- [ ] Grid mejorado

### 3. Tab Notas + CRM (Priority: HIGH)
- [ ] Diseño completo
- [ ] Funcionalidades de CRM
- [ ] Integración con leads
- [ ] Templates

### 4. Tab Demos (Priority: MEDIUM)
- [ ] Botón borrar demos funcional
- [ ] Modal de confirmación para borrar
- [ ] Generación de demos
- [ ] Vista previa

### 5. Columna "Inteligencia de Cierre" (Priority: HIGH)
- [ ] Solo mostrar en tab Resumen
- [ ] Badges de oportunidad y producto fit
- [ ] Botón ver análisis completo funcional
- [ ] Mapas mentales

### 6. Búsqueda Profunda (Priority: HIGH)
- [ ] Generar tabs de RRSS cuando detecta
- [ ] Actualizar prospect en tiempo real
- [ ] Mostrar progreso
- [ ] Integrar datos detectados

### 7. Historial de Búsquedas (Priority: MEDIUM)
- [ ] Funcionalidad completa
- [ ] Borrar búsquedas
- [ ] Renombrar búsquedas
- [ ] Filtros

### 8. Tarjetas de Prospectos (Priority: LOW)
- [ ] Iconos siempre visibles (no hover)
- [ ] Más acciones: email, whatsapp
- [ ] Drag & drop para organizar
- [ ] Vistas: Grid / List

## 🏗️ Estructura de Archivos

```
frontend/src/components/hunter/
├── LeadHunterDashboard.jsx      # Componente principal
├── ProspectCard.jsx              # Tarjeta de prospecto
├── ProspectDetailModal.jsx       # Modal de detalle
├── LeadHunterMap.jsx             # Mapa (ya existe)
├── PublicDemoViewer.jsx         # Viewer de demos
├── SearchGroupList.jsx           # Lista de grupos
└── TeamDashboard.jsx             # Dashboard de equipo
```

## 🔧 Cómo Añadir Nuevas Features

### Ejemplo: Añadir un nuevo tab al modal

1. **Definir el tab en ProspectDetailModal.jsx:**
```javascript
const tabs = [
    // ... tabs existentes
    { id: 'nuevo', label: 'Nuevo Tab', icon: MiIcono }
];
```

2. **Añadir el contenido del tab:**
```javascript
{activeTab === 'nuevo' && (
    <div className="space-y-4 animate-fadeIn">
        {/* Tu contenido aquí */}
    </div>
)}
```

### Ejemplo: Añadir nueva función API

1. **En LeadHunterDashboard.jsx:**
```javascript
const handleNuevaFuncion = async (prospectId) => {
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/hunter/nueva-funcion/${prospectId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            toast.success('Éxito');
            // Actualizar estado
        }
    } catch (error) {
        toast.error('Error');
    } finally {
        setLoading(false);
    }
};
```

2. **Pasar a componente hijo:**
```jsx
<ProspectDetailModal
    onNuevaFuncion={handleNuevaFuncion}
    // ... otros props
/>
```

## 🚨 Precauciones

1. **No editar archivos directamente sin backup**
2. **Probar cada cambio antes de seguir**
3. **Mantener componentes pequeños (<500 líneas)**
4. **Usar nombres descriptivos**
5. **Documentar funciones complejas**

## 📝 Notas Importantes

- El archivo original tenía ~3000 líneas y causaba errores
- Ahora está dividido en 3 archivos más manejables
- Todas las funciones principales están restauradas
- La compilación funciona correctamente
- El modal usa hideTitle={true} para ocultar el título predeterminado
- Los tabs dinámicos de Instagram/Facebook se generan automáticamente

## 🎯 Próximos Pasos Recomendados

1. Implementar tab Actividad con timeline
2. Añadir columna "Inteligencia de Cierre" solo en Resumen
3. Mejorar búsqueda profunda para que actualice tabs
4. Implementar borrado de demos con confirmación
5. Restaurar funcionalidad completa de historial de búsquedas
