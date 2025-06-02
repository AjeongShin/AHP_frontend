import React, { useState } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, Table, Collapse } from 'antd';
import PairwiseInput from './components/PairwiseInput';
import PairwiseMatrix from './components/PairwiseMatrix';
import Results from './components/Results';
import AlternativeInput from './components/AlternativeInput';
import AlternativeMatrix from './components/AlternativeMatrix';
import { fetchWeights } from './api/fetchWeights';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function App() {
  const [stage, setStage] = useState("number"); // number | text | null | edit
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [tempCriteria, setTempCriteria] = useState([]); // temp criteria
  const [matrix, setMatrix] = useState([]); 

  const [weights, setWeights] = useState([]);
  const [lambdaMax, setLambdaMax] = useState(null);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);

  const [step, setStep] = useState("pairwise"); // "pairwise" | "alternatives"
  const [alternativeCount, setAlternativeCount] = useState(0);
  const [alternatives, setAlternatives] = useState([]);
  const [tempAlternatives, setTempAlternatives] = useState([]);
  const [altStage, setAltStage] = useState(null); // "edit", "text-alt", null

  const [altMatrices, setAltMatrices] = useState([]);
  const [altMatrixIndex, setAltMatrixIndex] = useState(0);
  // const [scores, setScores] = useState([]); // [criteriaIndex][alternativeIndex]
  const [altResults, setAltResults] = useState([]); 



  // Step 1: Set number of criteria
  const handleSetCriteriaNumber = () => {
    const count = Math.max(2, Math.min(5, criteriaCount));
    setCriteriaCount(count);
    setCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    setStage("text");
  };

  // Step 2: Confirm criteria names
  const handleConfirmCriteria = () => {
    const count = criteria.length;
    setMatrix(Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => (i === j ? 1 : 1))
    ));
    setStage(null); // move to default stage
  };

  // Calculate weights and consistency metrics
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

  // Reset everything
  const handleReset = () => {
    setStage("number");
    setCriteriaCount(0);
    setCriteria([]);
    setMatrix([]);
    setWeights([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
  };

  // Enter edit mode for criteria
  const handleEdit = () => {
    setTempCriteria([...criteria]);
    setStage("edit");
  };

  // Save changes from edit mode
  const handleSaveEdit = () => {
    const count = tempCriteria.length;
    const newMatrix = Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => {
        if (i === j) return 1;
        return matrix?.[i]?.[j] ?? 1;
      })
    );
    setCriteria([...tempCriteria]);
    setMatrix(newMatrix);
    setWeights([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setStage(null);
  };

  // Calculate final weighted scores for alternatives
  const calculateAlternativeScores = () => {
    const optionScores = alternatives.map((_, optionIndex) => {
      let total = 0;
      for (let critIndex = 0; critIndex < criteria.length; critIndex++) {
        const matrix = altMatrices[critIndex];
        const rowSums = matrix.map(row => row.reduce((a, b) => a + b, 0));
        const totalSum = rowSums.reduce((a, b) => a + b, 0);
        const localWeight = rowSums[optionIndex] / totalSum;
        total += weights[critIndex] * localWeight;
      }
      return { name: alternatives[optionIndex], score: total };
    });
  
    const sorted = optionScores
      .sort((a, b) => b.score - a.score)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  
    setAltResults(sorted);
  };  

  // Step 3: Set number of alternatives
  const handleSetAlternativeNumber = () => {
    const count = Math.max(2, Math.min(5, alternativeCount));
    setAlternativeCount(count);
    setAlternatives(Array.from({ length: count }, (_, i) => `Option ${i + 1}`));
    setStage("text-alt");
  };

  const handleConfirmAlternatives = () => {
    const count = alternatives.length;
    if (count < 2) {
      alert("Please enter at least two alternatives.");
      return;
    }
    setAltMatrices(
      criteria.map(() =>
        Array.from({ length: count }, (_, i) =>
          Array.from({ length: count }, (_, j) => (i === j ? 1 : 1))
        )
      )
    );
    
    setStage(null);  
    setAltStage(null);
  };

  // Edit alternatives
  const handleEditAlternatives = () => {
    setTempAlternatives([...alternatives]);
    setAltStage("edit");
  };
  
  const handleSaveAlternatives = () => {
    setAlternatives([...tempAlternatives]);
    setAltStage(null);
  };
  
  const handleResetAlternatives = () => {
    setAlternativeCount(0);
    setAlternatives([]);
    // setScores([]);
    setAltMatrices([]); 
    setAltResults([]);
    setStage("number-alt");
    setAltStage(null);
  };
  

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {step === "pairwise" && (
      <>
      <Sider width={420} style={{ background: '#fff', padding: 24, borderRight: '1px solid #eee' }}>
        <Title level={1} style={{ marginTop: 0, marginBottom: 24 }}>AHP Pairwise Tool</Title>

        {/* Always show current criteria count */}
        <div style={{ marginBottom: 24 }}>
          <Text strong>Number of Criteria: </Text>
          {stage === "number" ? (
            <Space style={{ marginTop: 8 }}>
              <InputNumber
                min={2}
                max={5}
                value={criteriaCount}
                onChange={setCriteriaCount}
              />
              <Button type="primary" onClick={handleSetCriteriaNumber}>
                Set Criteria
              </Button>
            </Space>
          ) : (
            <Space style={{ marginLeft: 8 }}>
              <Text>{criteria.length}</Text>
            </Space>
          )}
        </div>

        {/* Stage: Text Input */}
        {stage === "text" && (
          <>
            <PairwiseInput
              criteria={criteria}
              setCriteria={setCriteria}
              editable={true}
              allowAddRemove={false}
            />
            <Button
              type="primary"
              style={{ marginTop: 16, width: 160 }}
              onClick={handleConfirmCriteria}
            >
              Confirm
            </Button>
          </>
        )}

        {/* Stage: Normal or Edit */}
        {(stage === null || stage === "edit") && (
          <>
            <PairwiseInput
              criteria={stage === "edit" ? tempCriteria : criteria}
              setCriteria={stage === "edit" ? setTempCriteria : setCriteria}
              editable={stage === "edit" || stage === "text"}
              allowAddRemove={stage === "edit"}
            />
            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={handleSubmit}
                style={{ fontSize: 16, width: 120, fontWeight: 600 }}
              >
                Calculate
              </Button>
              {stage === null ? (
                <Button
                  onClick={handleEdit}  
                  style={{ fontSize: 16, width: 120, fontWeight: 600 }}
                >
                  Edit Criteria
                </Button>
              ) : (
                <Button
                  onClick={handleSaveEdit}
                  style={{ fontSize: 16, width: 120, fontWeight: 600 }}
                >
                  Save
                </Button>
              )}

              <Button
                onClick={handleReset}
                style={{ fontSize: 16, width: 120, fontWeight: 600 }}
              >
                Reset
              </Button>

            </Space>
          </>
        )}
      </Sider>

      <Layout>
        <Content style={{ padding: '24px', background: '#fafafa' }}>
          {criteria.length > 0 && matrix.length > 0 && (
            <>
              <PairwiseMatrix
                matrix={matrix}
                setMatrix={setMatrix}
                criteria={criteria}
              />
              {weights.length > 0 && lambdaMax !== null && (
                <>
                  <Divider />
                  <Results
                    weights={weights}
                    criteria={criteria}
                    lambdaMax={lambdaMax}
                    ci={ci}
                    cr={cr}
                  />
                  <Button
                    type="primary"
                    onClick={() => {setStep("define-alternatives");
                      setStage("number-alt"); 
                    }}
                    style={{ marginTop: 24 }}
                  >
                    Find Alternative Solution
                  </Button>
                </>
              )}
            </>
          )}
        </Content>
      </Layout>
    </>
  )
}

      {step === "define-alternatives" && (
        <Layout>
          <Sider width={420} style={{ background: '#fff', padding: 24 }}>
            <Title level={1}>AHP Pairwise Tool</Title>
            <Title level={3}>Define Alternatives</Title>

            <div style={{ marginBottom: 24 }}>
              <Text strong>Number of Alternatives: </Text>
              {stage === "number-alt" ? (
                <Space style={{ marginTop: 8 }}>
                  <InputNumber
                    min={2}
                    max={5}
                    value={alternativeCount}
                    onChange={setAlternativeCount}
                  />
                  <Button type="primary" onClick={handleSetAlternativeNumber}>
                    Set Alternatives
                  </Button>
                </Space>
              ) : (
                <Text>{alternatives.length}</Text>
              )}
            </div>

              {(stage === "text-alt" || altStage === "edit" || alternatives.length > 0) && (
                <>
                  <AlternativeInput
                    alternatives={altStage === "edit" ? tempAlternatives : alternatives}
                    setAlternatives={altStage === "edit" ? setTempAlternatives : setAlternatives}
                    editable={altStage === "edit" || stage === "text-alt"}
                  />
                  {stage === "text-alt" ? (
                    <Button
                      type="primary"
                      style={{ marginTop: 16, width: 160 }}
                      onClick={handleConfirmAlternatives}
                    >
                      Confirm
                    </Button>
                  ) : altStage === "edit" ? (
                    <Button
                      type="primary"
                      style={{ marginTop: 16, width: 160 }}
                      onClick={handleSaveAlternatives}
                    >
                      Save
                    </Button>
                  ) : (
                    <>
                      <Button
                        style={{ marginTop: 16, width: 160 }}
                        onClick={handleEditAlternatives}
                      >
                        Edit Alternatives
                      </Button>
                      <Button
                        danger
                        style={{ marginTop: 16, width: 160 }}
                        onClick={handleResetAlternatives}
                      >
                        Reset Alternatives
                      </Button>
                      </>
                    )}
                  </>
                )}
              </Sider>

          <Content style={{ padding: 24, background: '#fafafa' }}>
            {/* {alternatives.length > 0 && scores.length > 0 && ( */}
            {alternatives.length > 0 && altMatrices.length > 0 && (
              <>
                <Collapse activeKey={String(altMatrixIndex)} accordion>
                {criteria.map((crit, index) => (
                  <Collapse.Panel
                    header={`Alternative Comparison Matrix - ${crit}`}
                    key={String(index)}
                  >
                    <AlternativeMatrix
                      criterion={criteria[altMatrixIndex]}
                      alternatives={alternatives}
                      scores={altMatrices[altMatrixIndex]}
                      setScores={(updated) => {
                        const newMatrices = [...altMatrices];
                        newMatrices[altMatrixIndex] = updated;
                        setAltMatrices(newMatrices);
                      }}
                    />
                    </Collapse.Panel>
                  ))}
                </Collapse>

                <Button
                  type="primary"
                  style={{ marginTop: 24 }}
                  onClick={() => {
                    if (altMatrixIndex < criteria.length - 1) {
                      setAltMatrixIndex(altMatrixIndex + 1);
                    } else {
                      calculateAlternativeScores();
                    }
                  }}
                >
                  {altMatrixIndex < criteria.length - 1 ? 'Next option' : 'Calculate'}
                </Button>
              </>
            )}

                {/* collapse: 이전 것까지 모두 볼 수 있음 */}
                {altMatrixIndex >= criteria.length && (
                  <>
                    <Divider />
                    <Typography.Title level={4}>모든 기준별 대안 비교 보기</Typography.Title>
                    <Collapse accordion>
                      {criteria.map((crit, index) => (
                        <Collapse.Panel header={`Alternative Comparison Matrix - ${crit}`} key={index}>
                          <AlternativeMatrix
                            criterion={crit}
                            alternatives={alternatives}
                            scores={altMatrices[index]}
                            setScores={(updated) => {
                              const newMatrices = [...altMatrices];
                              newMatrices[index] = updated;
                              setAltMatrices(newMatrices);
                            }}
                          />
                        </Collapse.Panel>
                      ))}
                    </Collapse>

                    <Button
                      type="primary"
                      style={{ marginTop: 24 }}
                      onClick={calculateAlternativeScores}
                    >
                      Calculate
                    </Button>
                  </>
                )}

            {altResults.length > 0 && (
              <>
                <Divider />
                <Title level={3}>Alternative Results</Title>
                <Table
                  dataSource={altResults.map((r, i) => ({
                    key: i,
                    name: r.name,
                    score: r.score.toFixed(3),
                    rank: `#${r.rank}`,
                  }))}
                  columns={[
                    {
                      title: 'Alternative',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'Final Score',
                      dataIndex: 'score',
                      key: 'score',
                    },
                    {
                      title: 'Rank',
                      dataIndex: 'rank',
                      key: 'rank',
                    },
                  ]}
                  pagination={false}
                  bordered
                />
              </>
            )}
            </Content>
          </Layout>
      )}
    </Layout>
  );
}

export default App;