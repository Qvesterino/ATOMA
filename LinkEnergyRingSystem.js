import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

/**
 * Energy Ring Expansion System
 * 
 * PURPOSE:
 * - Visual feedback for large bead arrivals
 * - Expanding Borromean burst waves from target node
 * - Represents synergy/stability resonance
 * 
 * DESIGN:
 * - Interlocked loop geometry expanding outward
 * - Soft fade-out
 * - Non-interactive (visual-only)
 */

export class LinkEnergyRingSystem {
    constructor(scene) {
        this.scene = scene;
        this.rings = [];
        this.baseGeometry = new THREE.TorusGeometry(1, 0.072, 8, 40);
        this.outerHaloGeometry = new THREE.TorusGeometry(1.1, 0.02, 8, 56, Math.PI * 1.82);
        this.coreGeometry = new THREE.TorusKnotGeometry(0.18, 0.045, 36, 6, 2, 3);
        this.crownSpikeGeometry = new THREE.CylinderGeometry(0.01, 0.045, 0.26, 6, 1, true);
        this.sealGeometry = new THREE.OctahedronGeometry(0.14, 0);
    }

    _createMythicPalette(color) {
        const source = new THREE.Color(color);
        return {
            source,
            gold: new THREE.Color(0xe7c46a).lerp(source, 0.18),
            ember: new THREE.Color(0xffa24a).lerp(source, 0.24),
            violet: new THREE.Color(0x8c6dff).lerp(source, 0.2),
            ivory: new THREE.Color(0xf3ead2).lerp(source, 0.1),
            obsidian: new THREE.Color(0x100912)
        };
    }

    _createBurstMaterial(color, opacity = 0.62) {
        return new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }

    /**
     * Create and emit an energy ring at a position
     * @param {THREE.Vector3} position - World position of ring center
     * @param {THREE.Color} color - Ring color
     * @param {number} time - Current time
     */
    emitRing(position, color, time) {
        const palette = this._createMythicPalette(color);
        const burst = new THREE.Group();
        burst.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE');
        burst.frustumCulled = false;
        burst.position.copy(position);

        const ringMaterials = {
            loopA: this._createBurstMaterial(palette.gold, 0.7),
            loopB: this._createBurstMaterial(palette.violet, 0.62),
            loopC: this._createBurstMaterial(palette.ember, 0.66),
            halo: this._createBurstMaterial(palette.ivory, 0.28),
            core: this._createBurstMaterial(palette.source, 0.74),
            spike: this._createBurstMaterial(palette.gold, 0.84)
        };

        const ringConfigs = [
            {
                name: 'MythicLoopA',
                geometry: this.baseGeometry,
                material: ringMaterials.loopA,
                rotation: new THREE.Euler(0.6, 0.18, 0.58),
                scale: new THREE.Vector3(1.0, 0.72, 0.98),
                position: new THREE.Vector3(0.02, 0.0, 0.0),
                opacity: 0.72,
                spin: new THREE.Vector3(0.03, 0.02, 0.03),
                phaseShift: 0.0
            },
            {
                name: 'MythicLoopB',
                geometry: this.baseGeometry,
                material: ringMaterials.loopB,
                rotation: new THREE.Euler(-0.14, 1.56, 0.92),
                scale: new THREE.Vector3(0.96, 0.68, 1.02),
                position: new THREE.Vector3(-0.03, 0.015, 0.02),
                opacity: 0.64,
                spin: new THREE.Vector3(0.025, 0.03, 0.02),
                phaseShift: 1.7
            },
            {
                name: 'MythicLoopC',
                geometry: this.baseGeometry,
                material: ringMaterials.loopC,
                rotation: new THREE.Euler(1.58, 0.22, -0.28),
                scale: new THREE.Vector3(0.94, 0.72, 1.0),
                position: new THREE.Vector3(0.0, -0.02, -0.01),
                opacity: 0.68,
                spin: new THREE.Vector3(0.02, 0.025, 0.03),
                phaseShift: 3.2
            }
        ];

        for (const cfg of ringConfigs) {
            const loop = new THREE.Mesh(cfg.geometry, cfg.material);
            loop.name = cfg.name;
            loop.frustumCulled = false;
            loop.position.copy(cfg.position);
            loop.rotation.copy(cfg.rotation);
            loop.scale.copy(cfg.scale);
            loop.userData = {
                role: 'loop',
                baseOpacity: cfg.opacity,
                spin: cfg.spin.clone(),
                phase: Math.random() * Math.PI * 2,
                phaseShift: cfg.phaseShift
            };
            burst.add(loop);
        }

        const halo = new THREE.Mesh(this.outerHaloGeometry, ringMaterials.halo);
        halo.name = 'MythicOuterHalo';
        halo.frustumCulled = false;
        halo.position.set(0.0, 0.0, 0.0);
        halo.rotation.set(0.75, 0.14, 0.58);
        halo.scale.set(1.08, 0.82, 1.16);
        halo.userData = {
            role: 'halo',
            baseOpacity: 0.32,
            spin: new THREE.Vector3(0.015, 0.018, 0.02),
            phase: Math.random() * Math.PI * 2,
            phaseShift: 0.9
        };
        burst.add(halo);

        const core = new THREE.Mesh(this.coreGeometry, ringMaterials.core);
        core.name = 'MythicBurstCore';
        core.frustumCulled = false;
        core.scale.set(0.66, 0.6, 0.72);
        core.rotation.set(0.38, 0.24, 0.12);
        core.userData = {
            role: 'core',
            baseOpacity: 0.78,
            spin: new THREE.Vector3(0.05, 0.04, 0.03),
            phase: Math.random() * Math.PI * 2
        };
        burst.add(core);

        const seal = new THREE.Mesh(this.sealGeometry, ringMaterials.spike);
        seal.name = 'MythicSeal';
        seal.frustumCulled = false;
        seal.scale.set(0.62, 0.5, 0.72);
        seal.rotation.set(0.22, 0.52, -0.18);
        seal.userData = {
            role: 'seal',
            baseOpacity: 0.8,
            spin: new THREE.Vector3(0.04, 0.03, 0.05),
            phase: Math.random() * Math.PI * 2,
            phaseShift: 2.1
        };
        burst.add(seal);

        const crownAngles = [0, Math.PI * 0.33, Math.PI * 0.66, Math.PI, Math.PI * 1.33, Math.PI * 1.66];
        for (let i = 0; i < crownAngles.length; i++) {
            const angle = crownAngles[i];
            const spike = new THREE.Mesh(this.crownSpikeGeometry, ringMaterials.spike);
            spike.name = `MythicCrownSpine${i}`;
            spike.frustumCulled = false;
            spike.position.set(Math.cos(angle) * 0.84, 0.03 + (i % 2) * 0.02, Math.sin(angle) * 0.84);
            spike.rotation.set(0.62 + i * 0.05, angle * 0.18, 0.32 + (i % 3) * 0.08);
            spike.scale.set(1.0, 0.82 + (i % 2) * 0.08, 1.0);
            spike.userData = {
                role: 'spike',
                baseOpacity: 0.86,
                spin: new THREE.Vector3(0.01, 0.02, 0.03),
                phase: Math.random() * Math.PI * 2,
                phaseShift: angle
            };
            burst.add(spike);
        }

        // Metadata
        const ud = (burst && typeof burst.userData === 'object' && burst.userData) ? burst.userData : (() => { try { Object.defineProperty(burst, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return burst.userData || {}; })();
        Object.assign(ud, {
            birthTime: time,
            lastTime: time,
            age: 0,
            duration: 1.05,
            baseScale: 0.07,
            maxScale: 4.8,
            color: color
        });

        this.rings.push(burst);
        this.scene.add(burst);
    }

    /**
     * Update all active rings
     * @param {number} time - Current time
     */
    update(time) {
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const burst = this.rings[i];
            const data = burst.userData;

            const delta = Math.min(time - (data.lastTime ?? time), 0.1);
            data.lastTime = time;
            data.age = (data.age ?? 0) + Math.max(delta, 0);

            const progress = data.age / data.duration;

            if (progress >= 1.0) {
                // Remove
                this.scene.remove(burst);
                const disposedMaterials = new Set();
                burst.traverse((obj) => {
                    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                    for (const material of materials) {
                        if (!material || disposedMaterials.has(material)) continue;
                        disposedMaterials.add(material);
                        material.dispose();
                    }
                });
                this.rings.splice(i, 1);
            } else {
                // Animate
                // Scale: Cubic ease-out for snappy expansion
                const easeProgress = 1.0 - Math.pow(1.0 - progress, 3);
                const currentScale = data.baseScale + (data.maxScale - data.baseScale) * easeProgress;
                burst.scale.setScalar(currentScale);

                // Opacity: Fade out quickly at the end
                const fadeStart = 0.52;
                let opacity = 0.68;
                if (progress > fadeStart) {
                    const fadeProgress = (progress - fadeStart) / (1.0 - fadeStart);
                    opacity = 0.68 * (1.0 - fadeProgress);
                }
                for (const child of burst.children) {
                    if (!child?.material) continue;
                    const phase = child.userData?.phase ?? 0;
                    const role = child.userData?.role || 'loop';
                    const roleBias = role === 'core' ? 1.16 : role === 'seal' ? 1.08 : role === 'halo' ? 0.68 : role === 'spike' ? 1.06 : 1.0;
                    const phaseShift = child.userData?.phaseShift ?? 0;
                    const pulse = 0.84 + 0.16 * Math.sin(progress * Math.PI * 4 + phase + phaseShift);
                    child.material.opacity = opacity * roleBias * pulse;
                }

                // Rotation (subtle spin)
                burst.rotation.x += 0.02;
                burst.rotation.y += 0.035;
                burst.rotation.z += 0.014;

                for (const child of burst.children) {
                    const spin = child.userData?.spin;
                    if (!spin) continue;
                    child.rotation.x += spin.x * 0.8;
                    child.rotation.y += spin.y * 0.8;
                    child.rotation.z += spin.z * 0.8;
                }
            }
        }
    }

    dispose() {
        for (const burst of this.rings) {
            this.scene.remove(burst);
            const disposedMaterials = new Set();
            burst.traverse((obj) => {
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (const material of materials) {
                    if (!material || disposedMaterials.has(material)) continue;
                    disposedMaterials.add(material);
                    material.dispose();
                }
            });
        }
        this.rings = [];
        if (this.baseGeometry) this.baseGeometry.dispose();
        if (this.outerHaloGeometry) this.outerHaloGeometry.dispose();
        if (this.coreGeometry) this.coreGeometry.dispose();
        if (this.crownSpikeGeometry) this.crownSpikeGeometry.dispose();
        if (this.sealGeometry) this.sealGeometry.dispose();
    }
}
