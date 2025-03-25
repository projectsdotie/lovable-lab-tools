
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  AlarmClock, 
  Clock, 
  FileText, 
  Database,
  Download
} from "lucide-react";
import { TimeTools } from "./tools/TimeTools";
import { NotesTools } from "./tools/NotesTools";
import { GeneratorTools } from "./tools/GeneratorTools";

interface SidebarProps {
  className?: string;
}

type Tool = "time" | "notes" | "prd" | "sql" | "kb";

export function Sidebar({ className }: SidebarProps) {
  const [activeTool, setActiveTool] = useState<Tool>("time");

  const handleToolChange = (tool: Tool) => {
    setActiveTool(tool);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium">Tools</h2>
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Tool Navigation */}
        <div className="flex justify-between p-3 border-b border-border">
          <Button
            variant={activeTool === "time" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToolChange("time")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 h-auto",
              activeTool === "time" ? "bg-primary" : "hover:bg-accent"
            )}
          >
            <Clock className="h-4 w-4" />
            <span className="text-xs">Time</span>
          </Button>
          
          <Button
            variant={activeTool === "notes" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToolChange("notes")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 h-auto",
              activeTool === "notes" ? "bg-primary" : "hover:bg-accent"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="text-xs">Notes</span>
          </Button>
          
          <Button
            variant={activeTool === "prd" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToolChange("prd")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 h-auto",
              activeTool === "prd" ? "bg-primary" : "hover:bg-accent"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="text-xs">PRD</span>
          </Button>
          
          <Button
            variant={activeTool === "sql" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToolChange("sql")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 h-auto",
              activeTool === "sql" ? "bg-primary" : "hover:bg-accent"
            )}
          >
            <Database className="h-4 w-4" />
            <span className="text-xs">SQL</span>
          </Button>
          
          <Button
            variant={activeTool === "kb" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleToolChange("kb")}
            className={cn(
              "flex flex-col items-center gap-1 p-2 h-auto",
              activeTool === "kb" ? "bg-primary" : "hover:bg-accent"
            )}
          >
            <Database className="h-4 w-4" />
            <span className="text-xs">KB</span>
          </Button>
        </div>
        
        {/* Tool Content */}
        <div className="flex-1 overflow-y-auto">
          <div className={cn("p-4", activeTool === "time" ? "block" : "hidden")}>
            <TimeTools />
          </div>
          
          <div className={cn("p-4", activeTool === "notes" ? "block" : "hidden")}>
            <NotesTools />
          </div>
          
          <div className={cn("p-4", activeTool === "prd" || activeTool === "sql" || activeTool === "kb" ? "block" : "hidden")}>
            <GeneratorTools type={activeTool} />
          </div>
        </div>
      </div>
    </div>
  );
}
