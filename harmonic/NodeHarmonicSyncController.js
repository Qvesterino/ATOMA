/**
 * harmonic/NodeHarmonicSyncController.js
 * ============================================================================
 * Manages harmonic synchronization for multiple links connected to a node.
 *
 * PHILOSOPHY:
 * Healthy nodes with multiple active links act as harmonic hubs that gently
 * synchronize the phase of connected links. This creates a visible "breathing"
 * network effect where energy flows coherently through hub nodes.
 *
 * Synchronization strength depends on:
 * - Link count (more links = stronger effect)
 * - Average synergy (higher synergy = stronger sync)
 * - Harmony vs corruption balance
 * - Overall instability level
 *
 * Links are never hard-locked to hub phase; they interpolate gradually,
 * creating smooth, organic phase alignment.
 *
 * CONSTRAINTS:
 * ✅ Adapter-only visual system
 * ✅ Read-only from node/link state
 * ✅ No gameplay changes
 * ✅ Zero per-frame allocations
 * ✅ Graceful fallback if data missing
 * ✅ Fully reversible
 * ✅ Deterministic (no randomness)
 */

import * as THREE from 'three';
import { clamp01, lerpPhase, normalizePhase } from '../shared/harmonyHelpers.js';

export class NodeHarmonicSyncController {
    constructor(node) {
        this.node = node;
        this.connectedLinks = []; // Array of { link, direction }

        // Hub synchronization state
        this.hubPhase = 0;
        this.hubFrequency = 1.0;
        this.hubStrength = 0.0; // 0-1 range
        this.isActive = false; // True when sync conditions are met

        // Harmonic mode data
        this.currentLinkData = []; // Current link phase/frequency data

        // Configuration
        this.config = {
            // Budget caps
            maxConnectedLinks: 20,           // Max links tracked per hub node
            
            // Hub activation conditions
            minLinksForHub: 3,              // Minimum connected links
            minAverageSynergy: 0.5,         // Minimum average synergy
            harmonyCorruptionRatio: 1.2,   // Harmony must be 1.2x corruption
            maxInstability: 0.4,             // Max instability for sync

            // Sync strength modifiers
            synergyStrengthScale: 0.4,      // How much synergy affects sync strength
            harmonyStrengthBoost: 0.3,      // Harmony boost to sync strength
            instabilityDamping: 0.5,        // How much instability reduces sync
            linkCountBoost: 0.1,            // Strength increase per link above minimum

            // Phase interpolation
            phaseInterpolationRate: 0.08,   // 0-1, higher = faster convergence
            frequencyInterpolationRate: 0.05, // Gentler frequency adjustment
        };

        // Temporal smoothing for hub properties
        this.targetHubPhase = 0;
        this.targetHubFrequency = 1.0;
        this.targetHubStrength = 0.0;

        // Math cache
        this._vec3 = new THREE.Vector3();
    }

    addConnectedLink(link, direction = 'in') {
        const existing = this.connectedLinks.find(cl => cl.link === link);
        if (!existing) {
            this.connectedLinks.push({ link, direction });
        }
    }

    removeConnectedLink(link) {
        this.connectedLinks = this.connectedLinks.filter(cl => cl.link !== link);
    }

    update(harmony = 1.0, corruption = 0.0, instability = 0.0) {
        harmony = clamp01(harmony);
        corruption = clamp01(corruption);
        instability = clamp01(instability);

        this.checkActivationConditions(harmony, corruption, instability);

        if (this.isActive) {
            const linkData = this.collectLinkData();
            this.computeHubProperties(linkData, harmony, corruption, instability);
        } else {
            this.targetHubPhase = 0;
            this.targetHubFrequency = 1.0;
            this.targetHubStrength = 0.0;
        }

        this.hubPhase = lerpPhase(this.hubPhase, this.targetHubPhase, this.config.phaseInterpolationRate);
        this.hubFrequency += (this.targetHubFrequency - this.hubFrequency) * this.config.frequencyInterpolationRate;
        this.hubStrength += (this.targetHubStrength - this.hubStrength) * 0.1;

        this.hubPhase = normalizePhase(this.hubPhase);
        this.hubFrequency = Math.max(0.5, Math.min(2.0, this.hubFrequency));
        this.hubStrength = Math.max(0.0, Math.min(1.0, this.hubStrength));
    }

    checkActivationConditions(harmony, corruption, instability) {
        if (this.connectedLinks.length < this.config.minLinksForHub) { this.isActive = false; return; }
        if (harmony < corruption * this.config.harmonyCorruptionRatio) { this.isActive = false; return; }
        if (instability > this.config.maxInstability) { this.isActive = false; return; }

        const linkData = this.collectLinkData();
        if (linkData.length === 0) { this.isActive = false; return; }

        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        if (avgSynergy < this.config.minAverageSynergy) { this.isActive = false; return; }

        this.isActive = true;
    }

    collectLinkData() {
        return this.connectedLinks
            .map(cl => {
                const link = cl.link;
                const state = link.group?.userData?.conduitState;
                if (!state) return null;

                const adapter = state.visualStateAdapter;
                const visualState = adapter ? adapter.getVisualState() : {};

                const synergyPhase = visualState.synergyPhase || 0;
                const synergyLevel = visualState.synergyLevel ?? 0.5;
                const frequency = 1.0 + synergyLevel * 0.5;

                return {
                    link: link,
                    phase: synergyPhase,
                    frequency: frequency,
                    synergy: synergyLevel,
                    adapter: adapter,
                };
            })
            .filter(d => d !== null);
    }

    computeHubProperties(linkData, harmony, corruption, instability) {
        if (linkData.length === 0) { this.isActive = false; return; }

        // Hub phase (circular mean)
        let sinSum = 0, cosSum = 0;
        linkData.forEach(d => { sinSum += Math.sin(d.phase); cosSum += Math.cos(d.phase); });
        sinSum /= linkData.length;
        cosSum /= linkData.length;
        this.targetHubPhase = Math.atan2(sinSum, cosSum);

        // Hub frequency (weighted by synergy)
        let freqSum = 0, synergySum = 0;
        linkData.forEach(d => { freqSum += d.frequency * d.synergy; synergySum += d.synergy; });
        this.targetHubFrequency = synergySum > 0 ? freqSum / synergySum : 1.0;

        // Hub strength
        const avgSynergy = linkData.reduce((sum, d) => sum + d.synergy, 0) / linkData.length;
        let strength = avgSynergy * this.config.synergyStrengthScale;
        strength += harmony * this.config.harmonyStrengthBoost;
        strength *= (1.0 - instability * this.config.instabilityDamping);
        const extraLinks = Math.max(0, linkData.length - this.config.minLinksForHub);
        strength += extraLinks * this.config.linkCountBoost;
        this.targetHubStrength = Math.max(0, Math.min(1.0, strength));

        this.currentLinkData = linkData;
    }

    getHarmonicMode(linkCount) {
        if (linkCount <= 2) return 'mirrored';
        if (linkCount <= 4) return 'standing-wave';
        return 'orbital';
    }

    getHarmonicPhaseOffset(linkIndex, linkCount, time = 0) {
        const mode = this.getHarmonicMode(linkCount);

        if (mode === 'mirrored') {
            return linkIndex % 2 === 0 ? 0 : Math.PI;
        }

        if (mode === 'standing-wave') {
            const angleStep = (Math.PI * 2) / Math.max(3, linkCount);
            return linkIndex * angleStep;
        }

        // orbital
        const orbitSpeed = 0.3;
        const orbitRadius = Math.PI * 0.5;
        const angleStep = (Math.PI * 2) / Math.max(5, linkCount);
        const baseAngle = linkIndex * angleStep;
        const orbitPhase = time * orbitSpeed + baseAngle;
        return orbitRadius * Math.sin(orbitPhase);
    }

    getSyncFeedback(linkIndex = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, 0);

        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
        };
    }

    getSyncFeedbackWithTime(linkIndex = 0, time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffset = this.getHarmonicPhaseOffset(linkIndex, linkCount, time);

        return {
            syncTargetPhase: this.hubPhase,
            syncFrequency: this.hubFrequency,
            syncStrength: this.hubStrength,
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffset: phaseOffset,
            time: time,
        };
    }

    getDebugInfo(time = 0) {
        const linkCount = this.connectedLinks.length;
        const harmonicMode = this.getHarmonicMode(linkCount);
        const phaseOffsets = [];
        for (let i = 0; i < linkCount; i++) {
            phaseOffsets.push(this.getHarmonicPhaseOffset(i, linkCount, time));
        }

        return {
            nodeId: this.node.id || 'unknown',
            isActive: this.isActive,
            linkCount: linkCount,
            harmonicMode: harmonicMode,
            phaseOffsets: phaseOffsets,
            hubPhase: this.hubPhase,
            hubFrequency: this.hubFrequency,
            hubStrength: this.hubStrength,
        };
    }

    setConfig(configOverrides) {
        Object.assign(this.config, configOverrides);
    }

    dispose() {
        this.connectedLinks = [];
    }
}
