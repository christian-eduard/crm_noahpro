const express = require('express');
const router = express.Router();
const { getMeetings, scheduleMeeting } = require('../controllers/meetingController');

router.get('/', getMeetings);
router.post('/', scheduleMeeting);

module.exports = router;
