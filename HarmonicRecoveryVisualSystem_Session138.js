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

// ATOMA_RECOVERY_v2: Enhanced coherence wave with multi-ring expansion,
// energy shimmer, hot core flash, and color evolution

const COHERENCE_WAVE_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uLife;      // 0.0 to 1.0 (lifecycle)
uniform vec3 uColor;
uniform float uHarmony;

varying vec2 vUv;

void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    // === MULTI-RING EXPANSION (ATOMA_RECOVERY_v2) ===
    // Three rings expanding outward at different speeds
    float ringBase = 0.15 + uLife * 0.7;
    
    // Primary ring — bold, wide
    float rw1 = 0.14 + uHarmony * 0.06;
    float ring1 = smoothstep(ringBase - rw1, ringBase, dist)
                * (1.0 - smoothstep(ringBase, ringBase + rw1, dist));
    
    // Secondary ring — ahead of primary, thinner
    float ring2Center = ringBase + 0.12;
    float rw2 = 0.06;
    float ring2 = smoothstep(ring2Center - rw2, ring2Center, dist)
                * (1.0 - smoothstep(ring2Center, ring2Center + rw2, dist));
    
    // Trailing ring — behind primary, soft
    float ring3Center = max(0.05, ringBase - 0.15);
    float rw3 = 0.08;
    float ring3 = smoothstep(ring3Center - rw3, ring3Center, dist)
                * (1.0 - smoothstep(ring3Center, ring3Center + rw3, dist));

    // === HOT CORE FLASH (early lifecycle) ===
    float coreFlash = (1.0 - smoothstep(0.0, 0.25, dist)) * (1.0 - smoothstep(0.0, 0.15, uLife)) * 0.6;

    // === SOFT INNER GLOW ===
    float innerGlow = (1.0 - smoothstep(0.0, 0.45, dist)) * 0.2;

    // === OUTER FADE ===
    float outerFade = 1.0 - smoothstep(0.7, 1.0, dist);

    // === ENERGY SHIMMER along rings ===
    float angle = atan(p.y, p.x);
    float shimmer = 0.92 + 0.08 * sin(angle * 6.0 + uTime * 4.0 + dist * 12.0);
    
    // === SPARKLE FRINGE at outer edge ===
    float fringeSparkle = pow(max(0.0, 1.0 - abs(dist - ringBase - 0.08) * 8.0), 3.0)
                        * (0.5 + 0.5 * sin(angle * 12.0 + uTime * 8.0));

    // Combine
    float rings = ring1 * 0.75 + ring2 * 0.35 + ring3 * 0.25;
    float alpha = (rings + innerGlow + coreFlash + fringeSparkle * 0.15) * outerFade * shimmer;

    // Harmony warmth
    float harmonyWarm = mix(1.0, 1.35, clamp(uHarmony, 0.0, 1.0));
    alpha *= harmonyWarm;

    // Fade out over lifecycle
    alpha *= (1.0 - uLife * uLife);

    // Subtle pulse
    alpha *= 0.88 + 0.12 * sin(uTime * 3.0 + dist * 8.0);

    // === SACRED_RECOVERY: COLOR EVOLUTION ===
    // Sacred spectral cycling: sacred gold → celestial teal → mystic violet shimmer
    vec3 sacredGold = vec3(1.0, 0.84, 0.0);
    vec3 celestialTeal = vec3(0.25, 0.88, 0.82);
    vec3 mysticViolet = vec3(0.58, 0.35, 0.92);
    float sacredPhase = uHarmony * 0.5 + uLife * 0.4;
    vec3 evolvedColor = mix(sacredGold, celestialTeal, smoothstep(0.0, 0.5, sacredPhase));
    evolvedColor = mix(evolvedColor, mysticViolet, smoothstep(0.6, 1.0, sacredPhase) * 0.35);
    
    // Hot core is white
    vec3 finalColor = mix(evolvedColor, vec3(1.0), coreFlash * 1.5);
    // SACRED_RECOVERY: Sacred spectral sparkle fringe
    vec3 sacredFringe = mix(vec3(1.0, 0.84, 0.4), celestialTeal, sin(uTime * 0.5) * 0.5 + 0.5);
    finalColor += sacredFringe * fringeSparkle * 0.25;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

const RECOVERY_HALO_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

// ATOMA_RECOVERY_v2: Enhanced recovery halo with expanding rings,
// hot center glow, energy shimmer, rotating pattern

const RECOVERY_HALO_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uLife;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p) * 2.0;
    if (dist > 1.0) discard;

    float angle = atan(p.y, p.x);

    // === EXPANDING CONVERGENCE RINGS (ATOMA_RECOVERY_v2) ===
    // Rings expand outward over lifetime instead of fixed positions
    float baseRadius = 0.15 + uLife * 0.55;
    
    // Ring 1: primary convergence ring (widest)
    float rw1 = 0.06 + uLife * 0.02;
    float ring1 = smoothstep(baseRadius - rw1, baseRadius, dist)
                * (1.0 - smoothstep(baseRadius, baseRadius + rw1, dist));
    
    // Ring 2: inner ring (tighter, brighter)
    float innerR = max(0.08, baseRadius - 0.18);
    float rw2 = 0.04;
    float ring2 = smoothstep(innerR - rw2, innerR, dist)
                * (1.0 - smoothstep(innerR, innerR + rw2, dist));
    
    // Ring 3: outer scout ring (faint, ahead)
    float outerR = min(0.95, baseRadius + 0.15);
    float rw3 = 0.03;
    float ring3 = smoothstep(outerR - rw3, outerR, dist)
                * (1.0 - smoothstep(outerR, outerR + rw3, dist));

    // === ROTATING BRIGHTNESS PATTERN ===
    float rotSpeed = uTime * 1.5;
    float rotPattern1 = 0.65 + 0.35 * sin(angle * 3.0 + rotSpeed);
    float rotPattern2 = 0.65 + 0.35 * sin(angle * 5.0 - rotSpeed * 0.7 + 2.094);
    float rotPattern3 = 0.65 + 0.35 * sin(angle * 4.0 + rotSpeed * 1.3 + 4.189);

    float rings = ring1 * rotPattern1 * 0.7 + ring2 * rotPattern2 * 0.5 + ring3 * rotPattern3 * 0.3;

    // === HOT CENTER GLOW ===
    float centerGlow = (1.0 - smoothstep(0.0, 0.30, dist)) * 0.45;
    // White-hot core
    float hotCore = (1.0 - smoothstep(0.0, 0.10, dist)) * 0.3 * (1.0 - uLife);

    // === ENERGY SHIMMER between rings ===
    float shimmer = 0.9 + 0.1 * sin(dist * 25.0 - uTime * 6.0 + angle * 3.0);

    float alpha = (rings + centerGlow + hotCore) * shimmer;

    // Fade out over life
    alpha *= (1.0 - uLife * uLife);
    alpha *= 0.72;

    // === SACRED_RECOVERY: Sacred convergence ring tinting ===
    vec3 sacredRingTint = mix(uColor, vec3(0.25, 0.88, 0.82), ring1 * 0.3);
    vec3 coreColor = mix(vec3(1.0), sacredRingTint, 0.35);
    vec3 finalColor = mix(coreColor, sacredRingTint, smoothstep(0.1, 0.4, dist));

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export class HarmonicRecoveryVisualSystem_Session138 {
    constructor(scene, ruptureSystem, healingParticleSystem, nodeLinkingSystem, semanticBus = null) {
        this.scene = scene;
        this.ruptureSystem = ruptureSystem;
        this.healingParticles = healingParticleSystem;
        this.linkingSystem = nodeLinkingSystem;
        this.semanticBus = semanticBus || globalThis?.semanticBus || null;
        this.enabled = true;
        
        this.config = {
            minRecoveryDuration: 3.0,
            maxRecoveryDuration: 8.0,
            waveExpansionSpeed: 1.65,
            stitchingInterval: 0.09,
            maxActiveZones: 10,
            updateInterval: 1 / 60,
            debugVisualBoost: false,
            renderOrder: VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_RESONANCE),
            debugForceRecoveryPulse: false,
            debugForceRecoveryInterval: 2.0,
            linkCooldown: 4.0,
            enableSacredRecovery: true  // SACRED_RECOVERY: master switch for sacred spectral palette
        };
        
        // ATOMA_RECOVERY_v2: Pre-allocated temp objects (zero per-frame allocation)
        this._tmpColor = new THREE.Color();
        this._tmpVec3A = new THREE.Vector3();
        this._tmpVec3B = new THREE.Vector3();
        this._tmpVelA = new THREE.Vector3();  // dedicated velocity temps (fix: aliasing bug)
        this._tmpVelB = new THREE.Vector3();
        this._tmpColorWhite = new THREE.Color(0xffffff);
        this._tmpColorGold = new THREE.Color(0xffcc00);
        
        this.activeRuptureIds = new Set();
        this.recoveringZones = [];
        
        this.waveMeshPool = [];
        this.haloMeshPool = [];
        
        this._linkCooldowns = new Map();
        this._activeBeams = [];  // FIX: tracked beams for managed cleanup (replaces setTimeout)
        
        this._eventDrivenEnabled = false;
        this._unsubscribeHarmonyHigh = null;
        this._unsubscribeHarmonyMid = null;
        this._unsubscribeLinkStabilityMid = null;
        this._unsubscribeNodeStabilityLow = null;
        
        this._setupEventSubscriptions();
        
        // Materials
        this.waveMaterial = new THREE.ShaderMaterial({
            vertexShader: COHERENCE_WAVE_VERTEX_SHADER,
            fragmentShader: COHERENCE_WAVE_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(0x40E0D0) },  // SACRED_RECOVERY: celestial teal (was 0x00ffff)
                uHarmony: { value: 0.5 }
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            toneMapped: false    // ATOMA_RECOVERY_v2: HDR brightness
        });
        
        this.haloMaterial = new THREE.ShaderMaterial({
            vertexShader: RECOVERY_HALO_VERTEX_SHADER,
            fragmentShader: RECOVERY_HALO_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uLife: { value: 0 },
                uColor: { value: new THREE.Color(0xFFD700) }   // SACRED_RECOVERY: sacred gold (was 0xffff33)
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false    // ATOMA_RECOVERY_v2: HDR brightness
        });
        
        this._initPools();
        
        this._timeOrigin = undefined;
        this._lastUpdateTime = undefined;
        this._fallbackRecoveryTimer = 0;

        // Dramaturgy modulation — driven by EventDramaturgyEngine via main.js
        this._dramaturgyModulation = {
            active: false,
            family: null,
            phase: null,
            intensity: 0,
            ttl: 0
        };
        this._dramaturgyRecoveryTimer = 0;

        console.log('✨ [Session 138] HarmonicRecoveryVisualSystem initialized');
    }

    // ---------------------------------------------------------------------------
    // Dramaturgy Modulation — Recovery Awakening
    // ---------------------------------------------------------------------------

    /**
     * Receive dramaturgy state.
     * During corruption payoff → forces recovery pulses on all links.
     * This creates the "restoration halo" effect after corruption surge.
     */
    setDramaturgyModulation(state) {
        if (!state || !state.dominantFamily) return;
        this._dramaturgyModulation.active = true;
        this._dramaturgyModulation.family = state.dominantFamily;
        this._dramaturgyModulation.phase = state.dominantPhase || 'telegraph';
        this._dramaturgyModulation.intensity = state.dominantIntensity || 0;
        this._dramaturgyModulation.ttl = 3.0;
    }

    _decayDramaturgyModulation(deltaTime) {
        const mod = this._dramaturgyModulation;
        if (!mod.active) return;
        mod.ttl -= deltaTime;
        if (mod.ttl <= 0) {
            mod.active = false;
            mod.family = null;
            mod.phase = null;
            mod.intensity = 0;
            mod.ttl = 0;
        }
    }

    /**
     * Should dramaturgy force recovery pulses?
     * Active during corruption payoff and any family payoff.
     */
    _isDramaturgyRecoveryActive() {
        const mod = this._dramaturgyModulation;
        return mod.active && mod.ttl > 0 && mod.phase === 'payoff';
    }

    /**
     * Force recovery pulses on random links during dramaturgy payoff.
     * Creates the "restoration halo" visual effect.
     */
    _dramaturgyForceRecoveryPulse(currentVisualTime) {
        if (!this.linkingSystem?.links) return;
        const links = this.linkingSystem.links;
        if (links.length === 0) return;

        // Pick a random active link and trigger recovery
        const activeLinks = links.filter(l => l && l.active !== false);
        if (activeLinks.length === 0) return;

        const link = activeLinks[Math.floor(Math.random() * activeLinks.length)];
        const linkId = link.id || link.linkId || link.uuid;
        if (!linkId) return;

        // Check cooldown
        const now = this._getCurrentTime?.() || performance.now() / 1000;
        const lastTime = this._linkCooldowns.get(linkId);
        if (lastTime !== undefined && (now - lastTime) < this.config.linkCooldown * 0.5) return;
        this._linkCooldowns.set(linkId, now);

        this.triggerRecoveryPulse(link, currentVisualTime);
    }

    _getCurrentTime() {
        return (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);
    }

    attachScene(scene) {
        if (!scene || typeof scene.add !== 'function') return false;
        this.scene = scene;

        for (const item of this.waveMeshPool) {
            if (!item?.mesh) continue;
            item.mesh.parent?.remove(item.mesh);
            item.mesh.renderOrder = this.config.renderOrder;
            scene.add(item.mesh);
        }
        for (const item of this.haloMeshPool) {
            if (!item?.mesh) continue;
            item.mesh.parent?.remove(item.mesh);
            item.mesh.renderOrder = this.config.renderOrder;
            scene.add(item.mesh);
        }

        return true;
    }

    rebind({
        scene = this.scene,
        ruptureSystem = this.ruptureSystem,
        healingParticleSystem = this.healingParticles,
        nodeLinkingSystem = this.linkingSystem,
        semanticBus = this.semanticBus,
        frameScheduler = this.frameScheduler
    } = {}) {
        this.frameScheduler = frameScheduler ?? this.frameScheduler ?? null;
        this.ruptureSystem = ruptureSystem ?? this.ruptureSystem ?? null;
        this.healingParticles = healingParticleSystem ?? this.healingParticles ?? null;
        this.linkingSystem = nodeLinkingSystem ?? this.linkingSystem ?? null;

        const nextSemanticBus = semanticBus || this.semanticBus || globalThis?.semanticBus || null;
        if (nextSemanticBus !== this.semanticBus) {
            this._teardownEventSubscriptions();
            this.semanticBus = nextSemanticBus;
            this._setupEventSubscriptions();
        } else {
            this.semanticBus = nextSemanticBus;
        }

        if (scene && scene !== this.scene) {
            this.attachScene(scene);
        } else if (this.scene) {
            for (const item of this.waveMeshPool) {
                if (!item?.mesh) continue;
                item.mesh.renderOrder = this.config.renderOrder;
                if (item.mesh.parent !== this.scene) {
                    item.mesh.parent?.remove(item.mesh);
                    this.scene.add(item.mesh);
                }
            }
            for (const item of this.haloMeshPool) {
                if (!item?.mesh) continue;
                item.mesh.renderOrder = this.config.renderOrder;
                if (item.mesh.parent !== this.scene) {
                    item.mesh.parent?.remove(item.mesh);
                    this.scene.add(item.mesh);
                }
            }
        }

        if (this.healingParticles) {
            this.healingParticles.scene = this.scene;
            if (this.healingParticles.mesh && this.scene) {
                this.healingParticles.mesh.parent?.remove(this.healingParticles.mesh);
                this.scene.add(this.healingParticles.mesh);
                this.healingParticles.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder(VisualHierarchyRegistry.LAYER_LINK_PARTICLES);
            }
            if (this.healingParticles.debugCube && this.scene) {
                this.healingParticles.debugCube.parent?.remove(this.healingParticles.debugCube);
                this.scene.add(this.healingParticles.debugCube);
                this.healingParticles.debugCube.renderOrder = 999;
            }
            if (this.healingParticles.debugProbe && this.scene) {
                this.healingParticles.debugProbe.parent?.remove(this.healingParticles.debugProbe);
                this.scene.add(this.healingParticles.debugProbe);
                this.healingParticles.debugProbe.renderOrder = 999;
            }
        }

        return true;
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

        const unsubHigh = this.semanticBus.subscribe('link.harmony.high', this._onHarmonyHigh);
        const unsubMid = this.semanticBus.subscribe('link.harmony.mid', this._onHarmonyMid);

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

        // Canonical metric tier: stability returning to mid = recovery trigger
        this._onLinkStabilityMid = (payload = {}) => {
            this._handleLinkStabilityMid(payload);
        };
        const unsubLinkStabilityMid = this.semanticBus.subscribe('link.stability.mid', this._onLinkStabilityMid);
        if (typeof unsubLinkStabilityMid === 'function') {
            this._unsubscribeLinkStabilityMid = unsubLinkStabilityMid;
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
            this._unsubscribeLinkStabilityMid = () => {
                this.semanticBus.unsubscribe('link.stability.mid', this._onLinkStabilityMid);
            };
        }

        // Canonical metric tier: node instability = prepare recovery halos
        this._onNodeStabilityLow = (payload = {}) => {
            this._handleNodeStabilityLow(payload);
        };
        const unsubNodeStabilityLow = this.semanticBus.subscribe('node.stability.low', this._onNodeStabilityLow);
        if (typeof unsubNodeStabilityLow === 'function') {
            this._unsubscribeNodeStabilityLow = unsubNodeStabilityLow;
        } else if (typeof this.semanticBus.unsubscribe === 'function') {
            this._unsubscribeNodeStabilityLow = () => {
                this.semanticBus.unsubscribe('node.stability.low', this._onNodeStabilityLow);
            };
        }

        this._eventDrivenEnabled = true;
    }

    _teardownEventSubscriptions() {
        if (typeof this._unsubscribeHarmonyHigh === 'function') {
            this._unsubscribeHarmonyHigh();
        }
        if (typeof this._unsubscribeHarmonyMid === 'function') {
            this._unsubscribeHarmonyMid();
        }
        if (typeof this._unsubscribeLinkStabilityMid === 'function') {
            this._unsubscribeLinkStabilityMid();
        }
        if (typeof this._unsubscribeNodeStabilityLow === 'function') {
            this._unsubscribeNodeStabilityLow();
        }
        this._unsubscribeHarmonyHigh = null;
        this._unsubscribeHarmonyMid = null;
        this._unsubscribeLinkStabilityMid = null;
        this._unsubscribeNodeStabilityLow = null;
        this._eventDrivenEnabled = false;
    }

    _handleHarmonyHigh(payload = {}) {
        const linkId = payload?.linkId;
        const now = Number.isFinite(VisualTime?.now) ? VisualTime.now : performance.now() / 1000;
        
        if (!linkId) return;

        if (this._checkCooldown(linkId, now)) return;

        this._spawnCoherenceWave(linkId, now);

        const link = this._getLinkById(linkId);
        if (link) {
            const endpoints = this._getLinkEndpoints(link);
            if (endpoints.startNode) this._spawnHalo(endpoints.startNode, now);
            if (endpoints.endNode) this._spawnHalo(endpoints.endNode, now);
        }

        this._setCooldown(linkId, now);
    }

    _handleHarmonyMid(payload = {}) {
        const linkId = payload?.linkId;
        const now = Number.isFinite(VisualTime?.now) ? VisualTime.now : performance.now() / 1000;
        
        if (!linkId) return;

        if (this._checkCooldown(linkId, now)) return;

        this._spawnReStitching(linkId, now);
        this._setCooldown(linkId, now);
    }

    /**
     * Handle link.stability.mid — stability returning from low triggers recovery.
     * Uses canonical metric tier: link stability returning to mid = recovery begins.
     */
    _handleLinkStabilityMid(payload = {}) {
        const linkId = payload?.linkId;
        const now = Number.isFinite(VisualTime?.now) ? VisualTime.now : performance.now() / 1000;

        if (!linkId) return;
        if (this._checkCooldown(linkId, now)) return;

        const link = this._getLinkById(linkId);
        if (link) {
            const endpoints = this._getLinkEndpoints(link);
            // Spawn recovery halos at both endpoints
            if (endpoints.startNode) this._spawnHalo(endpoints.startNode, now);
            if (endpoints.endNode) this._spawnHalo(endpoints.endNode, now);

            // Spawn re-stitching wave on the recovering link
            this._spawnReStitching(linkId, now);
        }

        this._setCooldown(linkId, now);
    }

    /**
     * Handle node.stability.low — unstable node triggers recovery preparation.
     * Uses canonical metric tier: node stability dropping = prepare recovery halos.
     */
    _handleNodeStabilityLow(payload = {}) {
        const nodeId = payload?.nodeId;
        const now = Number.isFinite(VisualTime?.now) ? VisualTime.now : performance.now() / 1000;

        if (!nodeId) return;

        // Find the node and spawn a preparatory recovery zone
        if (this.linkingSystem?.nodes) {
            const node = this.linkingSystem.nodes.find(n =>
                n && (n.id === nodeId || n.userData?.nodeId === nodeId)
            );
            if (node?.position && this.recoveringZones.length < this.config.maxActiveZones) {
                this.recoveringZones.push({
                    active: true,
                    pos: node.position.clone(),
                    linkId: `stability_recovery_${nodeId}_${Date.now()}`,
                    startNode: node,
                    endNode: null,
                    life: 0,
                    startTime: now - (this._timeOrigin ?? 0),
                    maxLife: this.config.minRecoveryDuration + Math.random() * 2.0,
                    waveMeshIdx: -1,
                    lastStitchTime: now - (this._timeOrigin ?? 0),
                    waveOnly: true,
                    linkYaw: 0
                });
            }
        }
    }

    _checkCooldown(id, now) {
        const lastTime = this._linkCooldowns.get(id);
        if (lastTime === undefined) return false;
        return (now - lastTime) < this.config.linkCooldown;
    }

    _setCooldown(id, now) {
        this._linkCooldowns.set(id, now);
    }

    _spawnCoherenceWave(linkId, currentVisualTime) {
        const link = this._getLinkById(linkId);
        if (!link) return false;

        const endpoints = this._getLinkEndpoints(link);
        const start = endpoints.startPos;
        const end = endpoints.endPos;
        if (!start || !end) return false;

        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const now = currentVisualTime ?? (VisualTime.now - this._timeOrigin);
        const linkDirection = new THREE.Vector3().subVectors(end, start);
        linkDirection.y = 0;
        const linkYaw = linkDirection.lengthSq() > 1e-6
            ? Math.atan2(linkDirection.z, linkDirection.x)
            : 0;

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
                waveMeshIdx: -1,
                lastStitchTime: now,
                waveOnly: true,
                linkYaw: linkYaw
            });
            return true;
        }
        return false;
    }

    _spawnReStitching(linkId, currentVisualTime) {
        const link = this._getLinkById(linkId);
        if (!link) return false;

        const endpoints = this._getLinkEndpoints(link);
        if (!endpoints.startPos || !endpoints.endPos) return false;

        const now = currentVisualTime ?? (VisualTime.now - this._timeOrigin);

        if (this.healingParticles) {
            const p1 = endpoints.startNode.position;
            const p2 = endpoints.endNode.position;
            
            const scanProgress = (now % 2.0) / 2.0;
            const t1 = scanProgress * 0.5;
            const t2 = 1.0 - (scanProgress * 0.5);
            
            // ATOMA_RECOVERY_v2: Zero-allocation re-stitching spawn
            const pos1 = this._tmpVec3A.lerpVectors(p1, p2, t1);
            const pos2 = this._tmpVec3B.lerpVectors(p1, p2, t2);
            
            const sAngle = now * 10.0;
            const offX = Math.cos(sAngle) * 0.1;
            const offY = Math.sin(sAngle) * 0.1;
            
            pos1.x += offX; pos1.y += offY;
            pos2.x -= offX; pos2.y -= offY;
            
            const intensity = 0.85;
            
            // FIX: Use dedicated velocity temps to avoid aliasing with position temps
            this.healingParticles.emitHealingTrail(pos1, this._tmpVelA.set(0,0,0), intensity, now, this._tmpColorWhite);
            this.healingParticles.emitHealingTrail(pos2, this._tmpVelB.set(0,0,0), intensity, now, this._tmpColorGold);
        }

        // DESIGN: Multi-segment energy thread beam with stitch points
        // Instead of a single line, create a multi-point beam with energy nodes
        const beamPoints = [];
        const stitchCount = 6;
        for (let i = 0; i <= stitchCount; i++) {
            const t = i / stitchCount;
            const point = new THREE.Vector3().lerpVectors(endpoints.startPos, endpoints.endPos, t);
            // Add subtle sine wave displacement for "energy thread" look
            const wave = Math.sin(t * Math.PI * 3 + (currentVisualTime ?? 0) * 8) * 0.04;
            point.y += wave;
            beamPoints.push(point);
        }

        const beamGeometry = new THREE.BufferGeometry().setFromPoints(beamPoints);
        // SACRED_RECOVERY: Sacred gold beam (was 0x88ffdd)
        const beamMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color(0xFFD700),
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const beam = new THREE.Line(beamGeometry, beamMaterial);
        beam.renderOrder = this.config.renderOrder + 2;
        this.scene.add(beam);

        // DESIGN: Emit stitch-point particles along the beam for "thread weaving" effect
        if (this.healingParticles) {
            const stitchColor = this._tmpColor;
            for (let i = 1; i < stitchCount; i++) {
                const t = i / stitchCount;
                const stitchPos = this._tmpVec3A.lerpVectors(endpoints.startPos, endpoints.endPos, t);
                stitchPos.y += Math.sin(t * Math.PI * 3 + (currentVisualTime ?? 0) * 8) * 0.04;

                // Alternate between gold and cyan stitches
                // SACRED_RECOVERY: Sacred gold / celestial teal stitch alternation
                if (i % 2 === 0) {
                    stitchColor.setRGB(1.0, 0.84, 0.0);   // Sacred gold
                } else {
                    stitchColor.setRGB(0.25, 0.88, 0.82);  // Celestial teal
                }

                this.healingParticles.emitHealingTrail(
                    stitchPos,
                    this._tmpVelA.set(0, 0.05, 0),
                    0.5,
                    now,
                    stitchColor
                );
            }
        }

        // FIX: Track beam for managed cleanup instead of fragile setTimeout
        this._activeBeams.push({ mesh: beam, disposeAt: (currentVisualTime ?? 0) + 0.18 });

        return true;
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
        if (mode !== 'all' && mode !== 'recovery') return; // Ensure we are in the correct debug mode
        if (!this.enabled) return;

        this._decayDramaturgyModulation(deltaTime);

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

        // 1b. Dramaturgy recovery override — force recovery pulses during payoff
        if (this._isDramaturgyRecoveryActive()) {
            this._dramaturgyRecoveryTimer += sinceLast;
            if (this._dramaturgyRecoveryTimer >= 0.8) {
                this._dramaturgyRecoveryTimer = 0;
                this._dramaturgyForceRecoveryPulse(currentVisualTime);
            }
        }

        // Fallback: if no ruptures found and debug mode, force recovery pulses from links
        if (this.config.debugForceRecoveryPulse) {
            this._fallbackRecoveryTimer += sinceLast;
            if (this._fallbackRecoveryTimer >= this.config.debugForceRecoveryInterval) {
                this._fallbackRecoveryTimer = 0;
                this._debugForceAllLinksRecovery(currentVisualTime);
            }
        }
        
        // 2. Update Recovering Zones
        const cameraPosition = this._resolveCameraPosition();
        this._updateRecoveringZones(networkState || {}, currentVisualTime, cameraPosition);
        
        // 3. Update Visuals
        this.waveMaterial.uniforms.uTime.value = currentVisualTime;
        // Note: Individual uniforms are updated in _updateRecoveringZones

        // 4. FIX: Prune expired beams (managed cleanup replacing setTimeout)
        this._activeBeams = this._activeBeams.filter(b => {
            if (currentVisualTime >= b.disposeAt) {
                if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
                b.mesh.geometry.dispose();
                b.mesh.material.dispose();
                return false;
            }
            return true;
        });
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
            
            // Emit topology healing event for HarmonicTopologyLearningSystem
            if (this.semanticBus) {
                // Calculate harmony restored from endpoints
                const readMetric = (node, key) => {
                    if (!node) return 0;
                    const metrics = node.userData?.metrics;
                    const metricValue = metrics && typeof metrics[key] === 'number' ? metrics[key] : undefined;
                    if (typeof metricValue === 'number' && Number.isFinite(metricValue)) return metricValue;
                    const directValue = node.userData?.[key];
                    if (typeof directValue === 'number' && Number.isFinite(directValue)) return directValue;
                    return 0;
                };
                
                const startHarmony = readMetric(endpoints.startNode, 'harmony');
                const endHarmony = readMetric(endpoints.endNode, 'harmony');
                const avgHarmony = (startHarmony + endHarmony) * 0.5;
                
                // Harmony restored is how much harmony the recovery represents
                const harmonyRestored = Math.max(0.1, Math.min(1.0, avgHarmony));
                
                this.semanticBus.emit('topology.healing', {
                    position: center,
                    harmonyRestored: harmonyRestored
                });
            }
        }

        return true;
    }
    
    _updateRecoveringZones(state, currentVisualTime, cameraPosition = null) {
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
                
                const scale = (1.02 + zone.life * this.config.waveExpansionSpeed * (1.0 + synergy)) * (this.config.debugVisualBoost ? 1.02 : 1.0);
                mesh.scale.set(scale, scale, scale);

                // ATOMA_RECOVERY_v2: Zero-allocation color update
                // SACRED_RECOVERY: Sacred spectrum range (was 0.08 + harmony * 0.42)
                this._tmpColor.setHSL(0.12 + harmony * 0.38, 0.88, 0.58);
                mesh.material.uniforms.uColor.value.copy(this._tmpColor);
                mesh.material.uniforms.uLife.value = progress;
                mesh.material.uniforms.uHarmony.value = harmony;

                mesh.rotation.set(-Math.PI / 2, zone.linkYaw ?? 0, 0);
            }
            // 2. Link Re-Stitching (Particles) - only if not waveOnly
            if (!zone.waveOnly) {
                const sinceLastStitch = currentVisualTime - (zone.lastStitchTime ?? zone.startTime);
                if (sinceLastStitch >= this.config.stitchingInterval && this.healingParticles) {
                    zone.lastStitchTime = currentVisualTime;
                    
                    const p1 = zone.startNode?.position;
                    const p2 = zone.endNode?.position;
                    if (p1 && p2) {
                        const scanProgress = (zone.life % 2.0) / 2.0;
                        const t1 = scanProgress * 0.5;
                        const t2 = 1.0 - (scanProgress * 0.5);
                        
                        // ATOMA_RECOVERY_v2: Zero-allocation re-stitching
                        const pos1 = this._tmpVec3A.lerpVectors(p1, p2, t1);
                        const pos2 = this._tmpVec3B.lerpVectors(p1, p2, t2);
                        
                        const stitchAngle = zone.life * 10.0;
                        const offX = Math.cos(stitchAngle) * 0.1;
                        const offY = Math.sin(stitchAngle) * 0.1;
                        
                        pos1.x += offX; pos1.y += offY;
                        pos2.x -= offX; pos2.y -= offY;
                        
                        const intensity = Math.min(1, 0.85 * harmony + 0.35);
                        
                        // FIX: Use dedicated velocity temps to avoid aliasing with position temps
                        this.healingParticles.emitHealingTrail(pos1, this._tmpVelA.set(0,0,0), intensity, currentVisualTime, this._tmpColorWhite);
                        this.healingParticles.emitHealingTrail(pos2, this._tmpVelB.set(0,0,0), intensity, currentVisualTime, this._tmpColorGold);
                    }
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
            
            // ATOMA_RECOVERY_v2: Larger halo with more dramatic expansion
            const scale = 2.5 + Math.sin(progress * Math.PI) * 0.8;
            mesh.scale.set(scale, scale, scale);
            
            // Billboard
            if (cameraPosition) mesh.lookAt(cameraPosition);
            
            mesh.material.uniforms.uLife.value = progress;
            mesh.material.uniforms.uTime.value = currentVisualTime;
            
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
            item.maxLife = 2.5;  // ATOMA_RECOVERY_v2: longer halo duration
            item.startTime = currentVisualTime;
            item.mesh.visible = true;
            item.mesh.position.copy(node.position);

            const metricsHarmony = node?.userData?.metrics?.harmony;
            const rawHarmony = typeof metricsHarmony === 'number'
                ? metricsHarmony
                : typeof node?.userData?.harmony === 'number'
                    ? node.userData.harmony
                    : 0.5;
            const nodeHarmony = Math.max(0, Math.min(1, rawHarmony));
            // ATOMA_RECOVERY_v2: Zero-allocation halo color
            // SACRED_RECOVERY: Sacred spectrum range for halo (was 0.08 + nodeHarmony * 0.42)
            this._tmpColor.setHSL(0.12 + nodeHarmony * 0.38, 0.88, 0.55);
            item.mesh.material.uniforms.uColor.value.copy(this._tmpColor);
            item.mesh.material.uniforms.uLife.value = 0;
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
        return this.linkingSystem.links.find(l => l && (l.id === linkId || l.linkId === linkId || l.uuid === linkId));
    }

    _debugForceAllLinksRecovery(currentVisualTime) {
        if (!this.linkingSystem || !Array.isArray(this.linkingSystem.links)) return;

        for (const link of this.linkingSystem.links) {
            const endpoints = this._getLinkEndpoints(link);
            if (!link || !endpoints.startNode || !endpoints.endNode) continue;
            const linkId = link.id ?? link.linkId ?? null;
            if (!linkId) continue;

            this.triggerRecoveryPulse(linkId, currentVisualTime);
        }

        console.warn('[HarmonicRecovery] debugForceAllLinksRecovery triggered', this.linkingSystem.links.length, 'links');
    }

    getStats() {
        const waveActive = this.waveMeshPool.filter(item => item.active).length;
        const haloActive = this.haloMeshPool.filter(item => item.active).length;

        return {
            enabled: this.enabled,
            eventDrivenEnabled: this._eventDrivenEnabled,
            activeRuptures: this.activeRuptureIds.size,
            recoveringZones: this.recoveringZones.length,
            wavePoolActive: waveActive,
            haloPoolActive: haloActive,
            hasHealingParticles: !!this.healingParticles,
            cooldowns: {
                link: this._linkCooldowns.size
            },
            config: {
                minRecoveryDuration: this.config.minRecoveryDuration,
                maxRecoveryDuration: this.config.maxRecoveryDuration,
                waveExpansionSpeed: this.config.waveExpansionSpeed,
                stitchingInterval: this.config.stitchingInterval,
                maxActiveZones: this.config.maxActiveZones,
                linkCooldown: this.config.linkCooldown
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
         
         // FIX: Clean up tracked beams
         this._activeBeams.forEach(b => {
             if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
             b.mesh.geometry.dispose();
             b.mesh.material.dispose();
         });
         this._activeBeams = [];
         
         this._teardownEventSubscriptions();
         this._linkCooldowns.clear();
     }
 }
