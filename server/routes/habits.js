const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const auth = require('../middleware/auth');

// GET ALL HABITS
router.get('/', auth, async (req, res) => {
    try {
        const [habits] = await pool.query('SELECT * FROM user_habits WHERE user_id = ? ORDER BY created_at ASC', [req.user.id]);
        
        const [logs] = await pool.query('SELECT id, user_id, habit_id, DATE_FORMAT(log_date, "%Y-%m-%d") as log_date, completed, numeric_value, timer_elapsed, created_at, updated_at FROM habit_logs WHERE user_id = ?', [req.user.id]);
        
        res.json({ habits, logs });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// CREATE HABIT
router.post('/', auth, async (req, res) => {
    try {
        const { name, goals, description, category, icon_html, evaluation, unit } = req.body;
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO user_habits (id, user_id, name, goals, description, category, icon_html, evaluation, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, name ?? null, goals ?? null, description ?? null, category ?? null, icon_html ?? null, evaluation ?? null, unit ?? null]
        );
        
        res.json({ id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE HABIT
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, goals, description, category, icon_html, evaluation, unit } = req.body;
        
        await pool.query(
            'UPDATE user_habits SET name=?, goals=?, description=?, category=?, icon_html=?, evaluation=?, unit=? WHERE id=? AND user_id=?',
            [name ?? null, goals ?? null, description ?? null, category ?? null, icon_html ?? null, evaluation ?? null, unit ?? null, req.params.id, req.user.id]
        );
        
        res.json({ message: 'Habit updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE HABITS
router.delete('/', auth, async (req, res) => {
    try {
        const { ids } = req.body; // Array of ids
        if (!ids || ids.length === 0) return res.status(400).json({ error: 'No ids provided' });
        
        const placeholders = ids.map(() => '?').join(',');
        await pool.query(`DELETE FROM user_habits WHERE user_id=? AND id IN (${placeholders})`, [req.user.id, ...ids]);
        
        res.json({ message: 'Habits deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// LOG HABIT (UPSERT)
router.post('/log', auth, async (req, res) => {
    try {
        const { habit_id, log_date, completed, numeric_value, timer_elapsed } = req.body;
        
        // Use INSERT ... ON DUPLICATE KEY UPDATE
        await pool.query(
            `INSERT INTO habit_logs (user_id, habit_id, log_date, completed, numeric_value, timer_elapsed) 
             VALUES (?, ?, ?, ?, COALESCE(?, 0), COALESCE(?, 0))
             ON DUPLICATE KEY UPDATE 
             completed = COALESCE(VALUES(completed), completed),
             numeric_value = COALESCE(VALUES(numeric_value), numeric_value),
             timer_elapsed = COALESCE(VALUES(timer_elapsed), timer_elapsed),
             updated_at = NOW()`,
            [req.user.id, habit_id, log_date ?? null, completed ?? null, numeric_value ?? null, timer_elapsed ?? null]
        );
        
        res.json({ message: 'Log saved' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
