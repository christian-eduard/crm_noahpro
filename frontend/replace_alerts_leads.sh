#!/bin/bash

# Script para reemplazar alerts por toast en LeadsDashboard.jsx

FILE="/Users/cex/Desktop/Crm App Tpv/frontend/src/components/admin/LeadsDashboard.jsx"

# Backup
cp "$FILE" "$FILE.backup"

# 1. Agregar import useToast
sed -i '' '1s/^/import { useToast } from '\''..\/..\/contexts\/ToastContext'\'';\n/' "$FILE"

# 2. Agregar const toast en el componente (después de const [templates...)
sed -i '' '/const \[templates, setTemplates\] = useState/a\
    const toast = useToast();
' "$FILE"

# 3. Reemplazar alerts específicos
sed -i '' "s/alert('Error al enviar comentario');/toast.error('Error al enviar comentario');/g" "$FILE"
sed -i '' "s/alert('Error al actualizar el estado');/toast.error('Error al actualizar el estado');/g" "$FILE"
sed -i '' "s/alert('Lead creado correctamente');/toast.success('Lead creado correctamente');/g" "$FILE"
sed -i '' "s/alert('Error al crear el lead');/toast.error('Error al crear el lead');/g" "$FILE"
sed -i '' "s/alert('Propuesta creada correctamente');/toast.success('Propuesta creada correctamente');/g" "$FILE"
sed -i '' "s/alert('Error al crear la propuesta');/toast.error('Error al crear la propuesta');/g" "$FILE"

echo "Reemplazo completado en LeadsDashboard.jsx"
