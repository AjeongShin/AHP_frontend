// 📁 src/api/fetchPairwiseWeights.js
export const fetchPairwiseWeights = async (matrix) => {
  // http://127.0.0.1:5000/calculate: dev env
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
  