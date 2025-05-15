// 📁 src/api/fetchPairwiseWeights.js
export const fetchPairwiseWeights = async (matrix) => {
    const response = await fetch('http://127.0.0.1:5000/calculate', {
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
  