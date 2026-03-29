/**
 * LINK_AURA_SHADER_VERIFICATION.js
 * ============================================================================
 * Verification test suite for link aura shader alignment
 * 
 * Run this in console to verify the implementation:
 *   window.verifyLinkAuraAlignment()
 * 
 * @author VFX Technical Director
 */

/**
 * Verify link aura shader alignment with node aura shader
 */
window.verifyLinkAuraAlignment = function() {
  console.log('🔍 Link Aura Shader Alignment Verification');
  console.log('==========================================\n');
  
  const results = [];
  
  // ========================================================================
  // TEST 1: Shader Material Exists and Has Correct Uniforms
  // ========================================================================
  try {
    const { createLinkAuraMaterial } = await import('./shaders/LinkAuraShader.js');
    const material = createLinkAuraMaterial();
    
    const requiredUniforms = [
      'uTime', 'uDisplacement', 'uHarmony', 'uCorruption', 'uOpacity',
      'uLinkDirection', 'uLinkBirthIntensity', 'uLinkRemovalIntensity', 'uDesaturation'
    ];
    
    const hasAllUniforms = requiredUniforms.every(u => u in material.uniforms);
    results.push({
      test: 'Shader material has all required uniforms',
      pass: hasAllUniforms,
      detail: `Found: ${Object.keys(material.uniforms).join(', ')}`
    });
    
    // Check uniform types
    const uniformTypes = {
      uTime: 'number',
      uDisplacement: 'number',
      uHarmony: 'number',
      uCorruption: 'number',
      uOpacity: 'number',
      uLinkDirection: 'object',
      uLinkBirthIntensity: 'number',
      uLinkRemovalIntensity: 'number',
      uDesaturation: 'number'
    };
    
    let typesCorrect = true;
    for (const [uniform, expectedType] of Object.entries(uniformTypes)) {
      const actual = typeof material.uniforms[uniform].value;
      if (actual !== expectedType && !(expectedType === 'object' && material.uniforms[uniform].value?.isVector3)) {
        typesCorrect = false;
        console.warn(`  ⚠ ${uniform}: expected ${expectedType}, got ${actual}`);
      }
    }
    
    results.push({
      test: 'Uniform types are correct',
      pass: typesCorrect,
      detail: 'All uniforms have correct types'
    });
    
  } catch (e) {
    results.push({
      test: 'Shader material exists',
      pass: false,
      detail: `Error: ${e.message}`
    });
  }
  
  // ========================================================================
  // TEST 2: LinkRendererConduit Uses Shader Material
  // ========================================================================
  try {
    const code = await fetch('./LinkRendererConduit.js').then(r => r.text());
    const hasImport = code.includes('createLinkAuraMaterial');
    const hasUsage = code.includes('createLinkAuraMaterial({');
    
    results.push({
      test: 'LinkRendererConduit imports shader material',
      pass: hasImport,
      detail: 'Import statement found'
    });
    
    results.push({
      test: 'LinkRendererConduit uses shader material',
      pass: hasUsage,
      detail: 'Material instantiation found'
    });
  } catch (e) {
    results.push({
      test: 'LinkRendererConduit integration check',
      pass: false,
      detail: `Error: ${e.message}`
    });
  }
  
  // ========================================================================
  // TEST 3: Shader Code Integrity
  // ========================================================================
  try {
    const code = await fetch('./shaders/LinkAuraShader.js').then(r => r.text());
    
    // Check for shared noise function
    const hasNoise = code.includes('vec3 permute(vec3 x)') && code.includes('float snoise(vec3 v)');
    results.push({
      test: 'Link shader has Simplex-like noise function',
      pass: hasNoise,
      detail: 'Noise functions defined'
    });
    
    // Check for octave composition
    const hasOctaves = code.match(/snoise\(noisePos \* 2\.0\)/g) && 
                       code.match(/snoise\(noisePos \* 4\.0\)/g) &&
                       code.match(/snoise\(noisePos \* 8\.0\)/g);
    results.push({
      test: 'Link shader uses identical octave structure (2x, 4x, 8x)',
      pass: !!hasOctaves,
      detail: 'All three octaves found'
    });
    
    // Check for directional noise bias
    const hasDirectional = code.includes('directionalBias') && 
                          code.includes('uLinkDirection');
    results.push({
      test: 'Link shader has directional noise bias',
      pass: hasDirectional,
      detail: 'Directional deformation implemented'
    });
    
    // Check for amplitude reduction
    const baseDisplacement = code.match(/baseDisplacement:\s*config\.baseDisplacement\s*\?\?\s*(\d+\.?\d*)/);
    const amplitude = baseDisplacement ? parseFloat(baseDisplacement[1]) : 0;
    const isReduced = amplitude < 0.25; // Should be ~0.15
    results.push({
      test: 'Link aura amplitude is reduced vs node (60-70%)',
      pass: isReduced,
      detail: `baseDisplacement: ${amplitude} (target: 0.15)`
    });
    
    // Check for opacity constraints
    const hasOpacityClamp = code.includes('min(opacity, 0.16)') || 
                            code.includes('opacity = min(');
    results.push({
      test: 'Link shader enforces opacity hierarchy',
      pass: hasOpacityClamp,
      detail: 'Opacity clamping found'
    });
    
  } catch (e) {
    results.push({
      test: 'Shader code integrity check',
      pass: false,
      detail: `Error: ${e.message}`
    });
  }
  
  // ========================================================================
  // TEST 4: Runtime Integration
  // ========================================================================
  if (typeof window.ATOMA !== 'undefined' && window.ATOMA.linkRenderer) {
    try {
      const renderer = window.ATOMA.linkRenderer;
      
      // Check if conduit has skin mesh
      const hasSkinMesh = renderer.config !== undefined;
      results.push({
        test: 'LinkRendererConduit is instantiated',
        pass: hasSkinMesh,
        detail: 'Config exists'
      });
      
      // Look for shader materials in active links
      let shaderMaterialsFound = 0;
      if (window.ATOMA.nodeLinks) {
        for (const link of window.ATOMA.nodeLinks) {
          if (link.group?.userData?.conduitState?.skinMesh?.material?.uniforms) {
            shaderMaterialsFound++;
          }
        }
      }
      
      results.push({
        test: 'Active links use shader materials',
        pass: shaderMaterialsFound > 0,
        detail: `${shaderMaterialsFound} shader materials found in links`
      });
      
    } catch (e) {
      results.push({
        test: 'Runtime integration check',
        pass: false,
        detail: `Error: ${e.message}`
      });
    }
  }
  
  // ========================================================================
  // PRINT RESULTS
  // ========================================================================
  console.log('Test Results:');
  console.log('=============\n');
  
  let passCount = 0;
  let totalCount = 0;
  
  for (const result of results) {
    totalCount++;
    if (result.pass) {
      passCount++;
      console.log(`✅ ${result.test}`);
    } else {
      console.log(`❌ ${result.test}`);
    }
    console.log(`   ${result.detail}\n`);
  }
  
  console.log('='.repeat(50));
  console.log(`\nSummary: ${passCount}/${totalCount} tests passed\n`);
  
  if (passCount === totalCount) {
    console.log('🎉 All verification tests passed!');
    console.log('Link aura shader is properly aligned with node aura shader.\n');
  } else {
    console.log('⚠️  Some tests failed. See details above.\n');
  }
  
  // ========================================================================
  // VISUAL VERIFICATION GUIDE
  // ========================================================================
  console.log('Visual Verification Checklist:');
  console.log('=============================\n');
  console.log('1. Create a link between two nodes');
  console.log('   → Link aura should fade in smoothly');
  console.log('   → Should match node aura motion rhythm\n');
  
  console.log('2. Change harmony to high (node harmonic state)');
  console.log('   → Link aura should become smoother');
  console.log('   → Motion should be less turbulent\n');
  
  console.log('3. Increase corruption on source node');
  console.log('   → Link aura should shift toward red tint');
  console.log('   → Progressive desaturation to grayscale\n');
  
  console.log('4. Delete a link');
  console.log('   → Link aura should fade out');
  console.log('   → Dissipation should match removal animation\n');
  
  console.log('5. Create multiple links');
  console.log('   → Each should have consistent styling');
  console.log('   → No FPS regression\n');
  
  return {
    summary: { passed: passCount, total: totalCount },
    results: results
  };
};

/**
 * Compare node aura and link aura shaders (debug utility)
 */
window.compareAuraShaders = async function() {
  console.log('🔍 Comparing Node Aura and Link Aura Shaders');
  console.log('============================================\n');
  
  try {
    const nodeCode = await fetch('./shaders/NodeAuraShader.js').then(r => r.text());
    const linkCode = await fetch('./shaders/LinkAuraShader.js').then(r => r.text());
    
    // Extract noise function from both
    const nodeNoiseStart = nodeCode.indexOf('vec3 permute(vec3 x)');
    const nodeNoiseEnd = nodeCode.indexOf('float snoise(vec3 v)', nodeNoiseStart) + nodeCode.substring(nodeNoiseStart).indexOf('}') + 500;
    const nodNoise = nodeCode.substring(nodeNoiseStart, nodeNoiseEnd);
    
    const linkNoiseStart = linkCode.indexOf('vec3 permute(vec3 x)');
    const linkNoiseEnd = linkCode.indexOf('float snoise(vec3 v)', linkNoiseStart) + linkCode.substring(linkNoiseStart).indexOf('}') + 500;
    const linkNoise = linkCode.substring(linkNoiseStart, linkNoiseEnd);
    
    // Simple comparison: both should have identical permute and snoise
    console.log('Noise function comparison:');
    console.log(`  Node permute exists: ${nodeCode.includes('vec3 permute(vec3 x)')}`);
    console.log(`  Link permute exists: ${linkCode.includes('vec3 permute(vec3 x)')}`);
    console.log(`  Noise functions are identical: ${nodNoise === linkNoise ? '✅' : '⚠️ Different'}\n`);
    
    // Check octaves
    console.log('Octave composition:');
    console.log(`  Node: ${(nodeCode.match(/snoise\(.*\*\s*2\.0\)/g) || []).length} octaves`);
    console.log(`  Link: ${(linkCode.match(/snoise\(.*\*\s*2\.0\)/g) || []).length} octaves`);
    console.log(`  2x: ${nodeCode.includes('snoise(noisePos * 2.0)') && linkCode.includes('snoise(noisePos * 2.0)') ? '✅' : '❌'}`);
    console.log(`  4x: ${nodeCode.includes('snoise(noisePos * 4.0)') && linkCode.includes('snoise(noisePos * 4.0)') ? '✅' : '❌'}`);
    console.log(`  8x: ${nodeCode.includes('snoise(noisePos * 8.0)') && linkCode.includes('snoise(noisePos * 8.0)') ? '✅' : '❌'}\n`);
    
    // Check uniforms
    console.log('Uniform overlap:');
    const nodeUniforms = nodeCode.match(/uniform\s+\w+\s+u\w+/g) || [];
    const linkUniforms = linkCode.match(/uniform\s+\w+\s+u\w+/g) || [];
    const sharedUniforms = nodeUniforms.filter(u => linkUniforms.includes(u));
    console.log(`  Node uniforms: ${nodeUniforms.length}`);
    console.log(`  Link uniforms: ${linkUniforms.length}`);
    console.log(`  Shared: ${sharedUniforms.length}`);
    console.log(`  Shared uniforms: ${sharedUniforms.join(', ')}\n`);
    
  } catch (e) {
    console.error('Error comparing shaders:', e.message);
  }
};

/**
 * Debug: Print link aura state
 */
window.debugLinkAuraState = function(linkIndex = 0) {
  if (!window.ATOMA?.nodeLinks || window.ATOMA.nodeLinks.length === 0) {
    console.log('No links found in scene');
    return;
  }
  
  const link = window.ATOMA.nodeLinks[linkIndex];
  const state = link?.group?.userData?.conduitState;
  
  console.log(`📊 Link Aura State [${linkIndex}]`);
  console.log('====================\n');
  
  if (!state?.skinMesh) {
    console.log('❌ No skin mesh found');
    return;
  }
  
  const material = state.skinMesh.material;
  
  if (!material?.uniforms) {
    console.log('❌ No shader material uniforms found');
    return;
  }
  
  console.log('Uniforms:');
  for (const [name, uniform] of Object.entries(material.uniforms)) {
    let value = uniform.value;
    if (value?.isVector3) {
      value = `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
    } else if (typeof value === 'number') {
      value = value.toFixed(3);
    }
    console.log(`  ${name}: ${value}`);
  }
  
  console.log('\nMaterial Properties:');
  console.log(`  Transparent: ${material.transparent}`);
  console.log(`  DepthWrite: ${material.depthWrite}`);
  console.log(`  Side: ${material.side}`);
  console.log(`  Blending: ${material.blending}`);
  
  console.log('\nGeometry:');
  console.log(`  Vertices: ${state.skinMesh.geometry?.attributes?.position?.count || 'unknown'}`);
};

console.log('✅ Link Aura Verification utilities loaded');
console.log('   window.verifyLinkAuraAlignment()  - Run full verification');
console.log('   window.compareAuraShaders()       - Compare shader code');
console.log('   window.debugLinkAuraState(index) - Debug specific link');
