require('dotenv').config();
const mysql = require('mysql2/promise');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'web_habit_tracker'
    });

    const testUserId = 1; // Assuming a user with ID 1 exists
    const message = "berikan saya tip hidup sehat";

    try {
        console.log("1. Testing DB Insert...");
        await pool.query(
            'INSERT INTO chat_messages (user_id, sender, message) VALUES (?, ?, ?)',
            [testUserId, 'user', message]
        );
        console.log("Insert successful!");

        console.log("2. Testing DB Select...");
        const [historyRows] = await pool.query(
            'SELECT sender, message FROM (SELECT sender, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10) sub ORDER BY created_at ASC',
            [testUserId]
        );
        console.log("Select successful!", historyRows);

        console.log("3. Formatting contents...");
        const contents = historyRows.map(row => ({
            role: row.sender === 'user' ? 'user' : 'model',
            parts: [{ text: row.message }]
        }));
        console.dir(contents, {depth: null});

        console.log("4. Calling Gemini...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: "You are a test AI.",
            }
        });
        
        console.log("Gemini Response:", response.text);

        console.log("5. Saving AI reply...");
        await pool.query(
            'INSERT INTO chat_messages (user_id, sender, message) VALUES (?, ?, ?)',
            [testUserId, 'ai', response.text]
        );
        console.log("All done!");

    } catch (e) {
        console.error("Test Failed at some step:", e);
    }
    process.exit();
}
test();
