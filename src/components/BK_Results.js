import React from 'react';
import { Typography, Card, Descriptions, theme, Table, Space, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, Line, LineChart, Cell,
  Tooltip, CartesianGrid, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
// import * as d3 from "d3";
import { exportWeightsXlsx } from '../utils/matrixExport';
import { DownloadOutlined } from '@ant-design/icons';
// import { WeightsVisualization } from './visualizations/WeightsVisualization';
// import { NonFuzzyInconsistency } from './visualizations/NonFuzzyInconsistency';
// import { FuzzyInconsistency } from './visualizations/FuzzyInconsistency';
import WeightsVisualization from './visualizations/WeightsVisualization';
import NonFuzzyInconsistency from './visualizations/NonFuzzyInconsistency';
import FuzzyInconsistency from './visualizations/FuzzyInconsistency';

const { Title } = Typography;
// // Draw boxplot
// const BoxPlotBar = (props) => {
//   const { x, y, width, height, payload } = props;
//   if (!payload || height < 0) return null;

//   const { lower, center, upper } = payload;
//   if (upper < lower) return null; // Invalid range
//   if (upper === 0) return null; // Avoid division by zero

//   const centerX = x + width / 2;
//   const boxWidth = Math.min(width * 0.8, 80); // max 80px
//   const boxLeft = x + (width - boxWidth) / 2;
  
//   const upperY = y;
//   const lowerY = y + height * (1 - lower / upper);
//   const centerY = y + height * (1 - center / upper);

//   return (
//     <g>
//       {/* Whisker (lower→upper) */}
//       <line x1={centerX} y1={lowerY} x2={centerX} y2={upperY} stroke="#333" strokeWidth={1.5} />

//       {/* Markers */}
//       {/* Upper bound line(blue) */}
//       <line 
//         x1={centerX - 0.3 * boxWidth}
//         y1={upperY}
//         x2={centerX + 0.3 * boxWidth}
//         y2={upperY}
//         stroke="#1a53c4ff" 
//         strokeWidth={2}
//       />
      
//       {/* Center marker square(black) */}
//       <rect 
//         x={centerX - 3.5} 
//         y={centerY - 3.5} 
//         width={7} 
//         height={7} 
//         fill="#000"
//         strokeWidth={1.5} 
//       />
      
//       {/* Lower bound line(red) */}
//       <line 
//         x1={centerX - 0.3 * boxWidth}
//         y1={lowerY}
//         x2={centerX + 0.3 * boxWidth}
//         y2={lowerY}
//         stroke="#ff4d4f" 
//         strokeWidth={2}
//       />
//     </g>
//   );
// };

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
  bestIdx,
  worstIdx,
 }) => {
  const { token } = theme.useToken();
  const [vizMode, setVizMode] = React.useState('lollipop');
  const [hoveredPair, setHoveredPair] = React.useState(null); // hovering at slope chart

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
  

  // 3) Prepare data for Individual Inconsistency
  // 3-1) NonFuzzy method 
  const isAhpNonFuzzy = method === 'ahp' && ['origin'].includes(variant);
  const isBwmNonFuzzy = method === 'bwm' && ['linear', 'nonlinear'].includes(variant);
  // const isFuzzy = method === 'bwm' && variant === 'fuzzy';
  // const n = criteria.length; 

  // // const bestIdx = typeof bestIndex === 'number' ? bestIndex : (Array.isArray(bestIndex) ? bestIndex[0] : null);
  // // const worstIdx = typeof worstIndex === 'number' ? worstIndex : (Array.isArray(worstIndex) ? worstIndex[0] : null);

  // let inconsistencyData = [];
  // let ratioData = [];
  // let barData = [];
  // let slopeData = [];
  // let heatmapData = [];
  // let minTick = 0;
  // let maxTick = 0;
  // let yTicks = [];
  // let heatMax = 0;

  // if (isAhpNonFuzzy && Array.isArray(inconsistency_ratios) && inconsistency_ratios.length > 0){
  //   for (let i = 0; i < n; i++) {
  //     for (let j = i; j < n; j++) {       
  //       const w_i = crisp_weights[i];
  //       const w_j = crisp_weights[j];
  //       const implied =
  //         (typeof w_i === 'number' && typeof w_j === 'number' && w_j !== 0)
  //           ? w_i / w_j
  //           : null;

  //       inconsistencyData.push({
  //         i,
  //         j,
  //         pair: `${criteria[i]} vs ${criteria[j]}`,
  //         value: inconsistency_ratios[i][j],
  //         declared: matrix[i][j],
  //         implied, // w_i / w_j
  //       });
  //     }
  //   }
  // }

  // // if (isBwmNonFuzzy && Array.isArray(inconsistency_ratios) && inconsistency_ratios.length > 0) {
  // if (isBwmNonFuzzy && inconsistency_ratios ) {
  //   const bwo = inconsistency_ratios.bwo || []; // best with others
  //   const wwo = inconsistency_ratios.wwo || []; // worst with others

  //   const w_best = crisp_weights[bestIdx];
  //   const w_worst = crisp_weights[worstIdx];

  //   for (let j = 0; j < n; j++) {
  //     const w_j = crisp_weights[j];
  //     const implied =
  //       (typeof w_best === 'number' && typeof w_j === 'number' && w_j !== 0)
  //         ? w_best / w_j
  //         : null;

  //     inconsistencyData.push({
  //       i: bestIdx,
  //       j,
  //       pair: `${criteria[bestIdx]} vs ${criteria[j]}`,
  //       value: bwo[j],
  //       declared: matrix[bestIdx][j],
  //       implied, // w_best / w_j
  //     });
  //   }
    

  //   for (let i = 0; i < n; i++) {
  //     const w_i = crisp_weights[i];
  //     const implied =
  //       (typeof w_i === 'number' && typeof w_worst === 'number' && w_worst !== 0)
  //         ? w_i / w_worst
  //         : null;

  //     inconsistencyData.push({
  //       i,
  //       j: worstIdx,
  //       pair: `${criteria[i]} vs ${criteria[worstIdx]}`,
  //       value: wwo[i],
  //       declared: matrix[i][worstIdx],
  //       implied, // w_i / w_worst
  //     });
  //   }
  // }
  
  // // lollipop
  // ratioData = inconsistencyData.map(d => ({
  //   pair: d.pair,
  //   value: d.value,
  // }));

  // // barchart
  // barData = inconsistencyData.map(d => ({
  //   pair: d.pair,
  //   declared: d.declared,
  //   implied: d.implied,
  // }));

  // // slopegraph
  // const numPairs = (n * (n - 1)) / 2;
  // const colors = Array.from({ length: numPairs }, (_, idx) => {
  //   const hue = (idx * 360) / numPairs;         // 0 ~ 360 distribution
  //   return `hsl(${hue}, 70%, 55%)`;            
  // });
  // const slopeCount = inconsistencyData.length;
  // slopeData = inconsistencyData.map((d, idx) => ({
  //   pair: d.pair,
  //   declared: d.declared,
  //   implied: d.implied,
  //   color: `hsl(${(idx * 360) / slopeCount}, 70%, 55%)`,
  // }));

  // const slopeRawValues = slopeData.flatMap(d => [
  //   d.declared,
  //   d.implied,
  // ]).filter(v => typeof v === 'number' && v > 0);

  // let slopeDomain = ['auto', 'auto'];
  // let slopeTicks = [];

  // if (slopeRawValues.length > 0) {
  //   const minVal = Math.min(...slopeRawValues);
  //   const maxVal = Math.max(...slopeRawValues);


  //   const minExp = 0;  
  //   const maxExp = Math.ceil(Math.log10(maxVal));

  //   // y-axis domain: [10^minExp, 10^maxExp]
  //   slopeDomain = [Math.pow(10, minExp), Math.pow(10, maxExp)];

  //   // create tick: 10^0, 10^1, ... 10^maxExp 
  //   slopeTicks = [];
  //   for (let e = minExp; e <= maxExp; e += 1) {
  //     slopeTicks.push(Math.pow(10, e));
  //   }
  // }

  // // Heatmap data
  // if (isAhpNonFuzzy && Array.isArray(inconsistency_ratios) && inconsistency_ratios.length > 0) {
  //   for (let i = 0; i < n; i++) {
  //     for (let j = 0; j < n; j++) {
  //       const ratio = inconsistency_ratios[i]?.[j];
  //       const diff = (typeof ratio === 'number') ? Math.abs(ratio - 1) : 0;
  //       heatmapData.push({
  //         row: criteria[i],
  //         col: criteria[j],
  //         value: ratio,
  //         diff: diff,
  //       });
  //     }
  //   }  
  //   const diffs = heatmapData.map(d => d.diff);
  //   heatMax = diffs.length > 0 ? Math.max(...diffs) : 0;
  // }

  // if (isBwmNonFuzzy && inconsistency_ratios ) {
  //   for (let j = 0; j < n; j++) {
  //     const ratio = inconsistency_ratios.bwo?.[j];
  //     const diff = (typeof ratio === 'number') ? Math.abs(ratio - 1) : 0;
  //     heatmapData.push({
  //       row: criteria[bestIdx],
  //       col: criteria[j],
  //       value: ratio,
  //       diff: diff,
  //     });
  //   }
    
  //   for (let i = 0; i < n; i++) {
  //     const ratio = inconsistency_ratios.wwo?.[worstIdx];
  //     const diff = (typeof ratio === 'number') ? Math.abs(ratio - 1) : 0;
  //     heatmapData.push({
  //       row: criteria[i],
  //       col: criteria[worstIdx],
  //       value: ratio,
  //       diff: diff,
  //     });
  //   }
  //   const diffs = heatmapData.map(d => d.diff);
  //   heatMax = diffs.length > 0 ? Math.max(...diffs) : 0;
  // }

  // // Color scale for heatmap
  // const getHeatmapColor = (diff) => {
  //   const maxDiff = heatMax || 0;
  //   const raw = maxDiff > 0 ? diff / maxDiff : 0;
  //   const ratio = Math.max(0, Math.min(1, raw));

  //   let r, g, b;

  //   if (ratio <= 0.5) {
  //     // 0 ~ 0.5 : dark green -> yellow
  //     const t = ratio / 0.5; // 0~1
  //     const rStart = 0,   gStart = 128, bStart = 0;   // dark green
  //     const rMid   = 255, gMid   = 255, bMid   = 0;   // yellow

  //     r = Math.round(rStart + (rMid - rStart) * t);
  //     g = Math.round(gStart + (gMid - gStart) * t);
  //     b = Math.round(bStart + (bMid - bStart) * t);
  //   } else {
  //     // 0.5 ~ 1 : yellow -> red
  //     const t = (ratio - 0.5) / 0.5; // 0~1
  //     const rMid = 255, gMid = 255, bMid = 0;   // yellow
  //     const rEnd = 255, gEnd =   0, bEnd = 0;   // red

  //     r = Math.round(rMid + (rEnd - rMid) * t);
  //     g = Math.round(gMid + (gEnd - gMid) * t);
  //     b = Math.round(bMid + (bEnd - bMid) * t);
  //   }

  //   return `rgb(${r}, ${g}, ${b})`;
  // };

  // // Calculate max value for lollipop chart Y-axis scale
  // if (ratioData.length > 0) {
  //   const maxRatioValue = Math.max(...ratioData.map(d => d.value), 1.5);
  //   const minRatioValue = Math.min(...ratioData.map(d => d.value));
  //   // const maxV = Math.round(maxRatioValue * 100) / 100;  
  //   const tickStep = 0.5;
  //   maxTick = Math.ceil(maxRatioValue / tickStep) * tickStep; 
  //   minTick = Math.max(0, Math.floor(minRatioValue * 0.8 / tickStep) * tickStep);

  //   yTicks = [];
  //   for (let t = minTick; t <= maxTick + 1e-9; t += tickStep) {
  //     yTicks.push(Number(t.toFixed(2))); 
  //   }
  // }

  //   // Lollipop chart shape component
  // const LollipopShape = (props) => {
  //   const { x, width, payload, background } = props;

  //   if (!payload || !background) return null;

  //   const value = payload.value;
  //   const centerX = x + width / 2;

  //   // Y
  //   const yButtom = background.y + background.height;  
  //   const totalHeight = background.height;
  //   const yDomainMax = maxTick;                      // use same domain as YAxis
  //   const range = (maxTick - minTick) || 1e-9;           
  //   // const yScale = (v) => yZero - (v / maxV) * totalHeight;
  //   const yScale = (v) => yButtom - ((v - minTick) / range) * totalHeight;

  //   // baseline = 1
  //   const baselineY = yScale(1);
  //   const valueY = yScale(value);

  //   return (
  //     <g>
  //       <line
  //         x1={centerX}
  //         y1={baselineY}
  //         x2={centerX}
  //         y2={valueY}
  //         stroke={token.colorPrimary}
  //         strokeWidth={2}
  //       />
  //       <circle
  //         cx={centerX}
  //         cy={valueY}
  //         r={5}
  //         fill={token.colorPrimary}
  //         stroke="#fff"
  //         strokeWidth={1}
  //       />
  //     </g>
  //   );
  // };

  // Tooltip for Slope chart 
  // const SlopeTooltip = ({ active, payload, label }) => {
  //   if (!active || !payload || !payload.length) return null;

  //   const filtered = hoveredPair
  //     ? payload.filter((p) => p.name === hoveredPair)
  //     : payload;

  //   if (!filtered.length) return null;

  //   const p = filtered[0];

  //   return (
  //     <div
  //       style={{
  //         background: 'white',
  //         border: '1px solid #ccc',
  //         padding: '6px 8px',
  //         fontSize: 11,
  //       }}
  //     >
  //       <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.name}</div>
  //       <div>
  //         {label}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
  //       </div>
  //     </div>
  //   );
  // };


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

  // const chartWidth = Math.max(dataLinear.length * 80, 600);
  // const vizchartWidth = Math.max(ratioData.length * 80, 600);



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

      {/* Weights Visualization Component */}
      <WeightsVisualization
        variant={variant}
        criteria={criteria}
        crisp_weights={crisp_weights}
        lower_weights={lower_weights}
        upper_weights={upper_weights}
      />

      {/* Weights Visualization */}
      {/* <Card>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Weights Visualization</Title>

        {(variant === 'linear' || variant === 'origin') ? (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div style={{ minWidth: chartWidth }}>
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
            </div>
          </div>
      ) : (
        // Box plot for nonlinear/fuzzy BWM
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: chartWidth }}>
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
          </div>
        </div>  
      )}
    </Card> */}


      {/* Export Button */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
          Export Weights (.xlsx)
        </Button>
      </Space>

      {/* Individual Inconsistency Visualization */}
      {(isAhpNonFuzzy || isBwmNonFuzzy) && (
        <NonFuzzyInconsistency
          method={method}
          variant={variant}
          criteria={criteria}
          crisp_weights={crisp_weights}
          inconsistency_ratios={inconsistency_ratios}
          matrix={matrix}
          bestIdx={bestIdx}
          worstIdx={worstIdx}
        />
      )}

      {/* {isFuzzy && (
        <FuzzyInconsistency
          method={method}
          variant={variant}
          criteria={criteria}
          fuzzy_inconsistency_data={inconsistency_ratios}
        />
      )} */}

      {/* Individual Inconsistency Visualization */}
      {/* {(isAhpNonFuzzy || isBwmNonFuzzy) && (
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
            <option value="slope">Slope</option>
            <option value="heatmap">Heatmap</option>
          </select>
        </Space> */}
{/*       
        <div style={{ width: "100%", overflowX: "auto" }}>       
            {vizMode === 'lollipop'&& (
            <div style={{ minWidth: vizchartWidth }}>    
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={ratioData}
                  layout="horizontal"
                  margin={{ top: 20, right: 40, left: 40, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="category" 
                    dataKey="pair" 
                    tick={{ angle: -30, textAnchor: "end", fontSize: 10 }}
                    interval={0} 
                    />
                  <YAxis type="number" domain={[minTick, maxTick]} ticks={yTicks}/>
                  <ReferenceLine y={1} strokeDasharray="4 4" stroke="#000"/>

                  <Tooltip
                    formatter={(v) => [round3(v), "Ratio"]}
                    labelStyle={{ color: "#000" }}
                    itemStyle={{ color: "#000" }}
                  />

                  <Bar
                    dataKey="value"
                    shape={<LollipopShape />}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>   
          )}


          {vizMode === 'bar' && (
          <div style={{ minWidth: vizchartWidth }}>    
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={barData} 
                margin={{ top: 20, right: 40, left: 40, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="pair"
                  interval={0}
                  tick={{ angle: -30, textAnchor: "end", fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  domain={[0, 'auto', 0.5]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(v) => [round3(v), "Ratio"]} 
                  labelStyle={{ color: '#000' }} 
                  itemStyle={{ color: '#000' }} 
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 8 }}
                  />

                <Bar dataKey="declared" name="a_ij" fill="#fbc02d" />

                <Bar dataKey="implied" name="w_i / w_j" fill={token.colorPrimary} />
              </BarChart>
            </ResponsiveContainer> 
          </div>     
          )}

              {vizMode === 'slope' && (
                <ResponsiveContainer width="100%" height={450}>
                  <LineChart
                    margin={{ top: 20, right: 60, left: 60, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="category"
                      dataKey="category"
                      allowDuplicatedCategory={false}
                      domain={['Declared', 'Implied']}
                      ticks={['Declared', 'Implied']}
                    />
                    <YAxis 
                      // scale="log" 
                      // domain={['auto', 'auto']}
                      // label={{ value: 'Ratio (log scale)', angle: -90, position: 'insideLeft' }}
                      scale="log"
                      domain={slopeDomain}
                      ticks={slopeTicks}
                      tickFormatter={(val) => {
                        const exp = Math.round(Math.log10(val));
                        return `10^${exp}`;
                      }}
                      label={{ value: 'Ratio (10^n)', angle: -90, position: 'insideLeft' }}
                    />
                   <Tooltip content={<SlopeTooltip />} />
                    <Legend 
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ paddingLeft: 10 }}
                    />
                    {slopeData.map((item, idx) => {
                      const data = [
                        { category: 'Declared', value: item.declared },
                        { category: 'Implied', value: item.implied },
                      ];
                      return (
                        <Line
                          key={idx}
                          dataKey="value"
                          data={data}
                          name={item.pair}
                          stroke={item.color}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          onMouseEnter={() => setHoveredPair(item.pair)} 
                          onMouseLeave={() => setHoveredPair(null)} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {vizMode === 'heatmap' && (
                <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `120px repeat(${criteria.length}, 1fr)`,
                      gap: '2px',
                      width: '100%'
                    }}>
                      <div></div>
                      {criteria.map((col, i) => (
                        <div key={i} style={{ 
                          fontSize: '12px', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          padding: '8px',
                          wordBreak: 'break-word'
                        }}>
                          {col}
                        </div>
                      ))}
                      
                      {criteria.map((row, i) => (
                        <React.Fragment key={i}>
                          <div style={{ 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '12px',
                            wordBreak: 'break-word'
                          }}>
                            {row}
                          </div>
                          {criteria.map((col, j) => {
                            const cell = heatmapData.find(d => d.row === row && d.col === col);
                            const value = cell?.value;
                            const diffval = cell?.diff;

                            const hasValue =
                              cell && typeof value === 'number' && !Number.isNaN(value);

                            const bgColor = hasValue ? getHeatmapColor(diffval) : '#f0f0f0';
                            const textColor = hasValue ? '#000' : '#aaa';

                            return (
                              <div
                                key={j}
                                style={{
                                  backgroundColor: bgColor,
                                  padding: '12px',
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  border: '1px solid #ddd',
                                  minHeight: '60px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '500',
                                  color: textColor,
                                }}
                              >
                                {hasValue ? value.toFixed(3) : '' }
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    minWidth: '140px'
                  }}>
                    <span style={{ fontWeight: '500' }}>High</span>
                    <div style={{ 
                      width: '24px', 
                      height: '200px', 
                      background: 'linear-gradient(to top, rgb(0,128,0), rgb(255,255,0), rgb(255,0,0))',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }} />
                    <span style={{ fontWeight: '500' }}>Low</span>
                    <div style={{ 
                      marginTop: '8px', 
                      textAlign: 'center',
                      fontSize: '11px',
                      color: '#666'
                    }}>
                      Inconsistency
                    </div>
                  </div>
                </div>
              )}

            </div>
        </Card>
      )} */}
    </div>
  );
};

export default Results;