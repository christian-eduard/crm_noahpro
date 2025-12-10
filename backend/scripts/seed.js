const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🌱 Iniciando seeding de la base de datos...\n');

        // 1. Crear usuarios de prueba
        console.log('👥 Creando usuarios...');
        const hashedPassword = await bcrypt.hash('demo123', 10);

        const users = [
            { username: 'admin', password_hash: await bcrypt.hash('admin123', 10), role: 'admin' },
            { username: 'carlos_vendedor', password_hash: hashedPassword, role: 'user' },
            { username: 'maria_comercial', password_hash: hashedPassword, role: 'user' },
            { username: 'juan_soporte', password_hash: hashedPassword, role: 'user' }
        ];

        for (const user of users) {
            await db.query(
                `INSERT INTO crm_users (username, password_hash, role) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (username) DO NOTHING`,
                [user.username, user.password_hash, user.role]
            );
        }
        console.log('✅ Usuarios creados\n');

        // 2. Crear tags
        console.log('🏷️  Creando tags...');
        const tags = [
            { name: 'VIP', color: '#FFD700' },
            { name: 'Urgente', color: '#FF4444' },
            { name: 'Restaurante', color: '#4CAF50' },
            { name: 'Hotel', color: '#2196F3' },
            { name: 'Retail', color: '#9C27B0' },
            { name: 'Franquicia', color: '#FF9800' },
            { name: 'Interesado Verifactu', color: '#00BCD4' },
            { name: 'Requiere Demo', color: '#E91E63' }
        ];

        const tagIds = [];
        for (const tag of tags) {
            const result = await db.query(
                `INSERT INTO tags (name, color) 
                 VALUES ($1, $2) 
                 ON CONFLICT (name) DO UPDATE SET color = $2
                 RETURNING id`,
                [tag.name, tag.color]
            );
            tagIds.push(result.rows[0].id);
        }
        console.log('✅ Tags creados\n');

        // 3. Crear leads de prueba
        console.log('📋 Creando leads...');
        const leads = [
            {
                name: 'Ana García',
                email: 'ana.garcia@restauranteeljardin.com',
                phone: '+34 611 234 567',
                business_name: 'Restaurante El Jardín',
                message: 'Necesito un TPV para mi restaurante. Tengo 3 mesas y quiero integrar con cocina.',
                source: 'landing_form',
                status: 'new',
                tags: [0, 2, 7] // VIP, Restaurante, Requiere Demo
            },
            {
                name: 'Pedro Martínez',
                email: 'pedro@hotelplaya.es',
                phone: '+34 622 345 678',
                business_name: 'Hotel Playa Azul',
                message: 'Buscamos TPV para nuestro hotel de 50 habitaciones con restaurante incluido.',
                source: 'google_ads',
                status: 'contacted',
                tags: [0, 3] // VIP, Hotel
            },
            {
                name: 'Laura Sánchez',
                email: 'laura@modaurbana.com',
                phone: '+34 633 456 789',
                business_name: 'Moda Urbana',
                message: 'Tienda de ropa con 2 locales. Necesito control de inventario.',
                source: 'referral',
                status: 'qualified',
                tags: [4] // Retail
            },
            {
                name: 'Miguel Rodríguez',
                email: 'miguel@cafeteriacentral.com',
                phone: '+34 644 567 890',
                business_name: 'Cafetería Central',
                message: 'Cafetería pequeña, quiero empezar con TPV básico.',
                source: 'landing_form',
                status: 'proposal_sent',
                tags: [2, 6] // Restaurante, Interesado Verifactu
            },
            {
                name: 'Carmen López',
                email: 'carmen@franquiciaburger.com',
                phone: '+34 655 678 901',
                business_name: 'Burger Express (Franquicia)',
                message: 'Franquicia de hamburguesas, necesito 5 TPVs para diferentes locales.',
                source: 'email_campaign',
                status: 'won',
                tags: [0, 2, 5] // VIP, Restaurante, Franquicia
            },
            {
                name: 'Javier Fernández',
                email: 'javier@pizzerianapoli.com',
                phone: '+34 666 789 012',
                business_name: 'Pizzería Napoli',
                message: 'Interesado en TPV con delivery integrado.',
                source: 'landing_form',
                status: 'new',
                tags: [2, 7] // Restaurante, Requiere Demo
            },
            {
                name: 'Isabel Moreno',
                email: 'isabel@boutiqueelegance.com',
                phone: '+34 677 890 123',
                business_name: 'Boutique Elegance',
                message: 'Boutique de lujo, necesito TPV con programa de fidelización.',
                source: 'instagram',
                status: 'contacted',
                tags: [0, 4] // VIP, Retail
            },
            {
                name: 'Roberto Díaz',
                email: 'roberto@tapasbarcordoba.com',
                phone: '+34 688 901 234',
                business_name: 'Tapas Bar Córdoba',
                message: 'Bar de tapas tradicional, quiero modernizar el sistema.',
                source: 'landing_form',
                status: 'lost',
                tags: [2] // Restaurante
            },
            {
                name: 'Sofía Ruiz',
                email: 'sofia@supermercadolocal.com',
                phone: '+34 699 012 345',
                business_name: 'Supermercado Local',
                message: 'Supermercado de barrio, necesito 3 cajas registradoras.',
                source: 'referral',
                status: 'qualified',
                tags: [4, 6] // Retail, Interesado Verifactu
            },
            {
                name: 'Antonio Jiménez',
                email: 'antonio@panaderiasanantonio.com',
                phone: '+34 610 123 456',
                business_name: 'Panadería San Antonio',
                message: 'Panadería artesanal, quiero TPV simple y rápido.',
                source: 'landing_form',
                status: 'new',
                tags: [4, 1] // Retail, Urgente
            }
        ];

        const leadIds = [];
        for (const lead of leads) {
            // Verificar si ya existe
            const existing = await db.query('SELECT id FROM leads WHERE email = $1', [lead.email]);
            let leadId;

            if (existing.rows.length > 0) {
                leadId = existing.rows[0].id;
                console.log(`  ⏭️  Lead ${lead.name} ya existe, saltando...`);
            } else {
                const result = await db.query(
                    `INSERT INTO leads (name, email, phone, business_name, message, source, status, assigned_to) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                     RETURNING id`,
                    [lead.name, lead.email, lead.phone, lead.business_name, lead.message, lead.source, lead.status,
                    Math.floor(Math.random() * 3) + 1] // Asignar aleatoriamente a usuarios 1-3
                );
                leadId = result.rows[0].id;
            }
            leadIds.push(leadId);

            // Asociar tags
            for (const tagIndex of lead.tags) {
                await db.query(
                    `INSERT INTO lead_tags (lead_id, tag_id) 
                     VALUES ($1, $2) 
                     ON CONFLICT DO NOTHING`,
                    [leadId, tagIds[tagIndex]]
                );
            }
        }
        console.log('✅ Leads creados\n');

        // 4. Crear propuestas
        console.log('📄 Creando propuestas...');
        const proposals = [
            {
                leadIndex: 3, // Miguel - Cafetería Central
                title: 'Propuesta TPV Básico - Cafetería Central',
                description: 'Sistema TPV completo para cafetería con:\n- Terminal táctil 15"\n- Impresora tickets\n- Software con gestión de mesas\n- Soporte técnico 24/7\n- Formación incluida',
                total_price: 1200,
                status: 'sent'
            },
            {
                leadIndex: 4, // Carmen - Franquicia
                title: 'Propuesta Multi-Local - Burger Express',
                description: 'Solución completa para 5 locales:\n- 5 Terminales TPV\n- Sistema centralizado de gestión\n- Integración con delivery\n- Reporting en tiempo real\n- Soporte premium',
                total_price: 8500,
                status: 'accepted'
            },
            {
                leadIndex: 1, // Pedro - Hotel
                title: 'Propuesta TPV Hotelero - Hotel Playa Azul',
                description: 'Sistema integrado hotel + restaurante:\n- TPV para restaurante\n- Integración con PMS hotelero\n- Control de consumos por habitación\n- Facturación automática',
                total_price: 4500,
                status: 'sent'
            }
        ];

        for (const proposal of proposals) {
            const leadId = leadIds[proposal.leadIndex];
            const result = await db.query(
                `INSERT INTO proposals (lead_id, title, description, total_price, status, token) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id`,
                [leadId, proposal.title, proposal.description, proposal.total_price, proposal.status,
                    `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`]
            );

            // Si está aceptada, actualizar el lead
            if (proposal.status === 'accepted') {
                await db.query(
                    `UPDATE proposals SET accepted_at = NOW() WHERE id = $1`,
                    [result.rows[0].id]
                );
            }
        }
        console.log('✅ Propuestas creadas\n');

        // 5. Crear reuniones
        console.log('📅 Creando reuniones...');
        const meetings = [
            {
                leadIndex: 0, // Ana García
                title: 'Demo TPV - Restaurante El Jardín',
                description: 'Demostración del sistema TPV y resolución de dudas',
                scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
                duration_minutes: 45,
                status: 'scheduled'
            },
            {
                leadIndex: 5, // Javier - Pizzería
                title: 'Consultoría Delivery - Pizzería Napoli',
                description: 'Explicar integración con plataformas de delivery',
                scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // En 5 días
                duration_minutes: 30,
                status: 'scheduled'
            },
            {
                leadIndex: 4, // Carmen - Completada
                title: 'Firma de contrato - Burger Express',
                description: 'Reunión para firma de contrato y detalles de instalación',
                scheduled_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
                duration_minutes: 60,
                status: 'completed'
            }
        ];

        for (const meeting of meetings) {
            await db.query(
                `INSERT INTO meetings (lead_id, title, description, scheduled_date, duration_minutes, status) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [leadIds[meeting.leadIndex], meeting.title, meeting.description,
                meeting.scheduled_date, meeting.duration_minutes, meeting.status]
            );
        }
        console.log('✅ Reuniones creadas\n');

        // 6. Crear actividades
        console.log('📝 Creando actividades...');
        const activities = [
            { leadIndex: 0, type: 'email', description: 'Email de bienvenida enviado' },
            { leadIndex: 0, type: 'call', description: 'Llamada inicial - Muy interesada' },
            { leadIndex: 1, type: 'email', description: 'Propuesta enviada por email' },
            { leadIndex: 1, type: 'call', description: 'Seguimiento telefónico - Pendiente de decisión' },
            { leadIndex: 4, type: 'meeting', description: 'Reunión presencial - Contrato firmado' },
            { leadIndex: 4, type: 'note', description: 'Cliente muy satisfecho, posible expansión futura' },
            { leadIndex: 3, type: 'email', description: 'Propuesta enviada' },
            { leadIndex: 6, type: 'call', description: 'Primera llamada - Solicita más información' }
        ];

        for (const activity of activities) {
            await db.query(
                `INSERT INTO activities (lead_id, type, description) 
                 VALUES ($1, $2, $3)`,
                [leadIds[activity.leadIndex], activity.type, activity.description]
            );
        }
        console.log('✅ Actividades creadas\n');

        console.log('🎉 ¡Seeding completado exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   - ${users.length} usuarios`);
        console.log(`   - ${tags.length} tags`);
        console.log(`   - ${leads.length} leads`);
        console.log(`   - ${proposals.length} propuestas`);
        console.log(`   - ${meetings.length} reuniones`);
        console.log(`   - ${activities.length} actividades\n`);

        console.log('🔑 Credenciales de acceso:');
        console.log('   Admin: admin / admin123');
        console.log('   Demo:  carlos_vendedor / demo123\n');

    } catch (error) {
        console.error('❌ Error durante el seeding:', error);
        throw error;
    } finally {
        await db.pool.end();
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = seedDatabase;
