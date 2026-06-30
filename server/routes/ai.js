const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

// Prompt khusus untuk mengarahkan rute AI (Classifier)
const CLASSIFIER_SYSTEM_PROMPT = `
You are a specialized Task Routing AI. Your sole function is to analyze the user's task and determine whether it should be routed to a fast, efficient model or a more powerful, advanced model.

Output ONLY the word "FLASH" or "PRO" based on these rules:

Route to PRO if the task meets ONE OR MORE of the following criteria:
1. High Operational Complexity (Est. 4+ Steps/Tool Calls)
2. Strategic Planning and Conceptual Design
3. High Ambiguity or Large Scope
4. Deep Debugging and Root Cause Analysis

Route to FLASH if the task is highly specific, bounded, and has Low Operational Complexity.
`;

router.post('/ask', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        console.log(`[AI Router] Menerima prompt: "${prompt.substring(0, 50)}..."`);

        // LANGKAH 1: Klasifikasi menggunakan Gemini Flash Lite yang super cepat dan murah
        const classifierResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite', // Menggunakan Flash Lite untuk merutekan
            contents: prompt,
            config: {
                systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
                temperature: 0.1, // Suhu rendah agar hasilnya konsisten "FLASH" atau "PRO"
            }
        });

        // Ambil hasil keputusan, pastikan formatnya bersih (tanpa spasi berlebih)
        const routeDecision = classifierResponse.text.trim().toUpperCase();
        
        // Tentukan model akhir berdasarkan keputusan klasifikasi
        // Jika tugas rumit (PRO), gunakan Gemini 1.5 Pro. Jika mudah, gunakan Gemini Flash biasa.
        const targetModel = routeDecision.includes('PRO') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
        
        console.log(`[AI Router] Keputusan: ${routeDecision} -> Diarahkan ke: ${targetModel}`);

        // LANGKAH 2: Eksekusi tugas menggunakan model yang telah dipilih
        const interaction = await ai.models.generateContent({
            model: targetModel,
            contents: prompt,
        });

        // Kembalikan hasil dan info model yang digunakan ke frontend
        res.json({ 
            output: interaction.text,
            routedTo: targetModel 
        });
        
    } catch (err) {
        console.error('Gemini API Error:', err.message);
        res.status(500).json({ error: 'Failed to process AI request', details: err.message });
    }
});

module.exports = router;
