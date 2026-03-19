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
        ambientIntervalSeconds: 5.0,
        ambientIntensity: 0.15,
        ambientMaxIntensity: 0.2
    };
    
    // Runtime state
    const state = {
        lastBurstTime: 0,               // Last burst timestamp
        lastCascadeBurstTime: 0,
        accumulatedTime: 0,               // Time accumulator for update
        ambientTimer: 0,
        rngSeed: Math.random() * 10000,   // RNG seed for jitter
        subscribed: false,
        burstCounter: 0,
        unsubscribers: []
    };
    
    function getWaveEngine() {
        return game.waveInterferenceEngine || null;
    }

    function getSemanticBus() {
        return game.semanticBus || globalThis?.semanticBus || null;
    }

    function getAiNodes() {
        return game.aiNodes || null;
    }

    function getHarmonicHubSystem() {
        return game.harmonicHubSystem || null;
    }

    const TYPE_MAP = {
        cascade: 'synergy',
        destructive: 'corruption',
        probe: 'harmonic',
        harmonic: 'harmonic',
        synergy: 'synergy',
        corruption: 'corruption',
        ambient: 'harmonic',
        ambientwave: 'harmonic'
    };

    const REGIME_MAP = {
        harmonic: 'coherent',
        synergy: 'collaborative',
        corruption: 'rupture'
    };

    function findNodeById(nodeId) {
        const aiNodes = getAiNodes();
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

    function normalizeBurstType(type) {
        const key = `${type || ''}`.toLowerCase();
        return TYPE_MAP[key] || null;
    }

    function resolveToRegime(mappedType) {
        return REGIME_MAP[mappedType] || 'coherent';
    }

    function resolveSourceId(mappedType, burstData = {}) {
        if (burstData.sourceId) return String(burstData.sourceId);
        const explicitNodeId = burstData.metadata?.nodeId || burstData.metadata?.sourceNodeId || burstData.metadata?.targetNodeId;
        if (explicitNodeId) return `${mappedType}:${explicitNodeId}`;
        return `${mappedType}:router:${++state.burstCounter}`;
    }
    
    /**
     * Emit wave burst intent
     * @param {Object} burstData - Burst configuration
     */
    function emitBurst(burstData) {
        const waveEngine = getWaveEngine();
        if (!waveEngine || typeof waveEngine.requestBurstIntent !== 'function') {
            return;
        }

        const mappedType = normalizeBurstType(burstData.type);
        if (!mappedType) {
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
            type: mappedType,
            fromRegime: 'baseline',
            toRegime: resolveToRegime(mappedType),
            sourceId: resolveSourceId(mappedType, burstData),
            center: {
                x: origin.x,
                y: origin.y,
                z: origin.z
            },
            intensity: intensity,
            metadata: burstData.metadata || undefined
        };
        
        // Trigger burst
        const snapshot = waveEngine.requestBurstIntent(intent);
        if (!snapshot) return;

        // Update last burst time only when request is accepted.
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
        const payloadCenter =
            intentPayload.center ||
            intentPayload.origin ||
            intentPayload.originPosition ||
            intentPayload.position;

        emitBurst({
            type: intentPayload.type || 'harmonic',
            origin: payloadCenter || new THREE.Vector3(0, 0, 0),
            intensity: Number.isFinite(intentPayload.intensity) ? intentPayload.intensity : 0,
            sourceId: intentPayload.sourceId,
            metadata: intentPayload.metadata
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
        const waveEngine = getWaveEngine();
        const aiNodes = getAiNodes();
        const harmonicHubSystem = getHarmonicHubSystem();

        const packetLink = payload?.link || null;
        const packetLinkId = payload?.linkId || packetLink?.id || packetLink?.uuid || null;
        const packetSourceNode = packetLink?.source || packetLink?.sourceNode || payload?.sourceNode || null;
        const packetTargetNode = packetLink?.target || packetLink?.targetNode || payload?.targetNode || null;
        const packetNodeId = payload?.nodeId || payload?.hubId || payload?.id || null;
        const packetCenter = payload?.position || packetLink?.midpoint || packetSourceNode?.position || { x: 0, y: 0, z: 0 };
        const packetEnergy = Number.isFinite(payload?.strength)
            ? payload.strength
            : (Number.isFinite(payload?.intensity) ? payload.intensity : config.cascadeIntensityMult);
        waveEngine?.requestBurstIntent?.({
            type: 'cascade_packet',
            sourceId: `cascade_packet:${packetNodeId ?? 'global'}`,
            fromRegime: 'baseline',
            toRegime: 'collaborative',
            center: packetCenter,
            linkId: packetLinkId,
            sourceNode: packetSourceNode,
            targetNode: packetTargetNode,
            originNode: packetNodeId,
            energy: packetEnergy,
            travel: true,
            metadata: { source: 'cascadePacket' }
        });

        const now = performance.now() * 0.001;
        if (!canTriggerBurst(now)) {
            return;
        }
        if (state.lastCascadeBurstTime && (now - state.lastCascadeBurstTime) < 0.12) {
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
        state.lastCascadeBurstTime = now;
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
        const aiNodes = getAiNodes();
        
        // Check corruption threshold
        const corruption = (Number.isFinite(payload?.value) ? payload.value : null)
            ?? node?.userData?.metrics?.corruption
            ?? node?.metrics?.corruption
            ?? 0;
        if (corruption < config.corruptionThreshold) {
            return;
        }

        const payloadPos = payload?.position || payload?.origin || payload?.center || null;
        const fallbackNode = node || aiNodes?.nodes?.[0] || null;
        const origin = payloadPos
            ? (payloadPos instanceof THREE.Vector3
                ? payloadPos
                : new THREE.Vector3(payloadPos.x || 0, payloadPos.y || 0, payloadPos.z || 0))
            : (fallbackNode?.position || new THREE.Vector3(0, 0, 0));
        
        emitBurst({
            type: 'destructive',
            origin,
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
        const aiNodes = getAiNodes();
        
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
            type: 'synergy',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'harmonic'
        });
    }

    function handleHarmonyResonanceGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'harmonic',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'harmonic'
        });
    }

    function handleCorruptionOutbreakGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'corruption',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'chaotic'
        });
    }

    function handleInstabilityTrapGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'corruption',
            intensity: Number.isFinite(payload?.value) ? payload.value : 0,
            regime: 'chaotic'
        });
    }

    function handleLoadCollapseGameplay(payload) {
        if (!canTriggerBurst(performance.now() * 0.001)) {
            return;
        }

        requestBurstIntent({
            type: 'corruption',
            intensity: Number.isFinite(payload?.load) ? payload.load : 0,
            regime: 'stress'
        });
    }
    
    /**
     * Subscribe to semantic bus events
     */
    function subscribeToEvents() {
        const semanticBus = getSemanticBus();
        if (!semanticBus || state.subscribed) {
            return false;
        }

        const subscribeFn =
            (typeof semanticBus.subscribe === 'function' && semanticBus.subscribe.bind(semanticBus)) ||
            (typeof semanticBus.on === 'function' && semanticBus.on.bind(semanticBus)) ||
            null;
        const unsubscribeFn =
            (typeof semanticBus.unsubscribe === 'function' && semanticBus.unsubscribe.bind(semanticBus)) ||
            (typeof semanticBus.off === 'function' && semanticBus.off.bind(semanticBus)) ||
            null;
        if (!subscribeFn) return false;

        const addSubscription = (tag, handler, priority) => {
            subscribeFn(tag, handler, { priority });
            if (unsubscribeFn) {
                state.unsubscribers.push(() => unsubscribeFn(tag, handler));
            }
        };
        
        // Synergy events
        addSubscription('node.synergy.high', handleSynergyEvent, semanticBus.priority?.NORMAL);
        addSubscription('metric:synergySpike', handleSynergyEvent, semanticBus.priority?.NORMAL);
        addSubscription('link:synergyThreshold', handleSynergyEvent, semanticBus.priority?.NORMAL);
        
        // Cascade events
        addSubscription('cascade.triggered', handleCascadeEvent, semanticBus.priority?.NORMAL);
        addSubscription('harmonic.cascade.start', handleCascadeEvent, semanticBus.priority?.NORMAL);
        addSubscription('link.created', handleCascadeEvent, semanticBus.priority?.NORMAL);
        addSubscription('cascade.start', handleCascadeEvent, semanticBus.priority?.NORMAL);
        addSubscription('cascade.hop', handleCascadeEvent, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('cascade.end', handleCascadeEvent, semanticBus.priority?.NORMAL);
        
        // Corruption/failure events
        addSubscription('node.corruption.high', handleCorruptionEvent, semanticBus.priority?.NORMAL);
        addSubscription('node.failure', handleCorruptionEvent, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('metric:corruptionRise', handleCorruptionEvent, semanticBus.priority?.NORMAL);
        addSubscription('network:corruptionSpread', handleCorruptionEvent, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('link:collapsed', handleCorruptionEvent, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        
        // User interaction (debug)
        addSubscription('node.hover', handleUserInteraction, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('node.click', handleUserInteraction, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('node:selected', handleUserInteraction, semanticBus.priority?.INTERACTIVE ?? semanticBus.priority?.NORMAL);
        addSubscription('event:synergyCascade', handleSynergyCascadeGameplay, semanticBus.priority?.NORMAL);
        addSubscription('event:harmonyResonance', handleHarmonyResonanceGameplay, semanticBus.priority?.NORMAL);
        addSubscription('event:corruptionOutbreak', handleCorruptionOutbreakGameplay, semanticBus.priority?.NORMAL);
        addSubscription('event:instabilityTrap', handleInstabilityTrapGameplay, semanticBus.priority?.NORMAL);
        addSubscription('event:loadCollapse', handleLoadCollapseGameplay, semanticBus.priority?.NORMAL);

        state.subscribed = true;
        return true;
    }
    
    /**
     * Update router (called every frame)
     * @param {number} deltaTime - Frame delta time in seconds
     */
    function update(deltaTime) {
        if (!state.subscribed) {
            subscribeToEvents();
        }

        // Accumulate time for cooldown tracking
        state.accumulatedTime += deltaTime;
        state.ambientTimer += deltaTime;

        if (state.ambientTimer >= 2.0) {
            state.ambientTimer = 0;
            requestBurstIntent({
                type: 'ambient',
                intensity: Math.min(config.ambientIntensity, config.ambientMaxIntensity),
                origin: new THREE.Vector3(0, 0, 0),
                sourceId: 'ambient',
                metadata: { phase: Math.random(), source: 'ambient' }
            });
        }
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
        for (const unsubscribe of state.unsubscribers) {
            try {
                unsubscribe();
            } catch (_err) {
                // no-op
            }
        }
        state.unsubscribers = [];
        state.subscribed = false;
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
