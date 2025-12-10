const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NoahPro CRM API',
            version: '1.0.0',
            description: 'API completa para el sistema CRM de NoahPro. Gestión de leads, propuestas, chat, notificaciones y más.',
            contact: {
                name: 'NoahPro',
                email: 'desarrollo@noahpro.com'
            },
            license: {
                name: 'Privado',
                url: 'https://noahpro.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Servidor de desarrollo'
            },
            {
                url: 'https://api.noahpro.com',
                description: 'Servidor de producción'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Lead: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único del lead'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre completo del lead'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email del lead'
                        },
                        phone: {
                            type: 'string',
                            description: 'Teléfono de contacto'
                        },
                        business_name: {
                            type: 'string',
                            description: 'Nombre del negocio'
                        },
                        message: {
                            type: 'string',
                            description: 'Mensaje inicial del lead'
                        },
                        status: {
                            type: 'string',
                            enum: ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'],
                            description: 'Estado del lead en el pipeline'
                        },
                        source: {
                            type: 'string',
                            description: 'Origen del lead (landing_form, manual, etc.)'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de creación'
                        }
                    }
                },
                Proposal: {
                    type: 'object',
                    required: ['lead_id', 'title', 'total_price'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único de la propuesta'
                        },
                        lead_id: {
                            type: 'integer',
                            description: 'ID del lead asociado'
                        },
                        title: {
                            type: 'string',
                            description: 'Título de la propuesta'
                        },
                        description: {
                            type: 'string',
                            description: 'Descripción detallada'
                        },
                        total_price: {
                            type: 'number',
                            format: 'float',
                            description: 'Precio total en euros'
                        },
                        token: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Token único para acceso público'
                        },
                        status: {
                            type: 'string',
                            enum: ['sent', 'viewed', 'accepted', 'rejected'],
                            description: 'Estado de la propuesta'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        viewed_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer'
                        },
                        user_id: {
                            type: 'integer'
                        },
                        type: {
                            type: 'string',
                            enum: ['new_lead', 'proposal_viewed', 'proposal_accepted', 'new_comment', 'chat_message']
                        },
                        title: {
                            type: 'string'
                        },
                        message: {
                            type: 'string'
                        },
                        link: {
                            type: 'string'
                        },
                        is_read: {
                            type: 'boolean'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                ProposalTemplate: {
                    type: 'object',
                    required: ['name', 'content_json'],
                    properties: {
                        id: {
                            type: 'integer'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre de la plantilla'
                        },
                        description: {
                            type: 'string'
                        },
                        content_json: {
                            type: 'object',
                            description: 'Contenido de la plantilla en formato JSON'
                        },
                        is_default: {
                            type: 'boolean'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Mensaje de error'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Leads',
                description: 'Gestión de leads y contactos'
            },
            {
                name: 'Proposals',
                description: 'Propuestas comerciales'
            },
            {
                name: 'Templates',
                description: 'Plantillas de propuestas'
            },
            {
                name: 'Notifications',
                description: 'Sistema de notificaciones'
            },
            {
                name: 'Chat',
                description: 'Chat en tiempo real'
            },
            {
                name: 'Analytics',
                description: 'Analíticas y métricas'
            },
            {
                name: 'Settings',
                description: 'Configuración del CRM'
            },
            {
                name: 'Export',
                description: 'Exportación de datos'
            }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
