import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkBufferSafetyAudit } from './LinkBufferSafetyAudit.js';

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
            spawnInterval: 0.28 + Math.random() * 0.04,      // Spawn arcs every 0.25 of traversal (4 bursts per cycle)
            arcsPerBurst: 5,          // Base arc count
            arcLifetime: 0.3,         // Enhanced: 300ms per arc (doubled from 150ms)
            arcLength: 0.25,          // Enhanced: Radial extent (increased to 0.25)
            arcThickness: 0.02,       // Enhanced: Line width (increased from 0.015)
            jitterAmount: 0.05,       // Random variation in path
            radiusScale: 1.0,         // Scales with synergy
        };
        
        // State tracking
        this.lastSpawnProgress = -1;
        this.currentRingProgress = 0;
        this.ringColor = new THREE.Color(0xffffff);
        this.ringScale = 1.0;
        
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
    update(curve, ringProgress, synergy, traffic, dt, ringColor, ringScale) {
        if (!curve) return;

        this.currentRingProgress = ringProgress;
        this.ringColor.copy(ringColor);
        this.ringScale = ringScale;

        // Check for spawn threshold crossing
        this.checkAndSpawnArcs(curve, synergy, traffic);

        // Update active arcs (PHASE 4: Smooth Energy Fade)
        this.updateActiveArcs(dt);
    }

    /**
     * Check if ring has crossed a spawn threshold
     */
    checkAndSpawnArcs(curve, synergy, traffic) {
        // Calculate which "bucket" ring is in
        const bucketSize = this.config.spawnInterval;
        const currentBucket = Math.floor(this.currentRingProgress / bucketSize);
        const lastBucket = Math.floor(this.lastSpawnProgress / bucketSize);

        // Spawn only once per bucket crossing
        if (currentBucket !== lastBucket) {
            // Get ring position and tangent
            const t = Math.min(0.999, Math.max(0.001, this.currentRingProgress));
            const ringPos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t).normalize();

            // Spawn arc burst (PHASE 1: Two-Phase Arc System)
            const isPeakPulse = this.ringScale > 0.9;

            if (isPeakPulse) {
                this.spawnArcBurst(ringPos, tangent, synergy * 1.5, traffic);
            } else {
                this.spawnArcBurst(ringPos, tangent, synergy * 0.5, traffic);
            }
        }

        this.lastSpawnProgress = this.currentRingProgress;
    }

    /**
     * Spawn a burst of electric arcs (PHASE 1: Two-Phase Arc System)
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
                    lifetime: 0.12, // Faster: 120ms
                    maxOpacity: 1.0, // Higher opacity
                    jitterMultiplier: 1.5, // Higher jitter for sharp look
                    pulseSpeed: 2.5, // Faster pulse
                    arcLengthScale: 1.0 // Normal length
                }
            );
            if (snapArc) this.activeArcs.push(snapArc);
            
            // === VARIANT 2: AFTERGLOW ARC ===
            // Slower, smoother, longer-lasting electric afterglow
            const afterglowLifetime = 0.35 + Math.random() * 0.15; // 0.35-0.5s
            const afterglowOpacity = 0.5 + Math.random() * 0.2; // 0.5-0.7
            
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
        const maxOpacity = params.maxOpacity !== undefined ? params.maxOpacity : (0.8 + Math.random() * 0.4);
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
        const ringRadius = 0.5 * this.ringScale;
        
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
            .addScaledVector(normal, dirOffset * arcRadius)
            .addScaledVector(binormal, dirLift * arcRadius);

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
        
        // Create line material (additive blend, sharp)
        const material = new THREE.LineBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: maxOpacity * 2.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
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
            pulseSpeed: pulseSpeed
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

        // Generate intermediate control points with structured wave jitter
        for (let i = 1; i < segments + 1; i++) {
            const t = i / (segments + 1);
            
            // Linear interpolation base
            const point = start.clone().lerp(end, t);
            
            // PHASE 3: Structured wave (not random noise spam)
            // taper = sin(t * PI) - tapers to 0 at endpoints
            const taper = Math.sin(t * Math.PI);
            // wave = sin(t * PI * 3) - oscillates 3 times along the arc
            const wave = Math.sin(t * Math.PI * 3);
            // jitterMagnitude = taper * wave * config.jitterAmount * jitterMultiplier
            const jitterMagnitude = taper * wave * this.config.jitterAmount * jitterMultiplier;
            
            // Add structured jitter (electric oscillation, not chaos)
            const jitterDir = safeNormal.clone().add(safeBinormal).normalize();
            
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
    updateActiveArcs(dt) {
        for (let i = this.activeArcs.length - 1; i >= 0; i--) {
            const arc = this.activeArcs[i];
            arc.age += dt;

            const progress = arc.age / arc.lifetime;

            if (progress >= 1.0) {
                // Arc has expired
                this.group.remove(arc.mesh);
                arc.geometry.dispose();
                arc.material.dispose();
                this.activeArcs.splice(i, 1);
            } else {
                // PHASE 4: Smooth Energy Fade (sin progress * PI)
                // Replace current fade logic with: ease = sin(progress * PI)
                // arc.material.opacity = ease * arc.maxOpacity
                // Keep pulse modulation but reduce intensity to subtle level
                // Remove emissiveIntensity usage (LineBasicMaterial does not support it properly)
                
                const ease = Math.sin(progress * Math.PI);
                const baseOpacity = ease * arc.maxOpacity;
                
                // Subtle pulse modulation (reduced intensity)
                const pulseModulation = Math.sin(arc.age * arc.pulseSpeed + arc.pulsePhase);
                const pulseEffect = 0.9 + 0.1 * pulseModulation; // Very subtle: 0.8-1.0 range
                
                arc.material.opacity = Math.max(0, baseOpacity * pulseEffect);
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
        
        this.scene.remove(this.group);
    }
}
