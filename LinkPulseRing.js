import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Shared geometry to minimize allocations
// Radius 1.0, Tube 0.08 (8% thickness)
// RadialSegments 6 (Low poly), TubularSegments 24 (Smooth enough ring)
const SHARED_RING_GEOMETRY = new THREE.TorusGeometry(1.0, 0.16, 6, 24);
const SHARED_RING_SEGMENT_GEOMETRY = new THREE.TorusGeometry(1.0, 0.30, 8, 32, Math.PI * 0.5 * 0.85);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const bindPulseRingProgramCacheKey = (material, scope = 'LINK_PULSE_RING') => {
    if (!material || material.userData?.__pulseRingProgramCacheKeyBound) return;
    if (!material.userData) material.userData = {};
    const cacheSignature = [
        scope,
        material.type || 'ShaderMaterial',
        material.transparent === true ? 'transparent' : 'opaque',
        material.depthWrite === true ? 'depth-write' : 'no-depth-write',
        material.depthTest === true ? 'depth-test' : 'no-depth-test',
        material.side ?? 'default',
        material.blending ?? 'normal'
    ].join('|');
    material.customProgramCacheKey = () => cacheSignature;
    material.userData.__pulseRingProgramCacheKeyBound = true;
};

/**
 * LinkPulseRing - ARCHITEKTÚRA V3 + FRESNEL SHADER
 * ============================================================================
 * A purely visual effect: A segmented glowing ring that travels along link curve.
 *
 * LAYER 1: SEGMENTED RING (Mechanical split with gyroscope spin)
 * LAYER 2: EPIC GLOW (Fresnel ShaderMaterial with energy feel)
 * LAYER 3: RIBBON (Turbulence overlay)
 * LAYER 4: ARC DISCHARGE (Electric sparks on pulse peaks)
 *
 * Trail rings removed 2026-04-22 (insignificant visual, high CPU cost).
 */
export class LinkPulseRing {
    constructor(scene, options = {}) {
        this.scene = scene;
        this._attachRoot = scene || null;
        const deferTrails = options?.deferTrails === true;
        const enableAura = options?.enableAura === true;
        
        // === SEGMENTED RING CONSTANTS ===
        const TORUS_RADIUS = 1.0;
        const TORUS_TUBE = 0.30;
        
        // === FRESNEL SHADER MATERIAL ===
        // NIE MeshBasicMaterial, ALE ShaderMaterial s vlastným shaderom
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            
            uniforms: {
                uColor: { value: new THREE.Color(0xffffff) },
                uOpacity: { value: 0.5 },
                uFresnelPower: { value: 2.2 },        // Polish: wider glow spread (was 2.5)
                uFresnelIntensity: { value: 3.0 }     // Polish: sharper, more dramatic rim (was 2.4)
            },
            
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPos.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPos;
                }
            `,
            
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uFresnelPower;
                uniform float uFresnelIntensity;
                
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    float ndotv = max(dot(normalize(vNormal), viewDir), 0.0);
                    float fresnel = pow(1.0 - ndotv, uFresnelPower);
                    fresnel = clamp(fresnel, 0.0, 1.0);
                    fresnel *= uFresnelIntensity;
                    
                    vec3 base = uColor * 0.22;  // Polish: brighter inner energy (was 0.15)
                    vec3 finalColor = base + uColor * fresnel;
                    
                    gl_FragColor = vec4(finalColor, uOpacity * fresnel);
                }
            `
        });
        bindPulseRingProgramCacheKey(this.material, 'ATOMA_LINK_PULSE_CORE_v1');

        // === SEGMENTED RING INITIALIZATION ===
        this.segments = [];
        this.segmentDirections = [];
        this.segmentGroup = new THREE.Group();
        const SEGMENTS = 4;
        const SEGMENT_ANGLE = Math.PI / 2;

        // Shared material for all segments (reduces GPU state changes)
        const sharedSegmentMaterial = this.material;

        for (let i = 0; i < SEGMENTS; i++) {
            // Reuse one geometry for all segments; orientation is handled by the mesh.
            const seg = new THREE.Mesh(SHARED_RING_SEGMENT_GEOMETRY, sharedSegmentMaterial);
            seg.rotation.z = i * SEGMENT_ANGLE;
            seg.frustumCulled = false;
            seg.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 1;

            this.segmentGroup.add(seg);
            this.segments.push(seg);
            this.segmentDirections.push(new THREE.Vector3(
                Math.cos(i * SEGMENT_ANGLE),
                Math.sin(i * SEGMENT_ANGLE),
                0
            ));
        }

        // Main ring container (holds segmentGroup)
        this.mesh = new THREE.Group();
        this.mesh.add(this.segmentGroup);
        this.mesh.frustumCulled = false;
        const ud = (this.mesh && typeof this.mesh.userData === 'object' && this.mesh.userData) ? this.mesh.userData : (() => { try { Object.defineProperty(this.mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.mesh.userData || {}; })();
        Object.assign(ud, { isPulseRing: true });
        this.mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 1;
        this.root = this.mesh;

        // Outer additive aura
        this.auraMaterial = null;
        this.auraMesh = null;
        if (enableAura) {
            this.auraMaterial = this.material.clone();
            this.auraMaterial.depthWrite = false;
            this.auraMaterial.depthTest = true;
            this.auraMaterial.transparent = true;
            this.auraMaterial.blending = THREE.AdditiveBlending;
            bindPulseRingProgramCacheKey(this.auraMaterial, 'ATOMA_LINK_PULSE_AURA_v1');
            const aura = new THREE.Mesh(SHARED_RING_GEOMETRY, this.auraMaterial);
            aura.frustumCulled = false;
            aura.renderOrder = this.mesh.renderOrder;
            const auraUd = (aura && typeof aura.userData === 'object' && aura.userData) ? aura.userData : (() => { try { Object.defineProperty(aura, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return aura.userData || {}; })();
            Object.assign(auraUd, { isPulseRingAura: true });
            this.auraMesh = aura;
        }

        // === LAYER 1: SPIN (Internal rotation) ===
        this.spin = 0;
        
        // === SEGMENTED RING STATE ===
        this.lastPulse = 0; // For snap detection
        this.arcSystem = null; // Arc discharge system reference
        
        // Ribbon turbulence layer
        this.ribbonMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uColor: { value: new THREE.Color(0xffffff) },
                uOpacity: { value: 0.25 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uTime;
                varying vec2 vUv;

                void main() {
                    // Soft ribbon mask (fade on edges)
                    float maskV = smoothstep(0.05, 0.25, vUv.y) * smoothstep(0.95, 0.75, vUv.y);
                    float maskU = smoothstep(0.02, 0.15, vUv.x) * smoothstep(0.98, 0.85, vUv.x);
                    float mask = maskU * maskV;

                    // Simplified turbulence: 2 sin() instead of 3
                    float p = uTime * 15.0;
                    float t1 = sin(vUv.x * 42.0 + p);
                    float t2 = sin(vUv.x * 68.0 + vUv.y * 7.0 + p * 1.5 + 1.0);
                    float turb = (t1 + t2) * 0.5;

                    // Shimmer modulation
                    float shimmer = 0.6 + 0.4 * abs(turb);
                    float alpha = uOpacity * mask * shimmer;
                    if (alpha < 0.01) discard;

                    gl_FragColor = vec4(uColor, alpha);
                }
            `
        });
        bindPulseRingProgramCacheKey(this.ribbonMaterial, 'ATOMA_LINK_PULSE_RIBBON_v1');

        this.ribbonMesh = new THREE.Mesh(SHARED_RING_GEOMETRY, this.ribbonMaterial);
        this.ribbonMesh.frustumCulled = false;
        const ribbonOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 0.5;
        this.ribbonMesh.renderOrder = ribbonOrder;
        this.ribbonMesh.scale.set(0.9, 0.9, 0.9);
        this.mesh.add(this.ribbonMesh);
        
        // State
        this.progress = Math.random(); // Random start pos
        this.active = true;
        
        // === HUE DRIFT: Jemná živá farba ===
        this._tempColor = new THREE.Color(); // Pomocná farba pre HSL operácie
        this.currentTangent = new THREE.Vector3(0, 0, 1);
        this.currentSplitGap = 0;
        this.currentPulsePhase = 0;
        this.currentSpinAngle = 0;
        this._worldDirection = new THREE.Vector3();
        this._ringAxis = new THREE.Vector3(0, 0, 1);
        this._hsl = { h: 0, s: 0, l: 0 };
        this._time = Math.random() * 10.0;
        this._pulseCycle = Math.random();
        this._pulseFrequency = 1.15;
        this._pulseOpenRatio = 0.38;
        this._pulseHoldRatio = 0.08;
        this._pulseCloseRatio = 0.22;
        this._pulseAmplitude = 0.8;
        this._arcTriggeredThisPulse = false;
        this._arcTriggeredOnClose = false;
        
        // Polish: re-enabled aura layer for outer glow halo (was disabled for debug isolation)
        if (this.auraMesh) this.mesh.add(this.auraMesh);

        this.ensureAttached(this._attachRoot);
    }

    /**
     * Get main mesh to add to link group
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Set arc discharge system reference
     * @param {LinkRingArcDischarges} arcSystem - The arc discharge system
     */
    setArcSystem(arcSystem) {
        this.arcSystem = arcSystem;
    }

    ensureAttached(attachRoot = this._attachRoot) {
        if (!attachRoot || !this.mesh) return this.mesh;
        this._attachRoot = attachRoot;
        if (this.mesh.parent !== attachRoot) {
            attachRoot.add(this.mesh);
        }
        return this.mesh;
    }

    rebind({ scene = this.scene, worldRoot = null } = {}) {
        if (scene) {
            this.scene = scene;
        }
        const nextRoot = worldRoot || scene || this._attachRoot;
        if (nextRoot) {
            this.ensureAttached(nextRoot);
        }
        return this;
    }

    /**
     * Update ring position and appearance (ARCHITEKTÚRA V3 + FRESNEL SHADER)
     * @param {THREE.Curve} curve - The link's path
     * @param {number} synergy - Synergy score (0-1)
     * @param {number} traffic - Traffic load (0-1)
     * @param {number} dt - Delta time
     * @param {THREE.Color} baseColor - Current link color
     * @param {THREE.Color} targetColor - Target node color
     */
    update(curve, synergy, traffic, dt, sourceColor, targetColor) {
        if (!curve || !this.active) {
            this.mesh.visible = false;
            if (this.auraMesh) this.auraMesh.visible = false;
            return;
        }
        this.mesh.visible = true;
        if (this.auraMesh) this.auraMesh.visible = true;  // Polish: re-enabled aura (was false)
        this._time += dt;

        // === 1. Motion Logic ===
        // Speed scales with traffic and synergy (slower, more visible)
        // Baseline: 0.3, Max: ~1.0
        const speed = (0.3 + (traffic * 0.4) + (synergy * 0.2)) * 0.5;
        this.progress += speed * dt;
        
        // === 4. LAYER 4: SIGNATURE IMPACT (Scale spike on reset) ===
        if (this.progress >= 1.0) {
            this.progress = 0.0; // Loop
            // Verification mode: no impact reset scale spike
            // this.mesh.scale.multiplyScalar(1.3);
        }
        
        // === 2. Position & Orientation ===
        // Get position on curve
        // Clamp to 0-0.999 to avoid tangent issues at very end
        const t = Math.min(0.999, Math.max(0.001, this.progress));
        
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        this.mesh.position.copy(point);
        this.currentTangent.copy(tangent).normalize();
        this.mesh.quaternion.setFromUnitVectors(
            Z_AXIS,
            this.currentTangent
        );
        
        // === 3. Visual Scaling & Oscillation (EPIC GLOW LAYER) ===
        // Base size scales with synergy (enhanced visibility)
        const baseScale = 0.12 + (synergy * 0.08);
        
        // Apply epic glow scale
        this.mesh.scale.set(baseScale * 1.1, baseScale, baseScale * 1.1);
        
        // === FADE IN/OUT LOGIKA ===
        let alpha = 1.0;
        const fadeZone = 0.15; // 15% of length
        
        if (this.progress < fadeZone) {
            alpha = this.progress / fadeZone;
        } else if (this.progress > (1.0 - fadeZone)) {
            alpha = (1.0 - this.progress) / fadeZone;
        }
        
        // === OPACITY ===
        const maxOpacity = 0.4 + (synergy * 0.4);
        const finalOpacity = alpha * maxOpacity;

        // === 5. Shader Uniform Updates (FRESNEL) ===
        // === HUE DRIFT: Jemná živá farba ===
        // Základná farba (source → target blend)
        this._tempColor.copy(sourceColor).lerp(targetColor, this.progress);
        
        // Prechod do HSL
        const hsl = this._hsl;
        this._tempColor.getHSL(hsl);
        
        // Drift rýchlosť podľa synergy
        const driftSpeed = 0.2 + synergy * 0.8;
        
        // Polish: re-enabled subtle hue drift for living color (was disabled for debug)
        const hueDrift = Math.sin(this._time * driftSpeed) * 0.012;
        hsl.h += hueDrift;
        
        // Wrap hue (0-1)
        if (hsl.h > 1.0) hsl.h -= 1.0;
        if (hsl.h < 0.0) hsl.h += 1.0;
        
        // Nastaviť HSL
        this._tempColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // === SEGMENTED RING: MECHANICAL SPLIT LOGIC ===
        const pulseSpeed = 0.85 + traffic * 0.45 + synergy * 0.35;
        this._pulseCycle = (this._pulseCycle + dt * this._pulseFrequency * pulseSpeed) % 1.0;
        const pulseState = this._evaluateMechanicalPulse(this._pulseCycle);
        const gap = pulseState.gap * (0.9 + synergy * 0.25 + traffic * 0.15);
        this.currentSplitGap = gap;
        this.currentPulsePhase = Math.min(1.0, Math.max(0.0, gap / Math.max(0.0001, this._pulseAmplitude)));
        const spinRate = 2.0 + traffic * 2.2 + synergy * 1.4;
        this.currentSpinAngle = (this.currentSpinAngle + dt * spinRate) % (Math.PI * 2);
        this.segmentGroup.rotation.z = this.currentSpinAngle;
        this._applyRingVisuals(this.material, this._tempColor, finalOpacity);
        // Polish: re-enabled aura for outer glow halo (was disabled for debug)
        const gapFade = 1.0 - gap * 0.3;
        if (this.auraMaterial) {
            this._applyRingVisuals(this.auraMaterial, this._tempColor, finalOpacity * 0.35 * gapFade, 1.2);
        }
        if (this.auraMesh) this.auraMesh.scale.setScalar(1.0 + gap * 0.35);

        // Update segment positions only (they share this.material — no redundant uniform writes)
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].position.copy(this.segmentDirections[i]).multiplyScalar(gap);
        }

        // Arc burst trigger (re-enabled)
        if (pulseState.atPeak && !this._arcTriggeredThisPulse) {
            if (this.arcSystem) {
                this.mesh.getWorldDirection(this._worldDirection);
                this.arcSystem.spawnArcBurst(
                    this.mesh.position,
                    this._worldDirection,
                    synergy,
                    traffic
                );
            }
            this._arcTriggeredThisPulse = true;
        }

        // Arc burst on closure (when segments collapse)
        if (pulseState.resetArc && !this._arcTriggeredOnClose && this.arcSystem) {
            this.mesh.getWorldDirection(this._worldDirection);
            this.arcSystem.spawnArcBurst(
                this.mesh.position,
                this._worldDirection,
                synergy,
                traffic
            );
            this._arcTriggeredOnClose = true;
        }

        if (pulseState.resetArc) {
            this._arcTriggeredThisPulse = false;
        }
        if (!pulseState.resetArc) {
            this._arcTriggeredOnClose = false;
        }
        this.lastPulse = gap;
        
        // Ribbon turbulence update
        if (this.ribbonMesh && this.ribbonMaterial) {
            const ribbonOpacity = 0.18 + Math.sin(this._time * 6.0 + this.progress * Math.PI * 4.0) * 0.08;
            this.ribbonMaterial.uniforms.uOpacity.value = THREE.MathUtils.clamp(ribbonOpacity, 0.05, 0.35);
            this.ribbonMaterial.uniforms.uColor.value.copy(this.material.uniforms.uColor.value);
            this.ribbonMaterial.uniforms.uTime.value = this._time * 1.3;

            // Keep ribbon size slightly below main ring
            const ribbonScale = this.mesh.scale.x * 0.92;
            this.ribbonMesh.scale.set(ribbonScale, ribbonScale, ribbonScale);
        }
    }

    _applyRingVisuals(material, color, opacity, intensityMultiplier = 1.0) {
        if (!material?.uniforms) return;
        const u = material.uniforms;
        // Dirty-check: skip GPU write if values haven't changed
        if (Math.abs(u.uOpacity.value - opacity) > 0.001) u.uOpacity.value = opacity;
        if (!u.uColor.value.equals(color)) u.uColor.value.copy(color);
        // Fresnel uniforms are constant — only write once
        if (!material.userData.__fresnelApplied) {
            u.uFresnelPower.value = 2.2;
            u.uFresnelIntensity.value = 1.6 * intensityMultiplier;
            material.userData.__fresnelApplied = true;
        }
    }

    _evaluateMechanicalPulse(cycle) {
        const wave = Math.sin(cycle * Math.PI) ** 1.5;
        const gap = this._pulseAmplitude * wave;
        const atPeak = wave > 0.98;
        const resetArc = wave < 0.02;
        return { gap, atPeak, resetArc };
    }

    _easeOutCubic(t) {
        const x = 1.0 - t;
        return 1.0 - x * x * x;
    }

    _easeInCubic(t) {
        return t * t * t;
    }

    /**
     * Dispose all meshes and cleanup
     */
    dispose() {
        // Dispose segment geometries (not shared)
        this.segments.forEach(seg => {
            if (seg.geometry && seg.geometry !== SHARED_RING_SEGMENT_GEOMETRY) seg.geometry.dispose();
            if (seg.material) seg.material.dispose();
        });
        
        // Dispose main material (shader material)
        if (this.material) this.material.dispose();
        if (this.auraMaterial) this.auraMaterial.dispose();
        
        // Do NOT dispose SHARED_RING_GEOMETRY (shared across all pulse rings)
        this.mesh.parent?.remove(this.mesh);
    }
}
