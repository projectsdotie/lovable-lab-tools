
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTools, Tool } from '@/services/projectService';
import { useToast } from '@/hooks/use-toast';

export const useTools = () => {
  const { toast } = useToast();
  
  const { 
    data: tools, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['tools'],
    queryFn: fetchTools,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (err: Error) => {
      toast({
        title: "Failed to load tools",
        description: err.message,
        variant: "destructive",
      });
    }
  });

  return {
    tools: tools || [],
    isLoading,
    error
  };
};

export const getToolNameById = (tools: Tool[], id: string): string => {
  const tool = tools.find(t => t.id === id);
  return tool?.name || 'Unknown Tool';
};

export const getToolsByType = (tools: Tool[], type: string): Tool[] => {
  return tools.filter(tool => tool.type === type);
};
