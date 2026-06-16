import { useState } from "react";
import { parseCsv, validateRows, executeImport } from "../../../services/academic/academicImportService";

export function useAcademicImport(institutionId) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | parsing | preview | importing | done
  const [parsedData, setParsedData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setParsedData(null);
    setImportResult(null);
    setError(null);
  };

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setStatus("parsing");
    setError(null);

    try {
      const rows = await parseCsv(uploadedFile);
      const validation = validateRows(rows);
      setParsedData(validation);
      setStatus("preview");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const confirmImport = async () => {
    if (!parsedData || parsedData.validRows.length === 0) return;
    setStatus("importing");
    try {
      const result = await executeImport(parsedData.validRows, institutionId);
      setImportResult(result);
      setStatus("done");
    } catch (err) {
      setError("Falha fatal durante a importação: " + err.message);
      setStatus("done");
    }
  };

  return {
    file,
    status,
    parsedData,
    importResult,
    error,
    handleFileUpload,
    confirmImport,
    reset
  };
}
