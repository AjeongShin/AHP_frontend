import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function parseNumber(x) {
  if (x == null) return NaN;
  const s = String(x).trim();
  if (!s) return NaN;
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return isFinite(a) && isFinite(b) && b !== 0 ? a / b : NaN;
  }
  const n = Number(s);
  return isFinite(n) ? n : NaN;
}

// CSV → { criteria: string[], matrix: number[][] }
export function importMatrixCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const rows = data;
          if (!rows.length) throw new Error('Empty file.');

          // Row 1: header (first cell = label/blank, then criteria names)
          const header = rows[0].map(x => String(x ?? '').trim());
          const criteria = header.slice(1).filter(Boolean);
          const n = criteria.length;
          if (n < 2) throw new Error('Header must list at least 2 criteria.');

          // Body should contain n rows
          const body = rows.slice(1);
          if (body.length < n) throw new Error(`Matrix must have ${n} rows.`);

          // Read each row label + n values
          const matrix = Array.from({ length: n }, (_, i) => {
            const r = body[i] ?? [];
            return Array.from({ length: n }, (_, j) => parseNumber(r[j + 1]));
          });

          resolve({ criteria, matrix });
        } catch (e) { reject(e); }
      },
      error: reject,
    });
  });
}

/** XLSX (first sheet) → {criteria, matrix} (assumes same layout as CSV) */
export async function importMatrixXlsx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('No sheet found.');
  const ws = wb.Sheets[sheetName];

  // header:1 → 2D array ([[...], [...], ...])
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  if (!rows.length) throw new Error('Empty sheet.');

  const header = rows[0].map(x => String(x ?? '').trim());
  const criteria = header.slice(1).filter(Boolean);
  const n = criteria.length;
  if (n < 2) throw new Error('Header must list at least 2 criteria.');

  const body = rows.slice(1);
  if (body.length < n) throw new Error(`Matrix must have ${n} rows.`);

  const matrix = Array.from({ length: n }, (_, i) => {
    const r = body[i] ?? [];
    return Array.from({ length: n }, (_, j) => parseNumber(r[j + 1]));
  });

  return { criteria, matrix };
}

/** Auto-dispatch by file extension to CSV/XLSX parser */
export async function importMatrixFile(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.csv')) return importMatrixCsv(file);
  if (name.endsWith('.xlsx')) return importMatrixXlsx(file);

  // Fallback by MIME type (some browsers report only MIME)
  const type = file?.type || '';
  if (type.includes('csv')) return importMatrixCsv(file);
  if (type.includes('sheet') || type.includes('excel')) return importMatrixXlsx(file);
  
  throw new Error('Unsupported file type. Please upload .csv or .xlsx');
}