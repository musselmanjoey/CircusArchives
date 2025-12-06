#!/usr/bin/env python3
"""Download YouTube videos using yt-dlp."""

import argparse
import json
from pathlib import Path
from typing import Optional

import yt_dlp


def extract_video_id(url: str) -> str:
    """Extract video ID from various YouTube URL formats.

    Args:
        url: YouTube URL or video ID

    Returns:
        Video ID string
    """
    # Already just an ID
    if len(url) == 11 and '/' not in url and '.' not in url:
        return url

    # Handle various URL formats
    if 'youtu.be/' in url:
        # https://youtu.be/VIDEO_ID or https://youtu.be/VIDEO_ID?si=...
        video_id = url.split('youtu.be/')[-1].split('?')[0].split('&')[0]
    elif 'youtube.com/watch' in url:
        # https://www.youtube.com/watch?v=VIDEO_ID
        if 'v=' in url:
            video_id = url.split('v=')[-1].split('&')[0].split('?')[0]
        else:
            video_id = url
    else:
        video_id = url

    return video_id[:11]  # Video IDs are always 11 chars


def download_video(
    url_or_id: str,
    output_dir: Path,
    quality: str = '1080',
    filename: Optional[str] = None
) -> Optional[Path]:
    """Download a single YouTube video.

    Args:
        url_or_id: YouTube URL or video ID
        output_dir: Directory to save video
        quality: Video quality (best, 1080, 720, 480)
        filename: Optional custom filename (without extension)

    Returns:
        Path to downloaded file, or None if failed
    """
    video_id = extract_video_id(url_or_id)
    url = f"https://www.youtube.com/watch?v={video_id}"

    output_dir.mkdir(parents=True, exist_ok=True)

    # Use custom filename or video ID
    base_name = filename if filename else video_id
    output_template = str(output_dir / f"{base_name}.%(ext)s")

    # Format selection
    format_map = {
        'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '1080': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
        '720': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
        '480': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best',
    }
    format_string = format_map.get(quality, format_map['1080'])

    ydl_opts = {
        'format': format_string,
        'outtmpl': output_template,
        'merge_output_format': 'mp4',
        'writeinfojson': True,  # Save metadata
        'noplaylist': True,
        'quiet': False,
        'no_warnings': False,
    }

    try:
        print(f"\n{'='*60}")
        print(f"Downloading: {video_id}")
        print(f"URL: {url}")
        print(f"Output: {base_name}.mp4")
        print(f"{'='*60}")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the downloaded file
        output_path = output_dir / f"{base_name}.mp4"
        if output_path.exists():
            print(f"[OK] Downloaded: {output_path}")
            return output_path
        else:
            # Check for other extensions
            for ext in ['mp4', 'mkv', 'webm']:
                alt_path = output_dir / f"{base_name}.{ext}"
                if alt_path.exists():
                    print(f"[OK] Downloaded: {alt_path}")
                    return alt_path

        print(f"[WARN] Download completed but file not found at expected path")
        return None

    except Exception as e:
        print(f"[ERROR] Failed to download {video_id}: {e}")
        return None


def download_from_manifest(manifest_path: Path, output_dir: Path, quality: str = '1080'):
    """Download all videos from a manifest file.

    Args:
        manifest_path: Path to manifest JSON file
        output_dir: Directory to save videos
        quality: Video quality
    """
    with open(manifest_path) as f:
        manifest = json.load(f)

    print(f"Processing manifest: {manifest_path.name}")
    print(f"Found {len(manifest['videos'])} video entries\n")

    downloads_dir = output_dir / 'downloads'

    for entry in manifest['videos']:
        if entry.get('merge_sources'):
            # This is a merge entry - download all source videos
            print(f"\n[MERGE GROUP] {entry['title']}")
            for i, source_id in enumerate(entry['merge_sources'], 1):
                filename = f"{entry['filename']}_part{i}"
                download_video(source_id, downloads_dir, quality, filename)
        else:
            # Single video
            download_video(
                entry['source_id'],
                downloads_dir,
                quality,
                entry['filename']
            )


def main():
    parser = argparse.ArgumentParser(
        description='Download YouTube videos',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python download.py VIDEO_ID
  python download.py "https://youtu.be/VIDEO_ID"
  python download.py --manifest ../manifest.json
  python download.py VIDEO_ID -o ./videos -q 720
        '''
    )
    parser.add_argument('url', nargs='?', help='YouTube URL or video ID')
    parser.add_argument('-m', '--manifest', help='Path to manifest JSON file')
    parser.add_argument('-o', '--output', default='./output',
                        help='Output directory (default: ./output)')
    parser.add_argument('-q', '--quality', default='1080',
                        choices=['best', '1080', '720', '480'],
                        help='Video quality (default: 1080)')
    parser.add_argument('-n', '--name', help='Custom filename (without extension)')

    args = parser.parse_args()
    output_dir = Path(args.output)

    if args.manifest:
        download_from_manifest(Path(args.manifest), output_dir, args.quality)
    elif args.url:
        download_video(args.url, output_dir / 'downloads', args.quality, args.name)
    else:
        parser.print_help()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
