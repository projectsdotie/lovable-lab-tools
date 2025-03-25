
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

  // Using useEffect would be better, but for simplicity, we'll just check and not cause side effects
  const hasError = error !== null && error !== undefined;

  return {
    projects: projects || [],
    isLoading,
    error: hasError ? error : null,
    saveProject: saveProjectMutation,
    isSaving,
    saveError
  };
};
