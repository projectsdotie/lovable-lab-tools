
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/projectAccess";

export interface Tool {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithTools extends Project {
  tools: string[];
}

export const fetchTools = async (): Promise<Tool[]> => {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .order('name');
  
  if (error) {
    console.error("Error fetching tools:", error);
    throw new Error(error.message);
  }
  
  return data || [];
};

export const updateProjectTools = async (projectId: string, toolIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .update({ tools: toolIds })
    .eq('id', projectId);
  
  if (error) {
    console.error("Error updating project tools:", error);
    throw new Error(error.message);
  }
};

export const getProjectById = async (projectId: string): Promise<ProjectWithTools | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Project not found
      return null;
    }
    console.error("Error fetching project:", error);
    throw new Error(error.message);
  }
  
  return {
    ...data,
    tools: data.tools || []
  };
};
