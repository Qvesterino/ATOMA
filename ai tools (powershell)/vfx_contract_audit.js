#!/usr/bin/env node
/**
 * FX Contract Audit Script
 * Scans all ATOMA FX files against the 9-point contract from contract.fx.md.
 * Outputs per-file verdict: KEEP / FIX / ISOLATE / KILL
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'docs', 'maj');

// Known FX filenames (explicit list from design plan)
const EXPLICIT_FX_FILES = new Set([
  '_AdaptiveGlyphRendering1_0.js',
  '_AiEmotionalFeed3_1.js',
  '_AINarrativePatterns6_0.js',
  '_AIThoughtStorms2_0.js',
  '_AmbientEntityManager.js',
  '_AmbientEntityRegistry.js',
  '_AtomaGlyphSystem4_0.js',
  'AIConsciousnessLayer.js',
  'ArchetypeShaderModes_v1.js',
  'CanonicalGeometryFamilies_v1.js',
  'CanonicalTemplate3_StressVisuals.js',
  'CascadeBurstVisual_Session147.js',
  'CascadeEventBridge_v1.js',
  'CascadeParticleSystem_Session120.js',
  'CascadeResonanceWaveVisualization_Session146.js',
  'CascadeSystemConsoleAPI.js',
  'CascadeToWaveBridge_v1.js',
  'CascadeWaveParticles.js',
  'CascadingRuptureSystem.js',
  'CinematicUpgrade.js',
  'CognitiveHorizonPlane.js',
  'ColonyVFXManager.js',
  'CompositeGlyphGenerator.js',
  'CompositeGlyphResonanceFeedback.js',
  'CoreHologramShader.js',
  'CorruptionVisualFX_v1.js',
  'CriticalNodeFailureSystem.js',
  'DistanceLODController.js',
  'DreamDepthEffectManager.js',
  'EchoRippleIntegrationPatch_Session125.js',
  'EchoRippleSystem_Session125.js',
  'EnergyVisualProfile.js',
  'EnhancedNodeModels.js',
  'EnvironmentalHazards.js',
  'EventVisualSuppression_v1.js',
  'FireLikeAuraConfig.js',
  'FresnelAuraIntegrationPatch.js',
  'FresnelRimLightAuraShader.js',
  'FXPerformanceController_v1.js',
  'FXPerformanceSmoothTransition_v1.js',
  'GlyphAnimationModulator.js',
  'GlyphFusionZone.js',
  'harmony/HarmonicAudioReactivitySystem_Session135.js',
  'harmony/HarmonicCascadeAmplification_Session145.js',
  'harmony/HarmonicHealingRecoveryVisualSystem.js',
  'harmony/HarmonicHubAuraSystem_Session126.js',
  'harmony/HarmonicHubCascade.js',
  'harmony/HarmonicHubLifecycle.js',
  'harmony/HarmonicHubSync.js',
  // REMOVED: HarmonicInfluencePropagationSystem_Session127.js — moved to LEGACY (2026-05-14)
  // REMOVED: HarmonicNodeResonanceHalos.js — moved to LEGACY (2026-05-14)
  // REMOVED: HarmonicHealingVisualSystem_Session134.js — moved to LEGACY (2026-05-14)
  // REMOVED: HarmonicRecoveryVisualSystem_Session138.js — moved to LEGACY (2026-05-14)
  'harmony/HarmonicResonanceCoupling_v1.js',
  'harmony/HarmonicResonanceFeedbackSystem.js',
  'harmony/HarmonicTopologyLearningSystem.js',
  'NeuralConvergenceSingularity.js',
  'SafeQuantumIllusionsPack1.js',
  '_SafeEvolutionManager.js',
  '_SafeLegendaryLinkFX.js',
  '_SafeLegendaryWorldEvents.js',
  '_SafeAIWeatherPack.js',
  '_SafeWorldFXPack.js',
  'SynergyCascadeVisualizer.js',
  'T2_CorruptionVisualIntegration_v1.js',
  'T2_HarmonyVisualConsumer_v1.js',
  'VisualUpgradeSuperpack.js',
  '_LinkedGlyphMessaging3_0.js',
  '_LinkedGlyphSynchronization1_0.js',
  '_RecursiveGlyphMessaging4_0.js',
  '_ProceduralMeaningEngine.js',
  '_NodeVisualBootstrap3_0.js',
  '_ExtremeAIShaderPack.js',
  '_EmergentThoughtStorms5_0.js',
  '_GlyphFusionOverlay4_1.js',
  'PHASE5_CascadeVisuals.js',
  'TIER4_CorruptionFeedbackVisuals_v1.js',
  '_GlyphLayer4_MultiFusion.js',
  '_SemanticGlyphAI.js',
]);

const OWNER_CROSSREF_FILES = ['main.js', 'EnvironmentDomainController.js'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    return null;
  }
}

function findFiles(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && entry.name.endsWith(pattern)) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// FXFileScanner
// ---------------------------------------------------------------------------

class FXFileScanner {
  constructor(root) {
    this.root = root;
  }

  scan() {
    const allJs = findFiles(this.root, '.js');
    const files = [];
    const explicitFound = new Set();

    for (const filePath of allJs) {
      const basename = path.basename(filePath);
      if (EXPLICIT_FX_FILES.has(basename)) {
        files.push(filePath);
        explicitFound.add(basename);
        continue;
      }
      if (this._isFxHeuristic(filePath)) {
        files.push(filePath);
      }
    }

    const missing = [...EXPLICIT_FX_FILES].filter(f => !explicitFound.has(f));
    if (missing.length) {
      console.warn(`[WARN] ${missing.length} explicit FX files not found: ${missing.sort().join(', ')}`);
    }

    // Deduplicate and sort
    const seen = new Set();
    const unique = [];
    for (const p of files.sort()) {
      const rp = path.resolve(p);
      if (!seen.has(rp)) {
        seen.add(rp);
        unique.push(p);
      }
    }
    return unique;
  }

  _isFxHeuristic(filePath) {
    const content = readFile(filePath);
    if (!content) return false;
    const hasExportClass = content.includes('export class');
    const hasThree = ['THREE.Mesh', 'THREE.Line', 'THREE.Points', 'THREE.Group'].some(k => content.includes(k));
    const hasMaterial = ['ShaderMaterial', 'MeshBasicMaterial', 'MeshStandardMaterial'].some(k => content.includes(k));
    const hasScene = content.includes('scene.add') || content.includes('scene.remove');
    const hasDispose = content.includes('.dispose()');
    return hasExportClass && (hasThree || hasMaterial || hasScene || hasDispose);
  }
}

// ---------------------------------------------------------------------------
// CategoryDetector
// ---------------------------------------------------------------------------

class CategoryDetector {
  constructor() {
    this.CATEGORIES = [
      ['LINK FX', ['linkId', 'link.source', 'link.target', 'linkingSystem', 'LinkFX', 'LinkCascade', 'LinkBead', 'LinkCollapse']],
      ['NODE FX', ['nodeId', 'node.position', 'node.userData', 'NodeFX', 'registerNode', 'AINodes', 'EnhancedNode', 'NodeVisual', 'NodeResonance']],
      ['ENVIRONMENT FX', ['worldRoot', 'environmentRoot', 'WORLD_OVERLAY', 'WORLD_BACKGROUND', 'Environment', 'WeatherPack', 'WorldFX', 'Atmosphere', 'DreamDepth']],
      ['CASCADE/WAVE', ['Cascade', 'Wave', 'Resonance', 'Rupture', 'Burst', 'SynergyCascade', 'HarmonicCascade', 'CascadeParticle']],
      ['PARTICLE FX', ['THREE.Points', 'ParticleSystem', 'Particle', 'spawnCount', 'pool', 'PointsMaterial', 'particlePools']],
      ['SHADER/MATERIAL', ['ShaderMaterial', 'onBeforeCompile', 'uniforms', 'vertexShader', 'fragmentShader', 'ArchetypeShader', 'AuraShader', 'HologramShader']],
    ];
  }

  detect(content, filename) {
    const scores = {};
    for (const [cat, keywords] of this.CATEGORIES) {
      let score = 0;
      for (const kw of keywords) {
        if (content.includes(kw) || filename.includes(kw)) score++;
      }
      if (score) scores[cat] = score;
    }
    if (!Object.keys(scores).length) return 'UNKNOWN';
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }
}

// ---------------------------------------------------------------------------
// ContractChecker
// ---------------------------------------------------------------------------

class ContractChecker {
  check(content, filename) {
    return [
      this._checkPurpose(content),
      this._checkOwner(content, filename),
      this._checkTrigger(content),
      this._checkGate(content, filename),
      this._checkUpdate(content),
      this._checkBudget(content),
      this._checkLifetime(content),
      this._checkDispose(content),
      this._checkDebug(content),
    ];
  }

  _checkPurpose(content) {
    const pattern = /\/\*\*[\s\S]*?(visual|effect|vfx|fx|overlay|particle|shader|cascade|wave|aura|glow)/i;
    if (pattern.test(content)) {
      return { name: 'PURPOSE', passed: true, detail: 'JSDoc/comment with FX keywords found' };
    }
    if (/\/\*\*[\s\S]*?\*\//.test(content)) {
      return { name: 'PURPOSE', passed: true, detail: 'Block comment present (generic)' };
    }
    return { name: 'PURPOSE', passed: false, detail: 'No purpose documentation' };
  }

  _checkOwner(content, filename) {
    const owners = [];
    if (content.includes('EnvironmentDomainController')) owners.push('EnvironmentDomainController');
    if (content.includes('LinkRendererConduit')) owners.push('LinkRendererConduit');
    if (content.includes('FrameScheduler')) owners.push('FrameScheduler');
    if (content.includes('semanticBus') || content.includes('SemanticBus')) owners.push('SemanticBus');
    if (content.includes('constructor') && content.includes('scene')) owners.push('scene-based');
    if (owners.length) {
      return { name: 'OWNER', passed: true, detail: `Detected: ${owners.join(', ')}` };
    }
    return { name: 'OWNER', passed: false, detail: 'No known owner reference' };
  }

  _checkTrigger(content) {
    const triggers = [];
    if (/\.(on\(|addEventListener|subscribe)/.test(content)) triggers.push('event');
    if (/synergy|harmony|stability|corruption|loadPressure/i.test(content)) triggers.push('metric');
    if (content.includes('link.') || content.includes('linkId')) triggers.push('link-state');
    if (content.includes('node.') || content.includes('nodeId')) triggers.push('node-state');
    if (/worldState|atmosphereState|weatherState/.test(content)) triggers.push('environment');
    if (content.includes('update(deltaTime') || content.includes('update(dt')) triggers.push('per-frame');
    if (triggers.length) {
      return { name: 'TRIGGER', passed: true, detail: `Detected: ${triggers.join(', ')}` };
    }
    return { name: 'TRIGGER', passed: false, detail: 'No clear trigger mechanism' };
  }

  _checkGate(content, filename) {
    const gates = [];
    if (/this\.(enabled|disabled)\b|setEnabled\b/.test(content)) gates.push('enabled-flag');
    if (content.includes('frameScheduler') || content.includes('shouldRunVisual') || content.includes('shouldRunSimulation')) gates.push('scheduler');
    if (/LOD|distance|farDistance/.test(content)) gates.push('LOD');
    if (/cooldown|lastTime|interval/i.test(content)) gates.push('cooldown');
    if (/if\s*\(\s*!this\.\w+/.test(content)) gates.push('null-guard');
    if (content.includes('!this.frameScheduler?.shouldRunVisual?.()')) {
      return { name: 'GATE', passed: false, detail: 'CRITICAL: frameScheduler optional-chain bug — always blocks update' };
    }
    if (gates.length) {
      return { name: 'GATE', passed: true, detail: `Detected: ${gates.join(', ')}` };
    }
    return { name: 'GATE', passed: false, detail: 'No gate mechanism found' };
  }

  _checkUpdate(content) {
    if (/update\s*\(/.test(content)) {
      if (/update\s*\([^)]*\)\s*\{[\s\S]*?return/.test(content)) {
        return { name: 'UPDATE', passed: true, detail: 'update() with early return' };
      }
      return { name: 'UPDATE', passed: true, detail: 'update() present (no early return)' };
    }
    return { name: 'UPDATE', passed: false, detail: 'No update() method' };
  }

  _checkBudget(content) {
    if (/maxParticles|maxCount|pool.*size|cap|limit|MAX_/i.test(content)) {
      return { name: 'BUDGET', passed: true, detail: 'Budget cap keywords found' };
    }
    return { name: 'BUDGET', passed: false, detail: 'No budget cap detected' };
  }

  _checkLifetime(content) {
    const lifetime = [];
    if (/TTL|lifetime|duration|maxAge|age/i.test(content)) lifetime.push('TTL');
    if (/fadeOut|dissolve|despawn/i.test(content)) lifetime.push('fade-out');
    if (/pool.*release|returnToPool|recycle/i.test(content)) lifetime.push('pool');
    if (content.includes('scene.remove') || content.includes('removeFromScene')) lifetime.push('scene-remove');
    if (lifetime.length) {
      return { name: 'LIFETIME', passed: true, detail: `Detected: ${lifetime.join(', ')}` };
    }
    return { name: 'LIFETIME', passed: false, detail: 'No lifetime management' };
  }

  _checkDispose(content) {
    if (/dispose\s*\(\)/.test(content)) {
      const details = [];
      if (content.includes('scene.remove') || content.includes('scene\.remove')) details.push('scene-remove');
      if (/\.geometry\.dispose|geometry\.dispose/.test(content)) details.push('geometry');
      if (/\.material\.dispose|material\.dispose/.test(content)) details.push('material');
      if (/\.clear\(\)/.test(content)) details.push('clear-maps');
      if (/removeEventListener|unsubscribe|off\(/.test(content)) details.push('unsubscribe');
      const detail = details.length ? `dispose() with: ${details.join(', ')}` : 'dispose() present';
      return { name: 'DISPOSE', passed: true, detail };
    }
    return { name: 'DISPOSE', passed: false, detail: 'No dispose() method' };
  }

  _checkDebug(content) {
    const consoleCalls = (content.match(/console\.(log|warn|error|info)/g) || []).length;
    const hasDebug = /debugMode|this\.debug|DEBUG|_debug/.test(content);
    const wrapped = (content.match(/if\s*\(\s*(?:this\.)?debug(?:Mode)?\s*\)\s*\{[^}]*console\.(log|warn|error|info)/g) || []).length;
    if (consoleCalls === 0) {
      return { name: 'DEBUG', passed: true, detail: 'No console calls' };
    }
    if (hasDebug && (wrapped >= consoleCalls * 0.5 || consoleCalls <= 3)) {
      return { name: 'DEBUG', passed: true, detail: `${consoleCalls} console calls, debug guard present` };
    }
    if (consoleCalls > 3 && !hasDebug) {
      return { name: 'DEBUG', passed: false, detail: `${consoleCalls} console calls without debug flag` };
    }
    return { name: 'DEBUG', passed: true, detail: `${consoleCalls} console calls, debug flag present` };
  }
}

// ---------------------------------------------------------------------------
// RiskAssessor
// ---------------------------------------------------------------------------

class RiskAssessor {
  assess(checks, content, filename) {
    let score = 0;
    const checkMap = Object.fromEntries(checks.map(c => [c.name, c]));

    if (!checkMap.DISPOSE?.passed) score += 3;
    if (!checkMap.GATE?.passed) score += 2;
    if (!checkMap.BUDGET?.passed) score += 2;
    if (!checkMap.DEBUG?.passed) score += 1;
    if (!checkMap.OWNER?.passed) score += 1;
    if (!checkMap.UPDATE?.passed) score += 1;

    if (content.includes('RoundedBoxGeometry') && content.includes('opacity') && content.includes('0.0')) score += 3;
    if (content.includes('THREE.Points') && content.includes('sizeAttenuation') && content.replace(/\s/g, '').includes('position(0,0,0)')) score += 2;
    if (content.includes('Geometry') && !content.includes('BufferGeometry')) score += 2;

    let level = 'LOW';
    if (score <= 1) level = 'LOW';
    else if (score <= 3) level = 'MID';
    else level = 'HIGH';
    return [score, level];
  }
}

// ---------------------------------------------------------------------------
// VerdictEngine
// ---------------------------------------------------------------------------

class VerdictEngine {
  decide(checks, riskScore, riskLevel) {
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.length - passed;

    if (failed === 0) return 'KEEP';
    if (failed <= 2 && (riskLevel === 'LOW' || riskLevel === 'MID')) return 'FIX';
    if (failed >= 3 && riskLevel === 'MID') return 'ISOLATE';
    if (riskLevel === 'HIGH' || failed >= 6) return 'KILL';
    if (failed <= 2) return 'FIX';
    return 'ISOLATE';
  }
}

// ---------------------------------------------------------------------------
// OwnerCrossRef
// ---------------------------------------------------------------------------

class OwnerCrossRef {
  constructor(root) {
    this.root = root;
    this.owners = {};
    this._scan();
  }

  _scan() {
    for (const fname of OWNER_CROSSREF_FILES) {
      const filePath = path.join(this.root, fname);
      const content = readFile(filePath);
      if (!content) continue;

      let m;
      const newRe = /new\s+([A-Za-z0-9_]+)\s*\(/g;
      while ((m = newRe.exec(content)) !== null) {
        this.owners[m[1]] = fname;
      }

      const importRe = /import\s+\{?\s*([A-Za-z0-9_]+)\s*\}?\s+from\s+['"]([^'"]+)['"]/g;
      while ((m = importRe.exec(content)) !== null) {
        const className = m[1];
        const src = m[2];
        if (src.endsWith('.js')) {
          this.owners[className] = fname;
        }
      }
    }
  }

  getOwner(className, filename) {
    if (className && this.owners[className]) {
      return this.owners[className];
    }
    if (filename.includes('Environment') || filename.includes('World') || filename.includes('Weather')) {
      return 'EnvironmentDomainController (heuristic)';
    }
    if (filename.includes('Link')) {
      return 'LinkRendererConduit (heuristic)';
    }
    if (filename.includes('Node') || filename.includes('AINodes')) {
      return 'main.js (heuristic)';
    }
    return 'UNKNOWN';
  }
}

// ---------------------------------------------------------------------------
// ReportGenerator
// ---------------------------------------------------------------------------

class ReportGenerator {
  constructor(reports) {
    this.reports = reports;
  }

  printConsole() {
    console.log('\n' + '='.repeat(70));
    console.log('FX CONTRACT AUDIT');
    console.log('='.repeat(70));
    console.log(`Scanning ${this.reports.length} FX files...\n`);

    for (const r of this.reports) {
      const boxWidth = 70;
      console.log('┌' + '─'.repeat(boxWidth) + '┐');
      console.log(`│ FILE: ${r.filename.padEnd(boxWidth - 7)}│`);
      console.log(`│ Category: ${r.category.padEnd(boxWidth - 11)}│`);
      console.log(`│ Owner: ${r.owner.padEnd(boxWidth - 8)}│`);
      console.log(`│ Trigger: ${r.trigger.padEnd(boxWidth - 10)}│`);
      const riskLine = `│ Risk: ${r.riskLevel} (score ${r.riskScore})`;
      console.log(riskLine.padEnd(boxWidth + 1) + '│');
      console.log(`│ Verdict: ${r.verdict.padEnd(boxWidth - 10)}│`);
      console.log('├' + '─'.repeat(boxWidth) + '┤');
      const checkLine = r.checks.map(c => `${c.name}:${c.passed ? '✅' : '❌'}`).join(' ');
      let remaining = checkLine;
      while (remaining.length) {
        const chunk = remaining.slice(0, boxWidth - 2);
        remaining = remaining.slice(boxWidth - 2);
        console.log(`│ ${chunk.padEnd(boxWidth - 2)}│`);
      }
      console.log('└' + '─'.repeat(boxWidth) + '┘');
      console.log();
    }

    const summary = { KEEP: 0, FIX: 0, ISOLATE: 0, KILL: 0 };
    for (const r of this.reports) {
      summary[r.verdict] = (summary[r.verdict] || 0) + 1;
    }

    console.log('='.repeat(70));
    console.log('SUMMARY:');
    for (const v of ['KEEP', 'FIX', 'ISOLATE', 'KILL']) {
      console.log(`  ${v.padEnd(10)} ${summary[v]} files`);
    }
    console.log('='.repeat(70));
  }

  generateMarkdown() {
    const lines = [
      '# FX Contract Audit Report',
      '',
      `**Date:** auto-generated  `,
      `**Files Scanned:** ${this.reports.length}  `,
      '',
      '## Summary',
      '',
    ];
    const summary = { KEEP: 0, FIX: 0, ISOLATE: 0, KILL: 0 };
    for (const r of this.reports) summary[r.verdict] = (summary[r.verdict] || 0) + 1;
    for (const v of ['KEEP', 'FIX', 'ISOLATE', 'KILL']) {
      lines.push(`- **${v}:** ${summary[v]} files`);
    }
    lines.push('');
    lines.push('## Per-File Details');
    lines.push('');
    lines.push('| File | Category | Owner | Trigger | Risk | Verdict | Checks |');
    lines.push('|------|----------|-------|---------|------|---------|--------|');
    for (const r of this.reports) {
      const checksStr = r.checks.map(c => `${c.name}:${c.passed ? '✅' : '❌'}`).join(' ');
      lines.push(`| ${r.filename} | ${r.category} | ${r.owner} | ${r.trigger} | ${r.riskLevel}(${r.riskScore}) | ${r.verdict} | ${checksStr} |`);
    }
    lines.push('');
    lines.push('## Risk Details');
    lines.push('');
    for (const r of this.reports) {
      if (r.riskLevel === 'MID' || r.riskLevel === 'HIGH') {
        lines.push(`### ${r.filename}`);
        lines.push(`- **Risk:** ${r.riskLevel} (score ${r.riskScore})`);
        lines.push(`- **Verdict:** ${r.verdict}`);
        for (const c of r.checks) {
          if (!c.passed) lines.push(`- **${c.name}:** ❌ ${c.detail}`);
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  generateJSON() {
    const data = this.reports.map(r => ({
      filename: r.filename,
      category: r.category,
      owner: r.owner,
      trigger: r.trigger,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
      verdict: r.verdict,
      checks: Object.fromEntries(r.checks.map(c => [c.name, { passed: c.passed, detail: c.detail }])),
    }));
    return JSON.stringify(data, null, 2);
  }

  writeOutputs() {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const mdPath = path.join(OUTPUT_DIR, 'FX_CONTRACT_AUDIT_REPORT.md');
    const jsonPath = path.join(OUTPUT_DIR, 'FX_CONTRACT_AUDIT_DATA.json');
    fs.writeFileSync(mdPath, this.generateMarkdown(), 'utf-8');
    fs.writeFileSync(jsonPath, this.generateJSON(), 'utf-8');
    console.log('[INFO] Reports written to:');
    console.log(`       ${mdPath}`);
    console.log(`       ${jsonPath}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const scanner = new FXFileScanner(WORKSPACE_ROOT);
  const files = scanner.scan();
  if (!files.length) {
    console.error('[ERROR] No FX files found.');
    process.exit(1);
  }

  const categoryDetector = new CategoryDetector();
  const contractChecker = new ContractChecker();
  const riskAssessor = new RiskAssessor();
  const verdictEngine = new VerdictEngine();
  const ownerXref = new OwnerCrossRef(WORKSPACE_ROOT);

  const reports = [];

  for (const filePath of files) {
    const content = readFile(filePath);
    if (content === null) {
      console.warn(`[WARN] Could not read ${filePath}`);
      continue;
    }

    const classMatch = content.match(/export\s+class\s+([A-Za-z0-9_]+)/);
    const className = classMatch ? classMatch[1] : null;

    const category = categoryDetector.detect(content, path.basename(filePath));
    const checks = contractChecker.check(content, path.basename(filePath));
    const [riskScore, riskLevel] = riskAssessor.assess(checks, content, path.basename(filePath));
    const verdict = verdictEngine.decide(checks, riskScore, riskLevel);
    const owner = ownerXref.getOwner(className, path.basename(filePath));

    const triggerCheck = checks.find(c => c.name === 'TRIGGER');
    const trigger = triggerCheck ? triggerCheck.detail : 'UNKNOWN';

    reports.push({
      filename: path.basename(filePath),
      filepath: filePath,
      category,
      owner,
      trigger,
      checks,
      riskScore,
      riskLevel,
      verdict,
      className,
    });
  }

  const verdictOrder = { KILL: 0, ISOLATE: 1, FIX: 2, KEEP: 3 };
  reports.sort((a, b) => {
    const va = verdictOrder[a.verdict] ?? 99;
    const vb = verdictOrder[b.verdict] ?? 99;
    if (va !== vb) return va - vb;
    return a.filename.localeCompare(b.filename);
  });

  const generator = new ReportGenerator(reports);
  generator.printConsole();
  generator.writeOutputs();

  process.exit(0);
}

main();
