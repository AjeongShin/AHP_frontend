import React, { useRef } from 'react';
import { Card, Typography, theme, Button } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, LabelList
} from 'recharts';

const { Title } = Typography;

// Box plot component for interval weights
const BoxPlotBar = (props) => {  
  const { x, y, width, height, payload } = props;
  if (!payload || height < 0) return null;

  const { lower, center, upper } = payload;
  if (upper < lower) return null; // Invalid range
  if (upper === 0) return null; // Avoid division by zero

  const centerX = x + width / 2;
  const boxWidth = Math.min(width * 0.8, 80);
  
  const upperY = y;
  const lowerY = y + height * (1 - lower / upper);
  const centerY = y + height * (1 - center / upper);

  return (
    <g>
      {/* Whisker (lower→upper) */}   
      <line x1={centerX} y1={lowerY} x2={centerX} y2={upperY} 
        stroke="#333" strokeWidth={1.5} />
      
      {/* Markers */}
      {/* Upper bound line(blue) */}
      <line 
        x1={centerX - 0.3 * boxWidth} y1={upperY}
        x2={centerX + 0.3 * boxWidth} y2={upperY}
        stroke="#1a53c4ff" strokeWidth={2}
      />

      {/* Center marker square(black) */}
      <rect 
        x={centerX - 3.5} y={centerY - 3.5} 
        width={7} height={7} 
        fill="#000" strokeWidth={1.5} 
      />
      
      {/* Lower bound line(red) */}
      <line 
        x1={centerX - 0.3 * boxWidth} y1={lowerY}
        x2={centerX + 0.3 * boxWidth} y2={lowerY}
        stroke="#ff4d4f" strokeWidth={2}
      />
    </g>
  );
};

const WeightsVisualization = ({ 
  variant, 
  criteria, 
  crisp_weights, 
  lower_weights, 
  upper_weights 
}) => {
  const { token } = theme.useToken();
  const chartRef = useRef(null);  

  const round3 = (x) => (
    typeof x === 'number' && !isNaN(x) 
      ? Math.round(x * 1000) / 1000 
      : 0
  );

  // Prepare data based on variant
  const isLinearOrOrigin = variant === 'linear' || variant === 'origin';
  
  const dataLinear = criteria.map((name, i) => ({
    name,
    crisp: typeof crisp_weights[i] === 'number' && !isNaN(crisp_weights[i]) 
      ? round3(crisp_weights[i]) 
      : 0,
  }));

  const dataInterval = criteria.map((name, i) => {
    const lo = typeof lower_weights[i] === 'number' ? lower_weights[i] : 0;
    const up = typeof upper_weights[i] === 'number' ? upper_weights[i] : 0;
    const hasCrisp = typeof crisp_weights[i] === 'number' && !isNaN(crisp_weights[i]);
    const center = hasCrisp ? crisp_weights[i] : (lo + up) / 2;

    return {
      name,
      lower: round3(lo),
      center: round3(center),
      upper: round3(up),
    };
  });

  const chartWidth = Math.max(criteria.length * 80, 600);

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
    <Card style={{ marginBottom: 24 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 16 }}>
        Weights Visualization
      </Title>

      {isLinearOrOrigin ? (
        <div style={{ width: '100%', overflowX: 'auto' }} ref={chartRef}>
          <div style={{ minWidth: chartWidth }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dataLinear}
                margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
                barCategoryGap="85%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  labelStyle={{ color: '#000' }} 
                  itemStyle={{ color: '#000' }} 
                />
                <Bar dataKey="crisp" fill={token.colorPrimary} isAnimationActive={false}>
                  <LabelList
                    dataKey="crisp"
                    position="top"
                    formatter={(val) => round3(val)}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', overflowX: 'auto' }} ref={chartRef}>
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
                      return Math.round(Math.max(0, minLower * 0.9) * 1000) / 1000;
                    },
                    (dataMax) => {
                      const maxUpper = Math.max(...dataInterval.map(d => d.upper));
                      return Math.round(maxUpper * 1.1 * 1000) / 1000;
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
        <Button onClick={exportSvg}>Export SVG</Button>
    </Card>
  );
};

export default WeightsVisualization;