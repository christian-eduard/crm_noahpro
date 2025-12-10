const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/calendarController');

// Get all events
router.get('/events', getEvents);

// Get single event
router.get('/events/:id', getEvent);

// Create event
router.post('/events', createEvent);

// Update event
router.put('/events/:id', updateEvent);

// Delete event
router.delete('/events/:id', deleteEvent);

module.exports = router;
