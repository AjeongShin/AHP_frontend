import React, { useState } from 'react';
import { Typography, Table, Select, InputNumber, Input, Switch, Space, Modal, Button } from 'antd';

import { EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// default and diagonal value
const EI_TFN = [1, 1, 1];

export const convertMatrixToValues = (tfnMatrix) => {
  return tfnMatrix.map(row => 
    row.map(tfn => Array.isArray(tfn) ? tfn : EI_TFN)
  );
};

const AhpFuzzyMatrixTfn = ({ matrix, setMatrix, criteria, bestIdx, worstIdx}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  // const [tempTfn, setTempTfn] = useState([1, 1, 1]);
  const [tempTfn, setTempTfn] = useState(['1', '1', '1']);
  const [fractionMode, setFractionMode] = useState(false); // false: decimal, true: fraction
  const [displayMatrix, setDisplayMatrix] = useState( // remember display values
    matrix.map(row => row.map(() => null))
  );

  const handleOpenEditModal = (i, j) => {
    const currentValue = matrix[i][j];
    const tfn = Array.isArray(currentValue) && currentValue.length === 3 
      ? currentValue 
      : EI_TFN;
    
    setEditingCell({ i, j });
    // setTempTfn([...tfn]);
    setTempTfn(tfn.map(v => String(v)));
    setEditModalVisible(true);
  };

  const handleChange = () => {
    if (!editingCell) return;
    
    const { i, j } = editingCell;
    const updated = matrix.map(row => [...row]);
    
    // Validate TFN: l ≤ m ≤ u
    // const [l, m, u] = tempTfn;
    const [l, m, u] = tempTfn.map(parseFraction);

    if ([l, m, u].some(v => !Number.isFinite(v))) {
      Modal.error({
        title: 'Invalid Input',
        content: fractionMode
          ? 'Fraction mode: use forms like 1/3 or integers.'
          : 'Decimal mode: use numeric forms like 0.333.',
      });
      return;
    }

    if (l >= m || m >= u) {
      Modal.error({
        title: 'Invalid TFN',
        content: 'Please ensure: Lower ≤ Middle ≤ Upper',
      });
      return;
    }
    
    // Set the TFN for the selected cell
    // updated[i][j] = [...tempTfn];
    updated[i][j] = [l, m, u];
    // console.log('updated cell:', i, j, updated[i][j]);
    
    // Set display values following input mode
    const disp = displayMatrix.map(row => [...row]);
    if (fractionMode) {
      disp[i][j] = [...tempTfn];           // ["1/3","1/2","2/3"]
    } else {
      disp[i][j] = [
        l.toFixed(3),
        m.toFixed(3),
        u.toFixed(3),
      ];
    }

    setMatrix(updated);
    setDisplayMatrix(disp);
    setEditModalVisible(false);
    setEditingCell(null);
  };

  const formatCellValue = (display, numeric) => {
    if (Array.isArray(display) && display.length === 3) {
      return `(${display[0]}, ${display[1]}, ${display[2]})`;
    }
    
    if (Array.isArray(numeric) && numeric.length === 3) {
    //   return `(${cellValue[0].toFixed(3)}, ${cellValue[1].toFixed(3)}, ${cellValue[2].toFixed(3)})`;
    // }
      const formatted = numeric.map(v => {
        return Number.isInteger(v) ? String(v) : v.toFixed(3);
      });
      return `(${formatted[0]}, ${formatted[1]}, ${formatted[2]})`;
    }
    return '(1, 1, 1)';
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

      render: (cellValue, row, rowIndex) => {
        const isActive = (rowIndex === bestIdx) || (j === worstIdx); 

        if (!isActive) return <div style={inactiveCellStyle} />;
        if (rowIndex === j) return <span>(1, 1, 1)</span>;
        const display = displayMatrix?.[rowIndex]?.[j] ?? null;

        return (
          <Button
            onClick={() => handleOpenEditModal(rowIndex, j)}
            icon={<EditOutlined />}
            style={{ width: '100%' }}
          >
            {formatCellValue(display, cellValue)}
          </Button>
        );
      },

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

  const parseFraction = (input) => {
    const str = String(input ?? '').trim();
    if (!str) return 0;

    // case1. solve every types
    if (str.includes('/')) {
      const [numerator, denominator] = str.split('/').map(Number);
      if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return 1;
      return numerator / denominator; 
    }
    const num = parseFloat(str);
    return isNaN(num) ? 1 : num;

    // // case2. use input mode swtich(fraction, decimal)
    // if (fractionMode) {
    //   if (str.includes('.')) return NaN; // invalid in fraction mode
    //   if (str.includes('/')) {
    //     const [numerator, denominator] = str.split('/').map(Number);
    //     if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) return NaN;
    //     return numerator / denominator; 
    //   }
    //   const intVal = parseInt(str, 10);
    //   return Number.isNaN(intVal) ? NaN : intVal;

    // } else {
    //   if (str.includes('/')) return NaN; // invalid in decimal mode
    
    // const num = parseFloat(str);
    // return Number.isNaN(num) ? NaN : num;
    // }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
        Editable Fuzzy AHP Matrix
      </Title>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: true }}
      />

      {/* TFN Edit Modal */}
      <Modal
        title={
          editingCell 
            ? `Edit TFN: ${criteria[editingCell.i]} → ${criteria[editingCell.j]}`
            : 'Edit Triangular Fuzzy Number'
        }
        open={editModalVisible}
        onOk={handleChange}
        onCancel={() => setEditModalVisible(false)}
        width={450}
      >
        <Space style={{ marginBottom: 12 }}>
          <Text type="secondary">Input type: fraction, decimal</Text>
          {/* <Switch
            checked={fractionMode}
            checkedChildren="Fraction (e.g., 1/3)"
            unCheckedChildren="Decimal (e.g., 0.333)"
            onChange={setFractionMode}
          /> */}
        </Space>

        <Space direction="horizontal" style={{ width: '100%', marginTop: 10 }} size="large">
          <div>
            <Text strong>Lower (l):</Text>
            {/* <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[0]}
              onChange={(val) => setTempTfn([val || 0, tempTfn[1], tempTfn[2]])}
              min={0.001}
              max={10}
              step={0.1}
              precision={3}
            /> */}
            <Input
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[0]}
              onChange={(e) => {
                const val = e.target.value;
                setTempTfn([val, tempTfn[1], tempTfn[2]]);
              }}
            />
          </div>
          
          <div>
            <Text strong>Middle (m):</Text>
            {/* <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[1]}
              onChange={(val) => setTempTfn([tempTfn[0], val || 0, tempTfn[2]])}
              min={0.001}
              max={10}
              step={0.1}
              precision={3}
            /> */}
            <Input
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[1]}
              onChange={(e) => {
                const val = e.target.value;
                setTempTfn([tempTfn[0], val, tempTfn[2]]);
              }}
            />
          </div>
          
          <div>
            <Text strong>Upper (u):</Text>
            {/* <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[2]}
              onChange={(val) => setTempTfn([tempTfn[0], tempTfn[1], val || 0])}
              min={0.001}
              max={10}
              step={0.1}
            /> */}
            <Input
              style={{ width: '100%', marginTop: 8 }}
              value={tempTfn[2]}
              onChange={(e) => {
                const val = e.target.value;
                setTempTfn([tempTfn[0], tempTfn[1], val]);
              }}
            />
          </div>
          {/*
          <div style={{ 
            padding: 16, 
            background: '#f0f5ff', 
            borderRadius: 4,
            border: '1px solid #d6e4ff'
          }}>
             <Space direction="vertical" size="small">
              <Text strong>Validation:</Text>
              <Text type="secondary">
                • Must satisfy: l ≤ m ≤ u
              </Text>
              <Text type="secondary">
                • Current: {tempTfn[0].toFixed(3)} ≤ {tempTfn[1].toFixed(3)} ≤ {tempTfn[2].toFixed(3)}
              </Text>
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                • Reciprocal will be: ({(1/tempTfn[2]).toFixed(3)}, {(1/tempTfn[1]).toFixed(3)}, {(1/tempTfn[0]).toFixed(3)})
              </Text>
            </Space> 
          </div>*/}
        </Space>
      </Modal>
    </div>
  );
};

export default AhpFuzzyMatrixTfn;