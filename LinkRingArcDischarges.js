import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
import { LinkBufferSafetyAudit } from './LinkBufferSafetyAudit.js';

/**
 * LinkRingArcDischarges
 * ============================================================================
 * Micro electric arc discharges that spawn near the traveling pulse ring.
 * 
 * BEHAVIOR:
 * - Monitors pulse ring progress (0-1 traversal)
 * - When ring crosses spawn thresholds, emits burst of 3-8 electric arcs
 * - Each arc is thin, jagged, perpendicular to link tangent
 * - Short lifetime: 60-120ms per arc
 * - Additive blending, same color family as ring
 * - No persistent emission, purely ring-triggered
 * 
 * VISUAL:
 * - Thin line geometry (not particles)
 * - Slightly curved/jagged for electric look
 * - Fades in/out quickly (cosine ease)
 * - Radiates outward from ring position
 */
export class LinkRingArcDischarges {
    constructor(scene) {
        this.scene = scene;
        this.activeArcs = []; // Array of active arc objects
        this.group = new THREE.Group();
        const ud = (this.group && typeof this.group.userData === 'object' && this.group.userData) ? this.group.userData : (() => { try { Object.defineProperty(this.group, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return this.group.userData || {}; })();
        Object.assign(ud, { isArcDischarges: true });
        
        scene.add(this.group);
        
        // Configuration
        this.config = {
            spawnInterval: 0.25,      // Spawn arcs every 0.25 of traversal (4 bursts per cycle)
            arcsPerBurst: 5,          // 3-8, we'll randomize
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
     * Get the group containing all arc visuals
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

        // Update active arcs
        this.updateActiveArcs(dt);
    }

    /**
     * Check if ring has crossed a spawn threshold
     */
    checkAndSpawnArcs(curve, synergy, traffic) {
        // Calculate which "bucket" the ring is in
        const bucketSize = this.config.spawnInterval;
        const currentBucket = Math.floor(this.currentRingProgress / bucketSize);
        const lastBucket = Math.floor(this.lastSpawnProgress / bucketSize);

        // Spawn only once per bucket crossing
        if (currentBucket !== lastBucket) {
            // Get ring position and tangent
            const t = Math.min(0.999, Math.max(0.001, this.currentRingProgress));
            const ringPos = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t).normalize();

            // Spawn arc burst
            this.spawnArcBurst(ringPos, tangent, synergy, traffic);
        }

        this.lastSpawnProgress = this.currentRingProgress;
    }

    /**
     * Spawn a burst of 3-8 electric arcs
     */
    spawnArcBurst(ringPos, tangent, synergy, traffic) {
        // Randomize count between 3 and 8
        const arcCount = 3 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < arcCount; i++) {
            this.spawnSingleArc(ringPos, tangent, synergy, traffic);
        }
    }

    /**
     * Calculate base opacity from progress (fade in/out)
     * Fantasy: Helper function for pulse effect
     */
    calculateBaseOpacity(progress, maxOpacity) {
        if (progress < 0.3) {
            return (progress / 0.3) * maxOpacity; // Fast fade in
        } else if (progress > 0.7) {
            return (1.0 - progress) / 0.3 * maxOpacity; // Fast fade out
        } else {
            return maxOpacity; // Full opacity in middle
        }
    }

    /**
     * Spawn a single electric arc
     */
    spawnSingleArc(ringPos, tangent, synergy, traffic) {
        // Create two perpendicular vectors to the tangent
        // (approximate perpendicular basis)
        const normal = this._vec3.set(0, 1, 0);
        if (Math.abs(tangent.dot(normal)) > 0.9) {
            normal.set(1, 0, 0); // Fallback if tangent ~= Y axis
        }
        const binormal = this._vec3b.crossVectors(tangent, normal).normalize();
        normal.crossVectors(binormal, tangent).normalize();

        // Randomize which direction the arc radiates
        const angle = Math.random() * Math.PI * 2;
        const radiusScale = this.config.radiusScale * (0.8 + synergy * 0.4);
        
        const arcRadius = this.config.arcLength * radiusScale;
        const offset = Math.cos(angle) * arcRadius;
        const liftOff = Math.sin(angle) * arcRadius;

        // Start point: slightly offset from ring center
        const startPoint = ringPos.clone()
            .addScaledVector(normal, offset * 0.3)
            .addScaledVector(binormal, liftOff * 0.3);

        // End point: further out with jitter
        const endPoint = ringPos.clone()
            .addScaledVector(normal, offset)
            .addScaledVector(binormal, liftOff);

        // Add jitter to create jagged electric look
        const jitterDir = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();

        const jitterMag = this.config.jitterAmount * (0.5 + Math.random() * 1.0);
        endPoint.addScaledVector(jitterDir, jitterMag);

        // Create arc line geometry safely
        const geometry = new THREE.BufferGeometry();
        const positions = this.generateArcPath(startPoint, endPoint, 8);
        
        // positions is already a BufferAttribute, set it directly
        if (positions && positions instanceof THREE.BufferAttribute) {
            geometry.setAttribute('position', positions);
        } else {
            console.warn('LinkRingArcDischarges: generateArcPath did not return BufferAttribute');
            return; // Skip arc if geometry creation failed
        }

        // Verify geometry safety before creating mesh
        if (!LinkBufferSafetyAudit.verifyGeometrySafety(geometry)) {
            console.error('LinkRingArcDischarges: Geometry failed safety check');
            geometry.dispose();
            return;
        }

        // Create line material (additive blend, sharp) with glow
        // Fantasy: Emissive glow + color variation
        const colorVariation = 0.7 + Math.random() * 0.3; // Vary color by 30%
        const arcColor = this.ringColor.clone().multiplyScalar(colorVariation);
        
        const material = new THREE.LineBasicMaterial({
            color: arcColor,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            linewidth: 1.0,
            fog: false,
            // Fantasy: Emissive glow for bright arcs
            emissive: arcColor,
            emissiveIntensity: 1.5, // Bright glow effect
        });

        // Create line mesh with random thickness variation
        const thicknessVariation = this.config.arcThickness * (0.8 + Math.random() * 0.4); // Fantasy: Variable thickness
        
        const line = new THREE.Line(geometry, material);
        line.frustumCulled = false;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
        const arcsOrder = VisualHierarchyRegistry.getRenderOrder('LINK_ARCS');
        line.renderOrder = arcsOrder;
        line.material.linewidth = thicknessVariation; // Fantasy: Set random thickness
        this.group.add(line);

        // Track arc lifetime with fantasy parameters
        const arcData = {
            mesh: line,
            geometry: geometry,
            material: material,
            lifetime: this.config.arcLifetime + (Math.random() - 0.5) * 0.02,
            age: 0,
            maxOpacity: 0.8 + Math.random() * 0.4, // Fantasy: Variable max opacity (0.8-1.2)
            pulsePhase: Math.random() * Math.PI * 2, // Fantasy: Pulse phase for twinkling
            pulseSpeed: 5.0 + Math.random() * 3.0, // Fantasy: Pulse speed for twinkling
        };

        this.activeArcs.push(arcData);
    }

    /**
     * Generate a slightly jagged path for the arc
     * Uses Catmull-Rom like interpolation with random control points
     * 
     * @returns {THREE.BufferAttribute} Safe GPU buffer attribute
     */
    generateArcPath(start, end, segments = 8) {
        // Pre-allocate typed array with exact size needed
        const pointCount = segments + 2; // start + intermediates + end
        const positions = new Float32Array(pointCount * 3);
        let idx = 0;

        // Add start point
        positions[idx++] = start.x;
        positions[idx++] = start.y;
        positions[idx++] = start.z;

        // Generate intermediate control points with jitter
        for (let i = 1; i < segments + 1; i++) {
            const t = i / (segments + 1);
            
            // Linear interpolation base
            const point = start.clone().lerp(end, t);
            
            // Add perpendicular jitter (electric zag)
            const jitterDir = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            // Jitter amount decreases near endpoints for natural taper
            const jitterMag = this.config.jitterAmount * 0.5 * Math.sin(t * Math.PI) * (0.4 + Math.random() * 0.6);
            point.addScaledVector(jitterDir, jitterMag);
            
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
     * Update active arc lifetimes and fade
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
                // Fantasy: Pulse opacity effect for twinkling arcs
                // Original: Fade in quickly, fade out quickly (cosine easing)
                // Enhanced: Add pulsing sparkle effect
                
                const baseOpacity = this.calculateBaseOpacity(progress, arc.maxOpacity);
                const pulseModulation = Math.sin(arc.age * arc.pulseSpeed + arc.pulsePhase);
                const pulseEffect = 0.8 + 0.2 * pulseModulation; // Pulse between 0.6 and 1.0
                
                arc.material.opacity = Math.max(0, baseOpacity * pulseEffect);
                arc.material.emissiveIntensity = 1.5 * pulseEffect; // Sync glow with pulse
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
