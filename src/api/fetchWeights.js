// 📁 src/api/fetchWeights.js
export const fetchWeights = async (matrix) => {
    const response = await fetch('http://127.0.0.1:5000/calculate', {
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
  