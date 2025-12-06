#!/usr/bin/env python3
"""Merge multiple video files using ffmpeg."""

import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional


def merge_videos(
    input_files: List[Path],
    output_path: Path,
    reencode: bool = True
) -> Optional[Path]:
    """Merge multiple video files into one.

    Args:
        input_files: List of input video file paths (in order)
        output_path: Output file path
        reencode: If True, re-encode videos (slower but more compatible)

    Returns:
        Path to merged file, or None if failed
    """
    # Verify all input files exist
    for f in input_files:
        if not f.exists():
            print(f"[ERROR] Input file not found: {f}")
            return None

    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"Merging {len(input_files)} videos")
    print(f"Output: {output_path}")
    print(f"{'='*60}")

    for i, f in enumerate(input_files, 1):
        print(f"  {i}. {f.name}")

    if reencode:
        # Re-encode method (slower but handles different codecs)
        return _merge_reencode(input_files, output_path)
    else:
        # Concat demuxer method (fast, requires same codec)
        return _merge_concat(input_files, output_path)


def _merge_concat(input_files: List[Path], output_path: Path) -> Optional[Path]:
    """Merge using ffmpeg concat demuxer (fast, lossless)."""
    # Create temporary file list
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for video in input_files:
            # Escape single quotes in path
            escaped = str(video.absolute()).replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")
        list_file = f.name

    try:
        cmd = [
            'ffmpeg',
            '-f', 'concat',
            '-safe', '0',
            '-i', list_file,
            '-c', 'copy',  # No re-encoding
            '-y',  # Overwrite output
            str(output_path)
        ]

        print(f"\nRunning: {' '.join(cmd[:6])}...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print(f"[OK] Merged successfully: {output_path}")
            return output_path
        else:
            print(f"[ERROR] ffmpeg failed: {result.stderr}")
            # Try re-encode method as fallback
            print("[INFO] Trying re-encode method...")
            return _merge_reencode(input_files, output_path)

    finally:
        Path(list_file).unlink(missing_ok=True)


def _merge_reencode(input_files: List[Path], output_path: Path) -> Optional[Path]:
    """Merge by re-encoding (slower but handles different codecs)."""
    # Build filter complex for concat
    inputs = []
    filter_parts = []

    for i, video in enumerate(input_files):
        inputs.extend(['-i', str(video)])
        filter_parts.append(f'[{i}:v][{i}:a]')

    filter_complex = ''.join(filter_parts) + f'concat=n={len(input_files)}:v=1:a=1[outv][outa]'

    cmd = [
        'ffmpeg',
        *inputs,
        '-filter_complex', filter_complex,
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-y',
        str(output_path)
    ]

    print(f"\nRe-encoding (this may take a while)...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"[OK] Merged successfully: {output_path}")
        return output_path
    else:
        print(f"[ERROR] ffmpeg failed: {result.stderr}")
        return None


def merge_from_manifest(manifest_path: Path, output_dir: Path, reencode: bool = True):
    """Merge all video groups from a manifest file.

    Args:
        manifest_path: Path to manifest JSON file
        output_dir: Base output directory
        reencode: If True, re-encode videos
    """
    with open(manifest_path) as f:
        manifest = json.load(f)

    downloads_dir = output_dir / 'downloads'
    merged_dir = output_dir / 'merged'

    print(f"Processing manifest: {manifest_path.name}\n")

    for entry in manifest['videos']:
        if not entry.get('merge_sources'):
            continue  # Skip single videos

        print(f"\n[MERGE] {entry['title']}")

        # Find the downloaded parts
        input_files = []
        for i in range(1, len(entry['merge_sources']) + 1):
            part_file = downloads_dir / f"{entry['filename']}_part{i}.mp4"
            if part_file.exists():
                input_files.append(part_file)
            else:
                # Try other extensions
                for ext in ['mkv', 'webm']:
                    alt = downloads_dir / f"{entry['filename']}_part{i}.{ext}"
                    if alt.exists():
                        input_files.append(alt)
                        break

        if len(input_files) != len(entry['merge_sources']):
            print(f"[WARN] Missing parts for {entry['filename']}")
            print(f"  Expected {len(entry['merge_sources'])}, found {len(input_files)}")
            continue

        output_path = merged_dir / f"{entry['filename']}.mp4"
        merge_videos(input_files, output_path, reencode)


def main():
    parser = argparse.ArgumentParser(
        description='Merge video files using ffmpeg',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python merge.py video1.mp4 video2.mp4 video3.mp4 -o merged.mp4
  python merge.py --manifest ../manifest.json
  python merge.py video1.mp4 video2.mp4 -o output.mp4 --reencode
        '''
    )
    parser.add_argument('files', nargs='*', help='Input video files to merge')
    parser.add_argument('-m', '--manifest', help='Path to manifest JSON file')
    parser.add_argument('-o', '--output', help='Output file path')
    parser.add_argument('--output-dir', default='./output',
                        help='Output directory for manifest mode (default: ./output)')
    parser.add_argument('--reencode', action='store_true',
                        help='Re-encode videos (slower but more compatible)')

    args = parser.parse_args()

    if args.manifest:
        merge_from_manifest(Path(args.manifest), Path(args.output_dir), args.reencode)
    elif args.files and args.output:
        input_files = [Path(f) for f in args.files]
        merge_videos(input_files, Path(args.output), args.reencode)
    else:
        parser.print_help()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
