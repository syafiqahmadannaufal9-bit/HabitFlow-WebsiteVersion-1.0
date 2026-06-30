(function() {
    // Auto-detect base URL path for assets (works from any sub-folder)
    const BASE_URL = window.location.origin;

    function initWidget() {
        // Prevent double initialization
        if (document.getElementById('hf-assistant-btn')) return;

        // 1. Inject Styles
        const style = document.createElement('style');
        style.innerHTML = `
            #hf-assistant-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 80px;
                height: 80px;
                z-index: 99999;
                cursor: grab;
                user-select: none;
                filter: drop-shadow(0px 6px 16px rgba(0,0,0,0.2));
                touch-action: none;
            }
            #hf-assistant-btn:active { cursor: grabbing; }
            #hf-assistant-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                pointer-events: none;
                border-radius: 50%;
                display: block;
            }
            @keyframes hf-jiggle {
                0%   { transform: rotate(0deg) scale(1); }
                20%  { transform: rotate(-12deg) scale(1.12); }
                40%  { transform: rotate(12deg) scale(1.12); }
                60%  { transform: rotate(-8deg) scale(1.08); }
                80%  { transform: rotate(8deg) scale(1.08); }
                100% { transform: rotate(0deg) scale(1); }
            }
            .hf-jiggle-anim { animation: hf-jiggle 0.7s ease-in-out; }

            #hf-assistant-dialog {
                position: fixed;
                bottom: 116px;
                right: 24px;
                width: 340px;
                height: 480px;
                background: #fff;
                border-radius: 20px;
                box-shadow: 0 12px 48px rgba(0,0,0,0.18);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                z-index: 99998;
                opacity: 0;
                pointer-events: none;
                transform: translateY(16px) scale(0.96);
                transform-origin: bottom right;
                transition: opacity 0.25s ease, transform 0.25s ease;
            }
            #hf-assistant-dialog.hf-open {
                opacity: 1;
                pointer-events: all;
                transform: translateY(0) scale(1);
            }
            #hf-dlg-header {
                background: #F0FDF4;
                padding: 14px 18px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-bottom: 1px solid #E5E7EB;
                flex-shrink: 0;
            }
            #hf-dlg-header-icon {
                background: #D1FAE5;
                color: #059669;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            #hf-dlg-body {
                flex: 1;
                padding: 14px;
                overflow-y: auto;
                background: #FAFAFA;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            #hf-dlg-footer {
                padding: 10px 14px;
                background: #fff;
                border-top: 1px solid #E5E7EB;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }
            .hf-chat-input {
                flex: 1;
                padding: 9px 14px;
                border: 1.5px solid #E5E7EB;
                border-radius: 99px;
                outline: none;
                font-size: 14px;
                font-family: inherit;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .hf-chat-input:focus {
                border-color: #34D399;
                box-shadow: 0 0 0 3px rgba(52,211,153,0.15);
            }
            .hf-send-btn {
                background: #34D399;
                color: #fff;
                border: none;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s, transform 0.15s;
                font-size: 14px;
                flex-shrink: 0;
            }
            .hf-send-btn:hover { background: #10B981; transform: scale(1.05); }
            .hf-bubble {
                max-width: 85%;
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 13.5px;
                line-height: 1.55;
                word-wrap: break-word;
                font-family: inherit;
                animation: hf-fadein 0.25s ease;
            }
            @keyframes hf-fadein {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .hf-bubble-ai {
                background: #F3F4F6;
                color: #1F2937;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }
            .hf-bubble-user {
                background: #34D399;
                color: #fff;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .hf-typing-dots { display:flex; gap:4px; padding:2px 4px; }
            .hf-dot {
                width:6px; height:6px; background:#9CA3AF; border-radius:50%;
                animation: hf-bounce 1.2s infinite ease-in-out both;
            }
            .hf-dot:nth-child(1){animation-delay:-0.32s;}
            .hf-dot:nth-child(2){animation-delay:-0.16s;}
            @keyframes hf-bounce {
                0%,80%,100%{transform:scale(0);}
                40%{transform:scale(1);}
            }
        `;
        document.head.appendChild(style);

        // 2. Inject HTML
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div id="hf-assistant-btn">
                <img id="hf-assistant-img" src="${BASE_URL}/assets/maskot_chatbot.png" alt="HabitFlow AI">
            </div>
            <div id="hf-assistant-dialog">
                <div id="hf-dlg-header">
                    <div id="hf-dlg-header-icon"><i class="fa-solid fa-robot"></i></div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:#1F2937;margin:0;">HabitFlow AI</div>
                        <div style="font-size:12px;color:#6B7280;margin:0;">Siap membantumu hari ini</div>
                    </div>
                </div>
                <div id="hf-dlg-body"></div>
                <div id="hf-dlg-footer">
                    <input type="text" id="hf-dlg-input" class="hf-chat-input" placeholder="Tanya sesuatu..." autocomplete="off">
                    <button id="hf-dlg-send" class="hf-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper.children[0]);
        document.body.appendChild(wrapper.children[0]);

        // 3. Get elements
        const btn    = document.getElementById('hf-assistant-btn');
        const dialog = document.getElementById('hf-assistant-dialog');
        const body   = document.getElementById('hf-dlg-body');
        const input  = document.getElementById('hf-dlg-input');
        const send   = document.getElementById('hf-dlg-send');

        let dragging = false, moved = false;
        let startX, startY, origRight, origBottom;

        // 4. Drag & Drop
        btn.addEventListener('mousedown', dragStart);
        btn.addEventListener('touchstart', dragStart, {passive: true});
        window.addEventListener('mousemove', dragMove);
        window.addEventListener('touchmove', dragMove, {passive: false});
        window.addEventListener('mouseup', dragEnd);
        window.addEventListener('touchend', dragEnd);

        function dragStart(e) {
            dragging = true; moved = false;
            const p = e.touches ? e.touches[0] : e;
            startX = p.clientX; startY = p.clientY;
            const r = btn.getBoundingClientRect();
            origRight  = window.innerWidth  - r.right;
            origBottom = window.innerHeight - r.bottom;
            btn.style.transition = 'none';
        }

        function dragMove(e) {
            if (!dragging) return;
            const p = e.touches ? e.touches[0] : e;
            const dx = startX - p.clientX;
            const dy = startY - p.clientY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            const newRight  = Math.max(0, Math.min(window.innerWidth  - btn.offsetWidth,  origRight  + dx));
            const newBottom = Math.max(0, Math.min(window.innerHeight - btn.offsetHeight, origBottom + dy));
            btn.style.right  = newRight  + 'px';
            btn.style.bottom = newBottom + 'px';
            btn.style.left   = 'auto';
            btn.style.top    = 'auto';
            // Sync dialog position
            dialog.style.right  = newRight  + 'px';
            dialog.style.bottom = (newBottom + 90) + 'px';
            dialog.style.left   = 'auto';
            dialog.style.top    = 'auto';
        }

        function dragEnd() {
            if (!dragging) return;
            dragging = false;
            btn.style.transition = '';
            if (!moved) toggleDialog();
        }

        // 5. Toggle dialog
        function toggleDialog() {
            const isOpen = dialog.classList.contains('hf-open');
            dialog.classList.toggle('hf-open', !isOpen);
            if (!isOpen) { input.focus(); scrollBottom(); }
        }

        // Close when clicking outside
        document.addEventListener('click', function(e) {
            if (dialog.classList.contains('hf-open') &&
                !dialog.contains(e.target) && !btn.contains(e.target)) {
                dialog.classList.remove('hf-open');
            }
        });

        // 6. Periodic jiggle animation (every 8 seconds)
        setInterval(function() {
            if (!dialog.classList.contains('hf-open') && !dragging) {
                btn.classList.add('hf-jiggle-anim');
                btn.addEventListener('animationend', function h() {
                    btn.classList.remove('hf-jiggle-anim');
                    btn.removeEventListener('animationend', h);
                });
            }
        }, 8000);

        // 7. Chat logic
        function addBubble(text, role) {
            const div = document.createElement('div');
            div.className = 'hf-bubble ' + (role === 'user' ? 'hf-bubble-user' : 'hf-bubble-ai');
            div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .replace(/\n/g, '<br>');
            body.appendChild(div);
            scrollBottom();
            return div;
        }

        function scrollBottom() { body.scrollTop = body.scrollHeight; }

        function showTyping() {
            const d = document.createElement('div');
            d.id = 'hf-typing-el';
            d.className = 'hf-bubble hf-bubble-ai';
            d.innerHTML = '<div class="hf-typing-dots"><div class="hf-dot"></div><div class="hf-dot"></div><div class="hf-dot"></div></div>';
            body.appendChild(d);
            scrollBottom();
        }

        function removeTyping() {
            const el = document.getElementById('hf-typing-el');
            if (el) el.remove();
        }

        async function sendMsg() {
            const msg = input.value.trim();
            if (!msg) return;
            addBubble(msg, 'user');
            input.value = '';
            showTyping();
            try {
                if (typeof apiClient === 'undefined') throw new Error('apiClient not loaded');
                const res = await apiClient.sendChatMessage(msg);
                removeTyping();
                const output = res.data && res.data.output;
                addBubble(output || 'Maaf, terjadi kesalahan.', 'ai');
            } catch(err) {
                removeTyping();
                addBubble('Maaf, tidak dapat menghubungi AI saat ini.', 'ai');
            }
        }

        send.addEventListener('click', sendMsg);
        input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMsg(); });

        // Load history on demand (when dialog first opened)
        let historyLoaded = false;
        btn.addEventListener('click', async function() {
            if (!historyLoaded && !moved) {
                historyLoaded = true;
                try {
                    if (typeof apiClient === 'undefined') return;
                    const res = await apiClient.getChatHistory();
                    if (res.data && res.data.length === 0) {
                        addBubble('Halo! Saya HabitFlow AI. Ada yang bisa saya bantu tentang kebiasaan atau produktivitasmu hari ini?', 'ai');
                    } else if (res.data) {
                        res.data.forEach(m => addBubble(m.message, m.sender));
                    }
                } catch(e) {
                    addBubble('Halo! Saya HabitFlow AI. Ada yang bisa saya bantu?', 'ai');
                }
            }
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
