import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="hud-lattice min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex font-sans antialiased">
      {/* Fixed 260px Navigation Bar */}
      <DashboardSidebar />

      {/* Main 1fr Context-Specific HUD Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 max-w-[var(--container-max)] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
