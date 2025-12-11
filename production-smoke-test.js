// Usando fetch nativo de Node.js


const BASE_URL = 'https://noahpro.es/api';
const ADMIN_EMAIL = 'admin@noahpro.es'; // Usuario para login
const ADMIN_PASSWORD = 'Zeta10zeta@';

async function runSmokeTest() {
    console.log('🚀 Iniciando Smoke Test en Producción: ' + BASE_URL);
    let token = '';
    let userId = '';

    try {
        // 1. Health Check
        console.log('\nTesting Health Check...');
        const health = await fetch('https://noahpro.es/health'); // Asumiendo ruta health raíz o api
        // Si no existe, probamos un endpoint público
        const publicSettings = await fetch(`${BASE_URL}/settings/public`);
        if (publicSettings.ok) {
            console.log('✅ Public API accesible');
            const settings = await publicSettings.json();
            console.log('   - Pusher configured:', !!settings.pusher_key);
        } else {
            console.error('❌ Fallo en Public Settings:', publicSettings.status);
        }

        // 2. Auth Login (Admin)
        console.log('\nTesting Auth Login (Admin)...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'chris@noahpro.es', password: ADMIN_PASSWORD }) // Usando chris@noahpro.es que es el admin real
        });

        if (!loginRes.ok) {
            // Intentar con username 'admin' si el email falla
            const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
            });

            if (!loginRes2.ok) {
                const text = await loginRes.text();
                throw new Error(`Login fallido: ${loginRes.status} ${text}`);
            }
            const data = await loginRes2.json();
            token = data.token;
            userId = data.user.id;
            console.log('✅ Login exitoso (username)');
        } else {
            const data = await loginRes.json();
            token = data.token;
            userId = data.user.id;
            console.log('✅ Login exitoso (email)');
        }

        // 3. Obtener Perfil (Test de DB columns usuarios)
        console.log('\nTesting Get Profile...');
        const profileRes = await fetch(`${BASE_URL}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.ok) {
            const profile = await profileRes.json();
            console.log('✅ Perfil obtenido correctamente');
            console.log('   - Full Name:', profile.full_name);
            console.log('   - Avatar URL:', profile.avatar_url);

            // Verificar si el avatar es accesible (si existe)
            if (profile.avatar_url) {
                const avatarCheck = await fetch(profile.avatar_url);
                if (avatarCheck.ok) {
                    console.log('✅ Imagen de Avatar accesible');
                } else {
                    console.error('❌ Imagen de Avatar NO accesible:', avatarCheck.status);
                    if (avatarCheck.status === 403) console.error('   -> Error de permisos (403)');
                }
            }
        } else {
            console.error('❌ Error al obtener perfil:', profileRes.status);
        }

        // 4. Listar Comerciales (Test de DB columns comerciales/users)
        console.log('\nTesting List Commercials...');
        const commRes = await fetch(`${BASE_URL}/commercials`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (commRes.ok) {
            const commercials = await commRes.json();
            console.log(`✅ Comerciales listados: ${commercials.length}`);
        } else {
            console.error('❌ Error al listar comerciales:', commRes.status);
        }

        // 5. Verificar Settings (SMTP)
        console.log('\nTesting Settings...');
        const settingsRes = await fetch(`${BASE_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            console.log('✅ Configuración obtenida');
            console.log('   - SMTP Host:', settings.smtp_host);
            console.log('   - Company:', settings.company_name);
        } else {
            console.error('❌ Error obteniendo settings:', settingsRes.status);
        }

        console.log('\n🏁 Smoke Test Completado');

    } catch (error) {
        console.error('\n⛔ CRITICAL FAILURE:', error.message);
    }
}

runSmokeTest();
