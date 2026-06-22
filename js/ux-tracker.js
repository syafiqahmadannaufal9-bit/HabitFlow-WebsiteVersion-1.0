// ux-tracker.js
// Mengumpulkan metrik User Experience secara otomatis

class UXTracker {
    constructor() {
        this.sessionId = sessionStorage.getItem('ux_session_id');
        this.pageVisitId = null;
        this.metrics = [];
        this.enterTime = Date.now();
        this.interactions = 0;
        this.maxScroll = 0;
        
        this.init();
    }

    async init() {
        if (!window.apiClient) return; // Tunggu api.js
        
        // 1. Start or resume session
        if (!this.sessionId) {
            const { data } = await window.apiClient.post('/ux/sessions', {
                user_id: this._getUserId(),
                device_type: this._getDeviceType(),
                browser: this._getBrowser(),
                screen_resolution: `${window.screen.width}x${window.screen.height}`
            });
            if (data && data.session_id) {
                this.sessionId = data.session_id;
                sessionStorage.setItem('ux_session_id', this.sessionId);
                sessionStorage.setItem('ux_session_start', Date.now());
                sessionStorage.setItem('ux_pages_visited', 1);
            }
        } else {
            const pages = parseInt(sessionStorage.getItem('ux_pages_visited') || 0) + 1;
            sessionStorage.setItem('ux_pages_visited', pages);
            const start = parseInt(sessionStorage.getItem('ux_session_start') || Date.now());
            const duration = Math.floor((Date.now() - start) / 1000);
            
            // Update session
            window.apiClient.put(`/ux/sessions/${this.sessionId}`, {
                pages_visited: pages,
                total_duration: duration
            });
        }


        // 3. Track Page Load Time
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                if (pageLoadTime > 0) {
                    this.logMetric('page_load_time', pageLoadTime);
                }
            }, 0);
        });

        // 4. Track Interactions
        document.addEventListener('click', () => {
            this.interactions++;
        });

        // 5. Track Scroll Depth
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const percent = Math.round((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100);
            if (percent > this.maxScroll) this.maxScroll = percent;
        });

        // 6. Handle beforeunload (leave page)
        window.addEventListener('beforeunload', () => {
            this._flushData();
        });
        
        // Push batched metrics every 10 seconds
        setInterval(() => this._pushBatchedMetrics(), 10000);
    }

    logMetric(metricType, metricValue) {
        this.metrics.push({
            user_id: this._getUserId(),
            metric_type: metricType,
            metric_value: metricValue,
            page_name: window.location.pathname.split('/').pop() || 'index.html',
            session_id: this.sessionId,
            device_info: navigator.userAgent
        });
    }

    _getUserId() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                return JSON.parse(userStr).id;
            } catch (e) {}
        }
        return null;
    }

    _getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    }

    _getBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
    }

    _pushBatchedMetrics() {
        if (this.metrics.length > 0 && window.apiClient) {
            const toSend = [...this.metrics];
            this.metrics = [];
            window.apiClient.post('/ux/metrics', { metrics: toSend }).catch(() => {
                // If fail, push back to queue
                this.metrics = [...toSend, ...this.metrics];
            });
        }
    }

    _flushData() {
        // Push remaining metrics
        if (this.metrics.length > 0) {
            fetch(`${API_BASE_URL}/ux/metrics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics: this.metrics }),
                keepalive: true
            });
        }
    }
}

// Init when script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly to ensure api.js is loaded
    setTimeout(() => {
        window.uxTracker = new UXTracker();
    }, 500);
});
