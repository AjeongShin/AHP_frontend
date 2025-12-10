import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, Select, theme, Upload, message, Modal } from 'antd';
import BwmInput from '../components/BwmInput';
import BwmMatrix from '../components/BwmMatrix';
import L_FuzzyMatrix, { convertMatrixToValues } from '../components/BwmFuzzyMatrix';
import FuzzyMatrix from '../components/BwmFuzzyMatrixTfn';
import Results from '../components/Results';
import { BwmWeights } from '../api/fetchWeights';
import { importMatrixFile, importFuzzyMatrixFile, importBWMLinguisticMatrixFile} from '../utils/matrixImport';
import { validateBWM, validateFuzzyBWM, validateLinguisticFuzzyBWM} from '../utils/validators';
import { UploadOutlined } from '@ant-design/icons';
import { exportMatrixXlsx } from '../utils/matrixExport';
import { DownloadOutlined } from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function Bwm({variant, methodSelector, methodChanged, criteriaCount, criteria, updateCriteria}) {
  // State management
  const [stage, setStage] = useState("number"); // number | text | null | edit
  // const [criteriaCount, setCriteriaCount] = useState(0);
  // const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [localCount, setLocalCount] = useState(criteria.length || criteriaCount || 0);
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
  const [inconsistency_ratios, setInconsistencyRatio] = useState([]);
  const [extra, setExtra] = useState([]);
  const [fileName, setFileName] = useState('');

  const { token } = theme.useToken();

  /**
   * Import BWM matrix from CSV/XLSX file
   * Validates the imported data before applying
   * @param {File} file - The uploaded file
   * @returns {boolean} - Returns false to prevent default upload behavior
   */
    const templateHrefMap = {
      'linear': `${process.env.PUBLIC_URL}/templates/BWM_matrix_template.xlsx`,
      'nonlinear': `${process.env.PUBLIC_URL}/templates/BWM_matrix_template.xlsx`,
      'fuzzy': `${process.env.PUBLIC_URL}/templates/BWM_fuzzy_tfn_template.xlsx`,
      'linguistic fuzzy': `${process.env.PUBLIC_URL}/templates/BWM_linguistic_template.xlsx`,
    };

    const templateHref = templateHrefMap[variant];
    const handleImport = async (file) => {
    try {
        let c, M, res

        if (variant === 'linear' || variant === 'nonlinear'){
          ({ criteria: c, matrix: M } = await importMatrixFile(file));  
          res = validateBWM(c, M);
        }

        if (variant === 'fuzzy'){
          ({ criteria: c, matrix: M } = await importFuzzyMatrixFile(file));  
          res = validateFuzzyBWM(c, M);
        }

        if (variant === 'linguistic fuzzy'){
          ({ criteria: c, matrix: M } = await importBWMLinguisticMatrixFile(file));  
          res = validateLinguisticFuzzyBWM(c, M);
        }

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
          const hasAllNonZero = M[i].every((val, j) => {
            if (i === j) return true; // skip diagonal
            // Handle different types: 0, '0', or any truthy value
            return val !== 0 && val !== '0' && val !== null && val !== undefined;
          });
          if (hasAllNonZero) {
            detectedBest = c[i];
            break;
          }
        }
        
        // Find worst: column with all non-zero values (except diagonal)
        for (let j = 0; j < M[0].length; j++) {
          const hasAllNonZero = M.every((row, i) => {
            if (i === j) return true; // skip diagonal
            return row[j] !== 0 && row[j] !== '0' && row[j] !== null && row[j] !== undefined;
          });
          if (hasAllNonZero) {
            detectedWorst = c[j];
            break;
          }
        }

        // Apply validated data
        // setCriteria(c);
        updateCriteria(c);
        setLocalCount(c.length);
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
    // setCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    setLocalCount(count);
    updateCriteria(Array.from({ length: count }, (_, i) => `Criterion ${i + 1}`));
    setStage("text");
  };

  const worstIdx = worst ? criteria.indexOf(worst) : -1;
  const bestIdx = best ? criteria.indexOf(best) : -1;

  // Step 2: Confirm criteria names
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
    setBest(null);
    setWorst(null);
    setWeights([]);
    setLWeights([]);
    setUWeights([]);
    setSortedCriteria([]);
    setCi(null);
    setCr(null);
    setExtra([]);
  }, [methodChanged, variant]); 

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

    const numericMatrix = convertMatrixToValues(matrix);
    const processedMatrix = variant === 'linguistic fuzzy' ? numericMatrix : matrix; 

    const payload = { 
       variant,
       n: criteria.length, 
       criteria,
       bestIdx: bestIdx,
       worstIdx: worstIdx,
       bestRow: [...processedMatrix[bestIdx]],
       worstCol: processedMatrix.map(row => row[worstIdx]),
    };

    try {
      const { crisp_weights, lower_weights, upper_weights, sorted_criteria, ci, cr, inconsistency_ratios } = await BwmWeights(payload);
      setWeights(crisp_weights);
      setLWeights(lower_weights);
      setUWeights(upper_weights);
      setSortedCriteria(sorted_criteria);
      setCi(ci);
      setCr(cr);
      setInconsistencyRatio(inconsistency_ratios ?? []);
      setExtra(extra);
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
    setCi(null);
    setCr(null);
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
    setCi(null);
    setCr(null);
    setExtra([]);
    setStage(null);
  };
  
  const handleExportXlsx = () => {
    exportMatrixXlsx({
      method: 'bwm',
      variant,
      criteria,
      matrix,
      bestIdx,
      worstIdx,
      filename: fileName || undefined,
    });
  }; 

  const headerExtra = (
    <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
      Export Input Matrix (.xlsx)
    </Button>
  );

  const numericMatrixForViz =
    variant === 'linguistic fuzzy'
      ? convertMatrixToValues(matrix)
      : matrix;

  const bestRowForViz =
    bestIdx >= 0 && Array.isArray(numericMatrixForViz[bestIdx])
      ? [...numericMatrixForViz[bestIdx]]
      : null;

  const worstColForViz =
    worstIdx >= 0 && Array.isArray(numericMatrixForViz)
      ? numericMatrixForViz.map(row => row[worstIdx])
      : null;

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

            <div style={{ margin: '8px 0 10px' }}>
            {/* Upload CSV file */}
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
              multiple={false}
              maxCount={1}
              accept={[
                'text/csv',
                'application/vnd.ms-excel',                                        
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                '.csv',
                '.CSV',
                '.xlsx',
                '.XLSX'
              ].join(',')}
            >
            <Button icon={<UploadOutlined />} style={{ marginTop: 16, marginBottom: 0 }}> Import BWM CSV/XLSX</Button>
            </Upload>

            <Typography.Link
                href={templateHref}
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
                    max={100}
                    // value={criteriaCount}
                    // onChange={setCriteriaCount}
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
                <BwmInput
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
                <BwmInput
                criteria={stage === "edit" ? tempCriteria : criteria}
                // setCriteria={stage === "edit" ? setTempCriteria : setCriteria}
                setCriteria={stage === "edit" ? setTempCriteria : updateCriteria}
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
        </div>

          <div style={{ flex: 1, minWidth: 0, padding: token.paddingLG, background: token.colorBgLayout }}>
            {!!best && !!worst && matrix.length > 0 && (
                <>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                {variant === 'linguistic fuzzy' ? (
                    <L_FuzzyMatrix
                    matrix={matrix}
                    setMatrix={setMatrix}
                    criteria={criteria}
                    bestIdx={bestIdx}
                    worstIdx={worstIdx}
                    extra={headerExtra}
                    />
                ) : variant === 'fuzzy' ? (
                    <FuzzyMatrix
                    matrix={matrix}
                    setMatrix={setMatrix}
                    criteria={criteria}
                    bestIdx={bestIdx}
                    worstIdx={worstIdx}
                    extra={headerExtra}
                    />
                ) : (
                    <BwmMatrix
                        matrix={matrix}
                        setMatrix={setMatrix}
                        criteria={criteria}
                        bestIdx={bestIdx}
                        worstIdx={worstIdx}
                        extra={headerExtra}
                    />
                )}
                </div>

          {/* Input Matrix Export Button */}
          {/* <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
            <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
              Export Input Matrix (.xlsx)
            </Button>
          </Space> */}

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
                        bestIdx={bestIdx}
                        worstIdx={worstIdx}
                        bestRow={bestRowForViz}      
                        worstCol={worstColForViz}
                        sorted_criteria={sorted_criteria}
                        ci={ci}
                        cr={cr}
                        inconsistency_ratios={inconsistency_ratios}
                        matrix={matrix} 
                        extra={extra}
                    />
                    </>
                )}
                </>
            )}
        </div>
      </div>
    );
}

export default Bwm;