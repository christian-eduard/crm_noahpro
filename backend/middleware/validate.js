const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                details: Array.isArray(err.errors) ? err.errors.map(e => ({
                    path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
                    message: e.message || 'Validation error'
                })) : []
            });
        }
        next(err);
    }
};

module.exports = validate;
