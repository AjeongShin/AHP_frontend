import * as XLSX from 'xlsx';

const round3 = (x) =>
  typeof x === 'number' && isFinite(x) ? Math.round(x * 1000) / 1000 : 0;

/**
 * Save weight table as xlsx
 * @param {Object} args
 * @param {'linear'|'nonlinear'|'fuzzy'} args.variant
 * @param {string[]} args.criteria
 * @param {number[]} args.crisp_weights
 * @param {number[]} args.lower_weights
 * @param {number[]} args.upper_weights
 * @param {string} [args.filename]  bwm_weights_{variant}.xlsx
 */
export function exportWeightsXlsx({
  method,
  variant = 'linear',
  criteria = [],
  crisp_weights = [],
  lower_weights = [],
  upper_weights = [],
  filename,
}) {
  let rows;

  if (variant === 'linear') {
    rows = criteria.map((c, i) => ({
      Criterion: c,
      'Weight': round3(crisp_weights[i]),
    }));
  } else {
    rows = criteria.map((c, i) => {
      const lo = round3(lower_weights[i]);
      const up = round3(upper_weights[i]);
      const hasCrisp =
        typeof crisp_weights[i] === 'number' && isFinite(crisp_weights[i]);
      const center = hasCrisp ? round3(crisp_weights[i]) : round3((lo + up) / 2);
      return {
        Criterion: c,
        'Lower Weight': lo,
        'Crisp / Center': center,
        'Upper Weight': up,
      };
    });
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Weights');

  const outName = filename || 
    (method === 'bwm' 
      ? `${method}_weights_${variant}.xlsx`
      : `${method}_weights.xlsx`);

  XLSX.writeFile(wb, outName);
}
