import React from 'react';
import { Typography, Card, Descriptions, theme, Table, Space, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, Scatter, ReferenceLine, 
  Tooltip, CartesianGrid, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
// import * as d3 from "d3";
import { exportWeightsXlsx } from '../utils/matrixExport';
import { DownloadOutlined } from '@ant-design/icons';


const { Title } = Typography;
// Draw boxplot
const BoxPlotBar = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload || height < 0) return null;

  const { lower, center, upper } = payload;
  if (upper < lower) return null; // Invalid range
  if (upper === 0) return null; // Avoid division by zero

  const centerX = x + width / 2;
  const boxWidth = Math.min(width * 0.8, 80); // max 80px
  const boxLeft = x + (width - boxWidth) / 2;
  
  // --- Q1/Q3 ---
  // const q1 = center - 0.25 * (upper - lower);
  // const q3 = center + 0.25 * (upper - lower);

  // Calculate relative positions within the bar
  // const range = upper - lower;
  // if (range === 0) return null; // Avoid division by zero
  
  const upperY = y;
  const lowerY = y + height * (1 - lower / upper);
  const centerY = y + height * (1 - center / upper);
  // const q1Y =  y + height * (1 - q1 / upper);
  // const q3Y = y + height * (1 - q3 / upper);

  return (
    <g>
      {/* Whisker (lower→upper) */}
      <line x1={centerX} y1={lowerY} x2={centerX} y2={upperY} stroke="#333" strokeWidth={1.5} />

      {/* Markers */}
      {/* Upper bound line(blue) */}
      <line 
        x1={centerX - 0.3 * boxWidth}
        y1={upperY}
        x2={centerX + 0.3 * boxWidth}
        y2={upperY}
        stroke="#1a53c4ff" 
        strokeWidth={2}
      />
      
      {/* Center marker square(black) */}
      <rect 
        x={centerX - 3.5} 
        y={centerY - 3.5} 
        width={7} 
        height={7} 
        fill="#000"
        strokeWidth={1.5} 
      />
      
      {/* Lower bound line(red) */}
      <line 
        x1={centerX - 0.3 * boxWidth}
        y1={lowerY}
        x2={centerX + 0.3 * boxWidth}
        y2={lowerY}
        stroke="#ff4d4f" 
        strokeWidth={2}
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
  cr,
  inconsistency_ratios = [],
  extra = {},
  matrix=[],
 }) => {
  const { token } = theme.useToken();
  const [vizMode, setVizMode] = React.useState('lollipop');

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
    { title: 'Center', dataIndex: 'center', key: 'center',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
    { title: 'Upper Weight', dataIndex: 'upper', key: 'upper',
      render: (v) => (typeof v === 'number' ? v.toFixed(3) : '0.000') },
  ];
  

  // 3) Prepare data for Individual Inconsistency (lollipop chart)
  const inconsistencyData = [];
  const n = criteria.length;
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {       
      inconsistencyData.push({
        i,
        j,
        pair: `${criteria[i]} vs ${criteria[j]}`,
        value: inconsistency_ratios[i][j],
        declared: matrix[i][j],
      });
    }
  }
  // lollipop
  const ratioData = inconsistencyData.map(d => ({
    pair: d.pair,
    value: d.value,
  }));

  // barchart
  const barData = inconsistencyData.map(d => ({
    pair: d.pair,
    declared: d.declared,
    implied: d.value,
  }));

  // Calculate max value for lollipop chart Y-axis scale
  const maxRatioValue = Math.max(...ratioData.map(d => d.value), 1.5);
  const maxV = Math.round(maxRatioValue * 100) / 100;  
  const tickStep = 0.5;
  const maxTick = Math.ceil(maxRatioValue / tickStep) * tickStep; 

  const yTicks = [];
  for (let t = 0; t <= maxTick + 1e-9; t += tickStep) {
    yTicks.push(Number(t.toFixed(2))); 
  }

    // Lollipop chart shape component
  const LollipopShape = (props) => {
    console.log('value:', props.payload.value);
    console.log('background:', props.background);
    const { x, width, payload, background } = props;
    const value = payload.value;

    const centerX = x + width / 2;

    // Y
    const yZero = background.y + background.height;  
    const totalHeight = background.height;           
    const yScale = (v) => yZero - (v / maxV) * totalHeight;

    // baseline = 1
    const baselineY = yScale(1);
    const valueY = yScale(value);

    return (
      <g>
        <line
          x1={centerX}
          y1={baselineY}
          x2={centerX}
          y2={valueY}
          stroke={token.colorPrimary}
          strokeWidth={2}
        />
        <circle
          cx={centerX}
          cy={valueY}
          r={5}
          fill={token.colorPrimary}
          stroke="#fff"
          strokeWidth={1}
        />
      </g>
    );
  };


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

        {(variant === 'linear' || variant === 'origin') ? (
          <Table
            dataSource={dataLinear.map((d, idx) => ({ key: idx, name: d.name, crisp: d.crisp }))}
            columns={columnsLinear}
            size="small"
            pagination={false}
            tableLayout="fixed"  
            style={{ marginBottom: 24 }}
          />
        ) : (
          <Table
            dataSource={dataInterval.map((d, idx) => ({ key: idx, ...d }))}
            columns={columnsInterval}
            size="small"
            pagination={false}
            tableLayout="fixed"  
            style={{ marginBottom: 24 }}
          />
        )}

      {/* Weights Visualization */}
      <Card>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Weights Visualization</Title>

        {(variant === 'linear' || variant === 'origin') ? (
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
                      const ymin = Math.max(0, minLower * 0.9)
                      return Math.round(ymin * 1000) / 1000; // 10% margin
                    },
                    (dataMax) => {
                      const maxUpper = Math.max(...dataInterval.map(d => d.upper));
                      const ymax = maxUpper * 1.1
                      return Math.round(ymax * 1000) / 1000; // 10% margin
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

      {/* Individual Inconsistency Visualization */}
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
          <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Individual Inconsistency</Title>
          <select
            value={vizMode}
            onChange={(e) => setVizMode(e.target.value)}
            style={{ padding: '2px 6px', borderRadius: 4 }}
          >
            <option value="lollipop">Lollipop</option>
            <option value="bar">Bar</option>
          </select>
        </Space>
      
        <div style={{ width: "100%", overflowX: "auto" }}>
          <div style={{ width: `${ratioData.length * 50}px` }}>  
            
            {/* lollipop */}
            {vizMode === 'lollipop'? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={ratioData}
                layout="horizontal"
                margin={{ top: 20, right: 40, left: 80, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="category" 
                  dataKey="pair" 
                  tick={{ angle: -30, textAnchor: "end", fontSize: 10 }}
                  interval={0} 
                  />
                <YAxis type="number" domain={[0, maxV]} ticks={yTicks}/>
                <ReferenceLine y={1} strokeDasharray="4 4" stroke="#000"/>

                <Tooltip
                  formatter={(v) => [v, "Ratio"]}
                  labelStyle={{ color: "#000" }}
                  itemStyle={{ color: "#000" }}
                />

                {/* Stick and Dot combined */}
                <Bar
                  dataKey="value"
                  shape={<LollipopShape />}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
            ) : (
            // BAR CHART (a_ij vs w_i/w_j)
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={barData} 
                margin={{ top: 20, right: 40, left: 80, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="pair"
                  interval={0}
                  tick={{ angle: -30, textAnchor: "end", fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip labelStyle={{ color: '#000' }} itemStyle={{ color: '#000' }} />
                <Legend 
                  layout="horizontal"
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 8 }}
                  />

                {/* a_ij (yellow) */}
                <Bar dataKey="declared" name="a_ij" fill="#fbc02d" />

                {/* w_i / w_j (blue) */}
                <Bar dataKey="implied" name="w_i / w_j" fill={token.colorPrimary} />
              </BarChart>
            </ResponsiveContainer> 
            )}
          </div>
        </div>
      </Card>

    </div>
  );
};

export default Results;