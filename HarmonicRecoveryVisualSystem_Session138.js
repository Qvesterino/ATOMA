/**
 * ============================================================================
 * HARMONIC RECOVERY VISUAL SYSTEM (Session 138)
 * ============================================================================
 * 
 * High-level visual recovery system representing network repair after rupture.
 * Adapter-only system that monitors rupture state and triggers healing visuals.
 * 
 * VISUAL LAYERS:
 * 1. Coherence Re-Alignment Waves: Slow, broad, transparent waves from healed zones.
 * 2. Link Re-Stitching: Subtle "tightening" visualization on affected links.
 * 3. Node Recovery Halos: Soft, inward-fading halos on recovering nodes.
 * 
 * LOGIC:
 * - Detects completion of Rupture events (post-burst).
 * - Spawns "Recovering Zones" at rupture sites.
 * - Orchestrates visual effects based on Harmony/Synergy state.
 * - Entirely read-only; does not mutate gameplay state.
 * 
 * TEMPORAL BEHAVIOR:
 * - Slower than rupture.
 * - Recovery visuals outlast damage visuals.
 * 
 * ============================================================================
 */

import * as THREE from 'three';
import VisualTime from './src/time/VisualTime.js';

const COHERENCE_WAVE_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const COHERENCE_WAVE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uLife;      // 0.0 to 1.0 (lifecycle)
uniform vec3 uColor;
uniform float uHarmony;

varying vec2 vUv;

void main() {
    // Distance from center (0.5, 0.5)
    float dist = length(vUv - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Ring effect
    // As uLife increases, the ring expands (handled by mesh scale)
    // Here we just draw a soft ring
    
    float ringWidth = 0.2 + (1.0 - uHarmony) * 0.1; // Thinner with high harmony
    float edge = smoothstep(0.5, 0.5 - ringWidth, dist);
    float centerHole = smoothstep(0.5 - ringWidth * 1.5, 0.5 - ringWidth * 0.5, dist);
    
    float alpha = edge * centerHole;
    
    // Soft noise/distortion based on harmony (more harmony = smoother)
    // We simulate "spatial distortion" by varying alpha slightly
    
    // Fade over life
    alpha *= (1.0 - uLife); // Fade out as it ages
    alpha *= 0.4; // Base transparency (very subtle)
    
    gl_FragColor = vec4(uColor, alpha);
}
`;

const RECOVERY_HALO_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const RECOVERY_HALO_FRAGMENT_SHADER = `
uniform float uLife;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    float dist = length(vUv - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft halo expanding inward?
    // "Fades inward rather than outward" -> Edge is distinct, center is soft?
    // Or alpha gradient is inverted?
    
    // Let's make a soft cloud
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Fade out over life
    alpha *= (1.0 - uLife);
    alpha *= 0.5; // Base opacity
    
    gl_FragColor = vec4(uColor, alpha);
}
`;

export class HarmonicRecoveryVisualSystem_Session138 {
    constructor(scene, ruptureSystem, healingParticleSystem, nodeLinkingSystem) {
        this.scene = scene;
        this.ruptureSystem = ruptureSystem;
        this.healingParticles = healingParticleSystem;
        this.linkingSystem = nodeLinkingSystem;
        
        this.config = {
            minRecoveryDuration: 3.0,
            maxRecoveryDuration: 8.0,
            waveExpansionSpeed: 2.0,
            stitchingInterval: 0.05, // High density for "tightening" look
            maxActiveZones: 10
        };
        
        // State tracking
        this.activeRuptureIds = new Set();
        this.recoveringZones = []; // { pos, linkId, life, maxLife, type }
        
        // Pools
        this.waveMeshPool = [];
        this.haloMeshPool = [];
        
        // Materials
        this.waveMaterial = new THREE.ShaderMaterial({
            vertexShader: COHERENCE_WAVE_VERTEX_SHADER,
            fragmentShader: COHERENCE_WAVE_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(0.8, 0.9, 1.0) }, // Soft white/blue
                uHarmony: { value: 0.5 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        this.haloMaterial = new THREE.ShaderMaterial({
            vertexShader: RECOVERY_HALO_VERTEX_SHADER,
            fragmentShader: RECOVERY_HALO_FRAGMENT_SHADER,
            uniforms: {
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(1.0, 0.95, 0.8) } // Warm white
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Init pools
        this._initPools();
        
        this._timeOrigin = undefined;
        this._lastUpdateTime = undefined;
        
        console.log('✨ [Session 138] HarmonicRecoveryVisualSystem initialized');
    }
    
    _initPools() {
        // Coherence Waves (Planes)
        const waveGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 10; i++) {
            const mesh = new THREE.Mesh(waveGeo, this.waveMaterial.clone());
            mesh.visible = false;
            mesh.rotation.x = -Math.PI / 2; // Flat on ground-ish
            mesh.renderOrder = 5; // Below particles
            this.scene.add(mesh);
            this.waveMeshPool.push({ mesh, active: false });
        }
        
        // Node Halos (Billboards)
        const haloGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(haloGeo, this.haloMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = 6;
            this.scene.add(mesh);
            this.haloMeshPool.push({ mesh, active: false });
        }
    }
    
    update(deltaTime, time, networkState) {
        if (!this.frameScheduler?.shouldRunVisual?.()) return;
        if (!this.enabled) return;

        if (this._timeOrigin === undefined) {
            this._timeOrigin = VisualTime.now;
        }
        const currentVisualTime = VisualTime.now - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)

        if (this._lastUpdateTime === undefined) {
            this._lastUpdateTime = currentVisualTime;
        }

        const sinceLast = currentVisualTime - this._lastUpdateTime;
        if (sinceLast < CONFIG.UPDATE_INTERVAL) return;
        this._lastUpdateTime = currentVisualTime;

        // 1. Detect Rupture Completions
        this._detectRuptureEvents(currentVisualTime);
        
        // 2. Update Recovering Zones
        this._updateRecoveringZones(networkState, currentVisualTime);
        
        // 3. Update Visuals
        this.waveMaterial.uniforms.uTime.value = currentVisualTime;
        // Note: Individual uniforms are updated in _updateRecoveringZones
    }
    
    _detectRuptureEvents(currentVisualTime) {
        if (!this.ruptureSystem || !this.ruptureSystem.ruptures) return;
        
        const currentRuptures = this.ruptureSystem.ruptures;
        const currentIds = new Set(currentRuptures.map(r => r.linkId)); // linkId is unique per active rupture usually
        
        // Check for ruptures that were active but are now gone
        for (const id of this.activeRuptureIds) {
            if (!currentIds.has(id)) {
                // Rupture finished!
                this._triggerRecovery(id, currentVisualTime);
            }
        }
        
        // Update tracking set
        this.activeRuptureIds = currentIds;
    }
    
    _triggerRecovery(linkId, currentVisualTime) {
        // Find convergence point or link center
        // Since rupture is gone from array, we can't get its position directly easily
        // But we can look up the link
        const link = this._getLinkById(linkId);
        if (!link) return;
        
        const start = link.sourceNode?.position || link.from?.position;
        const end = link.targetNode?.position || link.to?.position;
        if (!start || !end) return;
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        
        // Spawn Recovering Zone
        const now = currentVisualTime ?? (VisualTime.now - this._timeOrigin);
        if (this.recoveringZones.length < this.config.maxActiveZones) {
            this.recoveringZones.push({
                active: true,
                pos: center,
                linkId: linkId,
                startNode: link.sourceNode || link.from,
                endNode: link.targetNode || link.to,
                life: 0,
                startTime: now,
                maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                waveMeshIdx: -1, // Assigned later
                lastStitchTime: now
            });
           
            // Trigger Node Halos immediately
            this._spawnHalo(link.sourceNode || link.from, now);
            this._spawnHalo(link.targetNode || link.to, now);
        }
    }
    
    _updateRecoveringZones(state, currentVisualTime) {
        const harmony = state.harmony || 0.5;
        const synergy = state.synergy || 0;
        
        // Filter and update
        this.recoveringZones = this.recoveringZones.filter(zone => {
            zone.life = currentVisualTime - zone.startTime;
            
            // 1. Coherence Wave Visual
            if (zone.waveMeshIdx === -1) {
                // Try to acquire mesh
                const slot = this.waveMeshPool.findIndex(item => !item.active);
                if (slot !== -1) {
                    this.waveMeshPool[slot].active = true;
                    this.waveMeshPool[slot].mesh.visible = true;
                    this.waveMeshPool[slot].mesh.position.copy(zone.pos);
                    zone.waveMeshIdx = slot;
                }
            }
            
            if (zone.waveMeshIdx !== -1) {
                const item = this.waveMeshPool[zone.waveMeshIdx];
                const mesh = item.mesh;
                const progress = zone.life / zone.maxLife;
                
                // Expand
                const scale = 1.0 + zone.life * this.config.waveExpansionSpeed * (1.0 + synergy);
                mesh.scale.set(scale, scale, scale);
                
                // Update shader uniforms
                mesh.material.uniforms.uLife.value = progress;
                mesh.material.uniforms.uHarmony.value = harmony;
                
                // Orientation (billboard-ish or flat?)
                // Flat is better for "ground" ripples, but this is 3D space.
                // Let's face camera? Or align with link?
                // Aligning with link cross-section might be cool but complex.
                // Let's stick to flat XZ plane for "ground ripple" feel, 
                // or maybe billboarding would be better for visibility.
                // Re-Stitching is the main 3D element.
                mesh.lookAt(this.scene.position); // Look at center? No.
                // For now, simple billboard behavior
                mesh.lookAt(this.scene.children.find(c => c.isCamera)?.position || new THREE.Vector3(0,0,10));
            }
            
            // 2. Link Re-Stitching (Particles)
            const sinceLastStitch = currentVisualTime - (zone.lastStitchTime ?? zone.startTime);
            if (sinceLastStitch >= this.config.stitchingInterval) {
                zone.lastStitchTime = currentVisualTime;
                
                if (this.healingParticles) {
                    // "Tightening" Visual: Dual inward scan (from both ends towards center)
                    // Creates a "zipping" or "stitching" effect
                    
                    const p1 = zone.startNode.position;
                    const p2 = zone.endNode.position;
                    
                    // 2-second scan loop
                    const scanProgress = (zone.life % 2.0) / 2.0; 
                    
                    // Emit at TWO points moving inwards
                    // t1 goes 0 -> 0.5
                    // t2 goes 1 -> 0.5
                    const t1 = scanProgress * 0.5;
                    const t2 = 1.0 - (scanProgress * 0.5);
                    
                    const pos1 = new THREE.Vector3().lerpVectors(p1, p2, t1);
                    const pos2 = new THREE.Vector3().lerpVectors(p1, p2, t2);
                    
                    // Add subtle spiral offset for "wrapping" look
                    const angle = zone.life * 10.0;
                    const offset = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).multiplyScalar(0.1);
                    // Rotate offset to match link direction roughly (simplified: just add it)
                    
                    pos1.add(offset);
                    pos2.add(offset.clone().negate()); // Opposite side spiral
                    
                    // Emit stationary particles that fade (leaving a trail)
                    const intensity = 0.5 * harmony;
                    
                    this.healingParticles.emitHealingTrail(pos1, new THREE.Vector3(0,0,0), intensity, currentVisualTime);
                    this.healingParticles.emitHealingTrail(pos2, new THREE.Vector3(0,0,0), intensity, currentVisualTime);
                }
            }
            
            // Lifecycle check
            if (zone.life >= zone.maxLife) {
                // Release mesh
                if (zone.waveMeshIdx !== -1) {
                    this.waveMeshPool[zone.waveMeshIdx].active = false;
                    this.waveMeshPool[zone.waveMeshIdx].mesh.visible = false;
                }
                return false;
            }
            return true;
        });
        
        // Update Halos (independent lifecycle managed by pool)
        this.haloMeshPool.forEach(item => {
            if (!item.active) return;
            const elapsed = currentVisualTime - (item.startTime ?? currentVisualTime);
            const progress = elapsed / item.maxLife;
            const mesh = item.mesh;
            
            // Expand slightly
            const scale = 2.0 + Math.sin(progress * Math.PI) * 0.5;
            mesh.scale.set(scale, scale, scale);
            
            // Billboard
            const camera = this.scene.children.find(c => c.isCamera);
            if (camera) mesh.lookAt(camera.position);
            
            mesh.material.uniforms.uLife.value = progress;
            
            if (elapsed >= item.maxLife) {
                item.active = false;
                mesh.visible = false;
            }
        });
    }
    
    _spawnHalo(node, currentVisualTime) {
        if (!node) return;
        
        const slot = this.haloMeshPool.findIndex(item => !item.active);
        if (slot !== -1) {
            const item = this.haloMeshPool[slot];
            item.active = true;
            item.life = 0;
            item.maxLife = 2.0;
            item.startTime = currentVisualTime;
            item.mesh.visible = true;
            item.mesh.position.copy(node.position);
        }
    }
    
    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && l.id === linkId);
    }
    
    dispose() {
        // Clean up meshes
        this.waveMeshPool.forEach(item => {
            this.scene.remove(item.mesh);
            item.mesh.geometry.dispose();
        });
        this.haloMeshPool.forEach(item => {
            this.scene.remove(item.mesh);
            item.mesh.geometry.dispose();
        });
        
        this.waveMaterial.dispose();
        this.haloMaterial.dispose();
    }
}
