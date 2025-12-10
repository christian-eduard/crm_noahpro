const fs = require('fs');
const path = require('path');

// Get all email templates
const getEmailTemplates = async (req, res) => {
    try {
        const templatesDir = path.join(__dirname, '../templates');
        const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.html'));

        const templates = files.map(filename => {
            const content = fs.readFileSync(path.join(templatesDir, filename), 'utf8');
            const name = filename.replace('.html', '');

            return {
                id: name,
                name: name.charAt(0).toUpperCase() + name.slice(1),
                filename,
                content,
                updated_at: fs.statSync(path.join(templatesDir, filename)).mtime
            };
        });

        res.json(templates);
    } catch (error) {
        console.error('Error getting email templates:', error);
        res.status(500).json({ error: 'Error al obtener plantillas' });
    }
};

// Update email template
const updateEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const templatesDir = path.join(__dirname, '../templates');
        const filename = `${id}.html`;
        const filePath = path.join(templatesDir, filename);

        // Check if template exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Write updated content
        fs.writeFileSync(filePath, content, 'utf8');

        res.json({ message: 'Template updated successfully', id });
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ error: 'Error al actualizar plantilla' });
    }
};

module.exports = {
    getEmailTemplates,
    updateEmailTemplate
};
