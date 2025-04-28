# Row-Level Security (RLS) in Supabase for Lovable Lab Tools

This document describes how Row-Level Security is implemented in the Lovable Lab Tools application to ensure data security and proper access control.

## What is Row-Level Security?

Row-Level Security (RLS) is a powerful security feature in PostgreSQL that allows developers to restrict which rows users can access in a database table. It enables fine-grained access control at the row level based on user identity or attributes.

When properly configured:
- Users can only access rows they're authorized to see
- Access control logic is centralized in the database
- Security rules are enforced consistently, regardless of the client application

## RLS Overview for Lovable Lab Tools

In Lovable Lab Tools, RLS ensures:

1. Users can only view and edit their own data
2. Shared projects are only accessible to authorized collaborators
3. Sensitive application data is protected from unauthorized access
4. Admins have appropriate levels of access to oversee the platform

## Setting Up RLS in Supabase

### Prerequisites

Before implementing RLS policies, ensure:

- Supabase project is set up
- Authentication is configured
- Database tables are created
- You understand the access patterns required for your application

### Enabling RLS on Tables

By default, new tables in Supabase have RLS enabled and are locked down (no access). For existing tables, you need to enable RLS explicitly:

```sql
-- Enable RLS on a table
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

Example for our application tables:

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Creating RLS Policies

RLS policies define who can perform which operations (SELECT, INSERT, UPDATE, DELETE) on which rows.

The general syntax for creating a policy is:

```sql
CREATE POLICY policy_name
ON table_name
FOR operation
TO role
USING (expression)
WITH CHECK (expression);
```

Where:
- `operation` is SELECT, INSERT, UPDATE, DELETE, or ALL
- `role` is typically omitted to apply to all users
- `USING` expression controls row visibility (for SELECT, UPDATE, DELETE)
- `WITH CHECK` expression validates new row data (for INSERT, UPDATE)

## Implemented RLS Policies for Lovable Lab Tools

### Profiles Table Policies

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Projects Table Policies

```sql
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view projects they have access to via project_access
CREATE POLICY "Users can view projects they have access to"
ON projects
FOR SELECT
USING (
  id IN (
    SELECT project_id 
    FROM project_access 
    WHERE user_id = auth.uid()
  )
);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);
```

### Project Access Table Policies

```sql
-- Project owners can manage access to their projects
CREATE POLICY "Project owners can manage access"
ON project_access
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can view project access records for projects they own
CREATE POLICY "Users can view access for own projects"
ON project_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM projects 
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can see their own access rights
CREATE POLICY "Users can view own access rights"
ON project_access
FOR SELECT
USING (user_id = auth.uid());
```

### Tool Configuration Table Policies

```sql
-- Users can view tool configurations for their own projects
CREATE POLICY "Users can view tool configs for own projects"
ON tool_configurations
FOR SELECT
USING (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE user_id = auth.uid()
  ) OR 
  project_id IN (
    SELECT project_id 
    FROM project_access 
    WHERE user_id = auth.uid()
  )
);

-- Users can create tool configs for their own projects
CREATE POLICY "Users can create tool configs for own projects"
ON tool_configurations
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE user_id = auth.uid()
  )
);

-- Users can update tool configs for their own projects
CREATE POLICY "Users can update tool configs for own projects"
ON tool_configurations
FOR UPDATE
USING (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE user_id = auth.uid()
  )
);

-- Users can delete tool configs for their own projects
CREATE POLICY "Users can delete tool configs for own projects"
ON tool_configurations
FOR DELETE
USING (
  project_id IN (
    SELECT id 
    FROM projects 
    WHERE user_id = auth.uid()
  )
);
```

## Testing RLS Policies

To test your RLS policies:

1. **Using the Supabase UI**:
   - Open the SQL Editor in Supabase
   - Click "Policies" next to the table name
   - Click "Run Policy Check"
   - Enter a user ID to test what rows they can access

2. **Using SQL**:
   ```sql
   -- Simulate authentication as a specific user
   SET LOCAL ROLE authenticated;
   SET LOCAL "request.jwt.claims" TO '{"sub": "user-id-here"}';
   
   -- Test queries against tables with RLS
   SELECT * FROM projects;
   ```

3. **In your application**:
   - Create test users with different roles
   - Verify that users can only access appropriate data
   - Test edge cases and boundary conditions

## Debugging RLS Issues

If users can't access data they should, or can access data they shouldn't:

1. **Check RLS is enabled**:
   ```sql
   SELECT relname, relrowsecurity 
   FROM pg_class 
   WHERE relname = 'table_name';
   ```

2. **View existing policies**:
   ```sql
   SELECT * 
   FROM pg_policies 
   WHERE tablename = 'table_name';
   ```

3. **Check the JWT claims**:
   - Ensure authentication is working correctly
   - Verify the JWT contains expected claims

4. **Trace policy evaluation**:
   - Simplify complex policies to isolate issues
   - Test individual conditions separately

## Best Practices for RLS in Lovable Lab Tools

1. **Keep policies focused**: Each policy should enforce a single access pattern
2. **Avoid performance issues**: Complex policies can impact query performance
3. **Test thoroughly**: Verify all access patterns and edge cases
4. **Document policies**: Keep clear documentation of what each policy enforces
5. **Use views for complex scenarios**: Views can simplify complex access patterns
6. **Minimize exceptions**: Avoid bypassing RLS whenever possible

## Managing RLS with Migrations

When updating your schema or access patterns:

1. Create migrations to add, modify, or remove policies
2. Test changes in development before applying to production
3. Consider the impact on existing users and data

Example migration to add a new policy:

```sql
-- in a migration file
-- Add policy for project collaborators
CREATE POLICY "Collaborators can update project details"
ON projects
FOR UPDATE
USING (
  id IN (
    SELECT project_id 
    FROM project_access 
    WHERE user_id = auth.uid() AND access_level >= 'editor'
  )
);
```

## Admin Access and Bypassing RLS

For administrative purposes, you may need to bypass RLS:

1. **Using service role key**: 
   - The service role key bypasses RLS
   - Keep this key secure and use only when necessary
   - Example in server-side code:
   ```javascript
   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   )
   ```

2. **Using PostgreSQL roles**:
   - Create specific roles with RLS bypass capabilities
   - Grant these roles only to administrative functions

3. **Using functions with security definer**:
   ```sql
   CREATE OR REPLACE FUNCTION admin_get_all_projects()
   RETURNS SETOF projects
   LANGUAGE sql
   SECURITY DEFINER
   AS $$
     SELECT * FROM projects;
   $$;
   ```

## Conclusion

Row-Level Security is a critical component of the Lovable Lab Tools security architecture. It ensures that users can only access data they are authorized to see, providing a solid foundation for multi-tenant applications.

When implementing new features or tables, always consider the security implications and add appropriate RLS policies to maintain the application's security posture.

For more information, refer to the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security). 