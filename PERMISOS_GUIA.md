Permisos Granulares: Panel de Usuario

El panel de gestión de usuarios (UsersSettings.jsx) ahora incluye:

1. Nueva columna "Permisos" con 3 toggles visuales:
   - 📞 Llamadas (Verde cuando activo)
   - 🧠 Dojo (Morado cuando activo)
   - 📥 Exportar (Azul cuando activo)

2. Click directo en cada toggle actualiza inmediatamente el permiso

3. Endpoint utilizado: PATCH /api/users/:id/permissions

4. Estados visuales:
   - Activo: Badge de color + ☑
   - Inactivo: Badge gris + ☐

IMPLEMENTAR MANUALMENTE EN UsersSettings.jsx:
- Añadir columna "Permisos" en thead
- Añadir celda con 3 divs clickeables en tbody
- Cada div hace fetch a /api/users/:id/permissions con el permiso invertido
