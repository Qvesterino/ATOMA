#!/usr/bin/env node
/**
 * ATOMA Gate & Policy Detector
 * A static analysis tool that scans JS/TS files for gating patterns,
 * policy/lock gates, high-risk mutations, and global flag usage.
 * 
 * Usage: node tools/gate_detector.js [root-directory]
 * Default root: current directory (.. relative to tools/)
 */

  import fs from 'fs';
  import path from 'path';
  import { fileURLToPath } from 'url';
  
  // Get __dirname equivalent in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION: Detection Patterns
// ============================================================================

const PATTERNS = {
  // Early-return gating patterns
  gate: [
    // Generic early returns with negation
    {
      regex: /if\s*\(\s*!\s*[^)]+\)\s*return/gi,
      description: 'Early return with negated condition'
    },
    // Enabled checks
    {
      regex: /if\s*\(\s*!this\.enabled[^)]*\)\s*return/gi,
      description: 'Enabled check with early return'
    },
    {
      regex: /if\s*\(\s*!enabled[^)]*\)\s*return/gi,
      description: 'Enabled variable check with early return'
    },
    // Authority/gate checks
    {
      regex: /if\s*\(\s*!hasAuthority[^)]*\)\s*return/gi,
      description: 'Authority check with early return'
    },
    {
      regex: /if\s*\(\s*!isAuthorized[^)]*\)\s*return/gi,
      description: 'Authorization check with early return'
    },
    {
      regex: /if\s*\(\s*!canAccess[^)]*\)\s*return/gi,
      description: 'Access check with early return'
    },
    // Initialization checks
    {
      regex: /if\s*\(\s*!isInitialized[^)]*\)\s*return/gi,
      description: 'Initialization check with early return'
    },
    {
      regex: /if\s*\(\s*!initialized[^)]*\)\s*return/gi,
      description: 'Initialized variable check with early return'
    }
  ],

  // Policy/lock gates
  policy: [
    // Configuration locks
    {
      regex: /CONFIG\./g,
      description: 'CONFIG global access'
    },
    // Lock patterns
    {
      regex: /LOCK_/g,
      description: 'LOCK_ prefix constant'
    },
    // Visual authority systems
    {
      regex: /VisualAuthorityLock\./gi,
      description: 'VisualAuthorityLock usage'
    },
    {
      regex: /VisualAuthority/gi,
      description: 'VisualAuthority reference'
    },
    // Wrapper/guard keywords
    {
      regex: /\b(Freeze|Enforce|Guard|Policy|Wrapper|Nuclear|Sanitize|Hardening)\b/gi,
      description: 'Policy/Guard/Wrapper keyword'
    },
    // Hardening patterns
    {
      regex: /Hardening/gi,
      description: 'Hardening reference'
    },
    // Nuclear locks
    {
      regex: /Nuclear/gi,
      description: 'Nuclear lock reference'
    },
    // Enforcement patterns
    {
      regex: /Enforce/gi,
      description: 'Enforcement reference'
    },
    // Compliance patterns
    {
      regex: /Compliance/gi,
      description: 'Compliance reference'
    },
    // Gate patterns
    {
      regex: /\bGate\b/gi,
      description: 'Gate class/variable reference'
    },
    // Authority patterns
    {
      regex: /Authority/gi,
      description: 'Authority reference'
    }
  ],

  // High-risk mutations
  mutation: [
    // Scene mutations
    {
      regex: /scene\.(traverse|add|remove|overrideMaterial|fog)/g,
      description: 'Scene mutation (traverse/add/remove/overrideMaterial/fog)'
    },
    {
      regex: /scene\.clear\(/g,
      description: 'Scene clear'
    },
    // Renderer mutations
    {
      regex: /renderer\.(autoClear|setRenderTarget|clear|clearDepth|clearColor|clearStencil|clearBuffer|setScissor|setScissorTest|setViewport)/g,
      description: 'Renderer state mutation'
    },
    // Material mutations (high-risk properties)
    {
      regex: /material\.(opacity|transparent|depthWrite|depthTest|side|blending|blendDst|blendSrc|blendEquation|blendEquationAlpha|blendDstAlpha|blendSrcAlpha|needsUpdate|uniforms)/g,
      description: 'Material property mutation'
    },
    // Render order mutations
    {
      regex: /\.renderOrder\s*=/g,
      description: 'Render order assignment'
    },
    // Visible mutations
    {
      regex: /\.visible\s*=/g,
      description: 'Visible property assignment'
    },
    // Geometry mutations
    {
      regex: /\.geometry\s*=/g,
      description: 'Geometry property assignment'
    },
    // Material assignment
    {
      regex: /\.material\s*=/g,
      description: 'Material property assignment'
    },
    // Dispose mutations
    {
      regex: /\.dispose\(\)/g,
      description: 'Resource disposal'
    }
  ],

  // Global flag usage
  global: [
    {
      regex: /window\./g,
      description: 'Window global access'
    },
    {
      regex: /globalThis\./g,
      description: 'globalThis access'
    }
  ]
};

// ============================================================================
// CONFIGURATION: Scanner Settings
// ============================================================================

const SCANNER_CONFIG = {
  // File extensions to scan
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  
  // Directories to ignore
  ignoreDirs: [
    'node_modules',
    'dist',
    'build',
    '.git',
    '.vscode',
    '.continue',
    '.cline',
    '.qodo',
    'coverage',
    'vendor',
    'ai',  // Likely AI-generated or tool files
    'daemon_logs',
    'assets' // Static assets
  ],
  
  // Files to ignore (patterns)
  ignoreFiles: [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '*.min.js',
    '*.bundle.js',
    '*.map'
  ],
  
  // Maximum line length for snippet display
  maxSnippetLength: 120,
  
  // Top files to display in report
  topFilesCount: 50
};

// ============================================================================
// SCANNER CLASS
// ============================================================================

class GateDetector {
  constructor(rootDir) {
    this.rootDir = path.resolve(rootDir);
    this.findings = [];
    this.fileStats = new Map();
    this.scannedFiles = 0;
    this.skippedFiles = 0;
  }

  /**
   * Main scanning entry point
   */
  async scan() {
    console.log(`🔍 ATOMA Gate & Policy Detector`);
    console.log(`📁 Scanning directory: ${this.rootDir}`);
    console.log('');
    
    const startTime = Date.now();
    
    await this.scanDirectory(this.rootDir);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Scan completed in ${duration}s`);
    console.log(`   📄 Scanned files: ${this.scannedFiles}`);
    console.log(`   ⏭️  Skipped files: ${this.skippedFiles}`);
    console.log(`   🔍 Total findings: ${this.findings.length}`);
    
    this.calculateGateScores();
    this.generateReports();
  }

  /**
   * Recursively scan directory
   */
  async scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Check if directory should be ignored
          if (this.shouldIgnoreDir(entry.name)) {
            continue;
          }
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
      if (error.code !== 'EACCES' && error.code !== 'EPERM') {
        console.warn(`⚠️  Error scanning ${dirPath}: ${error.message}`);
      }
    }
  }

  /**
   * Check if directory should be ignored
   */
  shouldIgnoreDir(dirName) {
    return SCANNER_CONFIG.ignoreDirs.some(ignore => 
      dirName.toLowerCase() === ignore.toLowerCase()
    );
  }

  /**
   * Check if file should be ignored
   */
  shouldIgnoreFile(fileName) {
    return SCANNER_CONFIG.ignoreFiles.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        return regex.test(fileName);
      }
      return fileName.toLowerCase() === pattern.toLowerCase();
    });
  }

  /**
   * Scan a single file
   */
  async scanFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Check file extension
    const ext = path.extname(filePath);
    if (!SCANNER_CONFIG.extensions.includes(ext)) {
      this.skippedFiles++;
      return;
    }
    
    // Check if file should be ignored
    if (this.shouldIgnoreFile(fileName)) {
      this.skippedFiles++;
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = path.relative(this.rootDir, filePath);
      
      // Initialize stats for this file
      this.fileStats.set(relativePath, {
        gate: 0,
        policy: 0,
        mutation: 0,
        global: 0,
        total: 0
      });
      
      // Scan each line
      for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        const line = lines[i];
        
        this.scanLine(relativePath, lineNumber, line);
      }
      
      this.scannedFiles++;
      
    } catch (error) {
      console.warn(`⚠️  Error reading ${filePath}: ${error.message}`);
      this.skippedFiles++;
    }
  }

  /**
   * Scan a single line for patterns
   */
  scanLine(filePath, lineNumber, line) {
    const trimmedLine = line.trim();
    const snippet = trimmedLine.length > SCANNER_CONFIG.maxSnippetLength
      ? trimmedLine.substring(0, SCANNER_CONFIG.maxSnippetLength) + '...'
      : trimmedLine;
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return;
    }
    
    // Scan for each pattern category
    for (const [category, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        const matches = line.matchAll(pattern.regex);
        
        for (const match of matches) {
          // Update file stats
          const stats = this.fileStats.get(filePath);
          stats[category]++;
          stats.total++;
          
          // Record finding
          this.findings.push({
            file: filePath,
            line: lineNumber,
            snippet: snippet,
            category: category,
            pattern: pattern.description,
            match: match[0]
          });
        }
      }
    }
  }

  /**
   * Calculate gate density scores for each file
   */
  calculateGateScores() {
    this.scores = [];
    
    for (const [filePath, stats] of this.fileStats.entries()) {
      if (stats.total === 0) continue;
      
      const score = 
        stats.gate * 2 +
        stats.policy * 2 +
        stats.mutation * 3 +
        stats.global * 1;
      
      this.scores.push({
        file: filePath,
        score: score,
        gate: stats.gate,
        policy: stats.policy,
        mutation: stats.mutation,
        global: stats.global,
        total: stats.total
      });
    }
    
    // Sort by score descending
    this.scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate both JSON and Markdown reports
   */
  generateReports() {
    this.generateJSONReport();
    this.generateMarkdownReport();
    
    console.log('');
    console.log(`📊 Reports generated:`);
    console.log(`   📄 gate_report.json - Structured findings`);
    console.log(`   📄 gate_report.md - Human-readable summary`);
  }

  /**
   * Generate JSON report
   */
  generateJSONReport() {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        scannedFiles: this.scannedFiles,
        skippedFiles: this.skippedFiles,
        totalFindings: this.findings.length,
        totalFilesWithFindings: this.scores.length
      },
      topFiles: this.scores.slice(0, SCANNER_CONFIG.topFilesCount),
      categoryBreakdown: {
        gate: this.findings.filter(f => f.category === 'gate').length,
        policy: this.findings.filter(f => f.category === 'policy').length,
        mutation: this.findings.filter(f => f.category === 'mutation').length,
        global: this.findings.filter(f => f.category === 'global').length
      },
      findings: this.findings
    };
    
    const reportPath = path.join(this.rootDir, 'gate_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const lines = [];
    
    lines.push('# ATOMA Gate & Policy Detector Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Count |');
    lines.push('|--------|-------|');
    lines.push(`| Scanned Files | ${this.scannedFiles} |`);
    lines.push(`| Skipped Files | ${this.skippedFiles} |`);
    lines.push(`| Files with Findings | ${this.scores.length} |`);
    lines.push(`| Total Findings | ${this.findings.length} |`);
    lines.push('');
    
    const gateCount = this.findings.filter(f => f.category === 'gate').length;
    const policyCount = this.findings.filter(f => f.category === 'policy').length;
    const mutationCount = this.findings.filter(f => f.category === 'mutation').length;
    const globalCount = this.findings.filter(f => f.category === 'global').length;
    
    lines.push('### Category Breakdown');
    lines.push('');
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    lines.push(`| 🔒 Gates | ${gateCount} |`);
    lines.push(`| 🛡️  Policies | ${policyCount} |`);
    lines.push(`| ⚠️  Mutations | ${mutationCount} |`);
    lines.push(`| 🌐 Globals | ${globalCount} |`);
    lines.push('');
    
    lines.push('---');
    lines.push('');
    lines.push('## Top ' + SCANNER_CONFIG.topFilesCount + ' Files by Gate Density Score');
    lines.push('');
    lines.push('> **Score Formula:** gate×2 + policy×2 + mutation×3 + global×1');
    lines.push('');
    lines.push('| Rank | File | Score | Gates | Policies | Mutations | Globals | Total |');
    lines.push('|------|------|-------|-------|----------|-----------|---------|-------|');
    
    this.scores.slice(0, SCANNER_CONFIG.topFilesCount).forEach((item, index) => {
      const fileName = path.basename(item.file);
      const filePath = item.file.length > 50 ? '...' + item.file.slice(-47) : item.file;
      lines.push(`| ${index + 1} | \`${filePath}\` | ${item.score} | ${item.gate} | ${item.policy} | ${item.mutation} | ${item.global} | ${item.total} |`);
    });
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Detailed Findings by Category');
    lines.push('');
    
    // Group findings by category
    const findingsByCategory = {
      gate: this.findings.filter(f => f.category === 'gate'),
      policy: this.findings.filter(f => f.category === 'policy'),
      mutation: this.findings.filter(f => f.category === 'mutation'),
      global: this.findings.filter(f => f.category === 'global')
    };
    
    for (const [category, findings] of Object.entries(findingsByCategory)) {
      if (findings.length === 0) continue;
      
      const categoryEmoji = {
        gate: '🔒',
        policy: '🛡️',
        mutation: '⚠️',
        global: '🌐'
      }[category];
      
      const categoryTitle = {
        gate: 'Gates',
        policy: 'Policies & Locks',
        mutation: 'High-Risk Mutations',
        global: 'Global Access'
      }[category];
      
      lines.push(`### ${categoryEmoji} ${categoryTitle} (${findings.length} findings)`);
      lines.push('');
      
      // Group by file
      const findingsByFile = {};
      for (const finding of findings) {
        if (!findingsByFile[finding.file]) {
          findingsByFile[finding.file] = [];
        }
        findingsByFile[finding.file].push(finding);
      }
      
      // Sort files by count
      const sortedFiles = Object.keys(findingsByFile).sort((a, b) => 
        findingsByFile[b].length - findingsByFile[a].length
      );
      
      for (const file of sortedFiles.slice(0, 20)) {
        lines.push(`#### \`${file}\` (${findingsByFile[file].length} findings)`);
        lines.push('');
        lines.push('| Line | Pattern | Snippet |');
        lines.push('|------|---------|---------|');
        
        for (const finding of findingsByFile[file].slice(0, 15)) {
          const snippet = finding.snippet
            .replace(/\|/g, '\\|')
            .substring(0, 80);
          lines.push(`| ${finding.line} | ${finding.pattern} | \`${snippet}\` |`);
        }
        
        if (findingsByFile[file].length > 15) {
          lines.push(`| ... | ... | ... and ${findingsByFile[file].length - 15} more |`);
        }
        
        lines.push('');
      }
      
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
    lines.push('## Legend');
    lines.push('');
    lines.push('### Categories');
    lines.push('- **🔒 Gates**: Early-return patterns, enabled checks, authorization gates');
    lines.push('- **🛡️ Policies**: CONFIG locks, LOCK_ constants, VisualAuthority, wrappers, guards');
    lines.push('- **⚠️ Mutations**: Direct modifications to scene, renderer, material properties');
    lines.push('- **🌐 Globals**: Access to window or globalThis objects');
    lines.push('');
    lines.push('### Scoring');
    lines.push('The Gate Density Score is calculated as:');
    lines.push('```\nscore = gateCount×2 + policyCount×2 + mutationCount×3 + globalCount×1\n```');
    lines.push('- Mutations have the highest weight (3) as they represent direct state changes');
    lines.push('- Gates and Policies have medium weight (2) as they represent control mechanisms');
    lines.push('- Globals have the lowest weight (1) but still indicate coupling to global state');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Report generated by ATOMA Gate & Policy Detector*');
    
    const reportPath = path.join(this.rootDir, 'gate_report.md');
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

function main() {
  // Get root directory from command line or use parent directory
  const args = process.argv.slice(2);
  let rootDir = args[0] || path.join(__dirname, '..');
  
  // Resolve to absolute path
  rootDir = path.resolve(rootDir);
  
  // Check if directory exists
  if (!fs.existsSync(rootDir)) {
    console.error(`❌ Error: Directory does not exist: ${rootDir}`);
    process.exit(1);
  }
  
  // Run the detector
  const detector = new GateDetector(rootDir);
  detector.scan().catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

// Run if executed directly
main();
