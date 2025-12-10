const express = require('express');
const router = express.Router();
const {
    getTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask
} = require('../controllers/tasksController');

// Get all tasks
router.get('/', getTasks);

// Create task
router.post('/', createTask);

// Update task
router.put('/:id', updateTask);

// Toggle task completion
router.patch('/:id/toggle', toggleTask);

// Delete task
router.delete('/:id', deleteTask);

module.exports = router;
