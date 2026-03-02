import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppProviders } from "@/app/providers";
import { AuthProvider } from "@/features/auth/context";
import { SidebarProvider } from "@/features/layout/sidebar-provider";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <ErrorBoundary>
    <AppProviders>
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <App />
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppProviders>
  </ErrorBoundary>
);
