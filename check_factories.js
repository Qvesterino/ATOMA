// SCRIPT: Check all createControl functions for nodeId handling

const fs = require('fs');
const content = fs.readFileSync('EnhancedNodeModels.js', 'utf8');

// Find all createControl functions
const createControlMatches = content.matchAll(/static createControl\w+\(group[^)]*\)/g);

console.log(`Found ${createControlMatches.length} createControl functions:`);
createControlMatches.forEach((match, idx) => {
  console.log(`${idx + 1}. ${match}`);
});

// Find all "return group;" statements
const returnGroupMatches = content.matchAll(/return group;/g);

console.log(`\nFound ${returnGroupMatches.length} "return group;" statements`);

// Find all "Copy nodeId" comments
const copyNodeIdMatches = content.matchAll(/Copy nodeId from input group/g);

console.log(`\nFound ${copyNodeIdMatches.length} "Copy nodeId" comments`);

// Find all userData.nodeId assignments
const nodeIdAssignments = content.matchAll(/\.userData\.nodeId\s*=/g);

console.log(`\nFound ${nodeIdAssignments.length} "userData.nodeId =" assignments`);

// Find all functions with "Copy nodeId" comment
const functionsWithCopyId = [];
const functionDefinitions = content.matchAll(/static\s+(\w+)\([^)]*\)\s*\{[\s\S]{0,500}Copy nodeId from input group/g);

console.log(`\nFunctions with "Copy nodeId from input group": ${functionDefinitions.length}`);
functionDefinitions.forEach((match, idx) => {
  const funcName = match.match(/static\s+(\w+)/)?.[1];
  if (funcName) {
    console.log(`${idx + 1}. ${funcName}`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Factories: ${createControlMatches.length}`);
console.log(`Return group: ${returnGroupMatches.length}`);
console.log(`Copy nodeId comments: ${copyNodeIdMatches.length}`);
console.log(`nodeId assignments: ${nodeIdAssignments.length}`);
console.log(`Functions with Copy nodeId: ${functionDefinitions.length}`);
