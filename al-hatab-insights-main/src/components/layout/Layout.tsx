import { ReactNode, useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { FloatingBot } from "@/components/floating-bot/FloatingBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 border-r border-sidebar-border bg-sidebar shrink-0 hidden md:block">
            <Sidebar />
          </aside>
        )}
        
        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
        )}
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-3 sm:p-4 md:p-6">
          <div className="max-w-full">
          {children}
          </div>
        </main>
      </div>
      <FloatingBot />
    </div>
  );
};
