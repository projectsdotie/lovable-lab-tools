# Supabase Database Migrations for Lovable Lab Tools

This document outlines how to manage database migrations for the Lovable Lab Tools application using Supabase.

## Prerequisites

- Supabase CLI installed
- Node.js v16+ installed
- Supabase project set up
- Basic SQL knowledge

## Database Migration Overview

Database migrations are a way to manage changes to your database schema over time. They allow you to:

1. Version control your database schema
2. Apply changes consistently across different environments
3. Roll back changes if necessary
4. Document database changes

For the Lovable Lab Tools application, we use Supabase's migration system to manage our database schema.

## Setting Up Migrations

### 1. Initialize Supabase

If you haven't already, initialize Supabase in your project:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init
```

### 2. Link Your Project

Link your local project to your Supabase project:

```bash
supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your actual Supabase project reference.

## Creating Your First Migration

### 1. Generate a Migration

```bash
supabase migration new initial_schema
```

This creates a new migration file in the `supabase/migrations` directory with a timestamp prefix, e.g., `20230815123456_initial_schema.sql`.

### 2. Edit the Migration File

Open the generated migration file and add your SQL commands. For example:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tools table
CREATE TABLE public.tools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL,
  configuration_schema JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Project policies
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Tools policies
CREATE POLICY "Anyone can view tools"
  ON public.tools
  FOR SELECT
  USING (true);
```

### 3. Apply the Migration

```bash
supabase db push
```

This will apply your migration to your Supabase project.

## Managing Migrations

### Creating Additional Migrations

As your application evolves, you'll need to create additional migrations for new features or changes:

```bash
supabase migration new add_project_access
```

Then add the SQL for the new migration:

```sql
-- Create project_access table
CREATE TABLE public.project_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Project owners can manage access"
  ON public.project_access
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.projects WHERE id = project_id
    )
  );

CREATE POLICY "Users can view their own access"
  ON public.project_access
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Applying Migrations

Apply your migrations to update your database:

```bash
supabase db push
```

### Resetting the Database

If you need to reset your database during development:

```bash
supabase db reset
```

This will drop all tables and reapply all migrations.

## Best Practices for Database Migrations

1. **Small, Focused Migrations**: Create small, focused migrations rather than large ones
2. **Test Migrations**: Test your migrations in a development environment before applying them in production
3. **Document Migrations**: Add comments to your migration files explaining the purpose of each change
4. **Version Control**: Commit your migration files to version control
5. **Avoid Direct Schema Changes**: Always use migrations instead of making direct changes to the schema

## Common Migration Patterns

### Adding a New Table

```sql
-- Create teams table
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Team members can view their teams"
  ON public.teams
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members WHERE team_id = id
    )
  );
```

### Adding a New Column

```sql
-- Add avatar_url column to teams table
ALTER TABLE public.teams ADD COLUMN avatar_url TEXT;
```

### Creating an Index

```sql
-- Create index for faster team queries
CREATE INDEX team_created_by_idx ON public.teams (created_by);
```

### Creating a Function

```sql
-- Create function to check if user has access to a project
CREATE OR REPLACE FUNCTION public.user_has_project_access(
  project_id UUID,
  user_id UUID,
  min_access_level TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Project owner has all access
  IF EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND user_id = user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check explicit access
  RETURN EXISTS (
    SELECT 1 FROM public.project_access
    WHERE 
      project_id = project_id AND 
      user_id = user_id AND
      CASE min_access_level
        WHEN 'viewer' THEN access_level IN ('viewer', 'editor', 'admin')
        WHEN 'editor' THEN access_level IN ('editor', 'admin')
        WHEN 'admin' THEN access_level = 'admin'
        ELSE FALSE
      END
  );
END;
$$;
```

## Working with Multiple Environments

For most projects, you'll want to use multiple environments (development, staging, production). Here's how to manage this:

### 1. Set Up Multiple Projects

Create separate Supabase projects for each environment.

### 2. Set Up Environment-Specific Links

Create a script to help switch between environments:

```bash
#!/bin/bash
# switch-env.sh

ENV=$1

if [ "$ENV" = "dev" ]; then
  supabase link --project-ref your-dev-project-ref
elif [ "$ENV" = "staging" ]; then
  supabase link --project-ref your-staging-project-ref
elif [ "$ENV" = "prod" ]; then
  supabase link --project-ref your-prod-project-ref
else
  echo "Unknown environment: $ENV"
  echo "Usage: ./switch-env.sh [dev|staging|prod]"
  exit 1
fi

echo "Switched to $ENV environment"
```

Make the script executable:

```bash
chmod +x switch-env.sh
```

### 3. Apply Migrations to Different Environments

```bash
# Switch to dev environment
./switch-env.sh dev
supabase db push

# Switch to staging environment
./switch-env.sh staging
supabase db push

# Switch to production environment
./switch-env.sh prod
supabase db push
```

## Handling Data Migrations

Sometimes you need to migrate data as well as schema. Here's an approach:

```sql
-- Example of a data migration in a migration file
-- Populate the new column with data from an existing column
UPDATE public.projects
SET description = name || ' - No description provided'
WHERE description IS NULL;
```

## Troubleshooting Migrations

### Migration Fails to Apply

If a migration fails to apply, check:
1. SQL syntax errors
2. Referenced tables or columns that don't exist
3. Constraint violations

Fix the issues and try again with `supabase db push`.

### Reverting a Migration

Supabase doesn't have built-in support for reverting migrations. Instead:

1. Create a new migration that undoes the changes
2. Apply the new migration

Example of an "undo" migration:

```sql
-- Undo the addition of a column
ALTER TABLE public.teams DROP COLUMN avatar_url;
```

## Monitoring Database Changes

After applying migrations, you can view your database schema in the Supabase dashboard:

1. Go to the Supabase dashboard
2. Select your project
3. Click on "Table Editor" in the sidebar
4. Explore your tables, columns, and relationships

## Conclusion

Database migrations are a crucial part of managing your application's data layer. By following these practices for the Lovable Lab Tools application, you can ensure that your database schema evolves in a controlled, documented way across all environments.

Use the Supabase CLI and migration system to keep your database changes version-controlled, tested, and deployable with confidence.

For more information, refer to the [Supabase CLI documentation](https://supabase.io/docs/reference/cli/usage#migrations). 