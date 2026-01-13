import * as THREE from 'three';

// Shared geometry to minimize allocations
// Radius 1.0, Tube 0.08 (8% thickness)
// RadialSegments 6 (Low poly), TubularSegments 24 (Smooth enough ring)
const SHARED_RING_GEOMETRY = new THREE.TorusGeometry(1.0, 0.08, 6, 24);

/**
 * LinkPulseRing
 * ============================================================================
 * A purely visual effect: A glowing ring that travels along the link curve.
 * reinforces flow direction and synergy strength.
 */
export class LinkPulseRing {
    constructor(scene) {
        this.scene = scene;
        
        // Independent material for unique opacity/color state
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(SHARED_RING_GEOMETRY, this.material);
        this.mesh.userData = { isPulseRing: true };
        this.mesh.renderOrder = 11; // Render on top of strands (10)

        // State
        this.progress = Math.random(); // Random start pos
        this.active = true;
    }

    /**
     * Get the mesh to add to the link group
     */
    getMesh() {
        return this.mesh;
    }

    /**
     * Update ring position and appearance
     * @param {THREE.Curve} curve - The link's path
     * @param {number} synergy - Synergy score (0-1)
     * @param {number} traffic - Traffic load (0-1)
     * @param {number} dt - Delta time
     * @param {THREE.Color} baseColor - Current link color
     */
    update(curve, synergy, traffic, dt, sourceColor, targetColor) {
        if (!curve || !this.active) {
            this.mesh.visible = false;
            return;
        }
        this.mesh.visible = true;

        // 1. Motion Logic
        // Speed scales with traffic and synergy
        // Baseline: 0.4, Max: ~1.2
        const speed = 0.4 + (traffic * 0.5) + (synergy * 0.3);
        this.progress += speed * dt;
        
        if (this.progress >= 1.0) {
            this.progress = 0.0; // Loop
        }

        // 2. Position & Orientation
        // Get position on curve
        // Clamp to 0-0.999 to avoid tangent issues at very end
        const t = Math.min(0.999, Math.max(0.001, this.progress));
        
        const point = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        this.mesh.position.copy(point);
        // Align ring normal (Z-axis of Torus) to curve tangent
        this.mesh.lookAt(point.clone().add(tangent));

        // 3. Visual Scaling & Oscillation
        // Base size scales with synergy
        // Add oscillation (breathing) based on progress and time
        const baseScale = 0.08 + (synergy * 0.06);
        // Oscillate width slightly along the path (wavy motion match)
        const oscillation = Math.sin(this.progress * Math.PI * 4) * 0.15 + 1.0; 
        
        this.mesh.scale.setScalar(baseScale * oscillation);

        // 4. Opacity & Color Blending
        // Fade in/out at ends of the link
        let alpha = 1.0;
        const fadeZone = 0.15; // 15% of length
        
        if (this.progress < fadeZone) {
            alpha = this.progress / fadeZone;
        } else if (this.progress > (1.0 - fadeZone)) {
            alpha = (1.0 - this.progress) / fadeZone;
        }
        
        // Intensity scales with synergy
        const maxOpacity = 0.4 + (synergy * 0.4);
        this.material.opacity = alpha * maxOpacity;
        
        // Color Blending (Source -> Target)
        if (sourceColor && targetColor) {
            this.material.color.copy(sourceColor).lerp(targetColor, this.progress);
        } else if (sourceColor) {
            this.material.color.copy(sourceColor);
        }
    }

    dispose() {
        if (this.material) this.material.dispose();
        // Do NOT dispose SHARED_RING_GEOMETRY
    }
}