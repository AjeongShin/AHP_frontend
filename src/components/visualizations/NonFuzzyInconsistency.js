import React, { useRef } from 'react';
import { Card, Typography, Space, theme, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, ReferenceLine, LineChart, Line, Legend
} from 'recharts';

const { Title } = Typography;

const NonFuzzyInconsistency = ({ 
  method,
  variant,
  criteria,
  crisp_weights,
  inconsistency_ratios,
  matrix,
  bestIdx,
  worstIdx
}) => {
  const { token } = theme.useToken();
  const [vizMode, setVizMode] = React.useState('lollipop');
  const [hoveredPair, setHoveredPair] = React.useState(null);
  const chartRef = useRef(null);  

  const round3 = (x) => (
    typeof x === 'number' && !isNaN(x) 
      ? Math.round(x * 1000) / 1000 
      : 0
  );

  const isAhpNonFuzzy = method === 'ahp' && variant === 'origin';
  const isBwmNonFuzzy = method === 'bwm' && ['linear', 'nonlinear'].includes(variant);
  const n = criteria.length;

  // Prepare inconsistency data
  let inconsistencyData = [];

  if (isAhpNonFuzzy && Array.isArray(inconsistency_ratios) && inconsistency_ratios.length > 0) {
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const w_i = crisp_weights[i];
        const w_j = crisp_weights[j];
        const implied = (typeof w_i === 'number' && typeof w_j === 'number' && w_j !== 0)
          ? w_i / w_j : null;

        inconsistencyData.push({
          i, j,
          pair: `${criteria[i]} vs ${criteria[j]}`,
          value: inconsistency_ratios[i][j],
          declared: matrix[i][j],
          implied,
        });
      }
    }
  }

  if (isBwmNonFuzzy && inconsistency_ratios) {
    const bwo = inconsistency_ratios.bwo || [];
    const wwo = inconsistency_ratios.wwo || [];
    const w_best = crisp_weights[bestIdx];
    const w_worst = crisp_weights[worstIdx];

    for (let j = 0; j < n; j++) {
      const w_j = crisp_weights[j];
      const implied = (typeof w_best === 'number' && typeof w_j === 'number' && w_j !== 0)
        ? w_best / w_j : null;

      inconsistencyData.push({
        i: bestIdx, j,
        pair: `${criteria[bestIdx]} vs ${criteria[j]}`,
        value: bwo[j],
        declared: matrix[bestIdx][j],
        implied,
      });
    }

    for (let i = 0; i < n; i++) {
      const w_i = crisp_weights[i];
      const implied = (typeof w_i === 'number' && typeof w_worst === 'number' && w_worst !== 0)
        ? w_i / w_worst : null;

      inconsistencyData.push({
        i, j: worstIdx,
        pair: `${criteria[i]} vs ${criteria[worstIdx]}`,
        value: wwo[i],
        declared: matrix[i][worstIdx],
        implied,
      });
    }
  }

  // Prepare chart data
  const ratioData = inconsistencyData.map(d => ({
    pair: d.pair,
    value: d.value,
  }));

  const barData = inconsistencyData.map(d => ({
    pair: d.pair,
    declared: d.declared,
    implied: d.implied,
  }));

  const slopeCount = inconsistencyData.length;
  const slopeData = inconsistencyData.map((d, idx) => ({
    pair: d.pair,
    declared: d.declared,
    implied: d.implied,
    color: `hsl(${(idx * 360) / slopeCount}, 70%, 55%)`,
  }));

  // Heatmap data
  let heatmapData = [];
  let heatMax = 0;

  if (isAhpNonFuzzy && Array.isArray(inconsistency_ratios)) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const ratio = inconsistency_ratios[i]?.[j];
        const diff = typeof ratio === 'number' ? Math.abs(ratio - 1) : 0;
        heatmapData.push({
          row: criteria[i],
          col: criteria[j],
          value: ratio,
          diff,
        });
      }
    }
    const diffs = heatmapData.map(d => d.diff);
    heatMax = diffs.length > 0 ? Math.max(...diffs) : 0;
  }

  if (isBwmNonFuzzy && inconsistency_ratios) {
    for (let j = 0; j < n; j++) {
      const ratio = inconsistency_ratios.bwo?.[j];
      const diff = typeof ratio === 'number' ? Math.abs(ratio - 1) : 0;
      heatmapData.push({
        row: criteria[bestIdx],
        col: criteria[j],
        value: ratio,
        diff,
      });
    }

    for (let i = 0; i < n; i++) {
      const ratio = inconsistency_ratios.wwo?.[i];
      const diff = typeof ratio === 'number' ? Math.abs(ratio - 1) : 0;
      heatmapData.push({
        row: criteria[i],
        col: criteria[worstIdx],
        value: ratio,
        diff,
      });
    }
    const diffs = heatmapData.map(d => d.diff);
    heatMax = diffs.length > 0 ? Math.max(...diffs) : 0;
  }

  // Y-axis scale for lollipop
  let minTick = 0, maxTick = 0, yTicks = [];
  if (ratioData.length > 0) {
    const maxRatioValue = Math.max(...ratioData.map(d => d.value), 1.5);
    const minRatioValue = Math.min(...ratioData.map(d => d.value));
    const tickStep = 0.5;
    maxTick = Math.ceil(maxRatioValue / tickStep) * tickStep;
    minTick = Math.max(0, Math.floor(minRatioValue * 0.8 / tickStep) * tickStep);

    yTicks = [];
    for (let t = minTick; t <= maxTick + 1e-9; t += tickStep) {
      yTicks.push(Number(t.toFixed(2)));
    }
  }

  // Slope chart scale
  const slopeRawValues = slopeData.flatMap(d => [d.declared, d.implied])
    .filter(v => typeof v === 'number' && v > 0);
  
  let slopeDomain = ['auto', 'auto'];
  let slopeTicks = [];
  if (slopeRawValues.length > 0) {
    const maxVal = Math.max(...slopeRawValues);
    const minExp = 0;
    const maxExp = Math.ceil(Math.log10(maxVal));
    slopeDomain = [Math.pow(10, minExp), Math.pow(10, maxExp)];
    
    for (let e = minExp; e <= maxExp; e += 1) {
      slopeTicks.push(Math.pow(10, e));
    }
  }

  // Lollipop shape
  const LollipopShape = (props) => {
    const { x, width, payload, background } = props;
    if (!payload || !background) return null;

    const value = payload.value;
    const centerX = x + width / 2;
    const yBottom = background.y + background.height;
    const totalHeight = background.height;
    const range = (maxTick - minTick) || 1e-9;
    const yScale = (v) => yBottom - ((v - minTick) / range) * totalHeight;

    const baselineY = yScale(1);
    const valueY = yScale(value);

    return (
      <g>
        <line x1={centerX} y1={baselineY} x2={centerX} y2={valueY}
          stroke={token.colorPrimary} strokeWidth={2} />
        <circle cx={centerX} cy={valueY} r={5}
          fill={token.colorPrimary} stroke="#fff" strokeWidth={1} />
      </g>
    );
  };

  // Slope tooltip
  const SlopeTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const filtered = hoveredPair
      ? payload.filter(p => p.name === hoveredPair)
      : payload;
    if (!filtered.length) return null;
    const p = filtered[0];

    return (
      <div style={{
        background: 'white',
        border: '1px solid #ccc',
        padding: '6px 8px',
        fontSize: 11,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{p.name}</div>
        <div>{label}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>
      </div>
    );
  };

  // Heatmap color
  const getHeatmapColor = (diff) => {
    const maxDiff = heatMax || 0;
    const ratio = Math.max(0, Math.min(1, maxDiff > 0 ? diff / maxDiff : 0));

    // low(0) → high(maxDiff) 
    const from = { r: 236, g: 255, b: 229 }; // low diff (top color)
    const to   = { r: 92,  g: 195, b: 66  }; // high diff (bottom color)

    const r = Math.round(from.r + (to.r - from.r) * ratio);
    const g = Math.round(from.g + (to.g - from.g) * ratio);
    const b = Math.round(from.b + (to.b - from.b) * ratio);

    return `rgba(${r}, ${g}, ${b}, 1)`;
  };

  const vizchartWidth = Math.max(ratioData.length * 80, 600);

  const exportSvg = () => {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) {
      console.warn("SVG not found");
      return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.startsWith("<?xml")) {
      source = `<?xml version="1.0" standalone="no"?>\n` + source;
    }

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "visualization.svg";
    a.click();

    URL.revokeObjectURL(url);
  };


  return (
    <Card style={{ marginTop: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
          Individual Inconsistency
        </Title>
        <select
          value={vizMode}
          onChange={(e) => setVizMode(e.target.value)}
          style={{ padding: '2px 6px', borderRadius: 4 }}
        >
          <option value="lollipop">Lollipop</option>
          <option value="bar">Bar</option>
          {/* <option value="slope">Slope</option> */}
          <option value="heatmap">Heatmap</option>
        </select>
      </Space>

      <div style={{ width: '100%', overflowX: 'auto' }} ref={chartRef}>
        {/* lollipop */}
        {vizMode === 'lollipop' && (
          <div style={{ minWidth: vizchartWidth }}>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={ratioData}
                margin={{ top: 20, right: 40, left: 40, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="category" 
                  dataKey="pair" 
                  tick={{ angle: -30, textAnchor: "end", fontSize: 10 }}
                  interval={0}
                />
                <YAxis type="number" domain={[minTick, maxTick]} ticks={yTicks} />
                <ReferenceLine y={1} strokeDasharray="4 4" stroke="#000" />
                <Tooltip
                  formatter={(v) => [round3(v), "Ratio"]}
                  labelStyle={{ color: "#000" }}
                  itemStyle={{ color: "#000" }}
                />

                {/* Stick and Dot combined */}
                <Bar dataKey="value" shape={<LollipopShape />} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {vizMode === 'bar' && (
          <div style={{ minWidth: vizchartWidth }}>
            {/* BAR CHART (a_ij vs w_i/w_j) */}
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
                <YAxis type="number" domain={[0, 'auto', 0.5]} />
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
                {/* a_ij (yellow) */}
                <Bar dataKey="declared" name="a_ij" fill="#fbc02d" />

                {/* w_i / w_j (blue) */}
                <Bar dataKey="implied" name="w_i / w_j" fill={token.colorPrimary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* deactivated slope chart */}
        {/* {vizMode === 'slope' && (
          <ResponsiveContainer width="100%" height={450}>
            <LineChart margin={{ top: 20, right: 60, left: 60, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="category"
                dataKey="category"
                allowDuplicatedCategory={false}
                domain={['Declared', 'Implied']}
                ticks={['Declared', 'Implied']}
              />
              <YAxis 
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
        )} */}

        {vizMode === 'heatmap' && (
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '0px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `120px repeat(${criteria.length}, 1fr)`,
                gap: '0px',
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
                      const hasValue = cell && typeof value === 'number' && !Number.isNaN(value);
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
                          {hasValue ? value.toFixed(3) : ''}
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
              gap: '5px',
              fontSize: '12px',
              minWidth: '5px'
            }}>
              <span style={{ fontWeight: '500' }}>High</span>
              <div style={{ 
                width: '24px', 
                height: '200px', 
                background: 'linear-gradient(to top, rgb(236, 255, 229), rgb(92, 195, 66))',
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
        <Button onClick={exportSvg}>Export SVG</Button>
      </div>
    </Card>
  );
};

export default NonFuzzyInconsistency;