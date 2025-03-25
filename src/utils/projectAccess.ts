
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
};

/**
 * Remove a user's access to a project
 * @param accessId The ID of the access entry to remove
 */
export const removeProjectAccess = async (accessId: string) => {
  const { error } = await supabase
    .from("project_access")
    .delete()
    .eq("id", accessId);

  if (error) throw error;
  
  return true;
};

/**
 * Get all users who have access to a project
 * @param projectId The ID of the project to get access for
 */
export const getProjectAccess = async (projectId: string) => {
  const { data, error } = await supabase
    .from("project_access")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw error;
  
  return data || [];
};
