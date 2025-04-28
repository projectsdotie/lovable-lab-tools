# Database Schema for Lovable Lab Tools

This document outlines the database schema for the Lovable Lab Tools application, which uses Supabase as its database and authentication provider.

## Overview

The database consists of several key tables that support the application's functionality:

1. **profiles** - Stores user profile information
2. **projects** - Contains user projects
3. **tool_configurations** - Stores configurations for various tools used in projects
4. **project_access** - Manages sharing and collaboration for projects

## Tables Structure

### profiles

The profiles table stores extended information about users beyond what is stored in Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### projects

The projects table stores information about user projects.

```sql
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

-- Set up Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);
```

### tool_configurations

The tool_configurations table stores settings for various tools associated with projects.

```sql
CREATE TABLE tool_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  tool_type TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  name TEXT NOT NULL,
  description TEXT,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

-- Set up Row Level Security (RLS)
ALTER TABLE tool_configurations ENABLE ROW LEVEL SECURITY;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tool_configurations
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);
```

### project_access

The project_access table manages sharing and collaboration for projects.

```sql
CREATE TABLE project_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  access_level TEXT NOT NULL,
  
  -- Ensure no duplicate access records
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id),
  -- Validate access level
  CONSTRAINT valid_access_level CHECK (access_level IN ('viewer', 'editor', 'admin'))
);

-- Set up Row Level Security (RLS)
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON project_access
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);
```

## Indexes

To optimize database performance, several indexes are created:

```sql
-- Indexes for profiles table
CREATE INDEX idx_profiles_username ON profiles(username);

-- Indexes for projects table
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_is_public ON projects(is_public);

-- Indexes for tool_configurations table
CREATE INDEX idx_tool_configurations_project_id ON tool_configurations(project_id);
CREATE INDEX idx_tool_configurations_tool_type ON tool_configurations(tool_type);

-- Indexes for project_access table
CREATE INDEX idx_project_access_project_id ON project_access(project_id);
CREATE INDEX idx_project_access_user_id ON project_access(user_id);
```

## Database Functions

Custom functions are implemented to handle common operations:

### get_project_with_tools

Retrieves a project with all its associated tool configurations.

```sql
CREATE OR REPLACE FUNCTION get_project_with_tools(project_id UUID)
RETURNS TABLE (
  project_data JSONB,
  tools JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'user_id', p.user_id,
      'is_public', p.is_public
    ) AS project_data,
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'name', tc.name,
          'tool_type', tc.tool_type,
          'configuration', tc.configuration,
          'description', tc.description,
          'created_at', tc.created_at,
          'updated_at', tc.updated_at
        )
      )
      FROM tool_configurations tc
      WHERE tc.project_id = p.id), '[]'::json
    ) AS tools
  FROM projects p
  WHERE p.id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### check_project_access

Determines if a user has access to a project.

```sql
CREATE OR REPLACE FUNCTION check_project_access(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = p_project_id AND (
      p.user_id = p_user_id OR
      p.is_public = TRUE OR
      EXISTS (
        SELECT 1
        FROM project_access pa
        WHERE pa.project_id = p_project_id AND pa.user_id = p_user_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Schema Migrations

When updating the database schema, migrations should be created to apply changes in a controlled manner. Supabase migrations can be managed using:

1. SQL migrations through the Supabase dashboard
2. CLI-based migrations using `supabase` command-line tools
3. Programmatic migrations using the Supabase Management API

## Data Types

The following PostgreSQL data types are used in the schema:

- **UUID**: Universally unique identifiers for primary keys and references
- **TIMESTAMP WITH TIME ZONE**: Date and time values with timezone information
- **TEXT**: Variable-length character strings
- **BOOLEAN**: True/false values
- **JSONB**: Binary JSON format for storing configuration data

## Schema Diagram

```
+----------------+       +----------------+       +-------------------+
|    profiles    |       |    projects    |       | tool_configurations |
+----------------+       +----------------+       +-------------------+
| id (PK)        |<---+  | id (PK)        |<---+  | id (PK)           |
| username       |    |  | name           |    |  | project_id (FK)   |
| full_name      |    |  | description    |    |  | tool_type         |
| avatar_url     |    |  | user_id (FK)---+----+  | configuration     |
| website        |    |  | is_public      |       | name              |
| updated_at     |    |  | created_at     |       | description       |
+----------------+    |  | updated_at     |       | created_at        |
                      |  +----------------+       | updated_at        |
                      |                           +-------------------+
                      |
                      |  +----------------+
                      |  | project_access |
                      |  +----------------+
                      |  | id (PK)        |
                      +--+ user_id (FK)|
                         | project_id (FK)|
                         | access_level   |
                         | created_at     |
                         | updated_at     |
                         +----------------+
```

## Best Practices

1. **Referential Integrity**: All foreign keys should reference existing records
2. **Data Validation**: Use CHECK constraints to validate data before insertion
3. **Security**: Apply Row Level Security (RLS) policies to restrict data access
4. **Indexes**: Create appropriate indexes to optimize query performance
5. **Timestamps**: Include created_at and updated_at fields for tracking changes
6. **Soft Deletes**: Consider using soft deletes for important data
7. **Transactions**: Use transactions for operations that modify multiple tables

## Complete Migration Script

The following is a complete SQL script to create the entire database schema:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable updating timestamps automatically
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

-- Create tool_configurations table
CREATE TABLE tool_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  tool_type TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  name TEXT NOT NULL,
  description TEXT,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 1)
);

-- Create project_access table
CREATE TABLE project_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  access_level TEXT NOT NULL,
  
  CONSTRAINT unique_project_user UNIQUE (project_id, user_id),
  CONSTRAINT valid_access_level CHECK (access_level IN ('viewer', 'editor', 'admin'))
);

-- Create indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_is_public ON projects(is_public);
CREATE INDEX idx_tool_configurations_project_id ON tool_configurations(project_id);
CREATE INDEX idx_tool_configurations_tool_type ON tool_configurations(tool_type);
CREATE INDEX idx_project_access_project_id ON project_access(project_id);
CREATE INDEX idx_project_access_user_id ON project_access(user_id);

-- Set up RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- Create triggers for updating timestamps
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER set_tool_configurations_updated_at
  BEFORE UPDATE ON tool_configurations
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER set_project_access_updated_at
  BEFORE UPDATE ON project_access
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

-- Create trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create functions
CREATE OR REPLACE FUNCTION get_project_with_tools(project_id UUID)
RETURNS TABLE (
  project_data JSONB,
  tools JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'user_id', p.user_id,
      'is_public', p.is_public
    ) AS project_data,
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'name', tc.name,
          'tool_type', tc.tool_type,
          'configuration', tc.configuration,
          'description', tc.description,
          'created_at', tc.created_at,
          'updated_at', tc.updated_at
        )
      )
      FROM tool_configurations tc
      WHERE tc.project_id = p.id), '[]'::json
    ) AS tools
  FROM projects p
  WHERE p.id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_project_access(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = p_project_id AND (
      p.user_id = p_user_id OR
      p.is_public = TRUE OR
      EXISTS (
        SELECT 1
        FROM project_access pa
        WHERE pa.project_id = p_project_id AND pa.user_id = p_user_id
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
``` 