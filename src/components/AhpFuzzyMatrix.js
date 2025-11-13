import React, { useState } from 'react';
import { Typography, Table, Select, InputNumber, Space, Modal, Button, Popover, Card } from 'antd';
import { QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const scaleOptions = [
  { value: 'EI', label: 'EI' },
  { value: 'WMI', label: 'WMI' },
  { value: 'FMI', label: 'FMI' },
  { value: 'VMI', label: 'VMI' },
  { value: 'AMI', label: 'AMI' },

  { value: 'WLI', label: 'WLI' },
  { value: 'FLI', label: 'FLI' },
  { value: 'VLI', label: 'VLI' },
  { value: 'ALI', label: 'ALI' },
];

// TFN values for conversion
const tfnValues = {
  'EI': [1, 1, 1],
  'WMI': [2/3, 1, 3/2],
  'FMI': [3/2, 2, 5/2],
  'VMI': [5/2, 3, 7/2],
  'AMI': [7/2, 4, 9/2],

  'WLI': [2/3, 1, 3/2],
  'FLI': [2/5, 1/2, 2/3],
  'VLI': [2/7, 1/3, 2/5],
  'ALI': [2/9, 1/4, 2/7],
};

// Reciprocal mapping: MI <-> LI
const reciprocalMap = {
  'EI': 'EI',
  'WMI': 'WLI',
  'FMI': 'FLI',
  'VMI': 'VLI',
  'AMI': 'ALI',
  'WLI': 'WMI',
  'FLI': 'FMI',
  'VLI': 'VMI',
  'ALI': 'AMI',
};

// default and diagonal value
const EI_TFN = tfnValues['EI'];

export const convertMatrixToValues = (labelMatrix) => {
  return labelMatrix.map(row => 
    row.map(label => {
      return tfnValues[label] || EI_TFN;
    })
  );
};

const AhpFuzzyMatrix = ({ matrix, setMatrix, criteria}) => {
  const handleChange = (i, j, label) => {
    const updated = matrix.map(row => [...row]);
    updated[i][j] = label;

    const reciprocalLabel = reciprocalMap[label] || 'EI';
    updated[j][i] = reciprocalLabel;

    setMatrix(updated);
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

    //   render: (_, row, rowIndex) => {
      render: (cellValue, row, rowIndex) => {
        // const isActive = (rowIndex === bestIdx) || (j === worstIdx); 

        // if (!isActive) return <div style={inactiveCellStyle} />;
        if (rowIndex === j) return <span>EI</span>;
    
        return (
          <Select
            style={{ width: 100 }}
            value={cellValue === 1 ? 'EI' : (cellValue || 'EI')}
            onChange={(label) => handleChange(rowIndex, j, label)}
            options={scaleOptions}
          />
        )},
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
      <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // next to the title
        marginBottom: 10,
      }}
      >
      
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Editable AHP Matrix</Title>
      
      <Popover
        title={
          <span style={{fontSize: 18, fontWeight: 'bold'}}>
          Fuzzy Scale Information
          </span>
        }
        trigger="click"
        content={
          <Card
            size="small"
            style={{ width: 400 }}
            fontSize={20}
            bodyStyle={{ fontSize: 16, padding: 12, marginInline:10 }} 
          >
            <div><p><strong>EI (Equal Importance):</strong> (1, 1, 1)</p></div>
            <div><p><strong>WMI (Weak More Importance):</strong> (2/3, 1, 3/2)</p></div>
            <div><p><strong>FMI (Fair More Importance):</strong> (3/2, 2, 5/2)</p></div>
            <div><p><strong>VMI (Strong More Importance):</strong> (5/2, 3, 7/2)</p></div>
            <div><p><strong>AMI (Absolute More Importance):</strong> (7/2, 4, 9/2)</p></div>
            <hr />
            <div><p><strong>WLI (Weak Less Importance):</strong> (2/3, 1, 3/2)</p></div>
            <div><p><strong>FLI (Fair Less Importance):</strong> (2/5, 1/2, 2/3)</p></div>
            <div><p><strong>VLI (Strong Less Importance):</strong> (2/7, 1/3, 2/5)</p></div>
            <div><p><strong>ALI (Absolute Less Importance):</strong> (2/9, 1/4, 2/7)</p></div>
            <hr />
            <div><em>Note: Each cell shows how much the row criterion is preferred over the column criterion. “More Importance” and “Less Importance” are reciprocal judgments.</em></div>
          </Card>
        }
      >
        <QuestionCircleOutlined style={{ marginLeft: 8, cursor: 'pointer', fontSize: 20 }} />
      </Popover>
    </div>
      
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        tableLayout="fixed" 
        scroll={{ x: true }}
      />
    </div>
  );
};

export default AhpFuzzyMatrix;
