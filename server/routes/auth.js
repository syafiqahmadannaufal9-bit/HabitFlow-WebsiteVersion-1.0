const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const auth = require('../middleware/auth');

// Setup Multer for Avatar Upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, username } = req.body;
        
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const id = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (id, email, password_hash, full_name, username) VALUES (?, ?, ?, ?, ?)',
            [id, email, password_hash, full_name, username]
        );

        res.json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'super_secret_jwt_key_habitflow_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        email: user.email, 
                        full_name: user.full_name,
                        username: user.username,
                        avatar_url: user.avatar_url
                    } 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// GET CURRENT USER
router.get('/me', auth, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, full_name, username, avatar_url FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: users[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// UPDATE PROFILE
router.put('/profile', auth, async (req, res) => {
    try {
        const { full_name, avatar_url } = req.body;
        
        let query = 'UPDATE users SET updated_at = NOW()';
        const params = [];
        
        if (full_name) {
            query += ', full_name = ?';
            params.push(full_name);
        }
        if (avatar_url) {
            query += ', avatar_url = ?';
            params.push(avatar_url);
        }
        
        query += ' WHERE id = ?';
        params.push(req.user.id);

        await pool.query(query, params);
        res.json({ message: 'Profile updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// UPLOAD AVATAR
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Buat base64 string dari buffer file
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const avatarUrl = `data:${mimeType};base64,${base64Image}`;

        // Update database
        await pool.query('UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, req.user.id]);
        
        res.json({ message: 'Avatar uploaded successfully', avatar_url: avatarUrl });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

module.exports = router;
