import React from 'react';
import { Typography, Card, Descriptions, theme, Table, Space, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, LabelList,
} from 'recharts';
import { exportWeightsXlsx } from '../utils/matrixExport';
import { DownloadOutlined } from '@ant-design/icons';


const { Title } = Typography;
// Draw boxplot
const BoxPlotBar = (props) => {
  const { x, y, width, height, payload } = props;

  if (!payload || height <= 0) return null;
  
  const { lower, center, upper } = payload;
  if (upper <= lower) return null; // Invalid range

  const centerX = x + width / 2;
  const boxWidth = Math.min(width * 0.8, 80); // max 80px
  const boxLeft = x + (width - boxWidth) / 2;
  
  // --- Q1/Q3 ---
  const q1 = center - 0.25 * (upper - lower);
  const q3 = center + 0.25 * (upper - lower);

  // Calculate relative positions within the bar
  const range = upper - lower;
  if (range === 0) return null; // Avoid division by zero
  
  const upperY = y;
  const lowerY = y + height * (1 - lower / upper);
  const centerY = y + height * (1 - center / upper);
  const q1Y =  y + height * (1 - q1 / upper);
  const q3Y = y + height * (1 - q3 / upper);

  return (
    <g>
      {/* 수염 (lower→Q1, Q3→upper) */}
      <line x1={centerX} y1={lowerY} x2={centerX} y2={q1Y} stroke="#333" strokeWidth={2} />
      <line x1={centerX} y1={q3Y} x2={centerX} y2={upperY} stroke="#333" strokeWidth={2} />

      {/* Box (Q1~Q3) */}
      <rect
        x={boxLeft}
        y={q3Y}
        width={boxWidth}
        height={q1Y - q3Y}
        fill="rgba(24, 144, 255, 0.1)"
        stroke="#000"
        strokeWidth={2}
      />
      
      {/* Center line (crisp weight)*/}
      <line
        x1={boxLeft}
        y1={centerY}
        x2={boxLeft + boxWidth}
        y2={centerY}
        stroke="#000"
        strokeWidth={3}
      />
      
      {/* Markers */}
      {/* Upper bound marker (triangle) */}
      <path 
        d={`M ${centerX} ${upperY - 6} L ${centerX - 5} ${upperY + 2} L ${centerX + 5} ${upperY + 2} Z`} 
        fill="#52c41a" 
        stroke="#000" 
        strokeWidth={1.5} 
      />
      
      {/* Center marker (square) */}
      <rect 
        x={centerX - 5} 
        y={centerY - 5} 
        width={10} 
        height={10} 
        fill="#1890ff" 
        stroke="#000" 
        strokeWidth={2} 
      />
      
      {/* Lower bound marker (circle) */}
      <circle 
        cx={centerX} 
        cy={lowerY} 
        r={5} 
        fill="#ff4d4f" 
        stroke="#000" 
        strokeWidth={1.5} 
      />
    </g>
  );
};

// Shows the AHP results: λmax, CI, CR, and weights chart
// Shows the BWM results: Ranking, CI, CR, and weights chart
const Results = ({ 
  method,
  variant = null,
  crisp_weights = [], 
  lower_weights = [],
  upper_weights = [],
  criteria = [],
  lambdaMax=[], 
  sorted_criteria = [], 
  ci, 
  cr
 }) => {
  const { token } = theme.useToken();

  /**
   * Round number to specified decimal places
   */
  const DECIMAL_PLACES = 3;
  const round3 = (x) => (
    typeof x === 'number' && !isNaN(x) 
      ? Math.round(x * Math.pow(10, DECIMAL_PLACES)) / Math.pow(10, DECIMAL_PLACES)
      : 0
  );

  /**
   * Format value for display with fixed decimal places
   * Handles -0 edge case
   */
  const formatValue = (val) => {
    if (Object.is(val, -0) || val === 0) return '0.000';
    return typeof val === 'number' && !isNaN(val)
      ? val.toFixed(3)
      : 'N/A';
  };

  const cap = (str) => str ? str.toUpperCase() : '';
  const title = `${cap(method)} Calculation Summary`;
  const ranking = (sorted_criteria || [])
    .map(g => {
      if (Array.isArray(g) && g.length > 1) {
        return g.join(' = ');
      }
      return Array.isArray(g) ? g[0] : g;
    })
    .join(' > ');

  // Format weights with labels for chart
  const data = crisp_weights.map((w, i) => ({
    name: criteria[i] || `C${i + 1}`, 
    crisp_weights: typeof w === 'number' && !isNaN(w) ? Math.round(w * 1000) / 1000 : 0,
  }));

  const data_lower = lower_weights.map((w, i) => ({
    name: criteria[i] || `C${i + 1}`, 
    lower_weights: typeof w === 'number' && !isNaN(w) ? Math.round(w * 1000) / 1000 : 0,
  }));

  const data_uppder = upper_weights.map((w, i) => ({
    name: criteria[i] || `C${i + 1}`, 
    upper_weights: typeof w === 'number' && !isNaN(w) ? Math.round(w * 1000) / 1000 : 0,
  }));

  // 1) Prepare data for Linear BWM (crisp weights only)
  const dataLinear = data.map(d => ({
    name: d.name,
    crisp: d.crisp_weights, 
  }));

  const columnsLinear = [
    { title: 'Criterion', dataIndex: 'name', key: 'name' },
    { title: 'Crisp Weight', dataIndex: 'crisp', key: 'crisp',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
  ];

  // 2) Prepare data for Nonlinear/Fuzzy BWM (interval weights)
  const dataInterval = criteria.map((_, i) => {
    const lo = typeof lower_weights[i] === 'number' ? lower_weights[i] : 0;
    const up = typeof upper_weights[i] === 'number' ? upper_weights[i] : 0;

    // Use crisp weight if available, otherwise calculate midpoint
    const hasCrisp = typeof crisp_weights[i] === 'number' && !isNaN(crisp_weights[i]);
    const center = hasCrisp ? crisp_weights[i] : (lo + up) / 2;

    // Calculate error bars for visualization (deviations from center)
    const errBot = Math.max(0, center - lo);
    const errTop = Math.max(0, up - center);

    return {
      name: criteria[i] || `C${i + 1}`,
      lower: round3(lo),
      center: round3(center),
      upper: round3(up),
      err: [errBot, errTop],
    };
  });

  const columnsInterval = [
    { title: 'Criterion', dataIndex: 'name', key: 'name' },
    { title: 'Lower Weight', dataIndex: 'lower', key: 'lower',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
    { title: 'Crisp / Center', dataIndex: 'center', key: 'center',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
    { title: 'Upper Weight', dataIndex: 'upper', key: 'upper',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
  ];
  
  /**
   * Export weights to Excel file
   */
  const handleExportXlsx = () => {
    exportWeightsXlsx({
      method,
      variant,                 
      criteria,
      crisp_weights,
      lower_weights,
      upper_weights,
    });
  };  

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
        {method === 'ahp' && (
          <Descriptions.Item label="λ max">
            {lambdaMax?.toFixed(3)}
          </Descriptions.Item>
        )}
        
        {method === 'bwm' && (
          <Descriptions.Item label="Ranking">
            {ranking || 'N/A'}
          </Descriptions.Item>
        )}

        {ci !== null && (
          <Descriptions.Item label="Consistency Index (CI)">
            {typeof ci === 'number' ? formatValue(ci) : 'N/A'}
          </Descriptions.Item>)}

        {cr !== null && (
          <Descriptions.Item label="Consistency Ratio (CR)">
            {typeof cr === 'number' ? formatValue(cr) : 'N/A'}
          </Descriptions.Item>)}

        {cr !== null && (  
          <Descriptions.Item label="Interpretation">
            {typeof cr === 'number' ? (
              cr > 0.1 ? (
                // <span style={{ color: 'red' }}>Inconsistent ❌ (CR &gt; 0.1)</span>
                <span> Judgment is inconsistent (CR &gt; 0.1)</span>
              ) : (
                // <span style={{ color: 'green' }}>Judgment is consistent ✅ (CR &lt; 0.1)</span>
                <span> Judgment is consistent (CR &lt; 0.1)</span>
              )
            ) : 'N/A'}
        </Descriptions.Item>)}
      </Descriptions>

      {/* Weights Table */}
      <Title level={3} style={{ marginTop: 0, marginBottom: 12 }}>
        {"Weights"}
      </Title>

        {variant === 'linear' ? (
          <Table
            dataSource={dataLinear.map((d, idx) => ({ key: idx, name: d.name, crisp: d.crisp }))}
            columns={columnsLinear}
            size="small"
            pagination={false}
            style={{ marginBottom: 24 }}
          />
        ) : (
          <Table
            dataSource={dataInterval.map((d, idx) => ({ key: idx, ...d }))}
            columns={columnsInterval}
            size="small"
            pagination={false}
            style={{ marginBottom: 24 }}
          />
        )}

      {/* Weights Visualization */}
      <Card>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Weights Visualization</Title>

        {variant === 'linear' ? (
          // Simple bar chart for linear BWM
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dataLinear}
              margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
              barCategoryGap="85%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip labelStyle={{ color: '#000' }} itemStyle={{ color: '#000' }} />
              <Bar dataKey="crisp" fill={token.colorPrimary} isAnimationActive={false}>
                <LabelList
                  dataKey="crisp"
                  position="top"
                  formatter={(val) => (typeof val === 'number' ? Math.round(val * 1000) / 1000 : 0)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          // Box plot for nonlinear/fuzzy BWM
            <ResponsiveContainer width="100%" height={380}>
              <BarChart 
                data={dataInterval} 
                margin={{ top: 30, right: 16, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  domain={[
                    (dataMin) => {
                      const minLower = Math.min(...dataInterval.map(d => d.lower));
                      return Math.max(0, minLower * 0.9); // 10% margin
                    },
                    (dataMax) => {
                      const maxUpper = Math.max(...dataInterval.map(d => d.upper));
                      return maxUpper * 1.1; // 10% margin
                    }
                  ]}
                />
                <Tooltip
                  formatter={(val, key, { payload }) => {
                    if (key === 'upper') {
                      return [
                        `Lower: ${payload.lower.toFixed(3)} | Center: ${payload.center.toFixed(3)} | Upper: ${payload.upper.toFixed(3)}`,
                        'Weights'
                      ];
                    }
                  return [val, key];
                  }}
                  labelStyle={{ color: '#000' }}
                  itemStyle={{ color: '#000' }}
                />
                <Bar 
                  dataKey="upper" 
                  shape={<BoxPlotBar />}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
        )}
      </Card>


      {/* Export Button */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
          Export Weights (.xlsx)
        </Button>
      </Space>
    </div>
  );
};

export default Results;