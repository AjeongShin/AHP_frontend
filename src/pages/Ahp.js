import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, Select, theme, Upload, message, Modal } from 'antd';
import PairwiseInput from '../components/PairwiseInput';
import PairwiseMatrix from '../components/PairwiseMatrix';
import L_FuzzyMatrix, { convertMatrixToValues } from '../components/AhpFuzzyMatrix';
import FuzzyMatrix from '../components/AhpFuzzyMatrixTfn';
import Results from '../components/Results';
import { AhpWeights } from '../api/fetchWeights';
import { importMatrixFile } from '../utils/matrixImport';
import { validateAHP } from '../utils/validators';
import { UploadOutlined } from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function Ahp({variant, methodSelector, methodChanged, criteriaCount, criteria, updateCriteria}) {
  // State management
  const [stage, setStage] = useState("number"); // number | text | null | edit
  // const [criteriaCount, setCriteriaCount] = useState(0);
  // const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [localCount, setLocalCount] = useState(criteria.length || criteriaCount || 0);
  const [tempCriteria, setTempCriteria] = useState([]); // temp criteria
  const [matrix, setMatrix] = useState([]); 

  // Result state
  const [crisp_weights, setWeights] = useState([]);
  const [lambdaMax, setLambdaMax] = useState(null);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);
  const [inconsistency_ratios, setInconsistencyRatio] = useState([]);

  // Extra state for fuzzy methods
  const [sorted_criteria, setSortedCriteria] = useState([]);
  const [lower_weights, setLWeights] = useState([]);
  const [upper_weights, setUWeights] = useState([]);
  const [best, setBest] = useState(null); 
  const [worst, setWorst] = useState(null);
  const [extra, setExtra] = useState([]);


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
    const res = validateAHP(c, M);
    if (!res.ok) {
      Modal.error({
        title: 'Invalid AHP matrix',
        content: <div>{res.errors.map((e,i)=><div key={i}>• {e}</div>)}</div>,
        width: 560,
      });
      return false;
    }
    // Apply validated data
    // setCriteria(c);
    updateCriteria(c);
    setMatrix(M);
    setLocalCount(c.length);
    
    // Value initialization
    setWeights([]);
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setInconsistencyRatio([]);
    setStage(null);
    setExtra([]);
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
    const count = Math.max(2, Math.min(100, localCount));
    // setCriteriaCount(count);
    setLocalCount(count);
    // setCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    updateCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    setStage("text");
  };

  // Step 2: Confirm criteria names and initialize matrix
  const handleConfirmCriteria = () => {
    const count = criteria.length;
    const diagonalValue = 
      variant === 'linguistic fuzzy' 
        ? 'EI' 
        : variant === 'fuzzy' 
          ? [1, 1, 1] 
          :  1;
    const initialValue = 
      variant === 'linguistic fuzzy' 
        ? 'EI' 
        : variant === 'fuzzy' 
          ? [1, 1, 1] 
          :  1;
    setMatrix(Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => (i === j ? diagonalValue : initialValue))
    ));
    setStage(null); // move to default stage
  };

  useEffect(() => {
    if (!criteria.length) return; // no criteria yet
    handleConfirmCriteria();
    setWeights([]);
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setInconsistencyRatio([]);
    setExtra([]);
  }, [methodChanged, variant]); 

  // Calculate weights and consistency metrics
  const handleSubmit = async () => {
    const activeCriteria = criteria.filter(c => c.trim() !== '');
    if (activeCriteria.length < 2) {
      alert('Please enter at least two valid criteria.');
      return;
    }

    const numericMatrix = convertMatrixToValues(matrix);
    const processedMatrix = variant === 'linguistic fuzzy' ? numericMatrix : matrix; 

    const payload = { 
       variant,
       n: criteria.length, 
       criteria,
       bestIdx: null,
       worstIdx: null,
       matrix: processedMatrix,
    };

    try {
      const { crisp_weights, lower_weights, upper_weights, sorted_criteria, lambdaMax, ci, cr, inconsistency_ratios} = await AhpWeights(payload);
      setWeights(crisp_weights);
      setLWeights(lower_weights ?? []);
      setUWeights(upper_weights ?? []);
      setSortedCriteria(sorted_criteria ?? []);
      setLambdaMax(lambdaMax ?? []);
      setCi(ci);
      setCr(cr);
      setInconsistencyRatio(inconsistency_ratios ?? []);
      setExtra(extra ?? []);
    } catch (err) {
      alert(err.message);
    }
  };

  // Reset everything
  const handleReset = () => {
    setStage("number");
    // setCriteriaCount(0);
    // setCriteria([]);
    updateCriteria([]);
    setLocalCount(0);
    setBest(null);
    setWorst(null);
    setMatrix([]);
    setWeights([]);
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setInconsistencyRatio([]);
    setExtra([]);
  };

  // Enter edit mode for criteria
  const handleEdit = () => {
    setTempCriteria([...criteria]);
    setStage("edit");
  };

  // Save changes from edit mode
  const handleSaveEdit = () => {
    const count = tempCriteria.length;
    const diagonalValue = 
      variant === 'linguistic fuzzy' 
        ? 'EI' 
        : variant === 'fuzzy' 
          ? [1, 1, 1] 
          :  1;
    const defaultValue = 
      variant === 'linguistic fuzzy' 
        ? 'EI' 
        : variant === 'fuzzy' 
          ? [1, 1, 1] 
          :  1;

    const newMatrix = Array.from({ length: count }, (_, i) =>
      Array.from({ length: count }, (_, j) => {
        if (i === j) return diagonalValue;
        return matrix?.[i]?.[j] ?? defaultValue;
      })
    );
    // setCriteria([...tempCriteria]);
    updateCriteria([...tempCriteria]);
    setMatrix(newMatrix);
    setBest(null);
    setWorst(null);
    setWeights([]);
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setLambdaMax(null);
    setCi(null);
    setCr(null);
    setInconsistencyRatio([]);
    setExtra([]);
    setStage(null);
  };
  
  return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: token.colorBgLayout,
        }}
      >
        <div
          style={{
            width: 420,
            background: token.colorBgContainer,
            padding: token.paddingLG,
            borderRight: `1px solid ${token.colorSplit}`,
          }}
        >
        <Title level={1} style={{ marginTop: 0, marginBottom: 0 }}>
          Trade Off Software
        </Title>
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          {methodSelector}
        </div>

        <div style={{ margin: '8px 0 24px' }}>
          {/* Upload CSV file */}
          <Upload
            beforeUpload={handleImport}
            showUploadList={false}
            multiple={false}
            maxCount={1}
            accept={[
              'text/csv',
              'application/vnd.ms-excel',                                        
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              '.csv',
              '.CSV',
              '.xlsx',
              '.XLSX'
            ].join(',')}
          >
            <Button icon={<UploadOutlined />} style={{ marginTop: 16, marginBottom: 0 }}>
              Import AHP CSV/XLSX
            </Button>
          </Upload>

          <Typography.Link
            href={`${process.env.PUBLIC_URL}/templates/AHP_matrix_template.xlsx`}
            download
            style={{ display: 'inline-block', marginLeft: 10, textDecoration: 'underline' }}
          >
            AHP Matrix Template
          </Typography.Link>
        </div>

        {/* Always show current criteria count */}
        <div style={{ marginBottom: 24 }}>
          <Text strong>Number of Criteria: </Text>
          {stage === "number" ? (
            <Space style={{ marginTop: 8 }}>
              <InputNumber
                min={2}
                max={100}
                value={localCount}
                onChange={(value) => setLocalCount(value ?? 0)}
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
              // setCriteria={setCriteria}
              setCriteria={updateCriteria}
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
              // setCriteria={stage === "edit" ? setTempCriteria : setCriteria}
              setCriteria={stage === "edit" ? setTempCriteria : updateCriteria}
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
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: token.paddingLG, background: token.colorBgLayout }}>
          {criteria.length > 0 && matrix.length > 0 && (
            <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
            {variant === 'linguistic fuzzy' ? (
              <L_FuzzyMatrix
                matrix={matrix}
                setMatrix={setMatrix}
                criteria={criteria}
              />
            ) : variant === 'fuzzy' ? (
              <FuzzyMatrix
                matrix={matrix}
                setMatrix={setMatrix}
                criteria={criteria}
              />
            ) : (
              <PairwiseMatrix
                matrix={matrix}
                setMatrix={setMatrix}
                criteria={criteria}
              />
            )}
            </div>

              {crisp_weights.length > 0 && lambdaMax !== null && (
                <>
                  <Divider />
                  <Results
                    method="ahp"
                    variant={variant?.toLowerCase?.()} 
                    crisp_weights={crisp_weights}
                    lower_weights={lower_weights}  
                    upper_weights={upper_weights}    
                    criteria={criteria}
                    lambdaMax={lambdaMax}
                    sorted_criteria={sorted_criteria}
                    ci={ci}
                    cr={cr}
                    inconsistency_ratios={inconsistency_ratios}
                    extra={extra}
                    matrix={matrix}
                  />
                </>
              )}
            </>
          )}
      </div>
    </div>
  );
}

export default Ahp;