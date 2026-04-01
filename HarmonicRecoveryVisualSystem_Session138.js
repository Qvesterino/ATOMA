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
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

function getAtomaVisualDebugMode() {
    const mode = (typeof window !== 'undefined' && window.__ATOMA_VISUAL_DEBUG_MODE__)
        || globalThis.__ATOMA_VISUAL_DEBUG_MODE__
        || 'all';
    return `${mode}`.toLowerCase();
}

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
    // Square debug-friendly recovery wave with readable border.
    vec2 p = abs(vUv - vec2(0.5));
    float dist = max(p.x, p.y);
    if (dist > 0.5) discard;

    float boxFill = 1.0 - smoothstep(0.42, 0.16, dist);
    float boxEdge = smoothstep(0.50, 0.36, dist);
    float alpha = max(boxFill * 0.7, boxEdge);
    
    // Soft noise/distortion based on harmony (more harmony = smoother)
    // We simulate "spatial distortion" by varying alpha slightly
    
    // Fade over life
    alpha *= (1.0 - uLife); // Fade out as it ages
    alpha *= 0.9; // Debug boost: punch through the scene
    
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
    vec2 p = abs(vUv - vec2(0.5));
    float dist = max(p.x, p.y);
    if (dist > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.06, 0.5, dist);
    
    // Fade out over life
    alpha *= (1.0 - uLife);
    alpha *= 0.95; // Debug boost: halos should read at a glance
    
    gl_FragColor = vec4(uColor, alpha);
}
`;

export class HarmonicRecoveryVisualSystem_Session138 {
    constructor(scene, ruptureSystem, healingParticleSystem, nodeLinkingSystem) {
        this.scene = scene;
        this.ruptureSystem = ruptureSystem;
        this.healingParticles = healingParticleSystem;
        this.linkingSystem = nodeLinkingSystem;
        this.enabled = true;
        
        this.config = {
            minRecoveryDuration: 3.0,
            maxRecoveryDuration: 8.0,
            waveExpansionSpeed: 2.35,
            stitchingInterval: 0.06, // Debug: more readable tightening path
            maxActiveZones: 10,
            updateInterval: 1 / 60,
            debugVisualBoost: true,
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE)
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
                uColor: { value: new THREE.Color(0x00ffff) }, // Neon cyan
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
                uColor: { value: new THREE.Color(0xffff33) } // Neon yellow
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

    rebindHealingParticleSystem(healingParticleSystem) {
        this.healingParticles = healingParticleSystem;
    }

    triggerRecoveryPulse(linkOrId, currentVisualTime = null) {
        const visualNow = Number.isFinite(currentVisualTime)
            ? currentVisualTime
            : (Number.isFinite(VisualTime?.now) && this._timeOrigin !== undefined
                ? VisualTime.now - this._timeOrigin
                : 0);
        if (typeof linkOrId === 'object' && linkOrId) {
            return this._triggerRecoveryFromLink(linkOrId, visualNow);
        }

        const linkId = typeof linkOrId === 'string'
            ? linkOrId
            : linkOrId?.id ?? linkOrId?.linkId ?? null;
        if (!linkId) return false;

        return this._triggerRecovery(linkId, visualNow);
    }

    _initPools() {
        // Coherence Waves (Planes)
        const waveGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 10; i++) {
            const mesh = new THREE.Mesh(waveGeo, this.waveMaterial.clone());
            mesh.visible = false;
            mesh.rotation.x = -Math.PI / 2; // Flat on ground-ish
            mesh.renderOrder = this.config.renderOrder;
            this.scene.add(mesh);
            this.waveMeshPool.push({ mesh, active: false });
        }
        
        // Node Halos (Billboards)
        const haloGeo = new THREE.PlaneGeometry(1, 1);
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(haloGeo, this.haloMaterial.clone());
            mesh.visible = false;
            mesh.renderOrder = this.config.renderOrder;
            this.scene.add(mesh);
            this.haloMeshPool.push({ mesh, active: false });
        }
    }
    
    update(deltaTime, time, networkState) {
        const mode = getAtomaVisualDebugMode();
        if (mode !== 'all' && mode !== 'recovery') return;
        if (!this.enabled) return;

        const visualNow = Number.isFinite(VisualTime?.now)
            ? VisualTime.now
            : (Number.isFinite(time) ? time : 0);

        if (this._timeOrigin === undefined) {
            this._timeOrigin = visualNow;
        }
        const currentVisualTime = visualNow - this._timeOrigin; // Phase 2A: canonical VisualTime source (behavior-preserving)

        if (this._lastUpdateTime === undefined) {
            this._lastUpdateTime = currentVisualTime;
        }

        const sinceLast = currentVisualTime - this._lastUpdateTime;
        if (sinceLast < this.config.updateInterval) return;
        this._lastUpdateTime = currentVisualTime;

        // 1. Detect Rupture Completions
        this._detectRuptureEvents(currentVisualTime);
        
        // 2. Update Recovering Zones
        this._updateRecoveringZones(networkState || {}, currentVisualTime);
        
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
        const link = this._getLinkById(linkId);
        if (!link) return;

        return this._triggerRecoveryFromLink(link, currentVisualTime);
    }

    _triggerRecoveryFromLink(link, currentVisualTime) {
        if (!link) return false;
        const linkId = link?.id ?? link?.linkId ?? null;
        
        const endpoints = this._getLinkEndpoints(link);
        const start = endpoints.startPos;
        const end = endpoints.endPos;
        if (!start || !end) return false;
        
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        
        // Spawn Recovering Zone
        const now = currentVisualTime ?? (VisualTime.now - this._timeOrigin);
        if (this.recoveringZones.length < this.config.maxActiveZones) {
            this.recoveringZones.push({
                active: true,
                pos: center,
                linkId: linkId,
                startNode: endpoints.startNode,
                endNode: endpoints.endNode,
                life: 0,
                startTime: now,
                maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                waveMeshIdx: -1, // Assigned later
                lastStitchTime: now
            });
           
            // Trigger Node Halos immediately
            this._spawnHalo(endpoints.startNode, now);
            this._spawnHalo(endpoints.endNode, now);
        }

        return true;
    }
    
    _updateRecoveringZones(state, currentVisualTime) {
        const clamp01 = (value) => {
            const numeric = Number(value);
            if (!Number.isFinite(numeric)) return 0;
            return Math.max(0, Math.min(1, numeric));
        };
        const harmony = clamp01(state?.harmony ?? 0.5);
        const synergy = clamp01(state?.synergy ?? 0);
        
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
                const scale = (1.25 + zone.life * this.config.waveExpansionSpeed * (1.0 + synergy)) * (this.config.debugVisualBoost ? 1.15 : 1.0);
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
                const cameraPosition = this._resolveCameraPosition();
                if (cameraPosition) {
                    mesh.lookAt(cameraPosition);
                }
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
                    const intensity = Math.min(1, 0.85 * harmony + 0.35);
                    
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
            const cameraPosition = this._resolveCameraPosition();
            if (cameraPosition) mesh.lookAt(cameraPosition);
            
            mesh.material.uniforms.uLife.value = progress;
            
            if (elapsed >= item.maxLife) {
                item.active = false;
                mesh.visible = false;
            }
        });
    }
    
    _spawnHalo(node, currentVisualTime) {
        if (!node?.position) return;
        
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

    _getLinkEndpoints(link) {
        const startNode = link?.sourceNode || link?.source || link?.from || link?.nodeA || null;
        const endNode = link?.targetNode || link?.target || link?.to || link?.nodeB || null;

        return {
            startNode,
            endNode,
            startPos: startNode?.position || null,
            endPos: endNode?.position || null
        };
    }

    _resolveCameraPosition() {
        const sceneCamera = this.scene?.getObjectByName?.('camera')?.position;
        if (sceneCamera) return sceneCamera;

        if (typeof window !== 'undefined' && window.__ATOMA_CAMERA__?.position) {
            return window.__ATOMA_CAMERA__.position;
        }

        if (globalThis.__ATOMA_CAMERA__?.position) {
            return globalThis.__ATOMA_CAMERA__.position;
        }

        return null;
    }
    
    _getLinkById(linkId) {
        if (!this.linkingSystem || !this.linkingSystem.links) return null;
        return this.linkingSystem.links.find(l => l && l.id === linkId);
    }

    getStats() {
        const waveActive = this.waveMeshPool.filter(item => item.active).length;
        const haloActive = this.haloMeshPool.filter(item => item.active).length;

        return {
            enabled: this.enabled,
            activeRuptures: this.activeRuptureIds.size,
            recoveringZones: this.recoveringZones.length,
            wavePoolActive: waveActive,
            haloPoolActive: haloActive,
            hasHealingParticles: !!this.healingParticles,
            config: {
                minRecoveryDuration: this.config.minRecoveryDuration,
                maxRecoveryDuration: this.config.maxRecoveryDuration,
                waveExpansionSpeed: this.config.waveExpansionSpeed,
                stitchingInterval: this.config.stitchingInterval,
                maxActiveZones: this.config.maxActiveZones
            }
        };
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
