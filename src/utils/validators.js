// result: { ok: boolean, errors: string[] }

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
