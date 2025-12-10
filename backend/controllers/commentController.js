const db = require('../config/database');

// Get comments for a proposal
const getComments = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const result = await db.query(
            'SELECT * FROM proposal_comments WHERE proposal_id = $1 ORDER BY created_at ASC',
            [proposalId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting comments:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Add a comment
const addComment = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const { author, authorType, comment } = req.body;

        if (!comment) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const result = await db.query(
            `INSERT INTO proposal_comments (proposal_id, author, author_type, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [proposalId, author, authorType, comment]
        );

        // Update proposal status if client commented
        if (authorType === 'client') {
            await db.query(
                `UPDATE proposals SET status = 'commented' WHERE id = $1 AND status != 'accepted'`,
                [proposalId]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getComments,
    addComment
};
