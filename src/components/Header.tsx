
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Moon, Sun, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check system preference on initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className={cn(
        "w-full h-16 flex items-center px-6 backdrop-blur-md bg-background/80 border-b border-border z-40 animate-fade-in",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-medium">Lovable Lab Tools</h1>
          
          <NavigationMenu className="ml-6 hidden sm:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/teams">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Users className="w-4 h-4 mr-2" />
                    Teams
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile navigation buttons */}
        <div className="sm:hidden flex space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link to="/teams">
              <Users className="w-4 h-4 mr-1" />
              Teams
            </Link>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full hover:bg-accent"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
