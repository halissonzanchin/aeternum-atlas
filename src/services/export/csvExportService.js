export function downloadCsv(filename, rows) {
  if (!rows || !rows.length) return;

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
  ].join('\n');

  // Add UTF-8 BOM to ensure Excel opens it correctly with accents
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
