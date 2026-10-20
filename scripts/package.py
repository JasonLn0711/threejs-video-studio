"""Manifest-first archive, streamed directly, with full extraction verification."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", ".cache", ".venv", "node_modules", ".hyperframes", ".media", "__pycache__", ".thumbnails", ".waveform-cache"}
ALLOWED = {"src", "scripts", "tests", "examples", ".github"}


def sha(p):
    with open(p, "rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def manifest():
    files = []
    for p in ROOT.iterdir():
        if p.is_file() and (p.suffix in {".md", ".json", ".txt"} or p.name in {"LICENSE", ".gitignore", ".gitattributes"}):
            files.append(p)
    for folder in sorted(ALLOWED | {"qa/public"}):
        base = ROOT / folder
        if not base.exists():
            continue
        for parent, dirs, names in os.walk(base, followlinks=False):
            for d in dirs:
                if (Path(parent) / d).is_symlink():
                    raise RuntimeError(f"Archive rejects symlink: {Path(parent) / d}")
            dirs[:] = sorted(d for d in dirs if d not in EXCLUDED)
            for name in sorted(names):
                p = Path(parent) / name
                if p.is_symlink():
                    raise RuntimeError(f"Archive rejects symlink: {p}")
                if not name.endswith(".log"):
                    files.append(p)
    return {str(p.relative_to(ROOT)): {"sha256": sha(p), "bytes": p.stat().st_size}
            for p in sorted(set(files))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(ROOT / "output"))
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    entries = manifest()
    key = hashlib.sha256(json.dumps(entries, sort_keys=True).encode()).hexdigest()
    target = output / "threejs-video-studio-editable.zip"
    receipt_file = output / "package-receipt.json"
    if target.exists() and receipt_file.exists():
        prior = json.loads(receipt_file.read_text())
        if prior["manifestKey"] == key and prior["zipSha256"] == sha(target):
            print(json.dumps({"status": "verified-cache-hit", "manifestKey": key, "files": len(entries)}))
            return
    tmp = output / "threejs-video-studio-editable.tmp.zip"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for rel in entries:
            z.write(ROOT / rel, rel)
        z.writestr("ARCHIVE_MANIFEST.json", json.dumps(entries, indent=2) + "\n")
    with zipfile.ZipFile(tmp) as z:
        bad = z.testzip()
        if bad:
            raise RuntimeError(f"ZIP CRC failed: {bad}")
        with tempfile.TemporaryDirectory(prefix="threejs-archive-check-") as d:
            z.extractall(d)
            for rel, record in entries.items():
                if sha(Path(d) / rel) != record["sha256"]:
                    raise RuntimeError(f"Extracted hash mismatch: {rel}")
    # Recheck sources after streaming to catch edits made while packaging.
    if manifest() != entries:
        raise RuntimeError("Source changed during packaging")
    os.replace(tmp, target)
    receipt = {"status": "passed", "manifestKey": key, "zipSha256": sha(target), "files": len(entries),
               "crc": "passed", "extractedHashes": "passed", "restoreRender": "pending",
               "bytes": target.stat().st_size}
    receipt_file.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
