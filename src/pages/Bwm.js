import React, { useState } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, Select, theme, Upload, message, Modal } from 'antd';
import BwmInput from '../components/BwmInput';
import BwmMatrix from '../components/BwmMatrix';
import Results from '../components/Results';
import { BwmWeights } from '../api/fetchWeights';
import { importMatrixFile } from '../utils/matrixImport';
import { validateBWM } from '../utils/validators';
import { UploadOutlined } from '@ant-design/icons';


const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function Bwm({variant}) {
  // State management
  const [stage, setStage] = useState("number"); // number | text | null | edit
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [tempCriteria, setTempCriteria] = useState([]); // temp criteria
  const [matrix, setMatrix] = useState([]);
  
  // Result state
  const [crisp_weights, setWeights] = useState([]);
  const [lower_weights, setLWeights] = useState([]);
  const [upper_weights, setUWeights] = useState([]);
  const [sorted_criteria, setSortedCriteria] = useState([]);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);
  const [best, setBest] = useState(null); 
  const [worst, setWorst] = useState(null);

  const { token } = theme.useToken();

  /**
   * Import AHP matrix from CSV/XLSX file
   * Validates the imported data before applying
   * @param {File} file - The uploaded file
   * @returns {boolean} - Returns false to prevent default upload behavior
   */
    const handleImport = async (file) => {
    try {
        const { criteria: c, matrix: M } = await importMatrixFile(file);
        const res = validateBWM(c, M);
        if (!res.ok) {
        Modal.error({
            title: 'Invalid BWM matrix',
            content: <div>{res.errors.map((e,i)=><div key={i}>• {e}</div>)}</div>,
            width: 560,
        });
        return false;
        }

        // Auto-detect best and worst criteria from matrix
        let detectedBest = null;
        let detectedWorst = null;

        // Find best: row with all non-zero values (except diagonal)
        for (let i = 0; i < M.length; i++) {
        const hasAllNonZero = M[i].every((val, j) => i === j || val !== 0);
        if (hasAllNonZero) {
            detectedBest = c[i];
            break;
        }
        }
        
        // Find worst: column with all non-zero values (except diagonal)
        for (let j = 0; j < M[0].length; j++) {
        const hasAllNonZero = M.every((row, i) => i === j || row[j] !== 0);
        if (hasAllNonZero) {
            detectedWorst = c[j];
            break;
        }
        }

        // Apply validated data
        setCriteria(c);
        setMatrix(M);
        setBest(detectedBest);
        setWorst(detectedWorst);    

        // Value initialization
        setWeights([]);
        setLWeights([]);
        setUWeights([]);
        setSortedCriteria([]);
        setCi(null);
        setCr(null);
        setStage(null);
        message.success('Matrix imported.');
    } catch (e) {
        Modal.error({ title: 'Import error', content: e.message || String(e) });
    }
    return false; 
    };

  /**
   * Manual setting 
   */
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
       variant,
       n: criteria.length, 
       criteria,
       bestIdx: bestIdx,
       worstIdx: worstIdx,
       bestRow: [...matrix[bestIdx]],
       worstCol: matrix.map(row => row[worstIdx]),
    };

    try {
      const { crisp_weights, lower_weights, upper_weights, sorted_criteria, ci, cr } = await BwmWeights(payload);
      setWeights(crisp_weights);
      setLWeights(lower_weights);
      setUWeights(upper_weights);
      setSortedCriteria(sorted_criteria);
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
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
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
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setCi(null);
    setCr(null);
    setStage(null);
  };
  
    return (
        <Layout style={{ minHeight: '100vh' }}>
        <>
        <Sider width={420} style={{ 
            background: token.colorBgContainer, 
            padding: token.paddingLG, 
            borderRight: `1px solid ${token.colorSplit}` 
        }}>
            <Title level={1} style={{ marginTop: 0, marginBottom: 0 }}>
            Trade Off Software
            </Title>
            <Typography.Text type="secondary" style={{ fontSize: 16 }}>
            Method: {variant}_BWM
            </Typography.Text>

            <div style={{ margin: '8px 0 24px' }}>
            {/* Upload CSV file */}
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
              multiple={false}
              maxCount={1}
              accept={[
                'text/csv',
                'application/vnd.ms-excel',                                        // 일부 환경에서 CSV로 표시
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                '.csv',
                '.CSV',
                '.xlsx',
                '.XLSX'
              ].join(',')}
            >
              <Button icon={<UploadOutlined />}>Import BWM CSV/XLSX</Button>
            </Upload>

            <Typography.Link
                href={`${process.env.PUBLIC_URL}/templates/BWM_matrix_template.xlsx`}
                download
                style={{ display: 'inline-block', marginLeft: 10, textDecoration: 'underline' }}
            >
                BWM Matrix Template
            </Typography.Link>
            </div>

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
            <Content style={{ padding: token.paddingLG, background: token.colorBgLayout }}>
            {!!best && !!worst && matrix.length > 0 && (
                <>
                <BwmMatrix
                    matrix={matrix}
                    setMatrix={setMatrix}
                    criteria={criteria}
                    bestIdx={bestIdx}
                    worstIdx={worstIdx}
                />
                {crisp_weights.length > 0 && (
                    <>
                    <Divider />
                    <Results
                        method = "bwm"
                        variant={variant?.toLowerCase?.()} 
                        crisp_weights={crisp_weights}
                        lower_weights={lower_weights}
                        upper_weights={upper_weights}
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