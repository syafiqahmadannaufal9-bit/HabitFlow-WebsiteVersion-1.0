const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

// Optional: some UX endpoints don't need auth, but we pass user_id if available.
// For now, let's keep it simple and allow anonymous tracking (user_id can be null).

// START SESSION
router.post('/sessions', async (req, res) => {
    try {
        const { user_id, device_type, browser, screen_resolution } = req.body;
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO ux_sessions (id, user_id, device_type, browser, screen_resolution) VALUES (?, ?, ?, ?, ?)',
            [id, user_id || null, device_type, browser, screen_resolution]
        );
        
        res.json({ session_id: id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// END SESSION (Update)
router.put('/sessions/:id', async (req, res) => {
    try {
        const { pages_visited, total_duration } = req.body;
        await pool.query(
            'UPDATE ux_sessions SET ended_at = NOW(), pages_visited = ?, total_duration = ? WHERE id = ?',
            [pages_visited, total_duration, req.params.id]
        );
        res.json({ message: 'Session updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// LOG METRICS
router.post('/metrics', async (req, res) => {
    try {
        const { metrics } = req.body; // Array of metric objects
        if (!metrics || !metrics.length) return res.json({ message: 'No metrics' });

        const values = metrics.map(m => [
            m.user_id || null, 
            m.metric_type, 
            m.metric_value, 
            m.page_name, 
            m.session_id, 
            m.device_info
        ]);

        await pool.query(
            'INSERT INTO ux_metrics (user_id, metric_type, metric_value, page_name, session_id, device_info) VALUES ?',
            [values]
        );
        
        res.json({ message: 'Metrics logged' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
