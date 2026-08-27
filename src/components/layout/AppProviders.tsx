"use client";

import { DocumentsProvider } from "@/lib/documents-store";
import { ConflictsActionsProvider } from "@/lib/conflicts-store";
import { VerificationProvider } from "@/lib/verification-store";
import { AuditProvider } from "@/lib/audit-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { isPublicPath } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppGate>{children}</AppGate>
    </AuthProvider>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!session && !isPublicPath(pathname)) {
      router.replace("/login");
    }
  }, [ready, session, pathname, router]);

  if (isPublicPath(pathname)) {
    return children;
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tl-bg text-[13px] text-tl-muted">
        Verifying session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tl-bg text-[13px] text-tl-muted">
        Redirecting to Government Officer Portal…
      </div>
    );
  }

  return (
    <DocumentsProvider>
      <ConflictsActionsProvider>
        <VerificationProvider>
          <AuditProvider>
            <AppShell>{children}</AppShell>
          </AuditProvider>
        </VerificationProvider>
      </ConflictsActionsProvider>
    </DocumentsProvider>
  );
}
