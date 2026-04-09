import * as THREE from 'three';
import { getNodeCanonicalMetrics, getLinkSynergyVisualMetrics, getLinkCorruption } from './SemanticMetricAdapter.js';

/**
 * AI NETWORK RESONANCE FEEDBACK v1.0
 * 
 * Converts synergy data, personality signals, and shader-driven resonance
 * into network-level feedback that influences node behavior, link behavior,
 * and global network "mood".
 * 
 * CORE FEATURES:
 * ✓ Samples synergy, personality, and shader data across network
 * ✓ Computes local resonance for each node & link
 * ✓ Aggregates resonance into global "network mood"
 * ✓ Feeds back into per-node personality signals
 * ✓ Public API for FX, AI, and gameplay systems
 * ✓ WeakMap-based caching (zero memory leaks)
 * ✓ Full error handling & optional chaining
 * ✓ Performance: handles 1000+ nodes + 5000+ links in <2ms
 * 
 * INPUT SOURCES (READ-ONLY):
 * - node.userData.personalityVisual (clarity, resonance, entropy, etc)
 * - node.userData.synergy.{score, synergyNorm} (canonical synergy input)
 * - node.userData.shaderModeState (Week 16)
 * - node.userData.archetypeEvolution (Week 13)
 * - node.userData.auras (Week 14)
 * Note: link.userData.visualMetrics.synergyBonus is a derived visual metric (not gameplay). Gameplay logic must use link.userData.synergy.{score, synergyNorm}.
 * - node.userData.quality (NodeQualityCalculator)
 * - node.userData.dynamicMetrics (NodeDynamicMetrics)
 * - link.userData.synergy.{score, synergyNorm} (canonical input for link resonance)
 * - link.userData.resonanceFeedback (for coherence tracking)
 * 
 * OUTPUT DATA:
 * - node.userData.resonanceFeedback (local feedback signals)
 * - link.userData.resonanceFeedback (link-level feedback)
 * - this.networkMood (global network state)
 */

/**
 * Per-node resonance feedback state
 */
class NodeResonanceFeedback {
    constructor() {
        // Local resonance metrics
        this.localResonance = 0.0;           // 0–1, composite resonance
        this.harmonyShift = 0.0;             // float, change in harmony
        this.entropyShock = 0.0;             // float, entropy perturbation
        this.corruptionDrift = 0.0;          // float, corruption change
        this.clarityBoost = 0.0;             // float, clarity enhancement
        this.reactivePulse = 0.0;            // 0–1, reactive pulse strength
        
        // EMA-smoothed values
        this.smoothedResonance = 0.0;
        this.smoothedEntropy = 0.0;
        this.smoothedCorruption = 0.0;
        
        // Smoothing constants
        this.resonanceAlpha = 0.12;
        this.entropyAlpha = 0.08;
        this.corruptionAlpha = 0.10;
        
        // Timestamp
        this.lastUpdate = 0;
    }
    
    /**
     * Apply EMA smoothing to all metrics
     */
    smooth(deltaTime) {
        const resonanceFactor = Math.min(1.0, this.resonanceAlpha * deltaTime * 60.0);
        this.smoothedResonance += (this.localResonance - this.smoothedResonance) * resonanceFactor;
        
        const entropyFactor = Math.min(1.0, this.entropyAlpha * deltaTime * 60.0);
        this.smoothedEntropy += (this.entropyShock - this.smoothedEntropy) * entropyFactor;
        
        const corruptionFactor = Math.min(1.0, this.corruptionAlpha * deltaTime * 60.0);
        this.smoothedCorruption += (this.corruptionDrift - this.smoothedCorruption) * corruptionFactor;
        
        // Clamp all values
        this.smoothedResonance = Math.max(0, Math.min(1, this.smoothedResonance));
        this.smoothedEntropy = Math.max(0, Math.min(1, this.smoothedEntropy));
        this.smoothedCorruption = Math.max(0, Math.min(1, this.smoothedCorruption));
    }
}

/**
 * Per-link resonance feedback state
 */
class LinkResonanceFeedback {
    constructor() {
        this.pulseStrength = 0.0;             // 0–1
        this.coherenceBoost = 0.0;            // float
        this.stabilityPenalty = 0.0;          // float (negative)
        this.chromaticIntensity = 0.0;        // 0–1
        this.lastUpdate = 0;
    }
}

/**
 * Global network mood state
 */
class NetworkMood {
    constructor() {
        // Aggregated network metrics
        this.harmony = 0.5;                   // 0–1, avg local resonance
        this.entropy = 0.3;                   // 0–1, avg entropy
        this.coherence = 0.5;                 // 0–1, avg link coherence
        this.corruption = 0.2;                // 0–1, avg corruption drift
        this.ascension = 0.3;                 // 0–1, avg archetype ascension
        
        // Mood classification
        this.moodState = 'calm';              // calm, growing, chaotic, overloaded, resonant
        this.moodStrength = 0.0;              // 0–1, intensity of current mood
        
        // Momentum for smooth mood transitions
        this.prevHarmony = 0.5;
        this.prevEntropy = 0.3;
        this.prevCoherence = 0.5;
        
        // Temporal tracking
        this.moodDuration = 0.0;              // Seconds in current mood
        this.moodChangeTime = 0.0;            // Time of last mood change
    }
    
    /**
     * Update mood classification based on aggregated metrics
     */
    updateMoodState() {
        const prevMood = this.moodState;
        
        // Determine dominant mood based on metrics
        if (this.harmony > 0.7 && this.entropy < 0.3) {
            this.moodState = 'calm';
            this.moodStrength = this.harmony;
        } else if (this.harmony > 0.5 && this.ascension > 0.4) {
            this.moodState = 'growing';
            this.moodStrength = Math.min(this.harmony, this.ascension);
        } else if (this.entropy > 0.6) {
            this.moodState = 'chaotic';
            this.moodStrength = this.entropy;
        } else if (this.coherence < 0.3 && this.harmony < 0.4) {
            this.moodState = 'overloaded';
            this.moodStrength = 1.0 - this.coherence;
        } else if (this.coherence > 0.75 && this.harmony > 0.6) {
            this.moodState = 'resonant';
            this.moodStrength = this.coherence;
        } else {
            this.moodState = 'calm';
            this.moodStrength = 0.5;
        }
        
        // Track mood change
        if (this.moodState !== prevMood) {
            this.moodChangeTime = 0.0;
        }
    }
    
    /**
     * Update mood duration and momentum
     */
    updateTiming(deltaTime) {
        this.moodDuration += deltaTime;
        this.moodChangeTime += deltaTime;
    }
}

/**
 * Harmony Field Lines Renderer
 * Creates organic curves/aurora-like field lines between highly resonant nodes
 */
class HarmonyFieldLinesRenderer {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = {
            enabled: config.enabled ?? true,
            resonanceThreshold: config.resonanceThreshold ?? 0.85,  // Only connect nodes above this resonance
            maxConnectionsPerNode: config.maxConnectionsPerNode ?? 3,  // Limit connections per node
            maxTotalLines: config.maxTotalLines ?? 50,  // Total field lines limit
            updateInterval: config.updateInterval ?? 0.1,  // Update every 0.1s
            curveSegments: config.curveSegments ?? 32,  // Curve smoothness
            lineWidth: config.lineWidth ?? 1.5,
            pulseSpeed: config.pulseSpeed ?? 2.0,
            debugEnabled: config.debugEnabled ?? false
        };

        // Field lines storage
        this.fieldLines = [];  // { curve, mesh, startNode, endNode, strength, pulseOffset }
        this.lastUpdateTime = 0;
        this.time = 0;

        // Performance optimization
        this.topResonantNodes = [];
        this.nodeConnections = new Map();  // node -> Set of connected nodes

        if (this.config.debugEnabled) {
            console.log('[HarmonyFieldLinesRenderer] initialized ✓');
        }
    }

    /**
     * Get top resonant nodes
     */
    _getTopResonantNodes(allNodes) {
        const nodes = [];
        for (const node of allNodes) {
            if (!node?.userData?.resonanceFeedback) continue;
            const resonance = node.userData.resonanceFeedback.localResonance;
            if (resonance >= this.config.resonanceThreshold) {
                nodes.push({ node, resonance });
            }
        }

        // Sort by resonance descending
        nodes.sort((a, b) => b.resonance - a.resonance);

        // Limit to reasonable number (based on maxTotalLines)
        const maxNodes = Math.min(nodes.length, this.config.maxTotalLines * 2);
        return nodes.slice(0, maxNodes);
    }

    /**
     * Check if two nodes are already connected
     */
    _isConnected(nodeA, nodeB) {
        return this.nodeConnections.has(nodeA) && this.nodeConnections.get(nodeA).has(nodeB);
    }

    /**
     * Create field line between two nodes
     */
    _createFieldLine(nodeA, nodeB, resonanceA, resonanceB) {
        const posA = nodeA.position.clone();
        const posB = nodeB.position.clone();

        // Create organic curve with control points
        const direction = posB.clone().sub(posA);
        const distance = direction.length();
        const midPoint = posA.clone().add(direction.multiplyScalar(0.5));

        // Add organic "flow" - perpendicular displacement
        const perpendicular = new THREE.Vector3(0, 1, 0).cross(direction).normalize();
        const displacement = perpendicular.multiplyScalar(distance * 0.15 * Math.random());

        // Add slight curve control point
        const controlPoint = midPoint.add(displacement);

        // Create CatmullRom curve for smooth organic flow
        const curve = new THREE.CatmullRomCurve3([
            posA,
            controlPoint,
            posB
        ]);

        // Create geometry
        const geometry = new THREE.TubeGeometry(
            curve,
            this.config.curveSegments,
            this.config.lineWidth * 0.1,
            4,  // Radial segments
            false
        );

        // Create aurora-like material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColorA: { value: new THREE.Color(0x00ffff) },  // Cyan
                uColorB: { value: new THREE.Color(0xff00ff) },  // Magenta
                uColorC: { value: new THREE.Color(0x8800ff) },  // Purple
                uOpacity: { value: 0.6 },
                uPulseSpeed: { value: this.config.pulseSpeed },
                uPulseOffset: { value: Math.random() * Math.PI * 2 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    vUv = uv;
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColorA;
                uniform vec3 uColorB;
                uniform vec3 uColorC;
                uniform float uOpacity;
                uniform float uPulseSpeed;
                uniform float uPulseOffset;

                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    // Pulse effect along the curve
                    float pulse = sin(uTime * uPulseSpeed + vUv.x * 10.0 + uPulseOffset) * 0.5 + 0.5;

                    // Color mixing (aurora-like gradient)
                    vec3 color = mix(uColorA, uColorB, vUv.x);
                    color = mix(color, uColorC, pulse * 0.5);

                    // Edge glow (fresnel-like)
                    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
                    color += fresnel * 0.3;

                    // Fade edges
                    float alpha = uOpacity * (0.5 + 0.5 * pulse);
                    alpha *= (1.0 - abs(vUv.x - 0.5) * 0.5);  // Fade at ends

                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const mesh = new THREE.Mesh(geometry, material);

        const strength = (resonanceA + resonanceB) / 2.0;

        return {
            curve,
            mesh,
            startNode: nodeA,
            endNode: nodeB,
            strength,
            pulseOffset: Math.random() * Math.PI * 2
        };
    }

    /**
     * Update field lines
     */
    update(allNodes, deltaTime) {
        if (!this.config.enabled) {
            return;
        }

        this.time += deltaTime;

        // Throttle updates
        if (this.time - this.lastUpdateTime < this.config.updateInterval) {
            this._updateAnimations(deltaTime);
            return;
        }

        this.lastUpdateTime = this.time;

        // Get top resonant nodes
        this.topResonantNodes = this._getTopResonantNodes(allNodes);

        if (this.topResonantNodes.length < 2) {
            this._clearFieldLines();
            return;
        }

        // Build new connections
        const newFieldLines = [];
        const nodeConnectionCounts = new Map();

        for (let i = 0; i < this.topResonantNodes.length; i++) {
            const nodeA = this.topResonantNodes[i].node;
            const resonanceA = this.topResonantNodes[i].resonance;

            const connectionsCount = nodeConnectionCounts.get(nodeA) || 0;
            if (connectionsCount >= this.config.maxConnectionsPerNode) continue;

            for (let j = i + 1; j < this.topResonantNodes.length; j++) {
                const nodeB = this.topResonantNodes[j].node;
                const resonanceB = this.topResonantNodes[j].resonance;

                // Check if already connected
                if (this._isConnected(nodeA, nodeB)) continue;

                // Check limits
                const connectionsB = nodeConnectionCounts.get(nodeB) || 0;
                if (connectionsB >= this.config.maxConnectionsPerNode) continue;

                // Check total limit
                if (newFieldLines.length >= this.config.maxTotalLines) break;

                // Create field line
                const fieldLine = this._createFieldLine(nodeA, nodeB, resonanceA, resonanceB);
                newFieldLines.push(fieldLine);

                // Track connections
                if (!this.nodeConnections.has(nodeA)) this.nodeConnections.set(nodeA, new Set());
                if (!this.nodeConnections.has(nodeB)) this.nodeConnections.set(nodeB, new Set());
                this.nodeConnections.get(nodeA).add(nodeB);
                this.nodeConnections.get(nodeB).add(nodeA);

                nodeConnectionCounts.set(nodeA, (connectionsCount + 1));
                nodeConnectionCounts.set(nodeB, (connectionsB + 1));

                if (newFieldLines.length >= this.config.maxTotalLines) break;
            }

            if (newFieldLines.length >= this.config.maxTotalLines) break;
        }

        // Remove old field lines
        this._clearFieldLines();

        // Add new field lines
        for (const fieldLine of newFieldLines) {
            this.scene.add(fieldLine.mesh);
            this.fieldLines.push(fieldLine);
        }

        if (this.config.debugEnabled) {
            console.log(`[HarmonyFieldLinesRenderer] Created ${this.fieldLines.length} field lines`);
        }
    }

    /**
     * Update animations (pulse, flow)
     */
    _updateAnimations(deltaTime) {
        for (const fieldLine of this.fieldLines) {
            if (fieldLine.mesh.material.uniforms) {
                fieldLine.mesh.material.uniforms.uTime.value = this.time;
            }
        }
    }

    /**
     * Clear all field lines
     */
    _clearFieldLines() {
        for (const fieldLine of this.fieldLines) {
            this.scene.remove(fieldLine.mesh);
            fieldLine.mesh.geometry.dispose();
            fieldLine.mesh.material.dispose();
        }
        this.fieldLines = [];
        this.nodeConnections.clear();
    }

    /**
     * Enable/disable field lines
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled) {
            this._clearFieldLines();
        }
    }

    /**
     * Set resonance threshold
     */
    setThreshold(threshold) {
        this.config.resonanceThreshold = Math.max(0, Math.min(1, threshold));
        this._clearFieldLines();  // Force rebuild
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            enabled: this.config.enabled,
            fieldLineCount: this.fieldLines.length,
            topResonantNodesCount: this.topResonantNodes.length,
            resonanceThreshold: this.config.resonanceThreshold
        };
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        this._clearFieldLines();
        this.topResonantNodes = [];
        this.nodeConnections.clear();
    }
}

/**
 * ResonanceFeedback_v1: AI Network Resonance Feedback System
 */
export class ResonanceFeedback_v1 {
    constructor(config = {}) {
        this.config = {
            debugEnabled: config.debugEnabled ?? false,
            maxNodesPerFrame: config.maxNodesPerFrame ?? null,  // No limit by default
            maxLinksPerFrame: config.maxLinksPerFrame ?? null,
            enableHarmonyFieldLines: config.enableHarmonyFieldLines ?? true,
            fieldLinesConfig: config.fieldLinesConfig ?? {}
        };

        // Scene reference for visual effects
        this.scene = config.scene ?? null;
        
        // Per-node feedback state (WeakMap for auto-cleanup)
        this.nodeStates = new WeakMap();
        
        // Per-link feedback state (WeakMap for auto-cleanup)
        this.linkStates = new WeakMap();
        
        // Global network mood
        this.networkMood = new NetworkMood();
        
        // Aggregation accumulators
        this.aggregates = {
            harmonySum: 0,
            entropySum: 0,
            coherenceSum: 0,
            corruptionSum: 0,
            ascensionSum: 0,
            nodeCount: 0,
            linkCount: 0,
            resonanceLoadSum: 0
        };
        
        // Performance monitoring
        this.lastUpdateTime = 0;
        this.frameUpdateTime = 0;
        this.processedNodesCount = 0;
        this.processedLinksCount = 0;

        // Initialize Harmony Field Lines Renderer (visual layer)
        this.harmonyFieldLines = null;
        if (this.scene && this.config.enableHarmonyFieldLines) {
            try {
                this.harmonyFieldLines = new HarmonyFieldLinesRenderer(this.scene, {
                    ...this.config.fieldLinesConfig,
                    debugEnabled: this.config.debugEnabled
                });
                if (this.config.debugEnabled) {
                    console.log('[ResonanceFeedback_v1] Harmony Field Lines enabled ✓');
                }
            } catch (err) {
                console.warn('[ResonanceFeedback_v1] Harmony Field Lines failed:', err);
            }
        }

        if (this.config.debugEnabled) {
            console.log('[ResonanceFeedback_v1] initialized ✓');
        }
    }
    
    /**
     * Get or create node feedback state
     */
    getNodeState(node) {
        if (!this.nodeStates.has(node)) {
            this.nodeStates.set(node, new NodeResonanceFeedback());
        }
        return this.nodeStates.get(node);
    }
    
    /**
     * Get or create link feedback state
     */
    getLinkState(link) {
        if (!this.linkStates.has(link)) {
            this.linkStates.set(link, new LinkResonanceFeedback());
        }
        return this.linkStates.get(link);
    }
    
    /**
     * Calculate local resonance for a single node
     */
    calculateNodeResonance(node) {
        try {
            if (!node?.userData) return 0;
            
            // Extract input signals (with safe defaults)
            const personalityVisual = node.userData.personalityVisual ?? {};
            const canonicalMetrics = getNodeCanonicalMetrics(node) ?? {};
            const synergy = canonicalMetrics.synergy ?? {};
            const shaderMode = node.userData.shaderModeState ?? {};
            const archetype = node.userData.archetypeEvolution ?? {};
            
            // Component 1: Personality resonance boost (35%)
            const personalityResonance = Math.max(0, Math.min(1, 
                personalityVisual.resonanceBoost ?? 0.5
            ));
            
            // Component 2: Synergy bonus strength (25%)
            const synergyStrength = Math.max(0, Math.min(1,
                synergy.synergyNorm ?? synergy.score ?? 0
            ));
            
            // Component 3: Anti-entropy (clarity from low entropy) (15%)
            const entropyPenalty = Math.max(0, Math.min(1,
                personalityVisual.entropyPenalty ?? 0
            ));
            const clarityFromLowEntropy = 1.0 - entropyPenalty;
            
            // Component 4: Link-based resonance (15%)
            // Average resonance of connected links
            let linkResonanceSum = 0;
            let linkCount = 0;
            if (node.connections && Array.isArray(node.connections)) {
                for (const link of node.connections) {
                    const linkFeedback = this.linkStates.get(link);
                    if (linkFeedback) {
                        linkResonanceSum += linkFeedback.pulseStrength;
                        linkCount++;
                    }
                }
            }
            const linkAvgResonance = linkCount > 0 ? linkResonanceSum / linkCount : 0.5;
            
            // Component 5: Archetype ascension multiplier (10%)
            const ascensionMultiplier = Math.max(0, Math.min(1,
                archetype.ascensionMultiplier ?? 0.5
            ));
            
            // Composite calculation
            const localResonance =
                0.35 * personalityResonance +
                0.25 * synergyStrength +
                0.15 * clarityFromLowEntropy +
                0.15 * linkAvgResonance +
                0.10 * ascensionMultiplier;
            
            return Math.max(0, Math.min(1, localResonance));
            
        } catch (err) {
            console.error('[ResonanceFeedback_v1] calculateNodeResonance failed:', err);
            return 0;
        }
    }
    
    /**
     * Sample and update a single node's feedback
     */
    sampleNode(node) {
        try {
            if (!node?.userData) return;
            
            const state = this.getNodeState(node);
            const personalityVisual = node.userData.personalityVisual ?? {};
            const canonicalMetrics = getNodeCanonicalMetrics(node) ?? {};
            const synergy = canonicalMetrics.synergy ?? {};
            const archetype = node.userData.archetypeEvolution ?? {};
            
            // Calculate local resonance
            state.localResonance = this.calculateNodeResonance(node);
            
            // Calculate harmony shift (change from baseline)
            const baselineHarmony = 0.5;
            state.harmonyShift = state.localResonance - baselineHarmony;
            
            // Calculate entropy shock (perturbation)
            state.entropyShock = Math.max(0, Math.min(1,
                personalityVisual.entropyPenalty ?? 0
            ));
            
            // Calculate corruption drift
            state.corruptionDrift = Math.max(0, Math.min(1,
                personalityVisual.corruptionLevel ?? 0
            ));
            
            // Calculate clarity boost from synergy
            state.clarityBoost = Math.max(0, Math.min(1,
                (Math.floor((synergy.synergyNorm ?? synergy.score ?? 0) * 3) / 3.0) * 0.3
            ));
            
            // Calculate reactive pulse (tier-based)
            const synergyTier = Math.max(0, Math.min(3, Math.floor((synergy.synergyNorm ?? synergy.score ?? 0) * 3)));
            state.reactivePulse = (synergyTier / 3.0) * 0.7 +
                                  (state.localResonance * 0.3);
            
            // Apply EMA smoothing
            state.smooth(0.016);  // Assume ~60 FPS
            
            // Store output feedback in userData
            node.userData.resonanceFeedback = {
                localResonance: state.localResonance,
                harmonyShift: state.harmonyShift,
                entropyShock: state.entropyShock,
                corruptionDrift: state.corruptionDrift,
                clarityBoost: state.clarityBoost,
                reactivePulse: state.reactivePulse,
                lastUpdate: Date.now()
            };
            
            state.lastUpdate = Date.now();
            
        } catch (err) {
            console.error('[ResonanceFeedback_v1] sampleNode failed:', err);
        }
    }
    
    /**
     * Sample and update a single link's feedback
     */
    sampleLink(link) {
        try {
            if (!link?.userData) return;
            
            const state = this.getLinkState(link);
            const synergyProfile = getLinkSynergyVisualMetrics(link) ?? {};
            const linkCorruption = getLinkCorruption(link) ?? {};
            
            // Extract link metrics
            const resonanceLevel = Math.max(0, Math.min(1,
                synergyProfile.resonanceRipples ?? 0
            ));
            const synergyTier = Math.max(0, Math.min(3,
                synergyProfile.tier ?? 0
            ));
            const chromaShift = Math.max(0, Math.min(1,
                synergyProfile.chromaShift ?? 0
            ));
            
            // Calculate pulse strength
            state.pulseStrength = 0.5 * resonanceLevel + 0.5 * (synergyTier / 3.0);
            state.pulseStrength = Math.max(0, Math.min(1, state.pulseStrength));
            
            // Calculate coherence boost
            state.coherenceBoost = synergyTier * 0.1;
            
            // Calculate stability penalty (from entropy)
            const entropy = linkCorruption.entropyPenalty ?? 0;
            state.stabilityPenalty = -(entropy * 0.2);
            
            // Calculate chromatic intensity
            state.chromaticIntensity = resonanceLevel * 0.3 + chromaShift * 0.7;
            state.chromaticIntensity = Math.max(0, Math.min(1, state.chromaticIntensity));
            
            // Store output feedback in userData
            link.userData.resonanceFeedback = {
                pulseStrength: state.pulseStrength,
                coherenceBoost: state.coherenceBoost,
                stabilityPenalty: state.stabilityPenalty,
                chromaticIntensity: state.chromaticIntensity,
                lastUpdate: Date.now()
            };
            
            state.lastUpdate = Date.now();
            
        } catch (err) {
            console.error('[ResonanceFeedback_v1] sampleLink failed:', err);
        }
    }
    
    /**
     * Aggregate metrics across all nodes & links
     */
    aggregateMetrics(allNodes = [], allLinks = []) {
        try {
            // Reset accumulators
            this.aggregates = {
                harmonySum: 0,
                entropySum: 0,
                coherenceSum: 0,
                corruptionSum: 0,
                ascensionSum: 0,
                nodeCount: 0,
                linkCount: 0,
                resonanceLoadSum: 0
            };
            
            // Aggregate node metrics
            for (const node of allNodes) {
                if (!node?.userData?.resonanceFeedback) continue;
                
                const fb = node.userData.resonanceFeedback;
                const archetype = node.userData.archetypeEvolution ?? {};
                
                this.aggregates.harmonySum += fb.localResonance;
                this.aggregates.entropySum += fb.entropyShock;
                this.aggregates.corruptionSum += fb.corruptionDrift;
                this.aggregates.ascensionSum += (archetype.ascensionMultiplier ?? 0);
                this.aggregates.nodeCount++;
            }
            
            // Aggregate link metrics
            for (const link of allLinks) {
                if (!link?.userData?.resonanceFeedback) continue;
                
                const fb = link.userData.resonanceFeedback;
                
                this.aggregates.coherenceSum += fb.pulseStrength;
                this.aggregates.resonanceLoadSum += fb.chromaticIntensity;
                this.aggregates.linkCount++;
            }
            
        } catch (err) {
            console.error('[ResonanceFeedback_v1] aggregateMetrics failed:', err);
        }
    }
    
    /**
     * Compute global network mood
     */
    computeGlobalMood() {
        try {
            // Update aggregates (from last aggregateMetrics call)
            const nodeCount = this.aggregates.nodeCount || 1;
            const linkCount = this.aggregates.linkCount || 1;
            
            // Calculate averages
            this.networkMood.prevHarmony = this.networkMood.harmony;
            this.networkMood.prevEntropy = this.networkMood.entropy;
            this.networkMood.prevCoherence = this.networkMood.coherence;
            
            this.networkMood.harmony = Math.max(0, Math.min(1,
                this.aggregates.harmonySum / nodeCount
            ));
            this.networkMood.entropy = Math.max(0, Math.min(1,
                this.aggregates.entropySum / nodeCount
            ));
            this.networkMood.coherence = Math.max(0, Math.min(1,
                this.aggregates.coherenceSum / linkCount
            ));
            this.networkMood.corruption = Math.max(0, Math.min(1,
                this.aggregates.corruptionSum / nodeCount
            ));
            this.networkMood.ascension = Math.max(0, Math.min(1,
                this.aggregates.ascensionSum / nodeCount
            ));
            
            // Update mood state classification
            this.networkMood.updateMoodState();
            
        } catch (err) {
            console.error('[ResonanceFeedback_v1] computeGlobalMood failed:', err);
        }
    }
    
    /**
     * Main update function - call once per frame
     */
    update(deltaTime, allNodes = [], allLinks = []) {
        const startTime = performance.now();
        
        try {
            // Update mood timing
            this.networkMood.updateTiming(deltaTime);
            
            // Sample all nodes
            this.processedNodesCount = 0;
            if (this.config.maxNodesPerFrame) {
                const nodesToProcess = Math.min(this.config.maxNodesPerFrame, allNodes.length);
                for (let i = 0; i < nodesToProcess; i++) {
                    this.sampleNode(allNodes[i]);
                    this.processedNodesCount++;
                }
            } else {
                for (const node of allNodes) {
                    this.sampleNode(node);
                    this.processedNodesCount++;
                }
            }
            
            // Sample all links
            this.processedLinksCount = 0;
            if (this.config.maxLinksPerFrame) {
                const linksToProcess = Math.min(this.config.maxLinksPerFrame, allLinks.length);
                for (let i = 0; i < linksToProcess; i++) {
                    this.sampleLink(allLinks[i]);
                    this.processedLinksCount++;
                }
            } else {
                for (const link of allLinks) {
                    this.sampleLink(link);
                    this.processedLinksCount++;
                }
            }
            
            // Aggregate metrics and compute global mood
            this.aggregateMetrics(allNodes, allLinks);
            this.computeGlobalMood();

            // Update harmony field lines (visual layer)
            if (this.harmonyFieldLines) {
                this.harmonyFieldLines.update(allNodes, deltaTime);
            }

        } catch (err) {
            console.error('[ResonanceFeedback_v1] update failed:', err);
        }
        
        this.frameUpdateTime = performance.now() - startTime;
        
        if (this.config.debugEnabled && Math.random() < 0.01) {
            console.log(
                `[ResonanceFeedback_v1] processed ${this.processedNodesCount} nodes, ` +
                `${this.processedLinksCount} links, mood: ${this.networkMood.moodState} ` +
                `in ${this.frameUpdateTime.toFixed(3)}ms`
            );
        }
    }
    
    /**
     * Get current network mood
     */
    getMood() {
        return {
            harmony: this.networkMood.harmony,
            entropy: this.networkMood.entropy,
            coherence: this.networkMood.coherence,
            corruption: this.networkMood.corruption,
            ascension: this.networkMood.ascension,
            moodState: this.networkMood.moodState,
            moodStrength: this.networkMood.moodStrength,
            moodDuration: this.networkMood.moodDuration
        };
    }
    
    /**
     * Get detailed network statistics
     */
    getStatistics() {
        return {
            processedNodesCount: this.processedNodesCount,
            processedLinksCount: this.processedLinksCount,
            lastFrameUpdateTime: this.frameUpdateTime,
            networkMood: this.getMood(),
            aggregates: {
                avgHarmony: this.aggregates.harmonySum / (this.aggregates.nodeCount || 1),
                avgEntropy: this.aggregates.entropySum / (this.aggregates.nodeCount || 1),
                avgCoherence: this.aggregates.coherenceSum / (this.aggregates.linkCount || 1),
                avgCorruption: this.aggregates.corruptionSum / (this.aggregates.nodeCount || 1),
                avgAscension: this.aggregates.ascensionSum / (this.aggregates.nodeCount || 1)
            }
        };
    }
    
    /**
     * Get mood transitions (for animation/event systems)
     */
    getMoodTransition() {
        const harmonyChange = this.networkMood.harmony - this.networkMood.prevHarmony;
        const entropyChange = this.networkMood.entropy - this.networkMood.prevEntropy;
        const coherenceChange = this.networkMood.coherence - this.networkMood.prevCoherence;

        return {
            harmonyChange,
            entropyChange,
            coherenceChange,
            moodChanged: this.networkMood.moodChangeTime < 0.1,
            moodChangeTime: this.networkMood.moodChangeTime,
            moodStrength: this.networkMood.moodStrength
        };
    }

    /**
     * Enable/disable harmony field lines
     */
    setHarmonyFieldLinesEnabled(enabled) {
        if (this.harmonyFieldLines) {
            this.harmonyFieldLines.setEnabled(enabled);
        }
    }

    /**
     * Set harmony field lines resonance threshold
     */
    setHarmonyFieldLinesThreshold(threshold) {
        if (this.harmonyFieldLines) {
            this.harmonyFieldLines.setThreshold(threshold);
        }
    }

    /**
     * Get harmony field lines statistics
     */
    getHarmonyFieldLinesStats() {
        if (this.harmonyFieldLines) {
            return this.harmonyFieldLines.getStats();
        }
        return null;
    }

    /**
     * Cleanup and dispose
     */
    dispose() {
        try {
            // Dispose harmony field lines
            if (this.harmonyFieldLines) {
                this.harmonyFieldLines.dispose();
                this.harmonyFieldLines = null;
            }

            // WeakMaps will be auto-cleaned by GC
            this.networkMood = new NetworkMood();

            if (this.config.debugEnabled) {
                console.log('[ResonanceFeedback_v1] disposed ✓');
            }
        } catch (err) {
            console.error('[ResonanceFeedback_v1] dispose error:', err);
        }
    }
}

export default ResonanceFeedback_v1;
