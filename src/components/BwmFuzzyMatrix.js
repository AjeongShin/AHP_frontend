import React from 'react';
import { Typography, Table, Select, Popover, Card } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const scaleOptions = [
  { value: 'EI', label: 'EI' },
  { value: 'WI', label: 'WI' },
  { value: 'FI', label: 'FI' },
  { value: 'VI', label: 'VI' },
  { value: 'AI', label: 'AI' },
];

// TFN values for conversion
const tfnValues = {
  'EI': [1, 1, 1],
  'WI': [2/3, 1, 3/2],
  'FI': [3/2, 2, 5/2],
  'VI': [5/2, 3, 7/2],
  'AI': [7/2, 4, 9/2],
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

const FuzzyMatrix = ({ matrix, setMatrix, criteria, bestIdx, worstIdx }) => {
  const handleChange = (i, j, label) => {
    const updated = matrix.map(row => [...row]);
    updated[i][j] = label;
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

    //   render: (_, row, rowIndex) => {
      render: (cellValue, row, rowIndex) => {
        const isActive = (rowIndex === bestIdx) || (j === worstIdx); 

        if (!isActive) return <div style={inactiveCellStyle} />;
        if (rowIndex === j) return <span>EI</span>;
    
        return (
          <Select
            style={{ width: 100 }}
            value={cellValue || 'EI'}
            onChange={(label) => handleChange(rowIndex, j, label)}
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
      <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // next to the title
        marginBottom: 10,
      }}
      >
        <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>Editable BWM Matrix</Title>

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
              <div><p><strong>WI (Weak Importance):</strong> (2/3, 1, 3/2)</p></div>
              <div><p><strong>FI (Fair Importance):</strong> (3/2, 2, 5/2)</p></div>
              <div><p><strong>VI (Very Importance):</strong> (5/2, 3, 7/2)</p></div>
              <div><p><strong>AI (Absolute Importance):</strong> (7/2, 4, 9/2)</p></div>
              <hr />
             <div><em>Note: Each cell shows how much the row criterion is preferred over the column criterion.</em></div>
         
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

export default FuzzyMatrix;
