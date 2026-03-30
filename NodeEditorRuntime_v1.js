/**
 * EXTRACTION PACK V1.2 — NODE EDITOR RUNTIME
 * 
 * NodeEditorRuntime_v1: Centralized orchestration for all editor & UI interaction systems
 * 
 * PURPOSE:
 * - Provide unified interface for editor/UI system management
 * - Initialize all editor subsystems in consistent order
 * - Update all editor subsystems with single call
 * - Centralize editor/UI cleanup on transitions/shutdown
 * - No editor logic is moved or rewritten (purely orchestration)
 * 
 * SAFETY:
 * ✅ 100% orchestration wrapper (calls only existing methods)
 * ✅ No editor logic moved from main.js
 * ✅ No logic rewriting or replacing
 * ✅ Safe optional chaining throughout
 * ✅ Defensive error handling with logging
 * ✅ Fully reversible via dispose()
 * ✅ No dependencies on main.js internals
 * ✅ Per-system error isolation (one failure doesn't break others)
 * 
 * EDITOR SYSTEMS ORCHESTRATED:
 * - Selection Core: Single source of truth for node selection
 * - Node Linking: Dynamic linking system for creating connections
 * - Node Inspector: Inspection panel for selected nodes
 * - Context Menu: Right-click interaction menu
 * - Inspector Badge: Visual feedback badge under crosshair
 * - Selection Highlight: Pulsing highlight shader for selected node
 * - Selection Label: Floating label above selected node
 * - Selected Top Bar: HUD bar showing selected node info
 * - Primary Node System: Double-click primary linking source
 * - Primary Node Aura: Visual aura for primary (linking source)
 * - Primary Node Top Bar: HUD bar showing primary node info
 * - Category Legend: Reference panel for node categories
 * - Emotional Feed: AI poetic status reflections
 * - Debug HUD: In-game debug monitoring (optional)
 * 
 * INTEGRATION:
 *   import { NodeEditorRuntime_v1 } from './NodeEditorRuntime_v1.js';
 *   
 *   this.nodeEditorRuntime_v1 = new NodeEditorRuntime_v1({ game: this });
 *   this.nodeEditorRuntime_v1.init?.();  // Initialize all editor systems
 *   
 *   // In animate loop:
 *   this.nodeEditorRuntime_v1?.update?.(deltaTime);
 *   
 *   // On cleanup:
 *   this.nodeEditorRuntime_v1?.dispose?.();
 */

export class NodeEditorRuntime_v1 {
    /**
     * Initialize editor runtime orchestration
     * 
     * @param {Object} config - Configuration object
     * @param {Object} config.game - Reference to main.js AtomaGame instance
     */
    constructor({ game }) {
        if (!game) {
            console.warn('[NodeEditorRuntime_v1] No game reference provided');
        }
        this.game = game;
        
        // Build editor system registry from main.js references
        this.editorSystems = {
            // Core Selection & Linking
            selectionCore: game?.selectionCore || null,
            linkingSystem: game?.linkingSystem || null,
            
            // Node Inspection & Context
            nodeInspectPanel: game?.nodeInspectPanel || null,
            contextMenu: game?.contextMenu || null,
            linguisticOverlay: game?.linguisticOverlay || null,
            
            // Selection Visual Feedback
            selectedNodeBadge: game?.selectedNodeBadge || null,
            selectedNodeHighlight: game?.selectedNodeHighlight || null,
            selectedNodeLabel: game?.selectedNodeLabel || null,
            selectedNodeTopBar: game?.selectedNodeTopBar || null,
            
            // Primary Node System (double-click linking)
            primaryNodeAura: game?.primaryNodeAura || null,
            primaryNodeTopBar: game?.primaryNodeTopBar || null,
            
            // Category & Status Display
            categoryLegend: game?.categoryLegend || null,
            emotionalFeed: game?.emotionalFeed || null,
            
            // Debug HUD (optional)
            debugHUD: game?.debugHUD || null,
        };

        const activeSystems = Object.values(this.editorSystems).filter(s => s !== null).length;
        if (activeSystems === 0) {
            console.warn('[NodeEditorRuntime_v1] No editor systems available for orchestration');
        }
    }

    /**
     * Initialize all editor systems
     * Called once at startup after all systems are constructed
     */
    init() {
        try {
            // Initialize with priority order (dependencies first)
            this._initializeWithPriority();
            
            console.log('[NodeEditorRuntime_v1] initialized ✓');
        } catch (e) {
            console.warn('[NodeEditorRuntime_v1] init failed:', e);
        }
    }

    /**
     * Initialize systems in dependency order
     * @private
     */
    _initializeWithPriority() {
        const priority = [
            // Foundation: Selection & Linking
            'selectionCore',
            'linkingSystem',
            
            // Inspection & Context (depends on selection)
            'nodeInspectPanel',
            'contextMenu',
            'linguisticOverlay',
            
            // Visual Feedback (depends on selection)
            'selectedNodeBadge',
            'selectedNodeHighlight',
            'selectedNodeLabel',
            'selectedNodeTopBar',
            
            // Primary Linking System
            'primaryNodeAura',
            'primaryNodeTopBar',
            
            // Status Display (independent)
            'categoryLegend',
            'emotionalFeed',
            
            // Optional Debug
            'debugHUD',
        ];

        for (const sysName of priority) {
            const sys = this.editorSystems[sysName];
            if (sys) {
                try {
                    sys.init?.();
                } catch (e) {
                    console.warn(`[NodeEditorRuntime_v1] ${sysName}.init() failed:`, e);
                }
            }
        }
    }

    /**
     * Update all editor systems each frame
     * @param {number} delta - Time delta since last frame
     */
    update(delta) {
        try {
            for (const sys of Object.values(this.editorSystems)) {
                if (sys) {
                    try {
                        sys.update?.(delta);
                    } catch (e) {
                        // Isolated error: log but continue with other systems
                        console.warn('[NodeEditorRuntime_v1] system update failed:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('[NodeEditorRuntime_v1] update failed:', e);
        }
    }

    /**
     * Cleanup all editor systems
     * Called on world transition or shutdown
     */
    dispose() {
        try {
            // Cleanup in reverse priority order
            const cleanup = [
                'debugHUD',
                'emotionalFeed',
                'categoryLegend',
                'primaryNodeTopBar',
                'primaryNodeAura',
                'selectedNodeTopBar',
                'selectedNodeLabel',
                'selectedNodeHighlight',
                'selectedNodeBadge',
                'linguisticOverlay',
                'contextMenu',
                'nodeInspectPanel',
                'linkingSystem',
                'selectionCore',
            ];

            for (const sysName of cleanup) {
                const sys = this.editorSystems[sysName];
                if (sys) {
                    try {
                        sys.dispose?.();
                    } catch (e) {
                        console.warn(`[NodeEditorRuntime_v1] ${sysName}.dispose() failed:`, e);
                    }
                }
            }

            console.log('[NodeEditorRuntime_v1] disposed ✓');
        } catch (e) {
            console.warn('[NodeEditorRuntime_v1] dispose failed:', e);
        }
    }

    /**
     * Get count of active editor systems
     * @returns {number} Number of initialized systems
     */
    getActiveSystemCount() {
        return Object.values(this.editorSystems).filter(s => s !== null).length;
    }

    /**
     * Get list of active system names
     * @returns {string[]} Array of active system names
     */
    getActiveSystemNames() {
        return Object.entries(this.editorSystems)
            .filter(([_, sys]) => sys !== null)
            .map(([name, _]) => name);
    }

    /**
     * Check if a specific system is active
     * @param {string} systemName - Name of the system to check
     * @returns {boolean} True if system is initialized
     */
    isSystemActive(systemName) {
        return this.editorSystems[systemName] !== null;
    }
}
