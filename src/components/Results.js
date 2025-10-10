import React from 'react';
import { Typography, Card, Descriptions } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts';

const { Title } = Typography;

// Shows the AHP results: λmax, CI, CR, and weights chart
// Shows the BWM results: Ranking, CI, CR, and weights chart
const Results = ({ 
  method, 
  weights = [], 
  criteria = [], 
  lambdaMax = null,
  sorted_criteria = [], 
  ci, 
  cr
 }) => {
  // Format weights with labels for chart
  const data = weights.map((w, i) => ({
    name: criteria[i] || `C${i + 1}`, 
    weight: typeof w === 'number' && !isNaN(w) ? Math.round(w * 100) / 100 : 0,
  }));

  // Prevent -0
  const formatValue = (val) => {
    if (Object.is(val, -0) || val === 0) return '0.0000';
    return typeof val === 'number' && !isNaN(val)
      ? val.toFixed(4)
      : 'N/A';
  };

  const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  const title = `${cap(method)} Calculation Summary`;
  const ranking = (sorted_criteria || [])
    .map(g => Array.isArray(g) ? g.join(' = ') : g)
    .join(' >'); 
    
  return (
    <div style={{ marginTop: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 12 }}>
        {title}
      </Title>

      <Descriptions
        column={1}
        bordered
        size="small"
        labelStyle={{ width: 220, fontWeight: 600 }}
        style={{ marginBottom: 24 }}
      >
        {/* <Descriptions.Item label="λ max">{lambdaMax?.toFixed(4)}</Descriptions.Item> */}
        {method === 'Ahp' && (
          <Descriptions.Item label="λ max">
            {lambdaMax?.toFixed(4)}
          </Descriptions.Item>
        )}
        
        {method === 'Bwm' && (
          <Descriptions.Item label="Ranking">
            {ranking || 'N/A'}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Consistency Index (CI)">
          {typeof ci === 'number' ? formatValue(ci) : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Consistency Ratio (CR)">
          {typeof cr === 'number' ? formatValue(cr) : 'N/A'}
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

      <Card>
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