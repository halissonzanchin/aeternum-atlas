import { getInstitutionMetrics } from "../institutions/institutionService";
import { listAnalyticsEvents } from "../analytics/analyticsService";
import { storageKeys, writeStorage } from "../storage/storageService";

export function exportRowsToCsv(filename, rows) {
  const csv = rowsToCsv(rows);
  const payload = {
    id: `report-${crypto.randomUUID?.() || Date.now()}`,
    filename,
    csv,
    createdAt: new Date().toISOString()
  };

  writeStorage(storageKeys.reportExports, payload);

  if (typeof window !== "undefined") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return payload;
}

export function rowsToCsv(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const escapeCell = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...rows.map(row => headers.map(header => escapeCell(row[header])).join(","))
  ].join("\n");
}

export function buildInstitutionExecutiveReport(institutionId) {
  if (!institutionId) {
    throw new Error("institution_id obrigatório para gerar relatório executivo institucional.");
  }

  const metrics = getInstitutionMetrics(institutionId);
  const events = listAnalyticsEvents({ institutionId });

  return {
    id: `executive-${institutionId}-${new Date().toISOString().slice(0, 10)}`,
    institution: metrics.institution,
    generatedAt: new Date().toISOString(),
    metrics,
    eventSummary: {
      totalEvents: events.length,
      modelViews: events.filter(event => event.eventType === "open_model_viewer").length,
      exports: events.filter(event => event.eventType === "export_csv").length,
      errors: events.filter(event => event.eventType?.includes("error")).length
    }
  };
}

export function printReport() {
  if (typeof window !== "undefined") window.print();
}
