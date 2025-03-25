
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface NewProjectButtonProps {
  className?: string;
}

export const NewProjectButton = ({ className }: NewProjectButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      onClick={() => navigate("/projects")}
      className={className}
    >
      <PlusCircle className="h-4 w-4 mr-2" />
      New Project
    </Button>
  );
};
