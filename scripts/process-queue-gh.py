#!/usr/bin/env python3
"""
GitHub Actions Upload Queue Processor

Processes pending video uploads from the queue:
1. Checks daily YouTube upload limit
2. Gets pending items from the queue
3. Downloads video from Vercel Blob
4. Uploads to YouTube
5. Creates video entries in the database
6. Updates queue status
"""

import http.client
import httplib2
import json
import os
import random
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from urllib.request import urlopen, Request
from urllib.error import URLError

import psycopg2
from psycopg2.extras import RealDictCursor

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError


# Configuration
DAILY_UPLOAD_LIMIT = int(os.environ.get('DAILY_UPLOAD_LIMIT', '10'))

# Retry settings for resumable uploads
MAX_RETRIES = 10
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]
RETRIABLE_EXCEPTIONS = (
    httplib2.HttpLib2Error, IOError, http.client.NotConnected,
    http.client.IncompleteRead, http.client.ImproperConnectionState,
    http.client.CannotSendRequest, http.client.CannotSendHeader,
    http.client.ResponseNotReady, http.client.BadStatusLine
)


def get_db_connection():
    """Get a database connection using the DATABASE_PUBLIC_URL environment variable."""
    database_url = os.environ.get('DATABASE_PUBLIC_URL')
    if not database_url:
        raise ValueError("DATABASE_PUBLIC_URL environment variable is required")
    return psycopg2.connect(database_url)


def get_youtube_credentials() -> Credentials:
    """Build YouTube credentials from environment variables."""
    client_id = os.environ.get('YOUTUBE_CLIENT_ID')
    client_secret = os.environ.get('YOUTUBE_CLIENT_SECRET')
    refresh_token = os.environ.get('YOUTUBE_REFRESH_TOKEN')

    if not all([client_id, client_secret, refresh_token]):
        raise ValueError(
            "Missing YouTube credentials. Required: "
            "YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN"
        )

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=client_id,
        client_secret=client_secret,
        scopes=['https://www.googleapis.com/auth/youtube.upload']
    )

    # Refresh to get a valid access token
    creds.refresh(Request())
    return creds


def get_authenticated_service():
    """Authenticate and return a YouTube API service object."""
    creds = get_youtube_credentials()
    return build('youtube', 'v3', credentials=creds)


def get_today_date() -> datetime:
    """Get today's date at midnight UTC."""
    now = datetime.now(timezone.utc)
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)


def get_daily_upload_count(conn) -> int:
    """Get today's upload count from the database."""
    today = get_today_date()

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT count FROM daily_upload_counts WHERE date = %s",
            (today.date(),)
        )
        row = cur.fetchone()
        return row['count'] if row else 0


def increment_daily_upload_count(conn) -> None:
    """Increment today's upload count."""
    today = get_today_date()

    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO daily_upload_counts (id, date, count, created_at, updated_at)
            VALUES (%s, %s, 1, NOW(), NOW())
            ON CONFLICT (date) DO UPDATE SET
                count = daily_upload_counts.count + 1,
                updated_at = NOW()
        """, (str(uuid.uuid4()), today.date()))
    conn.commit()


def get_pending_items(conn, limit: int) -> List[Dict]:
    """Get pending upload queue items."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT
                uq.id,
                uq.file_name,
                uq.blob_url,
                uq.title,
                uq.year,
                uq.description,
                uq.show_type,
                uq.act_ids,
                uq.performer_ids,
                uq.uploader_id,
                u.first_name,
                u.last_name
            FROM upload_queue uq
            JOIN users u ON u.id = uq.uploader_id
            WHERE uq.status = 'PENDING'
            ORDER BY uq.created_at ASC
            LIMIT %s
        """, (limit,))
        return cur.fetchall()


def get_act_names(conn, act_ids: List[str]) -> Dict[str, str]:
    """Get act names by IDs."""
    if not act_ids:
        return {}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, name FROM acts WHERE id = ANY(%s)",
            (act_ids,)
        )
        return {row['id']: row['name'] for row in cur.fetchall()}


def download_from_blob(blob_url: str, file_name: str) -> str:
    """Download a video from Vercel Blob to a temp file."""
    print(f"Downloading from: {blob_url}")

    # Create temp file with original extension
    ext = os.path.splitext(file_name)[1] or '.mp4'
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_path = temp_file.name

    try:
        response = urlopen(blob_url, timeout=300)
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        chunk_size = 1024 * 1024  # 1MB chunks

        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            temp_file.write(chunk)
            downloaded += len(chunk)
            if total_size > 0:
                percent = int((downloaded / total_size) * 100)
                print(f"\rDownloading: {percent}%", end='', flush=True)

        temp_file.close()
        print(f"\nDownload complete: {temp_path}")
        return temp_path

    except Exception as e:
        temp_file.close()
        os.unlink(temp_path)
        raise


def delete_blob(blob_url: str) -> bool:
    """Delete a blob from Vercel Blob storage after successful upload."""
    blob_token = os.environ.get('BLOB_READ_WRITE_TOKEN')
    if not blob_token:
        print("Warning: BLOB_READ_WRITE_TOKEN not set, skipping blob deletion")
        return False

    try:
        data = json.dumps({'urls': [blob_url]}).encode('utf-8')
        req = Request('https://blob.vercel-storage.com/delete', data)
        req.add_header('Authorization', f'Bearer {blob_token}')
        req.add_header('Content-Type', 'application/json')
        response = urlopen(req, timeout=30)
        if response.status == 200:
            print(f"Deleted blob: {blob_url}")
            return True
        else:
            print(f"Failed to delete blob: HTTP {response.status}")
            return False
    except Exception as e:
        print(f"Error deleting blob: {e}")
        return False


def generate_description(
    act: str,
    year: Optional[int],
    show: Optional[str] = None,
    performers: Optional[List[str]] = None,
    notes: Optional[str] = None
) -> str:
    """Generate a standardized video description with embedded metadata."""
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

    for key, value in meta.items():
        if isinstance(value, list):
            lines.append(f"{key}={','.join(str(v) for v in value)}")
        else:
            lines.append(f"{key}={value}")

    lines.append("[/CIRCUS_ARCHIVE_META]")

    return "\n".join(lines)


def build_tags(act: str, year: Optional[int], show: Optional[str] = None) -> List[str]:
    """Build standard tags for a circus video."""
    tags = [
        "FSU",
        "Florida State University",
        "Flying High Circus",
        "circus",
        "college circus",
    ]

    if act:
        tags.append(act.lower())
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
    category_id: str = '22',
    privacy: str = 'unlisted',
    tags: Optional[List[str]] = None
) -> Optional[str]:
    """Upload a video to YouTube."""
    if not os.path.exists(file_path):
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

    media = MediaFileUpload(
        file_path,
        chunksize=1024*1024,
        resumable=True
    )

    request = youtube.videos().insert(
        part=','.join(body.keys()),
        body=body,
        media_body=media
    )

    print(f"\nUploading: {os.path.basename(file_path)}")
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
                retry = handle_retry(retry, e)
                if retry is None:
                    return None
            else:
                print(f"\nHTTP error {e.resp.status}: {e.content}")
                return None

        except RETRIABLE_EXCEPTIONS as e:
            retry = handle_retry(retry, e)
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


def handle_retry(retry: int, error) -> Optional[int]:
    """Handle retry logic for failed uploads."""
    if retry >= MAX_RETRIES:
        print(f"\nMax retries exceeded. Last error: {error}")
        return None

    retry += 1
    sleep_seconds = random.random() * (2 ** retry)
    print(f"\nRetry {retry}/{MAX_RETRIES} in {sleep_seconds:.1f}s... ({error})")
    time.sleep(sleep_seconds)
    return retry


def create_video_entry(
    conn,
    queue_item: Dict,
    youtube_url: str,
    youtube_id: str
) -> str:
    """Create a video entry in the database after successful upload."""
    video_id = str(uuid.uuid4())

    with conn.cursor() as cur:
        # Create the video
        cur.execute("""
            INSERT INTO videos (
                id, youtube_url, youtube_id, title, year, description,
                show_type, uploader_id, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            video_id,
            youtube_url,
            youtube_id,
            queue_item['title'],
            queue_item['year'],
            queue_item['description'],
            queue_item['show_type'],
            queue_item['uploader_id']
        ))

        # Create video-act relationships
        for act_id in queue_item['act_ids']:
            cur.execute("""
                INSERT INTO video_acts (id, video_id, act_id, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (str(uuid.uuid4()), video_id, act_id))

        # Create video-performer relationships
        for performer_id in queue_item['performer_ids']:
            cur.execute("""
                INSERT INTO video_performers (id, video_id, user_id, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (str(uuid.uuid4()), video_id, performer_id))

    conn.commit()
    print(f"Created video entry: {video_id}")
    return video_id


def update_queue_status(
    conn,
    queue_id: str,
    status: str,
    youtube_url: Optional[str] = None,
    error_message: Optional[str] = None
) -> None:
    """Update queue item status."""
    with conn.cursor() as cur:
        if status == 'UPLOADED':
            cur.execute("""
                UPDATE upload_queue SET
                    status = %s,
                    youtube_url = %s,
                    processed_at = NOW(),
                    updated_at = NOW()
                WHERE id = %s
            """, (status, youtube_url, queue_id))
        else:
            cur.execute("""
                UPDATE upload_queue SET
                    status = %s,
                    error_message = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (status, error_message, queue_id))
    conn.commit()


def process_queue() -> None:
    """Main queue processing function."""
    print("=" * 60)
    print("GitHub Actions Upload Queue Processor")
    print("=" * 60)
    print(f"Started at: {datetime.now(timezone.utc).isoformat()}")
    print(f"Daily upload limit: {DAILY_UPLOAD_LIMIT}")

    conn = get_db_connection()

    try:
        # Check daily limit
        current_count = get_daily_upload_count(conn)
        remaining_uploads = DAILY_UPLOAD_LIMIT - current_count

        print(f"Uploads today: {current_count}/{DAILY_UPLOAD_LIMIT}")
        print(f"Remaining slots: {remaining_uploads}")

        if remaining_uploads <= 0:
            print("\nDaily upload limit reached. Exiting.")
            return

        # Get pending items
        pending_items = get_pending_items(conn, remaining_uploads)

        print(f"\nPending items in queue: {len(pending_items)}")

        if not pending_items:
            print("No items to process. Exiting.")
            return

        # Get act names for all items
        all_act_ids = []
        for item in pending_items:
            all_act_ids.extend(item['act_ids'])
        act_name_map = get_act_names(conn, list(set(all_act_ids)))

        # Authenticate with YouTube
        youtube = get_authenticated_service()
        print("YouTube authentication successful")

        # Process each item
        success_count = 0
        fail_count = 0

        for item in pending_items:
            print(f"\n{'-' * 60}")
            print(f"Processing: {item['title']}")
            print(f"Uploaded by: {item['first_name']} {item['last_name']}")

            temp_path = None

            try:
                # Download from Vercel Blob
                temp_path = download_from_blob(item['blob_url'], item['file_name'])

                # Build title and metadata
                act_names = [act_name_map.get(aid, 'Unknown') for aid in item['act_ids']]
                act_part = ' & '.join(act_names) if act_names else 'Performance'
                show_name = 'Callaway' if item['show_type'] == 'CALLAWAY' else 'Home Show'
                full_title = f"{act_part} - FSU Flying High Circus {show_name} {item['year']}"

                description = generate_description(
                    act=act_names[0] if act_names else None,
                    year=item['year'],
                    show='Callaway Gardens' if item['show_type'] == 'CALLAWAY' else 'Home Show',
                    notes=item['description']
                )
                tags = build_tags(
                    act_names[0] if act_names else '',
                    item['year'],
                    show_name
                )

                # Upload to YouTube
                video_id = upload_video(
                    youtube,
                    temp_path,
                    full_title,
                    description=description,
                    privacy='unlisted',
                    tags=tags
                )

                if video_id:
                    youtube_url = f"https://www.youtube.com/watch?v={video_id}"

                    # Update queue status
                    update_queue_status(conn, item['id'], 'UPLOADED', youtube_url)

                    # Create video entry
                    create_video_entry(conn, item, youtube_url, video_id)

                    # Increment daily count
                    increment_daily_upload_count(conn)

                    # Delete blob from Vercel storage
                    delete_blob(item['blob_url'])

                    success_count += 1
                    print(f"SUCCESS: {youtube_url}")
                else:
                    update_queue_status(conn, item['id'], 'FAILED', error_message='Upload failed - no video ID returned')
                    fail_count += 1
                    print("FAILED: Upload returned no video ID")

            except Exception as e:
                error_msg = str(e)
                print(f"Error processing item: {error_msg}")
                update_queue_status(conn, item['id'], 'FAILED', error_message=f"Processing error: {error_msg}")
                fail_count += 1

            finally:
                # Clean up temp file
                if temp_path and os.path.exists(temp_path):
                    os.unlink(temp_path)
                    print(f"Cleaned up temp file: {temp_path}")

        # Summary
        print(f"\n{'=' * 60}")
        print("SUMMARY")
        print(f"{'=' * 60}")
        print(f"Processed: {len(pending_items)}")
        print(f"Successful: {success_count}")
        print(f"Failed: {fail_count}")
        print(f"Completed at: {datetime.now(timezone.utc).isoformat()}")

    finally:
        conn.close()


if __name__ == '__main__':
    try:
        process_queue()
    except Exception as e:
        print(f"Fatal error: {e}")
        sys.exit(1)
