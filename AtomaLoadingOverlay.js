const STYLE_ID = 'atoma-loading-overlay-style';
const ROOT_ID = 'atoma-loading-overlay-root';
const MIN_VISIBLE_MS = 520;
const FADE_DURATION_MS = 220;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextAnimationFrame() {
    return new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve());
            return;
        }
        setTimeout(resolve, 16);
    });
}

function normalizePayload(payload = {}) {
    return {
        title: String(payload.title || 'ATOMA TRANSITION').toUpperCase(),
        subtitle: String(payload.subtitle || 'Reweaving the active field.'),
        phase: String(payload.phase || 'PREPARING FIELD').toUpperCase(),
        variant: String(payload.variant || 'ritual').toLowerCase(),
    };
}

class AtomaLoadingOverlay {
    constructor() {
        this.root = null;
        this.titleNode = null;
        this.subtitleNode = null;
        this.phaseNode = null;
        this.trackNode = null;
        this._tokens = [];
        this._visibleSince = 0;
        this._isVisible = false;
        this._visibilityPromise = null;
        this._handleDocumentInput = (event) => {
            if (!this._isVisible) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        };
    }

    _ensureStyles() {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${ROOT_ID} {
                position: fixed;
                inset: 0;
                z-index: 2147483646;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition:
                    opacity ${FADE_DURATION_MS}ms ease,
                    visibility 0s linear ${FADE_DURATION_MS}ms;
                background:
                    radial-gradient(circle at 50% 40%, rgba(0, 214, 255, 0.08), transparent 38%),
                    radial-gradient(circle at 50% 55%, rgba(180, 77, 255, 0.12), transparent 50%),
                    linear-gradient(180deg, rgba(4, 8, 16, 0.90), rgba(2, 5, 11, 0.96));
                backdrop-filter: blur(18px) saturate(1.08);
                -webkit-backdrop-filter: blur(18px) saturate(1.08);
                overflow: hidden;
            }
            #${ROOT_ID}.is-visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
                transition:
                    opacity ${FADE_DURATION_MS}ms ease,
                    visibility 0s linear 0s;
            }
            #${ROOT_ID} .atoma-loading-overlay__scanlines,
            #${ROOT_ID} .atoma-loading-overlay__lattice {
                position: absolute;
                inset: 0;
                pointer-events: none;
            }
            #${ROOT_ID} .atoma-loading-overlay__scanlines {
                background:
                    linear-gradient(180deg, rgba(255,255,255,0.012), rgba(255,255,255,0) 36%),
                    repeating-linear-gradient(
                        180deg,
                        rgba(255,255,255,0.015) 0px,
                        rgba(255,255,255,0.015) 1px,
                        rgba(0,0,0,0) 3px,
                        rgba(0,0,0,0) 7px
                    );
                opacity: 0.42;
                mix-blend-mode: screen;
            }
            #${ROOT_ID} .atoma-loading-overlay__lattice::before,
            #${ROOT_ID} .atoma-loading-overlay__lattice::after {
                content: '';
                position: absolute;
                inset: -12%;
                background:
                    linear-gradient(90deg, transparent 47%, rgba(0, 212, 255, 0.10) 50%, transparent 53%),
                    linear-gradient(0deg, transparent 48%, rgba(180, 77, 255, 0.08) 50%, transparent 52%);
                opacity: 0.22;
                transform: rotate(8deg);
            }
            #${ROOT_ID} .atoma-loading-overlay__lattice::after {
                transform: rotate(-9deg) scale(1.05);
                opacity: 0.14;
            }
            #${ROOT_ID} .atoma-loading-overlay__panel {
                position: relative;
                width: min(520px, calc(100vw - 48px));
                padding: 34px 30px 28px;
                border: 1px solid rgba(120, 255, 255, 0.18);
                border-radius: 18px;
                background:
                    linear-gradient(180deg, rgba(7, 14, 26, 0.78), rgba(5, 10, 20, 0.88)),
                    radial-gradient(circle at 50% 0%, rgba(0, 212, 255, 0.08), transparent 40%);
                box-shadow:
                    0 28px 80px rgba(0, 0, 0, 0.42),
                    inset 0 0 0 1px rgba(255,255,255,0.04);
                overflow: hidden;
            }
            #${ROOT_ID} .atoma-loading-overlay__panel::before {
                content: '';
                position: absolute;
                inset: 0;
                background:
                    linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                transform: translateX(-120%);
                animation: atoma-loading-shimmer 3.4s linear infinite;
                opacity: 0.28;
            }
            #${ROOT_ID} .atoma-loading-overlay__ritual {
                position: relative;
                height: 132px;
                display: grid;
                place-items: center;
                margin-bottom: 18px;
            }
            #${ROOT_ID} .atoma-loading-overlay__ring,
            #${ROOT_ID} .atoma-loading-overlay__ring::before,
            #${ROOT_ID} .atoma-loading-overlay__ring::after {
                position: absolute;
                border-radius: 999px;
            }
            #${ROOT_ID} .atoma-loading-overlay__ring {
                width: 106px;
                height: 106px;
                border: 1px solid rgba(0, 212, 255, 0.34);
                box-shadow: 0 0 28px rgba(0, 212, 255, 0.16);
                animation: atoma-loading-rotate 7.2s linear infinite;
            }
            #${ROOT_ID} .atoma-loading-overlay__ring::before {
                content: '';
                inset: -18px;
                border: 1px solid rgba(180, 77, 255, 0.22);
                animation: atoma-loading-rotate 11s linear infinite reverse;
            }
            #${ROOT_ID} .atoma-loading-overlay__ring::after {
                content: '';
                inset: 20px;
                border: 1px solid rgba(192, 245, 255, 0.24);
                opacity: 0.84;
            }
            #${ROOT_ID} .atoma-loading-overlay__core {
                position: relative;
                width: 32px;
                height: 32px;
                border-radius: 999px;
                background:
                    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(177,250,255,0.65) 24%, rgba(0, 212, 255, 0.40) 45%, rgba(0,0,0,0) 70%);
                box-shadow:
                    0 0 18px rgba(182, 245, 255, 0.46),
                    0 0 42px rgba(0, 212, 255, 0.28),
                    0 0 76px rgba(180, 77, 255, 0.16);
                animation: atoma-loading-pulse 1.55s ease-in-out infinite;
            }
            #${ROOT_ID} .atoma-loading-overlay__core::before,
            #${ROOT_ID} .atoma-loading-overlay__core::after {
                content: '';
                position: absolute;
                inset: -9px;
                border-radius: inherit;
                border: 1px solid rgba(198, 246, 255, 0.22);
                opacity: 0.7;
            }
            #${ROOT_ID} .atoma-loading-overlay__core::after {
                inset: -18px;
                border-color: rgba(180, 77, 255, 0.18);
                opacity: 0.48;
            }
            #${ROOT_ID} .atoma-loading-overlay__eyebrow {
                margin-bottom: 10px;
                color: rgba(0, 212, 255, 0.72);
                font: 700 10px/1.2 "Rajdhani", "Segoe UI", sans-serif;
                letter-spacing: 0.24em;
                text-transform: uppercase;
            }
            #${ROOT_ID} .atoma-loading-overlay__title {
                color: rgba(224, 248, 255, 0.96);
                font: 700 28px/1 "Rajdhani", "Segoe UI", sans-serif;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }
            #${ROOT_ID} .atoma-loading-overlay__subtitle {
                margin-top: 10px;
                color: rgba(186, 210, 228, 0.72);
                font: 500 13px/1.45 "Segoe UI", system-ui, sans-serif;
                letter-spacing: 0.03em;
            }
            #${ROOT_ID} .atoma-loading-overlay__phase {
                margin-top: 22px;
                color: rgba(255, 202, 244, 0.88);
                font: 700 11px/1.2 "Rajdhani", "Segoe UI", sans-serif;
                letter-spacing: 0.24em;
                text-transform: uppercase;
            }
            #${ROOT_ID} .atoma-loading-overlay__track {
                position: relative;
                margin-top: 12px;
                height: 3px;
                border-radius: 999px;
                background: rgba(138, 194, 214, 0.14);
                overflow: hidden;
            }
            #${ROOT_ID} .atoma-loading-overlay__track::before {
                content: '';
                position: absolute;
                inset: 0;
                width: 32%;
                border-radius: inherit;
                background: linear-gradient(90deg, rgba(0, 212, 255, 0), rgba(0, 212, 255, 0.88), rgba(180, 77, 255, 0.72));
                filter: blur(0.4px);
                animation: atoma-loading-track 1.35s ease-in-out infinite;
            }
            @keyframes atoma-loading-rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes atoma-loading-pulse {
                0%, 100% { transform: scale(0.92); opacity: 0.82; }
                50% { transform: scale(1.08); opacity: 1; }
            }
            @keyframes atoma-loading-track {
                0% { transform: translateX(-140%); }
                55% { transform: translateX(210%); }
                100% { transform: translateX(210%); }
            }
            @keyframes atoma-loading-shimmer {
                0% { transform: translateX(-120%); }
                55%, 100% { transform: translateX(120%); }
            }
        `;
        document.head.appendChild(style);
    }

    _ensureDom() {
        if (typeof document === 'undefined') return;
        if (this.root?.isConnected) return;

        this._ensureStyles();

        this.root = document.createElement('div');
        this.root.id = ROOT_ID;
        this.root.setAttribute('aria-hidden', 'true');
        this.root.setAttribute('role', 'status');
        this.root.setAttribute('aria-live', 'polite');
        this.root.tabIndex = -1;

        const scanlines = document.createElement('div');
        scanlines.className = 'atoma-loading-overlay__scanlines';

        const lattice = document.createElement('div');
        lattice.className = 'atoma-loading-overlay__lattice';

        const panel = document.createElement('div');
        panel.className = 'atoma-loading-overlay__panel';

        const ritual = document.createElement('div');
        ritual.className = 'atoma-loading-overlay__ritual';

        const ring = document.createElement('div');
        ring.className = 'atoma-loading-overlay__ring';

        const core = document.createElement('div');
        core.className = 'atoma-loading-overlay__core';

        const eyebrow = document.createElement('div');
        eyebrow.className = 'atoma-loading-overlay__eyebrow';
        eyebrow.textContent = 'ATOMA TRANSITION';

        this.titleNode = document.createElement('div');
        this.titleNode.className = 'atoma-loading-overlay__title';

        this.subtitleNode = document.createElement('div');
        this.subtitleNode.className = 'atoma-loading-overlay__subtitle';

        this.phaseNode = document.createElement('div');
        this.phaseNode.className = 'atoma-loading-overlay__phase';

        this.trackNode = document.createElement('div');
        this.trackNode.className = 'atoma-loading-overlay__track';

        ritual.append(ring, core);
        panel.append(ritual, eyebrow, this.titleNode, this.subtitleNode, this.phaseNode, this.trackNode);
        this.root.append(scanlines, lattice, panel);
        document.body.appendChild(this.root);
    }

    _applyPayload(payload) {
        this._ensureDom();
        if (!this.root) return;

        const normalized = normalizePayload(payload);
        this.root.dataset.variant = normalized.variant;
        if (this.titleNode) this.titleNode.textContent = normalized.title;
        if (this.subtitleNode) this.subtitleNode.textContent = normalized.subtitle;
        if (this.phaseNode) this.phaseNode.textContent = normalized.phase;
    }

    _installInputGuards() {
        if (typeof document === 'undefined') return;
        document.addEventListener('keydown', this._handleDocumentInput, true);
        document.addEventListener('keyup', this._handleDocumentInput, true);
        document.addEventListener('click', this._handleDocumentInput, true);
        document.addEventListener('pointerdown', this._handleDocumentInput, true);
    }

    _removeInputGuards() {
        if (typeof document === 'undefined') return;
        document.removeEventListener('keydown', this._handleDocumentInput, true);
        document.removeEventListener('keyup', this._handleDocumentInput, true);
        document.removeEventListener('click', this._handleDocumentInput, true);
        document.removeEventListener('pointerdown', this._handleDocumentInput, true);
    }

    _topToken() {
        return this._tokens.length > 0 ? this._tokens[this._tokens.length - 1] : null;
    }

    async _waitForPaint() {
        await nextAnimationFrame();
        await nextAnimationFrame();
    }

    show(payload = {}) {
        const normalized = normalizePayload(payload);
        const token = Symbol('atoma-loading-overlay');

        this._ensureDom();
        this._tokens.push({ token, payload: normalized });
        this._applyPayload(normalized);

        if (!this._isVisible) {
            this._isVisible = true;
            this._visibleSince = performance.now();
            this.root.classList.add('is-visible');
            this.root.setAttribute('aria-hidden', 'false');
            this._installInputGuards();
            this._visibilityPromise = this._waitForPaint();
        } else {
            this._visibilityPromise = this._visibilityPromise || Promise.resolve();
        }

        return token;
    }

    setPhase(payload = {}, token = null) {
        if (!this._tokens.length) return;

        const nextPayload = normalizePayload({
            ...this._topToken()?.payload,
            ...payload,
        });

        if (token) {
            const entry = this._tokens.find((item) => item.token === token);
            if (!entry) return;
            entry.payload = nextPayload;
            if (entry !== this._topToken()) return;
        } else if (this._topToken()) {
            this._topToken().payload = nextPayload;
        }

        this._applyPayload(nextPayload);
    }

    async hide(token = null) {
        if (!this.root) return false;

        if (token) {
            this._tokens = this._tokens.filter((entry) => entry.token !== token);
        } else {
            this._tokens = [];
        }

        const top = this._topToken();
        if (top) {
            this._applyPayload(top.payload);
            return false;
        }

        if (!this._isVisible) {
            return true;
        }

        const elapsed = performance.now() - this._visibleSince;
        if (elapsed < MIN_VISIBLE_MS) {
            await wait(MIN_VISIBLE_MS - elapsed);
        }

        this.root.classList.remove('is-visible');
        this.root.setAttribute('aria-hidden', 'true');
        this._isVisible = false;
        this._removeInputGuards();
        await wait(FADE_DURATION_MS);
        return true;
    }

    async run(task, config = {}) {
        const token = this.show(config);
        const executeTask = typeof task === 'function' ? task : () => task;

        await (this._visibilityPromise || Promise.resolve());

        try {
            const result = await executeTask({
                token,
                setPhase: (payload) => this.setPhase(payload, token),
                yieldFrame: () => this._waitForPaint(),
            });
            await this.hide(token);
            return result;
        } catch (error) {
            await this.hide(token);
            throw error;
        }
    }
}

let __atomaLoadingOverlaySingleton = null;

export function getSharedAtomaLoadingOverlay() {
    if (__atomaLoadingOverlaySingleton) {
        return __atomaLoadingOverlaySingleton;
    }

    __atomaLoadingOverlaySingleton = new AtomaLoadingOverlay();
    return __atomaLoadingOverlaySingleton;
}
