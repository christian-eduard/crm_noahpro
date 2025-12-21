
#!/bin/bash
DOMAINS=(
"atrevetex.cloud"
"atrevetex.com"
"atrevetex.es"
"atrevetex.xyz"
"centroreduce.com"
"crm.gratech.es"
"crm.paquidelacruz.com"
"ecoalf.pronexus.es"
"gooog.es"
"gratech.es"
"inversores.pronexus.es"
"limpiezaprofesional.info"
"llc.pronexus.es"
"paquidelacruz.com"
"pronexus.es"
"pronexuscrm.es"
"pruebas.sixsaapp.es"
"servidor.pronexus.es"
"stormsboys.com"
"stormsboys.info"
"stormsboys.store"
)

for domain in "${DOMAINS[@]}"; do
    TARGET="/var/www/vhosts/system/$domain/conf/nginx.conf"
    LINK="/etc/nginx/plesk.conf.d/vhosts/$domain.conf"

    if [ -f "$TARGET" ]; then
        if [ ! -L "$LINK" ]; then
            echo "Linking $domain..."
            ln -s "$TARGET" "$LINK"
        else
            echo "$domain already linked."
        fi
    else
        echo "WARNING: Config for $domain not found at $TARGET"
    fi
done

echo "Reloading Nginx..."
service nginx reload
echo "Done."
