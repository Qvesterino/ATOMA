export class FrameClock {
    constructor(targetFPS = 60) {
        this.targetFPS = targetFPS;
        this.idealDt = 1000 / targetFPS;
        this.reset();
    }

    reset() {
        this.frame = 0;
        this.dt = 0;
        this.time = 0;
        this.avgDt = 0;
        this.drift = 0;
        this._lastTime = null;
    }

    tick(now) {
        if (this._lastTime === null) {
            this._lastTime = now;
            return;
        }

        const dt = now - this._lastTime;
        this._lastTime = now;

        this.frame += 1;
        this.dt = dt;
        this.time += dt;
        this.avgDt += (dt - this.avgDt) / this.frame;
        this.drift = this.time - this.frame * this.idealDt;
    }

    getStats() {
        return {
            frame: this.frame,
            dt: this.dt,
            time: this.time,
            avgDt: this.avgDt,
            drift: this.drift,
            targetFPS: this.targetFPS
        };
    }
}
