
import { Database } from "@/integrations/supabase/types";

export type AccessLevel = 'view' | 'edit';

export interface ProjectAccess {
  id: string;
  user_id: string;
  project_id: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
  };
}

export interface ProjectAccessFormData {
  email: string;
  access_level: AccessLevel;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  created_at: string;
  user_id: string;
  is_shared?: boolean;
  access_level?: AccessLevel;
}
