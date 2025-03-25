import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, ArrowRight, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTools } from "@/hooks/useTools";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectPreviewProps {
  className?: string;
}

export function ProjectPreview({ className }: ProjectPreviewProps) {
  const [url, setUrl] = useState("https://lovable.dev/");
  const [currentUrl, setCurrentUrl] = useState("https://lovable.dev/");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tools, isLoading: toolsLoading } = useTools();
  
  // Check for saved project data on component mount
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      try {
        const projectData = JSON.parse(savedProject);
        setProjectName(projectData.name || "");
        setProjectDescription(projectData.description || "");
        setSelectedTools(projectData.tools || []);
        
        // Update URL if it exists in the saved project
        if (projectData.url) {
          let processedUrl = projectData.url.trim();
          if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = `https://${processedUrl}`;
          }
          setUrl(processedUrl);
          setCurrentUrl(processedUrl);
        }
        
        toast({
          title: "Project loaded",
          description: `Successfully loaded project: ${projectData.name}`,
        });
      } catch (error) {
        console.error("Error loading saved project data:", error);
      }
    }
  }, [toast]);
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let processedUrl = url.trim();
    
    // Add https:// if no protocol is specified
    if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }
    
    setCurrentUrl(processedUrl);
  };
  
  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveProject = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save projects",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (!projectName.trim()) {
      toast({
        title: "Project name is required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: projectName,
          description: projectDescription,
          url: currentUrl,
          user_id: user.id,
          tools: selectedTools
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Project saved",
        description: "Your project has been saved successfully.",
      });
      
      setIsDialogOpen(false);
      
      // Save current project to localStorage for later access
      const currentProject = {
        id: data.id,
        name: projectName,
        description: projectDescription,
        url: currentUrl,
        tools: selectedTools
      };
      localStorage.setItem('currentProject', JSON.stringify(currentProject));
    } catch (error: any) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openSaveDialog = () => {
    setIsDialogOpen(true);
  };

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId);
      } else {
        return [...prev, toolId];
      }
    });
  };

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-medium">Project Preview</h2>
        <Button 
          onClick={openSaveDialog} 
          size="sm" 
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Project
        </Button>
      </div>
      
      <div className="p-4 border-b border-border">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter project URL"
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            Load
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={handleOpenExternal}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full rounded-lg border border-border overflow-hidden shadow-sm animate-scale-in">
          <iframe
            src={currentUrl}
            className="w-full h-full"
            title="Lovable Project Preview"
            sandbox="allow-same-origin allow-scripts allow-forms"
            loading="lazy"
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Enter details for your project to save it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name *
              </label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="url" className="text-sm font-medium">
                Project URL
              </label>
              <Input
                id="url"
                value={currentUrl}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Tools Used
              </label>
              <div className="grid grid-cols-2 gap-2">
                {toolsLoading ? (
                  <div>Loading tools...</div>
                ) : (
                  tools.map((tool) => (
                    <div key={tool.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`tool-${tool.id}`} 
                        checked={selectedTools.includes(tool.id)}
                        onCheckedChange={() => handleToolToggle(tool.id)}
                      />
                      <label 
                        htmlFor={`tool-${tool.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tool.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
              disabled={!projectName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
