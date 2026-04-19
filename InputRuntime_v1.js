/**
 * EXTRACTION PACK V1.3 — INPUT RUNTIME ORCHESTRATION
 * 
 * InputRuntime_v1: Centralized orchestration for all input handling systems
 * 
 * PURPOSE:
 * - Provide unified interface for input system management
 * - Initialize all input subsystems in consistent order
 * - Update all input subsystems with single call
 * - Centralize input cleanup on transitions/shutdown
 * - No input logic is moved or rewritten (purely orchestration)
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (calls only existing methods)
 * ✅ No input logic moved from main.js or other files
 * ✅ No logic rewriting or replacing
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling with logging
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * ✅ Per-system error isolation (one failure doesn't break input)
 * 
 * INPUT SYSTEMS ORCHESTRATED:
 * - Keyboard: Global keyboard handlers
 * - Hotkey Manager: Keyboard shortcuts and hotkeys
 * - Editor Keyboard: Editor-specific keyboard controls
 * - Debug Hotkeys: Debug mode keyboard shortcuts
 * - Mouse/Pointer: Mouse tracking and interaction
 * - Node Dragging: Drag-based node manipulation
 * - Link Creation: Link creation interaction system
 * - Context Menu: Right-click menu activation
 * - Node Hover: Hover-based inspection
 * - Camera Orbit: Camera rotation controls
 * - Camera Pan: Camera panning controls
 * - Camera Zoom: Camera zoom controls
 * - Selection: Node selection input handling
 * 
 * INTEGRATION:
 *   import { InputRuntime_v1 } from './InputRuntime_v1.js';
 *   
 *   this.inputRuntime_v1 = new InputRuntime_v1({ game: this });
 *   this.inputRuntime_v1.init?.();  // Initialize all input systems
 *   
 *   // In animate loop:
 *   this.inputRuntime_v1?.update?.(delta);
 *   
 *   // On cleanup:
 *   this.inputRuntime_v1?.dispose?.();
 */

export class InputRuntime_v1 {
    /**
     * Initialize input runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.game - Reference to main.js AtomaGame instance
     */
    constructor({ game }) {
        if (!game) {
            console.warn('[InputRuntime_v1] No game reference provided');
        }
        this.game = game;
        
        // Build input system registry from main.js references
        this.inputSystems = {};
        
        // Global keyboard state tracking
        this.keyState = {};
        
        // Event listener references (for cleanup)
        this._keyDownHandler = (e) => this._onKeyDown(e);
        this._keyUpHandler = (e) => this._onKeyUp(e);
        this._pointerDownHandler = (e) => this._onPointerDown(e);
        this._lastSignatureMomentNudgeAt = 0;
    }

    /**
     * Initialize all input systems
     * Called once at startup after all systems are constructed
     */
    init() {
        try {
            // Automatically collect input systems
            this._collectInputSystems();

            // Initialize with priority order (dependencies first)
            this._initializeWithPriority();
            
            // Attach global input listeners
            this._attachGlobalListeners();
            
            console.log('[InputRuntime_v1] initialized ✓');
        } catch (e) {
            console.warn('[InputRuntime_v1] init failed:', e);
        }
    }

    /**
     * Collect all available input systems from game object
     * @private
     */
    _collectInputSystems() {
        try {
            const g = this.game;
            if (!g) {
                console.warn('[InputRuntime_v1] No game reference for system collection');
                return;
            }

            // Keyboard systems
            const keyboardSystems = {
                keyboard: g.keyboard || null,
                hotkeyManager: g.hotkeyManager || null,
                editorKeyboardControls: g.editorKeyboardControls || null,
                debugHotkeyLayer: g.debugHotkeyLayer || null,
            };

            // Mouse/Pointer systems
            const mouseSystems = {
                mouse: g.mouse || null,
                pointer: g.pointer || null,
                dragController: g.nodeDragSystem || null,
            };

            // Editor input systems
            const editorSystems = {
                linkCreationController: g.nodeLinkSystem || null,
                contextMenu: g.contextMenu || null,
                nodeHoverInspector: g.nodeHoverInspector || null,
                selectionInput: g.selectionCore || null,
            };

            // Camera control systems
            const cameraSystems = {
                cameraOrbitControls: g.cameraOrbitControls || null,
                cameraPanControls: g.cameraPanControls || null,
                cameraZoomControls: g.cameraZoomControls || null,
            };

            // Merge all systems into registry
            this.inputSystems = {
                ...keyboardSystems,
                ...mouseSystems,
                ...editorSystems,
                ...cameraSystems,
            };

            const activeCount = Object.values(this.inputSystems).filter(s => s !== null).length;
            if (activeCount === 0) {
                console.warn('[InputRuntime_v1] No input systems available for orchestration');
            }
        } catch (e) {
            console.warn('[InputRuntime_v1] collectInputSystems failed:', e);
        }
    }

    /**
     * Initialize systems in priority order
     * Priority: Keyboard > Mouse > Editor > Camera
     * @private
     */
    _initializeWithPriority() {
        const priority = [
            // Foundation: Keyboard input
            'keyboard',
            'hotkeyManager',
            'debugHotkeyLayer',
            
            // Editor keyboard (depends on keyboard foundation)
            'editorKeyboardControls',
            
            // Mouse/Pointer (foundation for interactions)
            'mouse',
            'pointer',
            
            // Editor interactions (depends on mouse + keyboard)
            'dragController',
            'linkCreationController',
            'contextMenu',
            'nodeHoverInspector',
            'selectionInput',
            
            // Camera (independent but benefits from keyboard)
            'cameraOrbitControls',
            'cameraPanControls',
            'cameraZoomControls',
        ];

        for (const sysName of priority) {
            const sys = this.inputSystems[sysName];
            if (sys) {
                try {
                    sys.init?.();
                } catch (e) {
                    console.warn(`[InputRuntime_v1] ${sysName}.init() failed:`, e);
                }
            }
        }
    }

    /**
     * Attach global input listeners
     * @private
     */
    _attachGlobalListeners() {
        try {
            window.addEventListener('keydown', this._keyDownHandler);
            window.addEventListener('keyup', this._keyUpHandler);
            window.addEventListener('pointerdown', this._pointerDownHandler);
        } catch (e) {
            console.warn('[InputRuntime_v1] Failed to attach global listeners:', e);
        }
    }

    /**
     * Handle global keydown event
     * @private
     */
    _onKeyDown(e) {
        try {
            this.keyState[e.key] = true;
            this.keyState[`code:${e.code}`] = true;
            this._maybeEmitSignatureMomentNudge({
                inputKind: 'keydown',
                key: e.key,
                inputCode: e.code,
                repeat: e.repeat === true
            });
        } catch (e) {
            console.warn('[InputRuntime_v1] keydown handler error:', e);
        }
    }

    /**
     * Handle global keyup event
     * @private
     */
    _onKeyUp(e) {
        try {
            this.keyState[e.key] = false;
            this.keyState[`code:${e.code}`] = false;
        } catch (e) {
            console.warn('[InputRuntime_v1] keyup handler error:', e);
        }
    }

    /**
     * Handle global pointer-down event
     * @private
     */
    _onPointerDown(e) {
        try {
            this._maybeEmitSignatureMomentNudge({
                inputKind: 'pointerdown',
                pointerType: e.pointerType || 'mouse',
                button: e.button,
                isPrimary: e.isPrimary === true
            });
        } catch (error) {
            console.warn('[InputRuntime_v1] pointerdown handler error:', error);
        }
    }

    _maybeEmitSignatureMomentNudge(input = {}) {
        const game = this.game;
        const semanticBus = game?.semanticBus;
        const director = game?.signatureMomentDirector;
        if (!semanticBus?.emit || !director?.getActiveMoment) return;

        const activeMoment = director.getActiveMoment();
        if (!activeMoment || !['harmony', 'mythic'].includes(activeMoment.family)) return;
        if (!['telegraph', 'crest', 'afterglow'].includes(activeMoment.stage)) return;

        const now = typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        if (now - this._lastSignatureMomentNudgeAt < 160) return;
        if (input.repeat === true) return;

        const tagName = String(globalThis?.document?.activeElement?.tagName || '').toUpperCase();
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

        this._lastSignatureMomentNudgeAt = now;
        semanticBus.emit('signature.moment.nudge', {
            source: 'InputRuntime_v1',
            momentId: activeMoment.id || activeMoment.blueprintId || null,
            blueprintId: activeMoment.blueprintId || null,
            family: activeMoment.family || null,
            stage: activeMoment.stage || null,
            inputKind: input.inputKind || 'unknown',
            key: input.key || null,
            inputCode: input.inputCode || null,
            pointerType: input.pointerType || null,
            button: Number.isFinite(input.button) ? input.button : null,
            strength: input.inputKind === 'pointerdown' ? 0.26 : 0.18,
            timestamp: now
        }, 'NORMAL');
    }

    /**
     * Update all input systems each frame
     * @param {number} delta - Time delta since last frame
     */
    update(delta) {
        try {
            for (const sys of Object.values(this.inputSystems)) {
                if (sys) {
                    try {
                        sys.update?.(delta);
                    } catch (e) {
                        // Isolated error: log but continue with other systems
                        console.warn('[InputRuntime_v1] system update failed:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('[InputRuntime_v1] update failed:', e);
        }
    }

    /**
     * Cleanup all input systems
     * Called on world transition or shutdown
     */
    dispose() {
        try {
            // Detach global listeners first
            this._detachGlobalListeners();
            
            // Cleanup in reverse priority order
            const cleanup = [
                'cameraZoomControls',
                'cameraPanControls',
                'cameraOrbitControls',
                'selectionInput',
                'nodeHoverInspector',
                'contextMenu',
                'linkCreationController',
                'dragController',
                'pointer',
                'mouse',
                'editorKeyboardControls',
                'debugHotkeyLayer',
                'hotkeyManager',
                'keyboard',
            ];

            for (const sysName of cleanup) {
                const sys = this.inputSystems[sysName];
                if (sys) {
                    try {
                        sys.dispose?.();
                    } catch (e) {
                        console.warn(`[InputRuntime_v1] ${sysName}.dispose() failed:`, e);
                    }
                }
            }

            // Clear key state
            this.keyState = {};
            
            console.log('[InputRuntime_v1] disposed ✓');
        } catch (e) {
            console.warn('[InputRuntime_v1] dispose failed:', e);
        }
    }

    /**
     * Detach global input listeners
     * @private
     */
    _detachGlobalListeners() {
        try {
            window.removeEventListener('keydown', this._keyDownHandler);
            window.removeEventListener('keyup', this._keyUpHandler);
            window.removeEventListener('pointerdown', this._pointerDownHandler);
        } catch (e) {
            console.warn('[InputRuntime_v1] Failed to detach global listeners:', e);
        }
    }

    /**
     * Get count of active input systems
     * @returns {number} Number of initialized systems
     */
    getActiveSystemCount() {
        return Object.values(this.inputSystems).filter(s => s !== null).length;
    }

    /**
     * Get list of active system names
     * @returns {string[]} Array of active system names
     */
    getActiveSystemNames() {
        return Object.entries(this.inputSystems)
            .filter(([_, sys]) => sys !== null)
            .map(([name, _]) => name);
    }

    /**
     * Check if a specific system is active
     * @param {string} systemName - Name of the system to check
     * @returns {boolean} True if system is initialized
     */
    isSystemActive(systemName) {
        return this.inputSystems[systemName] !== null && this.inputSystems[systemName] !== undefined;
    }

    /**
     * Query current state of a key
     * @param {string} key - Key name (e.g., 'Shift', 'Control', 'a') or code (e.g., 'code:KeyA')
     * @returns {boolean} True if key is currently pressed
     */
    isKeyPressed(key) {
        return this.keyState[key] === true;
    }

    /**
     * Check if modifier key is pressed
     * @param {string} modifier - 'shift', 'ctrl', 'alt', 'meta'
     * @returns {boolean} True if modifier is active
     */
    isModifierActive(modifier) {
        const mod = modifier.toLowerCase();
        switch (mod) {
            case 'shift':
                return this.isKeyPressed('Shift');
            case 'ctrl':
            case 'control':
                return this.isKeyPressed('Control');
            case 'alt':
                return this.isKeyPressed('Alt');
            case 'meta':
                return this.isKeyPressed('Meta');
            default:
                return false;
        }
    }
}
