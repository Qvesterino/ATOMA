/**
 * ============================================================================
 * CASCADING RUPTURE SYSTEM
 * ============================================================================
 * 
 * Visualizes rupture energy propagating across network regions.
 * Under sufficient stress, ruptures cascade region-to-region along topology.
 * 
 * CORE PHILOSOPHY:
 * - Ruptures are not always local
 * - Cascades feel inevitable, not random
 * - Propagation follows structural weakness
 * - Each step weakens (decay per hop)
 * 
 * VISUAL LANGUAGE:
 * - Rapid phase destabilization
 * - Spatial tearing along links
 * - Sudden loss of coherence
 * - Clean propagation (no explosions)
 * 
 * TRIGGER CONDITIONS:
 * - Rupture occurs in high-corruption region
 * - Low average stability
 * - Unresolved standing waves
 * - Active links to neighboring regions
 * 
 * INTEGRATION:
 * - Reads: Network state, rupture events, regional metrics
 * - Writes: Visual cascade effects, triggers node failure events
 * - Optional: Can trigger critical node failure system
 * 
 * ============================================================================
 */

import * as THREE from 'three';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Cascade detection
    DETECTION_INTERVAL: 0.5, // Check for cascade conditions every 0.5s
    
    // Trigger thresholds
    CORRUPTION_THRESHOLD: 0.6, // Region must have > 60% corruption
    STABILITY_THRESHOLD: 0.4, // Region must have < 40% avg stability
    STANDING_WAVE_THRESHOLD: 0.3, // Unresolved wave energy > 30%
    
    // Cascade probability scaling
    BASE_CASCADE_CHANCE: 0.15, // 15% base chance when conditions met
    CORRUPTION_WEIGHT: 0.5, // +50% per unit corruption above threshold
    RUPTURE_HISTORY_WEIGHT: 0.3, // +30% per recent rupture
    HEALING_DEFICIT_WEIGHT: 0.4, // +40% if no recent healing
    
    // Propagation mechanics
    MAX_CASCADE_DEPTH: 3, // Max hops from origin
    ENERGY_DECAY_PER_HOP: 0.35, // 35% energy loss per hop
    MIN_PROPAGATION_ENERGY: 0.1, // Stop cascade below 10% energy
    PROPAGATION_DELAY: 0.15, // Seconds between cascade hops
    
    // Visual cascade timing
    TEAR_DURATION: 0.8, // Duration of spatial tear visual
    DESTABILIZATION_DURATION: 1.2, // Duration of phase destabilization
    COHERENCE_LOSS_DURATION: 0.6, // Duration of link coherence loss
    
    // Performance
    MAX_ACTIVE_CASCADES: 8, // Max simultaneous cascades
    VISUAL_POOL_SIZE: 32 // Pre-allocated visual effects
};

// ============================================================================
// CASCADE VISUAL EFFECT
// ============================================================================

class CascadeVisualEffect {
    constructor() {
        this.active = false;
        this.type = null; // 'tear', 'destabilize', 'coherence_loss'
        this.position = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.intensity = 1.0;
        this.progress = 0.0;
        this.duration = 1.0;
        this.affectedLinks = [];
        this.affectedNodes = [];
    }

    reset() {
        this.active = false;
        this.type = null;
        this.position.set(0, 0, 0);
        this.targetPosition.set(0, 0, 0);
        this.intensity = 1.0;
        this.progress = 0.0;
        this.duration = 1.0;
        this.affectedLinks.length = 0;
        this.affectedNodes.length = 0;
    }

    update(deltaTime) {
        if (!this.active) return;
        if (!this.frameScheduler?.shouldRunVisual?.()) return;
        this.progress += deltaTime / this.duration;
        
        if (this.progress >= 1.0) {
            this.reset();
            return;
        }

        // Apply visual effects based on type
        const t = this.progress;
        const intensity = this.intensity * (1.0 - t); // Fade out

        switch (this.type) {
            case 'tear':
                this.updateTearEffect(intensity, t);
                break;
            case 'destabilize':
                this.updateDestabilizeEffect(intensity, t);
                break;
            case 'coherence_loss':
                this.updateCoherenceLossEffect(intensity, t);
                break;
        }
    }

    updateTearEffect(intensity, t) {
        // Spatial tearing: rapid phase shift along links
        this.affectedLinks.forEach(link => {
            if (!link || !link.userData) return;
            
            // Store original if not already stored
            if (!link.userData.originalPhase) {
                link.userData.originalPhase = link.userData.phase || 0;
            }

            // Rapid phase destabilization
            const tearPhase = Math.sin(t * Math.PI * 8) * intensity * 2.0;
            link.userData.visualTear = tearPhase;
        });
    }

    updateDestabilizeEffect(intensity, t) {
        // Phase destabilization: nodes lose coherence
        this.affectedNodes.forEach(node => {
            if (!node || !node.userData) return;

            // Oscillating stability disruption
            const destabilization = Math.sin(t * Math.PI * 4) * intensity * 0.5;
            node.userData.visualDestabilization = destabilization;
        });
    }

    updateCoherenceLossEffect(intensity, t) {
        // Sudden coherence loss: links flicker and dim
        this.affectedLinks.forEach(link => {
            if (!link || !link.userData) return;

            // Sharp coherence drop
            const coherenceLoss = intensity * (1.0 - Math.pow(t, 2));
            link.userData.visualCoherenceLoss = coherenceLoss;
        });
    }
}

// ============================================================================
// CASCADE PROPAGATION STATE
// ============================================================================

class CascadePropagation {
    constructor() {
        this.active = false;
        this.originNode = null;
        this.currentDepth = 0;
        this.currentEnergy = 1.0;
        this.visitedNodes = new Set();
        this.currentFront = []; // Nodes at current cascade front
        this.nextFront = []; // Nodes to cascade to next
        this.timeToNextHop = 0.0;
        this.totalHops = 0;
    }

    reset() {
        this.active = false;
        this.originNode = null;
        this.currentDepth = 0;
        this.currentEnergy = 1.0;
        this.visitedNodes.clear();
        this.currentFront.length = 0;
        this.nextFront.length = 0;
        this.timeToNextHop = 0.0;
        this.totalHops = 0;
    }

    startCascade(originNode, initialEnergy) {
        this.reset();
        this.active = true;
        this.originNode = originNode;
        this.currentEnergy = initialEnergy;
        this.currentFront.push(originNode);
        this.visitedNodes.add(originNode.uuid);
        this.timeToNextHop = CONFIG.PROPAGATION_DELAY;
    }
}

// ============================================================================
// MAIN CASCADING RUPTURE SYSTEM
// ============================================================================

export class CascadingRuptureSystem {
    constructor(scene, aiNodes, linkingSystem, regionalEquilibrium) {
        this.scene = scene;
        this.aiNodes = aiNodes;
        this.linkingSystem = linkingSystem;
        this.regionalEquilibrium = regionalEquilibrium;

        // Enable flag (default: false for safety)
        this.enabled = false;

        // Detection state
        this.detectionTimer = 0.0;
        this.lastRuptureCheck = 0.0;
        
        // Rupture history (for probability scaling)
        this.ruptureHistory = new Map(); // nodeId -> timestamp[]
        this.healingHistory = new Map(); // nodeId -> timestamp
        
        // Active cascades
        this.activeCascades = [];
        for (let i = 0; i < CONFIG.MAX_ACTIVE_CASCADES; i++) {
            this.activeCascades.push(new CascadePropagation());
        }
        
        // Visual effect pool
        this.visualEffects = [];
        for (let i = 0; i < CONFIG.VISUAL_POOL_SIZE; i++) {
            this.visualEffects.push(new CascadeVisualEffect());
        }

        // Event listeners (for external systems to hook into)
        this.onCascadeStart = null; // (originNode, energy) => void
        this.onCascadeHop = null; // (fromNode, toNode, energy) => void
        this.onCascadeComplete = null; // (originNode, totalHops) => void
        this.onNodeCritical = null; // (node) => void (triggers failure system)

        console.log('[CascadingRuptureSystem] Initialized (disabled by default)');
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    enable() {
        this.enabled = true;
        console.log('[CascadingRuptureSystem] ENABLED - Cascades active');
    }

    disable() {
        this.enabled = false;
        // Clean up active cascades
        this.activeCascades.forEach(cascade => cascade.reset());
        this.visualEffects.forEach(effect => effect.reset());
        console.log('[CascadingRuptureSystem] DISABLED');
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time, ruptureSystem, harmonySystem) {
        if (!this.enabled) return;

        // Update detection timer
        this.detectionTimer += deltaTime;

        // Periodic detection check
        if (this.detectionTimer >= CONFIG.DETECTION_INTERVAL) {
            this.detectionTimer = 0.0;
            this.detectCascadeOpportunities(time, ruptureSystem, harmonySystem);
        }

        // Update active cascades
        this.updateActiveCascades(deltaTime, time);

        // Update visual effects
        this.updateVisualEffects(deltaTime);
    }

    // ========================================================================
    // CASCADE DETECTION
    // ========================================================================

    detectCascadeOpportunities(time, ruptureSystem, harmonySystem) {
        if (!this.aiNodes || !this.linkingSystem) return;

        const nodes = this.aiNodes.nodes || [];
        if (nodes.length === 0) return;

        // Check each node for cascade trigger conditions
        nodes.forEach(node => {
            if (!this.shouldCheckNodeForCascade(node, time)) return;

            const cascadeChance = this.calculateCascadeProbability(
                node,
                time,
                ruptureSystem,
                harmonySystem
            );

            if (Math.random() < cascadeChance) {
                this.initiateCascade(node, time);
            }
        });
    }

    shouldCheckNodeForCascade(node, time) {
        if (!node || !node.userData) return false;

        // Skip if node is isolated
        const links = this.linkingSystem.getNodeLinks(node);
        if (!links || links.length === 0) return false;

        // Check corruption threshold
        const corruption = node.userData.corruption || 0;
        if (corruption < CONFIG.CORRUPTION_THRESHOLD) return false;

        // Check stability threshold
        const stability = node.userData.stability || 1.0;
        if (stability > CONFIG.STABILITY_THRESHOLD) return false;

        // Don't cascade too frequently from same node
        const lastCascadeTime = node.userData.lastCascadeTime || 0;
        if (time - lastCascadeTime < 5.0) return false;

        return true;
    }

    calculateCascadeProbability(node, time, ruptureSystem, harmonySystem) {
        let probability = CONFIG.BASE_CASCADE_CHANCE;

        // Factor 1: Corruption dominance
        const corruption = node.userData.corruption || 0;
        const corruptionBonus = (corruption - CONFIG.CORRUPTION_THRESHOLD) * CONFIG.CORRUPTION_WEIGHT;
        probability += corruptionBonus;

        // Factor 2: Rupture history
        const ruptureCount = this.getRecentRuptureCount(node.uuid, time, 10.0);
        probability += ruptureCount * CONFIG.RUPTURE_HISTORY_WEIGHT;

        // Factor 3: Lack of recent healing
        const lastHealing = this.healingHistory.get(node.uuid) || 0;
        const timeSinceHealing = time - lastHealing;
        if (timeSinceHealing > 8.0) {
            probability += CONFIG.HEALING_DEFICIT_WEIGHT;
        }

        // Factor 4: Standing wave presence (if system exists)
        // Standing waves indicate structural tension
        if (this.regionalEquilibrium) {
            // This would need to query standing wave energy near node
            // For now, placeholder
            const standingWaveEnergy = 0.0; // TODO: query standing wave system
            if (standingWaveEnergy > CONFIG.STANDING_WAVE_THRESHOLD) {
                probability += 0.2;
            }
        }

        return Math.min(probability, 0.95); // Cap at 95%
    }

    getRecentRuptureCount(nodeId, currentTime, timeWindow) {
        const history = this.ruptureHistory.get(nodeId);
        if (!history) return 0;

        const cutoffTime = currentTime - timeWindow;
        return history.filter(t => t > cutoffTime).length;
    }

    // ========================================================================
    // CASCADE INITIATION
    // ========================================================================

    initiateCascade(originNode, time) {
        // Find available cascade slot
        const cascade = this.activeCascades.find(c => !c.active);
        if (!cascade) {
            console.warn('[CascadingRuptureSystem] Max cascades reached, ignoring');
            return;
        }

        // Calculate initial energy based on node state
        const corruption = originNode.userData.corruption || 0;
        const initialEnergy = Math.min(corruption * 1.5, 1.0);

        // Start cascade
        cascade.startCascade(originNode, initialEnergy);

        // Record cascade time
        originNode.userData.lastCascadeTime = time;

        // Trigger visual at origin
        this.triggerVisualEffect('destabilize', originNode.position, [originNode], [], initialEnergy);

        // Fire event
        if (this.onCascadeStart) {
            this.onCascadeStart(originNode, initialEnergy);
        }

        console.log(`[CascadingRuptureSystem] Cascade initiated from node ${originNode.uuid.slice(0, 8)}`);
    }

    // ========================================================================
    // CASCADE PROPAGATION
    // ========================================================================

    updateActiveCascades(deltaTime, time) {
        this.activeCascades.forEach(cascade => {
            if (!cascade.active) return;

            cascade.timeToNextHop -= deltaTime;

            if (cascade.timeToNextHop <= 0) {
                this.propagateCascade(cascade, time);
                cascade.timeToNextHop = CONFIG.PROPAGATION_DELAY;
            }
        });
    }

    propagateCascade(cascade, time) {
        // Check if cascade should terminate
        if (cascade.currentEnergy < CONFIG.MIN_PROPAGATION_ENERGY ||
            cascade.currentDepth >= CONFIG.MAX_CASCADE_DEPTH ||
            cascade.currentFront.length === 0) {
            this.completeCascade(cascade);
            return;
        }

        // Propagate to next front
        cascade.currentFront.forEach(node => {
            this.propagateFromNode(cascade, node, time);
        });

        // Advance front
        cascade.currentFront = cascade.nextFront.slice();
        cascade.nextFront.length = 0;
        cascade.currentDepth++;
        cascade.currentEnergy *= (1.0 - CONFIG.ENERGY_DECAY_PER_HOP);
    }

    propagateFromNode(cascade, fromNode, time) {
        const links = this.linkingSystem.getNodeLinks(fromNode);
        if (!links) return;

        links.forEach(link => {
            const toNode = this.getOtherNode(link, fromNode);
            if (!toNode) return;

            // Skip if already visited
            if (cascade.visitedNodes.has(toNode.uuid)) return;

            // Skip if link is too stable (resists cascade)
            const linkQuality = link.userData?.quality || 1.0;
            if (linkQuality > 0.7) return;

            // Add to next front
            cascade.nextFront.push(toNode);
            cascade.visitedNodes.add(toNode.uuid);
            cascade.totalHops++;

            // Trigger visual effects
            this.triggerVisualEffect('tear', fromNode.position, [], [link], cascade.currentEnergy);
            this.triggerVisualEffect('coherence_loss', toNode.position, [toNode], [link], cascade.currentEnergy * 0.7);

            // Check if node enters critical state
            this.checkNodeCritical(toNode, cascade.currentEnergy);

            // Fire hop event
            if (this.onCascadeHop) {
                this.onCascadeHop(fromNode, toNode, cascade.currentEnergy);
            }

            // Record rupture in history
            this.recordRupture(toNode.uuid, time);
        });
    }

    getOtherNode(link, node) {
        if (!link.userData || !link.userData.nodeA || !link.userData.nodeB) return null;
        return link.userData.nodeA.uuid === node.uuid ? link.userData.nodeB : link.userData.nodeA;
    }

    completeCascade(cascade) {
        // Fire completion event
        if (this.onCascadeComplete && cascade.originNode) {
            this.onCascadeComplete(cascade.originNode, cascade.totalHops);
        }

        console.log(`[CascadingRuptureSystem] Cascade complete: ${cascade.totalHops} hops, depth ${cascade.currentDepth}`);

        cascade.reset();
    }

    // ========================================================================
    // CRITICAL NODE CHECK
    // ========================================================================

    checkNodeCritical(node, cascadeEnergy) {
        if (!node.userData) return;

        const corruption = node.userData.corruption || 0;
        const stability = node.userData.stability || 1.0;

        // High cascade energy + low stability + high corruption = critical
        if (cascadeEnergy > 0.5 && stability < 0.3 && corruption > 0.7) {
            // Mark node as approaching critical
            node.userData.approachingCritical = true;
            node.userData.criticalEnergy = cascadeEnergy;

            // Fire critical event (external failure system handles countdown)
            if (this.onNodeCritical) {
                this.onNodeCritical(node);
            }
        }
    }

    // ========================================================================
    // VISUAL EFFECTS
    // ========================================================================

    triggerVisualEffect(type, position, nodes, links, intensity) {
        const effect = this.visualEffects.find(e => !e.active);
        if (!effect) return;

        effect.active = true;
        effect.type = type;
        effect.position.copy(position);
        effect.intensity = intensity;
        effect.progress = 0.0;
        effect.affectedNodes = nodes.slice();
        effect.affectedLinks = links.slice();

        switch (type) {
            case 'tear':
                effect.duration = CONFIG.TEAR_DURATION;
                break;
            case 'destabilize':
                effect.duration = CONFIG.DESTABILIZATION_DURATION;
                break;
            case 'coherence_loss':
                effect.duration = CONFIG.COHERENCE_LOSS_DURATION;
                break;
        }
    }

    updateVisualEffects(deltaTime) {
        this.visualEffects.forEach(effect => effect.update(deltaTime));
    }

    // ========================================================================
    // HISTORY TRACKING
    // ========================================================================

    recordRupture(nodeId, time) {
        if (!this.ruptureHistory.has(nodeId)) {
            this.ruptureHistory.set(nodeId, []);
        }
        this.ruptureHistory.get(nodeId).push(time);

        // Keep only last 20 ruptures per node
        const history = this.ruptureHistory.get(nodeId);
        if (history.length > 20) {
            history.shift();
        }
    }

    recordHealing(nodeId, time) {
        this.healingHistory.set(nodeId, time);
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.activeCascades.forEach(c => c.reset());
        this.visualEffects.forEach(e => e.reset());
        this.ruptureHistory.clear();
        this.healingHistory.clear();
        console.log('[CascadingRuptureSystem] Disposed');
    }
}
