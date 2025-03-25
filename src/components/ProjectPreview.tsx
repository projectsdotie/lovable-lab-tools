
import React from "react";
import { cn } from "@/lib/utils";

interface ProjectPreviewProps {
  className?: string;
}

export function ProjectPreview({ className }: ProjectPreviewProps) {
  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-medium">Project Preview</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full rounded-lg border border-border overflow-hidden shadow-sm animate-scale-in">
          <iframe
            src="https://lovable.dev/"
            className="w-full h-full"
            title="Lovable Project Preview"
            sandbox="allow-same-origin allow-scripts allow-forms"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
