const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateProposalPDF = async (proposal, lead) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `propuesta_${proposal.id}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header with gradient effect
            doc.rect(0, 0, doc.page.width, 150).fill('#667eea');

            // Company logo/name
            doc.fillColor('#ffffff')
                .fontSize(32)
                .font('Helvetica-Bold')
                .text('NOAHPRO TPV', 50, 40);

            doc.fontSize(12)
                .font('Helvetica')
                .text('Soluciones de Digitalización para Hostelería', 50, 80);

            // Proposal title
            doc.moveDown(4)
                .fillColor('#2d3748')
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('PROPUESTA COMERCIAL', { align: 'center' });

            doc.moveDown(1);

            // Client info box
            doc.rect(50, doc.y, doc.page.width - 100, 100)
                .fillAndStroke('#f7fafc', '#e2e8f0');

            const clientBoxY = doc.y + 15;
            doc.fillColor('#4a5568')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('CLIENTE:', 70, clientBoxY);

            doc.font('Helvetica')
                .text(lead.name, 70, clientBoxY + 20)
                .text(lead.business_name || 'N/A', 70, clientBoxY + 35)
                .text(lead.email, 70, clientBoxY + 50)
                .text(lead.phone || 'N/A', 70, clientBoxY + 65);

            doc.moveDown(6);

            // Proposal details
            doc.fillColor('#2d3748')
                .fontSize(18)
                .font('Helvetica-Bold')
                .text(proposal.title, { align: 'left' });

            doc.moveDown(1)
                .fillColor('#4a5568')
                .fontSize(12)
                .font('Helvetica')
                .text(proposal.description || 'Propuesta personalizada para su negocio.', {
                    align: 'justify',
                    width: doc.page.width - 100
                });

            doc.moveDown(2);

            // Price section
            doc.rect(50, doc.y, doc.page.width - 100, 80)
                .fillAndStroke('#667eea', '#667eea');

            const priceY = doc.y + 20;
            doc.fillColor('#ffffff')
                .fontSize(14)
                .font('Helvetica')
                .text('INVERSIÓN TOTAL', 70, priceY);

            doc.fontSize(32)
                .font('Helvetica-Bold')
                .text(
                    parseFloat(proposal.total_price).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                    }),
                    70,
                    priceY + 25
                );

            doc.moveDown(6);

            // Terms and conditions
            doc.fillColor('#718096')
                .fontSize(9)
                .font('Helvetica')
                .text('Condiciones:', { underline: true });

            doc.moveDown(0.5)
                .text('• Validez de la oferta: 30 días desde la fecha de emisión', { indent: 10 })
                .text('• Forma de pago: Según acuerdo comercial', { indent: 10 })
                .text('• Garantía: 12 meses sobre el software', { indent: 10 })
                .text('• Soporte técnico incluido durante el primer año', { indent: 10 });

            // Footer
            const footerY = doc.page.height - 100;
            doc.fontSize(8)
                .fillColor('#a0aec0')
                .text(
                    `Propuesta generada el ${new Date().toLocaleDateString('es-ES')} | NoahPro © ${new Date().getFullYear()}`,
                    50,
                    footerY,
                    { align: 'center', width: doc.page.width - 100 }
                );

            doc.end();

            stream.on('finish', () => {
                resolve({ filePath, fileName });
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });
};

const generateBusinessCard = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [241, 153], // Tamaño tarjeta de visita estándar (85mm x 54mm aprox en puntos)
                margin: 0
            });

            const fileName = `tarjeta_${data.commercialCode}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../temp', fileName);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // --- CARA DELANTERA ---
            // Fondo corporativo
            doc.rect(0, 0, 241, 153).fill('#1a202c'); // Dark background

            // Logo / Nombre Empresa
            doc.fillColor('#ffffff')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('NOAHPRO', 20, 60);

            doc.fontSize(8)
                .font('Helvetica')
                .text('SOLUCIONES TPV', 20, 80);

            // --- CARA TRASERA ---
            doc.addPage({ size: [241, 153], margin: 0 });

            // Fondo blanco
            doc.rect(0, 0, 241, 153).fill('#ffffff');

            // QR Code
            if (data.qrPath && fs.existsSync(data.qrPath)) {
                doc.image(data.qrPath, 20, 20, { width: 60, height: 60 });
            }

            // Código Comercial
            doc.fillColor('#000000')
                .fontSize(6)
                .font('Helvetica')
                .text(data.commercialCode, 20, 85);

            // Datos Personales
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text(data.full_name, 100, 30);

            doc.fontSize(7)
                .font('Helvetica')
                .fillColor('#4a5568')
                .text('Asesor Comercial', 100, 42);

            doc.moveDown(1);
            doc.fontSize(7)
                .fillColor('#2d3748')
                .text(data.email, 100, 60)
                .text(data.phone || '', 100, 72)
                .text('www.noahpro.com', 100, 84);

            doc.end();

            stream.on('finish', () => {
                resolve({ filePath, fileName });
            });

            stream.on('error', reject);

        } catch (error) {
            reject(error);
        }
    });

};

module.exports = { generateProposalPDF, generateBusinessCard };
