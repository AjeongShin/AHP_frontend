import React, { useState } from 'react';
import { Layout, Typography, Button, Divider, Space, InputNumber, theme, Upload, message, Modal } from 'antd';
import PairwiseInput from '../components/PairwiseInput';
import PairwiseMatrix from '../components/PairwiseMatrix';
import Results from '../components/Results';
import { AhpWeights } from '../api/fetchWeights';
import { importMatrixFile } from '../utils/matrixImport';
import { validateAHP } from '../utils/validators';
import { UploadOutlined } from '@ant-design/icons';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

function Ahp() {
  // State management
  const [stage, setStage] = useState("number"); // number | text | null | edit
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [criteria, setCriteria] = useState([]); // confirmed criteria
  const [tempCriteria, setTempCriteria] = useState([]); // temp criteria
  const [matrix, setMatrix] = useState([]); 

  // Result state
  const [weights, setWeights] = useState([]);
  const [lambdaMax, setLambdaMax] = useState(null);
  const [ci, setCi] = useState(null);
  const [cr, setCr] = useState(null);

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
    setCriteria(c);
    setMatrix(M);
    
    // Value initialization
    setWeights([]);
    setLambdaMax(null);
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
      const { weights, lambdaMax, ci, cr } = await AhpWeights(matrix);
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
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={420} style={{ 
        background: token.colorBgContainer, 
        padding: token.paddingLG, 
        borderRight: `1px solid ${token.colorSplit}` 
      }}>
        <Title level={1} style={{ marginTop: 0, marginBottom: 0 }}>
          Trade Off Software
        </Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          Method: AHP
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
        <Content style={{ padding: token.paddingLG, background: token.colorBgLayout }}>
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
                    method="ahp"
                    variant="linear"
                    crisp_weights={weights}
                    lower_weights={[]}  
                    upper_weights={[]}    
                    criteria={criteria}
                    lambdaMax={lambdaMax}
                    ci={ci}
                    cr={cr}
                  />
                </>
              )}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default Ahp;