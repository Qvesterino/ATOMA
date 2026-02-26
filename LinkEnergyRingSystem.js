import * as THREE from 'three';

/**
 * Energy Ring Expansion System
 * 
 * PURPOSE:
 * - Visual feedback for large bead arrivals
 * - Expanding energy waves from target node
 * - Represents synergy/stability resonance
 * 
 * DESIGN:
 * - Torus geometry expanding outward
 * - Soft fade-out
 * - Non-interactive (visual-only)
 */

export class LinkEnergyRingSystem {
    constructor(scene) {
        this.scene = scene;
        this.rings = [];
        this.baseGeometry = new THREE.TorusGeometry(1, 0.1, 8, 32);
        this.baseGeometry.computeBoundingSphere();
        this.baseGeometry.computeBoundingBox();
    }

    /**
     * Create and emit an energy ring at a position
     * @param {THREE.Vector3} position - World position of ring center
     * @param {THREE.Color} color - Ring color
     * @param {number} time - Current time
     */
    emitRing(position, color, time) {
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(this.baseGeometry, material);
        mesh.frustumCulled = false;
        mesh.position.copy(position);
        
        // Random orientation for visual variety
        mesh.rotation.x = Math.random() * Math.PI * 2;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.rotation.z = Math.random() * Math.PI * 2;

        // Metadata
        const ud = (mesh && typeof mesh.userData === 'object' && mesh.userData) ? mesh.userData : (() => { try { Object.defineProperty(mesh, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return mesh.userData || {}; })();
        Object.assign(ud, {
            birthTime: time,
            lastTime: time,
            age: 0,
            duration: 0.8,
            baseScale: 0.1,
            maxScale: 4.0,
            color: color
        });

        this.rings.push(mesh);
        this.scene.add(mesh);
    }

    /**
     * Update all active rings
     * @param {number} time - Current time
     */
    update(time) {
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const mesh = this.rings[i];
            const data = mesh.userData;

            const delta = Math.min(time - (data.lastTime ?? time), 0.1);
            data.lastTime = time;
            data.age = (data.age ?? 0) + Math.max(delta, 0);

            const progress = data.age / data.duration;

            if (progress >= 1.0) {
                // Remove
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
                this.rings.splice(i, 1);
            } else {
                // Animate
                // Scale: Cubic ease-out for snappy expansion
                const easeProgress = 1.0 - Math.pow(1.0 - progress, 3);
                const currentScale = data.baseScale + (data.maxScale - data.baseScale) * easeProgress;
                mesh.scale.setScalar(currentScale);

                // Opacity: Fade out quickly at the end
                const fadeStart = 0.5;
                let opacity = 0.6;
                if (progress > fadeStart) {
                    const fadeProgress = (progress - fadeStart) / (1.0 - fadeStart);
                    opacity = 0.6 * (1.0 - fadeProgress);
                }
                mesh.material.opacity = opacity;

                // Rotation (subtle spin)
                mesh.rotation.x += 0.05;
                mesh.rotation.y += 0.03;
            }
        }
    }

    dispose() {
        for (const ring of this.rings) {
            this.scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        }
        this.rings = [];
        if (this.baseGeometry) this.baseGeometry.dispose();
    }
}
