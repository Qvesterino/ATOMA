import * as THREE from 'three';
import { applyLinkRenderLayer } from './LinkRenderLayerPolicy.js';

// Shared geometry to minimize allocations
// Radius 1.0, Tube 0.08 (8% thickness)
// RadialSegments 6 (Low poly), TubularSegments 24 (Smooth enough ring)
const SHARED_RING_GEOMETRY = new THREE.TorusGeometry(1.0, 0.16, 6, 24);
SHARED_RING_GEOMETRY.computeBoundingSphere();
SHARED_RING_GEOMETRY.computeBoundingBox();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/**
 * LinkPulseRing - ARCHITEKTÚRA V3 + FRESNEL SHADER
 * ============================================================================
 * A purely visual effect: A glowing ring that travels along link curve.
 * 
 * LAYER 1: SPIN (Gyroscope effect - internal rotation)
 * LAYER 2: EPIC GLOW (Energy - not "soft glow", but ENERGY)
 * LAYER 3: TRAIL (Echo rings - 3-5 stable rings)
 * LAYER 4: SIGNATURE IMPACT (Scale spike on reset)
 * 
 * VISUAL TRANSFORMATION:
 * ================================
 * PREDTÝM: Ring = svetlý torus (MeshBasicMaterial)
 * TERAZ: Ring = energétický plazmový torus (Fresnel ShaderMaterial)
 * 
 * - Fresnel efekt: Ostrý rim na hrane (view-dependent)
 * - Širší glow: uFresnelPower=2.5, uFresnelIntensity=1.8
 * - Jemný glow term: finalColor += uColor * 0.2 (subtle inner glow)
 * - Additive blending: Zosilňuje efekt
 * 
 * reinforces flow direction and synergy strength.
 */
export class LinkPulseRing {
    constructor(scene) {
        this.scene = scene;
        
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
                uFresnelPower: { value: 2.5 },
                uFresnelIntensity: { value: 2.4 }
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
                    
                    vec3 base = uColor * 0.15;
                    vec3 finalColor = base + uColor * fresnel;
                    
                    gl_FragColor = vec4(finalColor, uOpacity * fresnel);
                }
            `
        });

        // === SEGMENTED RING INITIALIZATION ===
        this.segments = [];
        this.segmentDirections = [];
        this.segmentGroup = new THREE.Group();
        const SEGMENTS = 4;
        const SEGMENT_ANGLE = Math.PI / 2;

        for (let i = 0; i < SEGMENTS; i++) {
            const geo = new THREE.TorusGeometry(
                TORUS_RADIUS,
                TORUS_TUBE,
                8,
                32,
                SEGMENT_ANGLE * 0.85
            );
            geo.rotateZ(i * SEGMENT_ANGLE);

            const mat = this.material.clone();

            const seg = new THREE.Mesh(geo, mat);
            seg.frustumCulled = false;
            applyLinkRenderLayer(seg, 'LINK_RING');

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
        applyLinkRenderLayer(this.mesh, 'LINK_RING');

        // Outer additive aura
        this.auraMaterial = this.material.clone();
        this.auraMaterial.depthWrite = false;
        this.auraMaterial.depthTest = true;
        this.auraMaterial.transparent = true;
        this.auraMaterial.blending = THREE.AdditiveBlending;
        const aura = new THREE.Mesh(SHARED_RING_GEOMETRY, this.auraMaterial);
        aura.frustumCulled = false;
        applyLinkRenderLayer(aura, 'LINK_RING');
        const auraUd = (aura && typeof aura.userData === 'object' && aura.userData) ? aura.userData : (() => { try { Object.defineProperty(aura, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return aura.userData || {}; })();
        Object.assign(auraUd, { isPulseRingAura: true });
        this.auraMesh = aura;

        // === LAYER 1: SPIN (Internal rotation) ===
        this.spin = 0;
        
        // === SEGMENTED RING STATE ===
        this.lastPulse = 0; // For snap detection
        this.arcSystem = null; // Arc discharge system reference
        
        // === LAYER 3: TRAIL (Echo rings) ===
        this.trailMeshes = [];
        this.TRAIL_COUNT = 2;

        // Chain arcs between trail rings (small pool)
        this._chainArcPool = [];
        this._activeChainArcs = [];
        this._chainDir = new THREE.Vector3();
        this._chainNormal = new THREE.Vector3();
        this._chainBinormal = new THREE.Vector3();
        this._chainTmp = new THREE.Vector3();
        this._initChainArcPool(2);

        // Ribbon turbulence layer (between main ring and trails)
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

                float hash(float x) { return fract(sin(x) * 43758.5453); }

                void main() {
                    // Soft ribbon mask (fade on edges)
                    float maskV = smoothstep(0.05, 0.25, vUv.y) * smoothstep(0.95, 0.75, vUv.y);
                    float maskU = smoothstep(0.02, 0.15, vUv.x) * smoothstep(0.98, 0.85, vUv.x);
                    float mask = maskU * maskV;

                    // Layered fast turbulence
                    float p = uTime * 20.0;
                    float t1 = sin(vUv.x * 36.0 + p);
                    float t2 = sin(vUv.x * 64.0 + vUv.y * 8.0 + p * 1.7 + 1.1);
                    float t3 = sin((vUv.x + vUv.y) * 92.0 + p * 2.3 + 2.4);
                    float turb = (t1 + t2 + t3) / 3.0;

                    // Shimmer modulation
                    float shimmer = 0.6 + 0.4 * abs(turb);
                    float alpha = uOpacity * mask * shimmer;
                    if (alpha < 0.01) discard;

                    gl_FragColor = vec4(uColor, alpha);
                }
            `
        });

        this.ribbonMesh = new THREE.Mesh(SHARED_RING_GEOMETRY, this.ribbonMaterial);
        this.ribbonMesh.frustumCulled = false;
        applyLinkRenderLayer(this.ribbonMesh, 'LINK_RING');
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
        this._trailPoint = new THREE.Vector3();
        this._trailTangent = new THREE.Vector3();
        this._trailNormal = new THREE.Vector3();
        this._trailBinormal = new THREE.Vector3();
        this._trailOffset = new THREE.Vector3();
        this._trailQuaternion = new THREE.Quaternion();
        this._trailSpinQuaternion = new THREE.Quaternion();
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
        
        // Trail initialization
        this._initTrails();
        // DEBUG ISOLATION: aura layer disabled so segment split stays readable.
        // this.mesh.add(this.auraMesh);
    }

    /**
     * Initialize trail meshes (echo rings - ORGANIC TRAIL V2)
     */
    _initTrails() {
        for (let i = 0; i < this.TRAIL_COUNT; i++) {
            const mat = this.material.clone();
            const mesh = new THREE.Mesh(SHARED_RING_GEOMETRY, mat);
            mesh.frustumCulled = false;
            mesh.renderOrder = this.mesh.renderOrder;
            
            // TRAIL VARIATIONS - Každý trail má inú charakteristiku
            const trailVariation = this._getTrailVariation(i);
            mesh.userData.trailVariation = trailVariation; // Uložiť pre update
            
            this.trailMeshes.push(mesh);
        }
    }

    _initChainArcPool(count) {
        for (let i = 0; i < count; i++) {
            const positions = new Float32Array((5 + 1) * 3); // 5 segments = 6 points
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color(0x9fe8ff),
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                linewidth: 1.2,
                fog: false,
            });
            const line = new THREE.Line(geometry, material);
            line.frustumCulled = false;
            line.visible = false;
            applyLinkRenderLayer(line, 'LINK_ARCS');
            this.mesh.add(line);
            this._chainArcPool.push({
                mesh: line,
                geometry,
                material,
                positions,
                lifetime: 0.06,
                age: 0,
                baseOpacity: 0.5
            });
        }
    }

    /**
     * Get trail variation parameters (organic behavior like LinkBeadTrail)
     * @param {number} index - Trail index (0-3)
     * @returns {Object} Trail variation parameters
     */
    _getTrailVariation(index) {
        // Viac variácie pri vyšších indexoch
        const baseVariation = 0.05 + index * 0.03; // 0.05, 0.08, 0.11, 0.14
        
        return {
            // Lifetime variácia (dlhšie traily vytrvajú dlhšie)
            lifetimeMultiplier: 0.95 + index * 0.08,
            
            // Motor drift speed multiplier
            spinSpeedMultiplier: 0.82 + index * 0.14,
            
            // Secondary pulse frequency per trail
            pulseFrequencyMultiplier: 0.9 + index * 0.12,
            
            // Orbital drift radius
            jitterMagnitude: baseVariation * 0.5,
            
            // Position lag (trail nie je presne na tej istej pozícii)
            lagOffset: 0.008 + index * 0.006,
            
            // Hue offset (už existuje ale môžeme zvýšiť pre rozmanitosť)
            hueOffset: (index + 1) * 0.006,
            
            // Base scale decay (postupne menší)
            scaleDecayBase: 0.82 - index * 0.18
        };
    }

    /**
     * Get main mesh to add to link group
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Get all trail meshes (for adding to link group)
     */
    getTrailMeshes() {
        return this.trailMeshes;
    }

    /**
     * Set arc discharge system reference
     * @param {LinkRingArcDischarges} arcSystem - The arc discharge system
     */
    setArcSystem(arcSystem) {
        this.arcSystem = arcSystem;
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
            this.auraMesh.visible = false;
            // Hide all trails
            this.trailMeshes.forEach(trail => trail.visible = false);
            return;
        }
        this.mesh.visible = true;
        this.auraMesh.visible = false;
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
        
        // === 3. Visual Scaling & Oscillation (EPIC GLOW LAYER + SECOND HARMONIC PULSE) ===
        // Base size scales with synergy (enhanced visibility)
        const baseScale = 0.12 + (synergy * 0.08);
        
        // === SECOND HARMONIC PULSE: Dvojfrekvenčný pulz ===
        // Primary oscilátor
        // DEBUG ISOLATION: suppress scale pulse so only segment split communicates motion.
        // const primary = Math.sin(this.progress * Math.PI * 6);
        const primary = 0;
        
        // Harmonic oscilátor (dvojnásobná frekvencia, 40% amplitúda)
        // const harmonic = Math.sin(this.progress * Math.PI * 12) * 0.4;
        const harmonic = 0;
        
        // Kombinovaný pulz (nie jeden tep, ale komplexný pulz)
        const combinedPulse = 1.0 + primary * 0.15 + harmonic * 0.08;
        
        // Apply epic glow scale s harmonickým pulzom
        this.mesh.scale.set(baseScale * 1.1, baseScale, baseScale * 1.1);
        
        // === FADE IN/OUT LOGIKA ===
        let alpha = 1.0;
        const fadeZone = 0.15; // 15% of length
        
        if (this.progress < fadeZone) {
            alpha = this.progress / fadeZone;
        } else if (this.progress > (1.0 - fadeZone)) {
            alpha = (1.0 - this.progress) / fadeZone;
        }
        
        // === 3️⃣ HARMONIC AJ DO OPACITY ===
        // Jemné "bliknutie vnútri pulzu"
        const maxOpacity = 0.4 + (synergy * 0.4);
        const opacityPulse = 1.0 + harmonic * 0.2;
        const finalOpacity = alpha * maxOpacity * opacityPulse;

        // === 5. Shader Uniform Updates (FRESNEL) ===
        // === HUE DRIFT: Jemná živá farba ===
        // Základná farba (source → target blend)
        this._tempColor.copy(sourceColor).lerp(targetColor, this.progress);
        
        // Prechod do HSL
        const hsl = this._hsl;
        this._tempColor.getHSL(hsl);
        
        // Drift rýchlosť podľa synergy
        const driftSpeed = 0.2 + synergy * 0.8;
        
        // Jemný posun hue (menší než 0.02 aby to nebolo cirkus!)
        // DEBUG ISOLATION: disable hue drift to keep the ring visually stable while testing split.
        // const hueDrift = Math.sin(this._time * driftSpeed) * 0.015;
        // hsl.h += hueDrift;
        
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
        // DEBUG ISOLATION: aura disabled because it visually bridges the segment gap.
        // this._applyRingVisuals(this.auraMaterial, this._tempColor, finalOpacity * 0.45 * gapFade, 1.2);
        // this.auraMesh.scale.setScalar(1.0 + gap * 0.35);

        this.segments.forEach((seg, i) => {
            seg.position.copy(this.segmentDirections[i]).multiplyScalar(gap);
            this._applyRingVisuals(seg.material, this._tempColor, finalOpacity);
        });

        // Arc burst trigger (re-enabled)
        if (pulseState.atPeak && !this._arcTriggeredThisPulse && this.arcSystem) {
            this.mesh.getWorldDirection(this._worldDirection);
            this.arcSystem.spawnArcBurst(
                this.mesh.position,
                this._worldDirection,
                synergy,
                traffic
            );
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
        
        // === LAYER 1: SPIN (Internal rotation - Gyroscope effect) ===
        // spin disabled – pulse ring should stay stable
        
        // === LAYER 3: TRAIL (Echo rings - ORGANIC TRAIL V2) ===
        // Update all trail meshes with organic behavior (ako LinkBeadTrail)
        
        const spacing = 0.03;
        this.trailMeshes.forEach((trail, i) => {
            const variation = trail.userData.trailVariation;
            const trailProgress = this.progress - spacing * (i + 1);
            if (trailProgress <= 0) {
                trail.visible = false;
                return;
            }
            trail.visible = true;
            const trailT = Math.min(0.999, Math.max(0.001, trailProgress));
            const trailPoint = curve.getPointAt(trailT, this._trailPoint);
            const trailTan = curve.getTangentAt(trailT, this._trailTangent);
            trail.position.copy(trailPoint);
            trail.position.addScaledVector(trailTan, variation.lagOffset);
            this._trailQuaternion.setFromUnitVectors(this._ringAxis, trailTan.normalize());
            this._buildTrailFrame(trailTan, this._trailNormal, this._trailBinormal);

            // Propulsion-like thrust pulses along tangent
            const phase = this._time * 18.0 + i * 1.2;
            const osc1 = Math.sin(phase) * 0.05;
            const osc2 = Math.sin(phase * 2.3 + 1.7) * 0.03;
            const osc3 = Math.sin(phase * 4.1 + 0.4) * 0.015;
            const burst = Math.max(0.0, Math.sin(this._time * 6.0 + i)) * 0.05;
            const oscillation = osc1 + osc2 + osc3 + burst;
            trail.position.addScaledVector(trailTan, oscillation);

            // Optional scale pulse for added energy feel
            const scalePulse = 1.0 + Math.sin(this._time * 16.0 + i * 1.3) * 0.05;
            const baseScale = this.mesh.scale.x;
            const dynamicScale = baseScale * scalePulse;

            // Energy compression along tangent
            const compPhase = this._time * 14.0 + i * 0.9;
            const compression = Math.pow(Math.max(0.0, Math.sin(compPhase)), 2.0);
            const scaleForward = 1.0 - compression * 0.35;
            const scaleSide = 1.0 + compression * 0.18;
            trail.scale.set(
                dynamicScale * scaleSide,
                dynamicScale * scaleSide,
                dynamicScale * scaleForward
            );

            trail.quaternion.copy(this._trailQuaternion);
            const trailOpacityPulse = Math.sin(this.progress * Math.PI * 6 * variation.pulseFrequencyMultiplier) * 0.1;
            const trailOpacityDecay = 1.0 - (i + 1) / (this.trailMeshes.length + 1);
            const trailLifetimeDecay = trailProgress < 0.3 ? trailProgress / 0.3 : (trailProgress > 0.7 ? (1.0 - trailProgress) / 0.3 : 1.0);
            trail.material.uniforms.uOpacity.value = finalOpacity * trailLifetimeDecay * trailOpacityDecay * (0.72 + trailOpacityPulse);
            const trailHueOffset = variation.hueOffset + (Math.random() - 0.5) * 0.02;
            this._tempColor.setHSL(hsl.h + trailHueOffset, hsl.s, hsl.l);
            this._applyRingVisuals(trail.material, this._tempColor, trail.material.uniforms.uOpacity.value);
        });

        // Chain arcs between adjacent trails
        if (this.trailMeshes.length >= 2) {
            for (let i = 0; i < this.trailMeshes.length - 1; i++) {
                const a = this.trailMeshes[i];
                const b = this.trailMeshes[i + 1];
                const dist = a.position.distanceTo(b.position);
                if (dist < 0.2 && Math.random() < 0.35 && this._activeChainArcs.length < 2) {
                    this._spawnChainArc(a.position, b.position);
                }
            }
        }

        // Update active chain arcs
        if (this._activeChainArcs.length > 0) {
            const now = this._time;
            for (let i = this._activeChainArcs.length - 1; i >= 0; i--) {
                const arc = this._activeChainArcs[i];
                arc.age += dt;
                const t = arc.age / arc.lifetime;
                if (t >= 1.0) {
                    arc.mesh.visible = false;
                    this._activeChainArcs.splice(i, 1);
                    this._chainArcPool.push(arc);
                } else {
                    arc.material.opacity = arc.baseOpacity * (1.0 - t);
                }
            }
        }

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

    _buildTrailFrame(direction, normal, binormal) {
        normal.set(0, 1, 0);
        if (Math.abs(direction.dot(normal)) > 0.92) {
            normal.set(1, 0, 0);
        }
        binormal.crossVectors(direction, normal).normalize();
        normal.crossVectors(binormal, direction).normalize();
    }

    _spawnChainArc(startPos, endPos) {
        if (this._chainArcPool.length === 0) return;
        const arc = this._chainArcPool.pop();
        arc.age = 0;
        arc.mesh.visible = true;

        // build jagged positions between start and end
        const segs = 5;
        const dir = this._chainDir.subVectors(endPos, startPos);
        const len = dir.length();
        if (len < 1e-4) return;
        dir.normalize();
        const up = Math.abs(dir.y) < 0.9 ? this._chainNormal.set(0, 1, 0) : this._chainNormal.set(1, 0, 0);
        this._chainBinormal.crossVectors(dir, up).normalize();
        up.crossVectors(this._chainBinormal, dir).normalize();

        const amp = 0.02 + Math.random() * 0.02;
        let idx = 0;
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            this._chainTmp.copy(startPos).addScaledVector(dir, t * len);
            const jitterN = (Math.random() - 0.5) * amp;
            const jitterB = (Math.random() - 0.5) * amp;
            this._chainTmp.addScaledVector(up, jitterN).addScaledVector(this._chainBinormal, jitterB);
            arc.positions[idx++] = this._chainTmp.x;
            arc.positions[idx++] = this._chainTmp.y;
            arc.positions[idx++] = this._chainTmp.z;
        }
        arc.geometry.attributes.position.needsUpdate = true;
        arc.material.opacity = arc.baseOpacity;

        this._activeChainArcs.push(arc);
    }

    _applyRingVisuals(material, color, opacity, intensityMultiplier = 1.0) {
        if (!material?.uniforms) return;
        material.uniforms.uColor.value.copy(color);
        material.uniforms.uOpacity.value = opacity;
        material.uniforms.uFresnelPower.value = 2.2;
        material.uniforms.uFresnelIntensity.value = 1.6 * intensityMultiplier;
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
            if (seg.geometry) seg.geometry.dispose();
            if (seg.material) seg.material.dispose();
        });
        
        // Dispose main material (shader material)
        if (this.material) this.material.dispose();
        if (this.auraMaterial) this.auraMaterial.dispose();
        
        // Dispose all trail materials
        this.trailMeshes.forEach(trail => {
            if (trail.material) trail.material.dispose();
        });
        
        // Do NOT dispose SHARED_RING_GEOMETRY (shared across all pulse rings)
    }
}
