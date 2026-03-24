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

        if (distanceSq > 1000 * 1000) return 3;
        if (distanceSq > 400 * 400) return 2;
        if (distanceSq > 120 * 120) return 1;
        return 0;
    }
}
