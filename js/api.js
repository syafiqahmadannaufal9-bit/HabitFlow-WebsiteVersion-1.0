const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = {
    getToken() {
        return localStorage.getItem('token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (isAdmin) {
            headers['x-admin-bypass'] = 'true';
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                data = { error: text || 'Server returned an invalid response' };
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || 'API request failed');
            }

            return { data, error: null };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return { data: null, error };
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options });
    },

    delete(endpoint, body = null, options = {}) {
        return this.request(endpoint, { 
            method: 'DELETE', 
            ...(body && { body: JSON.stringify(body) }), 
            ...options 
        });
        
    },

    askAI(prompt, options = {}) {
        return this.post('/ai/ask', { prompt }, options);
    },

    getChatHistory(options = {}) {
        return this.get('/chatbot/history', options);
    },

    resetChatHistory(options = {}) {
        return this.delete('/chatbot/history', null, options);
    },

    sendChatMessage(message, options = {}) {
        return this.post('/chatbot/send', { message }, options);
    }
};

window.apiClient = apiClient;
