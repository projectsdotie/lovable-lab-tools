
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
  
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user?.id) {
    throw new Error("User must be logged in to save a project");
  }
  
  const userId = userData.user.id;
  
  try {
    // Check if we're updating or creating
    if (project.id) {
      // For updates, always include name as it's required by Supabase
      const updateData = {
        name: project.name,
        description: project.description,
        url: project.url,
        tools: project.tools,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating project:", error);
        throw new Error(error.message);
      }
      
      // Ensure tools is properly formatted for our application
      return {
        ...data,
        tools: Array.isArray(data.tools) ? data.tools.map(String) : []
      };
    } else {
      // For new projects, include all required fields
      const insertData = {
        name: project.name,
        description: project.description,
        url: project.url || null,
        tools: project.tools || [],
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating project:", error);
        throw new Error(error.message);
      }
      
      // Ensure tools is properly formatted for our application
      return {
        ...data,
        tools: Array.isArray(data.tools) ? data.tools.map(String) : []
      };
    }
  } catch (error) {
    console.error("Error in saveProject:", error);
    throw error;
  }
};

export const fetchUserProjects = async (): Promise<Project[]> => {
  try {
    // Check if user is logged in
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error("User not authenticated:", userError);
      return [];
    }

    const userId = userData.user.id;

    // Fetch projects owned by the user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (ownedError) {
      console.error("Error fetching owned projects:", ownedError);
      throw new Error(ownedError.message);
    }

    // Fetch projects shared with the user
    const { data: sharedAccessData, error: sharedError } = await supabase
      .from('project_access')
      .select(`
        id,
        access_level,
        projects:project_id (*)
      `)
      .eq('user_id', userId);

    if (sharedError) {
      console.error("Error fetching shared projects:", sharedError);
      throw new Error(sharedError.message);
    }

    // Process and combine the projects
    const processedOwnedProjects = ownedProjects.map(project => ({
      ...project,
      tools: Array.isArray(project.tools) ? project.tools.map(String) : [],
      is_shared: false
    }));

    const sharedProjects = sharedAccessData
      .filter(access => access.projects) // Filter out any null projects
      .map(access => ({
        ...access.projects,
        tools: Array.isArray(access.projects.tools) ? access.projects.tools.map(String) : [],
        is_shared: true,
        access_level: access.access_level
      }));

    return [...processedOwnedProjects, ...sharedProjects];
  } catch (error) {
    console.error("Error in fetchUserProjects:", error);
    throw error;
  }
};
