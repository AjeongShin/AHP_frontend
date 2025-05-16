/** 
 * API Call: fetchWeights
 * sends pairwise matrix to the backend and returns AHP results
**/
export const fetchWeights = async (matrix) => {
    const response = await fetch('https://ahp-backend-725147247515.europe-west1.run.app/calculate', {
    method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matrix }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate weights');
    }
  
    return await response.json();
  };
  