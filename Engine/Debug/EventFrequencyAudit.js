/**
 * ATOMA EVENT FREQUENCY AUDIT
 * 
 * Purpose:
 * Audit gameplay event firing frequency to understand which events are active
 * 
 * Design:
 * - Non-invasive read-only monitoring
 * - Counters increment on each event
 * - 5-second interval logging
 * - Zero gameplay impact
 * 
 * Events Monitored:
 * - node.selection (select/deselect)
 * - link.created
 * - network.link.destroyed
 * - node.synergy.high
 * - synergy fade (audio callback)
 */

export class EventFrequencyAudit {
    constructor(semanticBus, audioSystem = null) {
        this.semanticBus = semanticBus;
        this.audioSystem = audioSystem;
        this.enabled = false;
        
        // Event counters
        this.eventCounters = {
            nodeSelect: 0,
            nodeDeselect: 0,
            linkCreated: 0,
            linkDestroyed: 0,
            synergyHigh: 0,
            synergyFade: 0
        };
        
        // Logging interval (5 seconds)
        this.logIntervalMs = 5000;
        this.lastLogTime = 0;
        
        // Unsubscribe functions for cleanup
        this.unsubscribers = [];
    }
    
    /**
     * Initialize the audit system
     */
    init() {
        if (this.enabled) {
            console.warn('[EventAudit] Already initialized');
            return;
        }
        
        if (!this.semanticBus) {
            console.error('[EventAudit] SemanticBus not provided');
            return;
        }
        
        // Subscribe to node.selection events
        this.unsubscribers.push(
            this.semanticBus.subscribe('node.selection', (evt) => {
                if (evt.type === 'select') {
                    this.eventCounters.nodeSelect++;
                } else if (evt.type === 'deselect') {
                    this.eventCounters.nodeDeselect++;
                }
            })
        );
        
        // Subscribe to link.created events
        this.unsubscribers.push(
            this.semanticBus.subscribe('link.created', () => {
                this.eventCounters.linkCreated++;
            })
        );
        
        // Subscribe to network.link.destroyed events
        this.unsubscribers.push(
            this.semanticBus.subscribe('network.link.destroyed', () => {
                this.eventCounters.linkDestroyed++;
            })
        );
        
        // Subscribe to node.synergy.high events
        this.unsubscribers.push(
            this.semanticBus.subscribe('node.synergy.high', () => {
                this.eventCounters.synergyHigh++;
            })
        );
        
        // Monitor synergy fade audio callback
        if (this.audioSystem && typeof this.audioSystem.playSynergyFade === 'function') {
            const originalPlaySynergyFade = this.audioSystem.playSynergyFade.bind(this.audioSystem);
            this.audioSystem.playSynergyFade = (...args) => {
                this.eventCounters.synergyFade++;
                return originalPlaySynergyFade(...args);
            };
            console.log('[EventAudit] synergyFade audio callback wrapped');
        } else {
            console.warn('[EventAudit] playSynergyFade not available on audioSystem');
        }
        
        this.enabled = true;
        this.lastLogTime = performance.now();
        
        console.log('[EventAudit] ✓ Event Frequency Audit initialized');
        console.log('[EventAudit] Monitoring: node.selection, link.created, network.link.destroyed, node.synergy.high, synergy fade');
    }
    
    /**
     * Log current counters (called every 5 seconds)
     */
    logCounters() {
        const now = performance.now();
        const elapsed = now - this.lastLogTime;
        
        if (elapsed >= this.logIntervalMs) {
            console.log('%c[ATOMA EVENT AUDIT]', 'color: #00ff00; font-weight: bold;');
            console.log(`  nodeSelect: ${this.eventCounters.nodeSelect}`);
            console.log(`  nodeDeselect: ${this.eventCounters.nodeDeselect}`);
            console.log(`  linkCreated: ${this.eventCounters.linkCreated}`);
            console.log(`  linkDestroyed: ${this.eventCounters.linkDestroyed}`);
            console.log(`  synergyHigh: ${this.eventCounters.synergyHigh}`);
            console.log(`  synergyFade: ${this.eventCounters.synergyFade}`);
            console.log(`  ──────────────────────────────────`);
            this.lastLogTime = now;
        }
    }
    
    /**
     * Get current counter snapshot
     */
    getSnapshot() {
        return {
            ...this.eventCounters,
            timestamp: performance.now(),
            enabled: this.enabled
        };
    }
    
    /**
     * Reset all counters to zero
     */
    reset() {
        this.eventCounters = {
            nodeSelect: 0,
            nodeDeselect: 0,
            linkCreated: 0,
            linkDestroyed: 0,
            synergyHigh: 0,
            synergyFade: 0
        };
        console.log('[EventAudit] Counters reset');
    }
    
    /**
     * Disable the audit system
     */
    disable() {
        if (!this.enabled) return;
        
        // Unsubscribe from all events
        this.unsubscribers.forEach(unsub => {
            if (typeof unsub === 'function') {
                unsub();
            }
        });
        this.unsubscribers = [];
        
        this.enabled = false;
        console.log('[EventAudit] Event Frequency Audit disabled');
    }
    
    /**
     * Enable the audit system
     */
    enable() {
        if (this.enabled) return;
        
        if (!this.semanticBus) {
            console.error('[EventAudit] SemanticBus not available');
            return;
        }
        
        this.init();
    }
}

/**
 * Setup event audit system for ATOMA
 * Returns audit instance and cleanup function
 */
export function setupEventFrequencyAudit(semanticBus, audioSystem = null) {
    const audit = new EventFrequencyAudit(semanticBus, audioSystem);
    audit.init();
    
    // Return audit instance
    return audit;
}

/**
 * Console API for event audit
 */
export function setupEventAuditConsoleAPI(audit) {
    if (typeof window === 'undefined') return;
    
    window.ATOMA_EVENT_AUDIT = {
        getSnapshot: () => audit.getSnapshot(),
        reset: () => audit.reset(),
        enable: () => audit.enable(),
        disable: () => audit.disable(),
        getStatus: () => ({
            enabled: audit.enabled,
            counters: audit.getSnapshot()
        })
    };
    
    console.log('[EventAudit] Console API ready:');
    console.log('  ATOMA_EVENT_AUDIT.getSnapshot() - Get current counters');
    console.log('  ATOMA_EVENT_AUDIT.reset() - Reset all counters');
    console.log('  ATOMA_EVENT_AUDIT.enable() - Enable audit');
    console.log('  ATOMA_EVENT_AUDIT.disable() - Disable audit');
    console.log('  ATOMA_EVENT_AUDIT.getStatus() - Get full status');
}