
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Database, Copy, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface GeneratorToolsProps {
  type: "prd" | "sql" | "kb";
}

export function GeneratorTools({ type }: GeneratorToolsProps) {
  const [idea, setIdea] = useState("");
  const [prd, setPrd] = useState("");
  const [sql, setSql] = useState("");
  const [kb, setKb] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const generatePRD = () => {
    // This would normally be an API call
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const generatedPRD = `# Product Requirements Document

## Project Overview
${idea}

## User Stories
1. As a user, I want to be able to view all my projects in one place
2. As a user, I want to track time while working on my projects
3. As a user, I want to make notes about my progress
4. As a user, I want to generate documentation from my ideas

## Features
- Project dashboard with real-time preview
- Time tracking tools (timer, stopwatch, alarm)
- Note-taking with categorization
- Document generators (PRD, SQL, Knowledge Base)

## Technical Requirements
- Responsive design
- Real-time updates
- Dark mode support
- Export functionality
- Offline capabilities

## Success Metrics
- User engagement time
- Number of documents generated
- User retention rate
- Feature usage analytics`;

      setPrd(generatedPRD);
      setIsGenerating(false);
      toast({
        title: "PRD Generated",
        description: "Your Product Requirements Document has been created.",
      });
    }, 1500);
  };
  
  const generateSQL = () => {
    // This would normally be an API call
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const generatedSQL = `-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes Table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Records Table
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  duration INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own projects"
  ON projects FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can only see their own notes"
  ON notes FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can only see their own time records"
  ON time_records FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can only see their own documents"
  ON documents FOR ALL
  USING (user_id = auth.uid());`;

      setSql(generatedSQL);
      setIsGenerating(false);
      toast({
        title: "SQL Schema Generated",
        description: "Your SQL database schema has been created.",
      });
    }, 1500);
  };
  
  const generateKB = () => {
    // This would normally be an API call
    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const generatedKB = `# Lovable Lab Tools Knowledge Base

## Project Description
Lovable Lab Tools is a productivity suite designed for developers using Lovable. It provides time tracking, note-taking, and document generation tools in a split-panel interface alongside a project preview.

## Core Features
- Split-panel layout with project preview on the right
- Time tracking tools (timer, stopwatch, alarm)
- Notes with categorization (bugs, features, flows, ideas)
- Document generators (PRD, SQL schema, Knowledge Base)
- Dark mode support
- Export functionality

## UI/UX Guidelines
- Clean, minimalist interface inspired by Apple design
- Glass morphism effects for cards and panels
- Smooth animations for all interactions
- Responsive layout that works on all screen sizes
- Consistent spacing and typography

## Data Structure
- Projects: id, user_id, title, description, timestamps
- Notes: id, user_id, project_id, title, content, category, timestamps
- TimeRecords: id, user_id, project_id, duration, start/end timestamps
- Documents: id, user_id, project_id, title, content, type, timestamps

## Integration Requirements
- Supabase for authentication and data storage
- Real-time updates for project preview
- Export functionality for all generated documents

## Implementation Notes
- Optimize for performance with lazy loading
- Implement proper error handling for all API calls
- Ensure all components are reusable and well-documented
- Follow accessibility guidelines throughout the application`;

      setKb(generatedKB);
      setIsGenerating(false);
      toast({
        title: "Knowledge Base Generated",
        description: "Your Lovable Knowledge Base has been created.",
      });
    }, 1500);
  };
  
  const handleGenerate = () => {
    if (!idea.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your app idea before generating.",
        variant: "destructive",
      });
      return;
    }
    
    if (type === "prd") {
      generatePRD();
    } else if (type === "sql") {
      // For SQL, we need a PRD first
      if (!prd) {
        generatePRD();
        // We'll simulate this sequence
        setTimeout(() => generateSQL(), 2000);
      } else {
        generateSQL();
      }
    } else if (type === "kb") {
      // For KB, we ideally need a PRD first
      if (!prd) {
        generatePRD();
        // We'll simulate this sequence
        setTimeout(() => generateKB(), 2000);
      } else {
        generateKB();
      }
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getOutput = () => {
    if (type === "prd") return prd;
    if (type === "sql") return sql;
    if (type === "kb") return kb;
    return "";
  };
  
  const getTitle = () => {
    if (type === "prd") return "Product Requirements Document Generator";
    if (type === "sql") return "SQL Schema Generator";
    if (type === "kb") return "Lovable Knowledge Base Generator";
    return "Generator";
  };
  
  const getDescription = () => {
    if (type === "prd") return "Convert your app idea into a structured PRD";
    if (type === "sql") return "Generate SQL database schema from your PRD";
    if (type === "kb") return "Create Lovable knowledge base from your PRD";
    return "";
  };
  
  const getIcon = () => {
    if (type === "prd") return FileText;
    if (type === "sql" || type === "kb") return Database;
    return FileText;
  };
  
  const getFileName = () => {
    if (type === "prd") return "product-requirements-document.md";
    if (type === "sql") return "database-schema.sql";
    if (type === "kb") return "lovable-knowledge-base.md";
    return "output.txt";
  };
  
  const getContentType = () => {
    if (type === "prd" || type === "kb") return "text/markdown";
    if (type === "sql") return "text/plain";
    return "text/plain";
  };
  
  const output = getOutput();
  const Icon = getIcon();

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{getTitle()}</span>
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">{getDescription()}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="idea">Your App Idea</Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your app idea here..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !idea.trim()} 
            className="ml-auto gap-1"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Generate {type.toUpperCase()}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {output && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Output</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(output)}
                  className="h-8 gap-1"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(output, getFileName(), getContentType())}
                  className="h-8 gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only">Download</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="h-[300px]">
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-mono bg-accent/50 p-4 rounded-md">
                {output}
              </pre>
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
