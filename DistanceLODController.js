export class DistanceLODController {
    constructor(camera) {
        this.camera = camera || null;
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
        return DistanceLODController.getLODProfileForLevel(level);
    }

    getColonyLODProfile(position, nearDistance = 20, farDistance = 50) {
        const level = this.getColonyLODLevel(position, nearDistance, farDistance);
        return DistanceLODController.getColonyLODProfileForLevel(level);
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
}
