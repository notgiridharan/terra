import type { Metadata } from "next";
import { OcrWorkspace } from "@/components/ocr/OcrWorkspace";

export const metadata: Metadata = {
  title: "OCR Extraction — TerraLens",
  description:
    "Upload land documents (image, PDF, DOCX) and extract structured fields using PaddleOCR. Supports Tamil, English, and Hindi.",
};

export default function OcrPage() {
  return <OcrWorkspace />;
}
