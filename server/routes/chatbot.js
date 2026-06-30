const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

const CHATBOT_SYSTEM_PROMPT = `
You are HabitFlow AI, a helpful, encouraging, and friendly productivity assistant built into the HabitFlow app. 
Your goal is to help the user build good habits, stay motivated, and answer any questions they have.
Keep your responses relatively concise, formatting them with markdown if helpful. 
Respond in Indonesian unless the user speaks in another language.
`;

// GET /api/chatbot/history - Ambil riwayat chat user
router.get('/history', auth, async (req, res) => {
    try {
        const [messages] = await pool.query(
            'SELECT sender, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC', 
            [req.user.id]
        );
        res.json(messages);
    } catch (err) {
        console.error('Error fetching chat history:', err.message);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// POST /api/chatbot/send - Kirim pesan ke AI
router.post('/send', auth, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // 1. Simpan pesan user ke database
        await pool.query(
            'INSERT INTO chat_messages (user_id, sender, message) VALUES (?, ?, ?)',
            [req.user.id, 'user', message]
        );

        // 2. Ambil 10 pesan terakhir untuk konteks (history)
        const [historyRows] = await pool.query(
            'SELECT sender, message FROM (SELECT sender, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10) sub ORDER BY created_at ASC',
            [req.user.id]
        );

        // Format riwayat pesan untuk Gemini (menggunakan 'user' dan 'model')
        const contents = historyRows.map(row => ({
            role: row.sender === 'user' ? 'user' : 'model',
            parts: [{ text: row.message }]
        }));

        // 3. Panggil Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: CHATBOT_SYSTEM_PROMPT,
            }
        });

        const aiResponseText = response.text;

        // 4. Simpan balasan AI ke database
        await pool.query(
            'INSERT INTO chat_messages (user_id, sender, message) VALUES (?, ?, ?)',
            [req.user.id, 'ai', aiResponseText]
        );

        // 5. Kembalikan balasan ke frontend
        res.json({ output: aiResponseText });

    } catch (err) {
        console.error('Chatbot API Error:', err.message);
        res.status(500).json({ error: 'Failed to process AI request', details: err.message });
    }
});

// DELETE /api/chatbot/history - Hapus riwayat chat user
router.delete('/history', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM chat_messages WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Riwayat percakapan berhasil dihapus' });
    } catch (err) {
        console.error('Error deleting chat history:', err.message);
        res.status(500).json({ error: 'Failed to delete chat history' });
    }
});

module.exports = router;
