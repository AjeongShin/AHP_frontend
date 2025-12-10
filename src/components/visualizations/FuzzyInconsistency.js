// FuzzyInconsistency.jsx
import React, { useRef } from 'react';
import { Card, Typography, Button } from 'antd';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Scatter,
  ReferenceLine,
} from 'recharts';
import { convertMatrixToValues } from '../AhpFuzzyMatrix';
import { DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

// l,m,u label(black + bold)
const FuzzyXLabel = ({ cx, cy, payload }) => {
  if (!payload || typeof payload.x !== 'number') return null;

  const { mu, type } = payload;   // type: 'l' | 'm' | 'u'
  const isMiddle = mu === 1;
  const textY = isMiddle ? cy - 10 : cy - 4;
  const prefix = type === 'l' ? 'l=' : type === 'm' ? 'm=' : 'u=';

  return (
    <text
      x={cx}
      y={textY}
      textAnchor="middle"
      fontSize={11}
      fontWeight="bold"
      fill="#000"
      pointerEvents="none"   
    >
      {`${prefix}${payload.x.toFixed(2)}`}
    </text>
  );
};

// tooltip for a single triangle point
const SingleTriangleTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const p = payload[0];
  const { x, mu, pair, type } = p.payload || {};
  if (typeof x !== 'number') return null;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #ccc',
        padding: '6px 8px',
        fontSize: 11,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{pair}</div>
      <div>{`point: ${type?.toUpperCase?.() || ''} (l/m/u)`}</div>
      <div>{`x = ${x.toFixed(3)}`}</div>
      <div>{`μ = ${mu.toFixed(2)}`}</div>
    </div>
  );
};

const FuzzyInconsistency = ({
  method,
  variant,
  criteria,
  crisp_weights,
  matrix,
  bestIdx,
  worstIdx,
  bestRow,
  worstCol,
}) => {
  const n = criteria.length;

  const isAhpFuzzy = method === 'ahp';
  const isBwmFuzzy = method === 'bwm';

  // selected triangular pair + its m position
  const [hoveredPair, setHoveredPair] = React.useState(null);
  const [hoveredX, setHoveredX] = React.useState(null);
  const [hiddenKeys, setHiddenKeys] = React.useState({});
  const chartRef = useRef(null);   

  const numericMatrix =
    isAhpFuzzy && variant === 'linguistic fuzzy'
      ? convertMatrixToValues(matrix)
      : matrix;

  // 1) select (l,m,u) pairs from upper triangle
  const pairs = [];

  if (isAhpFuzzy && Array.isArray(numericMatrix)) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const cell = numericMatrix?.[i]?.[j]; // [l, m, u]

        if (!Array.isArray(cell) || cell.length < 3) continue;

        const [l, m, u] = cell;

        const valid =
          [l, m, u].every(
            (v) => typeof v === 'number' && !Number.isNaN(v)
          ) && l <= m && m <= u;

        if (!valid) continue;

        // --- asterisk (weight ratio) ---
        let asteriskX = null;
        let asteriskMu = 0;

        const wi = crisp_weights?.[i];
        const wj = crisp_weights?.[j];

        if (
          typeof wi === 'number' &&
          typeof wj === 'number' &&
          !Number.isNaN(wi) &&
          !Number.isNaN(wj) &&
          wj !== 0
        ) {
          const weightRatio = wi / wj;
          asteriskX = weightRatio;

          if (weightRatio <= l || weightRatio >= u) {
            asteriskMu = 0;
          } else if (weightRatio === m) {
            asteriskMu = 1;
          } else if (weightRatio > l && weightRatio < m && m !== l) {
            asteriskMu = (weightRatio - l) / (m - l);
          } else if (weightRatio > m && weightRatio < u && u !== m) {
            asteriskMu = (u - weightRatio) / (u - m);
          } else {
            asteriskMu = 0;
          }
        }

        pairs.push({
          pair: `${criteria[i]} vs ${criteria[j]}`,
          l,
          m,
          u,
          asterisk: asteriskX != null ? { x: asteriskX, mu: asteriskMu } : null,
        });
      }
    }
  }

  if (isBwmFuzzy && Array.isArray(numericMatrix)) {
    // ▸ Best-to-Others
    if (typeof bestIdx === 'number' && Array.isArray(bestRow)) {
      for (let j = 0; j < n; j++) {
        if (j === bestIdx) continue;

        const cell = bestRow?.[j];
        if (!Array.isArray(cell) || cell.length < 3) continue;

        const [l, m, u] = cell;

        const valid =
          [l, m, u].every(
            (v) => typeof v === 'number' && !Number.isNaN(v)
          ) && l <= m && m <= u;

        if (!valid) continue;

        // --- asterisk (weight ratio) ---
        let asteriskX = null;
        let asteriskMu = 0;

        const wb = crisp_weights?.[bestIdx];
        const wj = crisp_weights?.[j];

        if (
          typeof wb === 'number' &&
          typeof wj === 'number' &&
          !Number.isNaN(wb) &&
          !Number.isNaN(wj) &&
          wj !== 0
        ) {
          const weightRatio = wb / wj;
          asteriskX = weightRatio;

          if (weightRatio <= l || weightRatio >= u) {
            asteriskMu = 0;
          } else if (weightRatio === m) {
            asteriskMu = 1;
          } else if (weightRatio > l && weightRatio < m && m !== l) {
            asteriskMu = (weightRatio - l) / (m - l);
          } else if (weightRatio > m && weightRatio < u && u !== m) {
            asteriskMu = (u - weightRatio) / (u - m);
          } else {
            asteriskMu = 0;
          }
        }

        pairs.push({
          pair: `${criteria[bestIdx]} vs ${criteria[j]}`,
          l,
          m,
          u,
          asterisk: asteriskX != null ? { x: asteriskX, mu: asteriskMu } : null,
        });
      }
    }

    // ▸ Others-to-Worst
    if (typeof worstIdx === 'number' && Array.isArray(worstCol)) {
      for (let i = 0; i < n; i++) {
        if (i === worstIdx) continue;

        const cell = worstCol?.[i];
        if (!Array.isArray(cell) || cell.length < 3) continue;

        const [l, m, u] = cell;

        const valid =
          [l, m, u].every(
            (v) => typeof v === 'number' && !Number.isNaN(v)
          ) && l <= m && m <= u;

        if (!valid) continue;

        let asteriskX = null;
        let asteriskMu = 0;

        const ww = crisp_weights?.[worstIdx];
        const wi = crisp_weights?.[i];

        if (
          typeof ww === 'number' &&
          typeof wi === 'number' &&
          !Number.isNaN(ww) &&
          !Number.isNaN(wi) &&
          ww !== 0
        ) {
          const weightRatio = wi / ww;
          asteriskX = weightRatio;

          if (weightRatio <= l || weightRatio >= u) {
            asteriskMu = 0;
          } else if (weightRatio === m) {
            asteriskMu = 1;
          } else if (weightRatio > l && weightRatio < m && m !== l) {
            asteriskMu = (weightRatio - l) / (m - l);
          } else if (weightRatio > m && weightRatio < u && u !== m) {
            asteriskMu = (u - weightRatio) / (u - m);
          } else {
            asteriskMu = 0;
          }
        }

        // add only if not duplicate (best vs worst case)
        if (i !== bestIdx) {
          pairs.push({
            pair: `${criteria[i]} vs ${criteria[worstIdx]}`,
            l,
            m,
            u,
            asterisk: asteriskX != null ? { x: asteriskX, mu: asteriskMu } : null,
          });
        }
      }
    }
  }

  if (!pairs.length) return null;

  // 2) triangle data + point data (fixed color per pair in HSL)
  const triangleCount = pairs.length;

  const triangles = pairs.map((p, idx) => {
    const color = `hsl(${(idx * 360) / triangleCount}, 70%, 55%)`;

    const points = [
      { x: p.l, mu: 0, pair: p.pair, type: 'l', color },
      { x: p.m, mu: 1, pair: p.pair, type: 'm', color },
      { x: p.u, mu: 0, pair: p.pair, type: 'u', color },
    ];
    return { key: p.pair, color, points };
  });

  const triangleMap = triangles.reduce((acc, t) => {
    acc[t.key] = t;
    return acc;
  }, {});

  const allPoints = triangles.flatMap((t) => t.points);
  const allX = allPoints.map((pt) => pt.x);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const padding = (maxX - minX || 1) * 0.05;

  const domainMin = 0;
  const domainMax = maxX + padding;

  // use m values as XAxis ticks
  const middleTicks = Array.from(
    new Set(pairs.map(p => Number(p.m.toFixed(2))))
  ).sort((a, b) => a - b);

  // // points of the hovered triangle only
  // const activeLabelPoints = hoveredPair
  //   ? allPoints.filter((pt) => pt.pair === hoveredPair)
  //     //   .map((pt) => ({
  //     //   ...pt,
  //     //   mu: 0,          
  //     // }))
  //   : [];

  const asteriskPoints = pairs
    .filter((p) => !hiddenKeys[p.pair] && p.asterisk)
    .map((p) => {
      const tri = triangleMap[p.pair];
      return {
        x: p.asterisk.x,
        mu: p.asterisk.mu,
        pair: p.pair,
        type: 'asterisk',
        color: tri?.color,      
      };
    })
    .filter(
      (pt) => typeof pt.x === 'number' && typeof pt.mu === 'number'
    );

  const visiblePairs = pairs.filter(p => !hiddenKeys[p.pair]);

  const visibleMiddleTicks = Array.from(
    new Set(visiblePairs.map(p => Number(p.m.toFixed(2))))
  );

  const visibleAsteriskTicks = visiblePairs
    .filter(p => p.asterisk)
    .map(p => Number(p.asterisk.x.toFixed(2)));

  const allTicks = new Set([...visibleMiddleTicks, ...visibleAsteriskTicks]);  
  // const ticks = Array.from(
  //   new Set([...visibleMiddleTicks, ...visibleAsteriskTicks])
  // ).sort((a, b) => a - b);
  const uniqueTicks = Array.from(new Set(allTicks)).sort((a, b) => a - b);

  const StarMark = ({ cx, cy, payload }) => {
    if (typeof cx !== 'number' || typeof cy !== 'number') return null;
    const { color } = payload || {};
    return (
      <text
        x={cx}
        y={cy + 2}          
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={16}
        fontWeight="bold"
        fill={color}
        pointerEvents="none" 
      >
        *
      </text>
    );
  };

  const exportSvg = () => {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    if (!source.startsWith("<?xml")) {
      source = `<?xml version="1.0" standalone="no"?>\n` + source;
    }

    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Individual_Inconsistency_triangular.svg";
    a.click();

    URL.revokeObjectURL(url);
  };


  return (
    <Card style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,              
          // marginBottom: 16,
        }}
      >
      <Title level={3} style={{ marginTop: 0, marginBottom: 12 }}>
        Individual Inconsistency
      </Title>
      <Button icon={<DownloadOutlined />} onClick={exportSvg}>Export Individual Inconsistency (.svg)</Button>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }} ref={chartRef}>
        <div style={{ minWidth: 600 }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
              // find the hovered triangle based on activePayload
              onMouseMove={(state) => {
                const payload = state?.activePayload;
                if (!payload || !payload.length) {
                  // setHoveredPair(null);
                  // setHoveredX(null);
                  return;
                }
                const p = payload[0]?.payload;
                if (!p || !p.pair) {
                  // setHoveredPair(null);
                  // setHoveredX(null);
                  return;
                }
                setHoveredPair(p.pair);
                const tri = triangleMap[p.pair];
                if (tri && tri.points[1]) {
                  setHoveredX(tri.points[1].x); // m position
                } else {
                  setHoveredX(null);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[domainMin, domainMax]}     // 0 ~ max
                // ticks={ticks}       
                ticks={uniqueTicks}          
                // interval={10} 
                tickFormatter={(v) => v.toFixed(2)} 
                label={{
                  value: 'Value',
                  position: 'insideBottom',
                  offset: -5,
                }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1]}
                label={{ value: 'μ', angle: -90, position: 'insideLeft' }}
              />
              {/* turn off default cursor, use ReferenceLine */}
              <Tooltip content={<SingleTriangleTooltip />} cursor={false} />
              {/* <Legend
                verticalAlign="top"
                align="center"
                wrapperStyle={{ paddingBottom: 20 }}
              /> */}
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: 10 }}
                payload={triangles.map((t) => ({
                  value: t.key,
                  type: "square",
                  id: t.key,
                  color: hiddenKeys[t.key] ? "#ccc" : t.color,  // deactivated color: gray
                }))}
                onClick={(entry) => {
                  setHiddenKeys((prev) => ({
                    ...prev,
                    [entry.value]: !prev[entry.value]
                  }));
                }}
              />

              {/* apply gray dashed line at hoveredX */}
              {hoveredX != null && (
                <ReferenceLine
                  x={hoveredX}
                  stroke="#999"
                  strokeDasharray="3 3"
                />
              )}

              {/* apply gray dashed line at asteriskX */}
              {asteriskPoints.map((pt, idx) => (
                <ReferenceLine
                  // key={`asterisk-line-${idx}-${pt.pair}`}
                  x={pt.x}
                  stroke="#999"
                  strokeDasharray="3 3"
                />
              ))}

              {/* triangle areas */}
              {triangles.map((t) => (
                <Area
                  key={`${t.key}-area`}
                  name={t.key}
                  type="linear"
                  data={t.points}
                  dataKey="mu"
                  stroke={t.color}
                  fill={t.color}
                  fillOpacity={0.2}
                  activeDot={false}
                  hide={hiddenKeys[t.key]} 
                />
              ))}

              {/* asterisk points (colored per pair) */}
              <Scatter
                data={asteriskPoints}
                dataKey="mu"
                legendType="none"
                shape={StarMark}
                isAnimationActive={false}
              />

              {/* labels displayed via Scatter(black + bold) */}
              {/* <Scatter
                data={activeLabelPoints}
                dataKey="mu"
                legendType="none"
                shape={FuzzyXLabel}
                isAnimationActive={false}
              /> */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

    {/* <Button onClick={exportSvg}>Export SVG</Button> */}
    
    </Card>
  );
};

export default FuzzyInconsistency;
