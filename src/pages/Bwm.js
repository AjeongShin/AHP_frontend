import React, { useState } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, Table, Collapse, Select, Card, Dropdown } from 'antd';
import BwmInput from '../components/BwmInput';
import BwmMatrix from '../components/BwmMatrix';
import Results from '../components/Results';
import { BwmWeights } from '../api/fetchWeights';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function Bwm() {
  const [stage, setStage] = useState("number"); // number | text | null | edit
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [tempCriteria, setTempCriteria] = useState([]); // temp criteria
  const [matrix, setMatrix] = useState([]); 
  const [weights, setWeights] = useState([]);
  const [sorted_criteria, setSortedCriteria] = useState([]);
  const [lambdaMax, setLambdaMax] = useState(null);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);

  const [best, setBest] = useState(null); 
  const [worst, setWorst] = useState(null);


  // Step 1: Set number of criteria
  const handleSetCriteriaNumber = () => {
    const count = Math.max(2, Math.min(5, criteriaCount));
    setCriteriaCount(count);
    setCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    setStage("text");
  };

  const worstIdx = worst ? criteria.indexOf(worst) : -1;
  const bestIdx = best ? criteria.indexOf(best) : -1;

  // Step 2: Confirm criteria names
  const handleConfirmCriteria = () => {
    const count = criteria.length;
    setMatrix(Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => (i === j ? 1 : 1))
    ));
    setStage(null); // move to default stage
  };

  // Step 3: extract calculated vector from the matrix
  const handleSubmit = async () => {
    const activeCriteria = criteria.filter(c => c.trim() !== '');
    if (activeCriteria.length < 2) {
      alert('Please enter at least two valid criteria.');
      return;
    }

    if (bestIdx == null || bestIdx < 0 || worstIdx == null || worstIdx < 0) {
        alert('Select Best and Worst criteria first.');
        return;
    }

    const payload = { 
       n: criteria.length, 
       criteria,
       bestIdx: bestIdx,
       worstIdx: worstIdx,
       bestRow: [...matrix[bestIdx]],
       worstCol: matrix.map(row => row[worstIdx]),
    };

    try {
      const { weights, sorted_criteria, lambdaMax, ci, cr } = await BwmWeights(payload);
      setWeights(weights);
      setSortedCriteria(sorted_criteria);
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
    setBest(null);
    setWorst(null);
    setMatrix([]);
    setWeights([]);
    setSortedCriteria([]);
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
    setBest(null);
    setWorst(null);
    setWeights([]);
    setSortedCriteria([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setStage(null);
  };
  
    return (
        <Layout style={{ minHeight: '100vh' }}>
        <>
        <Sider width={420} style={{ background: '#fff', padding: 24, borderRight: '1px solid #eee' }}>
            <Title level={1} style={{ marginTop: 0, marginBottom: 24 }}>Trade Off Software</Title>
                <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                Method: BWM
                </Typography.Text>

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
                <BwmInput
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
                <BwmInput
                criteria={stage === "edit" ? tempCriteria : criteria}
                setCriteria={stage === "edit" ? setTempCriteria : setCriteria}
                editable={stage === "edit" || stage === "text"}
                allowAddRemove={stage === "edit"}
                />
                <Space style={{ marginTop: 16 }}>
                {stage === null ? (
                    <Button
                    onClick={handleEdit}  
                    style={{ fontSize: 16, width: 180, fontWeight: 600 }}
                    >
                    Edit Criteria
                    </Button>
                ) : (
                    <Button
                    onClick={handleSaveEdit}
                    style={{ fontSize: 16, width: 180, fontWeight: 600 }}
                    >
                    Save
                    </Button>
                )}

                <Button
                    onClick={handleReset}
                    style={{ fontSize: 16, width: 180, fontWeight: 600 }}
                >
                    Reset
                </Button>

                </Space>
            </>
            )}

        {/*Select Best, Worst criterion*/}
        { stage === null && criteria.length > 0 && (
            <div style={{marginTop: 24}}>
                <Text strong>Best Criteria</Text>
                <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                    <Select
                        placeholder = "Best"
                        value={best}
                        onChange={setBest}
                        options={criteria.map(c => ({value:c, label:c}))}
                        style={{ width: '100%' }}
                    />
                 <Text strong>Worst Criteria</Text>
                    <Select
                        placeholder = "Worst"
                        value={worst}
                        onChange={setWorst}
                        options={criteria.filter(c => c!==best).map(c => ({value:c, label:c}))}
                        style={{ width: '100%' }}

                    />
                </Space>
            </div>
        )}

        { stage === null && !!best && !!worst &&  (
        <Space style={{ marginTop: 16 }}>
            <Button
                type="primary"
                onClick={handleSubmit}
                style={{ fontSize: 16, width: 180, fontWeight: 600 }}
            >
                Calculate
            </Button>
        </Space>
        )}
        </Sider>

        <Layout>
            <Content style={{ padding: '24px', background: '#fafafa' }}>
            {!!best && !!worst && matrix.length > 0 && (
                <>
                <BwmMatrix
                    matrix={matrix}
                    setMatrix={setMatrix}
                    criteria={criteria}
                    bestIdx={bestIdx}
                    worstIdx={worstIdx}
                />
                {weights.length > 0 && (
                    <>
                    <Divider />
                    <Results
                        method = "Bwm"
                        weights={weights}
                        criteria={criteria}
                        sorted_criteria={sorted_criteria}
                        ci={ci}
                        cr={cr}
                    />
                    </>
                )}
                </>
            )}
            </Content>
        </Layout>
        </>
        </Layout>
    );
}

export default Bwm;