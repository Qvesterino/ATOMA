/**
 * Comprehensive FrameScheduler No-Op Detection
 */

import fs from 'fs';

const mainJsContent = fs.readFileSync('D:/ATOMA_CLEAN/main.js', 'utf8');

// Split by registration calls and process each
const results = [];
const registrationRegex = /this\.frameScheduler\.register\s*\(\s*['"`](\w+)['"`]\s*,\s*\(([^)]*)\)\s*(?:=>)?\s*\{([\s\S]*?)\}\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g;

let match;
let matchCount = 0;

while ((match = registrationRegex.exec(mainJsContent)) !== null) {
    matchCount++;
    const layer = match[1];
    const params = match[2];
    const body = match[3].trim();
    const id = match[4];

    // Remove comments to analyze actual code
    const bodyWithoutComments = body
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();

    const result = {
        layer,
        id,
        bodyOriginal: body,
        bodyNoComments: bodyWithoutComments,
        isEmpty: bodyWithoutComments === '',
        isOnlyReturn: bodyWithoutComments.match(/^\s*return\s*;?\s*$/),
        isOnlyConditionals: false,
        hasSideEffects: false,
        reasons: []
    };

    // Check for common no-op patterns
    if (result.isEmpty) {
        result.reasons.push('Empty body (only comments/whitespace)');
    }

    // Check for bodies that only return undefined/nothing
    if (result.isOnlyReturn) {
        result.reasons.push('Only return statement with no value');
    }

    // Check for bodies that only have conditionals with early returns and no side effects
    if (!result.isEmpty && !result.isOnlyReturn) {
        // Check if all lines are conditionals
        const lines = bodyWithoutComments.split('\n').filter(l => l.trim());
        const allConditionals = lines.every(line => line.trim().startsWith('if') || line.trim().startsWith('}'));

        if (allConditionals && lines.length > 0) {
            // Check if any conditional has side effects (method calls or assignments)
            // Match: any identifier followed by '(' (method calls) or ' = ' (assignments)
            const hasMethodCall = bodyWithoutComments.match(/\w+\s*\(/);
            const hasAssignment = bodyWithoutComments.match(/[^=!]=[^=]/);

            if (!hasMethodCall && !hasAssignment) {
                result.isOnlyConditionals = true;
                result.reasons.push('Only conditional checks with no side effects');
            } else {
                result.hasSideEffects = true;
            }
        } else {
            result.hasSideEffects = true;
        }
    }

    results.push(result);
}

console.log(`\n${'='.repeat(90)}`);
console.log(`FRAMESCHEDULER NO-OP DETECTION REPORT`);
console.log(`${'='.repeat(90)}\n`);

console.log(`Total registrations analyzed: ${matchCount}`);
console.log(`Found in codebase: ${results.length}\n`);

const noOps = results.filter(r => r.isEmpty || r.isOnlyReturn || r.isOnlyConditionals);

console.log(`No-op systems: ${noOps.length}`);
console.log(`Active systems: ${results.length - noOps.length}\n`);

if (noOps.length > 0) {
    console.log(`\n${'='.repeat(90)}`);
    console.log(`NO-OP SYSTEMS (doing nothing)`);
    console.log(`${'='.repeat(90)}\n`);

    noOps.forEach((r, i) => {
        console.log(`${i + 1}. [${r.layer.toUpperCase()}] ${r.id}`);
        console.log(`   ${r.reasons.join(', ')}`);
        console.log(`   Code: ${r.bodyOriginal.substring(0, 150)}${r.bodyOriginal.length > 150 ? '...' : ''}`);
        console.log();
    });
}

// Also check for systems that might be doing redundant work
const potentiallyRedundant = results.filter(r => {
    if (r.isEmpty || r.isOnlyReturn || r.isOnlyConditionals) return false;
    // Check for optional chaining on potentially undefined systems
    const optionalChains = (r.bodyNoComments.match(/\?/g) || []).length;
    return optionalChains > 0 && r.bodyNoComments.length < 50;
});

if (potentiallyRedundant.length > 0) {
    console.log(`\n${'='.repeat(90)}`);
    console.log(`POTENTIALLY DORMANT SYSTEMS (optional chaining may skip execution)`);
    console.log(`${'='.repeat(90)}\n`);

    potentiallyRedundant.slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. [${r.layer.toUpperCase()}] ${r.id}`);
        console.log(`   Code: ${r.bodyOriginal.substring(0, 100)}...`);
    });

    if (potentiallyRedundant.length > 10) {
        console.log(`   ... and ${potentiallyRedundant.length - 10} more`);
    }
}

console.log(`\n${'='.repeat(90)}`);
console.log(`SUMMARY BY LAYER`);
console.log(`${'='.repeat(90)}\n`);

['realtime', 'visual', 'simulation', 'background'].forEach(layer => {
    const layerSystems = results.filter(r => r.layer === layer);
    const layerNoOps = layerSystems.filter(r => r.isEmpty || r.isOnlyReturn || r.isOnlyConditionals);
    console.log(`${layer.padEnd(15)} ${layerSystems.length.toString().padStart(3)} total (${layerNoOps.length} no-ops, ${layerSystems.length - layerNoOps.length} active)`);
});

console.log();
