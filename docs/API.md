# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Videos

#### GET /api/videos

List all videos with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| actId | string | Filter by act category UUID |
| year | number | Filter by performance year |
| search | string | Search in title and description |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 12) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "youtubeUrl": "https://youtube.com/watch?v=...",
      "youtubeId": "dQw4w9WgXcQ",
      "title": "Amazing Juggling Performance",
      "year": 2019,
      "description": "...",
      "actId": "uuid",
      "act": {
        "id": "uuid",
        "name": "Juggling"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 9
}
```

#### POST /api/videos

Submit a new video to the archive.

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Amazing Juggling Performance",
  "year": 2019,
  "description": "Optional description",
  "actId": "uuid-of-act-category"
}
```

**Response (201 Created):**

```json
{
  "data": { ... },
  "message": "Video created successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Invalid YouTube URL"
}
```

### Acts

#### GET /api/acts

List all act categories.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Aerial Silks",
      "description": "Fabric-based aerial acrobatics",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |
