
import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface SplitPanelContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SplitPanelContext = createContext<SplitPanelContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
});

export const useSplitPanel = () => useContext(SplitPanelContext);

interface SplitPanelProps {
  children: React.ReactNode;
  defaultSidebarWidth?: string;
  className?: string;
}

export function SplitPanel({
  children,
  defaultSidebarWidth = "24rem",
  className,
}: SplitPanelProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SplitPanelContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      <div
        className={cn(
          "flex w-full h-screen overflow-hidden bg-background",
          className
        )}
        style={{
          "--sidebar-width": defaultSidebarWidth,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </SplitPanelContext.Provider>
  );
}

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function PanelSidebar({ children, className }: SidebarProps) {
  const { sidebarOpen } = useSplitPanel();

  return (
    <div
      className={cn(
        "h-full panel-transition flex flex-col",
        sidebarOpen ? "w-[var(--sidebar-width)]" : "w-0",
        className
      )}
    >
      <div
        className={cn(
          "flex-1 overflow-hidden panel-transition",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PanelContent({ children, className }: MainContentProps) {
  return (
    <main className={cn("flex-1 h-full overflow-hidden", className)}>
      {children}
    </main>
  );
}

interface PanelToggleProps {
  className?: string;
}

export function PanelToggle({ className }: PanelToggleProps) {
  const { toggleSidebar, sidebarOpen } = useSplitPanel();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "fixed top-4 left-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-md transition-all duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-4",
        className
      )}
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("transition-transform duration-300", sidebarOpen ? "rotate-0" : "rotate-180")}
      >
        <path
          d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </button>
  );
}
