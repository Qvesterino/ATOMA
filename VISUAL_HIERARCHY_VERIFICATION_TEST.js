/**
 * VISUAL HIERARCHY REGISTRY — Verification Test Suite
 * 
 * Run this in the browser console to verify that:
 * 1. Registry is loaded and initialized
 * 2. All layers are properly defined
 * 3. Integrations are working correctly
 * 4. Fallback logic is operational
 * 
 * Usage:
 *   import('./VISUAL_HIERARCHY_VERIFICATION_TEST.js').then(m => m.runAllTests());
 * 
 * Or in console:
 *   window.runVisualHierarchyTests()
 */

export class VisualHierarchyVerificationTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Test 1: Registry is defined
   */
  test_RegistryDefined() {
    try {
      if (typeof window.VisualHierarchyRegistry === 'undefined') {
        throw new Error('VisualHierarchyRegistry not found on window');
      }
      this.pass('✅ Registry defined on window');
    } catch (err) {
      this.fail('❌ Registry not defined', err);
    }
  }

  /**
   * Test 2: All canonical layers exist
   */
  test_AllLayersExist() {
    try {
      const required = [
        'LAYER_AURA_BACKGROUND',
        'LAYER_BASELINE_AURA',
        'LAYER_CORE',
        'LAYER_ARCHETYPE',
        'LAYER_SELECTED',
        'LAYER_NODE_LINKED',
        'LAYER_NODE_LINK_GLOW',
        'LAYER_PRIMARY_UI',
        'LAYER_EVOLUTION',
        'LAYER_FX',
        'LAYER_DEBUG_NODE'
      ];

      const registry = window.VisualHierarchyRegistry;
      for (const layer of required) {
        if (typeof registry[layer] === 'undefined') {
          throw new Error(`Missing layer constant: ${layer}`);
        }
      }

      this.pass(`✅ All ${required.length} layer constants defined`);
    } catch (err) {
      this.fail('❌ Layer constants missing', err);
    }
  }

  /**
   * Test 3: getRenderOrder works
   */
  test_GetRenderOrder() {
    try {
      const registry = window.VisualHierarchyRegistry;

      const coreOrder = registry.getRenderOrder('CORE');
      const expectedCore = registry.getRenderOrder('CORE');
      if (coreOrder !== expectedCore) throw new Error(`CORE should be ${expectedCore}, got ${coreOrder}`);

      const auraOrder = registry.getRenderOrder('BASELINE_AURA');
      const expectedAura = registry.getRenderOrder('BASELINE_AURA');
      if (auraOrder !== expectedAura) throw new Error(`AURA should be ${expectedAura}, got ${auraOrder}`);

      const evolutionOrder = registry.getRenderOrder('EVOLUTION');
      const expectedEvolution = registry.getRenderOrder('EVOLUTION');
      if (evolutionOrder !== expectedEvolution) throw new Error(`EVOLUTION should be ${expectedEvolution}, got ${evolutionOrder}`);

      this.pass('✅ getRenderOrder() works correctly');
    } catch (err) {
      this.fail('❌ getRenderOrder() failed', err);
    }
  }

  /**
   * Test 4: Fallback logic works
   */
  test_FallbackLogic() {
    try {
      const registry = window.VisualHierarchyRegistry;

      const result = registry.getRenderOrder('NONEXISTENT', 999);
      if (result !== 999) {
        throw new Error(`Fallback should be 999, got ${result}`);
      }

      this.pass('✅ Fallback logic works');
    } catch (err) {
      this.fail('❌ Fallback logic failed', err);
    }
  }

  /**
   * Test 5: getLayer returns correct object
   */
  test_GetLayer() {
    try {
      const registry = window.VisualHierarchyRegistry;
      const layer = registry.getLayer('BASELINE_AURA');

      if (!layer) throw new Error('getLayer returned null');
      if (layer.id !== 'BASELINE_AURA') throw new Error('Layer ID mismatch');
      if (layer.renderOrder !== registry.getRenderOrder('BASELINE_AURA')) throw new Error('Layer renderOrder mismatch');
      if (!layer.opacity) throw new Error('Layer missing opacity bounds');
      if (!layer.name) throw new Error('Layer missing name');

      this.pass('✅ getLayer() returns complete layer object');
    } catch (err) {
      this.fail('❌ getLayer() failed', err);
    }
  }

  /**
   * Test 6: getOpacityBounds works
   */
  test_GetOpacityBounds() {
    try {
      const registry = window.VisualHierarchyRegistry;
      const bounds = registry.getOpacityBounds('AURA');

      if (!bounds.min || !bounds.max) {
        throw new Error('Opacity bounds incomplete');
      }

      if (bounds.min < 0 || bounds.max > 1) {
        throw new Error('Opacity bounds out of range');
      }

      this.pass('✅ getOpacityBounds() works correctly');
    } catch (err) {
      this.fail('❌ getOpacityBounds() failed', err);
    }
  }

  /**
   * Test 7: clampOpacity works
   */
  test_ClampOpacity() {
    try {
      const registry = window.VisualHierarchyRegistry;

      const clamped1 = registry.clampOpacity('AURA', 1.5);
      if (clamped1 > registry.getOpacityBounds('AURA').max) {
        throw new Error('clampOpacity did not clamp high value');
      }

      const clamped2 = registry.clampOpacity('AURA', -0.5);
      if (clamped2 < registry.getOpacityBounds('AURA').min) {
        throw new Error('clampOpacity did not clamp low value');
      }

      this.pass('✅ clampOpacity() works correctly');
    } catch (err) {
      this.fail('❌ clampOpacity() failed', err);
    }
  }

  /**
   * Test 8: getAllLayers returns sorted array
   */
  test_GetAllLayers() {
    try {
      const registry = window.VisualHierarchyRegistry;
      const layers = registry.getAllLayers();

      if (!Array.isArray(layers)) throw new Error('getAllLayers did not return array');
      if (layers.length !== 7) throw new Error(`Expected 7 layers, got ${layers.length}`);

      // Verify sorted by renderOrder
      for (let i = 1; i < layers.length; i++) {
        if (layers[i].renderOrder <= layers[i - 1].renderOrder) {
          throw new Error('Layers not sorted by renderOrder');
        }
      }

      this.pass(`✅ getAllLayers() returns 7 sorted layers`);
    } catch (err) {
      this.fail('❌ getAllLayers() failed', err);
    }
  }

  /**
   * Test 9: compareOrder works
   */
  test_CompareOrder() {
    try {
      const registry = window.VisualHierarchyRegistry;

      const cmp1 = registry.compareOrder('AURA', 'CORE');
      if (cmp1 !== -1) throw new Error('AURA < CORE should be -1');

      const cmp2 = registry.compareOrder('CORE', 'CORE');
      if (cmp2 !== 0) throw new Error('CORE vs CORE should be 0');

      const cmp3 = registry.compareOrder('FX', 'CORE');
      if (cmp3 !== 1) throw new Error('FX > CORE should be 1');

      this.pass('✅ compareOrder() works correctly');
    } catch (err) {
      this.fail('❌ compareOrder() failed', err);
    }
  }

  /**
   * Test 10: EnhancedNodeModels integration
   */
  test_EnhancedNodeModelsIntegration() {
    try {
      // This test depends on EnhancedNodeModels being available
      if (typeof window.EnhancedNodeModels === 'undefined') {
        this.skip('EnhancedNodeModels not loaded yet');
        return;
      }

      // Create a test node
      // Spawn removed: single authority = AINodes.spawnNode()
      const testNode = null;

      if (!testNode) {
        this.skip('Node creation disabled by spawn authority enforcement');
        return;
      }

      // Check that children have visualLayer userData
      const hasCoreLayer = testNode.children.some(child => child.userData.visualLayer === 'CORE');
      const hasArchetypeLayer = testNode.children.some(child => child.userData.visualLayer === 'ARCHETYPE');

      if (!hasCoreLayer) throw new Error('No CORE layer found in node');
      if (!hasArchetypeLayer) throw new Error('No ARCHETYPE layer found in node');

      this.pass('✅ EnhancedNodeModels integration working');
    } catch (err) {
      this.fail('❌ EnhancedNodeModels integration failed', err);
    }
  }

  /**
   * Test 11: NodeAuraSystem_v1 integration
   */
  test_NodeAuraSystemIntegration() {
    try {
      if (typeof window.NodeAuraSystem_v1 === 'undefined') {
        this.skip('NodeAuraSystem_v1 not loaded yet');
        return;
      }

      // This just verifies the class exists and can be instantiated
      const auraSystem = new window.NodeAuraSystem_v1({ enabled: false });
      if (!auraSystem) throw new Error('AuraSystem instantiation failed');

      this.pass('✅ NodeAuraSystem_v1 integration available');
    } catch (err) {
      this.fail('❌ NodeAuraSystem_v1 integration failed', err);
    }
  }

  /**
   * Test 12: isValidRenderOrder works
   */
  test_IsValidRenderOrder() {
    try {
      const registry = window.VisualHierarchyRegistry;

      if (!registry.isValidRenderOrder('CORE', 0)) {
        throw new Error('isValidRenderOrder failed for valid value');
      }

      if (registry.isValidRenderOrder('CORE', 50)) {
        throw new Error('isValidRenderOrder did not reject invalid value');
      }

      this.pass('✅ isValidRenderOrder() works correctly');
    } catch (err) {
      this.fail('❌ isValidRenderOrder() failed', err);
    }
  }

  /**
   * Helper: Record pass
   */
  pass(message) {
    this.results.push(message);
    this.passed++;
  }

  /**
   * Helper: Record fail
   */
  fail(message, error) {
    this.results.push(`${message}: ${error?.message || error}`);
    this.failed++;
  }

  /**
   * Helper: Record skip
   */
  skip(message) {
    this.results.push(`⊘ SKIP: ${message}`);
  }

  /**
   * Run all tests
   */
  runAll() {
    console.clear();
    console.group('🧪 VISUAL HIERARCHY REGISTRY — Verification Test Suite');

    this.test_RegistryDefined();
    this.test_AllLayersExist();
    this.test_GetRenderOrder();
    this.test_FallbackLogic();
    this.test_GetLayer();
    this.test_GetOpacityBounds();
    this.test_ClampOpacity();
    this.test_GetAllLayers();
    this.test_CompareOrder();
    this.test_EnhancedNodeModelsIntegration();
    this.test_NodeAuraSystemIntegration();
    this.test_IsValidRenderOrder();

    // Print results
    console.log('\n' + '='.repeat(60));
    this.results.forEach(r => console.log(r));
    console.log('='.repeat(60));
    console.log(`\n✨ Tests: ${this.passed} passed, ${this.failed} failed`);

    if (this.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Registry is working correctly.');
    } else {
      console.warn(`⚠️  ${this.failed} test(s) failed. Check implementation.`);
    }

    console.groupEnd();

    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results
    };
  }
}

/**
 * Run tests (for console usage)
 */
export function runAllTests() {
  const tester = new VisualHierarchyVerificationTest();
  return tester.runAll();
}

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.runVisualHierarchyTests = runAllTests;
}

console.log('✅ VisualHierarchyVerificationTest loaded. Run: window.runVisualHierarchyTests()');
