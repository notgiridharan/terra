import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { AccessDeniedBanner } from "@/components/layout/AccessDeniedBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-tl-bg text-tl-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar />
        <main className="min-h-0 flex-1 overflow-y-auto bg-tl-bg p-6">
          <Suspense fallback={null}>
            <AccessDeniedBanner />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
