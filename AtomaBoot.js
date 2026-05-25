import { mountAIAutomationHUD } from './HUD/AIAutomationHUD.js';
import { RunIdentityDirector } from './HUD/RunIdentityDirector.js';
import { startAtomaGame } from './main.js';
import {
    isMenuDevMapUnlockEnabled,
    MainMenu,
    clearContinueSnapshot,
    loadContinueSnapshot,
    resolvePublicSelectedMapId,
    saveContinueSnapshot,
    setMenuDevMapUnlockEnabled,
} from './MainMenu.js';
import { PauseMenu } from './PauseMenu.js';
import { loadUIVisibilityConfig } from './ui/config/UIVisibilityConfig.js';
import { mountVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';
import { eventRegistrationRegistry } from './Engine/EventRegistrationRegistry.js';
import { getSharedAtomaLoadingOverlay } from './AtomaLoadingOverlay.js';

const PREBOOT_BODY_CLASS = 'atoma-preboot';
const AUDIO_ENABLED_STORAGE_KEY = 'atoma.audio.enabled';

class AtomaBootController {
    constructor() {
        loadUIVisibilityConfig();

        this.game = null;
        this._booting = false;
        this._hudMounted = false;
        this.pauseMenu = null;
        this.menuRunIdentityDirector = null;
        this.loadingOverlay = getSharedAtomaLoadingOverlay();
        this._handleGlobalKeyDown = (event) => this._onGlobalKeyDown(event);
        this._ensureBootRunIdentityDirector();

        this.menu = new MainMenu({
            actions: {
                resume: ({ snapshot, settings }) => this.resume(snapshot, settings),
                startNew: ({ worldId, selectedMapId, settings }) => this.startNew(worldId, selectedMapId, settings),
                openRunIdentity: ({ worldId, selectedMapId }) => this.openRunIdentityFromMenu(worldId, selectedMapId),
                exit: () => this.exit(),
            },
        });

        this.menu.show();
        document.addEventListener('keydown', this._handleGlobalKeyDown);

        window.atomaApp = {
            startNew: (worldId) => this.startNew(worldId, worldId, this.menu.profile.settings),
            resume: () => this.resume(loadContinueSnapshot(), this.menu.profile.settings),
            exit: () => this.exit(),
            pause: () => this.openPauseMenu(),
            resumeGame: () => this.resumeGame(),
            setMapDevUnlock: (enabled) => this.setMapDevUnlock(enabled),
            isMapDevUnlockEnabled: () => isMenuDevMapUnlockEnabled(),
        };
    }

    startNew(worldId, selectedMapId, settings) {
        const nextSelection = this._resolveWorldSelection(worldId, selectedMapId);
        void this._launch({
            startupWorld: nextSelection.worldId,
            selectedMapId: nextSelection.selectedMapId,
            settings,
        }).catch(() => {});
    }

    resume(snapshot, settings) {
        if (!snapshot) {
            this.menu.refresh();
            return;
        }

        const sanitizedSnapshot = this._sanitizeContinueSnapshot(snapshot);
        void this._launch({
            startupWorld: sanitizedSnapshot.worldId,
            selectedMapId: sanitizedSnapshot.selectedMapId || sanitizedSnapshot.worldId,
            continueSnapshot: sanitizedSnapshot,
            settings,
        }).catch(() => {});
    }

    exit() {
        this.pauseMenu?.hide();
        clearContinueSnapshot();

        if (this.game) {
            window.location.reload();
            return;
        }

        this.menu.refresh();
    }

    openRunIdentityFromMenu(worldId, selectedMapId = worldId) {
        const nextSelection = this._resolveWorldSelection(worldId, selectedMapId);
        this._ensureBootRunIdentityDirector();
        this.menuRunIdentityDirector?.openManual?.(nextSelection.worldId);
    }

    setMapDevUnlock(enabled) {
        const nextEnabled = setMenuDevMapUnlockEnabled(enabled);

        if (!this.game) {
            this.menu?.refresh();
        }
        this.pauseMenu?.refresh();

        return nextEnabled;
    }

    async _launch({ startupWorld, selectedMapId, continueSnapshot = null, settings = null }) {
        if (this._booting || this.game) {
            return;
        }

        this._booting = true;
        const sanitizedSelection = this._resolveWorldSelection(startupWorld, selectedMapId);
        const sanitizedContinueSnapshot = continueSnapshot
            ? this._sanitizeContinueSnapshot(continueSnapshot)
            : null;
        const effectiveContinueSnapshot = sanitizedContinueSnapshot
            ? saveContinueSnapshot(sanitizedContinueSnapshot)
            : saveContinueSnapshot({
                worldId: sanitizedSelection.worldId,
                selectedMapId: sanitizedSelection.selectedMapId,
                savedAt: Date.now(),
            });
        const isResume = Boolean(continueSnapshot);

        try {
            await this.loadingOverlay.run(async ({ setPhase, yieldFrame }) => {
                this._persistBootSettings(settings);
                document.body.classList.remove(PREBOOT_BODY_CLASS);
                this.menu.hide();
                this._disposeBootRunIdentityDirector();

                setPhase({
                    title: isResume ? 'RESUMING ATOMA' : 'INITIALIZING ATOMA',
                    subtitle: 'Preparing the world shell and gathering the first stable rhythm.',
                    phase: 'WEAVING WORLD SHELL',
                    variant: isResume ? 'resume' : 'boot',
                });
                await yieldFrame();

                this.game = startAtomaGame({
                    startupWorld: sanitizedSelection.worldId,
                    continueSnapshot: effectiveContinueSnapshot,
                    menuSettings: settings,
                });

                setPhase({
                    title: isResume ? 'RESUMING ATOMA' : 'INITIALIZING ATOMA',
                    subtitle: 'Binding runtime systems, signals, and visual authorities.',
                    phase: 'BINDING SYSTEMS',
                    variant: isResume ? 'resume' : 'boot',
                });

                this._ensurePauseMenu();
                this._mountRuntimeHud();
                await this.game?.waitForVisualTransitions?.();
                this.menu.dispose();

                setPhase({
                    title: isResume ? 'RESUMING ATOMA' : 'INITIALIZING ATOMA',
                    subtitle: 'Returning to the live field with control and rhythm restored.',
                    phase: 'ENTERING SIMULATION',
                    variant: isResume ? 'resume' : 'boot',
                });
                await yieldFrame();
            }, {
                title: isResume ? 'RESUMING ATOMA' : 'INITIALIZING ATOMA',
                subtitle: 'Preparing the world shell and initial field state.',
                phase: 'INITIALIZING WORLD',
                variant: isResume ? 'resume' : 'boot',
            });
        } catch (error) {
            document.body.classList.add(PREBOOT_BODY_CLASS);
            this._ensureBootRunIdentityDirector();
            this.menu.show();
            this._booting = false;
            console.error('[AtomaBoot] launch failed:', error);
            throw error;
        }

        this._booting = false;
    }

    openPauseMenu() {
        if (!this.game || this._booting) {
            return;
        }

        this._ensurePauseMenu();
        if (this.pauseMenu?.isVisible()) {
            return;
        }

        this.pauseMenu.profile.selectedMapId = resolvePublicSelectedMapId(this.game.currentMode);
        this.game.pause?.();
        this.pauseMenu?.show();
    }

    resumeGame() {
        if (!this.game) {
            return;
        }

        this.pauseMenu?.hide();
        this.game.resume?.();
        this.loadingOverlay.cue({
            title: 'RETURNING TO FIELD',
            subtitle: 'Simulation authority restored. Pointer focus returns to the living network.',
            phase: 'SIMULATION LIVE',
            variant: 'resume',
        }, { durationMs: 680 }).catch(() => {});
    }

    async _switchWorldFromPause({ worldId, selectedMapId, settings }) {
        if (!this.game) {
            return;
        }

        const nextSelection = this._resolveWorldSelection(worldId, selectedMapId);
        try {
            saveContinueSnapshot({
                worldId: nextSelection.worldId,
                selectedMapId: nextSelection.selectedMapId,
                savedAt: Date.now(),
            });
            this._persistBootSettings(settings);
            this.pauseMenu?.hide();
            await this.game.switchWorld?.(nextSelection.worldId);
            this.game.resume?.();
        } catch (error) {
            console.error('[AtomaBoot] pause world switch failed:', error);
            this.pauseMenu?.show();
        }
    }

    _openRunIdentityFromPause(worldId, selectedMapId = worldId) {
        if (!this.game) {
            return;
        }
        const nextSelection = this._resolveWorldSelection(worldId || this.game.currentMode, selectedMapId || this.game.currentMode);
        this.pauseMenu.profile.selectedMapId = nextSelection.selectedMapId;
        this.pauseMenu.refresh();
        this.game.openRunIdentityOverlay?.({
            world: nextSelection.worldId,
            entryMode: 'manual',
        });
    }

    _ensurePauseMenu() {
        if (this.pauseMenu) {
            return this.pauseMenu;
        }

        this.pauseMenu = new PauseMenu({
            actions: {
                resume: () => this.resumeGame(),
                openRunIdentity: ({ worldId, selectedMapId }) => this._openRunIdentityFromPause(worldId, selectedMapId),
                switchWorld: (payload) => void this._switchWorldFromPause(payload),
                endGame: () => this.exit(),
            },
        });

        return this.pauseMenu;
    }

    _ensureBootRunIdentityDirector() {
        if (this.menuRunIdentityDirector) {
            return this.menuRunIdentityDirector;
        }
        this.menuRunIdentityDirector = new RunIdentityDirector({
            onCommitSelection: () => {
                this.menu?.refresh?.();
            }
        });
        return this.menuRunIdentityDirector;
    }

    _disposeBootRunIdentityDirector() {
        this.menuRunIdentityDirector?.dispose?.();
        this.menuRunIdentityDirector = null;
    }

    _onGlobalKeyDown(event) {
        if (event.defaultPrevented || event.code !== 'Escape') {
            return;
        }

        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        if (!this.game || this._booting || this.pauseMenu?.isVisible()) {
            return;
        }

        const tagName = String(event.target?.tagName || '').toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
            return;
        }

        event.preventDefault();
        this.openPauseMenu();
    }

    _mountRuntimeHud() {
        if (this._hudMounted) {
            return;
        }

        mountAIAutomationHUD(document.body);
        mountVariantBAdvisorHUD(document.body);
        this._hudMounted = true;
    }

    _persistBootSettings(settings) {
        const soundLevel = Number(settings?.soundLevel);

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(
                    AUDIO_ENABLED_STORAGE_KEY,
                    Number.isFinite(soundLevel) && soundLevel <= 0 ? '0' : '1',
                );
            }
        } catch {
            // Ignore persistence failures for boot settings.
        }
    }

    _resolveWorldSelection(worldId, selectedMapId, { devUnlock = isMenuDevMapUnlockEnabled() } = {}) {
        const nextWorldId = resolvePublicSelectedMapId(worldId, { devUnlock });
        const nextSelectedMapId = resolvePublicSelectedMapId(selectedMapId || nextWorldId, { devUnlock });
        return {
            worldId: nextWorldId,
            selectedMapId: nextSelectedMapId,
        };
    }

    _sanitizeContinueSnapshot(snapshot, { devUnlock = isMenuDevMapUnlockEnabled() } = {}) {
        if (!snapshot || typeof snapshot !== 'object') {
            return null;
        }

        const nextSelection = this._resolveWorldSelection(
            snapshot.worldId,
            snapshot.selectedMapId || snapshot.worldId,
            { devUnlock },
        );

        return {
            ...snapshot,
            worldId: nextSelection.worldId,
            selectedMapId: nextSelection.selectedMapId,
        };
    }
}

new AtomaBootController();

// Registration consolidation debug API (Phase 2)
// Call __ATOMA_REG_REPORT__() in console to see active event registrations
window.__ATOMA_REG_REPORT__ = () => eventRegistrationRegistry.report();
window.__ATOMA_REG_DISPOSE_ALL__ = () => eventRegistrationRegistry.disposeAll();
window.__ATOMA_REG_DISPOSE_OWNER__ = (owner) => eventRegistrationRegistry.disposeOwner(owner);
