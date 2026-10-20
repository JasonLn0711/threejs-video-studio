"""Install the pinned public Kokoro runtime files outside version control."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
import os
import sys

FILES = {
    "kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def digest(path):
    with open(path, "rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--directory", default="models")
    args = p.parse_args()
    folder = Path(args.directory)
    folder.mkdir(parents=True, exist_ok=True)
    for name, expected in FILES.items():
        target = folder / name
        if target.exists() and digest(target) == expected:
            print(f"{name}: verified cache", file=sys.stderr)
            continue
        temp = folder / (name + ".partial")
        with urlopen(BASE + name) as response, open(temp, "wb") as dest:
            total = response.headers.get("Content-Length")
            received = 0
            while chunk := response.read(4 * 1024 * 1024):
                dest.write(chunk); received += len(chunk)
                print(f"{name}: {received} / {total or 'unknown'} bytes", file=sys.stderr)
        if digest(temp) != expected:
            raise RuntimeError(f"{name}: checksum mismatch; preserved .partial file")
        os.replace(temp, target)
    print(json.dumps({"status": "verified", "files": FILES}))


if __name__ == "__main__":
    main()
