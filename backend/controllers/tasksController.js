const db = require('../config/database');

// Get all tasks
const getTasks = async (req, res) => {
    try {
        const { completed } = req.query;
        let query = 'SELECT * FROM tasks';
        const params = [];

        if (completed !== undefined) {
            query += ' WHERE completed = $1';
            params.push(completed === 'true');
        }

        query += ' ORDER BY due_date ASC NULLS LAST, created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting tasks:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create task
const createTask = async (req, res) => {
    try {
        const { title, description, priority, due_date, assigned_to } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'El título es requerido' });
        }

        const result = await db.query(
            `INSERT INTO tasks (title, description, priority, due_date, assigned_to)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [title, description, priority || 'medium', due_date, assigned_to]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Update task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, due_date, assigned_to, completed } = req.body;

        const result = await db.query(
            `UPDATE tasks 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 priority = COALESCE($3, priority),
                 due_date = COALESCE($4, due_date),
                 assigned_to = COALESCE($5, assigned_to),
                 completed = COALESCE($6, completed),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [title, description, priority, due_date, assigned_to, completed, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Toggle task completion
const toggleTask = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `UPDATE tasks 
             SET completed = NOT completed,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error toggling task:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Delete task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask
};
