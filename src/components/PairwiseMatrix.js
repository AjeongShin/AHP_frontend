// 📁 src/components/PairwiseMatrix.js
import React from 'react';
import { Typography, Table } from 'antd';

const { Title } = Typography;

const PairwiseMatrix = ({ matrix, criteria }) => {
  const columns = [
    {
      title: '',
      dataIndex: 'rowHeader',
      key: 'rowHeader',
    },
    ...criteria.map((c, i) => ({
      title: c,
      dataIndex: `col${i}`,
      key: `col${i}`,
      align: 'center'
    }))
  ];

  const dataSource = matrix.map((row, i) => {
    const rowObj = { rowHeader: criteria[i] };
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
