import React from 'react';
import { Typography, Table, Select } from 'antd';

const { Title, Text } = Typography;

const scaleOptions = [
//   { value: 1 / 9, label: '1/9' }, { value: 1 / 8, label: '1/8' },
//   { value: 1 / 7, label: '1/7' }, { value: 1 / 6, label: '1/6' },
//   { value: 1 / 5, label: '1/5' }, { value: 1 / 4, label: '1/4' },
//   { value: 1 / 3, label: '1/3' }, { value: 1 / 2, label: '1/2' },
  { value: 1, label: '1' },
  { value: 2, label: '2' }, { value: 3, label: '3' },
  { value: 4, label: '4' }, { value: 5, label: '5' },
  { value: 6, label: '6' }, { value: 7, label: '7' },
  { value: 8, label: '8' }, { value: 9, label: '9' },
];

const BwmMatrix = ({ matrix, setMatrix, criteria, bestIdx, worstIdx }) => {
  const handleChange = (i, j, value) => {
    const updated = [...matrix];
    updated[i][j] = value;
    // updated[j][i] = 1 / value;
    setMatrix(updated);
  };

  const inactiveCellStyle = {
    background: '#d6d3d3ff',
    color: '#d6d3d3ff',
    height: 36,
    lineHeight: '36px',
    textAlign: 'center',
    borderRadius: 4,
  };

  const columns = [
    {
      title: '',
      dataIndex: 'rowHeader',
      key: 'rowHeader',
      align: 'center',
    },
    ...criteria.map((c, j) => ({
      title: c,
      dataIndex: `col${j}`,
      key: `col${j}`,
      align: 'center',

      render: (_, row, rowIndex) => {
        const isActive = (rowIndex === bestIdx) || (j === worstIdx); 

        if (!isActive) return <div style={inactiveCellStyle} />;
        if (rowIndex === j) return <span>1</span>;
    
        return (
          <Select
            style={{ width: 100 }}
            value={matrix?.[rowIndex]?.[j]}
            onChange={(val) => handleChange(rowIndex, j, val)}
            options={scaleOptions}
          />
        )},

        onCell: (_, rowIndex) => {
            const isActive = rowIndex === bestIdx || j === worstIdx;
            return {style: isActive ? {} : { background: '#d6d3d3ff'}};
        },
    })),
  ];

  // for matrix display
  const dataSource = matrix.map((row, i) => {
    const rowObj = { rowHeader: criteria[i] };
    row.forEach((val, j) => {
      rowObj[`col${j}`] = val;
    });
    return { key: i, ...rowObj };
  });

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Editable BWM Matrix</Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        tableLayout="fixed" 
        scroll={{ x: true }}
      />

      <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
        Note: Greyed-out cells are inactive based on the Best-Worst Method rules.
      </Text>
    </div>
  );
};

export default BwmMatrix;
