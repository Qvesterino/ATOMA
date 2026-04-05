
// === EVENT FLOW TRACER ===
// Generated: 2026-04-04T22:09:30.849040

class EventFlowTracer {
    constructor() {
        self.eventLog = [];
        self.eventChains = [];
        self.eventCounts = new Map();
        self.startTime = performance.now();
        self.activeChains = new Map();
        self.stormThreshold = 50; // Events per second
        self.stormDetectionWindow = 1000; // ms

        self._setupTracing();
        self._startStormDetection();
    }

    _setupTracing() {
        // Wrap semanticBus.emit
        if (window.semanticBus) {
            const originalEmit = window.semanticBus.emit;
            window.semanticBus.emit = (event, data) => {
                self._logEvent('emit', event, data);
                return originalEmit.call(window.semanticBus, event, data);
            };
        }

        // Wrap semanticBus.on
        if (window.semanticBus) {
            const originalOn = window.semanticBus.on;
            window.semanticBus.on = (event, handler) => {
                self._logEvent('subscribe', event, { handler: handler.name || 'anonymous' });
                return originalOn.call(window.semanticBus, event, handler);
            };
        }

        console.log('[Event Tracer] Tracing enabled');
    }

    _logEvent(type, event, data) {
        const timestamp = performance.now() - this.startTime;

        self.eventLog.push({
            type,
            event,
            timestamp,
            data: this._sanitizeData(data)
        });

        self.eventCounts.set(event, (this.eventCounts.get(event) || 0) + 1);

        // Detect chains
        self._detectChain(event, type);
    }

    _sanitizeData(data) {
        // Remove circular references and limit size
        if (!data) return {};

        const sanitized = {};
        const keys = Object.keys(data).slice(0, 5); // Limit to 5 keys

        for (const key of keys) {
            const value = data[key];
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = '[object]';
            } else if (typeof value === 'function') {
                sanitized[key] = '[function]';
            } else {
                sanitized[key] = String(value).substring(0, 50);
            }
        }

        return sanitized;
    }

    _detectChain(event, type) {
        if (type !== 'emit') return;

        // Check if this event was triggered by another recent event
        const recentEvents = this.eventLog.filter(log =>
            log.type === 'emit' &&
            log.timestamp > performance.now() - this.startTime - 100
        );

        if (recentEvents.length > 0) {
            const previousEvent = recentEvents[recentEvents.length - 2];
            if (previousEvent && previousEvent.event !== event) {
                self.eventChains.push({
                    from: previousEvent.event,
                    to: event,
                    timestamp: performance.now() - this.startTime,
                    delay: (performance.now() - this.startTime) - previousEvent.timestamp
                });
            }
        }
    }

    _startStormDetection() {
        setInterval(() => {
            self._detectEventStorm();
        }, this.stormDetectionWindow);
    }

    _detectEventStorm() {
        const now = performance.now() - this.startTime;
        const windowStart = now - this.stormDetectionWindow;

        const recentEvents = this.eventLog.filter(log =>
            log.type === 'emit' &&
            log.timestamp >= windowStart
        );

        if (recentEvents.length > this.stormThreshold) {
            self._reportStorm(recentEvents, now);
        }
    }

    _reportStorm(events, timestamp) {
        const eventCounts = {};
        events.forEach(e => {
            eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
        });

        const topEvents = Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        console.warn(`\n⚠️ EVENT STORM DETECTED at ${timestamp.toFixed(0)}ms`);
        console.warn(`Events in last ${this.stormDetectionWindow}ms: ${events.length}`);
        console.warn('Top events:', topEvents);
        console.warn('---\n');
    }

    getTimeline(eventFilter = null) {
        let events = this.eventLog;

        if (eventFilter) {
            events = events.filter(log => log.event.includes(eventFilter));
        }

        return events.map(log => ({
            ...log,
            relativeTime: log.timestamp.toFixed(2) + 'ms'
        }));
    }

    getEventCounts() {
        return Object.fromEntries(
            Array.from(this.eventCounts.entries())
                .sort((a, b) => b[1] - a[1])
        );
    }

    getEventChains() {
        // Group and count chains
        const chainCounts = new Map();

        self.eventChains.forEach(chain => {
            const key = `${chain.from} -> ${chain.to}`;
            chainCounts.set(key, (chainCounts.get(key) || 0) + 1);
        });

        return Object.fromEntries(
            Array.from(chainCounts.entries())
                .sort((a, b) => b[1] - a[1])
        );
    }

    generateFlowVisualization() {
        const chains = this.getEventChains();
        const nodes = new Set();
        const links = [];

        Object.entries(chains).forEach(([chain, count]) => {
            const [from, to] = chain.split(' -> ');
            nodes.add(from);
            nodes.add(to);
            links.push({ source: from, target: to, count });
        });

        return {
            nodes: Array.from(nodes),
            links,
            summary: {
                totalNodes: nodes.size,
                totalLinks: links.length,
                totalEvents: this.eventLog.length,
                uniqueEvents: this.eventCounts.size
            }
        };
    }

    printReport() {
        const duration = performance.now() - this.startTime;
        const eventCounts = this.getEventCounts();
        const chains = this.getEventChains();

        console.log('\n=== EVENT FLOW REPORT ===');
        console.log(`Duration: ${duration.toFixed(0)}ms`);
        console.log(`Total Events: ${this.eventLog.length}`);
        console.log(`Unique Events: ${Object.keys(eventCounts).length}`);
        console.log(`Event Chains: ${Object.keys(chains).length}`);

        console.log('\n--- Top 10 Events ---');
        const topEvents = Object.entries(eventCounts).slice(0, 10);
        topEvents.forEach(([event, count]) => {
            console.log(`  ${event}: ${count}`);
        });

        if (Object.keys(chains).length > 0) {
            console.log('\n--- Top 10 Event Chains ---');
            const topChains = Object.entries(chains).slice(0, 10);
            topChains.forEach(([chain, count]) => {
                console.log(`  ${chain}: ${count}`);
            });
        }

        console.log('\n===============================\n');
    }

    exportData() {
        return {
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            eventLog: this.eventLog,
            eventCounts: Object.fromEntries(this.eventCounts),
            eventChains: this.eventChains,
            flowVisualization: this.generateFlowVisualization()
        };
    }

    reset() {
        self.eventLog = [];
        self.eventChains = [];
        self.eventCounts.clear();
        self.startTime = performance.now();
        console.log('[Event Tracer] Reset');
    }
}

// Auto-load in browser
if (typeof window !== 'undefined') {
    window.__EVENT_FLOW_TRACER__ = new EventFlowTracer();

    // Expose API
    window.getEventTimeline = (filter) => window.__EVENT_FLOW_TRACER__.getTimeline(filter);
    window.getEventCounts = () => window.__EVENT_FLOW_TRACER__.getEventCounts();
    window.getEventChains = () => window.__EVENT_FLOW_TRACER__.getEventChains();
    window.printEventFlowReport = () => window.__EVENT_FLOW_TRACER__.printReport();
    window.exportEventFlowData = () => window.__EVENT_FLOW_TRACER__.exportData();

    console.log('Event Flow Tracer loaded.');
    console.log('API: window.getEventTimeline(), window.getEventCounts(), window.printEventFlowReport()');
}
