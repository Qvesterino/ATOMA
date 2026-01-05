
import * as THREE from 'three';

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
    constructor(scene, nodeLinkingSystem, particleSystem, config = {}) {
        this.scene = scene;
        this.nodeLinking = nodeLinkingSystem;
        this.particles = particleSystem;
        
        this.config = {
            waveSpeed: 5.0,           // Units per second
            spawnInterval: 0.1,       // Minimum seconds between spawns
            harmonyThreshold: 0.3,    // Minimum harmony to start spawning
            maxWaves: 50,             // Performance limit
            repairVisualsOnly: false, // Allow gameplay stats changes
            ...config
        };
        
        this.waves = [];
        this.accumulatedTime = 0;
        this.lastSpawnTime = 0;
        
        console.log('✨ [HarmonicHealing] System Initialized (Golden Waves Ready)');
    }
    
    /**
     * Main update loop
     */
    update(deltaTime, time, networkState) {
        // 1. Manage Wave Lifecycle (Move, Render, Cull)
        this._updateWaves(deltaTime, time);
        
        // 2. Spawn New Waves (if conditions met)
        this._attemptSpawn(time, networkState);
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
                    this.particles.emitHealingTrail(
                        wave.currentPos,
                        wave.currentDir,
                        wave.intensity,
                        time
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

        // Heal Node Corruption
        if (targetNode && typeof targetNode.corruption !== 'undefined') {
            targetNode.corruption = Math.max(0, targetNode.corruption - healingPower);
            
            // Optional: Trigger node's internal update if needed
            // if (targetNode.updateVisuals) targetNode.updateVisuals();
        }

        // Heal Link Stability (if link has stats)
        const link = wave.link;
        if (link && typeof link.stability !== 'undefined') {
            link.stability = Math.min(1.0, link.stability + healingPower);
        }
        
        // Log occasionally for debug
        if (Math.random() < 0.01) {
            console.log(`✨ Healed Node ${targetNode.id} by ${healingPower.toFixed(3)}`);
        }
    }
    
    /**
     * Logic to decide if/where to spawn a new wave
     */
    _attemptSpawn(time, state) {
        // Rate limiting
        if (time - this.lastSpawnTime < this.config.spawnInterval) return;
        
        // Cap count
        if (this.waves.length >= this.config.maxWaves) return;
        
        // Harmony check
        const harmony = state.harmony || 0;
        if (harmony < this.config.harmonyThreshold) return;
        
        // Determine number of waves to spawn based on harmony
        // 0.3 -> 0 spawns (threshold)
        // 1.0 -> max spawn rate
        const spawnChance = (harmony - this.config.harmonyThreshold) / (1.0 - this.config.harmonyThreshold);
        if (Math.random() > spawnChance) return;
        
        this._spawnSingleWave(harmony);
        this.lastSpawnTime = time;
    }
    
    /**
     * Pick a target link and spawn a wave
     */
    _spawnSingleWave(globalHarmony) {
        if (!this.nodeLinking || !this.nodeLinking.links || this.nodeLinking.links.length === 0) return;
        
        // Strategy: 
        // 1. Pick a random link (simple)
        // 2. Advanced: Pick a "hurt" link (low quality, high stress)
        
        // Let's try to find a link that needs healing
        // We'll sample a few random links and pick the worst one, or just random
        // For visual flair, random is often better distribution.
        
        const links = this.nodeLinking.links;
        const randomLink = links[Math.floor(Math.random() * links.length)];
        
        if (!randomLink || !randomLink.source || !randomLink.target) return;
        
        // Determine direction (randomly A->B or B->A)
        const reverse = Math.random() > 0.5;
        const start = reverse ? randomLink.target : randomLink.source;
        const end = reverse ? randomLink.source : randomLink.target;
        
        // Wave properties
        const speed = this.config.waveSpeed * (0.8 + Math.random() * 0.4); // Var speed
        const intensity = 0.5 + globalHarmony * 0.5; // Brighter/stronger with more harmony
        
        const wave = new HealingWave(randomLink, start, end, speed, intensity);
        this.waves.push(wave);
    }
    
    /**
     * External trigger (e.g. from user action or ritual)
     */
    triggerWaveBatch(count = 10) {
        for(let i=0; i<count; i++) {
            this._spawnSingleWave(1.0);
        }
    }
}
