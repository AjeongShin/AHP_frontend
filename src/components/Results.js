import React from 'react';
import { Typography, Card, Descriptions, theme, Table, Space, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, Line, LineChart, Cell,
  Tooltip, CartesianGrid, ResponsiveContainer, LabelList, Legend,
} from 'recharts';
// import * as d3 from "d3";
import { exportWeightsXlsx } from '../utils/weightExport';
import { DownloadOutlined } from '@ant-design/icons';
import WeightsVisualization from './visualizations/WeightsVisualization';
import NonFuzzyInconsistency from './visualizations/NonFuzzyInconsistency';
import FuzzyInconsistency from './visualizations/FuzzyInconsistency';

const { Title } = Typography;

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
  bestRow,   
  worstCol,
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
    if (typeof val !== 'number' || !isFinite(val)) return 'N/A';
    const eps = 1e-12;            
    let v = Math.abs(val) < eps ? 0 : val;
    return v.toFixed(3);
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

  const buildInterpretationText = (cr) => {
    if (typeof cr !== 'number') return 'N/A';
    return cr > 0.1
      ? 'Judgment is inconsistent (CR > 0.1)'
      : 'Judgment is consistent (CR < 0.1)';
  };

  const interpretationText = buildInterpretationText(cr);

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
  const isAhpFuzzy = method === 'ahp' && ['fuzzy', 'linguistic fuzzy'].includes(variant);
  const isBwmFuzzy = method === 'bwm' && ['fuzzy', 'linguistic fuzzy'].includes(variant);
  
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
      lambda_max: lambdaMax,
      CI: ci,
      CR: cr,
      interpretation: interpretationText,
      ranking: sorted_criteria,
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

      {/* Summary, Weights Export Button */}
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
          Export Summary & Weights (.xlsx)
        </Button>
      </Space>

      {/* Weights Visualization Component */}
      <WeightsVisualization
        variant={variant}
        criteria={criteria}
        crisp_weights={crisp_weights}
        lower_weights={lower_weights}
        upper_weights={upper_weights}
      />

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

      {(isAhpFuzzy || isBwmFuzzy) && (
        <FuzzyInconsistency
          method={method}
          variant={variant}
          criteria={criteria}
          crisp_weights={crisp_weights}
          inconsistency_ratios={inconsistency_ratios}
          matrix={matrix}
          bestIdx={bestIdx}
          worstIdx={worstIdx}
          bestRow={bestRow}
          worstCol={worstCol}
        />
      )}

    </div>
  );
};

export default Results;