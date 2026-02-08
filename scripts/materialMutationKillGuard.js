import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ALLOWED_EXTENSIONS = new Set(['.js', '.ts', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  '.idea',
  'dist',
  'build'
]);

const MUTATION_REGEX = /material\.(transparent|opacity|depthWrite|depthTest|blending|alphaTest|side)\s*=/g;
const UPDATE_REGEX = /\bupdate\s*\([^)]*\)\s*\{/g;

function walk(dir, collector) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collector);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext)) collector.push(fullPath);
    }
  }
}

function indexToLine(index, content) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function findUpdateBodies(content) {
  UPDATE_REGEX.lastIndex = 0;
  const bodies = [];
  let match;
  while ((match = UPDATE_REGEX.exec(content))) {
    const braceStart = content.indexOf('{', match.index);
    if (braceStart === -1) continue;
    let depth = 0;
    for (let i = braceStart; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          bodies.push({ start: braceStart, end: i });
          break;
        }
      }
    }
  }
  return bodies;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  UPDATE_REGEX.lastIndex = 0;
  if (!UPDATE_REGEX.test(content)) return;

  const bodies = findUpdateBodies(content);

  for (const body of bodies) {
    const bodySlice = content.slice(body.start, body.end);
    let match;
    MUTATION_REGEX.lastIndex = 0;
    while ((match = MUTATION_REGEX.exec(bodySlice))) {
      const globalIndex = body.start + match.index;
      const line = indexToLine(globalIndex, content);
      console.warn('[MaterialMutationKill] Per-frame material mutation detected', `${filePath}:${line}`);
    }
  }
}

function main() {
  const files = [];
  walk(projectRoot, files);
  files.forEach(scanFile);
}

main();
