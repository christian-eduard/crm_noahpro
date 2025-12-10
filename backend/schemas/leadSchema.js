const { z } = require('zod');

const createLeadSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'El nombre es obligatorio'),
        email: z.string().email('Email inválido'),
        phone: z.string().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional(),
        assigned_to: z.number().optional()
    })
});

module.exports = {
    createLeadSchema
};
