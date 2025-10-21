import React from 'react';
import { Form, Input, Typography, Space, Card, Button } from 'antd';

const { Title } = Typography;

const BwmInput = ({ criteria, setCriteria, editable = false, allowAddRemove = false }) => {

  const handleCriterionChange = (i, value) => {
    const updated = [...criteria];
    updated[i] = value;
    setCriteria(updated);
  };

  const handleRemoveCriterion = (i) => {
    const updated = [...criteria];
    updated.splice(i, 1);
    setCriteria(updated);
  };

  const handleAddCriterion = () => {
    if (criteria.length < 5) {
      setCriteria([...criteria, `Criterion ${criteria.length + 1}`]);
    }
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      <Title level={5}>Enter Criteria</Title>
      <Card size="small">
        <Form layout="vertical">
          <Space direction="vertical" style={{ width: '100%' }}>
            {criteria.map((c, i) => (
              <Form.Item key={i} label={`Criterion ${i + 1}`}>
                <Space style={{ width: '100%' }} align="start">
                  <Input
                    value={c}
                    placeholder={`Criterion ${i + 1}`}
                    onChange={(e) => handleCriterionChange(i, e.target.value)}
                    readOnly={!editable}
                    bordered={editable}
                    style={{ flex: 1, backgroundColor: editable ? undefined : 'transparent' }}
                  />
                  {allowAddRemove && editable && criteria.length > 2 && (
                    <Button danger onClick={() => handleRemoveCriterion(i)}>−</Button>
                  )}
                </Space>
              </Form.Item>
            ))}
            {allowAddRemove && editable && criteria.length < 5 && (
              <Button type="dashed" onClick={handleAddCriterion} block>
                + Add Criterion
              </Button>
            )}
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default BwmInput;

