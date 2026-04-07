import { mountAIAutomationHUD } from './AIAutomationHUD.js';
import { startAtomaGame } from './main.js';
import {
    MainMenu,
    clearContinueSnapshot,
    loadContinueSnapshot,
    saveContinueSnapshot,
} from './MainMenu.js';
import { mountVariantBAdvisorHUD } from './ui/hud/VariantBAdvisorHUD.js';

const PREBOOT_BODY_CLASS = 'atoma-preboot';
const AUDIO_ENABLED_STORAGE_KEY = 'atoma.audio.enabled';

class AtomaBootController {
    constructor() {
        this.game = null;
        this._booting = false;
        this._hudMounted = false;

        this.menu = new MainMenu({
            actions: {
                resume: ({ snapshot, settings }) => this.resume(snapshot, settings),
                startNew: ({ worldId, selectedMapId, settings }) => this.startNew(worldId, selectedMapId, settings),
                exit: () => this.exit(),
            },
        });

        this.menu.show();

        window.atomaApp = {
            startNew: (worldId) => this.startNew(worldId, worldId, this.menu.profile.settings),
            resume: () => this.resume(loadContinueSnapshot(), this.menu.profile.settings),
            exit: () => this.exit(),
        };
    }

    startNew(worldId, selectedMapId, settings) {
        this._launch({
            startupWorld: worldId,
            selectedMapId,
            settings,
        });
    }

    resume(snapshot, settings) {
        if (!snapshot) {
            this.menu.refresh();
            return;
        }

        this._launch({
            startupWorld: snapshot.worldId,
            selectedMapId: snapshot.selectedMapId || snapshot.worldId,
            continueSnapshot: snapshot,
            settings,
        });
    }

    exit() {
        clearContinueSnapshot();

        if (this.game) {
            window.location.reload();
            return;
        }

        this.menu.refresh();
    }

    _launch({ startupWorld, selectedMapId, continueSnapshot = null, settings = null }) {
        if (this._booting || this.game) {
            return;
        }

        this._booting = true;

        const nextSnapshot = saveContinueSnapshot({
            worldId: startupWorld,
            selectedMapId: selectedMapId || startupWorld,
            savedAt: Date.now(),
        });

        this._persistBootSettings(settings);
        document.body.classList.remove(PREBOOT_BODY_CLASS);
        this.menu.hide();

        try {
            this.game = startAtomaGame({
                startupWorld,
                continueSnapshot: continueSnapshot || nextSnapshot,
                menuSettings: settings,
            });
            this._mountRuntimeHud();
            this.menu.dispose();
        } catch (error) {
            document.body.classList.add(PREBOOT_BODY_CLASS);
            this.menu.show();
            this._booting = false;
            throw error;
        }

        this._booting = false;
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
}

new AtomaBootController();