import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/components/floating-bot/ChatContext";
import "@/i18n/config";

// Route-level code splitting to reduce initial bundle without altering UI
const Index = lazy(() => import("./pages/Index"));
const Factory = lazy(() => import("./pages/Factory"));
const DC = lazy(() => import("./pages/DC"));
const Store = lazy(() => import("./pages/Store"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChatProvider>
          <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/factory" element={<Factory />} />
          <Route path="/dc" element={<DC />} />
          <Route path="/store" element={<Store />} />
              <Route path="/chat" element={<Chat />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
        </ChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
