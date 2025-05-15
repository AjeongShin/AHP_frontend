// 📁 src/components/Results.js
import React from 'react';
import { Typography, Card, Descriptions } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const { Title, Paragraph } = Typography;

const Results = ({ weights = [], criteria = [], lambdaMax, ci, cr }) => {
  const data = weights.map((w, i) => ({
    name: criteria[i] || `C${i + 1}`,
    weight: typeof w === 'number' && !isNaN(w) ? Math.round(w * 100) / 100 : 0,
  }));

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 12 }}>
        AHP Calculation Summary
      </Title>

      <Descriptions
        column={1}
        bordered
        size="small"
        labelStyle={{ width: 220, fontWeight: 600 }}
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="λ max">{lambdaMax?.toFixed(4)}</Descriptions.Item>
        <Descriptions.Item label="Consistency Index (CI)">
          {typeof ci === 'number' ? ci.toFixed(4) : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Consistency Ratio (CR)">
          {typeof cr === 'number' ? cr.toFixed(4) : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Interpretation">
          {typeof cr === 'number' ? (
            cr > 0.1 ? (
              <span style={{ color: 'red' }}>Inconsistent ❌ (CR &gt; 0.1)</span>
            ) : (
              <span style={{ color: 'green' }}>Judgment is consistent ✅ (CR &lt; 0.1)</span>
            )
          ) : 'N/A'}
        </Descriptions.Item>
      </Descriptions>

      <Card bordered>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Weights Visualization</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="weight">
              <LabelList
                dataKey="weight"
                position="top"
                formatter={(val) =>
                  typeof val === 'number' ? Math.round(val * 100) / 100 : 0
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Results;