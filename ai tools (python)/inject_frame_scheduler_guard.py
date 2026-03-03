from pathlib import Path
import re

# ========= CONFIG =========

PROJECT_ROOT = Path("D:/ATOMA")
FILES_LIST = Path("files.txt")

GUARD_LINE = "if (!this.frameScheduler?.shouldRunVisual?.()) return;"

UPDATE_REGEX = re.compile(
    r'(update\s*\(\s*(deltaTime|dt)\s*\)\s*\{\s*)',
    re.MULTILINE
)

# ========= SCRIPT =========

def process_file(rel_path: str):
    path = PROJECT_ROOT / rel_path
    if not path.exists():
        print(f"❌ Missing: {rel_path}")
        return

    content = path.read_text(encoding="utf-8")

    if GUARD_LINE in content:
        print(f"⏭️  Already patched: {rel_path}")
        return

    match = UPDATE_REGEX.search(content)
    if not match:
        print(f"⚠️  No update(): {rel_path}")
        return

    insert_pos = match.end()

    patched = (
        content[:insert_pos]
        + "\n    " + GUARD_LINE
        + content[insert_pos:]
    )

    path.write_text(patched, encoding="utf-8")
    print(f"✅ Patched: {rel_path}")


def main():
    files = FILES_LIST.read_text().splitlines()

    for rel_path in files:
        rel_path = rel_path.strip()
        if rel_path:
            process_file(rel_path)


if __name__ == "__main__":
    main()
