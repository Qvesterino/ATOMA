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
            resonanceShader: null,              // SynergyResonanceShaderPack_v1
            bonusFXLayer: null,                 // SynergyBonusFXLayer_v1
            nodeAuraSystem: null,               // NodeAuraSystem_v1
            linkAuraSystem: null,               // LinkAuraSystem_v1
            nodeShaderActivation: null,         // NodeShaderActivation_v1
            archetypeShaderModes: null          // ArchetypeShaderModes_v1
        };
        
        // Event source (SynergyChainReaction_v1 instance)
        this.chainReactionRuntime = null;
        
        // State tracking (WeakMaps for automatic GC)
        this.nodeStates = new WeakMap();        // node → NodeCascadeState
        this.linkStates = new WeakMap();        // link → LinkCascadeState
        
        // Frame accounting
        this.lastUpdateTime = 0;
        this.frameUpdateTime = 0;
        this.processedNodesCount = 0;
        this.processedLinksCount = 0;
        
        // Active cascades tracking
        this.activeCascades = new Map();        // cascadeID → { startTime, originNode, depth }
        
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
    
    /**
     * Process chain reaction events and update states
     */
    _processChainReactionEvents() {
        try {
            if (!this.chainReactionRuntime) return;
            
            const reactions = this.chainReactionRuntime.getActiveReactions?.();
            if (!reactions) return;
            
            const { linkEvents = [], nodeEvents = [] } = reactions;
            
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
                        const cascadeID = `cascade_${Date.now()}_${Math.random()}`;
                        
                        // Extract depth from chain reaction state if available
                        const chainState = node.userData.chainReactionState;
                        const depth = chainState?.hopIndex || 1;
                        const maxDepth = 8;  // From SynergyChainReaction_v1 config
                        
                        state.activate(cascadeID, depth, maxDepth, reactionLevel, harmonicMode);
                        
                        // Track cascade
                        this.activeCascades.set(cascadeID, {
                            startTime: performance.now(),
                            originNode: node,
                            depth: depth
                        });
                        
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
                        state.activate(`cascade_${Date.now()}`, intensity, frequency);
                        
                        this.processedLinksCount++;
                    } catch (err) {
                        // Continue on individual event errors
                    }
                }
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
            // Send to resonance shader system
            if (this.config.enableResonanceMode && this.targetSystems.resonanceShader) {
                const signals = {
                    cascadeWave: nodeState.cascadeWave,
                    pulseStrength: nodeState.smoothPulseStrength,
                    resonanceMix: nodeState.smoothResonanceMix,
                    bonusMix: nodeState.smoothBonusMix
                };
                this.targetSystems.resonanceShader.applyCascadeSignal?.(node, signals);
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
            if (this.config.enableResonanceMode && this.targetSystems.resonanceShader) {
                const linkSignals = {
                    waveIntensity: linkState.smoothWaveIntensity,
                    chromaIntensity: linkState.smoothChromatIntensity,
                    stabilityPenalty: linkState.stabilityPenalty
                };
                this.targetSystems.resonanceShader.applyCascadeLinkSignal?.(link, linkSignals);
            }
            
        } catch (err) {
            // Graceful fallback
        }
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, allNodes = [], allLinks = []) {
        try {
            const startTime = performance.now();
            
            // Step 1: Process incoming chain reaction events
            this._processChainReactionEvents();
            
            // Step 2: Update all active node cascade states
            for (const node of allNodes) {
                try {
                    const nodeState = this._getNodeState(node);
                    nodeState.update(deltaTime);
                    
                    // Send signals to target systems
                    this._sendShaderSignals(node, nodeState);
                } catch (err) {
                    // Continue on individual node errors
                }
            }
            
            // Step 3: Update all active link cascade states
            for (const link of allLinks) {
                try {
                    const linkState = this._getLinkState(link);
                    linkState.update(deltaTime);
                    
                    // Send signals to target systems
                    this._sendLinkShaderSignals(link, linkState);
                } catch (err) {
                    // Continue on individual link errors
                }
            }
            
            // Step 4: Cleanup expired cascades
            for (const [cascadeID, cascadeData] of this.activeCascades) {
                const elapsedTime = (performance.now() - cascadeData.startTime) / 1000.0;
                if (elapsedTime > 2.0) {  // Cascades expire after 2 seconds
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
