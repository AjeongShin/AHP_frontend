import React, { useState } from 'react';
import { Layout, Typography, Select, Button, Space } from 'antd';
import Header from '../components/header/Header'; 
import { useNavigate } from 'react-router-dom'; 
import Ahp from './Ahp';
import Bwm from './Bwm';
const { Content, Sider } = Layout;
const { Title, Text } = Typography;


function Calculator() {
  const [method, setMethod] = useState(null);
  const navigate = useNavigate(); 

  const handleBackToHome = () => {
    navigate('/'); 
  };

  const handleSetMethod = (value) => {
    setMethod(value);
  }

  // transfer to main page from Ahp/Bwm component
  const handleBackFromMethod = () => {
    setMethod(null);
  }

  // 1. Before selecting a method
  if (!method) {
    return (
      <>
        <Header /> 
        <Layout style={{ minHeight: '100vh'}}>
          <Sider width={420} style={{ background: '#fff', padding: 24, borderRight: '1px solid #eee' }}>
            <Title level={2} style={{ marginTop: 0, marginBottom: 24 }}>
              Trade Off Calculator
            </Title>

            <Space direction="vertical" style={{ width: '100%' }}>              
              <Text strong>Select Method: </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Choose a method"
                onChange={handleSetMethod} 
                options={[
                  { value: "ahp", label: "AHP (Analytic Hierarchy Process)" },
                  { value: "bwm", label: "BWM (Best-Worst Method)" },
                ]}
              />
            </Space>
          </Sider>
        </Layout>
      </>
    );
  }

  // 2. After selecting a method (AHP or BWM loaded)
  return(
    <>
      <Header /> 
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 0 }}>
          {method === 'ahp' && <Ahp onBack={handleBackFromMethod} />}
          {method === 'bwm' && <Bwm onBack={handleBackFromMethod} />}
        </Content>
      </Layout>
    </>
  );
}

export default Calculator;