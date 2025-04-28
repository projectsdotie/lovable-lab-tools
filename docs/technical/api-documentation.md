# Lovable Lab Tools - API Documentation

This document outlines the API endpoints and data models used in the Lovable Lab Tools application. The API is built on Supabase, leveraging PostgreSQL for data storage and RESTful endpoints for data access.

## Authentication API

### Sign Up

Creates a new user account.

**Endpoint:** Supabase Auth API

**Method:** POST

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "email": "user@example.com",
  "aud": "authenticated",
  "role": "authenticated",
  "email_confirmed_at": "2025-01-01T00:00:00.000Z",
  "confirmation_sent_at": "2025-01-01T00:00:00.000Z",
  "confirmed_at": "2025-01-01T00:00:00.000Z",
  "last_sign_in_at": "2025-01-01T00:00:00.000Z",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
});
```

### Sign In

Authenticates a user.

**Endpoint:** Supabase Auth API

**Method:** POST

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "user@example.com",
      "aud": "authenticated",
      "role": "authenticated",
      "email_confirmed_at": "2025-01-01T00:00:00.000Z",
      "confirmation_sent_at": "2025-01-01T00:00:00.000Z",
      "confirmed_at": "2025-01-01T00:00:00.000Z",
      "last_sign_in_at": "2025-01-01T00:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123',
});
```

### Sign Out

Signs out the current user.

**Endpoint:** Supabase Auth API

**Method:** POST

**Response:**
```json
{
  "error": null
}
```

**JavaScript Example:**
```javascript
const { error } = await supabase.auth.signOut();
```

### Reset Password

Sends a password reset email.

**Endpoint:** Supabase Auth API

**Method:** POST

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "error": null
}
```

**JavaScript Example:**
```javascript
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com');
```

## Profiles API

### Get User Profile

Retrieves the current user's profile information.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "username": "johndoe",
  "avatar_url": "https://example.com/avatar.png",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Update User Profile

Updates the current user's profile information.

**Endpoint:** Supabase Database API

**Method:** PATCH

**Request Body:**
```json
{
  "username": "newusername",
  "avatar_url": "https://example.com/newavatar.png"
}
```

**Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "username": "newusername",
  "avatar_url": "https://example.com/newavatar.png",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-02T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({
    username: 'newusername',
    avatar_url: 'https://example.com/newavatar.png'
  })
  .eq('id', user.id)
  .select();
```

## Projects API

### List User Projects

Retrieves all projects owned by or shared with the current user.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
[
  {
    "id": "50000000-0000-0000-0000-000000000001",
    "name": "Personal Blog",
    "description": "My personal blog project",
    "url": "https://myblog.example.com",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001"],
    "created_at": "2025-01-10T00:00:00.000Z",
    "updated_at": "2025-01-10T00:00:00.000Z",
    "is_shared": false
  },
  {
    "id": "50000000-0000-0000-0000-000000000003",
    "name": "E-commerce Site",
    "description": "Online store for handmade crafts",
    "url": "https://crafts.example.com",
    "user_id": "00000000-0000-0000-0000-000000000002",
    "tools": ["10000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000001"],
    "created_at": "2025-01-12T00:00:00.000Z",
    "updated_at": "2025-01-12T00:00:00.000Z",
    "is_shared": true,
    "access_level": "edit"
  }
]
```

**JavaScript Example:**
```javascript
// Fetch owned projects
const { data: ownedProjects, error: ownedError } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Fetch shared projects
const { data: sharedAccessData, error: sharedError } = await supabase
  .from('project_access')
  .select(`
    id,
    access_level,
    projects:project_id (*)
  `)
  .eq('user_id', user.id);
```

### Get Project by ID

Retrieves a specific project by ID.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
{
  "id": "50000000-0000-0000-0000-000000000001",
  "name": "Personal Blog",
  "description": "My personal blog project",
  "url": "https://myblog.example.com",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001"],
  "created_at": "2025-01-10T00:00:00.000Z",
  "updated_at": "2025-01-10T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();
```

### Create Project

Creates a new project.

**Endpoint:** Supabase Database API

**Method:** POST

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Description of new project",
  "url": "https://newproject.example.com",
  "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001"]
}
```

**Response:**
```json
{
  "id": "50000000-0000-0000-0000-000000000009",
  "name": "New Project",
  "description": "Description of new project",
  "url": "https://newproject.example.com",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001"],
  "created_at": "2025-01-20T00:00:00.000Z",
  "updated_at": "2025-01-20T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('projects')
  .insert({
    name: 'New Project',
    description: 'Description of new project',
    url: 'https://newproject.example.com',
    tools: ['10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'],
    user_id: user.id
  })
  .select();
```

### Update Project

Updates an existing project.

**Endpoint:** Supabase Database API

**Method:** PATCH

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated project description",
  "url": "https://updatedproject.example.com",
  "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001", "20000000-0000-0000-0000-000000000002"]
}
```

**Response:**
```json
{
  "id": "50000000-0000-0000-0000-000000000001",
  "name": "Updated Project Name",
  "description": "Updated project description",
  "url": "https://updatedproject.example.com",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "tools": ["10000000-0000-0000-0000-000000000001", "30000000-0000-0000-0000-000000000001", "20000000-0000-0000-0000-000000000002"],
  "created_at": "2025-01-10T00:00:00.000Z",
  "updated_at": "2025-01-21T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('projects')
  .update({
    name: 'Updated Project Name',
    description: 'Updated project description',
    url: 'https://updatedproject.example.com',
    tools: ['10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'],
    updated_at: new Date().toISOString()
  })
  .eq('id', projectId)
  .select();
```

### Delete Project

Deletes a project.

**Endpoint:** Supabase Database API

**Method:** DELETE

**JavaScript Example:**
```javascript
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId);
```

## Project Access (Sharing) API

### Share Project

Shares a project with another user.

**Endpoint:** Supabase Database API

**Method:** POST

**Request Body:**
```json
{
  "project_id": "50000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000002",
  "access_level": "view"
}
```

**Response:**
```json
{
  "id": "60000000-0000-0000-0000-000000000010",
  "project_id": "50000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000002",
  "access_level": "view",
  "created_at": "2025-01-25T00:00:00.000Z",
  "updated_at": "2025-01-25T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('project_access')
  .insert({
    project_id: projectId,
    user_id: userId,
    access_level: 'view'
  })
  .select();
```

### Update Project Access

Updates the access level for a shared project.

**Endpoint:** Supabase Database API

**Method:** PATCH

**Request Body:**
```json
{
  "access_level": "edit"
}
```

**Response:**
```json
{
  "id": "60000000-0000-0000-0000-000000000001",
  "project_id": "50000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000002",
  "access_level": "edit",
  "created_at": "2025-01-20T00:00:00.000Z",
  "updated_at": "2025-01-26T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('project_access')
  .update({
    access_level: 'edit',
    updated_at: new Date().toISOString()
  })
  .eq('id', accessId)
  .select();
```

### Remove Project Access

Removes a user's access to a project.

**Endpoint:** Supabase Database API

**Method:** DELETE

**JavaScript Example:**
```javascript
const { error } = await supabase
  .from('project_access')
  .delete()
  .eq('id', accessId);
```

### List Project Access

Lists all users who have access to a project.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
[
  {
    "id": "60000000-0000-0000-0000-000000000001",
    "project_id": "50000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000002",
    "access_level": "view",
    "created_at": "2025-01-20T00:00:00.000Z",
    "updated_at": "2025-01-20T00:00:00.000Z",
    "profiles": {
      "username": "janedoe"
    }
  },
  {
    "id": "60000000-0000-0000-0000-000000000002",
    "project_id": "50000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000003",
    "access_level": "edit",
    "created_at": "2025-01-20T00:00:00.000Z",
    "updated_at": "2025-01-20T00:00:00.000Z",
    "profiles": {
      "username": "bobsmith"
    }
  }
]
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('project_access')
  .select(`
    *,
    profiles:user_id (username)
  `)
  .eq('project_id', projectId);
```

## Tools API

### List All Tools

Retrieves all available tools.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
[
  {
    "id": "10000000-0000-0000-0000-000000000001",
    "name": "Text Generator",
    "type": "generator",
    "description": "Generate lorem ipsum text",
    "icon": "text",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "20000000-0000-0000-0000-000000000001",
    "name": "Pomodoro Timer",
    "type": "time",
    "description": "Pomodoro technique timer",
    "icon": "clock",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('tools')
  .select('*')
  .order('name');
```

### Get Tools by Type

Retrieves tools filtered by type.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
[
  {
    "id": "10000000-0000-0000-0000-000000000001",
    "name": "Text Generator",
    "type": "generator",
    "description": "Generate lorem ipsum text",
    "icon": "text",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "10000000-0000-0000-0000-000000000002",
    "name": "Color Palette",
    "type": "generator",
    "description": "Generate color palettes",
    "icon": "palette",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('tools')
  .select('*')
  .eq('type', 'generator')
  .order('name');
```

## Teams API

### List User Teams

Retrieves all teams the current user is a member of.

**Endpoint:** Supabase Database API

**Method:** GET

**Response:**
```json
[
  {
    "id": "70000000-0000-0000-0000-000000000001",
    "name": "Design Team",
    "description": "UI/UX design team",
    "creator_id": "00000000-0000-0000-0000-000000000001",
    "created_at": "2025-02-01T00:00:00.000Z",
    "updated_at": "2025-02-01T00:00:00.000Z",
    "role": "admin"
  },
  {
    "id": "70000000-0000-0000-0000-000000000002",
    "name": "Development Team",
    "description": "Software development team",
    "creator_id": "00000000-0000-0000-0000-000000000002",
    "created_at": "2025-02-02T00:00:00.000Z",
    "updated_at": "2025-02-02T00:00:00.000Z",
    "role": "member"
  }
]
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('team_members')
  .select(`
    role,
    teams:team_id (*)
  `)
  .eq('user_id', user.id);
```

### Create Team

Creates a new team.

**Endpoint:** Supabase Database API

**Method:** POST

**Request Body:**
```json
{
  "name": "New Team",
  "description": "New team description"
}
```

**Response:**
```json
{
  "id": "70000000-0000-0000-0000-000000000004",
  "name": "New Team",
  "description": "New team description",
  "creator_id": "00000000-0000-0000-0000-000000000001",
  "created_at": "2025-02-10T00:00:00.000Z",
  "updated_at": "2025-02-10T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('teams')
  .insert({
    name: 'New Team',
    description: 'New team description',
    creator_id: user.id
  })
  .select();

// Also add the creator as a team member with admin role
if (data) {
  await supabase
    .from('team_members')
    .insert({
      team_id: data[0].id,
      user_id: user.id,
      role: 'admin'
    });
}
```

### Add Team Member

Adds a user to a team.

**Endpoint:** Supabase Database API

**Method:** POST

**Request Body:**
```json
{
  "team_id": "70000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000004",
  "role": "member"
}
```

**Response:**
```json
{
  "id": "80000000-0000-0000-0000-000000000010",
  "team_id": "70000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-0000-0000-000000000004",
  "role": "member",
  "created_at": "2025-02-15T00:00:00.000Z",
  "updated_at": "2025-02-15T00:00:00.000Z"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase
  .from('team_members')
  .insert({
    team_id: teamId,
    user_id: userId,
    role: 'member'
  })
  .select();
```

### Remove Team Member

Removes a user from a team.

**Endpoint:** Supabase Database API

**Method:** DELETE

**JavaScript Example:**
```javascript
const { error } = await supabase
  .from('team_members')
  .delete()
  .eq('team_id', teamId)
  .eq('user_id', userId);
```

## Edge Functions

The application uses Supabase Edge Functions for serverless operations. These functions are called directly with the appropriate parameters.

### User Onboarding

**Function:** `user-onboarding`

**Purpose:** Handles new user registration processes

**JavaScript Example:**
```javascript
const { data, error } = await supabase.functions.invoke('user-onboarding');
```

### Project Share Notification

**Function:** `project-share-notification`

**Purpose:** Sends notifications when a project is shared

**Request Body:**
```json
{
  "projectId": "50000000-0000-0000-0000-000000000001",
  "userId": "00000000-0000-0000-0000-000000000002",
  "accessLevel": "view"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase.functions.invoke('project-share-notification', {
  body: {
    projectId: "50000000-0000-0000-0000-000000000001",
    userId: "00000000-0000-0000-0000-000000000002",
    accessLevel: "view"
  }
});
```

### Tool Usage Analytics

**Function:** `tool-usage-analytics`

**Purpose:** Tracks tool usage for analytics

**Request Body:**
```json
{
  "toolId": "10000000-0000-0000-0000-000000000001",
  "projectId": "50000000-0000-0000-0000-000000000001",
  "action": "generate_text"
}
```

**JavaScript Example:**
```javascript
const { data, error } = await supabase.functions.invoke('tool-usage-analytics', {
  body: {
    toolId: "10000000-0000-0000-0000-000000000001",
    projectId: "50000000-0000-0000-0000-000000000001",
    action: "generate_text"
  }
});
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "message": "Error message describing what went wrong",
    "status": 400, // HTTP status code
    "code": "ERROR_CODE" // Optional error code
  }
}
```

Common error codes:
- `INVALID_CREDENTIALS`: Authentication failed
- `INVALID_INPUT`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: User not authorized to perform action
- `SERVER_ERROR`: Server-side error

## Security

- All API endpoints (except authentication) require a valid JWT token
- Row Level Security (RLS) policies are applied at the database level
- All data is validated before processing
- Sensitive operations are protected with appropriate permission checks

This API documentation covers the main endpoints used in the Lovable Lab Tools application, providing a reference for frontend-backend communication through Supabase. 