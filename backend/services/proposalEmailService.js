const nodemailer = require('nodemailer');

// Configurar transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Enviar propuesta al cliente por email
 */
const sendProposalEmail = async (proposal, lead) => {
    const proposalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/proposal/${proposal.token}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        .proposal-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .price {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            margin: 15px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 20px 0;
        }
        .features {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .features li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">N</div>
        <div class="title">Nueva Propuesta Comercial</div>
        <div class="subtitle">NoahPro Tech Solutions</div>
    </div>
    
    <div class="content">
        <h2>Hola ${lead.name},</h2>
        <p>Nos complace presentarte nuestra propuesta personalizada para <strong>${lead.business_name || 'tu negocio'}</strong>.</p>
        
        <div class="proposal-card">
            <h3>${proposal.title}</h3>
            <p>${proposal.description.substring(0, 200)}${proposal.description.length > 200 ? '...' : ''}</p>
            
            <div class="price">
                ${parseFloat(proposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">Precio total (impuestos no incluidos)</p>
        </div>
        
        <div style="text-align: center;">
            <a href="${proposalUrl}" class="cta-button">
                Ver Propuesta Completa →
            </a>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-left: 4px solid #0284c7; border-radius: 6px;">
            <strong>💡 En la propuesta podrás:</strong>
            <ul class="features">
                <li>Ver todos los detalles y servicios incluidos</li>
                <li>Dejar comentarios y hacer preguntas</li>
                <li>Agendar una reunión con nosotros</li>
                <li>Aceptar la propuesta directamente</li>
            </ul>
        </div>
        
        <p style="margin-top: 25px;">Si tienes alguna duda, no dudes en contactarnos respondiendo a este email o a través del sistema de comentarios en la propuesta.</p>
        
        <p>¡Esperamos trabajar contigo muy pronto!</p>
        
        <p style="margin-top: 25px;">
            <strong>Equipo NoahPro</strong><br>
            <a href="mailto:contacto@noahpro.com" style="color: #2563eb;">contacto@noahpro.com</a>
        </p>
    </div>
    
    <div class="footer">
        <p>Esta propuesta es válida por 15 días desde la fecha de emisión.</p>
        <p>&copy; ${new Date().getFullYear()} NoahPro Tech Solutions. Todos los derechos reservados.</p>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"NoahPro CRM" <${process.env.SMTP_USER}>`,
        to: lead.email,
        subject: `Nueva Propuesta: ${proposal.title}`,
        html: htmlContent,
        text: `
Hola ${lead.name},

Te enviamos una nueva propuesta comercial: ${proposal.title}

Precio total: ${parseFloat(proposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}

Puedes ver todos los detalles, hacer comentarios y aceptar la propuesta en:
${proposalUrl}

¡Esperamos trabajar contigo!

Equipo NoahPro
contacto@noahpro.com
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Proposal email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending proposal email:', error);
        throw error;
    }
};

/**
 * Enviar confirmación de propuesta aceptada
 */
const sendProposalAcceptedEmail = async (proposal, lead) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .success-banner { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .celebration { font-size: 48px; margin-bottom: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="success-banner">
        <div class="celebration">🎉</div>
        <h1>¡Propuesta Aceptada!</h1>
        <p>Gracias por confiar en NoahPro</p>
    </div>
    
    <div class="content">
        <h2>Hola ${lead.name},</h2>
        <p>¡Excelentes noticias! Hemos recibido la aceptación de tu propuesta <strong>${proposal.title}</strong>.</p>
        
        <h3>📋 Próximos Pasos:</h3>
        <ol>
            <li>Nuestro equipo te contactará en las próximas 24 horas</li>
            <li>Coordinaremos los detalles de implementación</li>
            <li>Te enviaremos el contrato y documentación necesaria</li>
        </ol>
        
        <p>Estamos emocionados de comenzar este proyecto contigo.</p>
        
        <p>Saludos,<br><strong>Equipo NoahPro</strong></p>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"NoahPro CRM" <${process.env.SMTP_USER}>`,
        to: lead.email,
        subject: `✅ Propuesta Aceptada - ${proposal.title}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending acceptance email:', error);
    }
};

/**
 * Notificar al admin que se aceptó una propuesta
 */
const notifyAdminProposalAccepted = async (proposal, lead) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@noahpro.com';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 6px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; }
    </style>
</head>
<body>
    <h2>🎊 Nueva Propuesta Aceptada</h2>
    <div class="alert">
        <p><strong>Cliente:</strong> ${lead.name} (${lead.email})</p>
        <p><strong>Empresa:</strong> ${lead.business_name || 'N/A'}</p>
        <p><strong>Propuesta:</strong> ${proposal.title}</p>
        <div class="amount">${parseFloat(proposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
        <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/crm/dashboard" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver en CRM →
            </a>
        </p>
    </div>
</body>
</html>
    `;

    const mailOptions = {
        from: `"NoahPro CRM" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🎉 Propuesta Aceptada - ${lead.name}`,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
};

module.exports = {
    sendProposalEmail,
    sendProposalAcceptedEmail,
    notifyAdminProposalAccepted
};
