"use client"; 
import React from 'react';
import Layout from '../components/layout/Layout';
import { Typography, Divider, List } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function Home() {

  const methods = [
    'AHP - Analytic Hierarchy Process',
    'BWM - Best-Worst Method',
  ];

  return (
    <Layout>
      <div style={{ padding: '40px 20px' }}>
        
        {/* 1. Welcome Title */}
        <Title level={1} style={{ textAlign: 'center', marginTop: 20, marginBottom: 40, width: '100%' }}>
          Welcome to the Trade Off Calculator
        </Title>
        
        {/* 2. Introduction Paragraph */}
        <Paragraph style={{ marginBottom: 40, fontSize: '16px', lineHeight: 1.7 }}>
          The tool combines AHP’s pairwise comparisons and consistency checks (CI/CR) with BWM’s best/worst criterion selection and comparisons into a single, 
          streamlined workflow. Users can move through criterion definition → comparison input → weight derivation → results review within a consistent, intuitive 
          interface, minimizing complex, time-consuming setup. The core design philosophy is to simplify AHP- and BWM-based trade-off calculations while providing transparent reasoning and reproducible results.
        </Paragraph>
        
        <Divider />
        
        {/* 3. Current Integrated Methods Section */}
        <Title level={2} style={{ textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
          Current Integrated Trade Off Methods
        </Title>

        <List
          dataSource={methods}
          renderItem={(item) => <List.Item style={{ border: 'none', justifyContent: 'center', padding: '4px 0' }}>• {item}</List.Item>}
          style={{ marginBottom: 40 }}
        />

        <Text style={{ display: 'block', marginBottom: 60 }}>
          If you would like to see another Trade off method integrated, please reach out to Dr. He (River) Huang at <a href="mailto:river.huang@psi.ch">river.huang@psi.ch</a>
        </Text>
        
        <Divider />
        
        {/* 4. Reference Section */}
        <Title level={3} style={{ textAlign: 'center', marginTop: 20, marginBottom: 20 }}>
          Reference
        </Title>

        <Paragraph style={{ marginBottom: 10 }}>
          You can access detailed documentation and methodologies used in this tool in <a href="#">our research paper</a>.
        </Paragraph>

      </div>
    </Layout>
  );
}