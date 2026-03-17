// CATEGORY_POOLS vs NODE_VISUAL_REGISTRY Verification
// This script checks for any mismatches between the registry and the pools

import { NODE_VISUAL_REGISTRY, CATEGORY_POOLS } from './NodeVisualRegistry.js';

console.log('=== CATEGORY_POOLS VERIFICATION ===\n');

// Expected category ranges based on NODE_VISUAL_REGISTRY
const EXPECTED_RANGES = {
  'input': [100, 111],
  'process': [200, 209],
  'integration': [300, 316],
  'analytics': [400, 412],
  'storage': [500, 516],
  'control': [600, 621],
  'quantum': [700, 705],
  'sigma': [800, 807],
  'mythic': [900, 908],
  'prime': [1000, 1008],
  'error': [1100, 1108],
  'emotional': [1200, 1207]
};

// Build expected pools from NODE_VISUAL_REGISTRY
const expectedPools = {};
for (const [codeStr, def] of Object.entries(NODE_VISUAL_REGISTRY)) {
  const code = Number(codeStr);
  const category = def.category;
  if (!expectedPools[category]) expectedPools[category] = [];
  expectedPools[category].push(code);
}

// Sort expected pools
for (const cat of Object.keys(expectedPools)) {
  expectedPools[cat].sort((a, b) => a - b);
}

// Compare CATEGORY_POOLS with expected
console.log('=== CATEGORY POOLS COMPARISON ===\n');

const allCategories = new Set([
  ...Object.keys(CATEGORY_POOLS),
  ...Object.keys(expectedPools)
]);

let mismatches = [];

for (const category of allCategories) {
  const actualPool = CATEGORY_POOLS[category] || [];
  const expectedPool = expectedPools[category] || [];

  const isMatch = JSON.stringify(actualPool) === JSON.stringify(expectedPool);

  console.log(`\nCategory: ${category}`);
  console.log(`  Expected: [${expectedPool.join(', ')}]`);
  console.log(`  Actual:   [${actualPool.join(', ')}]`);
  console.log(`  Status:   ${isMatch ? '✅ MATCH' : '❌ MISMATCH'}`);

  if (!isMatch) {
    mismatches.push({
      category,
      expected: expectedPool,
      actual: actualPool
    });
  }
}

// Detailed analysis of mythic/prime/error
console.log('\n=== DETAILED ANALYSIS: MYTHIC/PRIME/ERROR ===\n');

const targetCategories = ['mythic', 'prime', 'error'];

for (const category of targetCategories) {
  console.log(`\n${category.toUpperCase()}:`);

  const pool = CATEGORY_POOLS[category] || [];
  console.log(`  Pool size: ${pool.length}`);

  if (pool.length === 0) {
    console.log(`  ❌ EMPTY POOL - This category will never spawn!`);
    continue;
  }

  // Check if codes are in expected range
  const [minCode, maxCode] = EXPECTED_RANGES[category] || [0, 0];
  const inRange = pool.every(code => code >= minCode && code <= maxCode);

  console.log(`  Expected range: ${minCode}-${maxCode}`);
  console.log(`  All in range: ${inRange ? '✅ YES' : '❌ NO'}`);

  // List each code with its registry entry
  console.log(`  Codes in pool:`);
  for (const code of pool) {
    const entry = NODE_VISUAL_REGISTRY[code];
    if (entry) {
      const correctCategory = entry.category === category;
      console.log(`    ${code}: category='${entry.category}' ${correctCategory ? '✅' : '❌ WRONG CATEGORY'}`);
    } else {
      console.log(`    ${code}: ❌ NOT IN REGISTRY`);
    }
  }

  // Check for codes from other categories
  const codesFromOtherCategories = pool.filter(code => {
    const entry = NODE_VISUAL_REGISTRY[code];
    return entry && entry.category !== category;
  });

  if (codesFromOtherCategories.length > 0) {
    console.log(`  ❌ CONTAINS ${codesFromOtherCategories.length} CODES FROM OTHER CATEGORIES:`);
    for (const code of codesFromOtherCategories) {
      const entry = NODE_VISUAL_REGISTRY[code];
      console.log(`    ${code}: should be '${entry.category}' but is in '${category}' pool`);
    }
  }
}

// Summary
console.log('\n=== SUMMARY ===\n');

if (mismatches.length === 0) {
  console.log('✅ All CATEGORY_POOLS match NODE_VISUAL_REGISTRY');
} else {
  console.log(`❌ Found ${mismatches.length} mismatched categories:`);
  for (const mismatch of mismatches) {
    console.log(`  - ${mismatch.category}`);
  }
}

// Check for empty pools
const emptyPools = Object.keys(CATEGORY_POOLS).filter(cat => CATEGORY_POOLS[cat].length === 0);
if (emptyPools.length > 0) {
  console.log(`\n❌ ${emptyPools.length} categories have empty pools (will never spawn):`);
  for (const cat of emptyPools) {
    console.log(`  - ${cat}`);
  }
}

// Check for missing categories
const missingCategories = Object.keys(expectedPools).filter(cat => !CATEGORY_POOLS[cat]);
if (missingCategories.length > 0) {
  console.log(`\n❌ ${missingCategories.length} categories are missing from CATEGORY_POOLS:`);
  for (const cat of missingCategories) {
    console.log(`  - ${cat} (expected codes: ${expectedPools[cat].join(', ')})`);
  }
}

console.log('\n=== VERIFICATION COMPLETE ===\n');
