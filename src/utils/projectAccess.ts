
import { supabase } from "@/integrations/supabase/client";
import type { AccessLevel } from "@/types/projectAccess";

/**
 * Add or update a user's access to a project
 * @param projectId The ID of the project to share
 * @param userEmail The email of the user to grant access to
 * @param accessLevel The level of access to grant (view or edit)
 */
export const addProjectAccess = async (
  projectId: string,
  userEmail: string,
  accessLevel: AccessLevel
) => {
  try {
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", userEmail)
      .single();

    if (userError) {
      throw new Error("User not found. Please make sure the email is correct.");
    }

    const userId = userData.id;

    // Check if access already exists
    const { data: existingAccess, error: checkError } = await supabase
      .from("project_access")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (checkError) throw checkError;

    if (existingAccess && existingAccess.length > 0) {
      // Update existing access
      const { error } = await supabase
        .from("project_access")
        .update({
          access_level: accessLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccess[0].id);

      if (error) throw error;
      
      return { updated: true, added: false };
    } else {
      // Add new access
      const { error } = await supabase
        .from("project_access")
        .insert({
          project_id: projectId,
          user_id: userId,
          access_level: accessLevel,
        });

      if (error) throw error;
      
      return { updated: false, added: true };
    }
  } catch (error) {
    console.error("Error in addProjectAccess:", error);
    throw error;
  }
};

/**
 * Remove a user's access to a project
 * @param accessId The ID of the access entry to remove
 */
export const removeProjectAccess = async (accessId: string) => {
  try {
    const { error } = await supabase
      .from("project_access")
      .delete()
      .eq("id", accessId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error in removeProjectAccess:", error);
    throw error;
  }
};

/**
 * Get all users who have access to a project
 * @param projectId The ID of the project to get access for
 */
export const getProjectAccess = async (projectId: string) => {
  try {
    // Use the database function to avoid the ambiguous column issue
    const { data, error } = await supabase
      .rpc('get_project_access', { p_project_id: projectId });

    if (error) {
      console.error("Error fetching project access:", error);
      throw error;
    }
    
    // Map the results to include profiles property for compatibility
    return data.map(item => ({
      ...item,
      profiles: { username: item.username }
    }));
  } catch (error) {
    console.error("Error in getProjectAccess:", error);
    throw error;
  }
};

/**
 * Get all projects including those shared with the current user
 */
export const getAllAccessibleProjects = async () => {
  try {
    // Get the current user's ID
    const sessionResponse = await supabase.auth.getSession();
    const userId = sessionResponse.data.session?.user.id;
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // First get the projects owned by the user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (ownedError) throw ownedError;

    // Then get the projects shared with the user through project_access
    const { data: sharedProjects, error: sharedError } = await supabase
      .from("project_access")
      .select(`
        access_level,
        projects:project_id (*)
      `)
      .eq("user_id", userId);

    if (sharedError) throw sharedError;

    // Combine the results
    const sharedProjectsData = sharedProjects
      ? sharedProjects
          .filter(item => item.projects)
          .map(item => ({
            ...item.projects,
            access_level: item.access_level,
            is_shared: true
          }))
      : [];

    return [...(ownedProjects || []).map(p => ({ ...p, is_shared: false })), ...sharedProjectsData];
  } catch (error) {
    console.error("Error in getAllAccessibleProjects:", error);
    throw error;
  }
};
