import * as THREE from 'three';
import { LinkBufferSafetyAudit } from './LinkBufferSafetyAudit.js';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * LinkRingArcDischarges - AAA QUALITY VISUALS
 * ===================================================================
 * Micro electric arc discharges that spawn near traveling pulse ring.
 * 
 * BEHAVIOR (AAA UPGRADE):
 * - PHASE 1: Two-Phase Arc System (Snap + Afterglow)
 * - PHASE 2: Branching Lightning (30-50% chance)
 * - PHASE 3: Improved Electric Shape (Structured Wave)
 * - PHASE 4: Smooth Energy Fade (sin progress * PI)
 * - PHASE 5: Subtle Hue Variation (±5%)
 * - PHASE 6: Synergy Modulation (arc count, lifetime)
 * 
 * VISUAL IMPROVEMENTS:
 * - Longer-lasting arcs (0.12s snap + 0.35-0.5s afterglow)
 * - Clear two-phase electric burst
 * - Occasional branching lightning
 * - Structured electric shape (not random noise spam)
 * - Smooth fade (no harsh in/out)
 * - Subtle hue variation
 * 
 * ORIGINAL BEHAVIOR (preserved):
 * - Monitors pulse ring progress (0-1 traversal)
 * - When ring crosses spawn thresholds, emits burst
 * - Each arc is thin, jagged, perpendicular to link tangent
 * - Additive blending, same color family as ring
 * - No persistent emission, purely ring-triggered
 */
export class LinkRingArcDischarges {
    constructor(scene) {
        this.scene = scene;
        this.activeArcs = []; // Array of active arc objects
        this.group = new THREE.Group();
        const ud = (this.group && typeof this.group.userData === 'object' && this.group.userData) ? this.group.userData : (() => { try { Object.defineProperty(this.group, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.group.userData || {}; })();
        Object.assign(ud, { isArcDischarges: true });
        
        scene.add(this.group);
        
        // Configuration (unchanged)
        this.config = {
            spawnInterval: 0.28 + Math.random() * 0.04,      // (legacy, unused in new logic)
            arcsPerBurst: 5,          // Base arc count
            arcLifetime: 0.6,         // Longer visibility (whip linger)
            arcLength: 1.2,           // Extended reach into space
            arcThickness: 0.06,       // Thicker arcs for readability
            jitterAmount: 0.07,       // Stronger jagged deviation
            radiusScale: 1.0,         // Scales with synergy
            surfaceRadiusMul: 1.2     // How far from link core arcs originate
        };
        
        // State tracking
        this.lastSpawnProgress = -1;
        this.currentRingProgress = 0;
        this.ringColor = new THREE.Color(0xffffff);
        this.ringScale = 1.0;
        this.lastRingScale = 1.0;
        this.arcsThisPulse = 0;
        this.sparkPool = [];
        this.activeSparks = [];
        this._initImpactSparkPool(6);

        // Ripple pool for surface ripples
        this.ripplePool = [];
        this.activeRipples = [];
        this._initRipplePool(3);

        // Energy packet pool (travel inside link core)
        this.packetPool = [];
        this.activePackets = [];
        this._initPacketPool(3);
        
        // Math cache
        this._vec3 = new THREE.Vector3();
        this._vec3b = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
    }

    /**
     * Get group containing all arc visuals
     */
    getGroup() {
        return this.group;
    }

    /**
     * Update arcs based on ring state
     * @param {THREE.Curve} curve - The link curve
     * @param {number} ringProgress - Ring position (0-1)
     * @param {number} synergy - Synergy score (0-1)
     * @param {number} traffic - Traffic load (0-1)
     * @param {number} dt - Delta time
     * @param {THREE.Color} ringColor - Ring color
     * @param {number} ringScale - Ring scale factor
     */
    update(curve, ringProgress, synergy, traffic, dt, ringColor, ringScale, harmony = 1.0, corruption = 0.0) {
        if (!curve) return;

        this.currentRingProgress = ringProgress;
        this.ringColor.copy(ringColor);
        this.ringScale = ringScale;
        this.currentHarmony = harmony;
        this.currentCorruption = corruption;

        this.checkAndSpawnArcs(curve, synergy, traffic);

        // Update active arcs (PHASE 4: Smooth Energy Fade)
        this.updateActiveArcs(dt, curve);

        // Track last scale/progress for phase detection
        this.lastRingScale = this.ringScale;
        // reset per-pulse when progress loops
        if (ringProgress < this.lastSpawnProgress) {
            this.arcsThisPulse = 0;
        }
    }

    /**
     * Check if ring has crossed a spawn threshold
     */
    checkAndSpawnArcs(curve, synergy, traffic) {
        const t = Math.min(0.999, Math.max(0.001, this.currentRingProgress));
        const ringPos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();

        // Build local frame for fragment offsets
        const normal = this._vec3.set(0, 1, 0);
        if (Math.abs(tangent.dot(normal)) > 0.9) normal.set(1, 0, 0);
        const binormal = this._vec3b.crossVectors(tangent, normal).normalize();
        normal.crossVectors(binormal, tangent).normalize();

        // Four fragment directions around ring
        const fragments = [];
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const dir = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle)).normalize();
            fragments.push(dir);
        }

        const expanding = this.ringScale > this.lastRingScale + 0.001;
        const collapsing = this.ringScale < this.lastRingScale - 0.001;

        if (this.arcsThisPulse >= 4) return;

        if (expanding || collapsing) {
            const mode = expanding ? 'expansion' : 'collapse';
            this.spawnFromFragments(ringPos, tangent, fragments, synergy, traffic, mode);
            // Occasionally spawn energy packet along core during pulse events
            if (Math.random() < 0.35) {
                this._spawnPacket(curve, ringPos, this._selectPacketColor(synergy, this.currentHarmony, this.currentCorruption));
            }
            // Impact arcs on collapse with low probability
            if (collapsing && Math.random() < 0.35 && this.arcsThisPulse < 4) {
                const dir = fragments[Math.floor(Math.random() * fragments.length)].clone().normalize();
                const startPoint = ringPos.clone().addScaledVector(dir, this.config.arcLength * 0.25 * this.ringScale);
                const impactPoint = ringPos.clone().addScaledVector(dir, -0.12 * this.ringScale);
                this.spawnImpactArc(startPoint, impactPoint, dir, tangent, synergy, traffic);
                this.arcsThisPulse++;
            }
        }

        this.lastSpawnProgress = this.currentRingProgress;
    }

    /**
     * Directional arc spawn from fragment
     */
    spawnArcDirectional(startPoint, endPoint, radialDir, tangent, synergy, traffic, outward = true, impactPoint = null) {
        const geometry = new THREE.BufferGeometry();
        const normal = radialDir.clone().normalize();
        const binormal = this._vec3b.crossVectors(tangent, normal).normalize();
        if (binormal.lengthSq() < 1e-4) {
            binormal.set(0, 1, 0).cross(normal).normalize();
        }
        const segments = impactPoint ? 6 : 8;
        const jitterMul = impactPoint ? 0.7 : 1.0;
        const positions = this.generateArcPath(startPoint, endPoint, segments, jitterMul, normal, binormal);
        if (!positions) return null;
        geometry.setAttribute('position', positions);
        if (!LinkBufferSafetyAudit.verifyGeometrySafety(geometry)) {
            geometry.dispose();
            return null;
        }

        const colorVariation = 0.8 + Math.random() * 0.25;
        let arcColor = this.ringColor.clone().multiplyScalar(colorVariation);
        const hsl = {};
        arcColor.getHSL(hsl);
        const hueShift = (Math.random() - 0.5) * 0.05;
        hsl.h = (hsl.h + hueShift + 1.0) % 1.0;
        arcColor.setHSL(hsl.h, hsl.s, hsl.l);

        const material = new THREE.LineBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: 0.7 * 2.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            linewidth: this.config.arcThickness * 100.0,
            fog: false,
        });

        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const arcsOrder = VisualHierarchyRegistry.getRenderOrder('LINK_ARCS');
        line.renderOrder = arcsOrder;
        this.group.add(line);

        const arcData = {
            mesh: line,
            geometry: geometry,
            material: material,
            lifetime: (impactPoint ? 0.16 : this.config.arcLifetime) + Math.random() * 0.06,
            age: 0,
            maxOpacity: 0.9 * 2.3,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 4.0 + Math.random() * 2.0,
            flashBoost: 1.1 + Math.random() * 0.2,
            impactPoint: impactPoint ? impactPoint.clone() : null,
            hasImpact: !!impactPoint
        };

        // Optional tiny branch
        if (Math.random() < 0.35) {
            const branchGeometry = new THREE.BufferGeometry();
            const mid = startPoint.clone().lerp(endPoint, 0.5);
            const branchEnd = mid.clone().addScaledVector(binormal, 0.08 * (Math.random() - 0.5));
            const bPositions = this.generateArcPath(mid, branchEnd, 4, 0.8, normal, binormal);
            if (bPositions) {
                branchGeometry.setAttribute('position', bPositions);
                if (LinkBufferSafetyAudit.verifyGeometrySafety(branchGeometry)) {
                    const branchMaterial = new THREE.LineBasicMaterial({
                        color: arcColor,
                        transparent: true,
                        opacity: 0.6,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false,
                        depthTest: false,
                        linewidth: 0.7,
                        fog: false,
                    });
                    const branchLine = new THREE.Line(branchGeometry, branchMaterial);
                    branchLine.frustumCulled = false;
                    branchGeometry.computeBoundingSphere();
                    branchGeometry.computeBoundingBox();
                    branchLine.renderOrder = arcsOrder;
                    this.group.add(branchLine);
                    this.activeArcs.push({
                        mesh: branchLine,
                        geometry: branchGeometry,
                        material: branchMaterial,
                        lifetime: arcData.lifetime * 0.8,
                        age: 0,
                        maxOpacity: 0.6,
                        pulsePhase: Math.random() * Math.PI * 2,
                        pulseSpeed: arcData.pulseSpeed * 0.8,
                        flashBoost: 1.0
                    });
                } else {
                    branchGeometry.dispose();
                }
            } else {
                branchGeometry.dispose();
            }
        }

        this.activeArcs.push(arcData);
        return arcData;
    }

    spawnImpactArc(startPoint, impactPoint, radialDir, tangent, synergy, traffic) {
        this.spawnArcDirectional(startPoint, impactPoint, radialDir, tangent, synergy, traffic, false, impactPoint);
    }

    /**
     * Spawn arcs from fragment directions based on ring phase
     */
    spawnFromFragments(ringPos, tangent, fragments, synergy, traffic, mode = 'expansion') {
        const maxBursts = 4 - this.arcsThisPulse;
        if (maxBursts <= 0) return;

        let bursts = 0;
        for (const dir of fragments) {
            if (bursts >= maxBursts) break;
            if (Math.random() > 0.3) continue; // spawn chance per fragment
            const radialDir = dir.clone().normalize();
            const outward = mode === 'expansion';
            const startOffset = this.config.arcLength * 0.6 * this.ringScale + 0.03;
            const startPoint = ringPos.clone().addScaledVector(radialDir, startOffset);

            // Tangent push (electric whip into space)
            const tangentPush = (0.22 + Math.random() * 0.13) * this.ringScale * (Math.random() < 0.15 ? -1 : 1);
            const radialReach = outward ? this.config.arcLength * 1.25 : -this.config.arcLength * 0.75;

            const endPoint = ringPos.clone()
                .addScaledVector(radialDir, radialReach)
                .addScaledVector(tangent, tangentPush);

            this.spawnArcDirectional(startPoint, endPoint, radialDir, tangent, synergy, traffic, outward);
            bursts++;
            this.arcsThisPulse++;
        }
    }

    /**
     * Spawn a burst of electric arcs (legacy API retained)
     */
    spawnArcBurst(ringPos, tangent, synergy, traffic) {
        // PHASE 1: Two-Phase Arc System (Snap + Afterglow)
        // Create TWO arc variants per spawn for AAA visual quality
        
        let arcCount = this.config.arcsPerBurst;
        
        // PHASE 6: Synergy Modulation (adjust arc count)
        if (synergy > 0.7) {
            arcCount += 1; // Slightly increase at high synergy
        } else if (synergy < 0.3) {
            arcCount = Math.max(3, arcCount - 1); // Slightly reduce at low synergy
        }
        
        for (let i = 0; i < arcCount; i++) {
            // === VARIANT 1: SNAP ARC ===
            // Quick, sharp electric burst
            const snapArc = this.spawnSingleArc(
                ringPos, tangent, synergy, traffic,
                {
                    arcType: 'snap',
                    lifetime: 0.16, // Longer snap flash
                    maxOpacity: 1.15, // Higher opacity
                    jitterMultiplier: 1.5, // Higher jitter for sharp look
                    pulseSpeed: 2.5, // Faster pulse
                    arcLengthScale: 1.0 // Normal length
                }
            );
            if (snapArc) this.activeArcs.push(snapArc);
            
            // === VARIANT 2: AFTERGLOW ARC ===
            // Slower, smoother, longer-lasting electric afterglow
            const afterglowLifetime = 0.65 + Math.random() * 0.1; // 0.65-0.75s
            const afterglowOpacity = 0.7 + Math.random() * 0.15; // brighter afterglow
            
            const afterglowArc = this.spawnSingleArc(
                ringPos, tangent, synergy, traffic,
                {
                    arcType: 'afterglow',
                    lifetime: afterglowLifetime,
                    maxOpacity: afterglowOpacity,
                    jitterMultiplier: 0.5, // Reduced jitter for smoother look
                    pulseSpeed: 1.5, // Slower pulse
                    arcLengthScale: 0.9 // Slightly shorter
                }
            );
            if (afterglowArc) this.activeArcs.push(afterglowArc);
        }
    }

    /**
     * Spawn a single electric arc (PHASE 2: Branching + PHASE 3: Improved Shape + PHASE 5: Hue Variation)
     * @param {THREE.Vector3} ringPos - Ring center position
     * @param {THREE.Vector3} tangent - Ring tangent direction
     * @param {number} synergy - Synergy score (0-1)
     * @param {number} traffic - Traffic load (0-1)
     * @param {Object} params - Optional params object (PHASE 1 compatibility)
     * @returns {Object|null} Arc data object or null if failed
     */
    spawnSingleArc(ringPos, tangent, synergy, traffic, params = {}) {
        // Parse parameters (PHASE 1: Two-Phase Arc System compatibility)
        const arcType = params.arcType || 'normal';
        const arcLifetime = params.lifetime !== undefined ? params.lifetime : this.config.arcLifetime;
        const maxOpacity = params.maxOpacity !== undefined ? params.maxOpacity : (1.0 + Math.random() * 0.35);
        const jitterMultiplier = params.jitterMultiplier !== undefined ? params.jitterMultiplier : 1.0;
        const pulseSpeed = params.pulseSpeed !== undefined ? params.pulseSpeed : (4.0 + Math.random() * 6.0);
        const arcLengthScale = params.arcLengthScale !== undefined ? params.arcLengthScale : 1.0;

        // Create two perpendicular vectors to tangent (approximate perpendicular basis)
        const normal = this._vec3.set(0, 1, 0);
        if (Math.abs(tangent.dot(normal)) > 0.9) {
            normal.set(1, 0, 0); // Fallback if tangent ~= Y axis
        }
        const binormal = this._vec3b.crossVectors(tangent, normal).normalize();
        normal.crossVectors(binormal, tangent).normalize();

        // Randomize which direction arc radiates
        const angle = Math.random() * Math.PI * 2;
        const radiusScale = this.config.radiusScale * (0.8 + synergy * 0.4);
        
        const arcRadius = this.config.arcLength * radiusScale * arcLengthScale * (0.85 + Math.random() * 0.3);

        // PATCH: Arcs originate from Ring Surface (NOT center)
        // 1) Compute ring surface radius:
        const ringRadius = this.ringScale * this.config.surfaceRadiusMul;
        
        // 2) Compute direction vector for arc radiation:
        const dirOffset = Math.cos(angle);
        const dirLift = Math.sin(angle);
        
        // 3) Set startPoint to ring SURFACE (not center):
        const startPoint = ringPos.clone()
            .addScaledVector(normal, dirOffset * ringRadius)
            .addScaledVector(binormal, dirLift * ringRadius);
        
        // 4) Add tiny outward bias along tangent (to avoid arc clipping through ring):
        startPoint.addScaledVector(tangent, 0.01);
        
        // 5) Set endPoint further outward from surface:
        const endPoint = startPoint.clone()
            .addScaledVector(normal, dirOffset * arcRadius * 1.1)
            .addScaledVector(binormal, dirLift * arcRadius * 1.1);

        // Create arc line geometry safely (PHASE 3: Improved Electric Shape)
        const geometry = new THREE.BufferGeometry();
        const positions = this.generateArcPath(startPoint, endPoint, 8, jitterMultiplier, normal, binormal);
        
        // positions is already a BufferAttribute, set it directly
        if (positions && positions instanceof THREE.BufferAttribute) {
            geometry.setAttribute('position', positions);
        } else {
            console.warn('LinkRingArcDischarges: generateArcPath did not return BufferAttribute');
            return null; // Skip arc if geometry creation failed
        }

        // Verify geometry safety before creating mesh
        if (!LinkBufferSafetyAudit.verifyGeometrySafety(geometry)) {
            console.error('LinkRingArcDischarges: Geometry failed safety check');
            geometry.dispose();
            return null;
        }

        // PHASE 5: Subtle Hue Variation (Safe)
        // After computing arc color: Convert to HSL, apply small hue shift, convert back to RGB
        const colorVariation = 0.7 + Math.random() * 0.3;
        let arcColor = this.ringColor.clone().multiplyScalar(colorVariation);
        
        // HSL conversion and hue shift (±5% hue shift max)
        const hsl = {};
        arcColor.getHSL(hsl);
        const hueShift = (Math.random() - 0.5) * 0.05; // Subtle: ±2.5%
        hsl.h += hueShift;
        // Wrap hue
        if (hsl.h > 1.0) hsl.h -= 1.0;
        if (hsl.h < 0.0) hsl.h += 1.0;
        arcColor.setHSL(hsl.h, hsl.s, hsl.l);
        
        // Create line material (additive blend, sharp + halo via dual fresnel in fragment)
        const material = new THREE.LineBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: maxOpacity * 2.3, // slightly higher base opacity
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            linewidth: 1.0,
            fog: false,
        });

        // Create line mesh
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const arcsOrder = VisualHierarchyRegistry.getRenderOrder('LINK_ARCS');
        line.renderOrder = arcsOrder;
        this.group.add(line);

        // PHASE 2: Branching Lightning (30-50% chance)
        if (Math.random() < 0.4) { // 30-50% chance
            // Choose one intermediate segment index
            const branchSegment = 3 + Math.floor(Math.random() * 3); // Index 3, 4, or 5 (out of 8 segments)
            
            // Get intermediate point
            const branchStart = startPoint.clone().lerp(endPoint, branchSegment / 8);
            
            // Branch direction must be perpendicular to main direction
            // Use binormal for perpendicular direction
            const branchAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Perpendicular with slight variation
            const branchLength = this.config.arcLength * radiusScale * arcLengthScale * 0.4; // 40% of main arc length
            
            const branchEnd = ringPos.clone()
                .addScaledVector(normal, Math.cos(branchAngle) * branchLength)
                .addScaledVector(binormal, Math.sin(branchAngle) * branchLength);
            
            // Create short branch arc geometry
            const branchGeometry = new THREE.BufferGeometry();
            const branchPositions = this.generateArcPath(branchStart, branchEnd, 4, jitterMultiplier, normal, binormal); // Shorter: 4 segments
            
            if (branchPositions && branchPositions instanceof THREE.BufferAttribute) {
                branchGeometry.setAttribute('position', branchPositions);
            } else {
                console.warn('LinkRingArcDischarges: branch generateArcPath did not return BufferAttribute');
                branchGeometry.dispose();
            }
            
            // Verify branch geometry safety
            if (!LinkBufferSafetyAudit.verifyGeometrySafety(branchGeometry)) {
                branchGeometry.dispose();
            } else {
                // Branch arc must reuse same material logic with lower opacity
                const branchOpacity = maxOpacity * 0.6; // Lower than main arc
                
                const branchMaterial = new THREE.LineBasicMaterial({
                    color: arcColor,
                    transparent: true,
                    opacity: branchOpacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest: false,
                    linewidth: 0.7, // Thinner than main arc
                    fog: false,
                });
                
                const branchLine = new THREE.Line(branchGeometry, branchMaterial);
                branchLine.frustumCulled = false;
                branchGeometry.computeBoundingSphere();
                branchGeometry.computeBoundingBox();
                branchLine.renderOrder = arcsOrder;
                this.group.add(branchLine);
                
                // Track branch arc lifetime
                const branchArcData = {
                    mesh: branchLine,
                    geometry: branchGeometry,
                    material: branchMaterial,
                    lifetime: arcLifetime * 0.8, // Slightly shorter than main arc
                    age: 0,
                    maxOpacity: branchOpacity,
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: pulseSpeed * 0.8 // Slower than main arc
                };
                
                this.activeArcs.push(branchArcData);
            }
        }

        // Track arc lifetime
        const arcData = {
            mesh: line,
            geometry: geometry,
            material: material,
            lifetime: arcLifetime,
            age: 0,
            maxOpacity: maxOpacity,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: pulseSpeed,
            flashBoost: 1.0 + Math.random() * 0.3 // small brightness spike at start
        };

        return arcData; // Return arc data for tracking
    }

    /**
     * Generate a slightly jagged path for arc (PHASE 3: Improved Electric Shape - Structured Wave)
     * Uses structured wave instead of pure random jitter
     * 
     * @param {THREE.Vector3} start - Start point
     * @param {THREE.Vector3} end - End point
     * @param {number} segments - Number of intermediate segments
     * @param {number} jitterMultiplier - Multiplier for jitter amount (PHASE 1 compatibility)
     * @param {THREE.Vector3} normal - Normal vector for planar jitter
     * @param {THREE.Vector3} binormal - Binormal vector for planar jitter
     * @returns {THREE.BufferAttribute} Safe GPU buffer attribute
     */
    generateArcPath(start, end, segments = 8, jitterMultiplier = 1.0, normal, binormal) {
        // PHASE 3: Improved Electric Shape (No Random Noise Spam)
        // Replace pure random jitter with structured wave:
        // Use: taper = sin(t * PI), wave = sin(t * PI * 3), jitterMagnitude = taper * wave * config.jitterAmount
        // This creates organic electric oscillation instead of noise chaos
        
        // Defensive fallback: if basis vectors are missing, derive a stable local frame
        const safeNormal = normal?.isVector3 ? normal : this._vec3.set(0, 1, 0);
        if (Math.abs(end.clone().sub(start).normalize().dot(safeNormal)) > 0.9) {
            safeNormal.set(1, 0, 0);
        }
        const safeBinormal = binormal?.isVector3
            ? binormal
            : this._vec3b.crossVectors(end.clone().sub(start).normalize(), safeNormal).normalize();
        safeNormal.crossVectors(safeBinormal, end.clone().sub(start).normalize()).normalize();

        // Pre-allocate typed array with exact size needed
        const pointCount = segments + 2; // start + intermediates + end
        const positions = new Float32Array(pointCount * 3);
        let idx = 0;

        // Add start point
        positions[idx++] = start.x;
        positions[idx++] = start.y;
        positions[idx++] = start.z;

        // Generate intermediate control points with whip-biased structured jitter
        for (let i = 1; i < segments + 1; i++) {
            const t = i / (segments + 1);
            
            // Linear interpolation base
            const point = start.clone().lerp(end, t);
            
            // PHASE 3+: Structured wave with whip bias
            const taper = Math.sin(t * Math.PI); // fades toward ends
            const wave = Math.sin(t * Math.PI * 3);
            let jitterMagnitude = taper * wave * this.config.jitterAmount * jitterMultiplier;

            // Electric whip bias: stronger snap early, slight kink mid, taper late
            const earlyWhip = t < 0.35 ? 1.4 : 1.0;
            const midKink = (t > 0.4 && t < 0.65) ? 1.15 : 1.0;
            const lateTaper = 1.0 - t * 0.35;
            jitterMagnitude *= earlyWhip * midKink * lateTaper;
            
            // Direction: biased normal/binormal with slight asymmetry per point
            const biasSign = Math.random() < 0.5 ? -1 : 1;
            const jitterDir = safeNormal.clone()
                .multiplyScalar(0.7)
                .addScaledVector(safeBinormal, 0.5 * biasSign)
                .normalize();
            
            // Extra kink in mid body to feel like a whip crack
            if (t > 0.45 && t < 0.65) {
                jitterDir.addScaledVector(safeBinormal, 0.35 * biasSign).normalize();
            }

            point.addScaledVector(jitterDir, jitterMagnitude);
            
            positions[idx++] = point.x;
            positions[idx++] = point.y;
            positions[idx++] = point.z;
        }

        // Add end point
        positions[idx++] = end.x;
        positions[idx++] = end.y;
        positions[idx++] = end.z;

        // Create safe BufferAttribute directly
        const attribute = new THREE.BufferAttribute(positions, 3);
        return attribute;
    }

    /**
     * Update active arc lifetimes and fade (PHASE 4: Smooth Energy Fade)
     */
    updateActiveArcs(dt, curve) {
        for (let i = this.activeArcs.length - 1; i >= 0; i--) {
            const arc = this.activeArcs[i];
            arc.age += dt;

            const progress = arc.age / arc.lifetime;

            if (progress >= 1.0) {
                // Arc has expired
                this.group.remove(arc.mesh);
                arc.geometry.dispose();
                arc.material.dispose();
                if (arc.hasImpact && arc.impactPoint) {
                    this._spawnImpactSparks(arc.impactPoint, arc.mesh?.material?.color || this.ringColor);
                    this._spawnRipple(arc.impactPoint, arc.mesh?.material?.color || this.ringColor);
                }
                this.activeArcs.splice(i, 1);
            } else {
                // PHASE 4: Smooth Energy Fade (sin progress * PI)
                // Replace current fade logic with: ease = sin(progress * PI)
                // arc.material.opacity = ease * arc.maxOpacity
                // Keep pulse modulation but reduce intensity to subtle level
                // Remove emissiveIntensity usage (LineBasicMaterial does not support it properly)
                
                const ease = Math.sin(progress * Math.PI);
                // Early flash boost
                const flashWindow = 0.12;
                const flash = progress < flashWindow ? THREE.MathUtils.lerp(arc.flashBoost, 1.0, progress / flashWindow) : 1.0;

                const baseOpacity = ease * arc.maxOpacity * flash;
                
                // Subtle pulse modulation (reduced intensity)
                const pulseModulation = Math.sin(arc.age * arc.pulseSpeed + arc.pulsePhase);
                const pulseEffect = 0.9 + 0.1 * pulseModulation; // Very subtle: 0.8-1.0 range
                
                arc.material.opacity = Math.max(0, baseOpacity * pulseEffect);
            }
        }

        // Update impact sparks
        for (let i = this.activeSparks.length - 1; i >= 0; i--) {
            const s = this.activeSparks[i];
            s.age += dt;
            const t = s.age / s.lifetime;
            if (t >= 1.0) {
                s.mesh.visible = false;
                this.activeSparks.splice(i, 1);
                this.sparkPool.push(s);
            } else {
                s.material.opacity = s.baseOpacity * (1.0 - t);
            }
        }

        // Update ripples
        for (let i = this.activeRipples.length - 1; i >= 0; i--) {
            const r = this.activeRipples[i];
            r.age += dt;
            const t = r.age / r.lifetime;
            if (t >= 1.0) {
                r.mesh.visible = false;
                this.activeRipples.splice(i, 1);
                this.ripplePool.push(r);
            } else {
                const scale = THREE.MathUtils.lerp(r.initialScale, r.finalScale, t);
                r.mesh.scale.setScalar(scale);
                r.material.opacity = r.baseOpacity * (1.0 - t);
            }
        }

        // Update energy packets
        if (curve) {
            for (let i = this.activePackets.length - 1; i >= 0; i--) {
                const p = this.activePackets[i];
                p.age += dt;
                const t = p.age / p.lifetime;
                if (t >= 1.0) {
                    p.mesh.visible = false;
                    this.activePackets.splice(i, 1);
                    this.packetPool.push(p);
                } else {
                    const pos = curve.getPointAt(p.t);
                    p.mesh.position.copy(pos);
                    p.t += p.speed * dt;
                    p.material.opacity = p.baseOpacity * (1.0 - t);
                }
            }
        }
    }

    /**
     * Set configuration parameters
     */
    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Dispose all arcs and cleanup
     */
    dispose() {
        this.activeArcs.forEach(arc => {
            this.group.remove(arc.mesh);
            arc.geometry.dispose();
            arc.material.dispose();
        });
        this.activeArcs = [];
        
        this.activeSparks.forEach((s) => {
            this.group.remove(s.mesh);
            s.geometry.dispose();
            s.material.dispose();
        });
        this.activeSparks = [];
        this.sparkPool = [];

        this.activeRipples.forEach((r) => {
            this.group.remove(r.mesh);
            r.geometry.dispose();
            r.material.dispose();
        });
        this.activeRipples = [];
        this.ripplePool = [];

        this.activePackets.forEach((p) => {
            this.group.remove(p.mesh);
            p.geometry.dispose();
            p.material.dispose();
        });
        this.activePackets = [];
        this.packetPool = [];
        
        this.scene.remove(this.group);
    }

    _initImpactSparkPool(count) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(15); // 5 sparks
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7,
                size: 0.05,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Points(geo, mat);
            mesh.visible = false;
            mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 1.2;
            this.group.add(mesh);
            this.sparkPool.push({
                mesh,
                geometry: geo,
                material: mat,
                positions,
                lifetime: 0.12,
                age: 0,
                baseOpacity: 0.7
            });
        }
    }

    _spawnImpactSparks(point, color) {
        if (this.sparkPool.length === 0) return;
        const burst = this.sparkPool.pop();
        burst.age = 0;
        const count = 3 + Math.floor(Math.random() * 3); // 3-5
        const positions = burst.positions;
        const radius = 0.05;
        let idx = 0;
        for (let i = 0; i < count; i++) {
            const dir = new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            ).normalize().multiplyScalar(radius * (0.4 + Math.random() * 0.6));
            positions[idx++] = point.x + dir.x;
            positions[idx++] = point.y + dir.y;
            positions[idx++] = point.z + dir.z;
        }
        // fill remaining positions if any
        for (; idx < positions.length; idx++) positions[idx] = point.x;

        burst.geometry.attributes.position.needsUpdate = true;
        burst.material.color.copy(color);
        burst.material.opacity = burst.baseOpacity;
        burst.mesh.visible = true;
        this.activeSparks.push(burst);
    }

    _initRipplePool(count) {
        const rippleGeo = new THREE.RingGeometry(0.8, 1.0, 24);
        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(rippleGeo.clone(), mat);
            mesh.frustumCulled = false;
            mesh.visible = false;
            mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 1.3;
            this.group.add(mesh);
            this.ripplePool.push({
                mesh,
                geometry: mesh.geometry,
                material: mat,
                lifetime: 0.15,
                age: 0,
                initialScale: 0.02,
                finalScale: 0.25,
                baseOpacity: 0.35
            });
        }
    }

    _spawnRipple(point, color) {
        if (this.ripplePool.length === 0) return;
        const r = this.ripplePool.pop();
        r.age = 0;
        r.material.color.copy(color);
        r.material.opacity = r.baseOpacity;
        r.mesh.visible = true;
        r.mesh.position.copy(point);
        r.mesh.scale.setScalar(r.initialScale);
        this.activeRipples.push(r);
    }

    _initPacketPool(count) {
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.015, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                depthWrite: false,
                depthTest: true,
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.visible = false;
            mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE') + 0.9;
            this.group.add(mesh);
            this.packetPool.push({
                mesh,
                geometry: geo,
                material: mat,
                t: 0,
                speed: 0.8,
                lifetime: 0.25,
                age: 0,
                baseOpacity: 0.8
            });
        }
    }

    _spawnPacket(curve, startPos, color) {
        if (this.packetPool.length === 0) return;
        const p = this.packetPool.pop();
        p.age = 0;
        p.lifetime = 0.18 + Math.random() * 0.08;
        p.t = Math.random() * 0.1; // start near origin
        p.speed = 2.0 + Math.random() * 1.5;
        p.material.color.copy(color);
        p.material.opacity = p.baseOpacity;
        const pos = curve.getPointAt(p.t);
        p.mesh.position.copy(pos);
        p.mesh.visible = true;
        this.activePackets.push(p);
    }

    _selectPacketColor(synergy, harmony, corruption) {
        if (corruption > synergy && corruption > harmony) return new THREE.Color(0xff2244);
        if (harmony > synergy) return new THREE.Color(0x99ff99);
        return new THREE.Color(0x66ddff);
    }
}
