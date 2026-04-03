
import * as THREE from 'three';

function getAtomaVisualDebugMode() {
    const mode = (typeof window !== 'undefined' && window.__ATOMA_VISUAL_DEBUG_MODE__)
        || globalThis.__ATOMA_VISUAL_DEBUG_MODE__
        || 'all';
    return `${mode}`.toLowerCase();
}

/**
 * ============================================================================
 * HARMONIC HEALING VISUAL SYSTEM (Session 134)
 * ============================================================================
 * 
 * "Golden Wave" Logic Engine
 * 
 * This system orchestrates the "Healing" dimension (Dim 15) of the network.
 * It detects when the network is in a state of Harmony and generates 
 * autonomous "Healing Waves" that travel along links to repair corruption.
 * 
 * Responsibilities:
 * 1. Wave Generation: Spawns waves based on global Harmony and link health.
 * 2. Wave Physics: Moves waves along link paths (node A -> node B).
 * 3. Visual Driver: Calls HealingParticleSystem to render the golden trails.
 * 4. Logic Driver: (Future) Actually repairs link stats on arrival.
 * 
 * Integration:
 * - Inputs: Global Harmony state, Link health metrics.
 * - Outputs: Calls to HealingParticleSystem.emitHealingTrail().
 * 
 * ============================================================================
 */

class HealingWave {
    constructor(link, startNode, endNode, speed, intensity) {
        this.link = link;
        this.startNode = startNode;
        this.endNode = endNode;
        this.speed = speed;       // Units per second
        this.intensity = intensity; // 0.0 - 1.0
        
        this.progress = 0.0;      // 0.0 - 1.0
        this.active = true;
        
        // Cache positions to avoid recalculating every frame if nodes don't move much
        // But nodes DO move, so we'll grab them in update.
        
        // Direction for particles
        this.currentPos = new THREE.Vector3();
        this.currentDir = new THREE.Vector3();
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        // Get current world positions
        const startPos = this.startNode.position;
        const endPos = this.endNode.position;
        
        // Calculate distance
        const distance = startPos.distanceTo(endPos);
        if (distance < 0.1) {
            this.active = false;
            return;
        }
        
        // Advance progress
        const step = (this.speed * deltaTime) / distance;
        this.progress += step;
        
        if (this.progress >= 1.0) {
            this.progress = 1.0;
            this.active = false;
            // TODO: Trigger arrival event (healing impact)
        }
        
        // Update position and direction
        this.currentPos.lerpVectors(startPos, endPos, this.progress);
        this.currentDir.subVectors(endPos, startPos).normalize();
    }
}

export class HarmonicHealingVisualSystem_Session134 {
    constructor(scene, linkingSystem, particleSystem, config = {}, semanticBus = null) {
        this.scene = scene;
        this.linkingSystem = linkingSystem;
        this.particles = particleSystem;
        this.semanticBus = semanticBus || globalThis?.semanticBus || null;
        
        this.config = {
            waveSpeed: 4.25,
            maxWaves: 120,
            repairVisualsOnly: false,
            debugVisualBoost: true,
            highCooldown: 3.0,
            midCooldown: 5.0,
            lowCooldown: 8.0,
            ...config
        };
        
        this.waves = [];
        this._lastResolvedHealingState = null;
        
        this._linkCooldowns = new Map();
        
        this._eventDrivenEnabled = false;
        this._unsubscribeHarmonyHigh = null;
        this._unsubscribeHarmonyMid = null;
        this._unsubscribeHarmonyLow = null;
        
        this._setupEventSubscriptions();
        
        console.log('✨ [HarmonicHealing] System Initialized (Event-Driven Mode)');
    }

    _setupEventSubscriptions() {
        if (!this.semanticBus || typeof this.semanticBus.subscribe !== 'function') {
            this._eventDrivenEnabled = false;
            return;
        }

        this._onHarmonyHigh = (payload = {}) => {
            this._handleHarmonyHigh(payload);
        };
        
        this._onHarmonyMid = (payload = {}) => {
            this._handleHarmonyMid(payload);
        };
        
        this._onHarmonyLow = (payload = {}) => {
            this._handleHarmonyLow(payload);
        };

        const unsubHigh = this.semanticBus.subscribe('link.harmony.high', this._onHarmonyHigh);
        const unsubMid = this.semanticBus.subscribe('link.harmony.mid', this._onHarmonyMid);
        const unsubLow = this.semanticBus.subscribe('link.harmony.low', this._onHarmonyLow);

        if (typeof unsubHigh === 'function') {
            this._unsubscribeHarmonyHigh = unsubHigh;
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
            this._unsubscribeHarmonyHigh = () => {
                this.semanticBus.unsubscribe('link.harmony.high', this._onHarmonyHigh);
            };
        }

        if (typeof unsubMid === 'function') {
            this._unsubscribeHarmonyMid = unsubMid;
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
            this._unsubscribeHarmonyMid = () => {
                this.semanticBus.unsubscribe('link.harmony.mid', this._onHarmonyMid);
            };
        }

        if (typeof unsubLow === 'function') {
            this._unsubscribeHarmonyLow = unsubLow;
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
            this._unsubscribeHarmonyLow = () => {
                this.semanticBus.unsubscribe('link.harmony.low', this._onHarmonyLow);
            };
        }

        this._eventDrivenEnabled = true;
    }

    _getCurrentTime() {
        return (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);
    }

    _checkCooldown(linkId, cooldownDuration) {
        const lastTime = this._linkCooldowns.get(linkId);
        if (lastTime === undefined) return false;
        const now = this._getCurrentTime();
        return (now - lastTime) < cooldownDuration;
    }

    _setCooldown(linkId) {
        this._linkCooldowns.set(linkId, this._getCurrentTime());
    }

    _handleHarmonyHigh(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId) return;
        
        if (this._checkCooldown(linkId, this.config.highCooldown)) return;
        
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 1.0, 'high');
            this._setCooldown(linkId);
        }
    }

    _handleHarmonyMid(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId) return;
        
        if (this._checkCooldown(linkId, this.config.midCooldown)) return;
        
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 0.7, 'mid');
            this._setCooldown(linkId);
        }
    }

    _handleHarmonyLow(payload = {}) {
        const linkId = payload?.linkId;
        if (!linkId) return;
        
        if (this._checkCooldown(linkId, this.config.lowCooldown)) return;
        
        const link = this._getLinkById(linkId);
        if (link) {
            this._spawnWaveOnLink(link, 0.4, 'low');
            this._setCooldown(linkId);
        }
    }

    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && (l.id === linkId || l.linkId === linkId));
    }

    _spawnWaveOnLink(link, intensity, level) {
        if (this.waves.length >= this.config.maxWaves) return;
        
        const source = link.source || link.sourceNode || link.nodeA;
        const target = link.target || link.targetNode || link.nodeB;
        if (!source || !target) return;

        const reverse = Math.random() > 0.5;
        const start = reverse ? target : source;
        const end = reverse ? source : target;

        const speed = this.config.waveSpeed * (0.95 + Math.random() * 0.1);
        const debugBoost = this.config.debugVisualBoost ? 1.35 : 1.0;
        const finalIntensity = Math.min(1, intensity * debugBoost);

        const wave = new HealingWave(link, start, end, speed, finalIntensity);
        this.waves.push(wave);

        if (this.particles?.emitSplash && start?.position) {
            this.particles.emitSplash(start.position, Math.min(1, finalIntensity * 0.75), this._getCurrentTime());
        }
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, time, networkState) {
        const mode = getAtomaVisualDebugMode();
        if (mode !== 'all' && mode !== 'healing') return;
        if (this.frameScheduler && this.frameScheduler.shouldRunVisual?.() === false) return;

        const healingState = this._resolveHealingState(networkState);
        this._lastResolvedHealingState = healingState;
        
        this._updateWaves(deltaTime, time);
    }

    _resolveHealingState(networkState = {}) {
        const liveMetrics = (typeof window !== 'undefined' && window.__ATOMA_LIVE_METRICS__)
            ? window.__ATOMA_LIVE_METRICS__
            : {};
        const clamp01 = (value) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return 0;
            return Math.max(0, Math.min(1, numeric));
        };

        const harmony = clamp01(
            networkState.harmony ??
            networkState.harmonyFlow ??
            liveMetrics.harmonyFlow ??
            liveMetrics.avgHarmony ??
            liveMetrics.networkSynergy ??
            liveMetrics.avgSynergy ??
            0
        );
        const synergy = clamp01(
            networkState.synergy ??
            networkState.networkSynergy ??
            liveMetrics.networkSynergy ??
            liveMetrics.avgSynergy ??
            0
        );
        const corruption = clamp01(
            networkState.corruption ??
            networkState.corruptionLevel ??
            liveMetrics.corruptionLevel ??
            liveMetrics.avgCorruption ??
            0
        );
        const loadPressure = clamp01(
            networkState.loadPressure ??
            liveMetrics.loadPressure ??
            liveMetrics.avgLoadPressure ??
            0
        );
        const networkStress = clamp01(
            networkState.networkStress ??
            liveMetrics.networkStress ??
            (1 - (networkState.stability ?? liveMetrics.avgStability ?? 0.5))
        );
        const stability = clamp01(
            networkState.stability ??
            liveMetrics.stability ??
            liveMetrics.avgStability ??
            (1 - networkStress)
        );

        // Healing should become more active when the network is cohesive and stable,
        // but still remain possible when harmony is moderate.
        const healingDrive = clamp01(
            harmony * 0.38 +
            synergy * 0.18 +
            stability * 0.28 -
            corruption * 0.10 -
            loadPressure * 0.06
        );

        return {
            harmony,
            synergy,
            corruption,
            loadPressure,
            networkStress,
            stability,
            healingDrive,
            recoveryReady: healingDrive >= 0.75
                ? 'HIGH'
                : healingDrive >= 0.5
                    ? 'MEDIUM'
                    : healingDrive >= this.config.harmonyThreshold
                        ? 'LOW'
                        : 'IDLE'
        };
    }
    
    /**
     * Update all active waves
     */
    _updateWaves(deltaTime, time) {
        // Filter out dead waves in place-ish (create new array is cleaner for JS)
        // Optimization: Use a pool if this creates too much garbage, 
        // but for <50 waves, simple array operations are fine.
        
        const activeWaves = [];
        
        for (const wave of this.waves) {
            wave.update(deltaTime);
            
            if (wave.active) {
                activeWaves.push(wave);
                
                // Emit visual trail via Particle System
                if (this.particles) {
                    const trailVelocity = wave.currentDir.clone().multiplyScalar(wave.speed * 0.3);
                    this.particles.emitHealingTrail(
                        wave.currentPos,
                        trailVelocity,
                        wave.intensity,
                        time,
                        new THREE.Color(0x66f7ff) // primary healing color
                    );
                }
            } else {
                // Wave arrived! 
                this._handleWaveArrival(wave, time);
            }
        }
        
        this.waves = activeWaves;
    }

    /**
     * Handle wave arrival at destination
     */
    _handleWaveArrival(wave, time) {
        // 1. Visual Splash
        if (this.particles && this.particles.emitSplash) {
            this.particles.emitSplash(
                wave.endNode.position,
                wave.intensity,
                time
            );
        }

        // 2. Gameplay Impact
        if (!this.config.repairVisualsOnly) {
            this._applyHealingImpact(wave);
        }
    }

    /**
     * Apply gameplay effects to the target node/link
     */
    _applyHealingImpact(wave) {
        const targetNode = wave.endNode;
        const healingPower = wave.intensity * 0.1; // 10% max reduction per wave

        // Heal Node Corruption (canonical path: userData.metrics.corruption)
        if (targetNode && targetNode.userData) {
            if (!targetNode.userData.metrics) targetNode.userData.metrics = {};
            const currentCorruption = targetNode.userData.metrics.corruption ?? targetNode.userData.corruption ?? 0;
            targetNode.userData.metrics.corruption = Math.max(0, currentCorruption - healingPower);
            // Sync legacy path
            if (typeof targetNode.userData.corruption !== 'undefined') {
                targetNode.userData.corruption = targetNode.userData.metrics.corruption;
            }
        }

        // Heal Link Stability (canonical path: userData.metrics.stability)
        const link = wave.link;
        if (link && link.userData) {
            if (!link.userData.visualState) link.userData.visualState = {};
            const currentStability = Number.isFinite(link.userData.visualState.stability)
                ? link.userData.visualState.stability
                : Number.isFinite(link.userData.metrics?.stability)
                    ? link.userData.metrics.stability
                    : Number.isFinite(link.userData.stability)
                        ? link.userData.stability
                        : 0.5;
            link.userData.visualState.stability = Math.min(1.0, currentStability + healingPower);
            link.userData.visualState.healingPower = healingPower;
            link.userData.visualState.updatedAt = Date.now();
        }
        
        if (Math.random() < 0.01) {
            console.log(`✨ Healed Node ${targetNode?.id} by ${healingPower.toFixed(3)}`);
        }
    }
    
    _spawnSingleWave(healingState = {}, time = 0) {
        if (!this.linkingSystem || !this.linkingSystem.links || this.linkingSystem.links.length === 0) return;

        const links = this.linkingSystem.links;
        const targetLink = this._pickHealingTargetLink(links);
        if (!targetLink || !targetLink.source || !targetLink.target) return;

        const reverse = Math.random() > 0.5;
        const start = reverse ? targetLink.target : targetLink.source;
        const end = reverse ? targetLink.source : targetLink.target;
        
        const speed = this.config.waveSpeed * (0.8 + Math.random() * 0.4);
        const debugBoost = this.config.debugVisualBoost ? 1.35 : 1.0;
        const intensity = Math.min(
            1,
            (0.45 + Math.min(1, (healingState.healingDrive ?? healingState.harmony ?? 0)) * 0.55) * debugBoost
        );
        
        const wave = new HealingWave(targetLink, start, end, speed, intensity);
        this.waves.push(wave);

        if (this.particles?.emitSplash && start?.position) {
            this.particles.emitSplash(start.position, Math.min(1, intensity * 0.75), time);
        }
    }

    _pickHealingTargetLink(links) {
        if (!Array.isArray(links) || links.length === 0) return null;

        let bestLink = null;
        let bestScore = -Infinity;

        for (const link of links) {
            if (!link?.source || !link?.target) continue;

            const metrics = link.userData?.metrics || {};
            const visualStability = Number.isFinite(link.userData?.visualState?.stability)
                ? link.userData.visualState.stability
                : null;
            const stability = Number.isFinite(visualStability)
                ? visualStability
                : Number.isFinite(metrics.stability)
                    ? metrics.stability
                    : Number.isFinite(link.userData?.stability)
                        ? link.userData.stability
                        : 0.5;
            const corruption = Number.isFinite(metrics.corruption)
                ? metrics.corruption
                : Number.isFinite(link.userData?.corruption)
                    ? link.userData.corruption
                    : 0;
            const cascadeIntensity = Number.isFinite(link.userData?.cascadeIntensity)
                ? link.userData.cascadeIntensity
                : 0;
            const flowIntensity = Number.isFinite(link.userData?.flowState?.intensity)
                ? link.userData.flowState.intensity
                : 0;

            // Prefer hurt / stressed links so the healing effect is legible and useful.
            const score =
                (1 - Math.max(0, Math.min(1, stability))) * 0.55 +
                Math.max(0, Math.min(1, corruption)) * 0.25 +
                Math.max(0, Math.min(1, Math.max(cascadeIntensity, flowIntensity))) * 0.20;

            if (score > bestScore) {
                bestScore = score;
                bestLink = link;
            }
        }

        if (bestLink) return bestLink;
        return links[Math.floor(Math.random() * links.length)] || null;
    }

    getStats() {
        return {
            waveCount: this.waves.length,
            eventDrivenEnabled: this._eventDrivenEnabled,
            activeCooldowns: this._linkCooldowns.size,
            lastResolvedState: this._lastResolvedHealingState,
            config: {
                waveSpeed: this.config.waveSpeed,
                maxWaves: this.config.maxWaves,
                repairVisualsOnly: this.config.repairVisualsOnly,
                highCooldown: this.config.highCooldown,
                midCooldown: this.config.midCooldown,
                lowCooldown: this.config.lowCooldown
            }
        };
    }
    
    /**
     * External trigger (e.g. from user action or ritual)
     */
    triggerWaveBatch(count = 10) {
        for(let i=0; i<count; i++) {
            this._spawnSingleWave(1.0);
        }
    }

    dispose() {
        if (typeof this._unsubscribeHarmonyHigh === 'function') {
            this._unsubscribeHarmonyHigh();
        }
        if (typeof this._unsubscribeHarmonyMid === 'function') {
            this._unsubscribeHarmonyMid();
        }
        if (typeof this._unsubscribeHarmonyLow === 'function') {
            this._unsubscribeHarmonyLow();
        }
        this.waves = [];
        this._linkCooldowns.clear();
    }
}
