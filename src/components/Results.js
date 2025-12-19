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
  const heatmapRef = React.useRef<HTMLDivElement | null>(null); // to capture heapmap

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

  // const handleExportHeatmapPng = async () => {
  //   if (!heatmapRef.current) return;

  //   try {
  //     const scale = 3; // resolution : 2~3 
  //     const canvas = await html2canvas(heatmapRef.current, {
  //       scale,
  //       useCORS: true,
  //       backgroundColor: null, // background color
  //     });

  //     const dataUrl = canvas.toDataURL('image/png');
  //     const a = document.createElement('a');
  //     a.href = dataUrl;
  //     a.download = `heatmap_${method}_${variant || 'default'}.png`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //   } catch (e) {
  //     console.error('Failed to export heatmap as PNG:', e);
  //   }
  // };
  //  Table 3 (input-based CRI threshold): rows=scale(3~9), cols=n_criteria(3~9)
  const CRI_THRESHOLDS = {
      3: {3:0.1667,4:0.1667,5:0.1667,6:0.1667,7:0.1667,8:0.1667,9:0.1667},
      4: {3:0.1121,4:0.1529,5:0.1898,6:0.2206,7:0.2527,8:0.2577,9:0.2683},
      5: {3:0.1354,4:0.1994,5:0.2306,6:0.2546,7:0.2716,8:0.2844,9:0.2960},
      6: {3:0.1330,4:0.1990,5:0.2643,6:0.3044,7:0.3144,8:0.3221,9:0.3262},
      7: {3:0.1294,4:0.2457,5:0.2819,6:0.3029,7:0.3144,8:0.3251,9:0.3403},
      8: {3:0.1309,4:0.2521,5:0.2958,6:0.3154,7:0.3408,8:0.3620,9:0.3657},
      9: {3:0.1359,4:0.2681,5:0.3062,6:0.3337,7:0.3517,8:0.3620,9:0.3662},
  }

  const nCriteria = Array.isArray(criteria) ? criteria.length : 0;
  const maxscale = 9;
  const maxscaleNum = Number(maxscale); // "9" -> 9
  const criThreshold = CRI_THRESHOLDS?.[maxscaleNum]?.[nCriteria];

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,              
          // marginBottom: 16,
        }}
      >
      <Title level={3} style={{ marginTop: 0, marginBottom: 6 }}>
        {title}
      </Title>
      <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
        Export Summary & Weights (.xlsx)
      </Button>
      </div>

      {isAhpNonFuzzy && (
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
        The result is calculate based on the publication: 
        <a href="https://doi.org/10.1016/0270-0255(87)90473-8" target="_blank" rel="noreferrer">
          https://doi.org/10.1016/0270-0255(87)90473-8
        </a>
      </Typography.Text>
      )}
      {isAhpFuzzy && (
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
        The result is calculate based on the publication: 
        <a href="https://doi.org/10.1016/j.fss.2009.10.011" target="_blank" rel="noreferrer">
          https://doi.org/10.1016/j.fss.2009.10.011
        </a>
      </Typography.Text>
      )}
      {isBwmNonFuzzy && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          The BWM {variant} calculation is grounded in the foundational research detailed in the 
          publication available at: 
          <a href="https://doi.org/10.1016/j.omega.2015.12.001" target="_blank" rel="noreferrer">
            https://doi.org/10.1016/j.omega.2015.12.001
          </a>
          {", "}
          <a href="https://doi.org/10.1016/j.omega.2019.102175" target="_blank" rel="noreferrer">
            https://doi.org/10.1016/j.omega.2019.102175
          </a>
        </Typography.Text>
        )}

        {isBwmFuzzy && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          The BWM {variant} calculation is grounded in the foundational research detailed in the 
          publication available at: 
          <a href="https://doi.org/10.1016/j.knosys.2017.01.010" target="_blank" rel="noreferrer">
            https://doi.org/10.1016/j.knosys.2017.01.010
          </a>
        </Typography.Text>
        )}

      <Descriptions
        column={1}
        bordered
        size="small"
        labelStyle={{ width: 220, fontWeight: 600 }}
        style={{ marginBottom: 24 }}
      >
        {isAhpNonFuzzy && (
          <Descriptions.Item label="λ max">
            {lambdaMax?.toFixed(3)}
          </Descriptions.Item>
        )}
        
        {method === 'bwm' && (
          <Descriptions.Item label="Ranking">
            {ranking || 'N/A'}
          </Descriptions.Item>
        )}

        {ci !== null && !isAhpFuzzy && !isBwmNonFuzzy && (
          <Descriptions.Item label="Consistency Index (CI)">
            {typeof ci === 'number' ? formatValue(ci) : 'N/A'}
          </Descriptions.Item>)}

        {ci !== null && isAhpFuzzy && (
          <Descriptions.Item label="normalizing constant (Gamma)">
            {typeof ci === 'number' ? formatValue(ci) : 'N/A'}
          </Descriptions.Item>)}

        {ci !== null && isBwmNonFuzzy && (
          <Descriptions.Item label="Global Input-Based Consistency Ratio">
            {typeof ci === 'number' ? formatValue(ci) : 'N/A'}
          </Descriptions.Item>)}

        {cr !== null && !isAhpFuzzy && !isBwmNonFuzzy && (
          <Descriptions.Item label="Consistency Ratio (CR)">
            {typeof cr === 'number' ? formatValue(cr) : 'N/A'}
          </Descriptions.Item>)}

        {cr !== null && isAhpFuzzy && (
          <Descriptions.Item label="Inconsistency index (NI)">
            {typeof cr === 'number' ? formatValue(cr) : 'N/A'}
          </Descriptions.Item>)}

        {/* {cr !== null && isBwmNonFuzzy && (
          <Descriptions.Item label="CRO (Output-based)">
            {typeof cr === 'number' ? formatValue(cr) : 'N/A'}
          </Descriptions.Item>)} */}

        {/* {ci !== null && isBwmNonFuzzy && nCriteria > 2 && nCriteria < 10 && (
          <Descriptions.Item label="Interpretation">
            {typeof ci === 'number' ? (
              ci > CRI_THRESHOLDS[maxscale][nCriteria] ? (
                <span> Judgment is inconsistent (CR &gt; CRI_THRESHOLDS[maxscale][nCriteria])</span>
              ) : (
                <span> Judgment is consistent (CR &lt; CRI_THRESHOLDS[maxscale][nCriteria])</span>
              )
            ) : 'N/A'}
        </Descriptions.Item>)} */}
        {isBwmNonFuzzy && typeof ci === "number" && nCriteria > 2 && nCriteria < 10 && (
          <Descriptions.Item label="Interpretation">
            {typeof criThreshold !== "number" ? (
              "N/A (no threshold)"
            ) : ci > criThreshold ? (
              <span>Judgment is inconsistent (CRI &gt; {criThreshold})</span>
            ) : (
              <span>Judgment is consistent (CRI ≤ {criThreshold})</span>
            )}
          </Descriptions.Item>
        )}


        {cr !== null && !isAhpFuzzy && !isBwmNonFuzzy &&(  
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
      {/* <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Button icon={<DownloadOutlined />} onClick={handleExportXlsx}>
          Export Summary & Weights (.xlsx)
        </Button>
      </Space> */}

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