/**
 * FrameScheduler System Analysis
 *
 * Detects scheduler systems that do nothing:
 * - Empty update() bodies
 * - Bodies with only logging
 * - Bodies with only conditional checks without side effects
 */

import fs from 'fs';

const mainJsContent = fs.readFileSync('D:/ATOMA_CLEAN/main.js', 'utf8');
const registrations = [];

// Extract all frameScheduler.register() calls
const registerRegex = /frameScheduler\.register\s*\(\s*['"`](\w+)['"`]\s*,\s*\(([^)]*)\)\s*=>?\s*\{([^}]+)\}\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g;

let match;
while ((match = registerRegex.exec(mainJsContent)) !== null) {
    const layer = match[1];
    const params = match[2];
    const body = match[3].trim();
    const id = match[4];

    // Analyze the body
    const analysis = {
        layer,
        params,
        id,
        body,
        isEmpty: false,
        isLogOnly: false,
        isConditionalOnly: false,
        hasSideEffects: false,
        calls: [],
        reasons: []
    };

    // Check for empty body (only whitespace/comments)
    const cleanBody = body.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (cleanBody === '') {
        analysis.isEmpty = true;
        analysis.reasons.push('Empty body (only comments/whitespace)');
    }

    // Check for log-only body
    const logMatches = (body.match(/console\.(log|warn|info|error|debug)\(/g) || []);
    if (logMatches.length > 0 && cleanBody.match(/console\.(log|warn|info|error|debug)\(/)?.length === logMatches.length) {
        // Check if there are non-log statements
        const nonLogCode = cleanBody.replace(/console\.(log|warn|info|error|debug)\([^)]*\);?\s*/g, '').trim();
        if (nonLogCode === '') {
            analysis.isLogOnly = true;
            analysis.reasons.push(`Log-only body (${logMatches.length} log statement(s))`);
        }
    }

    // Check for conditional-only body (early returns without side effects)
    if (cleanBody.startsWith('if') && !cleanBody.match(/[^a-zA-Z0-9_.]([a-zA-Z0-9_.]+\.)(update|set|add|remove|emit|trigger|push|splice|delete|dispose|create|spawn|kill)\s*\(/)) {
        // Look for function calls that could have side effects
        const sideEffectPatterns = [
            /\.update\(/,
            /\.render\(/,
            /\.dispose\(/,
            /console\./,
            /\.set\(/,
            /.+ = /,
            /\+\+|--/,
        ];
        const hasSideEffects = sideEffectPatterns.some(pattern => cleanBody.match(pattern));
        if (!hasSideEffects && !cleanBody.match(/\breturn\b/)) {
            // Check if body only has conditionals
            const nonConditional = cleanBody.replace(/if\s*\([^)]*\)\s*\{[^}]*\}\s*/g, '').trim();
            if (nonConditional === '') {
                analysis.isConditionalOnly = true;
                analysis.reasons.push('Conditional-only body (no side effects detected)');
            }
        }
    }

    // Extract function calls
    const callRegex = /(?:this\.)?([a-zA-Z0-9_]+)\.(?:[a-zA-Z0-9_]+)/g;
    let callMatch;
    while ((callMatch = callRegex.exec(body)) !== null) {
        if (!analysis.calls.includes(callMatch[1])) {
            analysis.calls.push(callMatch[1]);
        }
    }

    // Detect side effects
    analysis.hasSideEffects = !analysis.isEmpty && !analysis.isLogOnly;

    registrations.push(analysis);
}

// Output results
console.log(`\n${'='.repeat(80)}`);
console.log(`FRAMESCHEDULER SYSTEM ANALYSIS`);
console.log(`${'='.repeat(80)}\n`);

const noOps = registrations.filter(r => r.isEmpty || r.isLogOnly || r.isConditionalOnly);

console.log(`Total registrations: ${registrations.length}`);
console.log(`No-op systems (empty, log-only, or conditional-only): ${noOps.length}`);
console.log(`Active systems: ${registrations.length - noOps.length}\n`);

if (noOps.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`NO-OP SYSTEMS DETECTED`);
    console.log(`${'='.repeat(80)}\n`);

    noOps.forEach((r, i) => {
        console.log(`${i + 1}. [${r.layer.toUpperCase()}] ${r.id}`);
        console.log(`   Reason(s): ${r.reasons.join(', ')}`);
        console.log(`   Body: ${r.body.substring(0, 200)}${r.body.length > 200 ? '...' : ''}`);
        console.log();
    });
}

// Categorize by layer
console.log(`\n${'='.repeat(80)}`);
console.log(`BREAKDOWN BY LAYER`);
console.log(`${'='.repeat(80)}\n`);

['realtime', 'visual', 'simulation', 'background'].forEach(layer => {
    const layerSystems = registrations.filter(r => r.layer === layer);
    const layerNoOps = layerSystems.filter(r => r.isEmpty || r.isLogOnly || r.isConditionalOnly);
    console.log(`${layer.toUpperCase()}: ${layerSystems.length} total (${layerNoOps.length} no-ops, ${layerSystems.length - layerNoOps.length} active)`);
});

// Export to JSON
fs.writeFileSync('D:/ATOMA_CLEAN/framescheduler_analysis.json', JSON.stringify(registrations, null, 2));
console.log(`\nFull analysis exported to: framescheduler_analysis.json`);
