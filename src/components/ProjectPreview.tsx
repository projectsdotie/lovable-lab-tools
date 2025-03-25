
import { useState } from "react";
import { SaveProjectButton } from "./SaveProjectButton";
import { NewProjectButton } from "./NewProjectButton";

export function ProjectPreview() {
  const [projectTitle, setProjectTitle] = useState("My Project");
  
  const handleSaveProject = () => {
    console.log("Project saved successfully");
    // Additional logic after saving
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">Project Preview</h2>
        <div className="flex space-x-2">
          <NewProjectButton />
          <SaveProjectButton 
            projectTitle={projectTitle} 
            onSave={handleSaveProject} 
          />
        </div>
      </div>
      
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">{projectTitle}</h3>
          <p className="text-muted-foreground mb-8">
            This is a preview of your project. Use the tools panel to edit and configure it.
          </p>
          <div className="flex justify-center space-x-4">
            <NewProjectButton />
            <SaveProjectButton 
              projectTitle={projectTitle} 
              onSave={handleSaveProject} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
