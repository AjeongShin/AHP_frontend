import * as XLSX from 'xlsx';

const round3 = (x) =>
  typeof x === 'number' && isFinite(x) ? Math.round(x * 1000) / 1000 : 0;

const round3NonNeg = (x) => {
  if (typeof x !== 'number' || !isFinite(x)) return null;
  const eps = 1e-12;
  const v = Math.abs(x) < eps ? 0 : x;
  return Math.max(0, Math.round(v * 1000) / 1000);
};

/**
 * Save weight table as xlsx
 * @param {Object} args
 * @param {'linear'|'nonlinear'|'fuzzy'} args.variant
 * @param {string[]} args.criteria
 * @param {number[]} args.crisp_weights
 * @param {number[]} args.lower_weights
 * @param {number[]} args.upper_weights
 * @param {number|null} args.lambda_max
 * @param {number|null} args.CI
 * @param {number|null} args.CR
 * @param {string|null} args.interpretation
 * @param {string|null} args.ranking
 * @param {string} [args.filename]  bwm_weights_{variant}.xlsx
 */

export function exportWeightsXlsx({
  method,
  // variant = 'linear',
  variant,
  criteria = [],
  crisp_weights = [],
  lower_weights = [],
  upper_weights = [],
  lambda_max = null,
  CI = null,
  CR = null,
  interpretation = null,
  ranking = null,
  filename = null,
}) {
  let rows;

  const isAhpNonFuzzy = method === 'ahp' && ['origin'].includes(variant);
  const isBwmNonFuzzy = method === 'bwm' && ['linear', 'nonlinear'].includes(variant);
  const isAhpFuzzy = method === 'ahp' && ['fuzzy', 'linguistic fuzzy'].includes(variant);
  const isBwmFuzzy = method === 'bwm' && ['fuzzy', 'linguistic fuzzy'].includes(variant);

  /* **************** */
  /* 1. Summary sheet */
  /* **************** */
  let summaryRows = null;

  if (method === 'ahp') {
    summaryRows = [
      {
        Metric: 'Lambda max',
        Value: lambda_max != null ? round3(lambda_max) : '',
      },
      {
        Metric: 'CI',
        Value: CI != null ? round3NonNeg(CI) : '',
      },
      {
        Metric: 'CR',
        Value: CR != null ? round3NonNeg(CR) : '',
      },
      {
        Metric: 'Interpretation',
        Value: interpretation ?? '',
      },
    ];
  } else if (method === 'bwm' && variant === 'fuzzy') {
      const rankingText = Array.isArray(ranking)
        ? ranking.join(' > ')
        : ranking ?? '';

      summaryRows = [
        {
          Metric: 'Ranking',
          Value: rankingText,
        },
      ];
  } else {
      const rankingText = Array.isArray(ranking)
        ? ranking.join(' > ')
        : ranking ?? '';

      summaryRows = [
        {
          Metric: 'Ranking',
          Value: rankingText,
        },
        {
          Metric: 'CI',
          Value: CI != null ? round3NonNeg(CI) : '',
        },
        {
          Metric: 'CR',
          Value: CR != null ? round3NonNeg(CR) : '',
        },
        {
          Metric: 'Interpretation',
          Value: interpretation ?? '',
        },
      ];
  }
  const wb = XLSX.utils.book_new();

  if (summaryRows) {
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  }

  /* *************** */
  /* 2. Weight sheet */
  /* *************** */

  // 1) weights data preparation
  if (isAhpNonFuzzy) {
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
        'Center': center,
        'Upper Weight': up,
      };
    });
  }

  // 2) Add weight sheet
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Weights');
  

  const outName = filename || `${method}_summary, weights_${variant}.xlsx`;

  XLSX.writeFile(wb, outName);
}
