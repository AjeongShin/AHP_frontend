import Papa from 'papaparse';
import * as XLSX from 'xlsx';


// 0. Cell Parser
// 1) AHP origin, BWM (non)linear
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
// 2) fuzzy
export function parseFuzzyCell(x) {
  if (x == null) return [NaN, NaN, NaN];

  const s = String(x).trim();
  if (s === '0') return 0;

  if (!s) return [NaN, NaN, NaN];
  const inner = s.replace(/^[\(\[]\s*/, '').replace(/\s*[\)\]]$/, '');  // remove parentheses: both are allowed (1,2,3), [1,2,3] 

  if (inner.includes(',')) {
    const parts = inner.split(',').map(p => parseNumber(p));
    if (parts.length !== 3 || parts.some(v => !isFinite(v))) {
      return [NaN, NaN, NaN];
    }
    const [l, m, u] = parts;
    return [l, m, u];
  }

  // if input only one scalar v, then (v,v,v)
  // const v = parseNumber(inner);
  // if (!isFinite(v)) return [NaN, NaN, NaN];
  // return [v, v, v];
}
// 3) linguistic fuzzy
const AHP_LINGUISTIC_CODES = new Set([
  'EI',  
  'WLI', 'WMI',
  'FLI', 'FMI',
  'VLI', 'VMI',
  'ALI', 'AMI',
]);

export function parseLinguisticAHPFuzzyCell(x) {
  if (x == null) return null;

  const s = String(x).trim().toUpperCase();
  if (!s) return null;
  if (s === '0') return 0;
  if (!AHP_LINGUISTIC_CODES.has(s)) return null;

  return s; // string
}

const BWM_LINGUISTIC_CODES = new Set([
  'EI',  
  'WI', 
  'FI', 
  'VI', 
  'AI', 
]);
export function parseLinguisticBWMFuzzyCell(x) {
  if (x == null) return null;

  const s = String(x).trim().toUpperCase();
  if (!s) return null;
  if (s === '0') return 0;
  if (!BWM_LINGUISTIC_CODES.has(s)) return null;

  return s; // string
}


// 1. CSV Parser
// CSV → { criteria: string[], matrix: number[][] }

// 1) AHP origin, BWM (non)linear
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

// 2) Fuzzy 
export function importFuzzyMatrixCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const rows = data;
          if (!rows.length) throw new Error('Empty file.');

          // Row 1: header (first cell = label/blank, then criteria names)
          const header = rows[0].map((x) => String(x ?? '').trim());
          const criteria = header.slice(1).filter(Boolean);
          const n = criteria.length;
          if (n < 2) throw new Error('Header must list at least 2 criteria.');

          // Body should contain n rows
          const body = rows.slice(1);
          if (body.length < n) throw new Error(`Matrix must have ${n} rows.`);

          // Read each row label + n fuzzy values
          const matrix = Array.from({ length: n }, (_, i) => {
            const r = body[i] ?? [];
            return Array.from({ length: n }, (_, j) => parseFuzzyCell(r[j + 1]));
          });

          resolve({ criteria, matrix });
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}

// 3) linguistic fuzzy
export function importAHPLinguisticMatrixCsv(file) {
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
            return Array.from({ length: n }, (_, j) => parseLinguisticAHPFuzzyCell(r[j+1]));
          });

          resolve({ criteria, matrix });
        } catch (e) { reject(e); }
      },
      error: reject,
    });
  });
}

export function importBWMLinguisticMatrixCsv(file) {
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
            return Array.from({ length: n }, (_, j) => parseLinguisticBWMFuzzyCell(r[j+1]));
          });

          resolve({ criteria, matrix });
        } catch (e) { reject(e); }
      },
      error: reject,
    });
  });
}

// 2. XLSX Parser
// XLSX (first sheet) → {criteria, matrix} (assumes same layout as CSV)

// 1) AHP origin, BWM (non)linear
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

// 2) fuzzy
export async function importFuzzyMatrixXlsx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('No sheet found.');
  const ws = wb.Sheets[sheetName];

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
    return Array.from({ length: n }, (_, j) => parseFuzzyCell(r[j + 1]));
  });

  return { criteria, matrix };
}

// 3) linguistic fuzzy
export async function importAHPLinguisticMatrixXlsx(file) {
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
    return Array.from({ length: n }, (_, j) => parseLinguisticAHPFuzzyCell(r[j + 1]));
  });

  return { criteria, matrix };
}

export async function importBWMLinguisticMatrixXlsx(file) {
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
    return Array.from({ length: n }, (_, j) => parseLinguisticBWMFuzzyCell(r[j + 1]));
  });

  return { criteria, matrix };
}

// 3. file dispatch
// Auto-dispatch by file extension to CSV/XLSX parser 

// 1) AHP origin, BWM (non)linear
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
// 2) fuzzy
export async function importFuzzyMatrixFile(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.csv')) return importFuzzyMatrixCsv(file);
  if (name.endsWith('.xlsx')) return importFuzzyMatrixXlsx(file);

  const type = file?.type || '';
  if (type.includes('csv')) return importFuzzyMatrixCsv(file);
  if (type.includes('sheet') || type.includes('excel')) return importFuzzyMatrixXlsx(file);

  throw new Error('Unsupported file type. Please upload .csv or .xlsx');
}
// 3) linguistic fuzzy
export async function importAHPLinguisticMatrixFile(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.csv')) return importAHPLinguisticMatrixCsv(file); 
  if (name.endsWith('.xlsx')) return importAHPLinguisticMatrixXlsx(file);

  // Fallback by MIME type (some browsers report only MIME)
  const type = file?.type || '';
  if (type.includes('csv')) return importAHPLinguisticMatrixCsv(file);
  if (type.includes('sheet') || type.includes('excel')) return importAHPLinguisticMatrixXlsx(file);
  
  throw new Error('Unsupported file type. Please upload .csv or .xlsx');
}

export async function importBWMLinguisticMatrixFile(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.csv')) return importBWMLinguisticMatrixCsv(file);
  if (name.endsWith('.xlsx')) return importBWMLinguisticMatrixXlsx(file);

  // Fallback by MIME type (some browsers report only MIME)
  const type = file?.type || '';
  if (type.includes('csv')) return importBWMLinguisticMatrixCsv(file);
  if (type.includes('sheet') || type.includes('excel')) return importBWMLinguisticMatrixXlsx(file);
  
  throw new Error('Unsupported file type. Please upload .csv or .xlsx');
}

