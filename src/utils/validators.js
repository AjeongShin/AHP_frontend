// base functions for validators
export function isFiniteFuzzy(f) {
  if (!Array.isArray(f) || f.length !== 3) return false;
  return f.every(v => Number.isFinite(v)); 
}

export function isApproxEqual(a, b, tol = 1e-6) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= tol;
}

export function isApproxEqualFuzzy(a, b, tol = 1e-6) {
  if (!isFiniteFuzzy(a) || !isFiniteFuzzy(b)) return false;
  return (
    isApproxEqual(a[0], b[0], tol) &&
    isApproxEqual(a[1], b[1], tol) &&
    isApproxEqual(a[2], b[2], tol)
  );
}

// AHP input condition checks
export function validateAHP(criteria, M, tol = 1e-6) {
  const n = criteria.length;
  const errors = [];

  if (M.length !== n) errors.push(`Matrix must be ${n}×${n} (rows=${M.length}).`);
  for (let i = 0; i < n; i++) {
    if (!M[i] || M[i].length !== n) errors.push(`Row ${i + 1} must have ${n} entries.`);
  }

  // Condition1: square matrix & diagonal 1
  for (let i = 0; i < n; i++) {
    const v = M[i]?.[i];
    if (!(Math.abs((v ?? NaN) - 1) <= tol)) errors.push(`Diagonal must be 1 at (${i + 1},${i + 1}).`);
  }

  // Condition2: reciprocity
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = M[i][j], b = M[j][i];
      if (!isFinite(a) || !isFinite(b)) {
        errors.push(`Non-numeric at (${i + 1},${j + 1}) or (${j + 1},${i + 1}).`);
        continue;
      }
      if (Math.abs(a * b - 1) > 1e-6) {
        errors.push(`Reciprocity violated: a[${i + 1},${j + 1}] * a[${j + 1},${i + 1}] = ${(a * b).toFixed(6)}.`);
      }
    }
  }

  return { ok: errors.length === 0, errors }; // result: { ok: boolean, errors: string[] }
}

export function validateFuzzyAHP(criteria, M, tol = 1e-6) {
  const n = criteria.length;
  const errors = [];

  if (M.length !== n) errors.push(`Matrix must be ${n}×${n} (rows=${M.length}).`);
  for (let i = 0; i < n; i++) {
    if (!M[i] || M[i].length !== n)
      errors.push(`Row ${i + 1} must have ${n} entries.`);
  }

  // Condition1: square matrix & diagonal (1,1,1) 
  for (let i = 0; i < n; i++) {
    const v = M[i]?.[i];
    if (!isFiniteFuzzy(v)) {
      errors.push(`Invalid fuzzy number at diagonal (${i + 1},${i + 1}).`);
      continue;
    }

    const [l, m, u] = v
    if (
      !isApproxEqual(l, 1, tol) ||
      !isApproxEqual(m, 1, tol) ||
      !isApproxEqual(u, 1, tol)
    ) {
      errors.push(`Diagonal must be (1,1,1) at (${i + 1},${i + 1}).`);
    }
  }

  // Condition2: reciprocity
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = M[i]?.[j];
      const b = M[j]?.[i];

      if (!isFiniteFuzzy(a) || !isFiniteFuzzy(b)) {
        errors.push(`Non-numeric fuzzy value at (${i + 1},${j + 1}) or (${j + 1},${i + 1}).`);
        continue;
      }

      const [al, am, au] = a;
      const [bl, bm, bu] = b;

      if (!(al <= am && am <= au)) {
        errors.push(`Fuzzy triple must satisfy l ≤ m ≤ u at (${i + 1},${j + 1}).`);
      }
      if (!(bl <= bm && bm <= bu)) {
        errors.push(`Fuzzy triple must satisfy l ≤ m ≤ u at (${j + 1},${i + 1}).`);
      }

      const prod1 = al * bu;
      const prod2 = am * bm;
      const prod3 = au * bl;
      if (
        !isApproxEqual(prod1, 1, tol) ||
        !isApproxEqual(prod2, 1, tol) ||
        !isApproxEqual(prod3, 1, tol)
      ) {
        errors.push(
          `Reciprocity violated (fuzzy): a[${i + 1},${j + 1}] and a[${j + 1},${i + 1}] (lu'=${prod1.toFixed(
            6
          )}, mm'=${prod2.toFixed(6)}, ul'=${prod3.toFixed(6)}).`
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

const LINGUISTIC_RECIPROCAL = {
  EI: 'EI',
  WMI: 'WLI',
  WLI: 'WMI',
  FMI: 'FLI',
  FLI: 'FMI',
  VMI: 'VLI',
  VLI: 'VMI',
  AMI: 'ALI',
  ALI: 'AMI',
};

export function validateLinguisticFuzzyAHP(criteria, M, tol = 1e-6) {  
  const n = criteria.length;
  const errors = [];

  if (M.length !== n) errors.push(`Matrix must be ${n}×${n} (rows=${M.length}).`);
  for (let i = 0; i < n; i++) {
    if (!M[i] || M[i].length !== n) {
      errors.push(`Row ${i + 1} must have ${n} entries.`);
    }
  }

  // Condition1: square matrix & diagonal (1,1,1) 
  for (let i = 0; i < n; i++) {
    const v = M[i]?.[i];
    if (v !== 'EI') {
      errors.push(`Diagonal must be EI at (${i + 1},${i + 1}).`);
    }
  }

  // Condition2: reciprocity
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = M[i]?.[j];
      const b = M[j]?.[i];

      if (!a || !b) {
        errors.push(
          `Missing linguistic value at (${i + 1},${j + 1}) or (${j + 1},${i + 1}).`
        );
        continue;
      }

      if (!(a in LINGUISTIC_RECIPROCAL)) {
        errors.push(`Unknown linguistic term "${a}" at (${i + 1},${j + 1}).`);
        continue;
      }
      if (!(b in LINGUISTIC_RECIPROCAL)) {
        errors.push(`Unknown linguistic term "${b}" at (${j + 1},${i + 1}).`);
        continue;
      }

      const expectedB = LINGUISTIC_RECIPROCAL[a];
      if (b !== expectedB) {
        errors.push(
          `Reciprocity violated between (${i + 1},${j + 1})=${a} and `
          + `(${j + 1},${i + 1})=${b}. Expected "${expectedB}".`
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// BWM input condition checks 
export function validateBWM(criteria, M, tol = 1e-6) {
  const n = criteria.length;
  const errors = [];

  if (M.length !== n) errors.push(`Matrix must be ${n}×${n}.`);
  for (let i = 0; i < n; i++) {
    if (!M[i] || M[i].length !== n) errors.push(`Row ${i + 1} must have ${n} entries.`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateFuzzyBWM(criteria, M, tol = 1e-6) {
  console.log('validateFuzzyBWM CALLED'); 
  const n = criteria.length;
  const errors = [];

  if (!Array.isArray(M) || M.length !== n) {
    errors.push(`Matrix must be ${n}×${n}.`);
    return { ok: false, errors };
  }

  for (let i = 0; i < n; i++) {
    if (!Array.isArray(M[i]) || M[i].length !== n) {
      errors.push(`Row ${i + 1} must have ${n} entries.`);
      continue;
    }

    for (let j = 0; j < n; j++) {
      const v = M[i][j];

      if (i === j) {
        const isTripleOne =
          Array.isArray(v) &&
          v.length === 3 &&
          v.every(x => isApproxEqual(x, 1, tol));

        const isZero = v === 0 || v === '0';
        if (!(isTripleOne || isZero)) {
          errors.push(`Diagonal must be [1,1,1] or 0 at (${i + 1},${j + 1}).`);
          console.log(100);
        }
      } else {
        if (
          !(v === 0 ||
            (Array.isArray(v) &&
              v.length === 3 &&
              v.every(Number.isFinite)))
        ) {
          errors.push(`Invalid fuzzy value at (${i + 1},${j + 1}).`);
          console.log(2)
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}


const BWM_LINGUISTIC_RECIPROCAL = {
  EI: 'EI',
  WI: 'WI',
  FI: 'FI',
  VI: 'VI',
  AI: 'AI',
};

export function validateLinguisticFuzzyBWM(criteria, M) {
  const n = criteria.length;
  const errors = [];

  console.log('=== validateLinguisticFuzzyBWM CALLED ===');
  console.log('criteria:', criteria);
  console.log('matrix M:', JSON.stringify(M, null, 2));

  if (!Array.isArray(M) || M.length !== n) {
    errors.push(`Matrix must be ${n}×${n}.`);
    return { ok: false, errors };
  }

  for (let i = 0; i < n; i++) {
    if (!Array.isArray(M[i]) || M[i].length !== n) {
      errors.push(`Row ${i + 1} must have ${n} entries.`);
      continue;
    }

    for (let j = 0; j < n; j++) {
      const v = M[i][j];

      if (i === j) {
        console.log('diag value', i, j, '=>', v, 'typeof:', typeof v);

        const isEI = v === 'EI';
        const isZero = v === 0 || v === '0';

        if (!(isEI || isZero)) {
          console.log('❌ Diagonal fails:', i, j, 'value =', v, 'typeof', typeof v);
          errors.push(`Diagonal must be EI or 0 at (${i + 1},${j + 1}).`);
          console.log(v)
          console.log(1);
        }
      } else {
        if (v === null ) {
          errors.push(`Missing value at (${i + 1},${j + 1}).`);
          continue;
        }
        if (v === undefined) {
          errors.push(`Missing value at (${i + 1},${j + 1}).`);
          continue;
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

