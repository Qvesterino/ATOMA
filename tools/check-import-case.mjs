import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exts = new Set(['.js', '.mjs', '.cjs', '.ts']);
const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'output',
  '.codex-artifacts'
]);

const importPattern =
  /\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveCandidatePaths(importerFile, specifier) {
  const basePath = path.resolve(path.dirname(importerFile), specifier);
  return [
    basePath,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}.ts`,
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.mjs'),
    path.join(basePath, 'index.cjs'),
    path.join(basePath, 'index.ts')
  ];
}

function findExistingPath(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function verifyPathCase(actualPath) {
  const rel = path.relative(root, actualPath);
  const segments = rel.split(path.sep);
  let current = root;

  for (const segment of segments) {
    const entries = new Set(fs.readdirSync(current));
    if (!entries.has(segment)) {
      return false;
    }
    current = path.join(current, segment);
  }

  return true;
}

function getCanonicalPath(actualPath) {
  const rel = path.relative(root, actualPath);
  const segments = rel.split(path.sep);
  let current = root;
  const canonical = [];

  for (const segment of segments) {
    const actualEntry = fs
      .readdirSync(current)
      .find((entry) => entry.toLowerCase() === segment.toLowerCase());

    canonical.push(actualEntry || segment);
    current = path.join(current, actualEntry || segment);
  }

  return canonical.join(path.sep);
}

const files = walk(root);
const errors = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] || match[2];
    if (!specifier || !specifier.startsWith('.')) continue;

    const existingPath = findExistingPath(resolveCandidatePaths(file, specifier));
    if (!existingPath) continue;

    if (!verifyPathCase(existingPath)) {
      errors.push({
        file: path.relative(root, file),
        specifier,
        resolved: getCanonicalPath(existingPath)
      });
    }
  }
}

if (errors.length > 0) {
  console.error('Case-sensitive import mismatches found:\n');
  for (const error of errors) {
    console.error(`- ${error.file}: "${error.specifier}" -> ${error.resolved}`);
  }
  process.exit(1);
}

console.log('No case-sensitive import mismatches found.');
