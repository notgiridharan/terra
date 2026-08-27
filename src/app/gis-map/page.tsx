import type { Metadata } from "next";
import { GisMapWorkspace } from "@/components/gis-map/GisMapWorkspace";

export const metadata: Metadata = {
  title: "GIS Map",
};

export default function GisMapPage() {
  return <GisMapWorkspace />;
}
