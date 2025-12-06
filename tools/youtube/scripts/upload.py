#!/usr/bin/env python3
"""Upload a video to YouTube using the Data API v3."""

import argparse
import http.client
import httplib2
import json
import random
import time
from pathlib import Path
from typing import Optional, Dict, Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

# OAuth 2.0 scopes for uploading
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

# Retry settings for resumable uploads
MAX_RETRIES = 10
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]
RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError, http.client.NotConnected,
                        http.client.IncompleteRead, http.client.ImproperConnectionState,
                        http.client.CannotSendRequest, http.client.CannotSendHeader,
                        http.client.ResponseNotReady, http.client.BadStatusLine)

# Path constants
CREDENTIALS_DIR = Path(__file__).parent.parent / 'credentials'
CLIENT_SECRETS_FILE = CREDENTIALS_DIR / 'client_secrets.json'
TOKEN_FILE = CREDENTIALS_DIR / 'token.json'


def get_authenticated_service():
    """Authenticate and return a YouTube API service object.

    Returns:
        YouTube API service object
    """
    creds = None

    # Load existing token if available
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    # Refresh or get new credentials if needed
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing access token...")
            creds.refresh(Request())
        else:
            if not CLIENT_SECRETS_FILE.exists():
                raise FileNotFoundError(
                    f"Client secrets file not found: {CLIENT_SECRETS_FILE}\n"
                    "Download it from Google Cloud Console and place it in credentials/"
                )

            print("Opening browser for authentication...")
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CLIENT_SECRETS_FILE), SCOPES
            )
            creds = flow.run_local_server(port=0)

        # Save credentials for next run
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
        print(f"Credentials saved to {TOKEN_FILE}")

    return build('youtube', 'v3', credentials=creds)


def generate_description(
    act: str,
    year: Optional[int],
    show: Optional[str] = None,
    performers: Optional[list] = None,
    source_ids: Optional[list] = None,
    notes: Optional[str] = None
) -> str:
    """Generate a standardized video description with embedded metadata.

    Args:
        act: Act type (e.g., "Juggling", "Russian Bar")
        year: Performance year
        show: Show name (e.g., "Home Show", "Callaway Gardens")
        performers: List of performer names
        source_ids: Original YouTube video IDs (for migrated videos)
        notes: Additional notes

    Returns:
        Formatted description string
    """
    lines = ["FSU Flying High Circus"]

    if act and year:
        lines[0] = f"FSU Flying High Circus - {act} {year}"
    elif act:
        lines[0] = f"FSU Flying High Circus - {act}"

    lines.append("")

    if show:
        lines.append(f"Show: {show}")
    if performers:
        lines.append(f"Performers: {', '.join(performers)}")
    if notes:
        lines.append("")
        lines.append(notes)

    # Add machine-readable metadata block
    lines.append("")
    lines.append("---")
    lines.append("[CIRCUS_ARCHIVE_META]")

    meta = {}
    if act:
        meta['act'] = act
    if year:
        meta['year'] = year
    if show:
        meta['show'] = show
    if performers:
        meta['performers'] = performers
    if source_ids:
        meta['source_ids'] = source_ids

    for key, value in meta.items():
        if isinstance(value, list):
            lines.append(f"{key}={','.join(str(v) for v in value)}")
        else:
            lines.append(f"{key}={value}")

    lines.append("[/CIRCUS_ARCHIVE_META]")

    return "\n".join(lines)


def build_tags(act: str, year: Optional[int], show: Optional[str] = None) -> list:
    """Build standard tags for a circus video.

    Args:
        act: Act type
        year: Performance year
        show: Show name

    Returns:
        List of tags
    """
    tags = [
        "FSU",
        "Florida State University",
        "Flying High Circus",
        "circus",
        "college circus",
    ]

    if act:
        tags.append(act.lower())
        # Add variations
        if act == "Quartet Adagio":
            tags.extend(["quartet", "adagio", "partner acrobatics"])
        elif act == "Russian Bar":
            tags.extend(["russian bar", "acrobatics"])
        elif act == "Teeterboard":
            tags.extend(["teeter board", "teeterboard", "acrobatics"])
        elif act == "Juggling":
            tags.extend(["juggling", "juggler"])
        elif "Trapeze" in act:
            tags.extend(["trapeze", "aerial", "flying trapeze"])

    if year:
        tags.append(str(year))

    if show:
        if "Callaway" in show:
            tags.extend(["Callaway Gardens", "summer show"])
        elif "Home" in show:
            tags.append("home show")

    return tags


def upload_video(
    youtube,
    file_path: str,
    title: str,
    description: str = '',
    category_id: str = '22',  # 22 = People & Blogs
    privacy: str = 'unlisted',
    tags: Optional[list] = None
) -> Optional[str]:
    """Upload a video to YouTube.

    Args:
        youtube: Authenticated YouTube API service
        file_path: Path to the video file
        title: Video title
        description: Video description
        category_id: YouTube category ID (22 = People & Blogs)
        privacy: Privacy status (public, unlisted, private)
        tags: List of tags

    Returns:
        Video ID if successful, None otherwise
    """
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return None

    body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags or [],
            'categoryId': category_id
        },
        'status': {
            'privacyStatus': privacy,
            'selfDeclaredMadeForKids': False
        }
    }

    # Create MediaFileUpload for resumable upload
    media = MediaFileUpload(
        str(file_path),
        chunksize=1024*1024,  # 1MB chunks
        resumable=True
    )

    # Create the upload request
    request = youtube.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=media
    )

    print(f"\nUploading: {file_path.name}")
    print(f"Title: {title}")
    print(f"Privacy: {privacy}")
    print("-" * 40)

    response = None
    retry = 0

    while response is None:
        try:
            status, response = request.next_chunk()
            if status:
                progress = int(status.progress() * 100)
                print(f"\rProgress: {progress}%", end='', flush=True)

        except HttpError as e:
            if e.resp.status in RETRIABLE_STATUS_CODES:
                retry = _handle_retry(retry, e)
                if retry is None:
                    return None
            else:
                print(f"\nHTTP error {e.resp.status}: {e.content}")
                return None

        except RETRIABLE_EXCEPTIONS as e:
            retry = _handle_retry(retry, e)
            if retry is None:
                return None

    print("\n")

    if response:
        video_id = response.get('id')
        print(f"Upload successful!")
        print(f"Video ID: {video_id}")
        print(f"URL: https://www.youtube.com/watch?v={video_id}")
        return video_id

    return None


def _handle_retry(retry: int, error) -> Optional[int]:
    """Handle retry logic for failed uploads.

    Args:
        retry: Current retry count
        error: The error that occurred

    Returns:
        New retry count, or None if max retries exceeded
    """
    if retry >= MAX_RETRIES:
        print(f"\nMax retries exceeded. Last error: {error}")
        return None

    retry += 1
    sleep_seconds = random.random() * (2 ** retry)
    print(f"\nRetry {retry}/{MAX_RETRIES} in {sleep_seconds:.1f}s... ({error})")
    time.sleep(sleep_seconds)
    return retry


def upload_from_manifest(
    manifest_path: Path,
    output_dir: Path,
    privacy: str = 'unlisted'
) -> Dict[str, Any]:
    """Upload all videos from a manifest file.

    Args:
        manifest_path: Path to manifest JSON file
        output_dir: Base directory containing merged/downloaded videos
        privacy: Privacy status for uploads

    Returns:
        Dict with upload results
    """
    with open(manifest_path) as f:
        manifest = json.load(f)

    youtube = get_authenticated_service()

    results = {
        'successful': [],
        'failed': [],
        'skipped': []
    }

    downloads_dir = output_dir / 'downloads'
    merged_dir = output_dir / 'merged'

    print(f"\nProcessing manifest: {manifest_path.name}")
    print(f"Found {len(manifest['videos'])} video entries\n")

    for entry in manifest['videos']:
        title = entry['title']
        filename = entry['filename']
        act = entry.get('act')
        year = entry.get('year')
        show = entry.get('show')

        # Determine video file location
        if entry.get('merge_sources'):
            video_path = merged_dir / f"{filename}.mp4"
            source_ids = entry['merge_sources']
        else:
            video_path = downloads_dir / f"{filename}.mp4"
            source_ids = [entry.get('source_id')]

        if not video_path.exists():
            print(f"[SKIP] File not found: {video_path}")
            results['skipped'].append({'title': title, 'reason': 'file not found'})
            continue

        # Generate description and tags
        description = generate_description(
            act=act,
            year=year,
            show=show,
            source_ids=source_ids
        )
        tags = build_tags(act, year, show)

        print(f"\n{'='*60}")
        print(f"Uploading: {title}")
        print(f"File: {video_path.name}")

        video_id = upload_video(
            youtube,
            str(video_path),
            title,
            description=description,
            privacy=privacy,
            tags=tags
        )

        if video_id:
            results['successful'].append({
                'title': title,
                'video_id': video_id,
                'url': f"https://www.youtube.com/watch?v={video_id}"
            })
        else:
            results['failed'].append({'title': title})

    # Print summary
    print(f"\n{'='*60}")
    print("UPLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"Successful: {len(results['successful'])}")
    print(f"Failed: {len(results['failed'])}")
    print(f"Skipped: {len(results['skipped'])}")

    if results['successful']:
        print("\nUploaded videos:")
        for item in results['successful']:
            print(f"  - {item['title']}")
            print(f"    {item['url']}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Upload a video to YouTube',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Single video upload
  python upload.py video.mp4 "My Video Title"
  python upload.py video.mp4 "Title" -d "Description here" -p public
  python upload.py video.mp4 "Title" -t "circus,fsu,performance"

  # Upload from manifest
  python upload.py --manifest ../manifest.json
  python upload.py --manifest ../manifest.json -p public

  # Circus video with auto-generated metadata
  python upload.py video.mp4 "Juggling 2018" --act Juggling --year 2018 --show "Home Show"
        '''
    )
    parser.add_argument('file', nargs='?', help='Path to the video file')
    parser.add_argument('title', nargs='?', help='Video title')
    parser.add_argument('-m', '--manifest', help='Path to manifest JSON file')
    parser.add_argument('-d', '--description', default='', help='Video description')
    parser.add_argument('-p', '--privacy', default='unlisted',
                        choices=['public', 'unlisted', 'private'],
                        help='Privacy status (default: unlisted)')
    parser.add_argument('-t', '--tags', default='',
                        help='Comma-separated tags')
    parser.add_argument('-c', '--category', default='22',
                        help='Category ID (default: 22 = People & Blogs)')
    parser.add_argument('--output-dir', default='./output',
                        help='Output directory for manifest mode (default: ./output)')

    # Circus-specific options
    parser.add_argument('--act', help='Act type (e.g., Juggling, Russian Bar)')
    parser.add_argument('--year', type=int, help='Performance year')
    parser.add_argument('--show', help='Show name (e.g., Home Show, Callaway Gardens)')

    args = parser.parse_args()

    try:
        if args.manifest:
            upload_from_manifest(
                Path(args.manifest),
                Path(args.output_dir),
                privacy=args.privacy
            )
        elif args.file and args.title:
            # Determine description
            if args.act:
                description = generate_description(
                    act=args.act,
                    year=args.year,
                    show=args.show
                )
                tags = build_tags(args.act, args.year, args.show)
            else:
                description = args.description
                tags = [t.strip() for t in args.tags.split(',') if t.strip()] if args.tags else []

            youtube = get_authenticated_service()
            upload_video(
                youtube,
                args.file,
                args.title,
                description=description,
                category_id=args.category,
                privacy=args.privacy,
                tags=tags
            )
        else:
            parser.print_help()
            return 1

    except FileNotFoundError as e:
        print(f"Error: {e}")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
