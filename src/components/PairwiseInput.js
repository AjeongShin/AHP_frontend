import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Typography, Space, Card, Table, Collapse } from 'antd';

const { Title } = Typography;
const { Panel } = Collapse;

/**
 * Editable pairwise matrix input component
 * Keeps criteria input as-is, and allows direct matrix editing
 */
const PairwiseInput = ({ criteria, setCriteria, matrix, setMatrix }) => {
  // Update individual criterion name
  const handleCriterionChange = (i, value) => {
    const updated = [...criteria];
    updated[i] = value;
    setCriteria(updated);
  };

  // Initialize matrix when criteria updated
  useEffect(() => {
    const active = criteria.filter(c => c.trim() !== '');
    const n = active.length;
    if (n >= 2) {
      const newMatrix = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 1))
      );
      setMatrix(newMatrix);
    } else {
      setMatrix([]);
    }
  }, [criteria, setMatrix]);

  // Handle matrix value change (reciprocal logic)
  const handleMatrixChange = (i, j, value) => {
    const updated = [...matrix];
    updated[i][j] = value;
    updated[j][i] = 1 / value;
    setMatrix(updated);
  };

  const active = criteria.filter(c => c.trim() !== '');

  const columns = [
    {
      title: '',
      dataIndex: 'rowHeader',
      key: 'rowHeader',
      align: 'center',
    },
    ...active.map((c, j) => ({
      title: c,
      dataIndex: `col${j}`,
      key: `col${j}`,
      align: 'center',
      render: (_, row, rowIndex) =>
        rowIndex === j ? (
          <span>1</span>
        ) : (
          <InputNumber
            min={0 / 9}
            max={9}
            step={0.1}
            value={matrix?.[rowIndex]?.[j]}
            onChange={(val) => handleMatrixChange(rowIndex, j, val)}
          />
        ),
    })),
  ];

  const dataSource = matrix.map((row, i) => {
    const rowObj = { rowHeader: criteria[i] };
    for (let j = 0; j < row.length; j++) {
      rowObj[`col${j}`] = matrix[i][j];
    }
    return { key: i, ...rowObj };
  });

  return (
    <div style={{ paddingBottom: 12 }}>
      {/* Criteria Input */}
      <Collapse defaultActiveKey={['criteria']} bordered={false} style={{ marginBottom: 16 }}>
        <Panel
          header={<span style={{ fontSize: '16px', fontWeight: 700 }}>Enter Criteria</span>}
          key="criteria"
        >
          <Card size="small" style={{ marginBottom: 16 }}>
            <Form layout="vertical">
              <Space direction="vertical" style={{ width: '100%' }}>
                {criteria.map((c, i) => (
                  <Form.Item key={i} label={`Criterion ${i + 1}`}>
                    <Input
                      value={c}
                      placeholder="e.g., Cost, Efficiency"
                      onChange={(e) => handleCriterionChange(i, e.target.value)}
                    />
                  </Form.Item>
                ))}
              </Space>
            </Form>
          </Card>
        </Panel>
      </Collapse>

      {/* Editable Matrix Table */}
      {matrix.length > 0 && (
        <>
          <Title level={5}>Editable Pairwise Matrix</Title>
          <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered
            size="small"
          />
        </div>
        </>
      )}
    </div>
  );
};

export default PairwiseInput;


// import React, { useEffect } from 'react';
// import { Form, Input, InputNumber, Select, Row, Col, Typography, 
//   Divider, Card, Space, Collapse } from 'antd';

// const { Title } = Typography;
// const { Panel } = Collapse;

// const PairwiseInput = ({ criteria, setCriteria, comparisons, setComparisons }) => {
//   // Update individual criterion name by index
//   const handleCriterionChange = (i, value) => {
//     const updated = [...criteria];
//     updated[i] = value;
//     setCriteria(updated);
//   };

//   // Generate all unique pairs of criteria for comparison
//   // Output(pairs): all combinations 
//   // e.g. pairs =[{ from: "Cost", to: "Efficiency", value: 1, direction: "Cost > Efficiency" }]
//   const generatePairs = (items) => {
//     const pairs = [];
//     for (let i = 0; i < items.length; i++) {
//       for (let j = i + 1; j < items.length; j++) {
//         pairs.push({
//           from: items[i],
//           to: items[j],
//           value: 1,
//           direction: `${items[i]} > ${items[j]}`
//         });
//       }
//     }
//     return pairs;
//   };

//   useEffect(() => {
//     // active criteria names (non-empty only)
//     // e.g. active = ["Cost", "Efficiency", "Durability"]
//     const active = criteria.filter(c => c.trim() !== '');
//     // Regenerate pairwise comparison structure when criteria change
//     if (active.length > 1) {
//       setComparisons(generatePairs(active));
//     }
//   }, [criteria]);

//   return (
//     <div style={{ paddingBottom: 12 }}>
//       <Collapse defaultActiveKey={['criteria', 'comparisons']} bordered={false}>
//         <Panel
//           key="criteria"
//           header={
//             <span style={{ fontSize: '16px', fontWeight: 700 }}>
//               Enter Criteria
//             </span>
//           }
//         >
//           <Card size="small" style={{ marginBottom: 16 }}>
//             <Form layout="vertical">
//               <Space direction="vertical" style={{ width: '100%' }}>
//                 {criteria.map((c, i) => (
//                   <Form.Item key={i} label={`Criterion ${i + 1}`}>
//                     <Input
//                       value={c}
//                       placeholder="e.g., Cost, Efficiency"
//                       onChange={(e) => handleCriterionChange(i, e.target.value)}
//                     />
//                   </Form.Item>
//                 ))}
//               </Space>
//             </Form>
//           </Card>
//         </Panel>

//         <Panel
//           key="comparisons"
//           header={
//             <span style={{ fontSize: '16px', fontWeight: 700 }}>
//               Pairwise Comparisons
//             </span>
//           }
//         >
//           <Card size="small">
//             <Form layout="vertical">
//               {comparisons.map((pair, i) => (
//                 <Row key={i} gutter={12} style={{ marginBottom: 12 }}>
//                   <Col span={10}>
//                     <Form.Item label={`${pair.from} vs ${pair.to}`}>
//                       <Select
//                         value={pair.direction}
//                         onChange={(val) => {
//                           const updated = [...comparisons];
//                           updated[i].direction = val;
//                           setComparisons(updated);
//                         }}
//                         options={[
//                           {
//                             label: `${pair.from} > ${pair.to}`,
//                             value: `${pair.from} > ${pair.to}`,
//                           },
//                           {
//                             label: `${pair.to} > ${pair.from}`,
//                             value: `${pair.to} > ${pair.from}`,
//                           },
//                           {
//                             label: `${pair.from} = ${pair.to}`,
//                             value: `${pair.from} = ${pair.to}`,
//                           },
//                         ]}
//                       />
//                     </Form.Item>
//                   </Col>
//                   <Col span={10}>
//                     <Form.Item label="Importance (1–9)">
//                       <InputNumber
//                         min={1}
//                         max={9}
//                         value={pair.value}
//                         disabled={pair.direction.includes('=')}
//                         onChange={(val) => {
//                           const updated = [...comparisons];
//                           updated[i].value = val;
//                           setComparisons(updated);
//                         }}
//                       />
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               ))}
//             </Form>
//           </Card>
//         </Panel>
//       </Collapse>
//     </div>
//   );
// };

// export default PairwiseInput;