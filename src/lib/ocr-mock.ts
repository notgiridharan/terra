import type { LandDocument } from "@/lib/documents";
import { RECORD_SECTIONS } from "@/lib/structured-record";

export function mockOcrText(doc: LandDocument): string {
  const lines: string[] = [
    `TERRALENS MOCK OCR · ${doc.classification.predictedType}`,
    `FILE: ${doc.name}`,
    `LANGUAGE: ${doc.classification.language}`,
    "",
  ];

  for (const section of RECORD_SECTIONS) {
    lines.push(`--- ${section.label.toUpperCase()} ---`);
    for (const field of doc.structuredRecord.sections[section.id]) {
      lines.push(`${field.label}: ${field.value}`);
    }
    lines.push("");
  }

  lines.push(
    "[handwritten] 1 acre sold / 5 acres original / 4 acres remaining",
    "[stamp] Sub-Registrar, Sirkazhi — mock extract, OCR not connected",
  );

  return lines.join("\n");
}
