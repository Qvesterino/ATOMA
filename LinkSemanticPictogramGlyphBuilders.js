import * as THREE from 'three';
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

export class LinkSemanticPictogramGlyphBuilders {
    constructor({ getGeometryFromCache, getMaterialFromPool }) {
        this.getGeometryFromCache = getGeometryFromCache;
        this.getMaterialFromPool = getMaterialFromPool;
    }

    buildOrbitalGlyph(size, metricType = 'loadPressure') {
        const pictoRO =
            (VisualHierarchyRegistry.getRenderOrder && VisualHierarchyRegistry.getRenderOrder('LINK_PICTO')) ||
            246;
        const container = new THREE.Group();
        container.scale.setScalar(1.0);
        container.renderOrder = pictoRO;
        container.frustumCulled = false;

        let glyph = null;
        switch (metricType) {
            case 'synergy':
                glyph = this.buildSynergyArrowCluster(size, pictoRO);
                break;
            case 'harmony':
                glyph = this.buildHarmonyGlyph(size, pictoRO);
                break;
            case 'stability':
                glyph = this.buildStabilityGlyph(size, pictoRO);
                break;
            case 'corruption':
                glyph = this.buildCorruptionGlyph(size, pictoRO);
                break;
            case 'loadPressure':
            default:
                glyph = this.buildLoadPressureGlyph(size, pictoRO);
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

    buildLoadPressureGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const coreMat = this.getMaterialFromPool(0x5a2ea6, 1.0, THREE.AdditiveBlending);
        const haloMat = this.getMaterialFromPool(0x8d77ff, 0.22, THREE.AdditiveBlending);
        const orbitAccentMat = this.getMaterialFromPool(0x7d4cff, 0.45, THREE.AdditiveBlending);
        const sparkMat = this.getMaterialFromPool(0xffaa33, 1.0, THREE.AdditiveBlending);

        const core = new THREE.Mesh(this.getGeometryFromCache('torus_core'), coreMat);
        core.scale.setScalar(1.06 * size);
        core.renderOrder = renderOrder;
        group.add(core);

        const pulseShell = new THREE.Mesh(this.getGeometryFromCache('torus_harmony'), haloMat);
        pulseShell.rotation.x = Math.PI / 2;
        pulseShell.scale.setScalar(0.98 * size);
        pulseShell.renderOrder = renderOrder;
        group.add(pulseShell);

        const orbit1 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), coreMat);
        orbit1.scale.setScalar(size);
        orbit1.renderOrder = renderOrder;
        group.add(orbit1);

        const orbit2 = new THREE.Mesh(this.getGeometryFromCache('torus_orbit'), coreMat);
        orbit2.rotation.set(Math.PI / 4, 0, Math.PI / 6);
        orbit2.scale.setScalar(size);
        orbit2.renderOrder = renderOrder;
        group.add(orbit2);

        const orbit3 = new THREE.Mesh(this.getGeometryFromCache('torus_small'), orbitAccentMat);
        orbit3.rotation.set(Math.PI / 2.3, Math.PI / 5, -Math.PI / 5);
        orbit3.scale.setScalar(size);
        orbit3.renderOrder = renderOrder;
        group.add(orbit3);

        const sparks = [];
        for (let i = 0; i < 3; i++) {
            const spark = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), sparkMat);
            spark.renderOrder = renderOrder;
            spark.position.set((i - 1) * 0.08 * size, i === 1 ? 0.03 * size : 0, i === 1 ? 0.06 * size : 0);
            spark.scale.setScalar(size);
            group.add(spark);
            sparks.push(spark);
        }

        group.userData.kind = 'loadPressure';
        group.userData.orbit1 = orbit1;
        group.userData.orbit2 = orbit2;
        group.userData.orbit3 = orbit3;
        group.userData.pulseShell = pulseShell;
        group.userData.spark = sparks[0];
        group.userData.sparks = sparks;
        group.userData.sparkOrbitRadius = orbit1.geometry.parameters.radius * size;
        return group;
    }

    buildSynergyArrowCluster(size, renderOrder) {
        const cluster = new THREE.Group();
        const mat = this.getMaterialFromPool(0x66ffff, 1.0, THREE.AdditiveBlending);
        const bridgeMat = this.getMaterialFromPool(0xc9ffff, 0.42, THREE.AdditiveBlending);
        const scale = Math.max(0.1, size || 1.0);

        const ringA = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringA.position.set(-0.14 * scale, 0.0, 0.0);
        ringA.rotation.y = Math.PI / 2;
        ringA.scale.setScalar(scale);
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringB.position.set(0.14 * scale, 0.0, 0.0);
        ringB.rotation.y = Math.PI / 2;
        ringB.scale.setScalar(scale);
        ringB.renderOrder = renderOrder;

        const ringC = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringC.position.set(0.0, 0.12 * scale, 0.0);
        ringC.rotation.x = Math.PI / 2;
        ringC.scale.setScalar(scale);
        ringC.renderOrder = renderOrder;

        const bridge = new THREE.Mesh(this.getGeometryFromCache('box_beam'), bridgeMat);
        bridge.scale.set(0.45 * scale, 0.18 * scale, 0.18 * scale);
        bridge.rotation.z = Math.PI / 2;
        bridge.renderOrder = renderOrder;

        cluster.add(ringA);
        cluster.add(ringB);
        cluster.add(ringC);
        cluster.add(bridge);

        cluster.userData.synergyArrows = [ringA, ringB, ringC];
        cluster.userData.synergyBridge = bridge;
        cluster.userData.baseScale = scale;
        cluster.userData.phase = Math.random() * Math.PI * 2;
        cluster.userData.spinSpeed = 0.8;
        cluster.userData.kind = 'synergy';
        return cluster;
    }

    buildHarmonyGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = this.getMaterialFromPool(0x00ffff, 1.0, THREE.AdditiveBlending);
        const auraMat = this.getMaterialFromPool(0x8efcff, 0.32, THREE.AdditiveBlending);
        const coreMat = this.getMaterialFromPool(0xffffff, 0.9, THREE.AdditiveBlending);

        const ringA = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringA.position.set(-size * 0.12, 0, 0);
        ringA.renderOrder = renderOrder;

        const ringB = new THREE.Mesh(this.getGeometryFromCache('torus_small'), mat);
        ringB.position.set(size * 0.12, 0, 0);
        ringB.rotation.y = Math.PI / 2;
        ringB.renderOrder = renderOrder;

        const haloRing = new THREE.Mesh(this.getGeometryFromCache('torus_harmony'), auraMat);
        haloRing.rotation.x = Math.PI / 2;
        haloRing.scale.setScalar(0.78 * size);
        haloRing.renderOrder = renderOrder;

        const core = new THREE.Mesh(this.getGeometryFromCache('sphere_core'), coreMat);
        core.scale.setScalar(1.2 * size);
        core.renderOrder = renderOrder;

        group.add(ringA);
        group.add(ringB);
        group.add(haloRing);
        group.add(core);

        group.userData.harmonyRings = [ringA, ringB, haloRing];
        group.userData.harmonyCore = core;
        group.userData.rotors = [ringA, ringB];
        group.userData.kind = 'harmony';
        return group;
    }

    buildStabilityGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = this.getMaterialFromPool(0xffffff, 1.0, THREE.AdditiveBlending);
        const lockMat = this.getMaterialFromPool(0x9db2ff, 0.28, THREE.AdditiveBlending);

        const outer = size * 0.14;
        const inner = size * 0.08;
        const shape = new THREE.Shape();
        shape.moveTo(-outer, -outer);
        shape.lineTo(outer, -outer);
        shape.lineTo(outer, outer);
        shape.lineTo(-outer, outer);
        shape.lineTo(-outer, -outer);
        const hole = new THREE.Path();
        hole.moveTo(-inner, -inner);
        hole.lineTo(inner, -inner);
        hole.lineTo(inner, inner);
        hole.lineTo(-inner, inner);
        hole.lineTo(-inner, -inner);
        shape.holes.push(hole);

        const frameGeom = new THREE.ExtrudeGeometry(shape, {
            depth: Math.max(0.008, size * 0.006),
            bevelEnabled: false
        });
        frameGeom.rotateX(-Math.PI / 2);
        const frame = new THREE.Mesh(frameGeom, mat);
        frame.renderOrder = renderOrder;
        group.add(frame);

        const lockRing = new THREE.Mesh(this.getGeometryFromCache('torus_small'), lockMat);
        lockRing.scale.setScalar(size * 0.175);
        lockRing.renderOrder = renderOrder;
        group.add(lockRing);

        const innerGeom = this.getGeometryFromCache('plane_diamond').clone();
        innerGeom.scale(size * 0.2, size * 0.2, 1);
        const innerMesh = new THREE.Mesh(innerGeom, mat);
        innerMesh.rotation.z = Math.PI / 4;
        innerMesh.position.set(0, 0, size * 0.004);
        innerMesh.renderOrder = renderOrder;
        group.add(innerMesh);

        const anchors = [];
        const anchorMat = this.getMaterialFromPool(0xffffff, 0.95, THREE.AdditiveBlending);
        const anchorOffsets = [
            [-outer * 0.9, -outer * 0.9],
            [outer * 0.9, -outer * 0.9],
            [outer * 0.9, outer * 0.9],
            [-outer * 0.9, outer * 0.9]
        ];
        anchorOffsets.forEach(([x, y], index) => {
            const anchor = new THREE.Mesh(this.getGeometryFromCache('sphere_spark'), anchorMat);
            anchor.position.set(x, y, size * 0.009);
            anchor.scale.setScalar(size * 0.09);
            anchor.renderOrder = renderOrder;
            anchor.userData.basePosition = anchor.position.clone();
            anchor.userData.phase = index * 1.7;
            group.add(anchor);
            anchors.push(anchor);
        });

        const braceX = new THREE.Mesh(this.getGeometryFromCache('box_beam'), lockMat);
        braceX.scale.set(size * 0.225, size * 0.04, size * 0.04);
        braceX.renderOrder = renderOrder;
        group.add(braceX);

        const braceZ = new THREE.Mesh(this.getGeometryFromCache('box_beam'), lockMat);
        braceZ.scale.set(size * 0.225, size * 0.04, size * 0.04);
        braceZ.rotation.z = Math.PI / 2;
        braceZ.renderOrder = renderOrder;
        group.add(braceZ);

        group.userData.stabilityFrame = frame;
        group.userData.stabilityDiamond = innerMesh;
        group.userData.stabilityAnchors = anchors;
        group.userData.stabilityLockRing = lockRing;
        group.userData.stabilityBraces = [braceX, braceZ];
        group.userData.rotor = innerMesh;
        group.userData.kind = 'stability';
        return group;
    }

    buildCorruptionGlyph(size = 1.0, renderOrder = 246) {
        const group = new THREE.Group();
        const mat = this.getMaterialFromPool(0xff0044, 1.0, THREE.AdditiveBlending);
        const shardMat = this.getMaterialFromPool(0xff5a86, 0.92, THREE.AdditiveBlending);
        const coreMat = this.getMaterialFromPool(0x4a001b, 0.92, THREE.AdditiveBlending);

        const segCount = 7;
        const outerRadius = 0.35 * size;

        const segments = [];
        const shards = [];

        const core = new THREE.Mesh(this.getGeometryFromCache('sphere_core'), coreMat);
        core.scale.setScalar(1.15 * size);
        core.renderOrder = renderOrder;
        group.add(core);

        for (let i = 0; i < segCount; i++) {
            const segGeom = this.getGeometryFromCache('torus_arc').clone();
            segGeom.scale(size, size, 1);
            const seg = new THREE.Mesh(segGeom, mat);
            seg.rotation.z = i * (Math.PI * 2 / segCount) + (Math.random() - 0.5) * 0.18;
            seg.position.x += (Math.sin(i * 1.3) * 0.055 + (Math.random() - 0.5) * 0.022) * size;
            seg.position.y += (Math.cos(i * 0.9) * 0.035) * size;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        for (let i = 0; i < segCount; i++) {
            const segGeom = this.getGeometryFromCache('torus_arc').clone();
            segGeom.scale(size * 1.08, size, 1);
            const seg = new THREE.Mesh(segGeom, mat);
            seg.rotation.z = -i * (Math.PI * 2 / segCount) + (Math.random() - 0.5) * 0.18;
            seg.position.x += (Math.sin(i * 1.1 + 0.5) * 0.065 + (Math.random() - 0.5) * 0.03) * size;
            seg.position.y += (Math.cos(i * 1.2 + 0.3) * 0.025) * size;
            seg.renderOrder = renderOrder;
            group.add(seg);
            segments.push(seg);
        }

        for (let i = 0; i < 6; i++) {
            const shard = new THREE.Mesh(this.getGeometryFromCache('box_shard'), shardMat);
            shard.scale.set(0.035 * size, 0.18 * size, 0.03 * size);
            const angle = (Math.PI * 2 * i / 6) + (Math.random() - 0.5) * 0.32;
            const radius = outerRadius + 0.05 * size + Math.random() * 0.06 * size;
            shard.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                (Math.random() - 0.5) * 0.10 * size
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
