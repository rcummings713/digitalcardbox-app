#!/usr/bin/env python3
"""Build the reviewed Noto subset; ordinary app builds make no remote requests.

Requires Python 3, Pillow with animated WebP support, and curl. Re-imports check
source hashes. A changed upstream asset needs a separately reviewed version/ID.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageSequence, ImageStat


def digest(data):
    return hashlib.sha256(data).hexdigest()


def fetch(url, destination):
    subprocess.run([
        "curl", "--fail", "--silent", "--show-error", "--proto", "=https",
        "--max-time", "60", "--max-filesize", "8000000", "--retry", "2",
        url, "--output", str(destination),
    ], check=True)
    if destination.stat().st_size > 8_000_000:
        raise ValueError("Source animation exceeds import size limit")


def save_poster(animation, poster):
    with Image.open(animation) as image:
        candidates = [frame.convert("RGBA").copy() for frame in ImageSequence.Iterator(image)]

    def visibility(frame):
        histogram = frame.getchannel("A").histogram()
        coverage = sum(index * count for index, count in enumerate(histogram))
        contrast = sum(ImageStat.Stat(frame.convert("RGB")).stddev)
        return coverage, contrast

    # Entrance/exit frames can be almost empty. Prefer a recognizable whole shape.
    still = max(candidates, key=visibility)
    still.thumbnail((112, 112), Image.Resampling.LANCZOS)
    still.save(poster, format="PNG", optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true",
                        help="Re-download and require the reviewed source hashes to match")
    parser.add_argument("--posters", action="store_true",
                        help="Rebuild posters from preserved local media without downloading")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    manifest_path = root / "src/modules/media/noto-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    out = root / "public/gifs/noto"
    out.mkdir(parents=True, exist_ok=True)

    def build(item):
        code, rgi = item["codepoint"], item["rgi"]
        if not all(re.fullmatch("[a-f0-9_]+", value) for value in (code, rgi)):
            raise ValueError("Invalid reviewed codepoint")
        animation, poster = out / (code + ".webp"), out / (code + ".png")
        complete = animation.exists() and poster.exists() and item.get("sha256")
        if args.posters and not complete:
            raise ValueError("Local media is missing; poster-only mode cannot download: " + code)
        if complete and not args.refresh:
            assert digest(animation.read_bytes()) == item["sha256"], code
            if args.posters:
                save_poster(animation, poster)
                return {**item, "posterSha256": digest(poster.read_bytes())}
            assert digest(poster.read_bytes()) == item["posterSha256"], code
            return item

        source = "https://fonts.gstatic.com/s/e/notoemoji/latest/" + rgi + "/512.gif"
        with tempfile.TemporaryDirectory(prefix="dcb-noto-") as tmp:
            path = Path(tmp) / "source.gif"
            fetch(source, path)
            source_hash = digest(path.read_bytes())
            if item.get("sourceSha256") and source_hash != item["sourceSha256"]:
                raise ValueError("Source changed; review a new version explicitly: " + code)
            with Image.open(path) as image:
                if (image.format != "GIF" or not 2 <= image.n_frames <= 300
                        or image.width > 512 or image.height > 512):
                    raise ValueError("Unsupported source animation: " + code)
                frames, durations = [], []
                for index, frame in enumerate(ImageSequence.Iterator(image)):
                    duration = max(20, min(1000, frame.info.get("duration", 40)))
                    # Preserve loop timing while reducing decode work and file size.
                    if index % 2:
                        durations[-1] += duration
                        continue
                    copy = frame.convert("RGBA")
                    copy.thumbnail((192, 192), Image.Resampling.LANCZOS)
                    frames.append(copy)
                    durations.append(duration)
                frames[0].save(animation, format="WEBP", save_all=True,
                               append_images=frames[1:], duration=durations,
                               loop=0, quality=65, method=4, lossless=False)
            save_poster(animation, poster)

        if animation.stat().st_size > 750_000:
            raise ValueError("Optimize oversized animation before shipping: " + code)
        return {
            **item, "url": "/gifs/noto/" + code + ".webp",
            "poster": "/gifs/noto/" + code + ".png", "origin": "noto",
            "creator": "Google Fonts", "license": "CC BY 4.0",
            "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
            "sourceUrl": source,
            "changes": "Resized and re-encoded as animated WebP; frame rate reduced with loop timing preserved; static PNG poster extracted.",
            "sourceSha256": source_hash, "sha256": digest(animation.read_bytes()),
            "posterSha256": digest(poster.read_bytes()),
        }

    with ThreadPoolExecutor(max_workers=4) as pool:
        result = list(pool.map(build, manifest["animations"]))
    manifest["animations"] = result
    serialized = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    manifest_path.write_text(serialized)
    (out / "manifest.json").write_text(serialized)
    # Keep source hashes/provenance out of the customer JavaScript bundle.
    runtime = [{key: item[key] for key in ("id", "codepoint", "rgi", "name", "tags", "symbol")}
               for item in result]
    generated = "// Generated by scripts/import-noto-animations.py from the reviewed manifest.\n"
    generated += "export const notoAnimations = " + json.dumps(runtime, ensure_ascii=False, indent=2) + " as const;\n"
    (root / "src/modules/media/noto-catalog.ts").write_text(generated)
    total = sum(path.stat().st_size for path in out.iterdir() if path.is_file())
    print("Verified", len(result), "local animations and posters; bytes:", total)


if __name__ == "__main__":
    main()
