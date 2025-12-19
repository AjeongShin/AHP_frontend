"use client"; 
import React from 'react';
import Layout from '../components/layout/Layout';
import { Typography, Divider, List } from 'antd';

const { Title, Paragraph, Text } = Typography;

export default function Home() {

  const methods = [
    {
      title: "AHP - Analytic Hierarchy Process",
      // children: [
      //   "Linear AHP",
      //   "Triangular Fuzzy AHP",
      //   "Triangular Linguistic Fuzzy AHP",
      // ],
    },
    {
      title: "BWM - Best-Worst Method",
      // children: [
      //   "Linear BWM",
      //   "Non-linear BWM",
      //   "Triangular Fuzzy BWM",
      //   "Triangular Linguistic Fuzzy BWM",
      // ],
    },
  ];
  return (
    <Layout>
      <div style={{ padding: '40px 20px' }}>
        
        {/* 1. Welcome Title */}
        <Title level={1} style={{ textAlign: 'center', marginTop: 20, marginBottom: 40, width: '100%' }}>
          Welcome to the Pairwise Comparison Tool
        </Title>
        
        {/* 2. Introduction Paragraph */}
        <Paragraph style={{ marginBottom: 40, fontSize: '20px', lineHeight: 1.7 }}>
          The tool combines AHP’s pairwise comparisons and consistency checks (CI/CR) with BWM’s best/worst criterion selection and comparisons into a single, 
          streamlined workflow. Users can move through criterion definition → comparison input → weight derivation → results review within a consistent, intuitive 
          interface, minimizing complex, time-consuming setup. The core design philosophy is to simplify AHP- and BWM-based pairwise comparison while providing transparent reasoning and reproducible results.
        </Paragraph>
        
        <Divider />
        
        {/* 3. Current Integrated Methods Section */}
        <Title level={2} style={{ textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
          Current Integrated Pairwise Comparison Methods
        </Title>

        <List
          dataSource={methods}
          // renderItem={(item) => <List.Item style={{ border: 'none', justifyContent: 'center', padding: '4px 0' }}>• {item}</List.Item>}
          renderItem={(m) => (
            <List.Item style={{ border: "none", fontSize: '20px', padding: "4px 0" }}>
              <div style={{ width: "100%",  marginLeft: 80 }}>
                <div style={{ display: "flex" }}>
                  <span style={{ width: 16 }}>•</span>
                  <div style={{ paddingLeft: 8, flex: 1 }}>{m.title}</div>
                </div>

                {Array.isArray(m.children) && m.children.length > 0 && (
                  <div style={{ marginLeft: 32, marginTop: 6 }}>
                    {m.children.map((c, idx) => (
                      <div key={idx} style={{ display: "flex", padding: "2px 0" }}>
                        <span style={{ width: 16 }}>–</span>
                        <div style={{ paddingLeft: 8, flex: 1 }}>{c}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
          style={{ marginBottom: 40 }}
        />

        <Text style={{ display: 'block', fontSize: '20px', marginBottom: 60 }}>
          If you would like to see another method integrated, please reach out to Dr. He (River) Huang at <a href="mailto:river.huang@psi.ch">river.huang@psi.ch</a>
        </Text>
        
        <Divider />
        
        {/* 4. Reference Section */}
        <Title level={2} style={{ textAlign: 'center', marginTop: 20, marginBottom: 20 }}>
          Reference
        </Title>

        <Paragraph style={{ marginBottom: 10, fontSize: '20px' }}>
          You can access detailed documentation and methodologies used in this tool in <a href="#">our research paper</a>.
        </Paragraph>

      </div>
    </Layout>
  );
}