import re
import os
from pathlib import Path

# Set working directory to project root
PROJECT_ROOT = Path(r"D:\ATOMA_CLEAN")
JS_EXTENSIONS = {'.js', '.mjs', '.cjs'}

# Directories to skip
SKIP_DIRS = {
    'node_modules', '.git', 'dist', 'build', 'coverage',
    '.next', '.nuxt', 'vendor', '__pycache__', 'LEGACY/archive',
    'tests', '.parcel-cache'
}

def get_all_js_files(root):
    """Get all JavaScript files in project, excluding certain directories."""
    js_files = []
    for path in root.rglob('*'):
        if path.is_file() and path.suffix in JS_EXTENSIONS:
            # Skip certain directories
            if any(skip in path.parts for skip in SKIP_DIRS):
                continue
            js_files.append(path)
    return js_files

def extract_imports(file_path):
    """Extract all imported module names from a JS file."""
    imports = set()
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')

        # Match: import X from 'path' or import X from "path"
        # Also match: import 'path' or import "path"
        # Also match: require('path') or require("path")

        patterns = [
            r"import\s+(?:[\w*{}\s,]+\s+from\s+)?['\"]([^'\"]+)['\"]",  # ES6 imports
            r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",                  # CommonJS require
            r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",                   # Dynamic imports
        ]

        for pattern in patterns:
            for match in re.finditer(pattern, content):
                imp = match.group(1)
                imports.add(imp)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

    return imports

def normalize_import_path(imp, from_file):
    """Try to resolve import path to an actual file path."""
    # Handle relative paths
    if imp.startswith('./') or imp.startswith('../'):
        resolved = (from_file.parent / imp).resolve()
        # Try various extensions
        for ext in ['', '.js', '.mjs', '.cjs', '/index.js']:
            candidate = resolved.with_name(resolved.name + ext) if resolved.is_dir() else resolved
            if not resolved.name.endswith(ext):
                candidate = resolved.parent / (resolved.name + ext)
            if candidate.exists():
                return candidate
            # Handle index.js for directory imports
            if resolved.is_dir():
                idx = resolved / 'index.js'
                if idx.exists():
                    return idx
        return resolved
    return None

def main():
    print("Scanning for orphan JS files...")
    print(f"Project root: {PROJECT_ROOT}\n")

    # Get all JS files
    all_js_files = get_all_js_files(PROJECT_ROOT)
    print(f"Total JS files found: {len(all_js_files)}")

    # Build set of all file paths as strings (relative to project root)
    all_file_strs = set()
    for f in all_js_files:
        try:
            rel = f.relative_to(PROJECT_ROOT)
            all_file_strs.add(str(rel).replace('\\', '/'))
            # Also add just filename for matching
            all_file_strs.add(f.name)
        except:
            pass

    # Find all imports across all files
    imported_names = set()  # Module names (with and without extensions)
    imported_paths = set()  # Resolved file paths

    for js_file in all_js_files:
        imports = extract_imports(js_file)
        for imp in imports:
            imported_names.add(imp)
            # Try to resolve to actual file
            resolved = normalize_import_path(imp, js_file)
            if resolved:
                try:
                    rel = resolved.relative_to(PROJECT_ROOT)
                    imported_paths.add(str(rel).replace('\\', '/'))
                except:
                    pass
            # Add various forms of the import
            imp_name = imp.split('/')[-1]
            imported_names.add(imp_name)
            if imp.endswith('.js'):
                imported_names.add(imp[:-3])
            else:
                imported_names.add(imp + '.js')

    print(f"Unique imports found: {len(imported_names)}")
    print(f"Resolved import paths: {len(imported_paths)}\n")

    # Find orphans - files that are never imported
    orphans = []
    for f in all_js_files:
        try:
            rel = str(f.relative_to(PROJECT_ROOT)).replace('\\', '/')
            filename = f.name

            # Skip main.js and entry points
            if filename in ['main.js', 'index.js', 'server.js', 'app.js']:
                continue

            # Check if this file is imported anywhere
            is_imported = False

            # Check by full relative path
            if rel in imported_paths:
                is_imported = True

            # Check by filename (only for files in root or unique names)
            if filename in imported_names:
                is_imported = True

            # Check with various extensions
            for ext in ['', '.js', '.mjs']:
                if filename + ext in imported_names:
                    is_imported = True
                if rel + ext in imported_paths:
                    is_imported = True

            # Check without extension
            if filename.replace('.js', '') in imported_names:
                is_imported = True

            if not is_imported:
                orphans.append((rel, f.stat().st_size))
        except:
            pass

    # Sort by path
    orphans.sort(key=lambda x: x[0])

    print("=" * 70)
    print("ORPHAN FILES (never imported anywhere)")
    print("=" * 70)
    print()

    for path, size in orphans:
        size_str = f"{size:>10}" if size else "?"
        print(f"{size_str}  {path}")

    print()
    print(f"Total orphan files: {len(orphans)}")
    print(f"Total JS files scanned: {len(all_js_files)}")

    # Summary by directory
    print()
    print("=" * 70)
    print("ORPHANS BY DIRECTORY")
    print("=" * 70)

    dirs = {}
    for path, size in orphans:
        dir_name = str(Path(path).parent)
        if dir_name not in dirs:
            dirs[dir_name] = []
        dirs[dir_name].append((Path(path).name, size))

    for dir_name in sorted(dirs.keys()):
        dir_key = dir_name
        if dir_name == '.':
            dir_key = '(root)'
        print(f"\n{dir_key}/ ({len(dirs[dir_name])} files):")
        for name, size in sorted(dirs[dir_name]):
            print(f"  - {name} ({size} bytes)")

if __name__ == '__main__':
    main()