/**
 * SEAL Hackathon Utility - Export Data to CSV / Excel File
 */

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!rows || !rows.length) return;

  let csvContent = "";

  if (headers && headers.length) {
    const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");
    csvContent += headerRow + "\r\n";

    rows.forEach((row) => {
      const line = headers
        .map((h) => {
          const val = row[h.key];
          const str = val !== undefined && val !== null ? String(val) : "";
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
      csvContent += line + "\r\n";
    });
  } else {
    const keys = Object.keys(rows[0]);
    csvContent += keys.map((k) => `"${k}"`).join(",") + "\r\n";

    rows.forEach((row) => {
      const line = keys
        .map((k) => {
          const val = row[k];
          const str = val !== undefined && val !== null ? String(val) : "";
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
      csvContent += line + "\r\n";
    });
  }

  // BOM UTF-8 for Excel Vietnamese support
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
