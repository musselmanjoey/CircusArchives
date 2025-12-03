# API Documentation

## Base URL

```
https://flyinghighcircusarchives.com/api
```

## Authentication

V2 uses NextAuth.js with JWT sessions. Protected endpoints require authentication via session cookie.

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
| performerId | string | Filter by performer UUID |
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
      "title": "Juggling 2019",
      "year": 2019,
      "description": "...",
      "actId": "uuid",
      "act": {
        "id": "uuid",
        "name": "Juggling"
      },
      "submittedBy": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "performers": [
        {
          "id": "uuid",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      ],
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

Submit a new video to the archive. **Requires authentication.**

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "year": 2019,
  "description": "Optional description",
  "actId": "uuid-of-act-category",
  "performerIds": ["uuid-1", "uuid-2"]
}
```

Note: Title is auto-generated as "{Act Name} {Year}".

**Response (201 Created):**

```json
{
  "data": { ... },
  "message": "Video created successfully"
}
```

**Error Responses:**

| Code | Error |
|------|-------|
| 400 | Invalid YouTube URL |
| 401 | Unauthorized (not logged in) |

#### GET /api/videos/[id]

Get a single video by ID.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "youtubeUrl": "https://youtube.com/watch?v=...",
    "youtubeId": "dQw4w9WgXcQ",
    "title": "Juggling 2019",
    "year": 2019,
    "description": "...",
    "act": { "id": "uuid", "name": "Juggling" },
    "submittedBy": { "id": "uuid", "firstName": "John", "lastName": "Doe" },
    "performers": [...]
  }
}
```

#### PATCH /api/videos/[id]

Update a video. **Requires authentication. Owner only.**

**Request Body (all fields optional):**

```json
{
  "year": 2020,
  "description": "Updated description",
  "actId": "new-act-uuid",
  "performerIds": ["uuid-1", "uuid-2"]
}
```

**Response:**

```json
{
  "data": { ... },
  "message": "Video updated successfully"
}
```

**Error Responses:**

| Code | Error |
|------|-------|
| 401 | Unauthorized |
| 403 | Not the owner of this video |
| 404 | Video not found |

#### DELETE /api/videos/[id]

Delete a video. **Requires authentication. Owner only.**

**Response (200):**

```json
{
  "message": "Video deleted successfully"
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
      "name": "Flying Trapeze",
      "description": "Aerial trapeze with catches and releases",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Users

#### GET /api/users

Search for users by name. Used for performer tagging.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search term (matches first or last name) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ]
}
```

#### POST /api/users

Create a new user (for tagging performers who don't have accounts yet).

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

### Authentication

#### POST /api/auth/signin

Sign in with name-based credentials.

Handled by NextAuth.js. See [NextAuth.js documentation](https://authjs.dev/).

#### POST /api/auth/signout

Sign out and clear session.

#### GET /api/auth/session

Get current session info.

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
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (not allowed) |
| 404 | Not Found |
| 500 | Internal Server Error |
