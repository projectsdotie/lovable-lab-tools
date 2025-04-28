-- Lovable Lab Tools - Supabase Database Creation Script

-- Create public schema if not exists (default in Supabase)
CREATE SCHEMA IF NOT EXISTS public;

-- Set up RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Comment on schema
COMMENT ON SCHEMA public IS 'Lovable Lab Tools application schema.';

-- Define custom types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum') THEN
        CREATE TYPE access_level_enum AS ENUM ('view', 'edit');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_type_enum') THEN
        CREATE TYPE tool_type_enum AS ENUM ('generator', 'time', 'notes', 'utility');
    END IF;
END$$;

-- Notification function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Storage bucket creation for file uploads
-- Note: This would typically be done in the Supabase dashboard or with specific APIs 