/**
 * ============================================================================
 * LINK SEMANTIC PICTOGRAM SYSTEM WITH GLYPH FUSION
 * ============================================================================
 * 
 * Enhanced pictogram system with procedural glyph fusion at node convergences.
 * 
 * Wraps LinkSemanticPictogramSystem_Enhanced with GlyphFusionZoneManager.
 * 
 * ============================================================================
 */

import { LinkSemanticPictogramSystem_Enhanced } from './LinkSemanticPictogramSystem_Enhanced.js';
import { GlyphFusionZoneManager } from './GlyphFusionZone.js';
import { CompositeGlyphGenerator } from './CompositeGlyphGenerator.js';

export class LinkSemanticPictogramSystem_WithFusion {
    constructor(scene, worldRoot, linkingSystem, camera) {
        this.scene = scene;
        this.worldRoot = worldRoot;
        this.linkingSystem = linkingSystem;
        this.camera = camera;

        // Base pictogram system
        this.pictogramSystem = new LinkSemanticPictogramSystem_Enhanced(
            scene,
            linkingSystem,
            camera
        );

        // Composite glyph generator
        this.compositeGlyphGenerator = new CompositeGlyphGenerator();
        this.compositeGlyphGenerator.initializeResonanceFeedback(scene, camera, {
            linkingSystem
        });

        // Fusion zone manager
        this.fusionZoneManager = new GlyphFusionZoneManager(
            scene,
            worldRoot,
            this.compositeGlyphGenerator
        );
        this.root = this.fusionZoneManager.root;

        this.enabled = true;

        console.log('[WithFusion] Initialized with fusion support');
    }

    syncRuntimeDependencies(linkingSystem = this.linkingSystem, camera = this.camera) {
        if (linkingSystem) {
            this.linkingSystem = linkingSystem;
        }
        if (camera) {
            this.camera = camera;
        }

        if (this.pictogramSystem) {
            this.pictogramSystem.linkingSystem = this.linkingSystem;
            this.pictogramSystem.camera = this.camera;
        }

        if (this.compositeGlyphGenerator) {
            this.compositeGlyphGenerator.camera = this.camera;
        }
    }

    resetForWorldSwitch({ scene = this.scene, worldRoot = this.worldRoot, camera = this.camera, linkingSystem = this.linkingSystem, aiNodes = null } = {}) {
        this.scene = scene || this.scene;
        this.worldRoot = worldRoot || this.worldRoot;
        this.camera = camera || this.camera;
        this.linkingSystem = linkingSystem || this.linkingSystem;

        if (this.pictogramSystem) {
            this.pictogramSystem.scene = this.scene;
            this.pictogramSystem.camera = this.camera;
            this.pictogramSystem.linkingSystem = this.linkingSystem;
        }

        this.compositeGlyphGenerator?.resetForWorldSwitch?.(
            this.scene,
            this.camera,
            { linkingSystem: this.linkingSystem, aiNodes }
        );

        this.fusionZoneManager?.resetForWorldSwitch?.({
            scene: this.scene,
            worldRoot: this.worldRoot,
            camera: this.camera,
            linkingSystem: this.linkingSystem,
            aiNodes
        });

        return this;
    }

    // ========================================================================
    // UPDATE
    // ========================================================================

    update(deltaTime, time, aiNodes = null) {
        if (!this.enabled) return;

        const resolvedAiNodes = Array.isArray(aiNodes)
            ? aiNodes
            : (this.linkingSystem?.aiNodes?.nodes || null);

        this.syncRuntimeDependencies(this.linkingSystem, this.camera);

        // Update base pictogram system
        this.pictogramSystem.update(deltaTime, time);

        // Update fusion zones with pictogram data
        if (resolvedAiNodes) {
            this.fusionZoneManager.update(
                deltaTime,
                this.pictogramSystem.pictograms,
                this.linkingSystem,
                resolvedAiNodes
            );
        }
    }

    // ========================================================================
    // ENABLE / DISABLE
    // ========================================================================

    enable() {
        this.enabled = true;
        this.pictogramSystem.enable();
        console.log('[WithFusion] ENABLED');
    }

    disable() {
        this.enabled = false;
        this.pictogramSystem.disable();
        console.log('[WithFusion] DISABLED');
    }

    // ========================================================================
    // FUSION CONTROL
    // ========================================================================

    enableFusion() {
        this.fusionZoneManager.enabled = true;
        console.log('[WithFusion] Glyph fusion ENABLED');
    }

    disableFusion() {
        this.fusionZoneManager.enabled = false;
        console.log('[WithFusion] Glyph fusion DISABLED');
    }

    getFusionStatus() {
        const activeFusions = this.fusionZoneManager.zones.filter(z => z.active).length;
        return {
            activeFusions: activeFusions,
            maxFusions: this.fusionZoneManager.zones.length,
            compositeGlyphsActive: this.fusionZoneManager.compositeGlyphs.filter(c => c.active).length
        };
    }

    // ========================================================================
    // ACCESS TO BASE SYSTEM
    // ========================================================================

    // Forward pictogram pool access
    get pictograms() {
        return this.pictogramSystem.pictograms;
    }

    // Forward enable/disable
    get enabled() {
        return this._enabled;
    }

    set enabled(value) {
        this._enabled = value;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose() {
        this.pictogramSystem.dispose();
        this.fusionZoneManager.dispose();
        this.compositeGlyphGenerator.dispose();
        console.log('[WithFusion] Disposed');
    }
}
