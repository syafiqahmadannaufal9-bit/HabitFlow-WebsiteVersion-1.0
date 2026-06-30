require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '../')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/auth');
const habitsRoutes = require('./routes/habits');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const uxRoutes = require('./routes/ux'); // For UX metrics
const aiRoutes = require('./routes/ai');
const chatbotRoutes = require('./routes/chatbot');

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ux', uxRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Catch-all route to serve the index.html for non-API requests (if SPA-like routing is needed)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../views/index.html'));
// });

// Initialize automated data cleanup
const { initRetentionPolicy } = require('./utils/retentionPolicy');
initRetentionPolicy();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
