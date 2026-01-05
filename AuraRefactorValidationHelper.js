/**
 * AURA REFACTOR VALIDATION HELPER
 * ================================
 * 
 * Comprehensive validation suite for the NodeAuraRefactor_ElegantRim system.
 * Provides console API for inspecting, testing, and validating aura behavior.
 * 
 * USAGE:
 * 
 *   import { setupAuraValidationAPI } from './AuraRefactorValidationHelper.js';
 *   setupAuraValidationAPI(auraSystem);
 *   
 *   // Then in console:
 *   aura.test()                    // Run full validation suite
 *   aura.validateCore(node)        // Check core geometry integrity
 *   aura.validateRim(node)         // Check rim appearance
 *   aura.validateBreathing()       // Check animation smoothness
 *   aura.inspect(nodeId)           // Deep inspect single aura
 */

export function setupAuraValidationAPI(auraSystem) {
  if (!auraSystem) {
    console.warn('[AURA VALIDATION] No aura system provided');
    return;
  }

  const API = {
    system: auraSystem,
    testResults: [],

    /**
     * CORE VALIDATION: Verify aura geometry doesn't intersect core
     */
    validateCore(node) {
      console.group('[AURA VALIDATION] Core Geometry Check');
      
      const checks = {
        'Node exists': !!node,
        'Node has position': node?.position !== undefined,
        'Node has scale': node?.scale !== undefined,
      };

      // Aura scale should be slightly larger than core
      const coreScale = node.scale.x || 1.0;
      const auraGeo = this.system.auraGeometry;
      
      checks['Aura geometry created'] = !!auraGeo;
      checks['Aura uses icosahedron'] = auraGeo?.type === 'IcosahedronGeometry';
      
      // Check that core is fully opaque
      checks['Core material is opaque'] = 
        node.material?.transparent === false ||
        node.material?.opacity === 1.0;

      // Check depth write
      const auras = this.system.auras;
      const hasAura = Array.from(auras.values()).some(a => a.node === node);
      
      if (hasAura) {
        const aura = Array.from(auras.values()).find(a => a.node === node);
        checks['Aura depthWrite is false'] = aura.material.depthWrite === false;
        checks['Aura depthTest is true'] = aura.material.depthTest === true;
        checks['Aura is additive blended'] = aura.material.blending === 2;  // THREE.AdditiveBlending
      }

      // Log results
      let passCount = 0;
      for (const [check, result] of Object.entries(checks)) {
        console.log(`  ${result ? '✅' : '❌'} ${check}`);
        if (result) passCount++;
      }

      console.log(`\nResult: ${passCount}/${Object.keys(checks).length} checks passed`);
      console.groupEnd();

      return passCount === Object.keys(checks).length;
    },

    /**
     * RIM VALIDATION: Verify fresnel rim behavior
     */
    validateRim(node) {
      console.group('[AURA VALIDATION] Rim Lighting Check');

      const auras = this.system.auras;
      const aura = Array.from(auras.values()).find(a => a.node === node);

      if (!aura) {
        console.warn('  No aura registered for this node');
        console.groupEnd();
        return false;
      }

      const checks = {
        'Aura mesh exists': !!aura.mesh,
        'Material has uniforms': !!aura.material.uniforms,
        'Has uRimPower': !!aura.material.uniforms.uRimPower,
        'Has uRimIntensity': !!aura.material.uniforms.uRimIntensity,
        'Has uFresnelMin': !!aura.material.uniforms.uFresnelMin,
        'Has uFresnelMax': !!aura.material.uniforms.uFresnelMax,
        'Rim power in valid range': 
          aura.material.uniforms.uRimPower.value >= 1.0 &&
          aura.material.uniforms.uRimPower.value <= 3.0,
        'Rim intensity in valid range':
          aura.material.uniforms.uRimIntensity.value >= 0.05 &&
          aura.material.uniforms.uRimIntensity.value <= 0.15,
        'Fresnel min is low': aura.material.uniforms.uFresnelMin.value < 0.05,
        'Fresnel max is high': aura.material.uniforms.uFresnelMax.value > 0.9,
      };

      let passCount = 0;
      for (const [check, result] of Object.entries(checks)) {
        console.log(`  ${result ? '✅' : '⚠️'} ${check}`);
        if (result) passCount++;
      }

      console.log(`\nRim Parameters:`);
      console.log(`  rimPower: ${aura.material.uniforms.uRimPower.value.toFixed(2)}`);
      console.log(`  rimIntensity: ${aura.material.uniforms.uRimIntensity.value.toFixed(3)}`);
      console.log(`  fresnelMin: ${aura.material.uniforms.uFresnelMin.value.toFixed(3)}`);
      console.log(`  fresnelMax: ${aura.material.uniforms.uFresnelMax.value.toFixed(3)}`);

      console.log(`\nResult: ${passCount}/${Object.keys(checks).length} checks passed`);
      console.groupEnd();

      return passCount > Object.keys(checks).length - 2;  // Allow 1-2 warnings
    },

    /**
     * ANIMATION VALIDATION: Verify breathing animation
     */
    validateBreathing() {
      console.group('[AURA VALIDATION] Breathing Animation Check');

      const auras = this.system.auras;
      
      if (auras.size === 0) {
        console.warn('  No auras registered');
        console.groupEnd();
        return false;
      }

      const sampleAura = Array.from(auras.values())[0];
      const checks = {
        'Has uTime uniform': !!sampleAura.material.uniforms.uTime,
        'Has uBreathingIntensity': !!sampleAura.material.uniforms.uBreathingIntensity,
        'Has uBreathingAmplitude': !!sampleAura.material.uniforms.uBreathingAmplitude,
        'Breathing intensity > 0': sampleAura.material.uniforms.uBreathingIntensity.value > 0,
        'Breathing amplitude in range [0, 1]':
          sampleAura.material.uniforms.uBreathingAmplitude.value >= 0 &&
          sampleAura.material.uniforms.uBreathingAmplitude.value <= 1,
      };

      let passCount = 0;
      for (const [check, result] of Object.entries(checks)) {
        console.log(`  ${result ? '✅' : '⚠️'} ${check}`);
        if (result) passCount++;
      }

      console.log(`\nBreathing Parameters:`);
      console.log(`  intensity: ${sampleAura.material.uniforms.uBreathingIntensity.value.toFixed(2)} cycles/3s`);
      console.log(`  amplitude: ${sampleAura.material.uniforms.uBreathingAmplitude.value.toFixed(2)}`);
      console.log(`  time: ${sampleAura.material.uniforms.uTime.value.toFixed(2)}s`);

      console.log(`\nResult: ${passCount}/${Object.keys(checks).length} checks passed`);
      console.log(`\nTo verify smooth breathing animation:`);
      console.log(`  1. Disable other visual effects (post-processing, bloom)`);
      console.log(`  2. Focus camera on single node`);
      console.log(`  3. Watch aura intensity oscillate smoothly`);
      console.log(`  4. Should complete ~1 cycle per 3 seconds`);
      console.log(`  5. NO flickering, NO jerky movement`);

      console.groupEnd();

      return passCount === Object.keys(checks).length;
    },

    /**
     * DEEP INSPECTION: Single aura analysis
     */
    inspect(nodeIdOrNode) {
      console.group('[AURA INSPECTION] Deep Dive');

      const auras = this.system.auras;
      let aura;

      if (typeof nodeIdOrNode === 'object') {
        aura = Array.from(auras.values()).find(a => a.node === nodeIdOrNode);
      } else {
        aura = auras.get(nodeIdOrNode);
      }

      if (!aura) {
        console.warn('  Aura not found');
        console.groupEnd();
        return;
      }

      console.log('=== AURA INSTANCE ===');
      console.log(`Node: ${aura.node.userData?.nodeName || 'Unknown'}`);
      console.log(`Visible: ${aura.visible}`);
      console.log(`Profile: ${aura.profile.name}`);

      console.log('\n=== GEOMETRY ===');
      console.log(`Mesh type: ${aura.mesh.type}`);
      console.log(`Position: ${aura.mesh.position.toArray().map(v => v.toFixed(2)).join(', ')}`);
      console.log(`Scale: ${aura.mesh.scale.toArray().map(v => v.toFixed(3)).join(', ')}`);
      console.log(`Geometry: ${aura.mesh.geometry.type}`);
      console.log(`Geometry vertices: ${aura.mesh.geometry.attributes.position.count}`);

      console.log('\n=== MATERIAL ===');
      console.log(`Type: ${aura.material.type}`);
      console.log(`Transparent: ${aura.material.transparent}`);
      console.log(`Blending: ${this._getBlendingName(aura.material.blending)}`);
      console.log(`depthWrite: ${aura.material.depthWrite}`);
      console.log(`depthTest: ${aura.material.depthTest}`);
      console.log(`side: ${this._getSideName(aura.material.side)}`);

      console.log('\n=== UNIFORMS ===');
      console.log(`uRimPower: ${aura.material.uniforms.uRimPower.value.toFixed(2)}`);
      console.log(`uRimIntensity: ${aura.material.uniforms.uRimIntensity.value.toFixed(4)}`);
      console.log(`uFresnelMin: ${aura.material.uniforms.uFresnelMin.value.toFixed(3)}`);
      console.log(`uFresnelMax: ${aura.material.uniforms.uFresnelMax.value.toFixed(3)}`);
      console.log(`uAuraOpacity: ${aura.material.uniforms.uAuraOpacity.value.toFixed(3)}`);
      console.log(`uBreathingIntensity: ${aura.material.uniforms.uBreathingIntensity.value.toFixed(2)}`);
      console.log(`uBreathingAmplitude: ${aura.material.uniforms.uBreathingAmplitude.value.toFixed(2)}`);
      console.log(`uTime: ${aura.material.uniforms.uTime.value.toFixed(2)}s`);

      console.log('\n=== COLOR ===');
      const hexColor = '#' + aura.profile.color.getHexString();
      const rgb = aura.material.uniforms.uAuraColor.value;
      console.log(`Hex: ${hexColor}`);
      console.log(`RGB: (${(rgb.r * 255).toFixed(0)}, ${(rgb.g * 255).toFixed(0)}, ${(rgb.b * 255).toFixed(0)})`);

      console.log('\n=== ANIMATION STATE ===');
      console.log(`Current intensity: ${aura.currentIntensity.toFixed(4)}`);
      console.log(`Target intensity: ${aura.targetIntensity.toFixed(4)}`);

      console.groupEnd();
    },

    /**
     * FULL VALIDATION SUITE
     */
    test() {
      console.group('[AURA VALIDATION] FULL TEST SUITE');

      const results = {
        totalNodes: this.system.auras.size,
        testsRun: 0,
        testsPassed: 0,
      };

      if (results.totalNodes === 0) {
        console.warn('No auras registered for testing');
        console.groupEnd();
        return results;
      }

      // Test first node for core/rim validation
      const firstAura = Array.from(this.system.auras.values())[0];

      console.log(`\n📋 CORE VALIDATION (${firstAura.node.userData?.nodeName})`);
      results.testsRun++;
      if (this.validateCore(firstAura.node)) results.testsPassed++;

      console.log(`\n📋 RIM VALIDATION (${firstAura.node.userData?.nodeName})`);
      results.testsRun++;
      if (this.validateRim(firstAura.node)) results.testsPassed++;

      console.log(`\n📋 ANIMATION VALIDATION`);
      results.testsRun++;
      if (this.validateBreathing()) results.testsPassed++;

      console.log(`\n📋 REGISTRY CHECK`);
      console.log(`  Total auras: ${results.totalNodes}`);
      const allVisible = Array.from(this.system.auras.values()).every(a => a.visible);
      console.log(`  ${allVisible ? '✅' : '⚠️'} All auras have visibility set`);
      if (allVisible) results.testsPassed++;
      results.testsRun++;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`FINAL RESULT: ${results.testsPassed}/${results.testsRun} validation groups passed`);
      console.log(`Auras tested: ${results.totalNodes}`);
      console.log(`${'='.repeat(60)}`);

      return results;
    },

    /**
     * Helper: Get blending mode name
     */
    _getBlendingName(mode) {
      const names = {
        0: 'NormalBlending',
        1: 'AdditiveBlending',
        2: 'AdditiveBlending',
        3: 'SubtractiveBlending',
        4: 'MultiplyBlending',
        5: 'MultiplyBlending',
      };
      return names[mode] || `Unknown(${mode})`;
    },

    /**
     * Helper: Get side name
     */
    _getSideName(side) {
      const names = {
        0: 'FrontSide',
        1: 'BackSide',
        2: 'DoubleSide',
      };
      return names[side] || `Unknown(${side})`;
    },
  };

  // Expose global API
  window.aura = API;

  console.log('[AURA VALIDATION] API ready');
  console.log('Available commands:');
  console.log('  aura.test()                - Run full validation suite');
  console.log('  aura.validateCore(node)    - Check core geometry');
  console.log('  aura.validateRim(node)     - Check rim appearance');
  console.log('  aura.validateBreathing()   - Check animation');
  console.log('  aura.inspect(node)         - Deep inspect aura');

  return API;
}

export default setupAuraValidationAPI;
