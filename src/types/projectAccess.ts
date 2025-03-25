
export type AccessLevel = "view" | "edit";

export interface ProjectAccess {
  id: string;
  project_id: string;
  user_id: string;
  access_level: AccessLevel;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
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
  user_id: string;
  created_at: string;
  updated_at: string;
  is_shared?: boolean;
  access_level?: AccessLevel;
  tools?: string[];
}
