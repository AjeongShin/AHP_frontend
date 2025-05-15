// src/components/PairwiseInput.js
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col, Typography, 
  Divider, Card, Space, Collapse } from 'antd';

const { Title } = Typography;
const { Panel } = Collapse;

const PairwiseInput = ({ criteria, setCriteria, comparisons, setComparisons }) => {
  const handleCriterionChange = (i, value) => {
    const updated = [...criteria];
    updated[i] = value;
    setCriteria(updated);
  };

  const generatePairs = (items) => {
    const pairs = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        pairs.push({
          from: items[i],
          to: items[j],
          value: 1,
          direction: `${items[i]} > ${items[j]}`
        });
      }
    }
    return pairs;
  };

  useEffect(() => {
    const active = criteria.filter(c => c.trim() !== '');
    if (active.length > 1) {
      setComparisons(generatePairs(active));
    }
  }, [criteria]);

  return (
    <div style={{ paddingBottom: 12 }}>
      <Collapse defaultActiveKey={['criteria', 'comparisons']} bordered={false}>
        <Panel
          key="criteria"
          header={
            <span style={{ fontSize: '16px', fontWeight: 700 }}>
              Enter Criteria
            </span>
          }
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

        <Panel
          key="comparisons"
          header={
            <span style={{ fontSize: '16px', fontWeight: 700 }}>
              Pairwise Comparisons
            </span>
          }
        >
          <Card size="small">
            <Form layout="vertical">
              {comparisons.map((pair, i) => (
                <Row key={i} gutter={12} style={{ marginBottom: 12 }}>
                  <Col span={10}>
                    <Form.Item label={`${pair.from} vs ${pair.to}`}>
                      <Select
                        value={pair.direction}
                        onChange={(val) => {
                          const updated = [...comparisons];
                          updated[i].direction = val;
                          setComparisons(updated);
                        }}
                        options={[
                          {
                            label: `${pair.from} > ${pair.to}`,
                            value: `${pair.from} > ${pair.to}`,
                          },
                          {
                            label: `${pair.to} > ${pair.from}`,
                            value: `${pair.to} > ${pair.from}`,
                          },
                          {
                            label: `${pair.from} = ${pair.to}`,
                            value: `${pair.from} = ${pair.to}`,
                          },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={10}>
                    <Form.Item label="Importance (1–9)">
                      <InputNumber
                        min={1}
                        max={9}
                        value={pair.value}
                        disabled={pair.direction.includes('=')}
                        onChange={(val) => {
                          const updated = [...comparisons];
                          updated[i].value = val;
                          setComparisons(updated);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ))}
            </Form>
          </Card>
        </Panel>
      </Collapse>
    </div>
  );
};

export default PairwiseInput;