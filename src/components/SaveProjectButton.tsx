
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SaveProjectButtonProps {
  projectTitle: string;
  onSave: () => void;
}

export const SaveProjectButton = ({ projectTitle, onSave }: SaveProjectButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState(projectTitle || "");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenDialog = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to sign in to save projects",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!name.trim()) {
      toast({
        title: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from("projects")
        .insert({
          name,
          description,
          url,
          user_id: user!.id,
        });

      if (error) throw error;

      toast({
        title: "Project saved",
        description: "Your project has been saved successfully",
      });
      
      onSave();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error saving project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpenDialog} className="gap-2">
        <Save className="h-4 w-4" />
        Save Project
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Enter the details to save your project
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name *
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter project URL (optional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
