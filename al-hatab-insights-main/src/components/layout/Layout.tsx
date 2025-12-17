import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { FloatingBot } from "@/components/floating-bot/FloatingBot";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <FloatingBot />
    </div>
  );
};
