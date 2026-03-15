/**
 * WaveBurstRouter_v1.js
 * ============================================================================
 * EVENT-DRIVEN WAVE BURST ROUTER
 * 
 * Purpose:
 * Automatically triggers wave bursts in WaveInterferenceEngine_v1 based on
 * existing system events, making wave effects visible without manual intervention.
 * 
 * Architecture:
 * - Listens to semantic bus events (synergy, cascade, corruption, interaction)
 * - Applies cooldown between bursts (1.5s)
 * - Clamps burst intensity to 0-1 range
 * - Adds subtle RNG jitter to burst origin
 * - Zero console spam, silent operation
 * 
 * Integration:
 * - Requires: game.waveInterferenceEngine (WaveInterferenceEngine_v1)
 * - Requires: game.semanticBus (SemanticEventBus)
 * - Optional: game.aiNodes (for node metrics)
 * - Optional: game.harmonicHubSystem (for cascade events)
 * 
 * @author ATOMA Architect
 * @version 1.0.0
 */

import * as THREE from 'three';

/**
 * Setup wave burst router
 * @param {Object} game - Main game instance
 * @returns {Object} Router instance with update() method
 */
export function setupWaveBurstRouter(game) {
    // Configuration
    const config = {
        cooldownSeconds: 1.5,           // Minimum time between bursts
        maxBurstIntensity: 1.0,        // Clamp burst intensity
        originJitter: 0.3,              // Random position jitter (units)
        enableDebug: false,               // Console logging (default off)
        
        // Event thresholds
        synergyThreshold: 0.7,            // Min synergy to trigger burst
        corruptionThreshold: 0.5,         // Min corruption to trigger burst
        probeIntensity: 0.4,              // User interaction burst intensity
        
        // Intensity multipliers
        synergyIntensityMult: 1.0,        // Synergy burst intensity multiplier
        cascadeIntensityMult: 0.8,         // Cascade burst intensity multiplier
        corruptionIntensityMult: 1.0,      // Corruption burst intensity multiplier
    };
    
    // Runtime state
    const state = {
        lastBurstTime: 0,               // Last burst timestamp
        accumulatedTime: 0,               // Time accumulator for update
        rngSeed: Math.random() * 10000,   // RNG seed for jitter
    };
    
    // Cache references
    const waveEngine = game.waveInterferenceEngine;
    const semanticBus = game.semanticBus;
    const aiNodes = game.aiNodes;
    const harmonicHubSystem = game.harmonicHubSystem;

    function findNodeById(nodeId) {
        if (!nodeId || !aiNodes?.nodes) return null;
        return aiNodes.nodes.find((n) =>
            n?.id === nodeId ||
            n?.uuid === nodeId ||
            n?.userData?.nodeId === nodeId
        ) || null;
    }
    
    /**
     * Check if burst can be triggered (cooldown check)
     * @param {number} currentTime - Current time in seconds
     * @returns {boolean} True if burst can be triggered
     */
    function canTriggerBurst(currentTime) {
        return (currentTime - state.lastBurstTime) >= config.cooldownSeconds;
    }
    
    /**
     * Add random jitter to position
     * @param {THREE.Vector3} origin - Original position
     * @returns {THREE.Vector3} Position with jitter applied
     */
    function applyJitter(origin) {
        if (!origin) return new THREE.Vector3(0, 0, 0);
        
        // Simple RNG using seed
        state.rngSeed = (state.rngSeed * 9301 + 49297) % 233280;
        const rng = state.rngSeed / 233280;
        
        return new THREE.Vector3(
            origin.x + (rng - 0.5) * config.originJitter,
            origin.y + (rng - 0.5) * config.originJitter,
            origin.z + (rng - 0.5) * config.originJitter
        );
    }
    
    /**
     * Emit wave burst intent
     * @param {Object} burstData - Burst configuration
     */
    function emitBurst(burstData) {
        if (!waveEngine || typeof waveEngine.requestBurstIntent !== 'function') {
            return;
        }
        
        // Clamp intensity
        const intensity = Math.max(0, Math.min(config.maxBurstIntensity, burstData.intensity));
        if (intensity <= 0.01) {
            return; // Too weak, skip
        }
        
        // Apply jitter to origin
        const origin = applyJitter(burstData.origin);
        
        // Build burst intent
        const intent = {
            type: burstData.type || 'harmonic',
            origin: {
                x: origin.x,
                y: origin.y,
                z: origin.z
            },
            intensity: intensity
        };
        
        // Trigger burst
        waveEngine.requestBurstIntent(intent);
        
        // Update last burst time
        state.lastBurstTime = performance.now() * 0.001;
        
        if (config.enableDebug) {
            console.log(`[WaveBurstRouter] Burst emitted: type=${intent.type}, intensity=${intensity.toFixed(2)}`);
        }
    }

    /**
     * Public-style router entry to reuse existing burst mechanism.
     * @param {Object} intentPayload - Burst intent payload
     */
    function requestBurstIntent(intentPayload = {}) {
        emitBurst({
            type: intentPayload.type || 'harmonic',
            origin: intentPayload.origin || new THREE.Vector3(0, 0, 0),
            intensity: Number.isFinite(intentPayload.intensity) ? intentPayload.intensity : 0
        });
    }
    
    /**
     * Handle synergy event
     * @param {Object} payload - Event payload
     */
    function handleSynergyEvent(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }
        
        const nodeId = payload.nodeId || payload.id;
        const node = findNodeById(nodeId);
        const synergyFromPayload = Number.isFinite(payload?.value) ? payload.value : null;
        const synergyFromNode = node?.userData?.metrics?.synergy ?? node?.metrics?.synergy;
        const synergy = synergyFromPayload ?? synergyFromNode ?? 0;

        if (!node || synergy < config.synergyThreshold) {
            return;
        }
        
        emitBurst({
            type: 'harmonic',
            origin: node.position || new THREE.Vector3(0, 0, 0),
            intensity: synergy * config.synergyIntensityMult
        });
    }
    
    /**
     * Handle cascade event
     * @param {Object} payload - Event payload
     */
    function handleCascadeEvent(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }
        
        const nodeId = payload.nodeId || payload.hubId || payload.id;
        if (!nodeId) {
            return;
        }
        
        // Try to get node position from various sources
        let position = new THREE.Vector3(0, 0, 0);
        
        if (aiNodes && aiNodes.nodes) {
            const node = aiNodes.nodes.find(n => n.id === nodeId);
            if (node && node.position) {
                position = node.position;
            }
        } else if (harmonicHubSystem && harmonicHubSystem.hubs) {
            const hub = harmonicHubSystem.hubs.get(nodeId);
            if (hub && hub.position) {
                position = hub.position;
            }
        }
        
        emitBurst({
            type: 'cascade',
            origin: position,
            intensity: config.cascadeIntensityMult
        });
    }
    
    /**
     * Handle corruption/failure event
     * @param {Object} payload - Event payload
     */
    function handleCorruptionEvent(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }
        
        const nodeId = payload.nodeId || payload.id;
        const node = findNodeById(nodeId);
        if (!node) {
            return;
        }
        
        // Check corruption threshold
        const corruption = (Number.isFinite(payload?.value) ? payload.value : null)
            ?? node?.userData?.metrics?.corruption
            ?? node?.metrics?.corruption
            ?? 0;
        if (corruption < config.corruptionThreshold) {
            return;
        }
        
        emitBurst({
            type: 'destructive',
            origin: node.position || new THREE.Vector3(0, 0, 0),
            intensity: corruption * config.corruptionIntensityMult
        });
    }
    
    /**
     * Handle user interaction (debug)
     * @param {Object} payload - Event payload
     */
    function handleUserInteraction(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }
        
        const nodeId = payload.nodeId || payload.id;
        if (!nodeId) {
            return;
        }
        
        // Try to get node position
        let position = new THREE.Vector3(0, 0, 0);
        
        if (aiNodes && aiNodes.nodes) {
            const node = aiNodes.nodes.find(n => n.id === nodeId);
            if (node && node.position) {
                position = node.position;
            }
        }
        
        emitBurst({
            type: 'probe',
            origin: position,
            intensity: config.probeIntensity
        });
    }

    function handleSynergyCascadeGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'synergyCascade',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'harmonic'
        });
    }

    function handleInstabilityTrapGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'instabilityTrap',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'chaotic'
        });
    }

    function handleLoadCollapseGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'loadCollapse',
            intensity: Number.isFinite(payload?.load) ? payload.load : 0,
            regime: 'stress'
        });
    }
    
    /**
     * Subscribe to semantic bus events
     */
    function subscribeToEvents() {
        if (!semanticBus) {
            return;
        }
        
        // Synergy events
        semanticBus.subscribe('node.synergy.high', handleSynergyEvent, {
            priority: semanticBus.priority.NORMAL
        });
        semanticBus.subscribe('metric:synergySpike', handleSynergyEvent, {
            priority: semanticBus.priority.NORMAL
        });
        
        // Cascade events
        semanticBus.subscribe('cascade.triggered', handleCascadeEvent, {
            priority: semanticBus.priority.NORMAL
        });
        semanticBus.subscribe('harmonic.cascade.start', handleCascadeEvent, {
            priority: semanticBus.priority.NORMAL
        });
        semanticBus.subscribe('link:created', handleCascadeEvent, {
            priority: semanticBus.priority.NORMAL
        });
        
        // Corruption/failure events
        semanticBus.subscribe('node.corruption.high', handleCorruptionEvent, {
            priority: semanticBus.priority.NORMAL
        });
        semanticBus.subscribe('node.failure', handleCorruptionEvent, {
            priority: semanticBus.priority.INTERACTIVE
        });
        semanticBus.subscribe('metric:corruptionRise', handleCorruptionEvent, {
            priority: semanticBus.priority.NORMAL
        });
        semanticBus.subscribe('network:corruptionSpread', handleCorruptionEvent, {
            priority: semanticBus.priority.INTERACTIVE
        });
        semanticBus.subscribe('link:collapsed', handleCorruptionEvent, {
            priority: semanticBus.priority.INTERACTIVE
        });
        
        // User interaction (debug)
        semanticBus.subscribe('node.hover', handleUserInteraction, {
            priority: semanticBus.priority.INTERACTIVE
        });
        semanticBus.subscribe('node.click', handleUserInteraction, {
            priority: semanticBus.priority.INTERACTIVE
        });
        semanticBus.subscribe('node:selected', handleUserInteraction, {
            priority: semanticBus.priority.INTERACTIVE
        });

        globalThis.semanticBus?.on?.('event:synergyCascade', handleSynergyCascadeGameplay);
        globalThis.semanticBus?.on?.('event:instabilityTrap', handleInstabilityTrapGameplay);
        globalThis.semanticBus?.on?.('event:loadCollapse', handleLoadCollapseGameplay);
    }
    
    /**
     * Update router (called every frame)
     * @param {number} deltaTime - Frame delta time in seconds
     */
    function update(deltaTime) {
        // Accumulate time for cooldown tracking
        state.accumulatedTime += deltaTime;
        
        // No per-frame processing needed
        // All burst triggers are event-driven
    }
    
    /**
     * Get router status (for debugging)
     * @returns {Object} Status object
     */
    function getStatus() {
        const currentTime = performance.now() * 0.001;
        const cooldownRemaining = Math.max(0, config.cooldownSeconds - (currentTime - state.lastBurstTime));
        
        return {
            lastBurstTime: state.lastBurstTime,
            cooldownRemaining: cooldownRemaining,
            canTrigger: cooldownRemaining <= 0,
            accumulatedTime: state.accumulatedTime,
            config: { ...config }
        };
    }
    
    /**
     * Enable/disable debug mode
     * @param {boolean} enabled - Debug mode state
     */
    function setDebugMode(enabled) {
        config.enableDebug = enabled;
    }
    
    /**
     * Update configuration
     * @param {Object} newConfig - Configuration updates
     */
    function updateConfig(newConfig) {
        Object.assign(config, newConfig);
    }
    
    /**
     * Dispose router (cleanup)
     */
    function dispose() {
        // Unsubscribe from semantic bus events
        if (semanticBus) {
            semanticBus.unsubscribe('node.synergy.high', handleSynergyEvent);
            semanticBus.unsubscribe('metric:synergySpike', handleSynergyEvent);
            semanticBus.unsubscribe('cascade.triggered', handleCascadeEvent);
            semanticBus.unsubscribe('harmonic.cascade.start', handleCascadeEvent);
            semanticBus.unsubscribe('link:created', handleCascadeEvent);
            semanticBus.unsubscribe('node.corruption.high', handleCorruptionEvent);
            semanticBus.unsubscribe('node.failure', handleCorruptionEvent);
            semanticBus.unsubscribe('metric:corruptionRise', handleCorruptionEvent);
            semanticBus.unsubscribe('network:corruptionSpread', handleCorruptionEvent);
            semanticBus.unsubscribe('link:collapsed', handleCorruptionEvent);
            semanticBus.unsubscribe('node.hover', handleUserInteraction);
            semanticBus.unsubscribe('node.click', handleUserInteraction);
            semanticBus.unsubscribe('node:selected', handleUserInteraction);
        }
        globalThis.semanticBus?.unsubscribe?.('event:synergyCascade', handleSynergyCascadeGameplay);
        globalThis.semanticBus?.unsubscribe?.('event:instabilityTrap', handleInstabilityTrapGameplay);
        globalThis.semanticBus?.unsubscribe?.('event:loadCollapse', handleLoadCollapseGameplay);
    }
    
    // Initialize
    subscribeToEvents();
    
    // Return router interface
    return {
        update,
        getStatus,
        setDebugMode,
        updateConfig,
        requestBurstIntent,
        dispose
    };
}
