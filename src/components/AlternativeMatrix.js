import React from 'react';
import { Table, InputNumber, Typography, Collapse } from 'antd';

const { Title } = Typography;
const { Panel } = Collapse;

const AlternativeMatrix = ({ criterion, alternatives, scores, setScores }) => {
  const handleChange = (i, j, value) => {
    const updated = scores.map((row, rowIdx) => [...row]); 
    updated[i][j] = value;
    setScores(updated);
  };

  const columns = [
    {
      title: '',
      dataIndex: 'alternative',
      key: 'alternative',
    },
    ...alternatives.map((alt, j) => ({
      title: alt,
      dataIndex: `alt${j}`,
      key: `alt${j}`,
      render: (_, row, i) =>
          <InputNumber
            min={1 / 9}
            max={30}
            step={0.1}
            value={scores[i]?.[j] || 0}
            onChange={(val) => handleChange(i, j, val)}
          />,
    })),
    {
        title: 'Row Sum',
        key: 'rowsum',
        render: (_, row, i) => {
          const sum = scores[i].reduce((acc, val) => acc + val, 0);
          return sum.toFixed(3);
        },
      },
      {
        title: 'Weight',
        key: 'weight',
        render: (_, row, i) => {
          const rowSums = scores.map(row => row.reduce((sum, val) => sum + val, 0));
          const totalSum = rowSums.reduce((a, b) => a + b, 0);
          const weight = rowSums[i] / totalSum;
          return weight.toFixed(3);
        },
      },
  ];

  const dataSource = alternatives.map((alt, i) => {
    const row = { key: i, alternative: alt };
    alternatives.forEach((_, j) => {
      row[`alt${j}`] = scores[i]?.[j] || (i === j ? 1 : null);
    });
    return row;
  });

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={3}>Alternative Comparison Matrix - {criterion}</Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: true }}
      />
    </div>
  );
};

export default AlternativeMatrix;

