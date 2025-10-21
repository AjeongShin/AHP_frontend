const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8080"
    : "https://ahp-backend-725147247515.europe-west1.run.app";

/** 
 * API Call: AhpWeights
 * sends pairwise matrix to the backend and returns AHP results
**/
export const AhpWeights = async (matrix) => {
    // const response = await fetch('https://ahp-backend-725147247515.europe-west1.run.app/ahp_calculate', {
    const response = await fetch(`${API_BASE}/ahp_calculate`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ matrix }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate AHP weights');
    }
  
    return await response.json();
  };

/** 
 * API Call: BwmWeights
 * sends Bwm matrix to the backend and returns BWM results
**/
export const BwmWeights = async (payload) => {
    // const response = await fetch('https://ahp-backend-725147247515.europe-west1.run.app/bwm_calculate', {
    const response = await fetch(`${API_BASE}/bwm_calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify( payload ),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate BWM weights');
    }
  
    return await response.json();
  };
  