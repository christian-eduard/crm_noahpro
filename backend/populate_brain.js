
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde el archivo .env del backend
dotenv.config({ path: path.join(__dirname, '.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/crm_noahpro'
});

const KNOWLEDGE_UNITS = [
    {
        title: 'Obligatoriedad Verifactu 2025',
        content: 'A partir de 2025, todos los negocios en España deben usar sistemas que cumplan con el reglamento VeriFactu. No cumplir conlleva multas de hasta 50.000€ por el simple hecho de tener software no certificado. NoahPro está 100% certificado y automatiza el envío de facturas a la AEAT.',
        category: 'legal_info',
        tags: ['verifactu', 'aeat', 'legal', 'multas']
    },
    {
        title: 'Subvención Kit Digital',
        content: 'NoahPro es Agente Digitalizador Adherido. Los clientes pueden obtener hasta 3.000€ (segmento III) o 6.000€ (segmento II) de subvención a fondo perdido para digitalizar su negocio con nuestro TPV, ahorrándose el 100% del coste del software el primer año.',
        category: 'product_info',
        tags: ['kit_digital', 'subvencion', 'gratis']
    },
    {
        title: 'Objeción: "Ya tengo un TPV que funciona"',
        content: 'Respuesta: Muchos TPVs antiguos no van a poder actualizarse a Verifactu, lo que obligará a cambiarlos en pocos meses. NoahPro no solo cumple la ley, sino que te permite ver tus ventas en tiempo real desde el móvil y ahorrar un 15% en errores de comandas.',
        category: 'objection_handling',
        tags: ['objecion', 'competencia', 'valor']
    },
    {
        title: 'Caso de Éxito: Pizzería Roma',
        content: 'La Pizzería Roma redujo el tiempo de espera de sus clientes en 10 minutos por mesa gracias a las comandas digitales de NoahPro. Su ticket medio subió un 12% al facilitar que los camareros ofrezcan postres y bebidas desde la mesa.',
        category: 'success_story',
        tags: ['hosteleria', 'restaurante', 'eficiencia']
    },
    {
        title: 'Beneficio: Control de Stock en Retail',
        content: 'Para tiendas de ropa o retail, NoahPro ofrece control de stock multitienda y alertas de inventario bajo. Hemos ayudado a comercios a reducir su stock muerto en un 20% optimizando sus compras mediante nuestros informes de Analytics.',
        category: 'product_info',
        tags: ['retail', 'tienda', 'stock', 'inventario']
    },
    {
        title: 'Integración Delivery Automática',
        content: 'NoahPro se integra directamente con Glovo y Uber Eats. Los pedidos entran directos a cocina sin tener que picarlos a mano, eliminando errores humanos que suelen costar a los restaurantes unos 200€ al mes en devoluciones.',
        category: 'product_info',
        tags: ['delivery', 'glovo', 'ubereats', 'ahorro']
    },
    {
        title: 'Objeción: "Es muy caro"',
        content: 'Respuesta: NoahPro no es un gasto, es una inversión que se paga sola. Con solo ahorrar un error de ticket al día o evitar que un cliente se vaya por esperar demasiado, el sistema ya está amortizado. Además, con el Kit Digital el primer año es coste cero.',
        category: 'objection_handling',
        tags: ['objecion', 'precio', 'roi']
    },
    {
        title: 'Seguridad de Datos y Nube',
        content: 'A diferencia de los TPVs locales que si se rompe el disco duro pierdes todo, NoahPro guarda todo en la nube de forma encriptada. Accede a tu negocio desde cualquier lugar del mundo con total seguridad y cumplimiento de RGPD.',
        category: 'product_info',
        tags: ['nube', 'seguridad', 'tecnologia']
    }
];

const SETTINGS = {
    personality_tone: 'professional',
    name: 'Cerebro NoahPro Premium',
    system_instruction_prefix: 'Eres el Cerebro Estratégico de NoahPro. Tu misión es analizar negocios y proporcionar argumentos de venta IRREFUTABLES basados en tecnología, legalidad (Verifactu) y rentabilidad.',
    system_instruction_suffix: 'REGLAS DE ORO: 1. Siempre menciona la urgencia de Verifactu si el cliente no lo tiene. 2. Enfócate en el ROI (Retorno de Inversión). 3. Sé profesional pero empático con los dolores del pequeño empresario.',
    max_context_units: 6
};

async function populate() {
    try {
        await client.connect();
        console.log('Conectado a la base de datos...');

        // 1. Limpiar unidades de conocimiento existentes (opcional, mejor solo insertar nuevas)
        // await client.query('DELETE FROM ai_brain_knowledge');

        // 2. Insertar configuración
        await client.query(`
            UPDATE ai_brain_settings SET 
                personality_tone = $1, 
                name = $2,
                system_instruction_prefix = $3,
                system_instruction_suffix = $4,
                max_context_units = $5,
                updated_at = NOW()
            WHERE id = (SELECT id FROM ai_brain_settings LIMIT 1)
        `, [SETTINGS.personality_tone, SETTINGS.name, SETTINGS.system_instruction_prefix, SETTINGS.system_instruction_suffix, SETTINGS.max_context_units]);

        console.log('Configuración del cerebro actualizada.');

        // 3. Insertar unidades de conocimiento
        for (const unit of KNOWLEDGE_UNITS) {
            const exists = await client.query('SELECT id FROM ai_brain_knowledge WHERE title = $1', [unit.title]);
            if (exists.rows.length === 0) {
                await client.query(`
                    INSERT INTO ai_brain_knowledge (title, content, category, tags)
                    VALUES ($1, $2, $3, $4)
                `, [unit.title, unit.content, unit.category, unit.tags]);
                console.log(`Unidad añadida: ${unit.title}`);
            } else {
                console.log(`Unidad ya existe: ${unit.title}`);
            }
        }

        console.log('Población completada con éxito.');
    } catch (err) {
        console.error('Error poblando el cerebro:', err);
    } finally {
        await client.end();
    }
}

populate();
