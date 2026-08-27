import type { Metadata } from "next";
import { AuditLogsWorkspace } from "@/components/audit-logs/AuditLogsWorkspace";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default function AuditLogsPage() {
  return <AuditLogsWorkspace />;
}
