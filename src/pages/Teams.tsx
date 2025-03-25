
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Settings } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const Teams = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState([
    { id: 1, name: "Engineering", members: 8, role: "Owner" },
    { id: 2, name: "Design", members: 5, role: "Member" },
    { id: 3, name: "Marketing", members: 4, role: "Admin" },
  ]);

  const handleCreateTeam = () => {
    toast({
      title: "Create Team",
      description: "Team creation functionality will be implemented soon.",
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-screen-xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground mt-1">Manage and collaborate with your teams</p>
          </div>
          <Button className="mt-4 md:mt-0" onClick={handleCreateTeam}>
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </div>
        
        <Separator className="my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    {team.role}
                  </div>
                </div>
                <CardDescription>
                  {team.members} {team.members === 1 ? "member" : "members"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(5, team.members))].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-background"
                    >
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                  {team.members > 5 && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-background">
                      <span className="text-xs font-medium">+{team.members - 5}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t p-3 bg-muted/20">
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" /> Manage Team
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Teams;
