import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const METRIC_COLOR_MAP = {
    stability: {
        primary: 0xc4a300,
        accent: 0xffe066
    },
    synergy: {
        primary: 0x00eaff,
        accent: 0xa6ffff
    },
    harmony: {
        primary: 0x00ffcc,
        accent: 0xb6ffe6
    },
    corruption: {
        primary: 0xff0033,
        accent: 0xff6a8a
    },
    loadPressure: {
        primary: 0x7a3cff,
        accent: 0xc2a6ff
    }
};

export class LinkSemanticPictogramGlyphBuilders {
    constructor({ getGeometryFromCache, getMaterialFromPool }) {
        this.getGeometryFromCache = getGeometryFromCache;
        this.getMaterialFromPool = getMaterialFromPool;
    }

    _getMetricColors(metricType = 'stability') {
        return METRIC_COLOR_MAP[metricType] || METRIC_COLOR_MAP.stability;
    }

    _normalizeGlyphSize(size, fallback = 1.0) {
        const numericSize = Number.isFinite(size) ? Math.abs(size) : fallback;
        return Math.max(0.18, numericSize || fallback);
    }

    _createGlyphGroup(renderOrder) {
        const group = new THREE.Group();
        group.renderOrder = renderOrder;
        group.frustumCulled = false;
        return group;
    }

    buildOrbitalGlyph(size, metricType = 'loadPressure', metricValue = 1.0) {
        const pictoRO =
            (VisualHierarchyRegistry.getRenderOrder && VisualHierarchyRegistry.getRenderOrder('LINK_PICTO')) ||
            246;
        const container = this._createGlyphGroup(pictoRO);
        const glyphSize = this._normalizeGlyphSize(size);

        let glyph = null;
        switch (metricType) {
            case 'synergy':
                glyph = this.buildSynergyArrowCluster(glyphSize, pictoRO, metricType, metricValue);
                break;
            case 'harmony':
                glyph = this.buildHarmonyGlyph(glyphSize, pictoRO, metricType, metricValue);
                break;
            case 'stability':
                glyph = this.buildStabilityGlyph(glyphSize, pictoRO, metricType, metricValue);
                break;
            case 'corruption':
                glyph = this.buildCorruptionGlyph(glyphSize, pictoRO, metricType, metricValue);
                break;
            case 'loadPressure':
            default:
                glyph = this.buildLoadPressureGlyph(glyphSize, pictoRO, metricType, metricValue);
                break;
        }

        if (glyph) {
            glyph.renderOrder = pictoRO;
            container.add(glyph);
            if (glyph.userData) {
                container.userData = { ...container.userData, ...glyph.userData };
            }
        }

        return container;
    }

    buildLoadPressureGlyph(size = 1.0, renderOrder = 246, metricType = 'loadPressure', metricValue = 1.0) {
        const colors = this._getMetricColors(metricType);
        const intensity = THREE.MathUtils.clamp(metricValue, 0, 1);
        const scale = this._normalizeGlyphSize(size);
        const group = this._createGlyphGroup(renderOrder);
        const coreMat = this.getMaterialFromPool(colors.primary, 0.9, THREE.AdditiveBlending);
        const haloMat = this.getMaterialFromPool(colors.accent, 0.22 + intensity * 0.1, THREE.AdditiveBlending);
        const orbitAccentMat = this.getMaterialFromPool(colors.accent, 0.45 + intensity * 0.2, THREE.AdditiveBlending);
        const sparkMat = this.getMaterialFromPool(colors.accent, 0.85 + intensity * 0.1, THREE.AdditiveBlending);

        const core = new THREE.Mesh(this.getGeometryFromCache('torus_core'), coreMat);
        core.rotation.x = Math.PI / 3.6;
        core.scale.setScalar(0.92 * scale);
        core.renderOrder = renderOrder;
        group.add(core);

        const pulseShell = new THREE.Mesh(this.getGeometryFromCache('torus_harmony'), haloMat);
        pulseShell.rotation.x = Math.PI / 2;
        pulseShell.scale.setScalar(0.86 * scale);
        pulseShell.renderOrder = renderOrder;
        group.add(pulseShell);

        const orbit1 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), coreMat);
        orbit1.rotation.x = Math.PI / 6;
        orbit1.scale.setScalar(0.82 * scale);
        orbit1.renderOrder = renderOrder;
        group.add(orbit1);

        const orbit2 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), coreMat);
        orbit2.rotation.set(Math.PI / 4.4, Math.PI / 8, Math.PI / 6);
        orbit2.scale.setScalar(0.76 * scale);
        orbit2.renderOrder = renderOrder;
        group.add(orbit2);

        const orbit3 = new THREE.Mesh(this.getGeometryFromCache('torus_small'), orbitAccentMat);
        orbit3.rotation.set(Math.PI / 2.15, Math.PI / 5, -Math.PI / 4);
        orbit3.scale.setScalar(0.6 * scale);
        orbit3.renderOrder = renderOrder;
        group.add(orbit3);

        const crest = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), orbitAccentMat);
        crest.position.set(0, 0.05 * scale, 0.04 * scale);
        crest.scale.setScalar(0.1 * scale);
        crest.renderOrder = renderOrder;
        group.add(crest);

        const sparks = [];
        const sparkOffsets = [
            [-0.14, 0.0, 0.0],
            [0.0, 0.1, 0.04],
            [0.14, -0.01, -0.02],
            [0.0, -0.1, 0.02]
        ];
        sparkOffsets.forEach(([x, y, z], index) => {
            const spark = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), sparkMat);
            spark.renderOrder = renderOrder;
            spark.position.set(x * scale, y * scale, z * scale);
            spark.scale.setScalar((0.05 + index * 0.01) * scale);
            group.add(spark);
            sparks.push(spark);
        });

        group.userData.kind = 'loadPressure';
        group.userData.orbit1 = orbit1;
        group.userData.orbit2 = orbit2;
        group.userData.orbit3 = orbit3;
        group.userData.pulseShell = pulseShell;
        group.userData.spark = sparks[0];
        group.userData.sparks = sparks;
        group.userData.sparkOrbitRadius = 0.29 * scale;
        group.userData.pressureCrest = crest;
        return group;
    }

    buildSynergyArrowCluster(size, renderOrder, metricType = 'synergy', metricValue = 1.0) {
        const colors = this._getMetricColors(metricType);
        const intensity = THREE.MathUtils.clamp(metricValue, 0, 1);
        const scale = this._normalizeGlyphSize(size);
        const cluster = this._createGlyphGroup(renderOrder);
        const mat = this.getMaterialFromPool(colors.primary, 0.6 + intensity * 0.4, THREE.AdditiveBlending);
        const bridgeMat = this.getMaterialFromPool(colors.accent, 0.35 + intensity * 0.35, THREE.AdditiveBlending);

        const ringA = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringA.position.set(-0.16 * scale, -0.02 * scale, 0.0);
        ringA.rotation.y = Math.PI / 2;
        ringA.rotation.z = Math.PI / 10;
        ringA.scale.setScalar(0.78 * scale);
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringB.position.set(0.16 * scale, -0.02 * scale, 0.0);
        ringB.rotation.y = Math.PI / 2;
        ringB.rotation.z = -Math.PI / 10;
        ringB.scale.setScalar(0.78 * scale);
        ringB.renderOrder = renderOrder;

        const ringC = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringC.position.set(0.0, 0.14 * scale, 0.0);
        ringC.rotation.x = Math.PI / 2;
        ringC.rotation.z = Math.PI / 2;
        ringC.scale.setScalar(0.66 * scale);
        ringC.renderOrder = renderOrder;

        const bridge = new THREE.Mesh(this.getGeometryFromCache('box_beam'), bridgeMat);
        bridge.scale.set(0.48 * scale, 0.14 * scale, 0.14 * scale);
        bridge.rotation.z = Math.PI / 2;
        bridge.renderOrder = renderOrder;
        const bridgeCore = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), mat);
        bridgeCore.scale.setScalar(0.11 * scale);
        bridgeCore.renderOrder = renderOrder;
        bridge.add(bridgeCore);

        cluster.add(ringA, ringB, ringC, bridge);

        cluster.userData.synergyArrows = [ringA, ringB, ringC];
        cluster.userData.synergyBridge = bridge;
        cluster.userData.baseScale = 0.78 * scale;
        cluster.userData.phase = Math.random() * Math.PI * 2;
        cluster.userData.spinSpeed = 0.8;
        cluster.userData.kind = 'synergy';
        return cluster;
    }

    buildHarmonyGlyph(size = 1.0, renderOrder = 246, metricType = 'harmony', metricValue = 1.0) {
        const colors = this._getMetricColors(metricType);
        const intensity = THREE.MathUtils.clamp(metricValue, 0, 1);
        const scale = this._normalizeGlyphSize(size);
        const group = this._createGlyphGroup(renderOrder);
        const mat = this.getMaterialFromPool(colors.primary, 0.7 + intensity * 0.3, THREE.AdditiveBlending);
        const auraMat = this.getMaterialFromPool(colors.accent, 0.32 + intensity * 0.12, THREE.AdditiveBlending);
        const coreMat = this.getMaterialFromPool(0xffffff, 0.9, THREE.AdditiveBlending);

        const ringA = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringA.position.set(-0.11 * scale, 0.015 * scale, 0);
        ringA.rotation.z = Math.PI / 9;
        ringA.scale.setScalar(0.8 * scale);
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringB.position.set(0.11 * scale, -0.015 * scale, 0);
        ringB.rotation.y = Math.PI / 2;
        ringB.rotation.z = -Math.PI / 9;
        ringB.scale.setScalar(0.8 * scale);
        ringB.renderOrder = renderOrder;

        const haloRing = new THREE.Mesh(this.getGeometryFromCache('torus_harmony'), auraMat);
        haloRing.rotation.x = Math.PI / 2;
        haloRing.scale.setScalar(0.7 * scale);
        haloRing.renderOrder = renderOrder;

        const core = new THREE.Mesh(this.getGeometryFromCache('sphere_core'), coreMat);
        core.scale.setScalar(0.92 * scale);
        core.renderOrder = renderOrder;

        const upperPulse = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), auraMat);
        upperPulse.position.set(0, 0.16 * scale, 0.03 * scale);
        upperPulse.scale.setScalar(0.05 * scale);
        upperPulse.renderOrder = renderOrder;

        const lowerPulse = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), auraMat);
        lowerPulse.position.set(0, -0.16 * scale, -0.03 * scale);
        lowerPulse.scale.setScalar(0.05 * scale);
        lowerPulse.renderOrder = renderOrder;

        group.add(ringA, ringB, haloRing, core, upperPulse, lowerPulse);

        group.userData.harmonyRings = [ringA, ringB, haloRing];
        group.userData.harmonyCore = core;
        group.userData.harmonyPulses = [upperPulse, lowerPulse];
        group.userData.rotors = [ringA, ringB];
        group.userData.kind = 'harmony';
        return group;
    }

    buildStabilityGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const coreMat = this.getMaterialFromPool(0x5a2ea6, 1.0, THREE.AdditiveBlending);

        const core = new THREE.Mesh(this.getGeometryFromCache('torus_core'), coreMat);
        core.renderOrder = renderOrder;
        group.add(core);

        const orbitMat = this.getMaterialFromPool(0x5a2ea6, 1.0, THREE.AdditiveBlending);
        const orbit1 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), orbitMat);
        orbit1.renderOrder = renderOrder;
        group.add(orbit1);

        const orbit2 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), orbitMat);
        orbit2.rotation.set(Math.PI / 4, 0, Math.PI / 6);
        orbit2.renderOrder = renderOrder;
        group.add(orbit2);

        const sparkMat = this.getMaterialFromPool(0xffaa33, 1.0, THREE.AdditiveBlending);
        const spark = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), sparkMat);
        spark.renderOrder = renderOrder;
        group.add(spark);

        group.userData.orbit1 = orbit1;
        group.userData.orbit2 = orbit2;
        group.userData.spark = spark;
        group.userData.sparkOrbitRadius = orbit1.geometry.parameters.radius * size;
        return group;
    }
    buildCorruptionGlyph(size = 1.0, renderOrder = 246, metricType = 'corruption', metricValue = 1.0) {
        const colors = this._getMetricColors(metricType);
        const intensity = THREE.MathUtils.clamp(metricValue, 0, 1);
        const scale = this._normalizeGlyphSize(size);
        const group = this._createGlyphGroup(renderOrder);
        const mat = this.getMaterialFromPool(colors.primary, 0.6 + intensity * 0.4, THREE.AdditiveBlending);
        const shardMat = this.getMaterialFromPool(colors.accent, 0.9 + intensity * 0.05, THREE.AdditiveBlending);
        const coreMat = this.getMaterialFromPool(colors.primary, 0.88, THREE.AdditiveBlending);

        const segCount = 6;
        const outerRadius = 0.28 * scale;

        const segments = [];
        const shards = [];

        const core = new THREE.Mesh(this.getGeometryFromCache('sphere_core'), coreMat);
        core.scale.setScalar(0.98 * scale);
        core.renderOrder = renderOrder;
        group.add(core);

        for (let i = 0; i < segCount; i++) {
            const segGeom = this.getGeometryFromCache('torus_arc').clone();
            segGeom.scale(scale * 0.84, scale * 0.84, 1);
            const seg = new THREE.Mesh(segGeom, mat);
            seg.rotation.z = i * (Math.PI * 2 / segCount) + (Math.random() - 0.5) * 0.24;
            seg.position.x += (Math.sin(i * 1.3) * 0.05 + (Math.random() - 0.5) * 0.02) * scale;
            seg.position.y += (Math.cos(i * 0.9) * 0.03) * scale;
            seg.position.z += (Math.sin(i * 0.6) * 0.02) * scale;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        for (let i = 0; i < 5; i++) {
            const segGeom = this.getGeometryFromCache('torus_arc').clone();
            segGeom.scale(scale * 0.98, scale * 0.82, 1);
            const seg = new THREE.Mesh(segGeom, mat);
            seg.rotation.z = -i * (Math.PI * 2 / 5) + (Math.random() - 0.5) * 0.24;
            seg.position.x += (Math.sin(i * 1.1 + 0.5) * 0.06 + (Math.random() - 0.5) * 0.03) * scale;
            seg.position.y += (Math.cos(i * 1.2 + 0.3) * 0.022) * scale;
            seg.position.z -= (Math.cos(i * 0.5) * 0.018) * scale;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        for (let i = 0; i < 6; i++) {
            const shard = new THREE.Mesh(this.getGeometryFromCache('box_shard'), shardMat);
            shard.scale.set(0.03 * scale, 0.16 * scale, 0.028 * scale);
            const angle = (Math.PI * 2 * i / 6) + (Math.random() - 0.5) * 0.32;
            const radius = outerRadius + 0.03 * scale + Math.random() * 0.07 * scale;
            shard.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                (Math.random() - 0.5) * 0.12 * scale
            );
            shard.rotation.z = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            shard.rotation.x = (Math.random() - 0.5) * 0.6;
            shard.renderOrder = renderOrder;
            shard.userData.basePosition = shard.position.clone();
            shard.userData.phase = Math.random() * Math.PI * 2;
            group.add(shard);
            shards.push(shard);
        }

        group.userData.kind = 'corruption';
        group.userData.rotors = segments;
        group.userData.corruptionSegments = segments;
        group.userData.corruptionShards = shards;
        group.userData.corruptionCore = core;
        group.userData.spinSpeed = 0.25;
        group.userData.flickerPhase = Math.random() * Math.PI * 2;
        return group;
    }
}
