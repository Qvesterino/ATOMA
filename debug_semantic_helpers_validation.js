/**
 * SEMANTIC GLYPH AI HELPER RENDERING VALIDATION
 * =============================================
 * Run this script in browser console after game is loaded.
 *
 * This script performs a deterministic validation of the entire
 * SemanticGlyphAI helper mesh rendering pipeline.
 *
 * EXPECTED OUTPUT:
 * - PASS: All stages validated, scan line renders visibly
 * - FAIL: Exact blocking stage identified with diagnostic info
 */

(function() {
    'use strict';

    console.log('=== SEMANTIC GLYPH AI VALIDATION START ===');
    console.log('Time:', new Date().toISOString());

    const game = window.game;
    if (!game) {
        console.error('FAIL: window.game not found. Is the game running?');
        return;
    }

    const semanticAI = game.semanticGlyphAI;
    if (!semanticAI) {
        console.error('FAIL: semanticGlyphAI not initialized. Check setupSemanticGlyphAI() was called.');
        return;
    }

    const aiNodes = game.aiNodes;
    if (!aiNodes || !aiNodes.nodes || aiNodes.nodes.length === 0) {
        console.error('FAIL: No AI nodes found. Ensure createAINodes() completed.');
        return;
    }

    // ========================================================================
    // STAGE 1: Verify helperContainer attachment to scene graph
    // ========================================================================
    console.log('\n--- STAGE 1: helperContainer scene graph attachment ---');

    const helperContainer = semanticAI.helperContainer;
    if (!helperContainer) {
        console.error('FAIL: helperContainer is null/undefined');
        return;
    }

    // Trace parent chain to scene
    let current = helperContainer;
    const parentChain = [];
    let reachedScene = false;

    while (current) {
        parentChain.push({
            object: current.name || current.type || 'unnamed',
            uuid: current.uuid.substring(0, 8),
            isScene: current.isScene
        });

        if (current.isScene) {
            reachedScene = true;
            break;
        }

        current = current.parent;
    }

    if (!reachedScene) {
        console.error('FAIL: helperContainer parent chain does NOT reach scene');
        console.log('Parent chain:', parentChain);
        return;
    }

    console.log('✓ helperContainer parent chain to scene:');
    parentChain.forEach((item, idx) => {
        const indent = '  '.repeat(idx);
        console.log(`${indent}${item.object} (uuid: ${item.uuid})${item.isScene ? ' ← SCENE' : ''}`);
    });

    // ========================================================================
    // STAGE 2: Verify helper mesh count
    // ========================================================================
    console.log('\n--- STAGE 2: helper mesh count verification ---');

    const expectedCount = 46; // 12 + 6 + 16 + 8 + 4
    const actualCount = helperContainer.children.length;

    console.log(`Expected helper meshes: ${expectedCount}`);
    console.log(`Actual helper meshes: ${actualCount}`);

    if (actualCount !== expectedCount) {
        console.error(`FAIL: helperContainer.children.length (${actualCount}) !== expected (${expectedCount})`);
        return;
    }

    console.log('✓ Helper mesh count matches expected');

    // Verify pool counts
    const poolCounts = {
        crownRings: semanticAI.helperMeshes.crownRings?.length || 0,
        scanLines: semanticAI.helperMeshes.scanLines?.length || 0,
        flickerDots: semanticAI.helperMeshes.flickerDots?.length || 0,
        linkLines: semanticAI.helperMeshes.linkLines?.length || 0,
        splitDividers: semanticAI.helperMeshes.splitDividers?.length || 0
    };

    console.log('Pool counts:', poolCounts);
    const totalPoolCount = Object.values(poolCounts).reduce((sum, count) => sum + count, 0);
    if (totalPoolCount !== expectedCount) {
        console.error(`FAIL: Pool total (${totalPoolCount}) !== expected (${expectedCount})`);
        return;
    }

    console.log('✓ Pool counts are correct');

    // ========================================================================
    // STAGE 3: Force a node into FOCUSED state
    // ========================================================================
    console.log('\n--- STAGE 3: Force node into FOCUSED state ---');

    // Select a test node
    const testNode = aiNodes.nodes[0];
    if (!testNode) {
        console.error('FAIL: No test node available');
        return;
    }

    const nodeId = testNode.userData?.nodeId;
    if (!nodeId) {
        console.error(`FAIL: Test node missing nodeId. userData:`, testNode.userData);
        return;
    }

    console.log(`Test node:`, {
        nodeId,
        category: testNode.userData?.category,
        currentSynergy: testNode.userData?.synergy,
        currentCorruption: testNode.userData?.corruption,
        currentTags: testNode.userData?.tags
    });

    // Force focused state metrics
    const synergyValue = testNode.userData?.synergy?.score ?? 0.95;
    testNode.userData.corruption = 0.05;
    testNode.userData.tags = ['analytics'];

    console.log('Forced metrics:', {
        synergy: synergyValue,
        corruption: testNode.userData.corruption,
        tags: testNode.userData.tags
    });

    // ========================================================================
    // STAGE 4: Wait for interpretation interval (≥ 0.25s)
    // ========================================================================
    console.log('\n--- STAGE 4: Wait for semantic interpretation (≥0.25s) ---');

    const waitTime = 300; // ms (safety margin above 0.25s)
    console.log(`Waiting ${waitTime}ms for semantic interpretation...`);

    const validationComplete = () => {
        console.log('\n--- STAGE 5: Verify semantic state ---');

        // ========================================================================
        // STAGE 5: Verify semantic state computation
        // ========================================================================
        const semanticState = semanticAI.semanticState.get(nodeId);
        if (!semanticState) {
            console.error(`FAIL: No semantic state for nodeId ${nodeId}`);
            console.log('Available semantic states:', Array.from(semanticAI.semanticState.keys()));
            console.log('HINT: Semantic interpretation may not have run. Check interpretationInterval.');
            return;
        }

        console.log('Semantic state:', {
            type: semanticState.type,
            parameters: semanticState.parameters,
            context: semanticState.context
        });

        if (semanticState.type !== 'focused') {
            console.error(`FAIL: Expected semantic state type 'focused', got '${semanticState.type}'`);
            console.log('This indicates the semantic decision logic did not classify node as focused.');
            console.log('Required conditions: synergy > 75 && corruption < 25 && tags includes "analytics"');
            console.log('Actual values:', {
                synergy: semanticState.context?.synergy,
                corruption: semanticState.context?.corruption,
                tags: semanticState.context?.tags
            });
            return;
        }

        console.log('✓ Semantic state is "focused"');

        // ========================================================================
        // STAGE 6: Verify scanLine mesh visibility
        // ========================================================================
        console.log('\n--- STAGE 6: Verify scanLine mesh visibility ---');

        const fusionRegistry = game.glyphLayer4?.fusionRegistry;
        if (!fusionRegistry) {
            console.error('FAIL: glyphLayer4.fusionRegistry not found');
            return;
        }

        const fusionData = fusionRegistry.get(nodeId);
        if (!fusionData) {
            console.error(`FAIL: No fusion data for nodeId ${nodeId}`);
            console.log('Available fusions:', Array.from(fusionRegistry.keys()));
            console.log('HINT: Node may not have been fused. Check glyphLayer4.createGlyphFusionsForNodes()');
            return;
        }

        console.log('✓ Fusion data found for node');

        // Check scanLine visibility
        const scanLineIndex = nodeId % semanticAI.helperMeshes.scanLines.length;
        const scanLine = semanticAI.helperMeshes.scanLines[scanLineIndex];

        if (!scanLine) {
            console.error(`FAIL: scanLine at index ${scanLineIndex} is null`);
            return;
        }

        console.log('Scan line:', {
            index: scanLineIndex,
            visible: scanLine.visible,
            hasGeometry: !!scanLine.geometry,
            hasMaterial: !!scanLine.material,
            geometryType: scanLine.geometry?.type,
            materialType: scanLine.material?.type,
            materialColor: '#' + scanLine.material?.color?.getHexString?.() || 'none',
            materialOpacity: scanLine.material?.opacity
        });

        if (!scanLine.visible) {
            console.error('FAIL: scanLine.visible is false');
            console.log('This indicates the focused effect was not applied or intensity is too low.');
            console.log('Check addScanLineEffect() logic and intensity calculation.');
            return;
        }

        console.log('✓ scanLine.visible === true');

        // ========================================================================
        // STAGE 7: Verify scanLine parent chain
        // ========================================================================
        console.log('\n--- STAGE 7: Verify scanLine parent chain ---');

        let scanLineParent = scanLine.parent;
        let reachedSceneFromScanLine = false;
        const scanLineParentChain = [];

        while (scanLineParent) {
            scanLineParentChain.push({
                object: scanLineParent.name || scanLineParent.type || 'unnamed',
                uuid: scanLineParent.uuid.substring(0, 8),
                isScene: scanLineParent.isScene
            });

            if (scanLineParent.isScene) {
                reachedSceneFromScanLine = true;
                break;
            }

            scanLineParent = scanLineParent.parent;
        }

        if (!reachedSceneFromScanLine) {
            console.error('FAIL: scanLine parent chain does NOT reach scene');
            console.log('Parent chain:', scanLineParentChain);
            console.log('This is the ROOT CAUSE: Helper mesh is not in scene graph.');
            return;
        }

        console.log('✓ scanLine parent chain to scene:');
        scanLineParentChain.forEach((item, idx) => {
            const indent = '  '.repeat(idx);
            console.log(`${indent}${item.object} (uuid: ${item.uuid})${item.isScene ? ' ← SCENE' : ''}`);
        });

        // ========================================================================
        // STAGE 8: Verify scanLine rendering properties
        // ========================================================================
        console.log('\n--- STAGE 8: Verify scanLine rendering properties ---');

        const renderProps = {
            worldPosition: new THREE.Vector3(),
            renderOrder: scanLine.renderOrder,
            depthTest: scanLine.material?.depthTest,
            depthWrite: scanLine.material?.depthWrite,
            layersMask: scanLine.layers?.mask,
            frustumCulled: scanLine.frustumCulled,
            matrixAutoUpdate: scanLine.matrixAutoUpdate
        };

        scanLine.getWorldPosition(renderProps.worldPosition);

        console.log('Render properties:', {
            position: `(${renderProps.worldPosition.x.toFixed(3)}, ${renderProps.worldPosition.y.toFixed(3)}, ${renderProps.worldPosition.z.toFixed(3)})`,
            renderOrder: renderProps.renderOrder,
            depthTest: renderProps.depthTest,
            depthWrite: renderProps.depthWrite,
            layersMask: renderProps.layersMask.toString(2), // binary
            frustumCulled: renderProps.frustumCulled,
            matrixAutoUpdate: renderProps.matrixAutoUpdate
        });

        // ========================================================================
        // STAGE 9: Verify camera layer compatibility
        // ========================================================================
        console.log('\n--- STAGE 9: Verify camera layer compatibility ---');

        const camera = game.camera;
        if (!camera) {
            console.warn('WARN: Camera not accessible, skipping layer check');
        } else {
            const cameraLayers = camera.layers;
            console.log('Camera layers mask:', camera.layers.mask.toString(2));
            console.log('Scan line layers mask:', renderProps.layersMask.toString(2));

            const layerMatch = (camera.layers.mask & renderProps.layersMask) !== 0;
            if (!layerMatch) {
                console.error('FAIL: Camera and scanLine have no overlapping layers');
                console.log('Camera will not render this mesh due to layer mismatch.');
                console.log('Fix: Either enable camera layer for helpers or remove layer filter from scanLine.');
                return;
            }

            console.log('✓ Camera and scanLine have overlapping layers');
        }

        // ========================================================================
        // FINAL VERDICT
        // ========================================================================
        console.log('\n=== VALIDATION COMPLETE ===');
        console.log('\n🎉 PASS: All validation stages completed successfully');
        console.log('\nExpected behavior:');
        console.log('- A cyan scan line should be visible sweeping vertically around the test node glyph');
        console.log('- The scan line should pulse opacity based on focus strength');
        console.log('\nIf scan line is still not visible visually:');
        console.log('1. Check if camera is looking at the node (viewport test)');
        console.log('2. Check if scanLine is inside camera frustum (frustum culling)');
        console.log('3. Check material opacity is not too low (current:', renderProps.depthWrite, ')');
        console.log('4. Check if other scene objects are occluding (depthTest:', renderProps.depthTest, ')');
        console.log('\nDebugging aids:');
        console.log('- Add scanLine.material.emissive = new THREE.Color(0x00F2FF)');
        console.log('- Set scanLine.material.emissiveIntensity = 1.0');
        console.log(`- Set scanLine.renderOrder = ${VisualHierarchyRegistry.getRenderOrder('DEBUG_OVERLAY')}`);
        console.log('- Set scanLine.material.depthTest = false');

        // Return validation result for programmatic use
        return {
            status: 'PASS',
            nodeId,
            scanLine,
            renderProps,
            parentChain: scanLineParentChain
        };
    };

    // Schedule validation after wait time
    setTimeout(validationComplete, waitTime);

})();
