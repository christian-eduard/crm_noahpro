const express = require('express');
const router = express.Router();
const {
    getProposalsByLead,
    createProposal,
    getProposalById,
    getProposalByToken,
    downloadProposalPDF,
    sendProposalByEmail,
    resendProposalEmail,
    acceptProposal,
    getAllProposals,
    deleteProposal
} = require('../controllers/proposalController');

// Admin routes
router.get('/', getAllProposals);
router.get('/lead/:leadId', getProposalsByLead);
router.post('/', createProposal);
router.get('/:id', getProposalById);

// Send proposal by email
router.post('/:id/send-email', sendProposalByEmail);

// Resend proposal email
router.post('/:id/resend-email', resendProposalEmail);

// Public routes
router.get('/public/:token', getProposalByToken);
router.get('/public/:token/download', downloadProposalPDF);
router.post('/:id/accept', acceptProposal);

// Delete proposal
router.delete('/:id', deleteProposal);

// Comment routes
const { getComments, addComment } = require('../controllers/commentController');
router.get('/:proposalId/comments', getComments);
router.post('/:proposalId/comments', addComment);

module.exports = router;
