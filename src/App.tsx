import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Journal from "./pages/Journal";
import JournalSignIn from "./pages/JournalSignIn";
import JournalPlaceholder from "./pages/JournalPlaceholder";
import JournalDashboard from "./pages/JournalDashboard";
import JournalEditor from "./pages/JournalEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* Journal public pages */}
                    <Route path="/" element={<Journal />} />
                    <Route path="/articles" element={<JournalPlaceholder />} />
                    <Route path="/authors" element={<JournalPlaceholder />} />
                    <Route path="/topics" element={<JournalPlaceholder />} />
                    <Route path="/about" element={<JournalPlaceholder />} />
                    {/* Auth */}
                    <Route path="/signin" element={<JournalSignIn />} />
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<JournalDashboard />} />
                    <Route path="/dashboard/editor/:id?" element={<JournalEditor />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
