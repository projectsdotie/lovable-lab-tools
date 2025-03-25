
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '@/types/projectAccess';
import { saveProject, fetchUserProjects } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

export const useProjects = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch projects
  const { 
    data: projects, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchUserProjects,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create/update project mutation
  const { mutate: saveProjectMutation, isPending: isSaving } = useMutation({
    mutationFn: saveProject,
    onSuccess: (savedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSaveError(null);
      toast({
        title: "Project saved",
        description: `${savedProject.name} has been saved successfully.`,
      });
      
      // Also update localStorage for the current project
      localStorage.setItem('currentProject', JSON.stringify(savedProject));
      
      return savedProject;
    },
    onError: (error: Error) => {
      setSaveError(error.message);
      toast({
        title: "Failed to save project",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Show toast when an error occurs with fetching
  if (error) {
    toast({
      title: "Failed to load projects",
      description: (error as Error).message,
      variant: "destructive",
    });
  }

  return {
    projects: projects || [],
    isLoading,
    error,
    saveProject: saveProjectMutation,
    isSaving,
    saveError
  };
};
