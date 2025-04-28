-- Lovable Lab Tools - Supabase Table Creation Scripts

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tools TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_access table for sharing
CREATE TABLE IF NOT EXISTS project_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_level access_level_enum NOT NULL DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    type tool_type_enum NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Create triggers for updated_at columns
CREATE TRIGGER set_updated_at_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_timestamp_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_timestamp_project_access
BEFORE UPDATE ON project_access
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_timestamp_tools
BEFORE UPDATE ON tools
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_timestamp_teams
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_timestamp_team_members
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view projects shared with them"
ON projects FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_access
        WHERE project_id = projects.id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users with edit access can update shared projects"
ON projects FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM project_access
        WHERE project_id = projects.id
        AND user_id = auth.uid()
        AND access_level = 'edit'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM project_access
        WHERE project_id = projects.id
        AND user_id = auth.uid()
        AND access_level = 'edit'
    )
);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Project Access RLS
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can manage access"
ON project_access FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE id = project_access.project_id
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can view their own access"
ON project_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Tools RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view tools"
ON tools FOR SELECT
TO authenticated
USING (true);

-- Teams RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team creators can manage their teams"
ON teams FOR ALL
TO authenticated
USING (creator_id = auth.uid());

CREATE POLICY "Team members can view their teams"
ON teams FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = teams.id
        AND user_id = auth.uid()
    )
);

-- Team Members RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team creators can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM teams
        WHERE id = team_members.team_id
        AND creator_id = auth.uid()
    )
);

CREATE POLICY "Users can view teams they belong to"
ON team_members FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = team_members.team_id
        AND user_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_access_project_id ON project_access(project_id);
CREATE INDEX IF NOT EXISTS idx_project_access_user_id ON project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id); 