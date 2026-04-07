import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const EXCLUDE_DIRS = ['node_modules', '.kilo', '.continue', 'LEGACY', 'EXAMPLES', 'SNIPPETS', 'tests', 'scripts', 'ai tools', 'constitution v2'];
const EXTENSIONS = ['.js', '.ts'];

// Data structures
const allFiles = new Set();
const fileImports = new Map(); // filename -> Set of imported modules
const fileExports = new Map(); // filename -> Set of exported names
const functionDefinitions = new Map(); // filename -> Set of function names
const functionCalls = new Map(); // filename -> Set of called function names

// Utility functions
function isExcludedDir(filePath) {
  return EXCLUDE_DIRS.some(dir => filePath.includes(path.sep + dir + path.sep));
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!isExcludedDir(filePath) && !file.startsWith('.')) {
        getAllFiles(filePath, fileList);
      }
    } else if (EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractImports(content) {
  const imports = new Set();
  
  // Match ES6 imports
  const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(content)) !== null) {
    const module = match[1];
    // Only track relative imports and project modules
    if (module.startsWith('./') || module.startsWith('../') || !module.startsWith('.')) {
      imports.add(module);
    }
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    const module = match[1];
    if (module.startsWith('./') || module.startsWith('../') || !module.startsWith('.')) {
      imports.add(module);
    }
  }
  
  return imports;
}

function extractExports(content) {
  const exports = new Set();
  
  // Named exports: export const/let/var/function/class
  const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.add(match[1]);
  }
  
  // Export { name }
  const exportFromRegex = /export\s*\{([^}]+)\}/g;
  while ((match = exportFromRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
    names.forEach(n => exports.add(n));
  }
  
  // Default export
  if (/export\s+default\s+(?:function\s+)?(\w+)/.test(content)) {
    const defaultMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (defaultMatch) {
      exports.add('default');
    }
  }
  
  // export function name() { }
  const exportFuncRegex = /export\s+function\s+(\w+)/g;
  while ((match = exportFuncRegex.exec(content)) !== null) {
    exports.add(match[1]);
  }
  
  // export class name { }
  const exportClassRegex = /export\s+class\s+(\w+)/g;
  while ((match = exportClassRegex.exec(content)) !== null) {
    exports.add(match[1]);
  }
  
  return exports;
}

function extractFunctions(content) {
  const functions = new Set();
  
  // Regular functions: function name() { }
  const funcRegex = /function\s+(\w+)\s*\(/g;
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    functions.add(match[1]);
  }
  
  // Arrow functions assigned to variables: const name = () => { }
  const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\(.*\)\s*=>|\w+\s*\()/g;
  while ((match = arrowFuncRegex.exec(content)) !== null) {
    functions.add(match[1]);
  }
  
  // Class methods
  const classMethodRegex = /class\s+\w+[^{]*\{[\s\S]*?^\s*(?:async\s+)?(\w+)\s*\(/gm;
  while ((match = classMethodRegex.exec(content)) !== null) {
    functions.add(match[1]);
  }
  
  // Async functions
  const asyncFuncRegex = /async\s+function\s+(\w+)\s*\(/g;
  while ((match = asyncFuncRegex.exec(content)) !== null) {
    functions.add(match[1]);
  }
  
  return functions;
}

function extractFunctionCalls(content) {
  const calls = new Set();
  
  // Function calls: name() or name()
  // Exclude known built-ins and common patterns
  const excludePatterns = [
    /^(console|document|window|Math|Array|Object|String|Number|Boolean|Date|Promise|Set|Map|JSON|require|module|exports|process|Buffer|setTimeout|setInterval|clearTimeout|clearInterval|requestAnimationFrame|cancelAnimationFrame)$/,
    /^(if|for|while|switch|case|break|continue|return|throw|try|catch|finally|new|typeof|instanceof|in|of|delete|void)$/,
    /^\d+$/,
    /^['"`].*['"`]$/
  ];
  
  // Match function calls: identifier followed by (
  const callRegex = /(\w+)\s*\(/g;
  let match;
  while ((match = callRegex.exec(content)) !== null) {
    const name = match[1];
    const isExcluded = excludePatterns.some(pattern => pattern.test(name));
    if (!isExcluded && !name.startsWith('_')) {
      calls.add(name);
    }
  }
  
  return calls;
}

function resolveImportPath(importPath, currentFile) {
  const currentDir = path.dirname(currentFile);
  
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    let resolved = path.resolve(currentDir, importPath);
    
    // Try to add .js if no extension
    if (!path.extname(resolved)) {
      if (fs.existsSync(resolved + '.js')) {
        resolved += '.js';
      } else if (fs.existsSync(resolved + '.ts')) {
        resolved += '.ts';
      } else if (fs.existsSync(path.join(resolved, 'index.js'))) {
        resolved = path.join(resolved, 'index.js');
      } else if (fs.existsSync(path.join(resolved, 'index.ts'))) {
        resolved = path.join(resolved, 'index.ts');
      }
    }
    
    return path.relative(PROJECT_ROOT, resolved).replace(/\\/g, '/');
  }
  
  return importPath; // External module
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
    
    allFiles.add(relativePath);
    fileImports.set(relativePath, extractImports(content));
    fileExports.set(relativePath, extractExports(content));
    functionDefinitions.set(relativePath, extractFunctions(content));
    functionCalls.set(relativePath, extractFunctionCalls(content));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

function findUnusedFiles() {
  const unusedFiles = new Set();
  const importedFiles = new Set();
  
  // Build set of all imported files (resolved paths)
  allFiles.forEach(filePath => {
    const imports = fileImports.get(filePath) || new Set();
    imports.forEach(importPath => {
      const resolved = resolveImportPath(importPath, path.join(PROJECT_ROOT, filePath));
      if (resolved && !resolved.startsWith('http') && !resolved.startsWith('three') && !resolved.startsWith('tone')) {
        importedFiles.add(resolved);
      }
    });
  });
  
  // Also check index.html for script tags
  try {
    const htmlPath = path.join(PROJECT_ROOT, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      const scriptRegex = /<script[^>]+src=['"]([^'"]+)['"]/g;
      let match;
      while ((match = scriptRegex.exec(htmlContent)) !== null) {
        importedFiles.add(match[1]);
      }
    }
  } catch (error) {
    // Ignore
  }
  
  // Files not in importedFiles are potentially unused
  allFiles.forEach(filePath => {
    if (!importedFiles.has(filePath) && filePath !== 'main.js') {
      unusedFiles.add(filePath);
    }
  });
  
  return unusedFiles;
}

function findUnusedExports() {
  const unusedExports = new Map();
  const allExportedNames = new Map();
  const allUsedNames = new Set();
  
  // Collect all exported names and their source files
  allFiles.forEach(filePath => {
    const exports = fileExports.get(filePath) || new Set();
    exports.forEach(name => {
      if (!allExportedNames.has(name)) {
        allExportedNames.set(name, []);
      }
      allExportedNames.get(name).push(filePath);
    });
  });
  
  // Collect all used names from function calls and imports
  allFiles.forEach(filePath => {
    const calls = functionCalls.get(filePath) || new Set();
    calls.forEach(name => {
      if (allExportedNames.has(name)) {
        allUsedNames.add(name);
      }
    });
  });
  
  // Find unused exports
  allExportedNames.forEach((files, name) => {
    if (!allUsedNames.has(name) && name !== 'default') {
      files.forEach(file => {
        if (!unusedExports.has(file)) {
          unusedExports.set(file, new Set());
        }
        unusedExports.get(file).add(name);
      });
    }
  });
  
  return unusedExports;
}

function findUnusedFunctions() {
  const unusedFunctions = new Map();
  const allDefinedFunctions = new Map();
  const allCalledFunctions = new Set();
  
  // Collect all defined functions
  allFiles.forEach(filePath => {
    const functions = functionDefinitions.get(filePath) || new Set();
    functions.forEach(name => {
      if (!allDefinedFunctions.has(name)) {
        allDefinedFunctions.set(name, []);
      }
      allDefinedFunctions.get(name).push(filePath);
    });
  });
  
  // Collect all called functions
  allFiles.forEach(filePath => {
    const calls = functionCalls.get(filePath) || new Set();
    calls.forEach(name => {
      allCalledFunctions.add(name);
    });
  });
  
  // Find unused functions
  allDefinedFunctions.forEach((files, name) => {
    if (!allCalledFunctions.has(name)) {
      files.forEach(file => {
        if (!unusedFunctions.has(file)) {
          unusedFunctions.set(file, new Set());
        }
        unusedFunctions.get(file).add(name);
      });
    }
  });
  
  return unusedFunctions;
}

// Main execution
console.log('🔍 Starting unused code audit...\n');

const files = getAllFiles(PROJECT_ROOT);
console.log(`📁 Found ${files.length} files to analyze\n`);

files.forEach(analyzeFile);

console.log('📊 Analysis complete. Generating report...\n');

const unusedFiles = findUnusedFiles();
const unusedExports = findUnusedExports();
const unusedFunctions = findUnusedFunctions();

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles: allFiles.size,
    unusedFiles: unusedFiles.size,
    filesWithUnusedExports: unusedExports.size,
    filesWithUnusedFunctions: unusedFunctions.size
  },
  unusedFiles: Array.from(unusedFiles).sort(),
  unusedExports: Array.from(unusedExports.entries()).map(([file, exports]) => ({
    file,
    exports: Array.from(exports).sort()
  })),
  unusedFunctions: Array.from(unusedFunctions.entries()).map(([file, functions]) => ({
    file,
    functions: Array.from(functions).sort()
  }))
};

// Write report
const reportPath = path.join(PROJECT_ROOT, 'UNUSED_CODE_AUDIT_REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Write human-readable report
const readableReportPath = path.join(PROJECT_ROOT, 'UNUSED_CODE_AUDIT_REPORT.md');
let markdown = `# Unused Code Audit Report\n\n`;
markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- **Total Files Analyzed:** ${report.summary.totalFiles}\n`;
markdown += `- **Unused Files:** ${report.summary.unusedFiles}\n`;
markdown += `- **Files with Unused Exports:** ${report.summary.filesWithUnusedExports}\n`;
markdown += `- **Files with Unused Functions:** ${report.summary.filesWithUnusedFunctions}\n\n`;

markdown += `## Unused Files\n\n`;
markdown += `These files are not imported anywhere in the codebase:\n\n`;
if (report.unusedFiles.length > 0) {
  report.unusedFiles.forEach(file => {
    markdown += `- \`${file}\` (HIGH confidence)\n`;
  });
} else {
  markdown += `No unused files found.\n`;
}

markdown += `\n## Unused Exports\n\n`;
if (report.unusedExports.length > 0) {
  report.unusedExports.forEach(({ file, exports }) => {
    markdown += `### \`${file}\`\n`;
    markdown += `Unused exports (MEDIUM confidence):\n`;
    exports.forEach(exp => {
      markdown += `- \`${exp}\`\n`;
    });
    markdown += `\n`;
  });
} else {
  markdown += `No unused exports found.\n`;
}

markdown += `\n## Unused Functions\n\n`;
if (report.unusedFunctions.length > 0) {
  report.unusedFunctions.forEach(({ file, functions }) => {
    markdown += `### \`${file}\`\n`;
    markdown += `Unused functions (LOW confidence - may be called dynamically or used as callbacks):\n`;
    functions.forEach(func => {
      markdown += `- \`${func}\`\n`;
    });
    markdown += `\n`;
  });
} else {
  markdown += `No unused functions found.\n`;
}

markdown += `\n## Confidence Levels\n\n`;
markdown += `- **HIGH:** Unused files - definitively not imported\n`;
markdown += `- **MEDIUM:** Unused exports - not directly referenced, but may be used dynamically\n`;
markdown += `- **LOW:** Unused functions - may be called through dynamic dispatch, callbacks, or reflection\n`;

fs.writeFileSync(readableReportPath, markdown);

console.log('✅ Audit complete!');
console.log(`📄 JSON report: ${reportPath}`);
console.log(`📄 Markdown report: ${readableReportPath}`);
console.log(`\n📈 Results:`);
console.log(`   - ${unusedFiles.size} potentially unused files`);
console.log(`   - ${unusedExports.size} files with unused exports`);
console.log(`   - ${unusedFunctions.size} files with unused functions`);