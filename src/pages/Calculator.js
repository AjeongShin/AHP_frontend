import React, { useState, useEffect } from 'react';
import { Layout, Typography, Space, theme, Dropdown,Button  } from 'antd';
import Header_custom from '../components/header/Header'; 
import { useNavigate, useLocation } from 'react-router-dom'; 
import Ahp from './Ahp';
import Bwm from './Bwm';
import { DownOutlined } from "@ant-design/icons";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

// Method configuration constants
const METHODS = {
  AHP: 'ahp',
  BWM: 'bwm'
};

const AHP_VARIANTS = {
  Origin: 'origin',
  FUZZY: 'fuzzy',
  L_FUZZY: 'linguistic fuzzy'
};

const BWM_VARIANTS = {
  LINEAR: 'linear',
  NONLINEAR: 'nonlinear',
  FUZZY: 'fuzzy',
  L_FUZZY: 'linguistic fuzzy'
};

function Calculator() {
  const { token } = theme.useToken();
  const navigate = useNavigate(); 
  const location = useLocation();

  const [method, setMethod] = useState(null);
  const [methodChanged, setMethodChanged] = useState(false);
  const [bwmVariant, setBwmVariant] = useState(null);
  const [ahpVariant, setAhpVariant] = useState(null);
  const [criteriaCount, setCriteriaCount] = useState(0);
  const [criteria, setCriteria] = useState([]); // confirmed criteria

  useEffect(() => {
    if (location.state?.reset) {
      setMethod(null);
      setAhpVariant(null);
      setBwmVariant(null);
      navigate('/calculator', { replace: true, state: null });
      return;
    }
  }, [location.state, navigate]);

  const handleBackToHome = () => {
    navigate('/'); 
  };

  const handleSetMethod = (value) => {
    setMethod(value);
  }

  // transfer to main page from Ahp/Bwm component
  const handleBackFromMethod = () => {
    setMethod(null);
    setAhpVariant(null);  
    setBwmVariant(null);
  }

  const handleCriteriaChange = (updatedCriteria) => {
    setCriteria(updatedCriteria);
    setCriteriaCount(updatedCriteria.length);
  };

  // Dropdown menu configuration
  const dropdownItems = [
    { 
      key: METHODS.AHP, 
      label: "AHP (Analytic Hierarchy Process)",
      children: [
        { key: `${METHODS.AHP}-${AHP_VARIANTS.Origin}`, label: "AHP" },
        { key: `${METHODS.AHP}-${AHP_VARIANTS.FUZZY}`, label: "Fuzzy AHP" },
        { key: `${METHODS.AHP}-${AHP_VARIANTS.L_FUZZY}`, label: "Linguistic Fuzzy AHP" },
      ], 
    },
    {
      key: METHODS.BWM,
      label: "BWM (Best-Worst Method)",
      children: [
        { key: `${METHODS.BWM}-${BWM_VARIANTS.LINEAR}`, label: "Linear BWM" },
        { key: `${METHODS.BWM}-${BWM_VARIANTS.NONLINEAR}`, label: "Non-linear (Ratio) BWM" },
        { key: `${METHODS.BWM}-${BWM_VARIANTS.FUZZY}`, label: "Fuzzy BWM" },
        { key: `${METHODS.BWM}-${BWM_VARIANTS.L_FUZZY}`, label: "Linguistic Fuzzy BWM" },
      ],
    },
  ];

/**
 * Handle method selection from dropdown menu
 * Supports both AHP and BWM variants
 * @param {Object} menuInfo - Ant Design menu click event
 */
  const onMenuClick = ({ key }) => {
    setMethodChanged(prev => !prev);
    // Handle AHP variant selection
    // if (key === METHODS.AHP) {
    if (key.startsWith(`${METHODS.AHP}-`)) {
      setMethod(METHODS.AHP);
      const variant = key.replace(`${METHODS.AHP}-`, '');
      setAhpVariant(variant);
      return;
    }
    
    // Handle BWM variant selection (key format: "bwm-linear", "bwm-nonlinear", etc.)
    if (key.startsWith(`${METHODS.BWM}-`)) {
      setMethod(METHODS.BWM);
      const variant = key.replace(`${METHODS.BWM}-`, '');
      setBwmVariant(variant);
    }
  };

  const methodSelector = (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Text strong>Select Method:</Text>

      <Dropdown
        trigger={["hover"]}
        placement="bottomLeft"
        menu={{ items: dropdownItems, onClick: onMenuClick }}  
      >
        <Button block>
          {method
            ? method === "ahp"
              ? `AHP / ${ahpVariant}`
              : `BWM / ${bwmVariant}`
            : "Choose a method"} <DownOutlined />
        </Button>
      </Dropdown>


      {/* {method && (
        <Text type="secondary">
          Selected: {method === "ahp" ? `AHP / ${ahpVariant}` : `BWM / ${bwmVariant}`}
        </Text>
      )} */}
    </Space> 
  );

  // 1. Before selecting a method
  if (!method) {
    return (
      <>
        <Header_custom /> 
        <Layout style={{ minHeight: '100vh'}}>
          <Sider width={420} style={{ background: token.colorBgContainer, padding: token.paddingLG, borderRight: `1px solid ${token.colorSplit}` }}>
              <Title level={2} style={{ marginTop: 0, marginBottom: 24 }}>
                Pairwise Comparison Tool
              </Title>

              {methodSelector}
          </Sider>
        </Layout>
      </>
    );
  }

  // 2. After selecting a method (AHP or BWM loaded)
  return(
    <>
      <Header_custom /> 
      <Layout style={{ minHeight: '100vh' }}>
        {/* <Content style={{ padding: 0 }}>
          {method === 'ahp' && <Ahp onBack={handleBackFromMethod} variant={ahpVariant} />}
          {method === 'bwm' && <Bwm onBack={handleBackFromMethod} variant={bwmVariant} />}
        </Content> */}

      <Content style={{ padding: 0 }}>
        {method === 'ahp' && 
          <Ahp 
            onBack={handleBackFromMethod} 
            variant={ahpVariant} 
            methodSelector={methodSelector} 
            methodChanged={methodChanged}
            criteriaCount={criteriaCount}
            criteria={criteria}
            updateCriteria={handleCriteriaChange} />}
        {method === 'bwm' && 
          <Bwm 
            onBack={handleBackFromMethod} 
            variant={bwmVariant} 
            methodSelector={methodSelector} 
            methodChanged={methodChanged}
            criteriaCount={criteriaCount}
            criteria={criteria}
            updateCriteria={handleCriteriaChange}/>}
      </Content> 
      </Layout>
    </>
  );
}

export default Calculator;