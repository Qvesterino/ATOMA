/**
 * LinkSurfacePhaseRipples
 * ============================================================================
 * Surface phase ripples for braided links.
 * Deterministic, length-aware, and envelope-driven.
 */

import * as THREE from 'three';

const TAU = Math.PI * 2;

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const firstFiniteValue = (...values) => {
    for (const value of values) {
        if (Number.isFinite(value)) return value;
    }
    return null;
};
const readIdentityValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
    }
    if (typeof value !== 'object') return String(value);
    const data = value.userData || {};
    return String(data.nodeId ?? data.id ?? data.linkId ?? value.uuid ?? value.name ?? '');
};
const hashStringToUnitFloat = (input) => {
    const text = String(input || '');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 4294967295;
};

export class LinkSurfacePhaseRipples {
    constructor() {
        this.config = {
            longitudinalSpeedBase: 0.3,
            angularSpeedBase: 0.02,
            angularSpeedMax: 0.08,
            phaseWavelength: 0.4,
            phaseAmplitude: 0.3,
            emissiveIntensityMin: -0.15,
            emissiveIntensityMax: 0.15,
            hueShiftMin: -4.0,
            hueShiftMax: 4.0,
            harmonySmoothing: 0.2,
            instabilityDamping: 0.8,
            corruptionJitter: 0.3,
            inactiveDecayRate: 0.08,
            lengthReference: 12.0,
            inactiveVisibility: 0.18,
            visibilityFadeOutRate: 6.0,
            visibilityFadeInRate: 3.5,
            visibilityRecoveryRate: 2.0,
            bandCountMin: 2,
            bandCountMax: 9,
            signatureInfluence: 0.35,
        };

        this._vec3 = new THREE.Vector3();
        this._hslColor = { h: 0, s: 0, l: 0 };
    }

    _resolveLinkIdentity(link) {
        const userData = link?.userData || {};
        const sourceNode = link?.source || link?.sourceNode || userData.source || userData.sourceNode;
        const targetNode = link?.target || link?.targetNode || userData.target || userData.targetNode;

        const sourceKey = readIdentityValue(sourceNode) || readIdentityValue(userData.sourceId) || readIdentityValue(userData.sourceNodeId) || 'source';
        const targetKey = readIdentityValue(targetNode) || readIdentityValue(userData.targetId) || readIdentityValue(userData.targetNodeId) || 'target';
        const linkKey = readIdentityValue(userData.linkId) || readIdentityValue(userData.id) || readIdentityValue(link?.id) || readIdentityValue(link?.uuid) || `${sourceKey}->${targetKey}`;
        const signatureKey = `${linkKey}|${sourceKey}|${targetKey}`;
        const signatureSeed = hashStringToUnitFloat(signatureKey);

        return {
            linkKey,
            sourceKey,
            targetKey,
            signatureKey,
            signatureSeed,
            signaturePhase: signatureSeed,
        };
    }

    initializeLink(link) {
        if (!link) return null;

        const ripple = link.rippleState || (link.rippleState = {});
        const identity = this._resolveLinkIdentity(link);

        if (ripple.linkKey === undefined) ripple.linkKey = identity.linkKey;
        if (ripple.sourceKey === undefined) ripple.sourceKey = identity.sourceKey;
        if (ripple.targetKey === undefined) ripple.targetKey = identity.targetKey;
        if (!Number.isFinite(ripple.signatureSeed)) ripple.signatureSeed = identity.signatureSeed;
        if (!Number.isFinite(ripple.signaturePhase)) ripple.signaturePhase = identity.signaturePhase;
        if (ripple.signatureKey === undefined) ripple.signatureKey = identity.signatureKey;
        if (!Number.isFinite(ripple.surfacePhase)) ripple.surfacePhase = 0.0;
        if (!Number.isFinite(ripple.angularPhase)) ripple.angularPhase = 0.0;
        if (!Number.isFinite(ripple.phaseOffset)) ripple.phaseOffset = 0.0;
        if (!Number.isFinite(ripple.basePhase)) ripple.basePhase = 0.0;
        if (!Number.isFinite(ripple.lastSynergy)) ripple.lastSynergy = 0.0;
        if (!Number.isFinite(ripple.transitionFactor)) ripple.transitionFactor = 0.0;
        if (!Number.isFinite(ripple.discontinuityPhase)) ripple.discontinuityPhase = 0.0;
        if (!Number.isFinite(ripple.harmonySmoothingFactor)) ripple.harmonySmoothingFactor = 0.0;
        if (!Number.isFinite(ripple.amplitudeDamping)) ripple.amplitudeDamping = 1.0;
        if (!Number.isFinite(ripple.visibilityEnvelope)) ripple.visibilityEnvelope = link.isActive === false ? 0.0 : 0.35;
        if (!Number.isFinite(ripple.targetVisibility)) ripple.targetVisibility = ripple.visibilityEnvelope;
        if (!Number.isFinite(ripple.visibilityHold)) ripple.visibilityHold = 0.0;
        if (!Number.isFinite(ripple.fadeInRate)) ripple.fadeInRate = this.config.visibilityFadeInRate;
        if (!Number.isFinite(ripple.fadeOutRate)) ripple.fadeOutRate = this.config.visibilityFadeOutRate;
        if (!Number.isFinite(ripple.energy)) ripple.energy = 0.0;
        if (!Number.isFinite(ripple.bandCount)) ripple.bandCount = this.config.bandCountMin;
        if (!Number.isFinite(ripple.bandSpacing)) ripple.bandSpacing = 1 / Math.max(1, ripple.bandCount);
        if (!Number.isFinite(ripple.bandSharpness)) ripple.bandSharpness = 1.0;
        if (!Number.isFinite(ripple.linkLength)) ripple.linkLength = 0.0;
        if (!Number.isFinite(ripple.linkLengthNormalized)) ripple.linkLengthNormalized = 1.0;
        if (!Number.isFinite(ripple.waveLength)) ripple.waveLength = 0.0;
        if (!Number.isFinite(ripple.wavePhaseOffset)) ripple.wavePhaseOffset = 0.0;
        if (!Number.isFinite(ripple.lengthFactor)) ripple.lengthFactor = 1.0;
        if (ripple.isActive === undefined) ripple.isActive = true;
        if (ripple.isDisabled === undefined) ripple.isDisabled = false;

        return ripple;
    }

    _refreshLinkMetrics(link, ripple, metrics = {}) {
        const userData = link?.userData || {};
        const curve = link?.curve;

        if (curve && curve !== ripple._curveRef && typeof curve.getLength === 'function') {
            ripple._curveRef = curve;
            try {
                const curveLength = curve.getLength();
                if (Number.isFinite(curveLength) && curveLength > 0) {
                    ripple.linkLength = curveLength;
                }
            } catch (err) {
                // Use cached values if the curve length cannot be computed safely.
            }
        }

        const linkLength = firstFiniteValue(
            metrics.linkLength,
            metrics.waveLength,
            userData.linkLength,
            userData.waveLength,
            link?.linkLength,
            link?.waveLength,
            ripple.linkLength
        );
        if (Number.isFinite(linkLength) && linkLength > 0) {
            ripple.linkLength = linkLength;
        }
        if (!Number.isFinite(ripple.linkLength) || ripple.linkLength <= 0) {
            ripple.linkLength = this.config.lengthReference;
        }

        ripple.linkLengthNormalized = clamp(ripple.linkLength / this.config.lengthReference, 0.35, 2.75);
        ripple.lengthFactor = 1 / Math.max(0.35, ripple.linkLengthNormalized);

        const waveLength = firstFiniteValue(
            metrics.waveLength,
            userData.waveLength,
            link?.waveLength,
            ripple.waveLength,
            ripple.linkLength
        );
        ripple.waveLength = Number.isFinite(waveLength) && waveLength > 0 ? waveLength : ripple.linkLength;

        const wavePhaseOffset = firstFiniteValue(
            metrics.wavePhaseOffset,
            userData.wavePhaseOffset,
            link?.wavePhaseOffset,
            ripple.wavePhaseOffset,
            ripple.signaturePhase * 0.25
        );
        ripple.wavePhaseOffset = Number.isFinite(wavePhaseOffset) ? wavePhaseOffset : ripple.signaturePhase * 0.25;

        ripple.bandCount = clamp(
            Math.round(this.config.bandCountMin + ripple.linkLengthNormalized * 1.2),
            this.config.bandCountMin,
            this.config.bandCountMax
        );
        ripple.bandSpacing = 1 / Math.max(1, ripple.bandCount);
        ripple.bandSharpness = clamp(0.85 + ripple.linkLengthNormalized * 0.08, 0.65, 1.45);

        return ripple;
    }

    _advanceVisibilityEnvelope(ripple, targetVisibility, deltaTime) {
        const current = clamp01(ripple.visibilityEnvelope ?? 0.0);
        const target = clamp01(targetVisibility);
        const rate = target < current
            ? (Number.isFinite(ripple.fadeOutRate) ? ripple.fadeOutRate : this.config.visibilityFadeOutRate)
            : (Number.isFinite(ripple.fadeInRate) ? ripple.fadeInRate : this.config.visibilityFadeInRate);
        const blend = clamp01(rate * Math.max(0, deltaTime));
        ripple.visibilityEnvelope = current + (target - current) * blend;
        return ripple.visibilityEnvelope;
    }

    update(link, metrics = {}, deltaTime = 0.016) {
        const ripple = this.initializeLink(link);
        if (!ripple) return null;

        const synergy = clamp01(metrics.synergy ?? link?.userData?.synergy ?? 0.3);
        const harmony = clamp01(metrics.harmony ?? link?.userData?.harmony ?? 0.5);
        const corruption = clamp01(metrics.corruption ?? 0.0);
        const instability = clamp01(metrics.instability ?? link?.userData?.instability ?? 0.0);
        const isActive = link?.isActive !== false;

        this._refreshLinkMetrics(link, ripple, metrics);

        if (ripple.visibilityHold > 0) {
            ripple.visibilityHold = Math.max(0, ripple.visibilityHold - Math.max(0, deltaTime));
        }

        const baseVisibility = isActive ? 1.0 : this.config.inactiveVisibility;
        const targetVisibility = ripple.visibilityHold > 0 ? 0.0 : baseVisibility;
        ripple.targetVisibility = targetVisibility;
        this._advanceVisibilityEnvelope(ripple, targetVisibility, deltaTime);

        const lengthFactor = Math.max(0.35, ripple.lengthFactor || 1.0);
        const longitudinalSpeed = this.config.longitudinalSpeedBase * (0.5 + synergy) * lengthFactor;
        ripple.surfacePhase = (ripple.surfacePhase + longitudinalSpeed * Math.max(0, deltaTime)) % 1.0;

        const angularSpeed = this.config.angularSpeedBase + synergy * (this.config.angularSpeedMax - this.config.angularSpeedBase);
        ripple.angularPhase = (ripple.angularPhase + angularSpeed * Math.max(0, deltaTime)) % TAU;

        this.updateCombinedPhase(ripple, harmony, corruption);

        ripple.harmonySmoothingFactor = harmony * this.config.harmonySmoothing;

        const instabilityDamping = 1.0 - instability * this.config.instabilityDamping;
        const activeScale = isActive ? 1.0 : 0.85;
        ripple.amplitudeDamping = Math.max(0, instabilityDamping) * ripple.visibilityEnvelope * activeScale;
        ripple.energy = ripple.amplitudeDamping * (0.35 + synergy * 0.45 + harmony * 0.2);
        ripple.bandCount = clamp(
            Math.round(this.config.bandCountMin + ripple.linkLengthNormalized * 1.1 + synergy * 2.0 + harmony * 1.5),
            this.config.bandCountMin,
            this.config.bandCountMax
        );
        ripple.bandSpacing = 1 / Math.max(1, ripple.bandCount);
        ripple.bandSharpness = clamp(0.7 + harmony * 0.45 - corruption * 0.15, 0.5, 1.55);
        ripple.lastSynergy = synergy;
        ripple.isActive = isActive;
        ripple.isDisabled = ripple.visibilityHold > 0;

        return ripple;
    }

    updateCombinedPhase(ripple, harmony, corruption) {
        const lengthPhase = ripple.surfacePhase * Math.max(0.35, ripple.linkLengthNormalized || 1.0);
        const angularContribution = ripple.angularPhase * 0.2;
        const signaturePhase = (ripple.signaturePhase || 0.0) * this.config.signatureInfluence;
        const basePhase = lengthPhase + angularContribution + signaturePhase + (ripple.wavePhaseOffset || 0.0);

        const discontinuity = Math.sin((lengthPhase + signaturePhase + (ripple.wavePhaseOffset || 0.0)) * TAU * 4.0) *
            corruption * this.config.corruptionJitter;

        ripple.basePhase = basePhase;
        ripple.discontinuityPhase = discontinuity;
        ripple.phaseOffset = basePhase + discontinuity;
        ripple.transitionFactor = harmony * this.config.harmonySmoothing;
    }

    getEmissiveModulation(link, metrics = {}) {
        const ripple = link?.rippleState;
        if (!ripple) return { intensity: 0, factor: 0 };

        const synergy = clamp01(metrics.synergy ?? 0.3);
        const harmony = clamp01(metrics.harmony ?? 0.5);
        if (ripple.visibilityEnvelope <= 0.0001) {
            return {
                intensity: 0,
                factor: 0,
                baseWave: 0,
                damping: 0,
                visibility: 0,
                energy: 0,
                bandCount: ripple.bandCount || this.config.bandCountMin,
            };
        }

        const bandCount = Math.max(this.config.bandCountMin, ripple.bandCount || this.config.bandCountMin);
        const bandCarrier = Math.sin(ripple.phaseOffset * TAU * bandCount);
        const phaseCarve = Math.sin((ripple.phaseOffset + (ripple.wavePhaseOffset || 0.0) * 0.5) * TAU * 0.5 + (ripple.signaturePhase || 0.0) * TAU);
        const microBand = Math.sin((ripple.phaseOffset * 2.0 + (ripple.signaturePhase || 0.0)) * TAU);
        const waveValue = (bandCarrier * 0.58 + phaseCarve * 0.27 + microBand * 0.15) * this.config.phaseAmplitude;

        const synergyScale = 0.42 + synergy * 0.58;
        const lengthScale = 0.88 + clamp01((ripple.linkLengthNormalized - 0.35) / 2.35) * 0.18;
        const dampenedWave = waveValue * ripple.amplitudeDamping * synergyScale * lengthScale;
        const smoothedWave = dampenedWave * (1.0 - ripple.transitionFactor * 0.45);
        const intensityScale = smoothedWave >= 0 ? this.config.emissiveIntensityMax : Math.abs(this.config.emissiveIntensityMin);
        const intensity = smoothedWave * intensityScale;

        return {
            intensity,
            factor: Math.abs(smoothedWave),
            baseWave: waveValue,
            damping: ripple.amplitudeDamping,
            visibility: ripple.visibilityEnvelope,
            energy: ripple.energy,
            bandCount,
        };
    }

    getHueShiftModulation(link, metrics = {}) {
        const ripple = link?.rippleState;
        if (!ripple) return { hueShift: 0, saturation: 0 };

        const corruption = clamp01(metrics.corruption || 0.0);
        const harmony = clamp01(metrics.harmony || 0.5);

        const waveValue = Math.sin((ripple.phaseOffset + (ripple.signaturePhase || 0.0) * 0.37) * TAU);
        const hueShift = waveValue * this.config.hueShiftMax;
        const corruptionHueScale = 1.0 + corruption * 0.5;
        const modulatedHueShift = hueShift * corruptionHueScale;
        const saturation = (0.3 + harmony * 0.4) * ripple.amplitudeDamping * Math.max(0.35, ripple.visibilityEnvelope);

        return {
            hueShift: modulatedHueShift,
            saturation: Math.max(0, saturation),
            factor: Math.abs(waveValue),
            visibility: ripple.visibilityEnvelope,
        };
    }

    getRippleVisualization(link, samples = 32) {
        const ripple = link?.rippleState;
        if (!ripple) return [];

        const safeSamples = Math.max(1, Math.floor(samples || 1));
        const result = [];
        const bandCount = Math.max(this.config.bandCountMin, ripple.bandCount || this.config.bandCountMin);
        for (let index = 0; index < safeSamples; index += 1) {
            const angle = (index / safeSamples) * TAU;
            const longitudinal = ripple.surfacePhase + (index / safeSamples) * Math.max(0.35, ripple.lengthFactor || 1.0) * 0.35;
            const samplePhase = longitudinal + angle * 0.1 + (ripple.wavePhaseOffset || 0.0);
            const waveValue = Math.sin(samplePhase * TAU * bandCount) * this.config.phaseAmplitude;

            result.push({
                angle,
                phase: samplePhase,
                wave: waveValue * ripple.amplitudeDamping * ripple.visibilityEnvelope,
            });
        }
        return result;
    }

    getDebugInfo(link) {
        const ripple = link?.rippleState;
        if (!ripple) return null;

        return {
            linkKey: ripple.linkKey,
            sourceKey: ripple.sourceKey,
            targetKey: ripple.targetKey,
            signatureSeed: ripple.signatureSeed,
            signaturePhase: ripple.signaturePhase,
            surfacePhase: ripple.surfacePhase,
            angularPhase: ripple.angularPhase,
            basePhase: ripple.basePhase,
            phaseOffset: ripple.phaseOffset,
            transitionFactor: ripple.transitionFactor,
            discontinuityPhase: ripple.discontinuityPhase,
            harmonySmoothingFactor: ripple.harmonySmoothingFactor,
            amplitudeDamping: ripple.amplitudeDamping,
            visibilityEnvelope: ripple.visibilityEnvelope,
            targetVisibility: ripple.targetVisibility,
            visibilityHold: ripple.visibilityHold,
            linkLength: ripple.linkLength,
            linkLengthNormalized: ripple.linkLengthNormalized,
            waveLength: ripple.waveLength,
            wavePhaseOffset: ripple.wavePhaseOffset,
            bandCount: ripple.bandCount,
            bandSpacing: ripple.bandSpacing,
            bandSharpness: ripple.bandSharpness,
            energy: ripple.energy,
            fadeInRate: ripple.fadeInRate,
            fadeOutRate: ripple.fadeOutRate,
            isActive: ripple.isActive,
            isDisabled: ripple.isDisabled,
        };
    }

    prepareMaterial(material) {
        if (!material || !material.uniforms) return false;

        const uniforms = material.uniforms;
        const ensureUniform = (name, value) => {
            if (!uniforms[name]) {
                uniforms[name] = { value };
            }
        };

        ensureUniform('u_rippleIntensity', 0.0);
        ensureUniform('u_ripplesActive', 0);
        ensureUniform('u_hueShift', 0.0);
        ensureUniform('u_rippleSaturation', 0.5);
        ensureUniform('u_ripplePhase', 0.0);
        ensureUniform('u_rippleEnergy', 0.0);
        ensureUniform('u_rippleLength', 1.0);
        ensureUniform('u_rippleVisibility', 0.0);
        ensureUniform('u_rippleBandCount', 2.0);
        ensureUniform('u_rippleSignature', 0.0);

        return true;
    }

    applyRipplesToMaterial(link, material, metrics = {}) {
        if (!this.prepareMaterial(material)) return;

        const emissive = this.getEmissiveModulation(link, metrics);
        const hueShift = this.getHueShiftModulation(link, metrics);
        const ripple = link?.rippleState;
        const uniforms = material.uniforms;

        if (uniforms.u_rippleIntensity) {
            uniforms.u_rippleIntensity.value = emissive.intensity;
        }
        if (uniforms.u_ripplesActive) {
            uniforms.u_ripplesActive.value = ripple?.visibilityEnvelope > 0.04 ? 1 : 0;
        }
        if (uniforms.u_hueShift) {
            uniforms.u_hueShift.value = hueShift.hueShift;
        }
        if (uniforms.u_rippleSaturation) {
            uniforms.u_rippleSaturation.value = hueShift.saturation;
        }
        if (uniforms.u_ripplePhase) {
            uniforms.u_ripplePhase.value = ripple?.phaseOffset || 0.0;
        }
        if (uniforms.u_rippleEnergy) {
            uniforms.u_rippleEnergy.value = ripple?.energy || 0.0;
        }
        if (uniforms.u_rippleLength) {
            uniforms.u_rippleLength.value = ripple?.linkLength || 1.0;
        }
        if (uniforms.u_rippleVisibility) {
            uniforms.u_rippleVisibility.value = ripple?.visibilityEnvelope || 0.0;
        }
        if (uniforms.u_rippleBandCount) {
            uniforms.u_rippleBandCount.value = ripple?.bandCount || this.config.bandCountMin;
        }
        if (uniforms.u_rippleSignature) {
            uniforms.u_rippleSignature.value = ripple?.signaturePhase || 0.0;
        }

        if (!link.materialRippleData) {
            link.materialRippleData = {};
        }
        link.materialRippleData.emissive = emissive;
        link.materialRippleData.hueShift = hueShift;
        link.materialRippleData.visibility = ripple?.visibilityEnvelope || 0.0;
        link.materialRippleData.bandCount = ripple?.bandCount || this.config.bandCountMin;
        link.materialRippleData.linkLength = ripple?.linkLength || 0.0;
    }

    getRippleBlendFactor(link, metrics = {}) {
        const ripple = link?.rippleState;
        if (!ripple) return 0;

        const synergy = clamp01(metrics.synergy || 0.3);
        const harmony = clamp01(metrics.harmony || 0.5);
        const synergyFactor = synergy * 0.8;
        const harmonyFactor = harmony > 0.3 ? (harmony - 0.3) * 0.4 : 0;

        return Math.max(0, (synergyFactor + harmonyFactor) * ripple.amplitudeDamping * (ripple.visibilityEnvelope || 0.0));
    }

    disable(link, duration = 0.5) {
        const ripple = this.initializeLink(link);
        if (!ripple) return null;

        ripple.visibilityHold = Math.max(0, duration);
        ripple.disableDuration = Math.max(0.05, duration);
        ripple.disableElapsed = 0;
        ripple.fadeOutRate = 1 / Math.max(0.04, duration * 0.55);
        ripple.fadeInRate = 1 / Math.max(0.12, duration * 1.5);
        ripple.isDisabled = true;
        ripple.targetVisibility = 0.0;

        return ripple;
    }

    reset(link) {
        if (!link) return null;
        link.rippleState = null;
        return this.initializeLink(link);
    }
}
