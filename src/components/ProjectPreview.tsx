
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

interface ProjectPreviewProps {
  className?: string;
}

export function ProjectPreview({ className }: ProjectPreviewProps) {
  const [url, setUrl] = useState("https://lovable.dev/");
  const [currentUrl, setCurrentUrl] = useState("https://lovable.dev/");
  
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

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-medium">Project Preview</h2>
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
    </div>
  );
}
