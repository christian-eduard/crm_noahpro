const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendProposalEmail } = require('../services/emailService');
const proposalEmailService = require('../services/proposalEmailService');

// Get proposals for a lead
const getProposalsByLead = async (req, res) => {
    try {
        const { leadId } = req.params;
        const result = await db.query(
            'SELECT * FROM proposals WHERE lead_id = $1 ORDER BY created_at DESC',
            [leadId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting proposals:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get all proposals (Admin)
const getAllProposals = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, l.name as lead_name, l.email as lead_email 
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             ORDER BY p.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting all proposals:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create proposal
const createProposal = async (req, res) => {
    try {
        const { leadId, title, description, items, totalPrice } = req.body;

        if (!leadId || !title) {
            return res.status(400).json({ error: 'Lead ID y título son requeridos' });
        }

        // Get lead details for email
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }
        const lead = leadResult.rows[0];

        // Generate unique token for public access
        const token = uuidv4();

        // Default content structure if not provided
        const contentJson = {
            items: items || [],
            notes: description || ''
        };

        const result = await db.query(
            `INSERT INTO proposals (lead_id, title, description, content_json, total_price, token, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, 'sent', 'system')
             RETURNING *`,
            [leadId, title, description, JSON.stringify(contentJson), totalPrice || 0, token]
        );

        const proposal = result.rows[0];

        // Update lead status to proposal_sent
        await db.query(
            `UPDATE leads SET status = 'proposal_sent' 
             WHERE id = $1`,
            [leadId]
        );

        // Send email
        const proposalUrl = `${process.env.FRONTEND_URL}/proposal/${token}`;
        await sendProposalEmail(lead, proposal, proposalUrl);

        res.status(201).json(proposal);
    } catch (error) {
        console.error('Error creating proposal:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get proposal by ID
const getProposalById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM proposals WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting proposal:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get proposal by Token (Public access)
const getProposalByToken = async (req, res) => {
    try {
        const { token } = req.params;

        // Update viewed_at if first view
        await db.query(
            `UPDATE proposals 
             SET viewed_at = COALESCE(viewed_at, CURRENT_TIMESTAMP),
                 status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END
             WHERE token = $1`,
            [token]
        );

        const result = await db.query(
            `SELECT p.*, l.name as lead_name, l.business_name 
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             WHERE p.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting public proposal:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Download proposal as PDF
const downloadProposalPDF = async (req, res) => {
    try {
        const { token } = req.params;
        const { generateProposalPDF } = require('../services/pdfService');

        const result = await db.query(
            `SELECT p.*, l.name, l.email, l.phone, l.business_name 
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             WHERE p.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        const proposal = result.rows[0];
        const lead = {
            name: proposal.name,
            email: proposal.email,
            phone: proposal.phone,
            business_name: proposal.business_name
        };

        const { filePath, fileName } = await generateProposalPDF(proposal, lead);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading PDF:', err);
            }
            // Clean up temp file
            const fs = require('fs');
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }, 5000);
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Error al generar PDF' });
    }
};

// Send proposal by email
const sendProposalByEmail = async (req, res) => {
    try {
        const { id } = req.params;

        // Get proposal
        const proposalResult = await db.query(
            `SELECT p.*, l.* 
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             WHERE p.id = $1`,
            [id]
        );

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        const proposal = proposalResult.rows[0];
        const lead = {
            name: proposal.name,
            email: proposal.email,
            business_name: proposal.business_name
        };

        // Send email
        await proposalEmailService.sendProposalEmail(proposal, lead);

        // Register activity
        await db.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [proposal.lead_id, 'email_sent', `Propuesta "${proposal.title}" enviada por email`, JSON.stringify({ proposalId: id })]
        );

        res.json({ message: 'Propuesta enviada por email exitosamente' });
    } catch (error) {
        console.error('Error sending proposal email:', error);
        res.status(500).json({ error: 'Error al enviar email' });
    }
};

// Accept proposal with digital signature
const acceptProposal = async (req, res) => {
    try {
        const { id } = req.params;
        const signatureData = req.body; // Datos de firma del modal

        // Get proposal and lead
        const result = await db.query(
            `SELECT p.*, l.name, l.email, l.business_name, l.id as lead_id
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        const proposal = result.rows[0];
        const lead = {
            id: proposal.lead_id,
            name: proposal.name,
            email: proposal.email,
            business_name: proposal.business_name
        };

        // Update proposal status and save signature data
        await db.query(
            `UPDATE proposals 
             SET status = 'accepted', 
                 accepted_at = CURRENT_TIMESTAMP,
                 signature_data = $2
             WHERE id = $1`,
            [id, JSON.stringify(signatureData)]
        );

        // Update lead status to won
        await db.query(
            `UPDATE leads 
             SET status = 'won' 
             WHERE id = $1`,
            [lead.id]
        );

        // Register activity
        await db.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [lead.id, 'proposal_accepted', `Propuesta "${proposal.title}" aceptada y firmada por ${signatureData.fullName || 'el cliente'}`, JSON.stringify({
                proposalId: id,
                acceptedAt: new Date(),
                signedBy: signatureData.fullName,
                company: signatureData.company
            })]
        );

        // Send confirmation emails
        try {
            await proposalEmailService.sendProposalAcceptedEmail(proposal, lead);
            await proposalEmailService.notifyAdminProposalAccepted(proposal, lead);
        } catch (emailError) {
            console.error('Error sending acceptance emails:', emailError);
            // No fallar la request si los emails fallan
        }

        // Auto-create invoice if enabled
        try {
            const autoInvoiceService = require('../services/autoInvoiceService');
            const invoice = await autoInvoiceService.createInvoiceFromProposal(proposal, lead);

            if (invoice) {
                console.log(`Auto-invoice ${invoice.invoice_number} created for proposal ${proposal.id}`);
            }
        } catch (autoInvoiceError) {
            console.error('Error creating auto-invoice:', autoInvoiceError);
            // No fallar la request si la factura falla
        }

        res.json({
            message: 'Propuesta aceptada exitosamente',
            proposal: {
                ...proposal,
                signature_data: signatureData
            }
        });
    } catch (error) {
        console.error('Error accepting proposal:', error);
        res.status(500).json({ error: 'Error al aceptar propuesta' });
    }
};

// Delete proposal
const deleteProposal = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if proposal exists
        const checkResult = await db.query('SELECT * FROM proposals WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        // Delete proposal (comments will be cascade deleted if FK is set up correctly)
        await db.query('DELETE FROM proposals WHERE id = $1', [id]);

        res.json({ message: 'Propuesta eliminada correctamente' });
    } catch (error) {
        console.error('Error deleting proposal:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Resend proposal email
const resendProposalEmail = async (req, res) => {
    try {
        const { id } = req.params;

        // Get proposal with lead details
        const proposalResult = await db.query(
            `SELECT p.*, l.name, l.email, l.business_name, l.id as lead_id
             FROM proposals p 
             JOIN leads l ON p.lead_id = l.id 
             WHERE p.id = $1`,
            [id]
        );

        if (proposalResult.rows.length === 0) {
            return res.status(404).json({ error: 'Propuesta no encontrada' });
        }

        const proposal = proposalResult.rows[0];
        const lead = {
            name: proposal.name,
            email: proposal.email,
            business_name: proposal.business_name
        };

        // Send email using emailService
        const proposalUrl = `${process.env.FRONTEND_URL}/proposal/${proposal.token}`;
        await sendProposalEmail(lead, proposal, proposalUrl);

        // Register activity
        await db.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [proposal.lead_id, 'email_sent', `Propuesta "${proposal.title}" reenviada por email`, JSON.stringify({ proposalId: id })]
        );

        res.json({ message: 'Propuesta reenviada por email exitosamente' });
    } catch (error) {
        console.error('Error resending proposal email:', error);
        res.status(500).json({ error: 'Error al reenviar email' });
    }
};

module.exports = {
    getAllProposals,
    getProposalsByLead,
    createProposal,
    getProposalById,
    getProposalByToken,
    downloadProposalPDF,
    sendProposalByEmail,
    resendProposalEmail,
    acceptProposal,
    deleteProposal
};
