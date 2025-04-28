# Supabase Database Schema Setup for Lovable Lab Tools

This document outlines the complete database schema setup for the Lovable Lab Tools application using Supabase PostgreSQL.

## Prerequisites

- Supabase project created
- Access to the Supabase dashboard
- SQL editor access

## Schema Overview

The Lovable Lab Tools application uses the following tables:

1. **profiles** - User profile information
2. **projects** - User-created projects
3. **project_access** - Shared access to projects
4. **tools** - Available tools in the application
5. **teams** - User teams
6. **team_members** - Team membership
7. **notifications** - User notifications
8. **comments** - Project comments

## Schema Setup

Execute the following SQL statements in the Supabase SQL Editor to set up the complete database schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  thumbnail_url TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_access table
CREATE TABLE project_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- Create tools table
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL,
  config_schema JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  is_personal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

Create indexes to optimize query performance:

```sql
-- Profiles indexes
CREATE INDEX profiles_username_idx ON profiles(username);
CREATE INDEX profiles_email_idx ON profiles(email);

-- Projects indexes
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX projects_is_public_idx ON projects(is_public);

-- Project access indexes
CREATE INDEX project_access_project_id_idx ON project_access(project_id);
CREATE INDEX project_access_user_id_idx ON project_access(user_id);

-- Tools indexes
CREATE INDEX tools_category_idx ON tools(category);

-- Teams indexes
CREATE INDEX teams_created_by_idx ON teams(created_by);

-- Team members indexes
CREATE INDEX team_members_team_id_idx ON team_members(team_id);
CREATE INDEX team_members_user_id_idx ON team_members(user_id);

-- Notifications indexes
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_read_idx ON notifications(read);

-- Comments indexes
CREATE INDEX comments_project_id_idx ON comments(project_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
```

## Row Level Security Policies

Set up Row Level Security to control access to tables:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public projects" 
  ON projects FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view projects they have access to" 
  ON projects FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM project_access 
    WHERE project_id = projects.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update projects they have edit access to" 
  ON projects FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM project_access 
    WHERE project_id = projects.id AND user_id = auth.uid() 
    AND access_level IN ('edit', 'admin')
  ));

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Project access policies
CREATE POLICY "Users can view project access for their own projects" 
  ON project_access FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_access.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own project access" 
  ON project_access FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert project access for their own projects" 
  ON project_access FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_access.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update project access for their own projects" 
  ON project_access FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_access.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete project access for their own projects" 
  ON project_access FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_access.project_id AND user_id = auth.uid()
  ));

-- Tools policies
CREATE POLICY "Anyone can view tools" 
  ON tools FOR SELECT 
  USING (true);

-- Teams policies
CREATE POLICY "Users can view teams they are members of" 
  ON teams FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert teams" 
  ON teams FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams" 
  ON teams FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = teams.id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team owners can delete teams" 
  ON teams FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = teams.id AND user_id = auth.uid() 
    AND role = 'owner'
  ));

-- Team members policies
CREATE POLICY "Users can view team members for teams they belong to" 
  ON team_members FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM team_members AS tm 
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  ));

CREATE POLICY "Team owners and admins can insert team members" 
  ON team_members FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_members.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team owners and admins can update team members" 
  ON team_members FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_members.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team owners and admins can delete team members" 
  ON team_members FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_members.team_id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  ));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Users can view comments on public projects" 
  ON comments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = comments.project_id AND is_public = true
  ));

CREATE POLICY "Users can view comments on their own projects" 
  ON comments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = comments.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view comments on projects they have access to" 
  ON comments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM project_access 
    WHERE project_id = comments.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert comments on projects they have access to" 
  ON comments FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE id = comments.project_id AND user_id = auth.uid()
      ) OR 
      EXISTS (
        SELECT 1 FROM project_access 
        WHERE project_id = comments.project_id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own comments" 
  ON comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON comments FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Project owners can delete any comment on their projects" 
  ON comments FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE id = comments.project_id AND user_id = auth.uid()
  ));
```

## Triggers

Create triggers for automatic timestamp updates:

```sql
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_project_access_timestamp
BEFORE UPDATE ON project_access
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_tools_timestamp
BEFORE UPDATE ON tools
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_teams_timestamp
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_team_members_timestamp
BEFORE UPDATE ON team_members
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_notifications_timestamp
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_comments_timestamp
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
```

## Functions and Procedures

Create helper functions for common operations:

```sql
-- Function to check if user has access to a project
CREATE OR REPLACE FUNCTION has_project_access(
  p_project_id UUID,
  p_user_id UUID,
  p_required_access TEXT DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  access_level TEXT;
BEGIN
  -- Check if user is the project owner
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = p_user_id
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check project access table
  SELECT pa.access_level INTO access_level
  FROM project_access pa
  WHERE pa.project_id = p_project_id AND pa.user_id = p_user_id;
  
  -- No access found
  IF access_level IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check access level
  CASE p_required_access
    WHEN 'view' THEN
      RETURN access_level IN ('view', 'edit', 'admin');
    WHEN 'edit' THEN
      RETURN access_level IN ('edit', 'admin');
    WHEN 'admin' THEN
      RETURN access_level = 'admin';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to create a personal team for a new user
CREATE OR REPLACE FUNCTION create_personal_team()
RETURNS TRIGGER AS $$
DECLARE
  team_id UUID;
BEGIN
  -- Create a personal team for the user
  INSERT INTO teams (name, description, created_by, is_personal)
  VALUES (NEW.username || '''s Personal Team', 'Personal team for ' || NEW.username, NEW.id, TRUE)
  RETURNING id INTO team_id;
  
  -- Add user as owner of the team
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (team_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create personal team when a new profile is created
CREATE TRIGGER create_personal_team_trigger
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE PROCEDURE create_personal_team();
```

## Initial Data

Insert initial data for the application:

```sql
-- Insert default tools
INSERT INTO tools (name, description, icon_url, category, config_schema) VALUES
('Text Analysis', 'Analyze text for sentiment, entities, and more', '/icons/tools/text-analysis.svg', 'AI', '{
  "properties": {
    "text": {"type": "string", "description": "Text to analyze"},
    "operations": {"type": "array", "items": {"type": "string", "enum": ["sentiment", "entities", "keywords"]}}
  },
  "required": ["text", "operations"]
}'::jsonb),

('Image Generator', 'Generate images from text descriptions', '/icons/tools/image-generator.svg', 'AI', '{
  "properties": {
    "prompt": {"type": "string", "description": "Text description of the image to generate"},
    "size": {"type": "string", "enum": ["small", "medium", "large"], "default": "medium"},
    "style": {"type": "string", "enum": ["realistic", "artistic", "abstract"], "default": "realistic"}
  },
  "required": ["prompt"]
}'::jsonb),

('PDF Extractor', 'Extract text and data from PDF documents', '/icons/tools/pdf-extractor.svg', 'Document', '{
  "properties": {
    "pdf_url": {"type": "string", "description": "URL of the PDF to process"},
    "extract_text": {"type": "boolean", "default": true},
    "extract_images": {"type": "boolean", "default": false},
    "extract_tables": {"type": "boolean", "default": false}
  },
  "required": ["pdf_url"]
}'::jsonb),

('Social Media Post Generator', 'Generate optimized social media posts', '/icons/tools/social-media.svg', 'Marketing', '{
  "properties": {
    "topic": {"type": "string", "description": "Topic of the social media post"},
    "platform": {"type": "string", "enum": ["twitter", "instagram", "linkedin", "facebook"], "default": "twitter"},
    "tone": {"type": "string", "enum": ["professional", "casual", "humorous"], "default": "professional"},
    "include_hashtags": {"type": "boolean", "default": true}
  },
  "required": ["topic", "platform"]
}'::jsonb),

('Data Visualizer', 'Create interactive charts and graphs', '/icons/tools/data-visualizer.svg', 'Data', '{
  "properties": {
    "data_source": {"type": "string", "description": "URL or data string to visualize"},
    "chart_type": {"type": "string", "enum": ["bar", "line", "pie", "scatter"], "default": "bar"},
    "title": {"type": "string", "description": "Chart title"},
    "x_axis": {"type": "string", "description": "X-axis field name"},
    "y_axis": {"type": "string", "description": "Y-axis field name"}
  },
  "required": ["data_source", "chart_type", "x_axis", "y_axis"]
}'::jsonb),

('Code Generator', 'Generate code snippets in various languages', '/icons/tools/code-generator.svg', 'Development', '{
  "properties": {
    "description": {"type": "string", "description": "Description of the code to generate"},
    "language": {"type": "string", "enum": ["javascript", "python", "java", "go", "rust"], "default": "javascript"},
    "include_comments": {"type": "boolean", "default": true}
  },
  "required": ["description", "language"]
}'::jsonb),

('SEO Analyzer', 'Analyze and optimize content for search engines', '/icons/tools/seo-analyzer.svg', 'Marketing', '{
  "properties": {
    "url": {"type": "string", "description": "URL to analyze"},
    "keywords": {"type": "array", "items": {"type": "string"}, "description": "Target keywords to check"}
  },
  "required": ["url"]
}'::jsonb),

('Translation Tool', 'Translate text between languages', '/icons/tools/translation.svg', 'Language', '{
  "properties": {
    "text": {"type": "string", "description": "Text to translate"},
    "source_language": {"type": "string", "default": "auto"},
    "target_language": {"type": "string"}
  },
  "required": ["text", "target_language"]
}'::jsonb);
```

## Manually Creating Tables

If you prefer to create tables manually through the Supabase interface rather than using SQL:

1. Navigate to the Supabase Dashboard
2. Select your project
3. Go to the "Table Editor" section
4. Click "New Table"
5. Enter the table name and define columns according to the schemas provided above
6. Repeat for each table

## Checking Schema Installation

To verify that your schema is installed correctly:

1. Go to the SQL Editor in Supabase
2. Run the following query to list all tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see all the tables we created listed in the results.

## Troubleshooting

If you encounter errors during schema setup:

1. **Foreign Key Constraints**: Ensure you create tables in the correct order (referenced tables before tables that reference them)
2. **Permission Errors**: Make sure you have the necessary permissions in your Supabase project
3. **Syntax Errors**: Check for typos or syntax issues in your SQL statements

## Next Steps

After successfully setting up the database schema:

1. Configure authentication settings in the Supabase dashboard
2. Set up storage buckets for file uploads
3. Implement Edge Functions for additional functionality
4. Connect your frontend application to the Supabase backend 