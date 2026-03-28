import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

const hashString32 = (value = '') => {
    const text = String(value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

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

    _pickBurstVariantIndex(family, context = {}, variantCount = 3) {
        const metrics = context.metrics || {};
        const category = String(context.category || 'default').toLowerCase();
        const nodeId = context.nodeId ?? context.node?.id ?? context.node?.uuid ?? '';
        const time = Number.isFinite(context.time) ? context.time : 0;
        const seed = hashString32([
            family,
            category,
            nodeId,
            Math.floor(time * 1000),
            Math.floor(clamp01(metrics.synergy ?? 0) * 1000),
            Math.floor(clamp01(metrics.harmony ?? 0) * 1000),
            Math.floor(clamp01(metrics.corruption ?? 0) * 1000),
            Math.floor(clamp01(metrics.stability ?? (1 - clamp01(metrics.instability ?? 0))) * 1000)
        ].join('|'));

        const biasBucket = (() => {
            if (family === 'mythic') {
                const synergy = clamp01(metrics.synergy ?? 0);
                if (synergy > 0.88) return 2;
                if (synergy > 0.74) return 1;
                return 0;
            }
            if (family === 'fracture') {
                const corruption = clamp01(metrics.corruption ?? 0);
                if (corruption > 0.9) return 2;
                if (corruption > 0.76) return 1;
                return 0;
            }
            if (family === 'cathedral') {
                const harmony = clamp01(metrics.harmony ?? 0);
                if (harmony > 0.9) return 2;
                if (harmony > 0.76) return 1;
                return 0;
            }
            return 0;
        })();

        return (seed + biasBucket) % Math.max(1, variantCount);
    }

    _finalizeBurst(burst, time, color, family, motionProfile, sharedGeometries) {
        const ud = (burst && typeof burst.userData === 'object' && burst.userData) ? burst.userData : (() => { try { Object.defineProperty(burst, 'userData', { value: {}, writable: true, configurable: true }); } catch (e) {} return burst.userData || {}; })();
        Object.assign(ud, {
            birthTime: time,
            lastTime: time,
            age: 0,
            duration: motionProfile.duration,
            baseScale: motionProfile.baseScale,
            maxScale: motionProfile.maxScale,
            color,
            family,
            motionProfile,
            sharedGeometries: sharedGeometries || new Set()
        });
        return burst;
    }

    _buildMythicBurst(palette, time, color, context = {}) {
        const burst = new THREE.Group();
        burst.name = 'MythicBurst';

        const variantIndex = this._pickBurstVariantIndex('mythic', context, 3);
        const profiles = [
            {
                name: 'Reliquary',
                loopConfigs: [
                    { name: 'MythicLoopA', rotation: new THREE.Euler(0.60, 0.18, 0.58), scale: new THREE.Vector3(1.00, 0.72, 0.98), position: new THREE.Vector3(0.02, 0.00, 0.00), opacity: 0.72, spin: new THREE.Vector3(0.03, 0.02, 0.03), phaseShift: 0.0 },
                    { name: 'MythicLoopB', rotation: new THREE.Euler(-0.14, 1.56, 0.92), scale: new THREE.Vector3(0.96, 0.68, 1.02), position: new THREE.Vector3(-0.03, 0.015, 0.02), opacity: 0.64, spin: new THREE.Vector3(0.025, 0.03, 0.02), phaseShift: 1.7 },
                    { name: 'MythicLoopC', rotation: new THREE.Euler(1.58, 0.22, -0.28), scale: new THREE.Vector3(0.94, 0.72, 1.00), position: new THREE.Vector3(0.0, -0.02, -0.01), opacity: 0.68, spin: new THREE.Vector3(0.02, 0.025, 0.03), phaseShift: 3.2 }
                ],
                halo: { scale: new THREE.Vector3(1.08, 0.82, 1.16), rotation: new THREE.Euler(0.75, 0.14, 0.58), opacity: 0.32, spin: new THREE.Vector3(0.015, 0.018, 0.02) },
                core: 'knot',
                coreScale: new THREE.Vector3(0.66, 0.60, 0.72),
                coreRotation: new THREE.Euler(0.38, 0.24, 0.12),
                coreOpacity: 0.78,
                coreSpin: new THREE.Vector3(0.05, 0.04, 0.03),
                seedScale: new THREE.Vector3(0.62, 0.50, 0.72),
                seedRotation: new THREE.Euler(0.22, 0.52, -0.18),
                seedOpacity: 0.80,
                seedSpin: new THREE.Vector3(0.04, 0.03, 0.05),
                crownCount: 6,
                crownRadius: 0.84,
                crownHeight: 0.03,
                duration: 1.05,
                baseScale: 0.07,
                maxScale: 4.8,
                fadeStart: 0.52,
                opacityBase: 0.68,
                rotation: new THREE.Vector3(0.02, 0.035, 0.014),
                pulseSpeed: 4.0,
                pulseDepth: 0.16,
                roleBias: { loop: 1.0, core: 1.16, halo: 0.68, seed: 0.94, seal: 1.08, spike: 1.06 },
                sharedGeometries: new Set([this.baseGeometry, this.outerHaloGeometry, this.coreGeometry, this.crownSpikeGeometry, this.sealGeometry])
            },
            {
                name: 'CrownedTriad',
                loopConfigs: [
                    { name: 'MythicLoopA', rotation: new THREE.Euler(0.54, 0.10, 0.46), scale: new THREE.Vector3(1.04, 0.68, 1.00), position: new THREE.Vector3(0.03, 0.00, 0.00), opacity: 0.70, spin: new THREE.Vector3(0.028, 0.022, 0.025), phaseShift: 0.2 },
                    { name: 'MythicLoopB', rotation: new THREE.Euler(-0.20, 1.50, 0.82), scale: new THREE.Vector3(0.92, 0.62, 1.08), position: new THREE.Vector3(-0.05, 0.03, 0.02), opacity: 0.60, spin: new THREE.Vector3(0.022, 0.028, 0.018), phaseShift: 1.6 },
                    { name: 'MythicLoopC', rotation: new THREE.Euler(1.52, 0.28, -0.22), scale: new THREE.Vector3(0.96, 0.70, 0.96), position: new THREE.Vector3(0.0, -0.03, -0.02), opacity: 0.66, spin: new THREE.Vector3(0.018, 0.024, 0.028), phaseShift: 3.0 },
                    { name: 'MythicLoopD', rotation: new THREE.Euler(0.18, 0.92, 1.16), scale: new THREE.Vector3(0.60, 0.42, 0.60), position: new THREE.Vector3(0.02, 0.12, 0.03), opacity: 0.54, spin: new THREE.Vector3(0.012, 0.016, 0.02), phaseShift: 4.2 }
                ],
                halo: { scale: new THREE.Vector3(1.16, 0.78, 1.22), rotation: new THREE.Euler(0.88, 0.18, 0.66), opacity: 0.26, spin: new THREE.Vector3(0.012, 0.016, 0.02) },
                core: 'prism',
                coreScale: new THREE.Vector3(0.54, 0.54, 0.60),
                coreRotation: new THREE.Euler(0.46, 0.16, 0.18),
                coreOpacity: 0.84,
                coreSpin: new THREE.Vector3(0.03, 0.025, 0.02),
                seedScale: new THREE.Vector3(0.44, 0.40, 0.56),
                seedRotation: new THREE.Euler(0.12, 0.46, 0.08),
                seedOpacity: 0.72,
                seedSpin: new THREE.Vector3(0.025, 0.02, 0.03),
                crownCount: 4,
                crownRadius: 0.9,
                crownHeight: 0.02,
                duration: 1.0,
                baseScale: 0.068,
                maxScale: 4.95,
                fadeStart: 0.56,
                opacityBase: 0.64,
                rotation: new THREE.Vector3(0.018, 0.03, 0.012),
                pulseSpeed: 3.2,
                pulseDepth: 0.14,
                roleBias: { loop: 1.0, core: 1.18, halo: 0.64, seed: 0.86, seal: 1.02, spike: 1.08 },
                sharedGeometries: new Set([this.baseGeometry, this.outerHaloGeometry, this.crownSpikeGeometry])
            },
            {
                name: 'AureateSeed',
                loopConfigs: [
                    { name: 'MythicLoopA', rotation: new THREE.Euler(0.72, 0.24, 0.56), scale: new THREE.Vector3(0.98, 0.62, 1.04), position: new THREE.Vector3(0.02, 0.01, 0.00), opacity: 0.76, spin: new THREE.Vector3(0.02, 0.02, 0.03), phaseShift: 0.1 },
                    { name: 'MythicLoopC', rotation: new THREE.Euler(1.48, 0.20, -0.18), scale: new THREE.Vector3(0.90, 0.66, 0.96), position: new THREE.Vector3(-0.02, -0.04, -0.02), opacity: 0.68, spin: new THREE.Vector3(0.018, 0.022, 0.026), phaseShift: 2.8 }
                ],
                halo: { scale: new THREE.Vector3(1.22, 0.86, 1.30), rotation: new THREE.Euler(0.68, 0.08, 0.42), opacity: 0.38, spin: new THREE.Vector3(0.018, 0.02, 0.024) },
                core: 'seed',
                coreScale: new THREE.Vector3(0.58, 0.52, 0.68),
                coreRotation: new THREE.Euler(0.26, 0.18, 0.08),
                coreOpacity: 0.80,
                coreSpin: new THREE.Vector3(0.04, 0.03, 0.025),
                seedScale: new THREE.Vector3(0.72, 0.58, 0.82),
                seedRotation: new THREE.Euler(0.18, 0.34, 0.16),
                seedOpacity: 0.88,
                seedSpin: new THREE.Vector3(0.03, 0.025, 0.03),
                crownCount: 8,
                crownRadius: 0.88,
                crownHeight: 0.04,
                duration: 1.15,
                baseScale: 0.065,
                maxScale: 5.0,
                fadeStart: 0.48,
                opacityBase: 0.72,
                rotation: new THREE.Vector3(0.016, 0.028, 0.01),
                pulseSpeed: 4.4,
                pulseDepth: 0.18,
                roleBias: { loop: 1.0, core: 1.12, halo: 0.74, seed: 1.06, seal: 0.98, spike: 1.04 },
                sharedGeometries: new Set([this.baseGeometry, this.outerHaloGeometry, this.sealGeometry, this.crownSpikeGeometry])
            }
        ];

        const profile = profiles[variantIndex];
        const ringMaterials = {
            loopA: this._createBurstMaterial(palette.gold, 0.7),
            loopB: this._createBurstMaterial(palette.violet, 0.62),
            loopC: this._createBurstMaterial(palette.ember, 0.66),
            loopD: this._createBurstMaterial(palette.ivory, 0.58),
            halo: this._createBurstMaterial(palette.ivory, profile.halo.opacity),
            core: this._createBurstMaterial(palette.source, profile.coreOpacity),
            spike: this._createBurstMaterial(palette.gold, 0.84),
            seed: this._createBurstMaterial(palette.ivory, profile.seedOpacity)
        };

        const createLoop = (cfg, material) => {
            const loop = new THREE.Mesh(this.baseGeometry, material);
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
        };

        for (const [index, cfg] of profile.loopConfigs.entries()) {
            const material = [ringMaterials.loopA, ringMaterials.loopB, ringMaterials.loopC, ringMaterials.loopD][index] || ringMaterials.loopA;
            createLoop(cfg, material);
        }

        const halo = new THREE.Mesh(this.outerHaloGeometry, ringMaterials.halo);
        halo.name = `MythicOuterHalo_${profile.name}`;
        halo.frustumCulled = false;
        halo.position.set(0.0, 0.0, 0.0);
        halo.rotation.copy(profile.halo.rotation);
        halo.scale.copy(profile.halo.scale);
        halo.userData = {
            role: 'halo',
            baseOpacity: profile.halo.opacity,
            spin: profile.halo.spin.clone(),
            phase: Math.random() * Math.PI * 2,
            phaseShift: 0.9
        };
        burst.add(halo);

        const buildCoreSymbol = () => {
            if (profile.core === 'prism') {
                const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.5, 6, 1, true), ringMaterials.core);
                prism.name = 'MythicCorePrism';
                prism.frustumCulled = false;
                prism.scale.copy(profile.coreScale);
                prism.rotation.copy(profile.coreRotation);
                prism.userData = { role: 'core', baseOpacity: profile.coreOpacity, spin: profile.coreSpin.clone(), phase: Math.random() * Math.PI * 2 };
                return prism;
            }

            if (profile.core === 'seed') {
                const root = new THREE.Group();
                root.name = 'MythicSeedSymbol';

                const seed = new THREE.Mesh(this.sealGeometry, ringMaterials.seed);
                seed.scale.copy(profile.seedScale);
                seed.rotation.copy(profile.seedRotation);
                seed.userData = { role: 'seed', baseOpacity: profile.seedOpacity, spin: profile.seedSpin.clone(), phase: Math.random() * Math.PI * 2 };
                root.add(seed);

                const innerRing = new THREE.Mesh(this.baseGeometry, ringMaterials.halo);
                innerRing.scale.set(0.34, 0.18, 0.34);
                innerRing.rotation.set(0.64, 0.18, 0.12);
                innerRing.userData = { role: 'halo', baseOpacity: 0.42, spin: new THREE.Vector3(0.02, 0.02, 0.02), phase: Math.random() * Math.PI * 2 };
                root.add(innerRing);

                return root;
            }

            const core = new THREE.Mesh(this.coreGeometry, ringMaterials.core);
            core.name = 'MythicBurstCore';
            core.frustumCulled = false;
            core.scale.copy(profile.coreScale);
            core.rotation.copy(profile.coreRotation);
            core.userData = {
                role: 'core',
                baseOpacity: profile.coreOpacity,
                spin: profile.coreSpin.clone(),
                phase: Math.random() * Math.PI * 2
            };
            return core;
        };

        burst.add(buildCoreSymbol());

        if (profile.name !== 'AureateSeed') {
            const seal = new THREE.Mesh(this.sealGeometry, ringMaterials.spike);
            seal.name = `MythicSeal_${profile.name}`;
            seal.frustumCulled = false;
            seal.scale.copy(profile.seedScale);
            seal.rotation.copy(profile.seedRotation);
            seal.userData = {
                role: 'seal',
                baseOpacity: profile.seedOpacity * 0.92,
                spin: profile.seedSpin.clone(),
                phase: Math.random() * Math.PI * 2,
                phaseShift: 2.1
            };
            burst.add(seal);
        }

        const crownAngles = [];
        for (let i = 0; i < profile.crownCount; i++) {
            crownAngles.push((i / profile.crownCount) * Math.PI * 2);
        }
        for (let i = 0; i < crownAngles.length; i++) {
            const angle = crownAngles[i];
            const spike = new THREE.Mesh(this.crownSpikeGeometry, ringMaterials.spike);
            spike.name = `MythicCrownSpine${i}_${profile.name}`;
            spike.frustumCulled = false;
            spike.position.set(Math.cos(angle) * profile.crownRadius, profile.crownHeight + (i % 2) * 0.02, Math.sin(angle) * profile.crownRadius);
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

        return this._finalizeBurst(
            burst,
            time,
            color,
            'mythic',
            {
                duration: profile.duration,
                baseScale: profile.baseScale,
                maxScale: profile.maxScale,
                fadeStart: profile.fadeStart,
                opacityBase: profile.opacityBase,
                rotation: profile.rotation,
                pulseSpeed: profile.pulseSpeed,
                pulseDepth: profile.pulseDepth,
                roleBias: profile.roleBias,
                variant: profile.name
            },
            profile.sharedGeometries
        );
    }

    _buildFractureBurst(palette, time, color, context = {}) {
        const burst = new THREE.Group();
        burst.name = 'FractureBurst';

        const variantIndex = this._pickBurstVariantIndex('fracture', context, 3);
        const profiles = [
            {
                name: 'NeonRupture',
                splitCount: 2,
                splitScale: [new THREE.Vector3(0.96, 0.68, 1.18), new THREE.Vector3(1.02, 0.74, 0.94)],
                splitRotation: [new THREE.Euler(-0.34, 0.42, -0.18), new THREE.Euler(0.58, 1.42, 0.76)],
                splitPosition: [new THREE.Vector3(0.1, -0.02, 0.03), new THREE.Vector3(-0.04, 0.05, -0.02)],
                splitArc: [Math.PI * 0.88, Math.PI * 0.82],
                splitRadius: [0.42, 0.38],
                crackLines: [
                    [new THREE.Vector3(-0.18, 0.02, -0.02), new THREE.Vector3(-0.04, 0.12, 0.06), new THREE.Vector3(0.14, -0.06, 0.02)],
                    [new THREE.Vector3(-0.12, -0.08, 0.08), new THREE.Vector3(0.0, 0.02, -0.1), new THREE.Vector3(0.16, 0.12, 0.08)]
                ],
                shardCount: 5,
                shardRadius: 0.58,
                coreType: 'crackedCore',
                duration: 0.84,
                baseScale: 0.065,
                maxScale: 4.35,
                fadeStart: 0.42,
                opacityBase: 0.78,
                rotation: new THREE.Vector3(0.038, 0.055, 0.024),
                pulseSpeed: 7.2,
                pulseDepth: 0.22,
                roleBias: { split: 1.0, shard: 1.12, crack: 0.9, core: 1.22, rupture: 1.06, seed: 0.95 },
                sharedGeometries: new Set()
            },
            {
                name: 'SplitRingBloom',
                splitCount: 3,
                splitScale: [new THREE.Vector3(0.98, 0.70, 1.12), new THREE.Vector3(1.02, 0.76, 0.96), new THREE.Vector3(0.88, 0.66, 1.08)],
                splitRotation: [new THREE.Euler(0.76, 0.22, 0.58), new THREE.Euler(-0.24, 1.12, -0.42), new THREE.Euler(1.28, -0.16, 0.88)],
                splitPosition: [new THREE.Vector3(0.08, 0.0, 0.02), new THREE.Vector3(-0.08, 0.04, 0.0), new THREE.Vector3(0.0, -0.06, -0.04)],
                splitArc: [Math.PI * 0.92, Math.PI * 0.76, Math.PI * 0.86],
                splitRadius: [0.44, 0.36, 0.40],
                crackLines: [
                    [new THREE.Vector3(-0.2, 0.06, -0.04), new THREE.Vector3(-0.04, 0.18, 0.06), new THREE.Vector3(0.12, -0.02, 0.04)],
                    [new THREE.Vector3(-0.14, -0.1, 0.1), new THREE.Vector3(0.0, 0.04, -0.12), new THREE.Vector3(0.18, 0.14, 0.08)],
                    [new THREE.Vector3(-0.06, 0.0, -0.14), new THREE.Vector3(0.08, -0.12, 0.0), new THREE.Vector3(0.2, 0.04, 0.1)]
                ],
                shardCount: 8,
                shardRadius: 0.62,
                coreType: 'ruptureSeed',
                duration: 0.88,
                baseScale: 0.066,
                maxScale: 4.5,
                fadeStart: 0.46,
                opacityBase: 0.74,
                rotation: new THREE.Vector3(0.042, 0.06, 0.028),
                pulseSpeed: 8.0,
                pulseDepth: 0.24,
                roleBias: { split: 1.04, shard: 1.16, crack: 0.88, core: 1.18, rupture: 1.1, seed: 1.0 },
                sharedGeometries: new Set()
            },
            {
                name: 'RuptureCorona',
                splitCount: 4,
                splitScale: [new THREE.Vector3(1.04, 0.74, 1.02), new THREE.Vector3(0.94, 0.66, 1.10), new THREE.Vector3(0.86, 0.70, 0.92), new THREE.Vector3(0.72, 0.52, 0.78)],
                splitRotation: [new THREE.Euler(0.52, 0.18, 0.34), new THREE.Euler(-0.28, 1.48, -0.12), new THREE.Euler(1.18, 0.42, 0.82), new THREE.Euler(0.18, 0.92, 1.24)],
                splitPosition: [new THREE.Vector3(0.12, 0.02, 0.02), new THREE.Vector3(-0.02, -0.02, -0.04), new THREE.Vector3(-0.08, 0.08, 0.06), new THREE.Vector3(0.0, -0.1, 0.08)],
                splitArc: [Math.PI * 0.74, Math.PI * 0.82, Math.PI * 0.68, Math.PI * 0.6],
                splitRadius: [0.46, 0.40, 0.34, 0.28],
                crackLines: [
                    [new THREE.Vector3(-0.16, 0.02, -0.02), new THREE.Vector3(0.0, 0.16, 0.08), new THREE.Vector3(0.16, -0.06, 0.04)]
                ],
                shardCount: 11,
                shardRadius: 0.68,
                coreType: 'splitPrism',
                duration: 0.92,
                baseScale: 0.068,
                maxScale: 4.65,
                fadeStart: 0.40,
                opacityBase: 0.80,
                rotation: new THREE.Vector3(0.05, 0.07, 0.03),
                pulseSpeed: 8.6,
                pulseDepth: 0.26,
                roleBias: { split: 1.02, shard: 1.2, crack: 0.84, core: 1.16, rupture: 1.14, seed: 0.98 },
                sharedGeometries: new Set()
            }
        ];

        const profile = profiles[variantIndex];
        const ringMaterials = {
            splitA: this._createBurstMaterial(new THREE.Color(0x48f0ff).lerp(palette.source, 0.18), 0.82),
            splitB: this._createBurstMaterial(new THREE.Color(0xff54d6).lerp(palette.source, 0.12), 0.76),
            crack: this._createBurstMaterial(new THREE.Color(0xffffff).lerp(palette.source, 0.08), 0.88),
            shard: this._createBurstMaterial(new THREE.Color(0xff9a4a).lerp(palette.source, 0.15), 0.72),
            core: this._createBurstMaterial(new THREE.Color(0xf1f5ff).lerp(palette.source, 0.06), 0.92),
            rupture: this._createBurstMaterial(new THREE.Color(0x9a6dff).lerp(palette.source, 0.1), 0.68)
        };

        const buildArc = (radius, tube, arc, radialSegments = 8, tubularSegments = 32, material = ringMaterials.splitA) =>
            new THREE.Mesh(new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc), material);

        const buildTube = (points, radius, tubularSegments = 18, radialSegments = 5, closed = false, material = ringMaterials.crack) => {
            const curve = new THREE.CatmullRomCurve3(points, closed);
            return new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed), material);
        };

        const splitMaterials = [ringMaterials.splitA, ringMaterials.splitB, ringMaterials.rupture, ringMaterials.splitA];
        for (let i = 0; i < profile.splitCount; i++) {
            const material = splitMaterials[i] || ringMaterials.splitA;
            const splitRing = buildArc(
                profile.splitRadius[i],
                0.032 + (i % 2) * 0.01,
                profile.splitArc[i],
                8,
                40 + i * 2,
                material
            );
            splitRing.name = `FractureSplitRing${i}`;
            splitRing.position.copy(profile.splitPosition[i]);
            splitRing.rotation.copy(profile.splitRotation[i]);
            splitRing.scale.copy(profile.splitScale[i]);
            burst.add(splitRing);
        }

        profile.crackLines.forEach((points, index) => {
            const crack = buildTube(points, index === 0 ? 0.014 : 0.01, 14, 4, false, ringMaterials.crack);
            crack.name = `FractureCrack${index}`;
            crack.rotation.set(0.2 + index * 0.18, -0.46 + index * 0.34, 0.74 - index * 0.28);
            burst.add(crack);
        });

        const buildCoreSymbol = () => {
            if (profile.coreType === 'ruptureSeed') {
                const root = new THREE.Group();
                root.name = 'FractureRuptureSeed';
                const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.42, 6, 1, true), ringMaterials.core);
                prism.rotation.set(0.42, 0.18, 0.1);
                prism.scale.set(0.92, 0.72, 1.08);
                root.add(prism);
                const seedRing = buildArc(0.22, 0.018, Math.PI * 2, 8, 24, ringMaterials.rupture);
                seedRing.rotation.set(0.82, 0.24, -0.1);
                seedRing.scale.set(0.88, 0.82, 0.88);
                root.add(seedRing);
                return root;
            }

            if (profile.coreType === 'splitPrism') {
                const root = new THREE.Group();
                root.name = 'FractureSplitPrism';
                const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.48, 6, 1, true), ringMaterials.core);
                prism.rotation.set(0.36, -0.26, 0.18);
                prism.scale.set(1.08, 0.84, 1.14);
                root.add(prism);
                const slash = buildTube([
                    new THREE.Vector3(-0.18, -0.04, 0.0),
                    new THREE.Vector3(-0.02, 0.12, 0.08),
                    new THREE.Vector3(0.16, -0.06, -0.02)
                ], 0.012, 10, 4, false, ringMaterials.rupture);
                slash.rotation.set(0.14, 0.42, 0.68);
                root.add(slash);
                return root;
            }

            const crackedCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), ringMaterials.core);
            crackedCore.name = 'FractureCrackedCore';
            crackedCore.scale.set(1.1, 0.92, 1.2);
            crackedCore.rotation.set(0.42, -0.28, 0.16);
            burst.add(crackedCore);
            return crackedCore;
        };

        const coreSymbol = buildCoreSymbol();
        if (coreSymbol.parent !== burst) {
            burst.add(coreSymbol);
        }

        const shardAngles = [];
        for (let i = 0; i < profile.shardCount; i++) {
            shardAngles.push((i / profile.shardCount) * Math.PI * 2);
        }
        for (let i = 0; i < shardAngles.length; i++) {
            const angle = shardAngles[i];
            const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.05, 0.3 + (i % 2) * 0.08, 6, 1, true), ringMaterials.shard);
            shard.name = `FractureShard${i}`;
            shard.frustumCulled = false;
            shard.position.set(Math.cos(angle) * profile.shardRadius, Math.sin(angle * 2.0) * 0.08, Math.sin(angle) * profile.shardRadius);
            shard.rotation.set(0.82 + i * 0.04, angle * 0.38, 0.16 + (i % 3) * 0.12);
            shard.scale.set(0.96, 1.12, 0.96);
            shard.userData = { role: 'shard', baseOpacity: 0.8, spin: new THREE.Vector3(0.05, 0.07, 0.04), phase: Math.random() * Math.PI * 2, phaseShift: angle };
            burst.add(shard);
        }

        return this._finalizeBurst(
            burst,
            time,
            color,
            'fracture',
            {
                duration: profile.duration,
                baseScale: profile.baseScale,
                maxScale: profile.maxScale,
                fadeStart: profile.fadeStart,
                opacityBase: profile.opacityBase,
                rotation: profile.rotation,
                pulseSpeed: profile.pulseSpeed,
                pulseDepth: profile.pulseDepth,
                roleBias: profile.roleBias,
                variant: profile.name
            },
            profile.sharedGeometries
        );
    }

    _buildCathedralBurst(palette, time, color, context = {}) {
        const burst = new THREE.Group();
        burst.name = 'CathedralBurst';

        const variantIndex = this._pickBurstVariantIndex('cathedral', context, 3);
        const profiles = [
            {
                name: 'CathedralMonument',
                ringHeights: [0.24, 0.0, -0.24],
                ringScales: [new THREE.Vector3(1.08, 0.18, 1.08), new THREE.Vector3(1.0, 0.16, 1.0), new THREE.Vector3(0.92, 0.14, 0.92)],
                ringRotations: [new THREE.Euler(1.52, 0.08, 0.24), new THREE.Euler(1.52, 0.18, 0.24), new THREE.Euler(1.52, 0.28, 0.24)],
                pillarCount: 8,
                pillarRadius: 0.48,
                pillarHeight: 0.92,
                archCount: 2,
                coreType: 'crown',
                duration: 1.18,
                baseScale: 0.075,
                maxScale: 5.0,
                fadeStart: 0.64,
                opacityBase: 0.64,
                rotation: new THREE.Vector3(0.014, 0.02, 0.01),
                pulseSpeed: 2.4,
                pulseDepth: 0.12,
                roleBias: { ring: 1.0, pillar: 0.82, arch: 0.92, core: 1.12, lantern: 1.02 },
                sharedGeometries: new Set([this.baseGeometry])
            },
            {
                name: 'CathedralNave',
                ringHeights: [0.30, 0.10, -0.10, -0.30],
                ringScales: [new THREE.Vector3(1.12, 0.18, 1.12), new THREE.Vector3(1.04, 0.16, 1.04), new THREE.Vector3(0.98, 0.14, 0.98), new THREE.Vector3(0.88, 0.13, 0.88)],
                ringRotations: [new THREE.Euler(1.56, 0.04, 0.18), new THREE.Euler(1.52, 0.14, 0.24), new THREE.Euler(1.50, 0.24, 0.28), new THREE.Euler(1.48, 0.34, 0.32)],
                pillarCount: 6,
                pillarRadius: 0.52,
                pillarHeight: 1.02,
                archCount: 4,
                coreType: 'lantern',
                duration: 1.26,
                baseScale: 0.078,
                maxScale: 5.15,
                fadeStart: 0.68,
                opacityBase: 0.60,
                rotation: new THREE.Vector3(0.012, 0.018, 0.009),
                pulseSpeed: 2.1,
                pulseDepth: 0.10,
                roleBias: { ring: 1.0, pillar: 0.78, arch: 0.9, core: 1.16, lantern: 1.08 },
                sharedGeometries: new Set([this.baseGeometry])
            },
            {
                name: 'CathedralVault',
                ringHeights: [0.20, -0.18],
                ringScales: [new THREE.Vector3(1.16, 0.2, 1.16), new THREE.Vector3(0.98, 0.15, 0.98)],
                ringRotations: [new THREE.Euler(1.46, 0.16, 0.2), new THREE.Euler(1.58, 0.36, 0.34)],
                pillarCount: 10,
                pillarRadius: 0.5,
                pillarHeight: 0.88,
                archCount: 3,
                coreType: 'lattice',
                duration: 1.14,
                baseScale: 0.074,
                maxScale: 4.9,
                fadeStart: 0.60,
                opacityBase: 0.66,
                rotation: new THREE.Vector3(0.016, 0.022, 0.011),
                pulseSpeed: 2.7,
                pulseDepth: 0.14,
                roleBias: { ring: 1.0, pillar: 0.84, arch: 0.94, core: 1.1, lattice: 1.04 },
                sharedGeometries: new Set([this.baseGeometry])
            }
        ];

        const profile = profiles[variantIndex];
        const ringMaterials = {
            stone: this._createBurstMaterial(new THREE.Color(0xe6dfd0).lerp(palette.source, 0.08), 0.56),
            gold: this._createBurstMaterial(new THREE.Color(0xe7c46a).lerp(palette.source, 0.12), 0.72),
            glass: this._createBurstMaterial(new THREE.Color(0xa8dbff).lerp(palette.source, 0.1), 0.42),
            ivory: this._createBurstMaterial(new THREE.Color(0xf5f0e4).lerp(palette.source, 0.04), 0.48),
            core: this._createBurstMaterial(new THREE.Color(0xffffff).lerp(palette.source, 0.05), 0.84)
        };

        const buildRing = (height, scale, rotation, material, index) => {
            const ring = new THREE.Mesh(this.baseGeometry, material);
            ring.name = `CathedralStackRing${index}`;
            ring.position.y = height;
            ring.rotation.copy(rotation);
            ring.scale.copy(scale);
            ring.userData = { role: 'ring', baseOpacity: material.opacity, spin: new THREE.Vector3(0.012, 0.014, 0.01), phase: Math.random() * Math.PI * 2, phaseShift: index * 0.6 };
            burst.add(ring);
        };

        const ringMaterialsByIndex = [ringMaterials.gold, ringMaterials.ivory, ringMaterials.gold, ringMaterials.ivory];
        for (let i = 0; i < profile.ringHeights.length; i++) {
            buildRing(profile.ringHeights[i], profile.ringScales[i], profile.ringRotations[i], ringMaterialsByIndex[i] || ringMaterials.gold, i);
        }

        const pillarAngles = [];
        for (let i = 0; i < profile.pillarCount; i++) {
            pillarAngles.push((i / profile.pillarCount) * Math.PI * 2);
        }
        for (let i = 0; i < pillarAngles.length; i++) {
            const angle = pillarAngles[i];
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, profile.pillarHeight, 6, 1, true), ringMaterials.stone);
            pillar.name = `CathedralPillar${i}`;
            pillar.frustumCulled = false;
            pillar.position.set(Math.cos(angle) * profile.pillarRadius, 0.0, Math.sin(angle) * profile.pillarRadius);
            pillar.rotation.set(0.08 + (i % 3) * 0.05, angle * 0.12, 0.14 + (i % 2) * 0.08);
            pillar.scale.set(1.0, 1.0 + (i % 2) * 0.06, 1.0);
            pillar.userData = { role: 'pillar', baseOpacity: 0.86, spin: new THREE.Vector3(0.008, 0.013, 0.01), phase: Math.random() * Math.PI * 2, phaseShift: angle };
            burst.add(pillar);
        }

        const archPoints = [];
        if (profile.archCount >= 2) {
            archPoints.push([
                new THREE.Vector3(-0.42, 0.08, 0.0), new THREE.Vector3(-0.18, 0.36, 0.1), new THREE.Vector3(0.0, 0.42, 0.0), new THREE.Vector3(0.18, 0.36, -0.1), new THREE.Vector3(0.42, 0.08, 0.0)
            ]);
            archPoints.push([
                new THREE.Vector3(0.0, 0.08, -0.42), new THREE.Vector3(0.1, 0.36, -0.18), new THREE.Vector3(0.0, 0.42, 0.0), new THREE.Vector3(-0.1, 0.36, 0.18), new THREE.Vector3(0.0, 0.08, 0.42)
            ]);
        }
        if (profile.archCount >= 3) {
            archPoints.push([
                new THREE.Vector3(-0.34, -0.02, -0.34), new THREE.Vector3(-0.12, 0.24, -0.12), new THREE.Vector3(0.0, 0.34, 0.0), new THREE.Vector3(0.12, 0.24, 0.12), new THREE.Vector3(0.34, -0.02, 0.34)
            ]);
        }
        if (profile.archCount >= 4) {
            archPoints.push([
                new THREE.Vector3(-0.34, 0.0, 0.34), new THREE.Vector3(-0.12, 0.26, 0.12), new THREE.Vector3(0.0, 0.36, 0.0), new THREE.Vector3(0.12, 0.26, -0.12), new THREE.Vector3(0.34, 0.0, -0.34)
            ]);
        }
        archPoints.slice(0, profile.archCount).forEach((points, index) => {
            const arch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false), 22, 0.025, 5, false), ringMaterials.glass);
            arch.name = `CathedralArch${index}`;
            arch.rotation.set(0.02 + index * 0.16, index * 0.32, 0.0);
            burst.add(arch);
        });

        const buildCoreSymbol = () => {
            if (profile.coreType === 'lantern') {
                const root = new THREE.Group();
                root.name = 'CathedralLantern';
                const shell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), ringMaterials.core);
                shell.scale.set(1.0, 1.08, 0.92);
                shell.rotation.set(0.36, 0.18, -0.14);
                shell.userData = { role: 'core', baseOpacity: 0.88, spin: new THREE.Vector3(0.018, 0.02, 0.016), phase: Math.random() * Math.PI * 2 };
                root.add(shell);
                const ring = new THREE.Mesh(this.baseGeometry, ringMaterials.gold);
                ring.scale.set(0.38, 0.16, 0.38);
                ring.rotation.set(1.56, 0.22, 0.14);
                ring.userData = { role: 'lantern', baseOpacity: 0.62, spin: new THREE.Vector3(0.014, 0.016, 0.012), phase: Math.random() * Math.PI * 2 };
                root.add(ring);
                return root;
            }

            if (profile.coreType === 'lattice') {
                const root = new THREE.Group();
                root.name = 'CathedralLattice';
                const lattice = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), ringMaterials.core);
                lattice.scale.set(0.92, 1.1, 0.92);
                lattice.rotation.set(0.26, 0.18, -0.14);
                lattice.userData = { role: 'core', baseOpacity: 0.86, spin: new THREE.Vector3(0.016, 0.018, 0.014), phase: Math.random() * Math.PI * 2 };
                root.add(lattice);
                const belt = new THREE.Mesh(this.baseGeometry, ringMaterials.ivory);
                belt.scale.set(0.34, 0.14, 0.34);
                belt.rotation.set(0.8, 0.34, 0.16);
                belt.userData = { role: 'lattice', baseOpacity: 0.58, spin: new THREE.Vector3(0.01, 0.012, 0.01), phase: Math.random() * Math.PI * 2 };
                root.add(belt);
                return root;
            }

            const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), ringMaterials.core);
            crown.name = 'CathedralCrown';
            crown.position.y = 0.34;
            crown.scale.set(0.92, 1.1, 0.92);
            crown.rotation.set(0.36, 0.18, -0.14);
            crown.userData = { role: 'core', baseOpacity: 0.88, spin: new THREE.Vector3(0.018, 0.02, 0.016), phase: Math.random() * Math.PI * 2 };
            return crown;
        };

        burst.add(buildCoreSymbol());

        return this._finalizeBurst(
            burst,
            time,
            color,
            'cathedral',
            {
                duration: profile.duration,
                baseScale: profile.baseScale,
                maxScale: profile.maxScale,
                fadeStart: profile.fadeStart,
                opacityBase: profile.opacityBase,
                rotation: profile.rotation,
                pulseSpeed: profile.pulseSpeed,
                pulseDepth: profile.pulseDepth,
                roleBias: profile.roleBias,
                variant: profile.name
            },
            profile.sharedGeometries
        );
    }

    /**
     * Create and emit an energy ring at a position
     * @param {THREE.Vector3} position - World position of ring center
     * @param {THREE.Color} color - Ring color
     * @param {number} time - Current time
     */
    emitRing(position, color, time, family = 'mythic', context = {}) {
        const palette = this._createMythicPalette(color);
        let burst;
        if (family === 'fracture') {
            burst = this._buildFractureBurst(palette, time, color, context);
        } else if (family === 'cathedral') {
            burst = this._buildCathedralBurst(palette, time, color, context);
        } else {
            burst = this._buildMythicBurst(palette, time, color, context);
        }

        burst.renderOrder = VisualHierarchyRegistry.getRenderOrder('LINK_PULSE');
        burst.frustumCulled = false;
        burst.position.copy(position);
        burst.userData.family = family;
        burst.userData.context = context || {};

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
                const motion = data.motionProfile || {};
                const roleBiasTable = motion.roleBias || {};
                const fadeStart = motion.fadeStart ?? 0.52;
                const opacityBase = motion.opacityBase ?? 0.68;
                let opacity = opacityBase;
                if (progress > fadeStart) {
                    const fadeProgress = (progress - fadeStart) / (1.0 - fadeStart);
                    opacity = opacityBase * (1.0 - fadeProgress);
                }
                for (const child of burst.children) {
                    if (!child?.material) continue;
                    const phase = child.userData?.phase ?? 0;
                    const role = child.userData?.role || 'loop';
                    const roleBias = roleBiasTable[role] ?? (role === 'core' ? 1.16 : role === 'seal' ? 1.08 : role === 'halo' ? 0.68 : role === 'spike' ? 1.06 : 1.0);
                    const phaseShift = child.userData?.phaseShift ?? 0;
                    const rotation = motion.rotation || new THREE.Vector3(0.02, 0.035, 0.014);
                    const pulseSpeed = motion.pulseSpeed ?? 4.0;
                    const pulseDepth = motion.pulseDepth ?? 0.16;
                    const pulse = (1.0 - pulseDepth) + pulseDepth * Math.sin(progress * Math.PI * pulseSpeed + phase + phaseShift);
                    child.material.opacity = opacity * roleBias * pulse;
                }

                // Rotation (subtle spin)
                const rotation = motion.rotation || new THREE.Vector3(0.02, 0.035, 0.014);
                burst.rotation.x += rotation.x;
                burst.rotation.y += rotation.y;
                burst.rotation.z += rotation.z;

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
                const disposedGeometries = new Set();
                const sharedGeometries = burst.userData?.sharedGeometries || new Set();
            burst.traverse((obj) => {
                    if (obj?.geometry && !disposedGeometries.has(obj.geometry) && !sharedGeometries.has(obj.geometry)) {
                        disposedGeometries.add(obj.geometry);
                        obj.geometry.dispose?.();
                    }
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
