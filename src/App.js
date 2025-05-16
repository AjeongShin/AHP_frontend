import React, { useState } from 'react';
import { Layout, Typography, Button, Divider, Space } from 'antd';
import PairwiseInput from './components/PairwiseInput';
import PairwiseMatrix from './components/PairwiseMatrix';
import Results from './components/Results';
import { fetchWeights } from './api/fetchWeights';

const { Content, Sider } = Layout;
const { Title } = Typography;

function App() {
  const [criteria, setCriteria] = useState(["", "", "", "", ""]);
  // const [comparisons, setComparisons] = useState([]);

  const [matrix, setMatrix] = useState([]);
  const [weights, setWeights] = useState([]);
  const [lambdaMax, setLambdaMax] = useState(null);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);

  // Generate AHP pairwise matrix from comparisons
  const generateMatrixFromComparisons = (activeCriteria, filteredComparisons) => {
    const n = activeCriteria.length;
    const mat = Array.from({ length: n }, () => Array(n).fill(1));

    filteredComparisons.forEach(({ from, to, value, direction }) => {
      const i = activeCriteria.indexOf(from);
      const j = activeCriteria.indexOf(to);
      if (i !== -1 && j !== -1) {
        let val = 1;
        if (direction === `${from} > ${to}`) val = value;
        else if (direction === `${to} > ${from}`) val = 1 / value;
        else val = 1;
        mat[i][j] = val;
        mat[j][i] = 1 / val;
      }
    });

    return mat;
  };

  // Handle 'Calculate' button click
  const handleSubmit = async () => {
    const activeCriteria = criteria.filter(c => c.trim() !== '');
    if (activeCriteria.length < 2) {
      alert('Please enter at least two valid criteria.');
      return;
    }

    try {
      const { weights, lambdaMax, ci, cr } = await fetchWeights(matrix);
      setWeights(weights);
      setLambdaMax(lambdaMax);
      setCi(ci);
      setCr(cr);
    } catch (err) {
      alert(err.message);
    }
  };
  
  // Reset all input and results
  const handleReset = () => {
    setCriteria(["", "", "", "", ""]);
    setMatrix([]);
    setWeights([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={700} style={{ background: '#fff', padding: 24, borderRight: '1px solid #eee' }}>
        <Title level={1} style={{ marginTop: 0, marginBottom: 24 }}>AHP Pairwise Tool</Title>
        <PairwiseInput
            criteria={criteria}
            setCriteria={setCriteria}
            matrix={matrix}
            setMatrix={setMatrix}
        />
        <Space style={{ marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ fontsize: 16, width: 120, fontWeight: 600 }}
          >
            Calculate
          </Button>
          <Button
            onClick={handleReset}
            style={{ fontsize: 16, width: 120, fontWeight: 600 }}
          >
            Reset
          </Button>
        </Space>
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', background: '#fafafa' }}>
          {matrix.length > 0 && weights.length > 0 && (
            <>
              <PairwiseMatrix matrix={matrix} criteria={criteria} />
              <Divider />
              <Results
                weights={weights}
                criteria={criteria}
                lambdaMax={lambdaMax}
                ci={ci}
                cr={cr}
              />
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
