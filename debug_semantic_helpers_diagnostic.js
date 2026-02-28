/**
 * SEMANTIC GLYPH AI HELPER RENDERING DIAGNOSTICS
 * ================================================
 * Use this script if the main validation fails or scan lines don't render.
 *
 * This script provides granular diagnostics and potential fixes.
 */

(function() {
    'use strict';

    console.log('=== SEMANTIC GLYPH AI DIAGNOSTICS ===');

    const game = window.game;
    if (!game) {
        console.error('Game not running');
        return;
    }

    const semanticAI = game.semanticGlyphAI;
    if (!semanticAI) {
        console.error('SemanticGlyphAI not initialized');
        return;
    }

    // ========================================================================
    // DIAGNOSTIC 1: Force all helpers visible
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 1: Force all helpers visible ---');

    const helperContainer = semanticAI.helperContainer;
    if (!helperContainer) {
        console.error('No helperContainer');
        return;
    }

    let visibleCount = 0;
    let hiddenCount = 0;

    helperContainer.children.forEach((helper, idx) => {
        const wasVisible = helper.visible;
        helper.visible = true;

        if (wasVisible) {
            visibleCount++;
        } else {
            hiddenCount++;
        }

        console.log(`Helper ${idx}: ${wasVisible ? 'visible' : 'was hidden → now visible'}, type: ${helper.type || helper.geometry?.type || 'unknown'}`);
    });

    console.log(`\nForced all helpers visible. Hidden: ${hiddenCount}, Already visible: ${visibleCount}`);

    // ========================================================================
    // DIAGNOSTIC 2: Check helper in camera frustum
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 2: Camera frustum check ---');

    const camera = game.camera;
    if (!camera) {
        console.warn('Camera not available');
    } else {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);

        let inFrustumCount = 0;
        let outOfFrustumCount = 0;

        helperContainer.children.forEach((helper, idx) => {
            // For lines, use bounding sphere
            if (!helper.geometry) {
                return;
            }

            if (!helper.geometry.boundingSphere) {
                helper.geometry.computeBoundingSphere();
            }

            const inFrustum = frustum.intersectsSphere(helper.geometry.boundingSphere);

            if (inFrustum) {
                inFrustumCount++;
            } else {
                outOfFrustumCount++;
            }

            if (idx < 3) { // Show first few for brevity
                console.log(`Helper ${idx} in frustum: ${inFrustum}, position:`, helper.position);
            }
        });

        console.log(`\nFrustum check: In frustum: ${inFrustumCount}, Out of frustum: ${outOfFrustumCount}`);

        if (outOfFrustumCount > 0) {
            console.warn('Some helpers are outside camera frustum and will not render');
            console.log('Move camera or disable frustum culling: helper.frustumCulled = false');
        }
    }

    // ========================================================================
    // DIAGNOSTIC 3: Material opacity and emissive
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 3: Material properties ---');

    const materialSummary = {};
    helperContainer.children.forEach((helper, idx) => {
        if (!helper.material) return;

        const matType = helper.material.constructor.name;
        if (!materialSummary[matType]) {
            materialSummary[matType] = {
                count: 0,
                avgOpacity: 0,
                hasEmissive: false
            };
        }

        materialSummary[matType].count++;
        if (helper.material.opacity !== undefined) {
            materialSummary[matType].avgOpacity += helper.material.opacity;
        }
        if (helper.material.emissive) {
            materialSummary[matType].hasEmissive = true;
        }
    });

    Object.entries(materialSummary).forEach(([type, stats]) => {
        if (stats.count > 0) {
            stats.avgOpacity = stats.avgOpacity / stats.count;
        }
        console.log(`${type}: count=${stats.count}, avgOpacity=${stats.avgOpacity.toFixed(3)}, hasEmissive=${stats.hasEmissive}`);
    });

    // ========================================================================
    // DIAGNOSTIC 4: Force emissive for visibility
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 4: Force emissive (make helpers glow) ---');

    let emissiveCount = 0;
    helperContainer.children.forEach((helper) => {
        if (!helper.material) return;

        // Save original values
        if (!helper.userData._originalOpacity) {
            helper.userData._originalOpacity = helper.material.opacity;
        }
        if (!helper.userData._originalEmissive) {
            helper.userData._originalEmissive = helper.material.emissive ? helper.material.emissive.getHex() : null;
        }
        if (!helper.userData._originalEmissiveIntensity) {
            helper.userData._originalEmissiveIntensity = helper.material.emissiveIntensity;
        }

        // Force emissive for visibility
        helper.material.emissive = new THREE.Color(0x00F2FF);
        helper.material.emissiveIntensity = 1.0;
        helper.material.opacity = 1.0;
        helper.material.transparent = false;
        helper.material.depthTest = false;

        emissiveCount++;
    });

    console.log(`Forced emissive on ${emissiveCount} helpers`);
    console.log('Helpers should now be bright cyan and fully visible');

    // ========================================================================
    // DIAGNOSTIC 5: Check render order
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 5: Force render order ---');

    helperContainer.children.forEach((helper, idx) => {
        if (!helper.userData._originalRenderOrder) {
            helper.userData._originalRenderOrder = helper.renderOrder;
        }
        helper.renderOrder = 9999; // Render last, on top
    });

    console.log('Forced renderOrder = 9999 on all helpers');
    console.log('Helpers should now render on top of all other objects');

    // ========================================================================
    // DIAGNOSTIC 6: Check scene hierarchy visualization
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 6: Scene hierarchy ---');

    function printHierarchy(obj, depth = 0) {
        const indent = '  '.repeat(depth);
        const visible = obj.visible ? '✓' : '✗';
        const hasChildren = obj.children && obj.children.length > 0;

        console.log(`${indent}${visible} ${obj.name || obj.type || 'unnamed'} (children: ${obj.children?.length || 0})`);

        if (hasChildren && depth < 3) {
            obj.children.forEach(child => printHierarchy(child, depth + 1));
        }
    }

    console.log('HelperContainer hierarchy:');
    printHierarchy(helperContainer, 1);

    // ========================================================================
    // DIAGNOSTIC 7: Create a test helper mesh
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 7: Create test helper mesh ---');

    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
    const testMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        wireframe: true
    });
    const testMesh = new THREE.Mesh(testGeometry, testMaterial);
    testMesh.name = 'TEST_HELPER';
    testMesh.visible = true;
    testMesh.position.set(0, 2, 0);
    testMesh.userData.isTestHelper = true;

    game.scene.add(testMesh);
    console.log('Added test red wireframe cube at (0, 2, 0)');
    console.log('If you see a red cube, Three.js rendering is working');
    console.log('If you do NOT see a red cube, camera/renderer issue exists');

    // ========================================================================
    // DIAGNOSTIC 8: Export diagnostic state
    // ========================================================================
    console.log('\n--- DIAGNOSTIC 8: Export state ---');

    const diagnosticState = {
        timestamp: new Date().toISOString(),
        helperContainer: {
            uuid: helperContainer.uuid,
            parent: helperContainer.parent?.name || helperContainer.parent?.type || 'none',
            childCount: helperContainer.children.length,
            visible: helperContainer.visible
        },
        camera: {
            position: camera?.position?.toArray(),
            rotation: camera?.rotation?.toArray(),
            layersMask: camera?.layers?.mask?.toString(2)
        },
        semanticAI: {
            enabled: semanticAI.enabled,
            interpretationInterval: semanticAI.interpretationInterval,
            stateCount: semanticAI.semanticState?.size || 0
        }
    };

    console.log('Diagnostic state:', JSON.stringify(diagnosticState, null, 2));

    // ========================================================================
    // REVERT FUNCTION
    // ========================================================================
    window.revertSemanticDiagnostics = function() {
        console.log('\n=== REVERTING SEMANTIC DIAGNOSTICS ===');

        // Remove test mesh
        const testMesh = game.scene.getObjectByName('TEST_HELPER');
        if (testMesh) {
            game.scene.remove(testMesh);
            testMesh.geometry.dispose();
            testMesh.material.dispose();
            console.log('Removed test helper mesh');
        }

        // Revert helper properties
        let revertedCount = 0;
        helperContainer.children.forEach((helper) => {
            if (!helper.material) return;

            // Revert opacity
            if (helper.userData._originalOpacity !== undefined) {
                helper.material.opacity = helper.userData._originalOpacity;
                helper.material.transparent = true;
            }

            // Revert emissive
            if (helper.userData._originalEmissive !== null) {
                helper.material.emissive = new THREE.Color(helper.userData._originalEmissive);
            }
            if (helper.userData._originalEmissiveIntensity !== undefined) {
                helper.material.emissiveIntensity = helper.userData._originalEmissiveIntensity;
            }

            // Revert render order
            if (helper.userData._originalRenderOrder !== undefined) {
                helper.renderOrder = helper.userData._originalRenderOrder;
            }

            // Revert depth test
            helper.material.depthTest = true;

            revertedCount++;
        });

        console.log(`Reverted ${revertedCount} helpers to original state`);
        console.log('Run window.semanticHelpersValidation() again for clean check');
    };

    console.log('\n=== DIAGNOSTICS COMPLETE ===');
    console.log('\nYou can now:');
    console.log('1. Look for the red test cube (if visible, rendering works)');
    console.log('2. Look for cyan helper meshes (they should now be very visible)');
    console.log('3. Check console output for any warnings');
    console.log('\nTo revert all diagnostic changes:');
    console.log('  window.revertSemanticDiagnostics()');
    console.log('\nTo run the main validation again:');
    console.log('  Copy and paste the contents of debug_semantic_helpers_validation.js');

})();
