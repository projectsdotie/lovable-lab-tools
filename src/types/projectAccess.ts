
import { Database } from "@/integrations/supabase/types";

export type AccessLevel = 'view' | 'edit';

export interface ProjectAccess {
  id: string;
  user_id: string;
  project_id: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
}

export interface ProjectAccessFormData {
  email: string;
  access_level: AccessLevel;
}
