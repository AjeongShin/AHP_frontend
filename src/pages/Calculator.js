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

const BWM_VARIANTS = {
  LINEAR: 'linear',
  NONLINEAR: 'nonlinear',
  FUZZY: 'fuzzy'
};

function Calculator() {
  const { token } = theme.useToken();
  const navigate = useNavigate(); 
  const location = useLocation();

  const [method, setMethod] = useState(null);
  const [bwmVariant, setBwmVariant] = useState(null);

  useEffect(() => {
    if (location.state?.reset) {
      setMethod(null);
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
    setBwmVariant(null);
  }

  // Dropdown menu configuration
  const dropdownItems = [
    { 
      key: METHODS.AHP, 
      label: "AHP (Analytic Hierarchy Process)" 
    },
    {
      key: METHODS.BWM,
      label: "BWM (Best-Worst Method)",
      children: [
        { key: `${METHODS.BWM}-${BWM_VARIANTS.LINEAR}`, label: "Linear BWM" },
        { key: `${METHODS.BWM}-${BWM_VARIANTS.NONLINEAR}`, label: "Non-linear (Ratio) BWM" },
        { key: `${METHODS.BWM}-${BWM_VARIANTS.FUZZY}`, label: "Fuzzy BWM" },
      ],
    },
  ];

/**
 * Handle method selection from dropdown menu
 * Supports both AHP and BWM variants
 * @param {Object} menuInfo - Ant Design menu click event
 */
  const onMenuClick = ({ key }) => {
    if (key === METHODS.AHP) {
      setMethod(METHODS.AHP);
      setBwmVariant(null);
      return;
    }
    
    // Handle BWM variant selection (key format: "bwm-linear", "bwm-nonlinear", etc.)
    if (key.startsWith(`${METHODS.BWM}-`)) {
      setMethod(METHODS.BWM);
      const variant = key.replace(`${METHODS.BWM}-`, '');
      setBwmVariant(variant);
    }
  };

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
                      ? "AHP"
                      : `BWM / ${bwmVariant}`
                    : "Choose a method"} <DownOutlined />
                </Button>
              </Dropdown>

              {method && (
                <Text type="secondary">
                  Selected: {method === "ahp" ? "AHP" : `BWM / ${bwmVariant}`}
                </Text>
              )}
            </Space>
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
        <Content style={{ padding: 0 }}>
          {method === 'ahp' && <Ahp onBack={handleBackFromMethod} />}
          {method === 'bwm' && <Bwm onBack={handleBackFromMethod} variant={bwmVariant} />}
        </Content>
      </Layout>
    </>
  );
}

export default Calculator;