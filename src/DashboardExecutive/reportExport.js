export const exportCsv = (title, columns, rows) => {
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const content = [columns, ...rows].map((row) => row.map(escape).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${title}.csv`; anchor.click(); URL.revokeObjectURL(url);
};

export const printReport = (title, columns, rows) => {
  const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const content = `<html><head><title>${escape(title)}</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body><h1>${escape(title)}</h1><table><thead><tr>${columns.map((column) => `<th>${escape(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
  const page = window.open('', '_blank'); if (!page) return; page.opener = null; page.document.write(content); page.document.close(); page.focus(); page.print();
};
