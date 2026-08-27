import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="System configuration, officer roles, and integration endpoints will be managed from this module."
    />
  );
}
