import React from 'react';
import { Typography, Table } from 'antd';

const { Title } = Typography;

// Displays the computed pairwise comparison matrix as a table
// criteria = ["Cost", "Efficiency", "Durability"]
/* matrix = [
  [1,    2,    0.5],    // Cost vs (Cost, Efficiency, Durability)
  [0.5,  1,    3],      // Efficiency vs (Cost, Efficiency, Durability)
  [2,    0.33, 1]       // Durability vs ...
]
  */
const PairwiseMatrix = ({ matrix, criteria }) => {
  // Table headers: criteria names
  const columns = [
    {
      title: '',
      dataIndex: 'rowHeader',
      key: 'rowHeader',
      align: 'center',
    },
    ...criteria.map((c, i) => ({
      title: c,
      dataIndex: `col${i}`,
      key: `col${i}`,
      align: 'center'
    }))
  ];

  // Formatted matrix values with row labels
  // row = [[1,  2,  0.5], [0.5,  1,  3], [2, 0.33, 1]]
  // i = 0, 1, 2 (colum index)
  const dataSource = matrix.map((row, i) => {
    const rowObj = { rowHeader: criteria[i] };
    // j = row index
    row.forEach((val, j) => {
      rowObj[`col${j}`] = typeof val === 'number' ? Math.round(val * 100) / 100 : '-';
    });
    return { key: i, ...rowObj };
  });

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Generated Pairwise Matrix</Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        size="small"
      />
    </div>
  );
};

export default PairwiseMatrix;
