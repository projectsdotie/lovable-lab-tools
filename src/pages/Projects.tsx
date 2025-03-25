
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Pencil, Trash2, ExternalLink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectAccess, AccessLevel, ProjectAccessFormData } from "@/types/projectAccess";
import { addProjectAccess, removeProjectAccess, getProjectAccess } from "@/utils/projectAccess";

type Project = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  created_at: string;
};

const Projects = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null);
  
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [projectAccessList, setProjectAccessList] = useState<ProjectAccess[]>([]);
  const [accessFormData, setAccessFormData] = useState<ProjectAccessFormData>({
    email: "",
    access_level: "view",
  });
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [selectedProjectForSharing, setSelectedProjectForSharing] = useState<Project | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setCurrentProject(project);
      setIsEditing(true);
    } else {
      setCurrentProject({ name: "", description: "", url: "" });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentProject(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProject?.name) {
      toast({
        title: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && currentProject.id) {
        const { error } = await supabase
          .from("projects")
          .update({
            name: currentProject.name,
            description: currentProject.description,
            url: currentProject.url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProject.id);

        if (error) throw error;

        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("projects")
          .insert({
            name: currentProject.name,
            description: currentProject.description,
            url: currentProject.url,
            user_id: user?.id,
          });

        if (error) throw error;

        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
      }

      fetchProjects();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Project deleted",
          description: "Your project has been deleted successfully.",
        });

        fetchProjects();
      } catch (error: any) {
        toast({
          title: "Error deleting project",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenProject = (project: Project) => {
    try {
      localStorage.setItem('currentProject', JSON.stringify(project));
      
      toast({
        title: "Project loaded",
        description: `Loading ${project.name} in the dashboard.`,
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error loading project",
        description: "Could not load project data.",
        variant: "destructive",
      });
    }
  };

  const openSharingDialog = async (project: Project) => {
    setSelectedProjectForSharing(project);
    setAccessFormData({ email: "", access_level: "view" });
    setIsSharingDialogOpen(true);
    await fetchProjectAccess(project.id);
  };

  const fetchProjectAccess = async (projectId: string) => {
    setLoadingAccess(true);
    try {
      const accessList = await getProjectAccess(projectId);
      setProjectAccessList(accessList);
    } catch (error: any) {
      toast({
        title: "Error fetching access list",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleAccessFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessFormData({
      ...accessFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAccessLevelChange = (value: string) => {
    setAccessFormData({
      ...accessFormData,
      access_level: value as AccessLevel,
    });
  };

  const handleAddAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessFormData.email || !selectedProjectForSharing) {
      toast({
        title: "Missing information",
        description: "Please provide a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoadingAccess(true);
    try {
      const result = await addProjectAccess(
        selectedProjectForSharing.id,
        accessFormData.email,
        accessFormData.access_level
      );

      toast({
        title: result.updated ? "Access updated" : "Access granted",
        description: result.updated 
          ? `Updated access for ${accessFormData.email}.`
          : `${accessFormData.email} now has ${accessFormData.access_level} access to this project.`,
      });

      setAccessFormData({ email: "", access_level: "view" });
      await fetchProjectAccess(selectedProjectForSharing.id);
    } catch (error: any) {
      toast({
        title: "Error granting access",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleRemoveAccess = async (accessId: string) => {
    if (!selectedProjectForSharing) return;

    try {
      await removeProjectAccess(accessId);

      toast({
        title: "Access removed",
        description: "The user's access has been removed.",
      });

      await fetchProjectAccess(selectedProjectForSharing.id);
    } catch (error: any) {
      toast({
        title: "Error removing access",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background antialiased">
      <Header />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Project
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-12 text-center">
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Start by creating your first project</p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.url && (
                    <div className="text-sm text-muted-foreground truncate">
                      <span className="font-medium">URL:</span> {project.url}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSharingDialog(project)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenProject(project)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> Open
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Project" : "Add New Project"}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update your project details below."
                  : "Fill in the details for your new project."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Project Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={currentProject?.name || ""}
                    onChange={handleChange}
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
                    name="description"
                    value={currentProject?.description || ""}
                    onChange={handleChange}
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
                    name="url"
                    value={currentProject?.url || ""}
                    onChange={handleChange}
                    placeholder="Enter project URL"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isSharingDialogOpen} onOpenChange={setIsSharingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Project</DialogTitle>
              <DialogDescription>
                Give other users access to your project
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <form onSubmit={handleAddAccess} className="space-y-3">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    value={accessFormData.email}
                    onChange={handleAccessFormChange}
                    placeholder="Enter user email"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="access_level" className="text-sm font-medium">
                    Access Level
                  </label>
                  <Select
                    value={accessFormData.access_level}
                    onValueChange={handleAccessLevelChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loadingAccess}>
                  {loadingAccess ? "Adding..." : "Add User"}
                </Button>
              </form>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Access</h4>
                {loadingAccess ? (
                  <div className="text-sm">Loading...</div>
                ) : projectAccessList.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No users have access yet</div>
                ) : (
                  <div className="space-y-2">
                    {projectAccessList.map((access) => (
                      <div
                        key={access.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div>
                          <div className="text-sm">{access.user_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {access.access_level} access
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAccess(access.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Projects;
