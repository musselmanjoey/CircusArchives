# YouTube Upload Tools

Python scripts for managing Circus Archives YouTube uploads - downloading from old accounts, merging clips, and uploading with standardized metadata.

## Setup

1. Install dependencies:
   ```bash
   cd tools/youtube
   pip install -r requirements.txt
   ```

2. Place your `client_secrets.json` in `credentials/`

3. First upload run will open browser for OAuth - authorize with the Circus Archives YouTube account

## Workflow

### 1. Download videos from old account
```bash
# Download all videos from manifest
python scripts/download.py --manifest manifest.json -o ./output

# Download single video
python scripts/download.py "https://youtu.be/VIDEO_ID" -o ./output
```

### 2. Merge multi-part videos
```bash
# Merge all videos defined in manifest
python scripts/merge.py --manifest manifest.json --output-dir ./output

# Merge specific files
python scripts/merge.py video1.mp4 video2.mp4 video3.mp4 -o merged.mp4
```

### 3. Upload to new account
```bash
# Upload all from manifest (unlisted by default)
python scripts/upload.py --manifest manifest.json --output-dir ./output

# Upload single video with auto-generated metadata
python scripts/upload.py video.mp4 "Juggling 2018" --act Juggling --year 2018 --show "Home Show"

# Upload single video manually
python scripts/upload.py video.mp4 "Title" -d "Description" -t "tag1,tag2" -p unlisted
```

## Manifest Format

The `manifest.json` file defines all videos to process:

```json
{
  "videos": [
    {
      "title": "Juggling - FSU Flying High Circus 2017",
      "filename": "juggling_2017",
      "source_id": "VIDEO_ID",
      "act": "Juggling",
      "year": 2017,
      "show": "Home Show"
    },
    {
      "title": "Russian Bar - FSU Flying High Circus Callaway 2017",
      "filename": "russian_bar_callaway_2017",
      "act": "Russian Bar",
      "year": 2017,
      "show": "Callaway Gardens",
      "merge_sources": ["VIDEO_ID_1", "VIDEO_ID_2", "VIDEO_ID_3"]
    }
  ]
}
```

## Video Description Metadata

Uploaded videos include machine-readable metadata in the description:

```
FSU Flying High Circus - Juggling 2017

Show: Home Show

---
[CIRCUS_ARCHIVE_META]
act=Juggling
year=2017
show=Home Show
source_ids=a4bsT_Tr90w
[/CIRCUS_ARCHIVE_META]
```

## Credentials

The `credentials/` folder is gitignored. Never commit:
- `client_secrets.json` (OAuth client ID from Google Cloud Console)
- `token.json` (generated after first auth)

## Output Directory Structure

```
output/
├── downloads/          # Raw downloaded videos
│   ├── juggling_2017.mp4
│   ├── russian_bar_callaway_2017_part1.mp4
│   ├── russian_bar_callaway_2017_part2.mp4
│   └── ...
└── merged/             # Merged multi-part videos
    ├── russian_bar_callaway_2017.mp4
    └── ...
```
