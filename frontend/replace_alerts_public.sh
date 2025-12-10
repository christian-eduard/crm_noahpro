#!/bin/bash

# Script para reemplazar alerts por toast en PublicProposal.jsx

FILE="/Users/cex/Desktop/Crm App Tpv/frontend/src/components/public/PublicProposal.jsx"

# Backup
cp "$FILE" "$FILE.backup"

# 1. Agregar import useToast
sed -i '' '1s/^/import { useToast } from '\''..\/..\/contexts\/ToastContext'\'';\n/' "$FILE"

# 2. Agregar const toast en el componente (después de const [accepted...)
sed -i '' '/const \[accepted, setAccepted\] = useState/a\
    const toast = useToast();
' "$FILE"

# 3. Reemplazar todos los alerts
sed -i '' "s/alert('Error al enviar el comentario');/toast.error('Error al enviar el comentario');/g" "$FILE"
sed -i '' "s/alert('¡Propuesta aceptada! Te hemos enviado un email de confirmación. Nuestro equipo te contactará pronto.');/toast.success('¡Propuesta aceptada! Te hemos enviado un email de confirmación. Nuestro equipo te contactará pronto.');/g" "$FILE"
sed -i '' 's/alert(`Error al aceptar la propuesta: ${error.error || '\''Error desconocido'\''}`);/toast.error(`Error al aceptar la propuesta: ${error.error || '\''Error desconocido'\''}`);/g' "$FILE"
sed -i '' "s/alert('Error de conexión. Por favor intenta de nuevo más tarde.');/toast.error('Error de conexión. Por favor intenta de nuevo más tarde.');/g" "$FILE"
sed -i '' "s/alert('¡Reunión agendada! Te hemos enviado los detalles por email.');/toast.success('¡Reunión agendada! Te hemos enviado los detalles por email.');/g" "$FILE"
sed -i '' "s/alert('Error al agendar. Inténtalo de nuevo.');/toast.error('Error al agendar. Inténtalo de nuevo.');/g" "$FILE"
sed -i '' "s/alert('Error de conexión');/toast.error('Error de conexión');/g" "$FILE"

echo "Reemplazo completado en PublicProposal.jsx"
