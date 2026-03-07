import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

// Shared geometry to minimize allocations
// Radius 1.0, Tube 0.08 (8% thickness)
// RadialSegments 6 (Low poly), TubularSegments 24 (Smooth enough ring)
const SHARED_RING_GEOMETRY = new THREE.TorusGeometry(1.0, 0.16, 6, 24);
SHARED_RING_GEOMETRY.computeBoundingSphere();
SHARED_RING_GEOMETRY.computeBoundingBox();

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
        const TORUS_TUBE = 0.16;
        
        // === FRESNEL SHADER MATERIAL ===
        // NIE MeshBasicMaterial, ALE ShaderMaterial s vlastným shaderom
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide,
            
            uniforms: {
                uColor: { value: new THREE.Color(0xffffff) },
                uOpacity: { value: 0.5 },
                uFresnelPower: { value: 2.5 },
                uFresnelIntensity: { value: 1.8 }
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
        this.segmentGroup = new THREE.Group();
        const SEGMENTS = 4;
        const SEGMENT_ANGLE = Math.PI / 2;

        for (let i = 0; i < SEGMENTS; i++) {
            const geo = new THREE.TorusGeometry(
                TORUS_RADIUS,
                TORUS_TUBE,
                8,
                32,
                i * SEGMENT_ANGLE,
                SEGMENT_ANGLE * 0.9   // malá medzera
            );

            const mat = this.material.clone();

            const seg = new THREE.Mesh(geo, mat);
            seg.rotation.x = Math.PI * 0.5;   // FIX ORIENTATION
            seg.frustumCulled = false;

            this.segmentGroup.add(seg);
            this.segments.push(seg);
        }

        // Main ring container (holds segmentGroup)
        this.mesh = new THREE.Group();
        this.mesh.add(this.segmentGroup);
        this.mesh.frustumCulled = false;
        const ud = (this.mesh && typeof this.mesh.userData === 'object' && this.mesh.userData) ? this.mesh.userData : (() => { try { Object.defineProperty(this.mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.mesh.userData || {}; })();
        Object.assign(ud, { isPulseRing: true });
        const pulseOrder = VisualHierarchyRegistry.getRenderOrder('LINK_STRANDS') + 1;
        this.mesh.renderOrder = pulseOrder;

        // Outer additive aura
        this.auraMaterial = this.material.clone();
        this.auraMaterial.depthWrite = false;
        this.auraMaterial.depthTest = true;
        this.auraMaterial.transparent = true;
        this.auraMaterial.blending = THREE.NormalBlending;
        const aura = new THREE.Mesh(SHARED_RING_GEOMETRY, this.auraMaterial);
        aura.frustumCulled = false;
        aura.renderOrder = pulseOrder;
        const auraUd = (aura && typeof aura.userData === 'object' && aura.userData) ? aura.userData : (() => { try { Object.defineProperty(aura, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return aura.userData || {}; })();
        Object.assign(auraUd, { isPulseRingAura: true });
        this.auraMesh = aura;

        // === LAYER 1: SPIN (Internal rotation) ===
        this.spin = 0; // Spin angle
        
        // === SEGMENTED RING STATE ===
        this.lastPulse = 0; // For snap detection
        this.arcSystem = null; // Arc discharge system reference
        
        // === LAYER 3: TRAIL (Echo rings) ===
        this.trailMeshes = [];
        this.TRAIL_COUNT = 4; // 3-5 echo rings
        
        // State
        this.progress = Math.random(); // Random start pos
        this.active = true;
        
        // === HUE DRIFT: Jemná živá farba ===
        this._tempColor = new THREE.Color(); // Pomocná farba pre HSL operácie
        
        // Trail initialization
        this._initTrails();
        // Attach aura after trails init
        this.mesh.add(this.auraMesh);
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
            lifetimeMultiplier: 0.8 + index * 0.1, // 0.8, 0.9, 1.0, 1.1
            
            // Spin rýchlosť variácia (rôzne rýchlosti)
            spinSpeedMultiplier: 0.7 + Math.random() * 0.4, // 0.7-1.1 random
            
            // Scale pulse variácia (rôzne pulse frekvencie)
            pulseFrequencyMultiplier: 0.8 + Math.random() * 0.4, // 0.8-1.2 random
            
            // Jitter magnitude (náhodné posuny ako LinkBeadTrail)
            jitterMagnitude: baseVariation,
            
            // Position lag (trail nie je presne na tej istej pozícii)
            lagOffset: 0.002 + index * 0.001, // 0.002, 0.003, 0.004, 0.005
            
            // Hue offset (už existuje ale môžeme zvýšiť pre rozmanitosť)
            hueOffset: (index + 1) * 0.01, // 0.01, 0.02, 0.03, 0.04
            
            // Base scale decay (postupne menší)
            scaleDecayBase: 1.0 - (index + 1) / this.TRAIL_COUNT // 0.75, 0.5, 0.25, 0.0
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
            // Hide all trails
            this.trailMeshes.forEach(trail => trail.visible = false);
            return;
        }
        this.mesh.visible = true;

        // === 1. Motion Logic ===
        // Speed scales with traffic and synergy (slower, more visible)
        // Baseline: 0.3, Max: ~1.0
        const speed = 0.3 + (traffic * 0.4) + (synergy * 0.2);
        const oldProgress = this.progress;
        this.progress += speed * dt;
        
        // === 4. LAYER 4: SIGNATURE IMPACT (Scale spike on reset) ===
        if (this.progress >= 1.0) {
            this.progress = 0.0; // Loop
            // Impact moment: brief scale spike
            this.mesh.scale.multiplyScalar(1.3);
        }
        
        // === 2. Position & Orientation ===
        // Get position on curve
        // Clamp to 0-0.999 to avoid tangent issues at very end
        const t = Math.min(0.999, Math.max(0.001, this.progress));
        
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        this.mesh.position.copy(point);
        // Align ring normal (Z-axis of Torus) to curve tangent
        this.mesh.lookAt(point.clone().add(tangent));
        
        // === 3. Visual Scaling & Oscillation (EPIC GLOW LAYER + SECOND HARMONIC PULSE) ===
        // Base size scales with synergy (enhanced visibility)
        const baseScale = 0.12 + (synergy * 0.08);
        
        // === SECOND HARMONIC PULSE: Dvojfrekvenčný pulz ===
        // Primary oscilátor
        const primary = Math.sin(this.progress * Math.PI * 6);
        
        // Harmonic oscilátor (dvojnásobná frekvencia, 40% amplitúda)
        const harmonic = Math.sin(this.progress * Math.PI * 12) * 0.4;
        
        // Kombinovaný pulz (nie jeden tep, ale komplexný pulz)
        const combinedPulse = 1.0 + primary * 0.15 + harmonic * 0.08;
        
        // Epic Glow: Epic boost from synergy
        const epicBoost = 0.6 + synergy * 0.8;
        
        // Apply epic glow scale s harmonickým pulzom
        this.mesh.scale.setScalar(baseScale * combinedPulse);
        
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
        const hsl = {};
        this._tempColor.getHSL(hsl);
        
        // Drift rýchlosť podľa synergy
        const driftSpeed = 0.2 + synergy * 0.8;
        
        // Jemný posun hue (menší než 0.02 aby to nebolo cirkus!)
        const hueDrift = Math.sin(performance.now() * 0.001 * driftSpeed) * 0.015;
        hsl.h += hueDrift;
        
        // Wrap hue (0-1)
        if (hsl.h > 1.0) hsl.h -= 1.0;
        if (hsl.h < 0.0) hsl.h += 1.0;
        
        // Nastaviť HSL
        this._tempColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // Poslať do shader uniformu
        this.material.uniforms.uColor.value.copy(this._tempColor);
        
        // Nastaviť opacity shader-uOpacity
        this.material.uniforms.uOpacity.value = finalOpacity;
        
        // === SEGMENTED RING: PULSE SPLIT LOGIC ===
        const pulse = Math.sin(this.progress * Math.PI * 2);
        const gap = Math.abs(pulse) * 0.25;
        
        // === SEGMENTED RING: POSITION SEGMENTS ===
         this.segments.forEach((seg, i) => {

            const angle = i * Math.PI / 2;

            const dir = new THREE.Vector3(
                Math.cos(angle),
                Math.sin(angle),
                0
            );

            seg.position.copy(dir.multiplyScalar(gap));

        });
        
        // === SEGMENTED RING: SPIN (dramatic effect) ===

        // === SEGMENTED RING: SNAP MOMENT (trigger arcs) ===
        if (pulse > 0.95 && this.lastPulse < 0.95) {
            if (this.arcSystem) {
                this.arcSystem.spawnArcBurst(
                    this.mesh.position,
                    this.mesh.getWorldDirection(new THREE.Vector3()),
                    synergy,
                    traffic
                );
            }
        }
        this.lastPulse = pulse;
        
        // === LAYER 1: SPIN (Internal rotation - Gyroscope effect) ===
        // spin disabled – pulse ring should stay stable
        
        // === LAYER 3: TRAIL (Echo rings - ORGANIC TRAIL V2) ===
        // Update all trail meshes with organic behavior (ako LinkBeadTrail)
        
        const spacing = 0.03; // Delay between trail segments
        
        this.trailMeshes.forEach((trail, i) => {
            // Get trail variation parameters
            const variation = trail.userData.trailVariation;
            const trailProgress = this.progress - spacing * (i + 1);
            
            // Hide if behind start
            if (trailProgress <= 0) {
                trail.visible = false;
                return;
            }
            
            trail.visible = true;
            
            // Position on curve
            const trailT = Math.min(0.999, Math.max(0.001, trailProgress));
            const trailPoint = curve.getPointAt(trailT);
            const trailTan = curve.getTangentAt(trailT);
            
            // Apply position lag (trail nie je presne na tej istej pozícii)
            const trailPosLagged = trailPoint.clone();
            trailPosLagged.addScaledVector(trailTan, variation.lagOffset);
            trail.position.copy(trailPosLagged);
            
            // Orientation
            const trailQuat = new THREE.Quaternion();
            trailQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), trailTan.normalize());
            trail.quaternion.copy(trailQuat);
            
            // ORGANIC: Jitter (náhodné posuny ako LinkBeadTrail)
            const jitter = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            const jitterMagnitude = variation.jitterMagnitude * this.mesh.scale.x;
            trail.position.addScaledVector(jitter, jitterMagnitude);
            
            // SCALE: Decay + Pulse (nielen decay, ale aj pulse)
            const baseScale = this.mesh.scale.x;
            const trailScalePulse = Math.sin(this.progress * Math.PI * 6 * variation.pulseFrequencyMultiplier) * 0.05;
            const dynamicScale = baseScale * (variation.scaleDecayBase + trailScalePulse);
            trail.scale.setScalar(dynamicScale);
            
            // OPACITY: Decay + Pulse + Lifetime variation
            const trailOpacityPulse = Math.sin(this.progress * Math.PI * 6 * variation.pulseFrequencyMultiplier) * 0.1;
            const trailOpacityDecay = 1.0 - (i + 1) / (this.trailMeshes.length + 1); // Výraznejšie: 0.8, 0.6, 0.4, 0.2
            const trailLifetimeDecay = trailProgress < 0.3 ? trailProgress / 0.3 : (trailProgress > 0.7 ? (1.0 - trailProgress) / 0.3 : 1.0);
            trail.material.uniforms.uOpacity.value = finalOpacity * trailLifetimeDecay * trailOpacityDecay * (0.9 + trailOpacityPulse);
            
            // HUE: Offset (variabilnejší)
            const trailHueOffset = variation.hueOffset + (Math.random() - 0.5) * 0.02;
            this._tempColor.setHSL(hsl.h + trailHueOffset, hsl.s, hsl.l);
            trail.material.uniforms.uColor.value.copy(this._tempColor);
            
            // SPIN: Unique spin speed per trail
            const trailSpin = this.spin * variation.spinSpeedMultiplier;
            trail.rotateOnAxis(new THREE.Vector3(0, 0, 1), trailSpin);
        });
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
        
        // Dispose all trail materials
        this.trailMeshes.forEach(trail => {
            if (trail.material) trail.material.dispose();
        });
        
        // Do NOT dispose SHARED_RING_GEOMETRY (shared across all pulse rings)
    }
}
