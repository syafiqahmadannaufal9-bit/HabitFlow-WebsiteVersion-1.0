const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.html'));

const chatbotNavStr = `
            <a href="chatbot.html" class="flex flex-col items-center justify-center gap-1 w-16 h-16 text-gray-400 hover:text-emerald-600 hover:bg-gray-50 rounded-2xl transition-all ">
                <i class="fa-solid fa-robot text-xl mb-1"></i>
                <span class="text-[10px] font-medium">AI Chat</span>
            </a>`;

files.forEach(file => {
    if (file === 'login.html' || file === 'register.html' || file === 'forgot-password.html' || file === 'reset-password.html' || file === 'intro.html' || file === 'admin_dashboard.html') return;
    
    const filePath = path.join(viewsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has chatbot link to prevent duplicates
    if (content.includes('href="chatbot.html"')) {
        console.log(`Skipping ${file}, already has chatbot link`);
        return;
    }
    
    // Add right after Home link
    // Home link could have "bg-[#C6F2DE]" or just "text-gray-400"
    content = content.replace(/(<a href="index\.html".*?<\/a>)/s, `$1${chatbotNavStr}`);
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated sidebar in ${file}`);
});
