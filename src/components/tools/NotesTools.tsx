
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Plus, 
  X, 
  Save,
  Download,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NoteCategory = "bug" | "feature" | "flow" | "general" | "idea";

interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: Date;
}

export function NotesTools() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem("lovable-lab-notes");
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("general");
  const [isEditing, setIsEditing] = useState(false);
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("lovable-lab-notes", JSON.stringify(notes));
  }, [notes]);
  
  const createNewNote = () => {
    if (!newNoteTitle.trim()) return;
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: newNoteTitle,
      content: newNoteContent,
      category: newNoteCategory,
      createdAt: new Date()
    };
    
    setNotes([newNote, ...notes]);
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteCategory("general");
    setActiveNote(newNote);
    setIsEditing(false);
  };
  
  const updateNote = () => {
    if (!activeNote) return;
    
    const updatedNotes = notes.map(note => 
      note.id === activeNote.id 
        ? { ...activeNote, title: newNoteTitle, content: newNoteContent, category: newNoteCategory as NoteCategory }
        : note
    );
    
    setNotes(updatedNotes);
    setActiveNote({ ...activeNote, title: newNoteTitle, content: newNoteContent, category: newNoteCategory as NoteCategory });
    setIsEditing(false);
  };
  
  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };
  
  const startEditing = () => {
    if (!activeNote) return;
    
    setNewNoteTitle(activeNote.title);
    setNewNoteContent(activeNote.content);
    setNewNoteCategory(activeNote.category);
    setIsEditing(true);
  };
  
  const cancelEditing = () => {
    setIsEditing(false);
    if (!activeNote) {
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteCategory("general");
    }
  };
  
  const exportNotes = () => {
    const notesJson = JSON.stringify(notes, null, 2);
    const blob = new Blob([notesJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "lovable-lab-notes.json";
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getCategoryColor = (category: NoteCategory) => {
    switch (category) {
      case "bug": return "destructive";
      case "feature": return "default";
      case "flow": return "secondary";
      case "idea": return "bg-yellow-500 text-white hover:bg-yellow-600";
      default: return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-fade-in">
      {/* Note Editor */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            {isEditing ? (
              activeNote ? "Edit Note" : "New Note"
            ) : (
              "Notes"
            )}
            <Button
              onClick={exportNotes}
              variant="ghost"
              size="sm"
              className="h-8 gap-1 -mr-2"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Export Notes</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing || !activeNote ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="note-category">Category</Label>
                <Select
                  value={newNoteCategory}
                  onValueChange={(value) => setNewNoteCategory(value as NoteCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="flow">Flow</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">{activeNote.title}</h3>
                <Badge variant={getCategoryColor(activeNote.category) as any}>
                  {activeNote.category}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {new Date(activeNote.createdAt).toLocaleString()}
              </div>
              
              <div className="pt-2 whitespace-pre-wrap">
                {activeNote.content}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing} className="gap-1">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={activeNote ? updateNote : createNewNote}
                  disabled={!newNoteTitle.trim()}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" /> Save
                </Button>
              </>
            ) : (
              <>
                {activeNote ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setActiveNote(null)} className="gap-1">
                      <X className="h-4 w-4" /> Close
                    </Button>
                    <div className="space-x-2">
                      <Button variant="destructive" size="sm" onClick={() => deleteNote(activeNote.id)} className="gap-1">
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                      <Button size="sm" onClick={startEditing} className="gap-1">
                        <FileText className="h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)} className="gap-1 ml-auto">
                    <Plus className="h-4 w-4" /> New Note
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>
      
      {/* Notes List */}
      {!isEditing && notes.length > 0 && (
        <Card className="flex-1 min-h-0 glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Notes</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <CardContent>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNote(note)}
                    className={cn(
                      "p-3 rounded-md cursor-pointer transition hover-scale",
                      activeNote?.id === note.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-accent"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      <Badge variant={getCategoryColor(note.category) as any} className="ml-2 shrink-0">
                        {note.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
