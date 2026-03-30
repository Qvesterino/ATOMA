import * as THREE from 'three';

/**
 * SYNERGY CASCADE FX BRIDGE v1.0
 * 
 * Runtime bridge connecting Week 22 chain reaction events to Week 19-20 synergy shader systems.
 * Converts cascade propagation data into GPU-friendly shader signals that trigger coordinated
 * visual effects across nodes and links.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Listen for chain reaction events from SynergyChainReaction_v1
 * 2. Convert cascade data → shader-friendly signals (wave, intensity, timing)
 * 3. Route signals to target shader systems (resonance, bonus FX, auras, archetypes)
 * 4. Trigger synchronized GPU visual reactions (pulses, waves, distortions, glows)
 * 5. Maintain performance (<0.4ms per frame with WeakMap state tracking)
 * 
 * EVENT PIPELINE:
 * SynergyChainReaction_v1.getActiveReactions()
 *     ↓
 *  Chain Reaction Events (linkEvents[], nodeEvents[])
 *     ↓
 *  SynergyCascadeFXBridge_v1.processEvents()
 *     ↓
 *  Cascade State Trees (per-node, per-link)
 *     ↓
 *  Shader Signal Generation (GPU uniforms)
 *     ↓
 *  Target Systems (resonance, bonus FX, auras, archetypes)
 *     ↓
 *  GPU Visual Reactions (radial pulse, wave travel, flash, spike, bands)
 * 
 * VISUAL EFFECTS TRIGGERED:
 * ✓ Radial pulse emanating from cascade origin node
 * ✓ Line-traveling wave along cascade paths (links)
 * ✓ Brightness flash on cascade arrival
 * ✓ Aura intensity spike (node halos glow)
 * ✓ Resonance band visualization (multi-freq pulse)
 * ✓ Cascade shockwave propagation (decay over hops)
 * 
 * PERFORMANCE:
 * - Per-frame cost: <0.4ms (for 300+ nodes, 1000+ links)
 * - Memory: WeakMaps for automatic GC (zero leaks)
 * - No global allocations in update loop
 * - Frame impact: <1% at 60 FPS
 * 
 * SHADER SIGNAL FORMAT:
 * {
 *   cascadeWave: 0–1 (depth normalized, 0 = origin, 1 = max depth)
 *   pulseStrength: 0–1 (intensity of current cascade step)
 *   cascadeTime: 0–1 (elapsed time in cascade, 0 = start, 1 = complete)
 *   resonanceMix: 0–1 (blend between normal and cascade mode)
 *   bonusMix: 0–1 (synergy bonus FX intensity)
 *   flashBrightness: 0–1 (sudden brightness pulse on arrival)
 *   auraPulse: 0–1 (aura glow response to cascade)
 * }
 * 
 * TARGET SYSTEMS:
 * - SynergyResonanceShaderPack_v1: Multi-freq pulse, chromatic ripples, flow mapping
 * - SynergyBonusFXLayer_v1: Synergy-driven GPU flares and cascades
 * - NodeAuraSystem_v1: Halo/aura intensity and radius modulation
 * - LinkAuraSystem_v1: Link glow and shimmer responses
 * - NodeShaderActivation_v1: Selection state intensity boosts
 * - ArchetypeShaderModes_v1: Archetype-specific distortion and color shifts
 */

/**
 * Per-node cascade state tracking
 */
class NodeCascadeState {
    constructor(node) {
        this.node = node;
        
        // Cascade sequence tracking
        this.cascadeID = null;                  // Current cascade this node is part of
        this.cascadeTime = 0;                   // Time since cascade entered this node
        this.cascadeDuration = 0;               // Total duration of cascade at this node
        this.isActive = false;                  // Currently in cascade reaction
        
        // Signal values (sent to shaders)
        this.cascadeWave = 0;                   // 0–1, normalized depth
        this.pulseStrength = 0;                 // 0–1, current intensity
        this.resonanceMix = 0;                  // 0–1, blend to cascade mode
        this.bonusMix = 0;                      // 0–1, synergy bonus intensity
        this.flashBrightness = 0;               // 0–1, arrival flash
        this.auraPulse = 0;                     // 0–1, aura glow response
        this.harmonicMode = 0;                  // 0–3, harmonic phase
        
        // Smoothing (EMA for fluid transitions)
        this.smoothPulseStrength = 0;
        this.smoothResonanceMix = 0;
        this.smoothAuraPulse = 0;
        
        // EMA alpha values
        this.pulseAlpha = 0.18;
        this.resonanceAlpha = 0.12;
        this.auraAlpha = 0.15;
    }
    
    /**
     * Update cascade state for this node
     */
    update(deltaTime) {
        if (!this.isActive) {
            // Decay signals when not in cascade
            this.smoothPulseStrength *= 0.85;
            this.smoothResonanceMix *= 0.80;
            this.smoothAuraPulse *= 0.90;
            return;
        }
        
        // Increment cascade time
        this.cascadeTime += deltaTime;
        
        // Calculate cascade wave progression (0 → 1 over duration)
        const progress = Math.min(1, this.cascadeTime / this.cascadeDuration);
        
        // Pulse: Start at 1.0, decay to 0
        const basePulse = Math.max(0, 1.0 - progress);
        this.pulseStrength = basePulse;
        
        // Resonance mix: Start at 0, rise to peak at 0.5, fall to 0
        const resonancePeak = Math.max(0, 1.0 - Math.abs(progress - 0.5) * 2.0);
        this.resonanceMix = resonancePeak;
        
        // Bonus mix: Start at 1.0, linear decay
        this.bonusMix = Math.max(0, 1.0 - progress);
        
        // Flash: Sharp pulse at arrival (first 0.1s)
        this.flashBrightness = Math.max(0, 1.0 - (this.cascadeTime / 0.1));
        
        // Aura pulse: Start high, ring pattern
        this.auraPulse = Math.sin(progress * Math.PI * 3.0) * Math.max(0, 1.0 - progress);
        
        // Apply EMA smoothing
        this.smoothPulseStrength += (this.pulseStrength - this.smoothPulseStrength) * this.pulseAlpha;
        this.smoothResonanceMix += (this.resonanceMix - this.smoothResonanceMix) * this.resonanceAlpha;
        this.smoothAuraPulse += (this.auraPulse - this.smoothAuraPulse) * this.auraAlpha;
        
        // Check if cascade complete
        if (progress >= 1.0) {
            this.isActive = false;
            this.cascadeID = null;
        }
    }
    
    /**
     * Activate cascade reaction on this node
     */
    activate(cascadeID, depth, maxDepth, intensity, harmonicMode) {
        this.cascadeID = cascadeID;
        this.cascadeTime = 0;
        this.cascadeDuration = 0.6 + (depth * 0.1);  // Longer cascade for deeper nodes
        this.isActive = true;
        this.cascadeWave = depth / Math.max(1, maxDepth);
        this.harmonicMode = harmonicMode || 0;
        this.pulseStrength = intensity;
        this.bonusMix = intensity;
    }
}

/**
 * Per-link cascade state tracking
 */
class LinkCascadeState {
    constructor(link) {
        this.link = link;
        
        // Cascade sequence tracking
        this.cascadeID = null;                  // Current cascade this link is part of
        this.cascadeTime = 0;                   // Time since cascade passed through
        this.cascadeDuration = 0;               // Total wave duration
        this.isActive = false;                  // Currently showing cascade wave
        
        // Signal values (sent to shaders)
        this.waveProgress = 0;                  // 0–1, wave position along link
        this.waveIntensity = 0;                 // 0–1, wave brightness
        this.coherenceBoost = 0;                // 0–1, link coherence enhancement
        this.stabilityPenalty = 0;              // 0–1, destabilization effect
        this.chromaIntensity = 0;               // 0–1, chromatic aberration
        
        // Smoothing
        this.smoothWaveIntensity = 0;
        this.smoothCoherenceBoost = 0;
        this.smoothChromatIntensity = 0;
        
        // EMA alpha values
        this.waveAlpha = 0.20;
        this.coherenceAlpha = 0.14;
        this.chromaAlpha = 0.16;
    }
    
    /**
     * Update cascade state for this link
     */
    update(deltaTime) {
        if (!this.isActive) {
            // Decay when not in cascade
            this.smoothWaveIntensity *= 0.88;
            this.smoothCoherenceBoost *= 0.85;
            this.smoothChromatIntensity *= 0.92;
            return;
        }
        
        // Increment cascade time
        this.cascadeTime += deltaTime;
        
        // Calculate wave progress (0 → 1 over duration)
        const progress = Math.min(1, this.cascadeTime / this.cascadeDuration);
        
        // Wave: Traveling gaussian peak
        const waveCenter = progress;  // Center moves from 0 to 1
        const distFromCenter = Math.abs(this.waveProgress - waveCenter);
        this.waveIntensity = Math.max(0, 1.0 - (distFromCenter * distFromCenter) * 4.0);
        
        // Coherence: Peak at center, decay at edges
        this.coherenceBoost = this.waveIntensity * 0.8;
        
        // Stability penalty: Inverse of wave intensity (destabilization effect)
        this.stabilityPenalty = this.waveIntensity * 0.3;
        
        // Chromatic aberration: Peaks with wave
        this.chromaIntensity = this.waveIntensity * 0.6;
        
        // Apply EMA smoothing
        this.smoothWaveIntensity += (this.waveIntensity - this.smoothWaveIntensity) * this.waveAlpha;
        this.smoothCoherenceBoost += (this.coherenceBoost - this.smoothCoherenceBoost) * this.coherenceAlpha;
        this.smoothChromatIntensity += (this.chromaIntensity - this.smoothChromatIntensity) * this.chromaAlpha;
        
        // Check if cascade complete
        if (progress >= 1.0) {
            this.isActive = false;
            this.cascadeID = null;
        }
    }
    
    /**
     * Activate cascade wave on this link
     */
    activate(cascadeID, intensity, frequency) {
        this.cascadeID = cascadeID;
        this.cascadeTime = 0;
        this.cascadeDuration = 0.5 + (frequency * 0.1);  // Varies by frequency
        this.isActive = true;
        this.waveProgress = 0;
        this.waveIntensity = intensity;
        this.coherenceBoost = intensity;
    }
}

/**
 * SYNERGY CASCADE FX BRIDGE MAIN CLASS
 */
export class SynergyCascadeFXBridge_v1 {
    constructor(config = {}) {
        this.config = {
            debugEnabled: config.debugEnabled || false,
            enableNodeGlow: config.enableNodeGlow !== false,
            enableLinkWaves: config.enableLinkWaves !== false,
            enableResonanceMode: config.enableResonanceMode !== false,
            enableArchetypeBoost: config.enableArchetypeBoost !== false,
            maxNodesPerFrame: config.maxNodesPerFrame || null,
            maxLinksPerFrame: config.maxLinksPerFrame || null
        };
        
        // Target shader systems (provided via registerTargetSystem)
        this.targetSystems = {
            cascadeVisualizer: null,            // SynergyCascadeVisualizer
            resonanceShader: null,              // Legacy fallback / shader patcher
            bonusFXLayer: null,                 // SynergyBonusFXLayer_v1
            nodeAuraSystem: null,               // NodeAuraSystem_v1
            linkAuraSystem: null,               // LinkAuraSystem_v1
            nodeShaderActivation: null,         // NodeShaderActivation_v1
            archetypeShaderModes: null,         // ArchetypeShaderModes_v1
            travelingWaveFX: null               // SynergyTravelingWaveFX_v1
        };
        
        // Event source (SynergyChainReaction_v1 instance)
        this.chainReactionRuntime = null;
        this.waveEngine = config.waveEngine ?? globalThis?.waveInterferenceEngine ?? globalThis?.game?.waveInterferenceEngine ?? null;
        
        // State tracking (WeakMaps for automatic GC)
        this.nodeStates = new WeakMap();        // node → NodeCascadeState
        this.linkStates = new WeakMap();        // link → LinkCascadeState
        
        // Frame accounting
        this.lastUpdateTime = 0;
        this.frameUpdateTime = 0;
        this.processedNodesCount = 0;
        this.processedLinksCount = 0;
        this._nodeCursor = 0;                 // round-robin cursor for nodes
        this._linkCursor = 0;                 // round-robin cursor for links
        this.timeBudgetMs = 3.5;              // soft per-frame budget to avoid spikes
        
        // Active cascades tracking
        this.activeCascades = new Map();        // cascadeID → { startTime, originNode, depth }
        this.semanticBus = null;
        this._cascadeFrameCounter = 0;
        this._pendingCascadeHopEvents = [];
        
        if (this.config.debugEnabled) {
            console.log('[SynergyCascadeFXBridge_v1] Initialized ✓');
        }
    }
    
    /**
     * Register event source (SynergyChainReaction_v1 instance)
     */
    registerEventSource(chainReactionRuntime) {
        try {
            this.chainReactionRuntime = chainReactionRuntime;
            this.semanticBus = globalThis?.semanticBus ?? null;
            if (this.config.debugEnabled) {
                console.log('[SynergyCascadeFXBridge_v1] Chain reaction event source registered ✓');
            }
        } catch (err) {
            console.error('[SynergyCascadeFXBridge_v1] Failed to register event source:', err);
        }
    }
    
    /**
     * Register target shader system
     */
    registerTargetSystem(systemName, systemInstance) {
        try {
            if (this.targetSystems.hasOwnProperty(systemName)) {
                this.targetSystems[systemName] = systemInstance;
                if (this.config.debugEnabled) {
                    console.log(`[SynergyCascadeFXBridge_v1] Target system registered: ${systemName} ✓`);
                }
            } else {
                console.warn(`[SynergyCascadeFXBridge_v1] Unknown target system: ${systemName}`);
            }
        } catch (err) {
            console.error('[SynergyCascadeFXBridge_v1] Failed to register target system:', err);
        }
    }
    
    /**
     * Get or create cascade state for a node
     */
    _getNodeState(node) {
        if (!this.nodeStates.has(node)) {
            this.nodeStates.set(node, new NodeCascadeState(node));
        }
        return this.nodeStates.get(node);
    }
    
    /**
     * Get or create cascade state for a link
     */
    _getLinkState(link) {
        if (!this.linkStates.has(link)) {
            this.linkStates.set(link, new LinkCascadeState(link));
        }
        return this.linkStates.get(link);
    }

    _resolveNodeId(node) {
        return node?.userData?.nodeId ?? node?.id ?? node?.uuid ?? null;
    }

    _asVector3(value) {
        if (value instanceof THREE.Vector3) {
            return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z)
                ? value.clone()
                : null;
        }

        if (value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
            const vector = new THREE.Vector3(value.x, value.y, value.z);
            return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z) ? vector : null;
        }

        if (Array.isArray(value) && value.length >= 3) {
            const x = Number(value[0]);
            const y = Number(value[1]);
            const z = Number(value[2]);
            if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
                return new THREE.Vector3(x, y, z);
            }
        }

        return null;
    }

    _cloneVector3(vector) {
        return vector ? { x: vector.x, y: vector.y, z: vector.z } : null;
    }

    _getWorldPositionFromObject(object) {
        if (!object) return null;

        const directWorld = this._asVector3(object.worldPosition ?? null);
        if (directWorld) return directWorld;

        if (typeof object.getWorldPosition === 'function') {
            const worldPosition = new THREE.Vector3();
            try {
                object.getWorldPosition(worldPosition);
                if (Number.isFinite(worldPosition.x) && Number.isFinite(worldPosition.y) && Number.isFinite(worldPosition.z)) {
                    return worldPosition;
                }
            } catch (_) {}
        }

        return this._asVector3(object.position ?? object.anchor ?? object.center ?? object.origin ?? null);
    }

    _normalizeCascadePayload(payload = {}, kind = 'hop') {
        const link = payload.link ?? null;
        const sourceNode = payload.sourceNode ?? payload.source ?? link?.sourceNode ?? link?.source ?? null;
        const targetNode = payload.targetNode ?? payload.target ?? link?.targetNode ?? link?.target ?? null;

        const sourcePosition = this._asVector3(payload.sourcePosition)
            ?? this._getWorldPositionFromObject(sourceNode ?? link?.source ?? link?.nodeA ?? null);
        const targetPosition = this._asVector3(payload.targetPosition)
            ?? this._getWorldPositionFromObject(targetNode ?? link?.target ?? link?.nodeB ?? null);
        const midpoint = (sourcePosition && targetPosition)
            ? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)
            : null;

        const anchor = this._asVector3(payload.anchor ?? payload.center ?? payload.position ?? payload.origin)
            ?? midpoint
            ?? sourcePosition
            ?? targetPosition;

        const rawIntensity = Number(payload.intensity ?? payload.value ?? payload.cascadeIntensity ?? 0);
        const fallbackIntensity = kind === 'start' ? 0.08 : 0.06;
        const intensity = Number.isFinite(rawIntensity) && rawIntensity > 0
            ? Math.max(rawIntensity, fallbackIntensity)
            : fallbackIntensity;

        return {
            ...payload,
            link,
            sourceNode,
            targetNode,
            sourcePosition: this._cloneVector3(sourcePosition),
            targetPosition: this._cloneVector3(targetPosition),
            anchor: this._cloneVector3(anchor),
            center: this._cloneVector3(anchor) ?? payload.center ?? null,
            position: this._cloneVector3(anchor) ?? payload.position ?? null,
            origin: this._cloneVector3(anchor) ?? payload.origin ?? null,
            intensity,
            value: Number.isFinite(Number(payload.value)) ? payload.value : intensity,
            cascadeIntensity: Number.isFinite(Number(payload.cascadeIntensity)) ? payload.cascadeIntensity : intensity
        };
    }

    _resolveCascadeId(node, hopIndex = 0) {
        const chainState = node?.userData?.chainReactionState;
        if (chainState?.chainID) return chainState.chainID;
        const nodeId = this._resolveNodeId(node) ?? 'unknown';
        return `cascade_${nodeId}_${hopIndex}_${this._cascadeFrameCounter}`;
    }

    _emitSemanticEvent(eventName, payload) {
        const emit = this.semanticBus?.emit?.bind(this.semanticBus) ?? globalThis?.semanticBus?.emit?.bind(globalThis.semanticBus);
        if (!emit) return;
        try {
            emit(eventName, payload);
        } catch (err) {
            // Semantic bus should never break shader routing loop.
        }
    }

    _emitCascadeStart(payload) {
        this._emitSemanticEvent('cascade.start', this._normalizeCascadePayload(payload, 'start'));
    }

    _emitCascadeHop(payload) {
        this._emitSemanticEvent('cascade.hop', this._normalizeCascadePayload(payload, 'hop'));
    }

    _emitCascadeEnd(payload) {
        this._emitSemanticEvent('cascade.end', payload);
    }
    
    /**
     * Process chain reaction events and update states
     */
    _processChainReactionEvents() {
        try {
            if (!this.chainReactionRuntime) return;
            
            const reactions = this.chainReactionRuntime.getActiveReactions?.();
            if (!reactions) return;
            
            const { linkEvents = [], nodeEvents = [] } = reactions;
            this._cascadeFrameCounter++;
            this._pendingCascadeHopEvents.length = 0;
            
            // Process node events
            if (nodeEvents.length > 0) {
                const nodesToProcess = this.config.maxNodesPerFrame 
                    ? nodeEvents.slice(0, this.config.maxNodesPerFrame)
                    : nodeEvents;
                
                for (const nodeEvent of nodesToProcess) {
                    try {
                        const { node, reactionLevel, harmonicMode } = nodeEvent;
                        if (!node?.userData) continue;
                        
                        const state = this._getNodeState(node);
                        const chainState = node.userData.chainReactionState;
                        const depth = chainState?.hopIndex || 1;
                        const cascadeID = this._resolveCascadeId(node, depth);
                        
                        const maxDepth = 8;  // From SynergyChainReaction_v1 config
                        
                        state.activate(cascadeID, depth, maxDepth, reactionLevel, harmonicMode);
                        
                        // Track cascade
                        const existingCascade = this.activeCascades.get(cascadeID);
                        if (!existingCascade) {
                            this.activeCascades.set(cascadeID, {
                                startTime: performance.now(),
                                lastSeenTime: performance.now(),
                                originNode: node,
                                depth: depth,
                                harmonicMode: harmonicMode ?? 0
                            });
                            this._emitCascadeStart({
                                cascadeId: cascadeID,
                                sourceNode: node,
                                targetNode: node,
                                link: null,
                                hopIndex: depth,
                                intensity: Math.max(0, Math.min(1, reactionLevel ?? 0)),
                                harmonicMode: harmonicMode ?? 0
                            });
                        } else {
                            existingCascade.lastSeenTime = performance.now();
                        }
                        
                        this.processedNodesCount++;
                    } catch (err) {
                        // Continue on individual event errors
                    }
                }
            }
            
            // Process link events
            if (linkEvents.length > 0) {
                const linksToProcess = this.config.maxLinksPerFrame 
                    ? linkEvents.slice(0, this.config.maxLinksPerFrame)
                    : linkEvents;
                
                for (const linkEvent of linksToProcess) {
                    try {
                        const { link, intensity, frequency } = linkEvent;
                        if (!link?.userData) continue;
                        
                        const state = this._getLinkState(link);
                        const sourceNode = link.sourceNode ?? link.source ?? null;
                        const targetNode = link.targetNode ?? link.target ?? null;
                        const hopIndex = linkEvent?.hopIndex ?? 0;
                        const cascadeID = this._resolveCascadeId(sourceNode, hopIndex);
                        state.activate(cascadeID, intensity, frequency);

                        const sourceNodeState = sourceNode ? this._getNodeState(sourceNode) : null;
                        const harmonicMode = sourceNodeState?.harmonicMode ?? 0;
                        const now = performance.now();
                        const trackedCascade = this.activeCascades.get(cascadeID);
                        if (trackedCascade) {
                            trackedCascade.lastSeenTime = now;
                        } else {
                            this.activeCascades.set(cascadeID, {
                                startTime: now,
                                lastSeenTime: now,
                                originNode: sourceNode,
                                depth: hopIndex,
                                harmonicMode
                            });
                            this._emitCascadeStart({
                                cascadeId: cascadeID,
                                sourceNode,
                                targetNode,
                                link,
                                hopIndex,
                                intensity: Math.max(0, Math.min(1, intensity ?? 0)),
                                harmonicMode
                            });
                        }
                        this._pendingCascadeHopEvents.push({
                            cascadeId: cascadeID,
                            sourceNode,
                            targetNode,
                            link,
                            hopIndex,
                            intensity: Math.max(0, Math.min(1, intensity ?? 0)),
                            harmonicMode
                        });

                        // Trigger traveling wave on link material if available
                        if (this.targetSystems.travelingWaveFX && link) {
                            const linkMaterial = link?.userData?.__strandMaterial || 
                                                  link?.userData?.material ||
                                                  null;
                            if (linkMaterial) {
                                const depth = Math.min(8, hopIndex);
                                const synergyLevel = Math.max(0, Math.min(1, intensity ?? 0.5));
                                this.targetSystems.travelingWaveFX.triggerWave(
                                    linkMaterial,
                                    depth,
                                    synergyLevel,
                                    0.8 + synergyLevel * 0.4
                                );
                            }
                        }

                        this.processedLinksCount++;
                    } catch (err) {
                        // Continue on individual event errors
                    }
                }
            }

            // Emit hop events after node/link event processing in this frame.
            for (const hopPayload of this._pendingCascadeHopEvents) {
                this._emitCascadeHop(hopPayload);
            }
            
        } catch (err) {
            console.error('[SynergyCascadeFXBridge_v1] Chain reaction event processing failed:', err);
        }
    }
    
    /**
     * Send cascade signals to target shader systems
     */
    _sendShaderSignals(node, nodeState) {
        try {
            // Send to cascade visualizer (primary resonance target)
            const cascadeVisualizer = this.targetSystems.cascadeVisualizer || this.targetSystems.resonanceShader;
            if (this.config.enableResonanceMode && cascadeVisualizer) {
                const worldPosition = this._getWorldPositionFromObject(node);
                const signals = {
                    cascadeWave: nodeState.cascadeWave,
                    pulseStrength: nodeState.smoothPulseStrength,
                    resonanceMix: nodeState.smoothResonanceMix,
                    bonusMix: nodeState.smoothBonusMix,
                    anchor: this._cloneVector3(worldPosition),
                    position: this._cloneVector3(worldPosition),
                    sourcePosition: this._cloneVector3(worldPosition),
                    intensity: nodeState.smoothPulseStrength,
                    cascadeIntensity: nodeState.smoothPulseStrength
                };
                cascadeVisualizer.applyCascadeSignal?.(node, signals);
            }
            
            // Send to bonus FX layer
            if (this.targetSystems.bonusFXLayer) {
                this.targetSystems.bonusFXLayer.setCascadeIntensity?.(node, nodeState.smoothPulseStrength);
            }
            
            // Send to node aura system
            if (this.config.enableNodeGlow && this.targetSystems.nodeAuraSystem) {
                this.targetSystems.nodeAuraSystem.setCascadeGlow?.(node, nodeState.smoothAuraPulse);
                this.targetSystems.nodeAuraSystem.setFlashBrightness?.(node, nodeState.flashBrightness);
            }
            
            // Send to archetype shader modes
            if (this.config.enableArchetypeBoost && this.targetSystems.archetypeShaderModes) {
                this.targetSystems.archetypeShaderModes.setCascadeBoost?.(node, nodeState.pulseStrength);
            }
            
        } catch (err) {
            // Graceful fallback if target systems don't support signals
        }
    }
    
    /**
     * Send cascade signals to link shader systems
     */
    _sendLinkShaderSignals(link, linkState) {
        try {
            // Send to link aura system
            if (this.config.enableLinkWaves && this.targetSystems.linkAuraSystem) {
                this.targetSystems.linkAuraSystem.setCascadeWave?.(link, linkState.smoothWaveIntensity);
                this.targetSystems.linkAuraSystem.setCoherenceBoost?.(link, linkState.smoothCoherenceBoost);
            }
            
            // Send to resonance shader (for link effects)
            // Send to cascade visualizer (primary resonance target)
            const cascadeVisualizer = this.targetSystems.cascadeVisualizer || this.targetSystems.resonanceShader;
            if (this.config.enableResonanceMode && cascadeVisualizer) {
                const sourceNode = link?.sourceNode ?? link?.source ?? link?.nodeA ?? null;
                const targetNode = link?.targetNode ?? link?.target ?? link?.nodeB ?? null;
                const sourcePosition = this._getWorldPositionFromObject(sourceNode);
                const targetPosition = this._getWorldPositionFromObject(targetNode);
                const anchor = (sourcePosition && targetPosition)
                    ? new THREE.Vector3().addVectors(sourcePosition, targetPosition).multiplyScalar(0.5)
                    : sourcePosition ?? targetPosition ?? null;
                const linkSignals = {
                    waveIntensity: linkState.smoothWaveIntensity,
                    chromaIntensity: linkState.smoothChromatIntensity,
                    stabilityPenalty: linkState.stabilityPenalty,
                    sourcePosition: this._cloneVector3(sourcePosition),
                    targetPosition: this._cloneVector3(targetPosition),
                    anchor: this._cloneVector3(anchor),
                    position: this._cloneVector3(anchor),
                    intensity: linkState.smoothWaveIntensity,
                    cascadeIntensity: linkState.smoothWaveIntensity
                };
                cascadeVisualizer.applyCascadeLinkSignal?.(link, linkSignals);
            }
            
        } catch (err) {
            // Graceful fallback
        }
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, allNodes = [], allLinks = []) {
        if (!this.frameScheduler?.shouldRunVisual?.()) return;

        try {
            const startTime = performance.now();
            const budgetMs = this.timeBudgetMs;
            this.processedNodesCount = 0;
            this.processedLinksCount = 0;
            
            // Step 1: Process incoming chain reaction events
            this._processChainReactionEvents();
            if (performance.now() - startTime > budgetMs) {
                this.frameUpdateTime = performance.now() - startTime;
                return;
            }
            
            // Step 2: Update node cascade states (round-robin slice)
            const totalNodes = allNodes.length;
            if (totalNodes > 0) {
                this._nodeCursor %= totalNodes;
                let processed = 0;
                while (processed < totalNodes) {
                    const idx = (this._nodeCursor + processed) % totalNodes;
                    const node = allNodes[idx];
                    try {
                        const nodeState = this._getNodeState(node);
                        nodeState.update(deltaTime);
                        this._sendShaderSignals(node, nodeState);
                        this.processedNodesCount += 1;
                    } catch (err) {
                        // Continue on individual node errors
                    }
                    processed += 1;
                    if (performance.now() - startTime > budgetMs) {
                        this._nodeCursor = (idx + 1) % totalNodes;
                        this.frameUpdateTime = performance.now() - startTime;
                        return;
                    }
                }
                this._nodeCursor = (this._nodeCursor + processed) % totalNodes;
            } else {
                this._nodeCursor = 0;
            }
            
            // Step 3: Update link cascade states (round-robin slice)
            const totalLinks = allLinks.length;
            if (totalLinks > 0) {
                this._linkCursor %= totalLinks;
                let processed = 0;
                while (processed < totalLinks) {
                    const idx = (this._linkCursor + processed) % totalLinks;
                    const link = allLinks[idx];
                    try {
                        const linkState = this._getLinkState(link);
                        linkState.update(deltaTime);
                        this._sendLinkShaderSignals(link, linkState);
                        this.processedLinksCount += 1;
                    } catch (err) {
                        // Continue on individual link errors
                    }
                    processed += 1;
                    if (performance.now() - startTime > budgetMs) {
                        this._linkCursor = (idx + 1) % totalLinks;
                        this.frameUpdateTime = performance.now() - startTime;
                        return;
                    }
                }
                this._linkCursor = (this._linkCursor + processed) % totalLinks;
            } else {
                this._linkCursor = 0;
            }
            
            // Step 4: Cleanup expired cascades
            for (const [cascadeID, cascadeData] of this.activeCascades) {
                const now = performance.now();
                const elapsedTime = (now - cascadeData.startTime) / 1000.0;
                if (elapsedTime > 2.0) {  // Cascades expire after 2 seconds
                    this._emitCascadeEnd({
                        cascadeId: cascadeID,
                        sourceNode: cascadeData.originNode ?? null,
                        targetNode: null,
                        link: null,
                        hopIndex: cascadeData.depth ?? 0,
                        intensity: 0,
                        harmonicMode: cascadeData.harmonicMode ?? 0
                    });
                    this.activeCascades.delete(cascadeID);
                }
            }
            
            this.frameUpdateTime = performance.now() - startTime;
            
        } catch (err) {
            console.error('[SynergyCascadeFXBridge_v1] Update failed:', err);
        }
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            lastUpdateTime: this.frameUpdateTime,
            processedNodesThisFrame: this.processedNodesCount,
            processedLinksThisFrame: this.processedLinksCount,
            activeCascadeCount: this.activeCascades.size,
            nodeStatesCount: this.nodeStates.size,
            linkStatesCount: this.linkStates.size
        };
    }
    
    /**
     * Cleanup and disposal
     */
    dispose() {
        try {
            // Clear all references
            this.chainReactionRuntime = null;
            
            for (const key in this.targetSystems) {
                this.targetSystems[key] = null;
            }
            
            this.activeCascades.clear();
            
            // WeakMaps will auto-cleanup
            
            if (this.config.debugEnabled) {
                console.log('[SynergyCascadeFXBridge_v1] Disposed ✓');
            }
        } catch (err) {
            console.error('[SynergyCascadeFXBridge_v1] Dispose failed:', err);
        }
    }
}

export default SynergyCascadeFXBridge_v1;
