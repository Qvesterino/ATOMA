/**
 * ATOMA Rhythm Authority
 * ============================================================================
 * Global time and rhythm management for all ATOMA visual systems.
 * Ensures coordinated temporal behavior, consistent phasing, and unified
 * motion patterns across the entire visual stack.
 * 
 * Design Goals:
 * - Single source of truth for all timing
 * - Coordinated global rhythms (breathing, flow, events)
 * - Phase offsets per system for variety without chaos
 * - Rhythm modulation based on system state (stress, harmony, etc.)
 */

export class ATOMARhythmAuthority {
    
    /**
     * Rhythm definitions for ATOMA visual systems
     */
    static readonly RHYTHMS = {
        // Breathing (base idle motion)
        BREATH_SLOW: { 
            period: 4.0, 
            amplitude: 0.03, 
            description: 'Slow breathing for calm systems' 
        },
        BREATH_MEDIUM: { 
            period: 2.5, 
            amplitude: 0.04, 
            description: 'Medium breathing for normal systems' 
        },
        BREATH_FAST: { 
            period: 1.5, 
            amplitude: 0.05, 
            description: 'Fast breathing for active systems' 
        },
        
        // Flow (energy movement)
        FLOW_RELAXED: { 
            speed: 0.3, 
            variance: 0.1, 
            description: 'Relaxed energy flow' 
        },
        FLOW_ACTIVE: { 
            speed: 0.8, 
            variance: 0.2, 
            description: 'Active energy flow' 
        },
        FLOW_STRESSED: { 
            speed: 1.5, 
            variance: 0.4, 
            description: 'Stressed/rapid energy flow' 
        },
        
        // Events (temporary states)
        LINK_CREATION: { 
            duration: 0.4, 
            curve: 'easeOutCubic',
            description: 'Link creation animation' 
        },
        LINK_REMOVAL: { 
            duration: 0.3, 
            curve: 'easeInExpo',
            description: 'Link removal animation' 
        },
        IMPACT_ARRIVAL: { 
            duration: 0.18, 
            curve: 'easeOutQuad',
            description: 'Particle impact feedback' 
        },
        HARMONY_PULSE: { 
            duration: 0.5, 
            curve: 'easeOutQuad',
            description: 'Harmony pulse effect' 
        },
        CORRUPTION_SPIKE: { 
            duration: 0.25, 
            curve: 'easeInOutQuad',
            description: 'Corruption instability spike' 
        },
        
        // Particle lifetimes
        SPARK_LIFETIME: { 
            min: 0.25, 
            max: 0.45, 
            description: 'Spark particle lifetime range' 
        },
        BEAD_LIFETIME: { 
            min: 0.8, 
            max: 1.5, 
            description: 'Bead particle lifetime range' 
        },
        TRAIL_LIFETIME: { 
            min: 0.6, 
            max: 1.2, 
            description: 'Trail particle lifetime range' 
        },
        
        // Orbital systems
        ORBIT_SLOW: { 
            period: 12.0, 
            count: 3, 
            description: 'Slow orbit rings (ambience)' 
        },
        ORBIT_MEDIUM: { 
            period: 6.0, 
            count: 5, 
            description: 'Medium orbit rings (normal)' 
        },
        ORBIT_FAST: { 
            period: 3.0, 
            count: 7, 
            description: 'Fast orbit rings (active)' 
        }
    };
    
    /**
     * Easing functions for temporal transitions
     */
    static readonly EASING = {
        linear: (t) => t,
        easeInQuad: (t) => t * t,
        easeOutQuad: (t) => t * (2 - t),
        easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        easeInCubic: (t) => t * t * t,
        easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
        easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    };
    
    /**
     * System phase offsets (for variety without chaos)
     */
    static readonly SYSTEM_PHASES = {
        NODES: { base: 0.0, variance: 0.5 },
        LINKS: { base: 1.0, variance: 0.3 },
        AURAS: { base: 2.0, variance: 0.7 },
        PARTICLES: { base: 3.0, variance: 0.4 },
        ORBITS: { base: 4.0, variance: 0.6 },
        TRAILS: { base: 5.0, variance: 0.2 }
    };
    
    constructor() {
        this.globalTime = 0;
        this.deltaTime = 0;
        this.lastFrameTime = 0;
        
        // Current rhythm state
        this.currentState = {
            breathMode: 'BREATH_MEDIUM',
            flowMode: 'FLOW_ACTIVE',
            stressLevel: 0.0, // 0-1
            harmonyLevel: 0.0  // 0-1
        };
        
        // Phase offsets per system instance
        this.phaseOffsets = new Map();
        
        // Active events (temporary rhythm modifications)
        this.activeEvents = new Map();
        
        // Performance tracking
        this.stats = {
            activePhases: 0,
            activeEvents: 0,
            lastUpdateTime: 0
        };
        
        console.log('[ATOMARhythmAuthority] Initialized');
    }
    
    /**
     * Update rhythm authority (call every frame)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        const startTime = performance.now();
        
        this.deltaTime = deltaTime;
        this.globalTime += deltaTime;
        
        // Update active events
        this.updateEvents(deltaTime);
        
        // Update stats
        this.stats.activePhases = this.phaseOffsets.size;
        this.stats.activeEvents = this.activeEvents.size;
        this.stats.lastUpdateTime = performance.now() - startTime;
    }
    
    /**
     * Get global time
     * @returns {number} Current global time
     */
    getGlobalTime() {
        return this.globalTime;
    }
    
    /**
     * Get phase offset for a system
     * @param {string} systemId - Unique system identifier
     * @param {string} systemType - System type (for base offset)
     * @param {number} variance - Phase variance (0-1)
     * @returns {number} Phase offset
     */
    getPhaseOffset(systemId, systemType, variance = 0.5) {
        if (!this.phaseOffsets.has(systemId)) {
            const systemPhase = this.SYSTEM_PHASES[systemType] || { base: 0, variance: 0.5 };
            const randomPhase = Math.random() * systemPhase.variance * variance;
            const phase = systemPhase.base + randomPhase;
            this.phaseOffsets.set(systemId, phase);
        }
        return this.phaseOffsets.get(systemId);
    }
    
    /**
     * Get breathing value (oscillation)
     * @param {string} systemId - System identifier for phase
     * @param {string} systemType - System type
     * @param {number} amplitude - Amplitude override
     * @returns {number} Breathing value (-amplitude to +amplitude)
     */
    getBreath(systemId, systemType, amplitude) {
        const rhythm = this.RHYTHMS[this.currentState.breathMode];
        const phase = this.getPhaseOffset(systemId, systemType);
        const actualAmplitude = amplitude ?? rhythm.amplitude;
        
        return Math.sin(
            (this.globalTime * Math.PI * 2 / rhythm.period) + phase
        ) * actualAmplitude;
    }
    
    /**
     * Get flow speed (energy movement)
     * @param {string} systemId - System identifier for variance
     * @param {string} systemType - System type
     * @returns {number} Flow speed
     */
    getFlowSpeed(systemId, systemType) {
        const rhythm = this.RHYTHMS[this.currentState.flowMode];
        const phase = this.getPhaseOffset(systemId, systemType);
        const variance = Math.sin(this.globalTime + phase) * rhythm.variance;
        
        return rhythm.speed * (1.0 + variance);
    }
    
    /**
     * Get oscillation value (general purpose)
     * @param {number} speed - Oscillation speed
     * @param {number} phase - Phase offset
     * @returns {number} Oscillation value (-1 to 1)
     */
    oscillate(speed, phase = 0) {
        return Math.sin(this.globalTime * speed + phase);
    }
    
    /**
     * Get pulse value (sharp rise, slow fall)
     * @param {string} systemId - System identifier
     * @param {number} frequency - Pulse frequency
     * @param {number} sharpness - Sharpness of rise (1-10)
     * @returns {number} Pulse value (0-1)
     */
    pulse(systemId, frequency, sharpness = 3) {
        const phase = this.getPhaseOffset(systemId, 'PARTICLES', 0.1);
        const t = (Math.sin(this.globalTime * frequency + phase) + 1) * 0.5;
        return 1 - Math.pow(1 - t, sharpness);
    }
    
    /**
     * Get eased progress for an event
     * @param {string} eventName - Event name (from RHYTHMS)
     * @param {number} progress - Progress (0-1)
     * @returns {number} Eased progress (0-1)
     */
    getEventEasing(eventName, progress) {
        const rhythm = this.RHYTHMS[eventName];
        if (!rhythm) {
            console.warn(`[ATOMARhythmAuthority] Unknown event: ${eventName}`);
            return progress;
        }
        
        const easingFunc = this.EASING[rhythm.curve] || this.EASING.linear;
        return easingFunc(progress);
    }
    
    /**
     * Start a temporary event
     * @param {string} eventId - Unique event identifier
     * @param {string} eventName - Event name (from RHYTHMS)
     * @param {number} intensity - Event intensity (0-1)
     */
    startEvent(eventId, eventName, intensity = 1.0) {
        const rhythm = this.RHYTHMS[eventName];
        if (!rhythm) {
            console.warn(`[ATOMARhythmAuthority] Unknown event: ${eventName}`);
            return;
        }
        
        this.activeEvents.set(eventId, {
            name: eventName,
            startTime: this.globalTime,
            duration: rhythm.duration,
            intensity: intensity,
            progress: 0.0
        });
    }
    
    /**
     * Get event progress
     * @param {string} eventId - Event identifier
     * @returns {Object|null} Event data { progress, easedProgress, intensity, active }
     */
    getEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return null;
        
        return {
            progress: event.progress,
            easedProgress: this.getEventEasing(event.name, event.progress),
            intensity: event.intensity,
            active: event.progress < 1.0
        };
    }
    
    /**
     * Update active events
     * @param {number} deltaTime - Time since last frame
     */
    updateEvents(deltaTime) {
        const now = this.globalTime;
        const expiredEvents = [];
        
        for (const [id, event] of this.activeEvents) {
            event.progress = (now - event.startTime) / event.duration;
            
            if (event.progress >= 1.0) {
                event.progress = 1.0;
                expiredEvents.push(id);
            }
        }
        
        // Remove expired events
        for (const id of expiredEvents) {
            this.activeEvents.delete(id);
        }
    }
    
    /**
     * Set global breath mode
     * @param {string} mode - Breath mode name (BREATH_SLOW, BREATH_MEDIUM, BREATH_FAST)
     */
    setBreathMode(mode) {
        if (!this.RHYTHMS[mode]) {
            console.warn(`[ATOMARhythmAuthority] Unknown breath mode: ${mode}`);
            return;
        }
        this.currentState.breathMode = mode;
    }
    
    /**
     * Set global flow mode
     * @param {string} mode - Flow mode name (FLOW_RELAXED, FLOW_ACTIVE, FLOW_STRESSED)
     */
    setFlowMode(mode) {
        if (!this.RHYTHMS[mode]) {
            console.warn(`[ATOMARhythmAuthority] Unknown flow mode: ${mode}`);
            return;
        }
        this.currentState.flowMode = mode;
    }
    
    /**
     * Set stress level (modulates rhythms)
     * @param {number} level - Stress level (0-1)
     */
    setStressLevel(level) {
        this.currentState.stressLevel = Math.max(0, Math.min(1, level));
        
        // Auto-switch breath mode based on stress
        if (level > 0.7) {
            this.setBreathMode('BREATH_FAST');
            this.setFlowMode('FLOW_STRESSED');
        } else if (level > 0.3) {
            this.setBreathMode('BREATH_MEDIUM');
            this.setFlowMode('FLOW_ACTIVE');
        } else {
            this.setBreathMode('BREATH_SLOW');
            this.setFlowMode('FLOW_RELAXED');
        }
    }
    
    /**
     * Set harmony level (modulates rhythms)
     * @param {number} level - Harmony level (0-1)
     */
    setHarmonyLevel(level) {
        this.currentState.harmonyLevel = Math.max(0, Math.min(1, level));
        
        // Harmony counters stress
        const effectiveStress = this.currentState.stressLevel * (1.0 - level * 0.5);
        this.setStressLevel(effectiveStress);
    }
    
    /**
     * Get current stress level
     * @returns {number} Stress level (0-1)
     */
    getStressLevel() {
        return this.currentState.stressLevel;
    }
    
    /**
     * Get current harmony level
     * @returns {number} Harmony level (0-1)
     */
    getHarmonyLevel() {
        return this.currentState.harmonyLevel;
    }
    
    /**
     * Get random value within lifetime range
     * @param {string} rhythmName - Rhythm name (SPARK_LIFETIME, etc.)
     * @returns {number} Random lifetime
     */
    getRandomLifetime(rhythmName) {
        const rhythm = this.RHYTHMS[rhythmName];
        if (!rhythm) {
            console.warn(`[ATOMARhythmAuthority] Unknown rhythm: ${rhythmName}`);
            return 1.0;
        }
        
        return rhythm.min + Math.random() * (rhythm.max - rhythm.min);
    }
    
    /**
     * Get orbit configuration
     * @param {string} mode - Orbit mode (ORBIT_SLOW, ORBIT_MEDIUM, ORBIT_FAST)
     * @returns {Object} { period, count }
     */
    getOrbitConfig(mode) {
        const rhythm = this.RHYTHMS[mode];
        if (!rhythm) {
            console.warn(`[ATOMARhythmAuthority] Unknown orbit mode: ${mode}`);
            return { period: 6.0, count: 5 };
        }
        
        return {
            period: rhythm.period,
            count: rhythm.count
        };
    }
    
    /**
     * Remove phase offset for a system
     * @param {string} systemId - System identifier
     */
    removePhaseOffset(systemId) {
        this.phaseOffsets.delete(systemId);
    }
    
    /**
     * Clear all phase offsets (reset)
     */
    clearAllPhaseOffsets() {
        this.phaseOffsets.clear();
    }
    
    /**
     * Get system status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            globalTime: this.globalTime.toFixed(3),
            deltaTime: this.deltaTime.toFixed(5),
            breathMode: this.currentState.breathMode,
            flowMode: this.currentState.flowMode,
            stressLevel: this.currentState.stressLevel.toFixed(3),
            harmonyLevel: this.currentState.harmonyLevel.toFixed(3),
            activePhases: this.stats.activePhases,
            activeEvents: this.stats.activeEvents,
            lastUpdateTime: this.stats.lastUpdateTime.toFixed(2) + 'ms'
        };
    }
    
    /**
     * Export rhythm definitions for documentation
     * @returns {Object} Rhythm data
     */
    exportRhythms() {
        return {
            rhythms: this.RHYTHMS,
            easing: Object.keys(this.EASING),
            systemPhases: this.SYSTEM_PHASES
        };
    }
    
    /**
     * Dispose rhythm authority
     */
    dispose() {
        this.phaseOffsets.clear();
        this.activeEvents.clear();
        console.log('[ATOMARhythmAuthority] Disposed');
    }
}