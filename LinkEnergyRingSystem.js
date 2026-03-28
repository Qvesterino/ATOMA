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

    _pickWeightedIndex(weights, seedText) {
        let total = 0;
        for (let i = 0; i < weights.length; i += 1) {
            total += Math.max(0, Number.isFinite(weights[i]) ? weights[i] : 0);
        }
        if (total <= 0) return 0;

        let cursor = (hashString32(seedText) / 0xffffffff) * total;
        for (let i = 0; i < weights.length; i += 1) {
            cursor -= Math.max(0, Number.isFinite(weights[i]) ? weights[i] : 0);
            if (cursor <= 0) return i;
        }
        return Math.max(0, weights.length - 1);
    }

    _pickBurstVariantIndex(family, context = {}, variants = 3) {
        const profiles = Array.isArray(variants)
            ? variants
            : Array.from({ length: Math.max(1, variants | 0) }, () => ({}));
        const variantCount = profiles.length;
        const metrics = context.metrics || {};
        const category = String(context.category || 'default').toLowerCase();
        const nodeId = context.nodeId ?? context.node?.id ?? context.node?.uuid ?? '';
        const time = Number.isFinite(context.time) ? context.time : 0;
        const seedText = [
            family,
            category,
            nodeId,
            Math.floor(time * 1000),
            Math.floor(clamp01(metrics.synergy ?? 0) * 1000),
            Math.floor(clamp01(metrics.harmony ?? 0) * 1000),
            Math.floor(clamp01(metrics.corruption ?? 0) * 1000),
            Math.floor(clamp01(metrics.stability ?? (1 - clamp01(metrics.instability ?? 0))) * 1000)
        ].join('|');

        const synergy = clamp01(metrics.synergy ?? 0);
        const harmony = clamp01(metrics.harmony ?? 0);
        const corruption = clamp01(metrics.corruption ?? 0);

        const weights = profiles.map((profile, index) => {
            let weight = Number.isFinite(profile?.weight) ? profile.weight : 1;
            const tag = String(profile?.tag || profile?.name || '').toLowerCase();

            if (family === 'mythic') {
                if (synergy >= 0.97 && (tag.includes('apotheosis') || tag.includes('halo'))) weight *= 8.0;
                else if (synergy >= 0.90 && (tag.includes('seed') || tag.includes('benediction'))) weight *= 4.0;
                else if (synergy >= 0.82 && (tag.includes('crown') || tag.includes('triune'))) weight *= 2.4;
                else weight *= 1.0 + synergy * 0.5 + index * 0.04;
            } else if (family === 'fracture') {
                if (corruption >= 0.97 && (tag.includes('null') || tag.includes('rift'))) weight *= 8.0;
                else if (corruption >= 0.90 && (tag.includes('corona') || tag.includes('rupture'))) weight *= 4.0;
                else if (corruption >= 0.82 && (tag.includes('bloom') || tag.includes('split'))) weight *= 2.4;
                else weight *= 1.0 + corruption * 0.5 + index * 0.04;
            } else if (family === 'cathedral') {
                if (harmony >= 0.97 && (tag.includes('sanctum') || tag.includes('spire'))) weight *= 8.0;
                else if (harmony >= 0.90 && (tag.includes('vault') || tag.includes('lantern'))) weight *= 4.0;
                else if (harmony >= 0.82 && (tag.includes('monument') || tag.includes('nave'))) weight *= 2.4;
                else weight *= 1.0 + harmony * 0.5 + index * 0.04;
            } else {
                weight *= 1.0 + index * 0.03;
            }

            return weight;
        });

        return this._pickWeightedIndex(weights, seedText) % Math.max(1, variantCount);
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

    _configureFirstFrameAccent(mesh, options = {}) {
        if (!mesh) return mesh;
        const userData = (mesh.userData && typeof mesh.userData === 'object') ? mesh.userData : {};
        mesh.userData = userData;
        userData.role = options.role || userData.role || 'accent';
        userData.phase = Number.isFinite(options.phase) ? options.phase : Math.random() * Math.PI * 2;
        userData.phaseShift = Number.isFinite(options.phaseShift) ? options.phaseShift : (userData.phaseShift ?? 0);
        userData.spin = options.spin?.clone ? options.spin.clone() : (userData.spin || new THREE.Vector3());
        userData.accentWindow = Math.max(0.01, Number.isFinite(options.window) ? options.window : 0.12);
        userData.accentBoost = Number.isFinite(options.boost) ? options.boost : 0.55;
        userData.baseScale = options.baseScale?.clone ? options.baseScale.clone() : mesh.scale.clone();
        userData.accentScale = options.accentScale?.clone ? options.accentScale.clone() : mesh.scale.clone();
        mesh.scale.copy(userData.accentScale);
        mesh.frustumCulled = false;
        return mesh;
    }

    _buildMythicBurst(palette, time, color, context = {}) {
        const burst = new THREE.Group();
        burst.name = 'MythicBurst';

        const profiles = [
            {
                name: 'AureateReliquary',
                tag: 'aureateReliquary',
                weight: 1.0,
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
                name: 'TriuneCrown',
                tag: 'triuneCrown',
                weight: 1.1,
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
                name: 'SeedOfBenediction',
                tag: 'seedOfBenediction',
                weight: 1.35,
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
            },
            {
                name: 'ApotheosisHalo',
                tag: 'apotheosisHalo',
                weight: 1.75,
                loopConfigs: [
                    { name: 'MythicLoopA', rotation: new THREE.Euler(0.82, 0.16, 0.64), scale: new THREE.Vector3(1.10, 0.78, 1.08), position: new THREE.Vector3(0.04, 0.02, 0.00), opacity: 0.78, spin: new THREE.Vector3(0.03, 0.02, 0.03), phaseShift: 0.0 },
                    { name: 'MythicLoopB', rotation: new THREE.Euler(-0.12, 1.46, 0.98), scale: new THREE.Vector3(1.00, 0.72, 1.10), position: new THREE.Vector3(-0.04, 0.02, 0.03), opacity: 0.70, spin: new THREE.Vector3(0.024, 0.03, 0.022), phaseShift: 1.4 },
                    { name: 'MythicLoopC', rotation: new THREE.Euler(1.66, 0.28, -0.22), scale: new THREE.Vector3(0.96, 0.76, 1.02), position: new THREE.Vector3(0.0, -0.02, -0.02), opacity: 0.74, spin: new THREE.Vector3(0.022, 0.026, 0.03), phaseShift: 2.8 },
                    { name: 'MythicLoopD', rotation: new THREE.Euler(0.28, 0.86, 1.22), scale: new THREE.Vector3(0.72, 0.46, 0.68), position: new THREE.Vector3(0.04, 0.16, 0.04), opacity: 0.58, spin: new THREE.Vector3(0.014, 0.018, 0.022), phaseShift: 4.1 },
                    { name: 'MythicLoopE', rotation: new THREE.Euler(-0.48, 0.66, -0.38), scale: new THREE.Vector3(0.58, 0.34, 0.64), position: new THREE.Vector3(-0.02, -0.14, 0.02), opacity: 0.52, spin: new THREE.Vector3(0.012, 0.014, 0.016), phaseShift: 5.1 }
                ],
                halo: { scale: new THREE.Vector3(1.34, 0.96, 1.42), rotation: new THREE.Euler(0.98, 0.24, 0.74), opacity: 0.44, spin: new THREE.Vector3(0.02, 0.026, 0.03) },
                core: 'sun',
                coreScale: new THREE.Vector3(0.52, 0.52, 0.52),
                coreRotation: new THREE.Euler(0.34, 0.28, 0.12),
                coreOpacity: 0.92,
                coreSpin: new THREE.Vector3(0.03, 0.025, 0.022),
                seedScale: new THREE.Vector3(0.84, 0.70, 0.94),
                seedRotation: new THREE.Euler(0.22, 0.48, 0.18),
                seedOpacity: 0.96,
                seedSpin: new THREE.Vector3(0.028, 0.024, 0.03),
                crownCount: 10,
                crownRadius: 1.02,
                crownHeight: 0.06,
                duration: 1.22,
                baseScale: 0.06,
                maxScale: 5.35,
                fadeStart: 0.44,
                opacityBase: 0.76,
                rotation: new THREE.Vector3(0.014, 0.026, 0.012),
                silhouetteScale: new THREE.Vector3(0.88, 1.34, 0.90),
                silhouetteWindow: 0.18,
                silhouetteTwist: new THREE.Vector3(0.18, 0.10, 0.26),
                accentWindow: 0.12,
                accentBoost: 0.72,
                pulseSpeed: 5.2,
                pulseDepth: 0.22,
                roleBias: { loop: 1.0, core: 1.24, halo: 1.12, seed: 1.2, seal: 0.84, spike: 1.16, sun: 1.28, flare: 1.3 },
                sharedGeometries: new Set([this.baseGeometry, this.outerHaloGeometry, this.crownSpikeGeometry, this.sealGeometry])
            }
        ];

        const variantIndex = this._pickBurstVariantIndex('mythic', context, profiles);
        const profile = profiles[variantIndex];
        burst.name = `MythicBurst_${profile.name}`;
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
            if (profile.coreType === 'sun') {
                const root = new THREE.Group();
                root.name = 'MythicApotheosisSun';

                const sun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), ringMaterials.core);
                sun.rotation.set(0.26, 0.34, 0.16);
                sun.userData = { role: 'core', baseOpacity: 0.96, spin: new THREE.Vector3(0.026, 0.024, 0.03), phase: Math.random() * Math.PI * 2 };
                root.add(sun);

                const equator = new THREE.Mesh(this.baseGeometry, ringMaterials.halo);
                equator.scale.set(0.42, 0.14, 0.42);
                equator.rotation.set(1.54, 0.22, 0.18);
                equator.userData = { role: 'halo', baseOpacity: 0.58, spin: new THREE.Vector3(0.018, 0.022, 0.02), phase: Math.random() * Math.PI * 2 };
                root.add(equator);

                const flareRing = new THREE.Mesh(this.outerHaloGeometry, ringMaterials.spike);
                flareRing.scale.set(0.62, 0.26, 0.62);
                flareRing.rotation.set(0.86, 0.42, 0.28);
                flareRing.userData = { role: 'spike', baseOpacity: 0.66, spin: new THREE.Vector3(0.02, 0.018, 0.024), phase: Math.random() * Math.PI * 2 };
                root.add(flareRing);

                return root;
            }

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

        if (profile.name === 'ApotheosisHalo') {
            const flareRing = new THREE.Mesh(this.outerHaloGeometry, ringMaterials.spike);
            flareRing.name = 'MythicHeroFlareRing_ApotheosisHalo';
            flareRing.rotation.set(1.56, 0.48, 0.18);
            flareRing.scale.set(1.48, 0.34, 1.48);
            this._configureFirstFrameAccent(flareRing, {
                role: 'flare',
                window: profile.accentWindow,
                boost: profile.accentBoost,
                baseScale: new THREE.Vector3(1.02, 0.24, 1.02),
                accentScale: new THREE.Vector3(1.48, 0.34, 1.48),
                phaseShift: 0.35,
                spin: new THREE.Vector3(0.014, 0.018, 0.02)
            });
            burst.add(flareRing);

            const flareRayA = new THREE.Mesh(this.crownSpikeGeometry, ringMaterials.gold);
            flareRayA.name = 'MythicHeroFlareRayA_ApotheosisHalo';
            flareRayA.position.set(0.62, 0.05, 0.02);
            flareRayA.rotation.set(0.28, 1.34, 1.04);
            flareRayA.scale.set(1.22, 0.84, 1.22);
            this._configureFirstFrameAccent(flareRayA, {
                role: 'flare',
                window: profile.accentWindow,
                boost: 0.58,
                baseScale: new THREE.Vector3(0.74, 0.56, 0.74),
                accentScale: new THREE.Vector3(1.22, 0.84, 1.22),
                phaseShift: 1.0,
                spin: new THREE.Vector3(0.018, 0.014, 0.02)
            });
            burst.add(flareRayA);

            const flareRayB = new THREE.Mesh(this.crownSpikeGeometry, ringMaterials.ivory);
            flareRayB.name = 'MythicHeroFlareRayB_ApotheosisHalo';
            flareRayB.position.set(-0.42, 0.12, -0.18);
            flareRayB.rotation.set(0.22, -0.82, -1.12);
            flareRayB.scale.set(1.04, 0.76, 1.04);
            this._configureFirstFrameAccent(flareRayB, {
                role: 'flare',
                window: profile.accentWindow,
                boost: 0.52,
                baseScale: new THREE.Vector3(0.66, 0.52, 0.66),
                accentScale: new THREE.Vector3(1.04, 0.76, 1.04),
                phaseShift: 1.55,
                spin: new THREE.Vector3(0.016, 0.012, 0.018)
            });
            burst.add(flareRayB);
        }

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

        const profiles = [
            {
                name: 'NeonRupture',
                tag: 'neonRupture',
                weight: 1.15,
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
                name: 'ShatterBloom',
                tag: 'shatterBloom',
                weight: 1.0,
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
                tag: 'ruptureCorona',
                weight: 1.35,
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
            },
            {
                name: 'NullRift',
                tag: 'nullRift',
                weight: 1.75,
                splitCount: 5,
                splitScale: [new THREE.Vector3(1.08, 0.72, 1.12), new THREE.Vector3(1.0, 0.68, 1.02), new THREE.Vector3(0.92, 0.64, 1.08), new THREE.Vector3(0.84, 0.60, 0.90), new THREE.Vector3(0.76, 0.54, 0.82)],
                splitRotation: [new THREE.Euler(0.62, 0.12, 0.42), new THREE.Euler(-0.24, 1.42, -0.22), new THREE.Euler(1.26, 0.24, 0.94), new THREE.Euler(0.18, 0.86, 1.14), new THREE.Euler(-0.56, 0.44, -0.82)],
                splitPosition: [new THREE.Vector3(0.14, 0.0, 0.03), new THREE.Vector3(-0.04, 0.04, -0.03), new THREE.Vector3(-0.1, -0.06, 0.08), new THREE.Vector3(0.02, 0.12, -0.08), new THREE.Vector3(0.0, -0.12, 0.04)],
                splitArc: [Math.PI * 0.68, Math.PI * 0.78, Math.PI * 0.64, Math.PI * 0.72, Math.PI * 0.58],
                splitRadius: [0.5, 0.44, 0.38, 0.32, 0.26],
                crackLines: [
                    [new THREE.Vector3(-0.22, 0.04, -0.06), new THREE.Vector3(-0.06, 0.16, 0.1), new THREE.Vector3(0.14, -0.02, 0.04)],
                    [new THREE.Vector3(-0.16, -0.12, 0.12), new THREE.Vector3(0.0, 0.06, -0.14), new THREE.Vector3(0.2, 0.16, 0.08)],
                    [new THREE.Vector3(-0.08, 0.0, -0.16), new THREE.Vector3(0.08, -0.14, 0.02), new THREE.Vector3(0.22, 0.06, 0.12)]
                ],
                shardCount: 14,
                shardRadius: 0.74,
                coreType: 'rift',
                duration: 0.96,
                baseScale: 0.062,
                maxScale: 4.95,
                fadeStart: 0.36,
                opacityBase: 0.84,
                rotation: new THREE.Vector3(0.058, 0.076, 0.042),
                silhouetteScale: new THREE.Vector3(1.22, 0.80, 0.86),
                silhouetteWindow: 0.22,
                silhouetteTwist: new THREE.Vector3(-0.14, 0.26, -0.22),
                accentWindow: 0.10,
                accentBoost: 0.78,
                pulseSpeed: 9.2,
                pulseDepth: 0.3,
                roleBias: { split: 1.02, shard: 1.26, crack: 0.84, core: 1.18, rupture: 1.22, seed: 0.92, void: 1.1, sideShard: 1.34 },
                sharedGeometries: new Set()
            }
        ];

        const variantIndex = this._pickBurstVariantIndex('fracture', context, profiles);
        const profile = profiles[variantIndex];
        burst.name = `FractureBurst_${profile.name}`;
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
            if (profile.coreType === 'rift') {
                const root = new THREE.Group();
                root.name = 'FractureRiftCore';

                const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.14, 0.032, 36, 8, 2, 3), ringMaterials.core);
                knot.rotation.set(0.6, -0.24, 0.18);
                knot.scale.set(1.0, 0.9, 1.05);
                knot.userData = { role: 'core', baseOpacity: 0.98, spin: new THREE.Vector3(0.05, 0.06, 0.04), phase: Math.random() * Math.PI * 2 };
                root.add(knot);

                const voidRing = new THREE.Mesh(this.baseGeometry, ringMaterials.rupture);
                voidRing.scale.set(0.44, 0.1, 0.44);
                voidRing.rotation.set(1.54, 0.3, 0.2);
                voidRing.userData = { role: 'void', baseOpacity: 0.66, spin: new THREE.Vector3(0.024, 0.03, 0.026), phase: Math.random() * Math.PI * 2 };
                root.add(voidRing);

                const slit = buildTube([
                    new THREE.Vector3(-0.16, -0.04, 0.0),
                    new THREE.Vector3(-0.02, 0.1, 0.08),
                    new THREE.Vector3(0.16, -0.02, -0.04)
                ], 0.012, 12, 4, false, ringMaterials.rupture);
                slit.rotation.set(0.22, 0.34, 0.72);
                root.add(slit);

                return root;
            }

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

        if (profile.name === 'NullRift') {
            const accentSpecs = [
                { name: 'FractureHeroSideShardA_NullRift', position: new THREE.Vector3(0.72, 0.18, 0.08), rotation: new THREE.Euler(0.98, 0.22, 0.14), scale: new THREE.Vector3(1.26, 1.34, 1.06), opacity: 0.92 },
                { name: 'FractureHeroSideShardB_NullRift', position: new THREE.Vector3(0.88, -0.02, 0.02), rotation: new THREE.Euler(0.84, 0.48, -0.18), scale: new THREE.Vector3(1.12, 1.18, 0.96), opacity: 0.86 },
                { name: 'FractureHeroSideShardC_NullRift', position: new THREE.Vector3(0.58, 0.28, -0.08), rotation: new THREE.Euler(1.08, -0.12, 0.28), scale: new THREE.Vector3(0.98, 1.08, 0.92), opacity: 0.82 }
            ];
            for (const [index, spec] of accentSpecs.entries()) {
                const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.038, 0.44, 6, 1, true), index === 0 ? ringMaterials.rupture : ringMaterials.shard);
                shard.name = spec.name;
                shard.position.copy(spec.position);
                shard.rotation.copy(spec.rotation);
                shard.scale.copy(spec.scale);
                this._configureFirstFrameAccent(shard, {
                    role: 'sideShard',
                    window: profile.accentWindow,
                    boost: profile.accentBoost,
                    baseScale: spec.scale.clone().multiplyScalar(0.62),
                    accentScale: spec.scale,
                    phaseShift: 0.6 + index * 0.42,
                    spin: new THREE.Vector3(0.024, 0.032, 0.02)
                });
                shard.material.opacity = spec.opacity;
                burst.add(shard);
            }
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

        const profiles = [
            {
                name: 'CathedralMonument',
                tag: 'cathedralMonument',
                weight: 1.05,
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
                tag: 'cathedralNave',
                weight: 1.0,
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
                tag: 'cathedralVault',
                weight: 1.35,
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
            },
            {
                name: 'SanctumSpire',
                tag: 'sanctumSpire',
                weight: 1.75,
                ringHeights: [0.34, 0.16, 0.0, -0.16, -0.34],
                ringScales: [new THREE.Vector3(1.18, 0.2, 1.18), new THREE.Vector3(1.1, 0.18, 1.1), new THREE.Vector3(1.0, 0.16, 1.0), new THREE.Vector3(0.92, 0.14, 0.92), new THREE.Vector3(0.84, 0.12, 0.84)],
                ringRotations: [new THREE.Euler(1.58, 0.02, 0.16), new THREE.Euler(1.54, 0.1, 0.2), new THREE.Euler(1.52, 0.18, 0.24), new THREE.Euler(1.5, 0.28, 0.28), new THREE.Euler(1.48, 0.38, 0.32)],
                pillarCount: 12,
                pillarRadius: 0.58,
                pillarHeight: 1.18,
                archCount: 4,
                coreType: 'spire',
                duration: 1.32,
                baseScale: 0.08,
                maxScale: 5.35,
                fadeStart: 0.72,
                opacityBase: 0.58,
                rotation: new THREE.Vector3(0.01, 0.016, 0.008),
                silhouetteScale: new THREE.Vector3(1.10, 1.42, 1.10),
                silhouetteWindow: 0.20,
                silhouetteTwist: new THREE.Vector3(0.06, 0.18, 0.04),
                accentWindow: 0.11,
                accentBoost: 0.64,
                pulseSpeed: 1.8,
                pulseDepth: 0.08,
                roleBias: { ring: 1.0, pillar: 0.74, arch: 0.88, core: 1.2, sanctum: 1.16, spire: 1.28, lantern: 1.06, stroke: 1.24 },
                sharedGeometries: new Set([this.baseGeometry])
            }
        ];

        const variantIndex = this._pickBurstVariantIndex('cathedral', context, profiles);
        const profile = profiles[variantIndex];
        burst.name = `CathedralBurst_${profile.name}`;
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
            if (profile.coreType === 'spire') {
                const root = new THREE.Group();
                root.name = 'CathedralSanctumSpire';

                const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.16, 0.78, 8, 1, true), ringMaterials.core);
                spire.position.y = 0.12;
                spire.rotation.set(0.0, 0.18, 0.0);
                spire.userData = { role: 'spire', baseOpacity: 0.92, spin: new THREE.Vector3(0.012, 0.014, 0.01), phase: Math.random() * Math.PI * 2 };
                root.add(spire);

                const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), ringMaterials.gold);
                cap.position.y = 0.46;
                cap.scale.set(0.9, 1.1, 0.9);
                cap.rotation.set(0.28, 0.14, -0.08);
                cap.userData = { role: 'core', baseOpacity: 0.86, spin: new THREE.Vector3(0.014, 0.016, 0.012), phase: Math.random() * Math.PI * 2 };
                root.add(cap);

                const sanctumRing = new THREE.Mesh(this.outerHaloGeometry, ringMaterials.ivory);
                sanctumRing.scale.set(0.48, 0.18, 0.48);
                sanctumRing.rotation.set(1.54, 0.22, 0.16);
                sanctumRing.userData = { role: 'sanctum', baseOpacity: 0.62, spin: new THREE.Vector3(0.012, 0.014, 0.012), phase: Math.random() * Math.PI * 2 };
                root.add(sanctumRing);

                return root;
            }

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

        if (profile.name === 'SanctumSpire') {
            const strokeCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-0.58, 0.16, -0.04),
                new THREE.Vector3(-0.32, 0.42, 0.08),
                new THREE.Vector3(-0.04, 0.56, 0.12),
                new THREE.Vector3(0.26, 0.42, 0.06),
                new THREE.Vector3(0.52, 0.18, -0.02)
            ], false);
            const crownStroke = new THREE.Mesh(new THREE.TubeGeometry(strokeCurve, 22, 0.018, 5, false), ringMaterials.gold);
            crownStroke.name = 'CathedralHeroCrownStroke_SanctumSpire';
            crownStroke.position.set(0.18, 0.08, 0.06);
            crownStroke.rotation.set(0.06, 0.22, 0.18);
            crownStroke.scale.set(1.18, 1.12, 1.14);
            this._configureFirstFrameAccent(crownStroke, {
                role: 'stroke',
                window: profile.accentWindow,
                boost: profile.accentBoost,
                baseScale: new THREE.Vector3(0.84, 0.82, 0.84),
                accentScale: new THREE.Vector3(1.18, 1.12, 1.14),
                phaseShift: 0.45,
                spin: new THREE.Vector3(0.01, 0.012, 0.008)
            });
            burst.add(crownStroke);

            const crownPin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.042, 0.26, 6, 1, true), ringMaterials.ivory);
            crownPin.name = 'CathedralHeroCrownPin_SanctumSpire';
            crownPin.position.set(0.58, 0.30, 0.16);
            crownPin.rotation.set(0.42, 0.68, 0.16);
            crownPin.scale.set(1.04, 0.92, 1.04);
            this._configureFirstFrameAccent(crownPin, {
                role: 'stroke',
                window: profile.accentWindow,
                boost: 0.5,
                baseScale: new THREE.Vector3(0.76, 0.68, 0.76),
                accentScale: new THREE.Vector3(1.04, 0.92, 1.04),
                phaseShift: 1.1,
                spin: new THREE.Vector3(0.01, 0.01, 0.01)
            });
            burst.add(crownPin);
        }

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
                const motion = data.motionProfile || {};
                const easeProgress = 1.0 - Math.pow(1.0 - progress, 3);
                const currentScale = data.baseScale + (data.maxScale - data.baseScale) * easeProgress;
                const silhouetteScale = motion.silhouetteScale || null;
                const silhouetteWindow = Math.max(0.01, motion.silhouetteWindow ?? 0.18);
                const silhouetteMix = silhouetteScale ? (1.0 - clamp01(progress / silhouetteWindow)) : 0.0;
                const silhouetteEase = silhouetteMix * silhouetteMix * (3.0 - 2.0 * silhouetteMix);
                const sx = silhouetteScale ? ((1.0 - silhouetteEase) + silhouetteScale.x * silhouetteEase) : 1.0;
                const sy = silhouetteScale ? ((1.0 - silhouetteEase) + silhouetteScale.y * silhouetteEase) : 1.0;
                const sz = silhouetteScale ? ((1.0 - silhouetteEase) + silhouetteScale.z * silhouetteEase) : 1.0;
                burst.scale.set(currentScale * sx, currentScale * sy, currentScale * sz);

                // Opacity: Fade out quickly at the end
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
                    const accentWindow = Math.max(0.0, child.userData?.accentWindow ?? 0.0);
                    const accentMix = accentWindow > 0.0 ? (1.0 - clamp01(progress / accentWindow)) : 0.0;
                    const accentEase = accentMix * accentMix * (3.0 - 2.0 * accentMix);
                    if (child.userData?.accentScale && child.userData?.baseScale) {
                        const baseScale = child.userData.baseScale;
                        const accentScale = child.userData.accentScale;
                        child.scale.set(
                            baseScale.x + (accentScale.x - baseScale.x) * accentEase,
                            baseScale.y + (accentScale.y - baseScale.y) * accentEase,
                            baseScale.z + (accentScale.z - baseScale.z) * accentEase
                        );
                    }
                    const accentBoost = Number.isFinite(child.userData?.accentBoost) ? child.userData.accentBoost : 0.0;
                    child.material.opacity = opacity * roleBias * pulse * (1.0 + accentBoost * accentEase);
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
