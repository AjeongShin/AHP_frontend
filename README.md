# AHP Pairwise Calculator

A lightweight frontend application for computing **AHP (Analytic Hierarchy Process)** pairwise comparisons using the **Eigenvector Method**. It communicates with a Flask-based backend via a simple API.

---

## Features

- Interactive criteria and comparison input
- Automatically generates all valid pairwise combinations
- Computes:
  - Priority Weights (eigenvector)
  - λₘₐₓ (principal eigenvalue)
  - CI (Consistency Index)
  - CR (Consistency Ratio)
- Real-time input handling via `useEffect`
- Handles formatting edge cases (e.g. `-0.0000` → `0.0000`)
- Clean bar chart visualization 

---

## File Responsibilities

| File | Role | Logic | UI |
|------|------|-------|----|
| `App.js` | Central logic controller | API calls, matrix generation, state mgmt | Layout |
| `components/PairwiseInput.js` | Criteria input + comparison scale selector | - | Inputs + Selects |
| `components/PairwiseMatrix.js` | Matrix renderer | - | AHP table UI |
| `components/Results.js` | Results and chart renderer | - (uses precomputed props) | CI/CR and bar chart |
| `api/fetchWeights.js` | API communication | Fetch + error handling | - |

---

## Real-Time Input Flow

```txt
1. User types into criteria input fields
2. useEffect runs on [criteria] change:
   → filters active criteria
   → generates all pairwise combinations using from/to
   → stores them in comparisons[]
3. User selects direction and importance scale
4. On "Calculate":
   → comparisons filtered
   → matrix generated
   → matrix POSTed to backend
5. Backend returns weights, λmax, CI, CR
6. Results and bar chart displayed
```

## Technologies
- React (hooks, functional components)
- Ant Design (UI)
- Recharts (visualization)
- Flask + NumPy (backend)

## Live Deployment
https://ahpfrontend.vercel.app/

## MIT License
