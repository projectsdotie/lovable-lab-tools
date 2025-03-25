
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
    tools: Array.isArray(data.tools) ? data.tools.map(String) : []
  };
};

export const saveProject = async (project: Partial<Project>): Promise<Project> => {
  // Validate required fields
  if (!project.name?.trim()) {
    throw new Error("Project title is required");
  }
  
  if (!project.description?.trim()) {
    throw new Error("Project description is required");
  }
  
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) {
    throw new Error("User must be logged in to save a project");
  }
  
  const projectData = {
    ...project,
    user_id: userId,
    updated_at: new Date().toISOString()
  };
  
  // Check if we're updating or creating
  if (project.id) {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', project.id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating project:", error);
      throw new Error(error.message);
    }
    
    return data;
  } else {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...projectData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating project:", error);
      throw new Error(error.message);
    }
    
    return data;
  }
};

export const fetchUserProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching user projects:", error);
    throw new Error(error.message);
  }
  
  return data || [];
};
