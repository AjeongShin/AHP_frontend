// 📁 src/api/fetchWeights.js
export const fetchWeights = async (matrix) => {
  // http://127.0.0.1:5000/calculate: dev env
  const response = await fetch('https://ahp-backend-725147247515.europe-west1.run.app/calculate', {
    method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ matrix }),
    });
  
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server error: ${error}`);
    }
  
    const data = await response.json();
    return data; // contains weights, lambdaMax, ci, cr
  };
  