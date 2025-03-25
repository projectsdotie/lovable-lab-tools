
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProjectPreview } from "@/components/ProjectPreview";
import { SplitPanel, PanelSidebar, PanelContent, PanelToggle } from "@/components/ui/SplitPanel";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background antialiased">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <SplitPanel defaultSidebarWidth="24rem">
          <PanelToggle />
          
          <PanelSidebar>
            <Sidebar />
          </PanelSidebar>
          
          <PanelContent>
            <ProjectPreview />
          </PanelContent>
        </SplitPanel>
      </div>
    </div>
  );
};

export default Index;
