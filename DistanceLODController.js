export class DistanceLODController {
    constructor(camera) {
        this.camera = camera || null;
        this.performanceTier = 'FULL';
    }

    getLODLevel(position) {
        const cameraPos = this.camera?.position;
        if (!cameraPos || !position) return 0;

        const dx = position.x - cameraPos.x;
        const dy = position.y - cameraPos.y;
        const dz = position.z - cameraPos.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;

        if (distanceSq > 2500 * 2500) return 3;
        if (distanceSq > 900 * 900) return 2;
        if (distanceSq > 250 * 250) return 1;
        return 0;
    }

    getLODProfile(position) {
        const level = this.getLODLevel(position);
        return this._applyPerformanceTier(DistanceLODController.getLODProfileForLevel(level));
    }

    getColonyLODProfile(position, nearDistance = 20, farDistance = 50) {
        const level = this.getColonyLODLevel(position, nearDistance, farDistance);
        return this._applyPerformanceTier(DistanceLODController.getColonyLODProfileForLevel(level));
    }

    getColonyLODLevel(position, nearDistance = 20, farDistance = 50) {
        const cameraPos = this.camera?.position;
        if (!cameraPos || !position) return 0;

        const dx = position.x - cameraPos.x;
        const dy = position.y - cameraPos.y;
        const dz = position.z - cameraPos.z;
        const distanceSq = dx * dx + dy * dy + dz * dz;

        const nearSq = nearDistance * nearDistance;
        const farSq = farDistance * farDistance;

        if (distanceSq > farSq) return 2;
        if (distanceSq > nearSq) return 1;
        return 0;
    }

    static getLODProfileForLevel(lodLevel = 0) {
        const level = Math.max(0, Math.min(3, Number.isFinite(lodLevel) ? Math.floor(lodLevel) : 0));
        if (level >= 3) {
            return {
                level,
                visualScale: 0.35,
                particleScale: 0.15,
                motionScale: 0.45,
                cadenceScale: 4.0,
                allowParticles: true,
                allowSecondaryVfx: true
            };
        }
        if (level >= 2) {
            return {
                level,
                visualScale: 0.68,
                particleScale: 0.45,
                motionScale: 0.72,
                cadenceScale: 2.0,
                allowParticles: false,
                allowSecondaryVfx: true
            };
        }
        if (level >= 1) {
            return {
                level,
                visualScale: 0.78,
                particleScale: 0.65,
                motionScale: 0.82,
                cadenceScale: 1.5,
                allowParticles: true,
                allowSecondaryVfx: true
            };
        }
        return {
            level,
            visualScale: 1.0,
            particleScale: 1.0,
            motionScale: 1.0,
            cadenceScale: 1.0,
            allowParticles: true,
            allowSecondaryVfx: true
        };
    }

    static getColonyLODProfileForLevel(lodLevel = 0) {
        const level = Math.max(0, Math.min(2, Number.isFinite(lodLevel) ? Math.floor(lodLevel) : 0));
        if (level >= 2) {
            return {
                level,
                visualScale: 0.35,
                particleScale: 0,
                motionScale: 0.48,
                cadenceScale: 3.0,
                allowAtmosphere: true,
                allowGlow: false,
                allowCore: false,
                allowCanopy: false,
                allowParticles: false,
                allowRings: false,
                maxRings: 0,
                allowBeam: false
            };
        }
        if (level >= 1) {
            return {
                level,
                visualScale: 0.7,
                particleScale: 0,
                motionScale: 0.72,
                cadenceScale: 1.9,
                allowAtmosphere: true,
                allowGlow: true,
                allowCore: true,
                allowCanopy: false,
                allowParticles: false,
                allowRings: true,
                maxRings: 2,
                allowBeam: false
            };
        }
        return {
            level,
            visualScale: 1.0,
            particleScale: 1.0,
            motionScale: 1.0,
            cadenceScale: 1.0,
            allowAtmosphere: true,
            allowGlow: true,
            allowCore: true,
            allowCanopy: true,
            allowParticles: true,
            allowRings: true,
            maxRings: 6,
            allowBeam: true
        };
    }

    setPerformanceTier(tier = 'FULL') {
        const normalized = typeof tier === 'string' ? tier.toUpperCase() : 'FULL';
        if (normalized === 'SAFE' || normalized === 'PERFORMANCE' || normalized === 'BALANCED') {
            this.performanceTier = normalized;
        } else {
            this.performanceTier = 'FULL';
        }
        return this.performanceTier;
    }

    getPerformanceTier() {
        return this.performanceTier || 'FULL';
    }

    _applyPerformanceTier(profile = {}) {
        const tier = this.getPerformanceTier();
        if (tier === 'FULL') {
            return { ...profile, performanceTier: tier };
        }

        const next = {
            ...profile,
            performanceTier: tier
        };

        if (tier === 'BALANCED') {
            next.particleScale = (profile.particleScale ?? 1) * 0.9;
            next.motionScale = (profile.motionScale ?? 1) * 0.94;
            next.cadenceScale = (profile.cadenceScale ?? 1) * 1.12;
            if (Number.isFinite(profile.maxRings)) {
                next.maxRings = Math.max(1, Math.floor(profile.maxRings * 0.85));
            }
            return next;
        }

        if (tier === 'PERFORMANCE') {
            next.visualScale = (profile.visualScale ?? 1) * 0.92;
            next.particleScale = (profile.particleScale ?? 1) * 0.72;
            next.motionScale = (profile.motionScale ?? 1) * 0.86;
            next.cadenceScale = (profile.cadenceScale ?? 1) * 1.38;
            if (profile.level >= 2 && 'allowParticles' in next) {
                next.allowParticles = false;
            }
            if (Number.isFinite(profile.maxRings)) {
                next.maxRings = Math.max(1, Math.floor(profile.maxRings * 0.66));
            }
            if (profile.level >= 1 && 'allowBeam' in next) {
                next.allowBeam = false;
            }
            return next;
        }

        next.visualScale = (profile.visualScale ?? 1) * 0.84;
        next.particleScale = (profile.particleScale ?? 1) * 0.48;
        next.motionScale = (profile.motionScale ?? 1) * 0.74;
        next.cadenceScale = (profile.cadenceScale ?? 1) * 1.85;
        if ('allowParticles' in next) {
            next.allowParticles = profile.level <= 0 ? next.allowParticles : false;
        }
        if (profile.level >= 1 && 'allowSecondaryVfx' in next) {
            next.allowSecondaryVfx = false;
        }
        if (Number.isFinite(profile.maxRings)) {
            next.maxRings = Math.max(0, Math.floor(profile.maxRings * 0.4));
        }
        if (profile.level >= 1 && 'allowBeam' in next) {
            next.allowBeam = false;
        }
        if (profile.level >= 1 && 'allowGlow' in next) {
            next.allowGlow = false;
        }
        if (profile.level >= 1 && 'allowCanopy' in next) {
            next.allowCanopy = false;
        }
        return next;
    }
}
