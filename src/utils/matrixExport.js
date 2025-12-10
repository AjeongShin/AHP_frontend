// utils/exportMatrixXlsx.js
import * as XLSX from 'xlsx';

/**
 * Save current pairwise matrix as xlsx
 * @param {Object} args
 * @param {string} args.method        'ahp' | 'bwm'
 * @param {string} args.variant       'origin' | 'linear' | 'nonlinear' | 'fuzzy' | 'linguistic fuzzy'
 * @param {string[]} args.criteria
 * @param {Array<Array<any>>} args.matrix
 * @param {string} [args.filename]
 */
export function exportMatrixXlsx({
  method,
  variant,
  criteria = [],
  matrix = [],
  bestIdx = null,
  worstIdx = null,
  filename = null,
}) {
  if (!Array.isArray(criteria) || !criteria.length) {
    console.warn('exportMatrixXlsx: no criteria');
    return;
  }
  if (!Array.isArray(matrix) || !matrix.length) {
    console.warn('exportMatrixXlsx: no matrix');
    return;
  }

  const AHP_SCALE = [
    { value: 1 / 9, label: '1/9' },
    { value: 1 / 8, label: '1/8' }, 
    { value: 1 / 7, label: '1/7' },
    { value: 1 / 6, label: '1/6' },
    { value: 1 / 5, label: '1/5' },
    { value: 1 / 4, label: '1/4' },
    { value: 1 / 3, label: '1/3' },
    { value: 1 / 2, label: '1/2' },
    { value: 1,     label: '1'   },
    { value: 2,     label: '2'   },
    { value: 3,     label: '3'   },
    { value: 4,     label: '4'   },
    { value: 5,     label: '5'   },
    { value: 6,     label: '6'   },
    { value: 7,     label: '7'   },
    { value: 8,     label: '8'   },
    { value: 9,     label: '9'   },
];

  const formatAhpNumberCell = (cell) => {
    if (typeof cell !== 'number' || !Number.isFinite(cell)) return '';

    // use label if matched
    const match = AHP_SCALE.find(
        (s) => Math.abs(cell - s.value) < 1e-9
    );
    if (match) return match.label;

    // user input number (roung 3)
    return Math.round(cell * 1000) / 1000;
};
  
  const n = criteria.length;

  // 1) matrix data preparation
  // 1st row: ['', c1, c2, c3, ...]
  const rows = [];
  rows.push(['', ...criteria]);

  for (let i = 0; i < n; i++) {
    const row = [criteria[i]];

    for (let j = 0; j < n; j++) {
      const cell = matrix?.[i]?.[j];

      let v = '';
      if (Array.isArray(cell)) {
        // TFN: [l, m, u] → "l , m , u"
        v = cell
          .map((x) =>
            typeof x === 'number' && Number.isFinite(x)
              ? Math.round(x * 1000) / 1000
              : x ?? ''
          )
          .join(' , ');
      } else if (
        typeof cell === 'number' &&
        !Number.isNaN(cell) &&
        Number.isFinite(cell)
      ) {
        // convert to fraction or pass the user input(3 decimal places)
        v = formatAhpNumberCell(cell);
      } else if (cell != null) {
        // linguistic fuzzy (EI, WI...) 
        v = String(cell);
      } else {
        v = '';
      }

    if (method === 'bwm' && i !== bestIdx && j !== worstIdx) {
        v = ''; // blank out non-BWM cells
      }
      row.push(v);
    }
    rows.push(row);
  }

  // 2) create worksheet & workbook
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matrix');

  const outName =
    filename ||
    `${method}_matrix_${(variant).replace(/\s+/g, '_')}.xlsx`;

  XLSX.writeFile(wb, outName);
}
