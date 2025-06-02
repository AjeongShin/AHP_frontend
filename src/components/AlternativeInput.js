import React from 'react';
import { Input, Typography } from 'antd';
const { Text } = Typography;

const AlternativeInput = ({ alternatives, setAlternatives, editable }) => {
  const handleChange = (index, value) => {
    const updated = [...alternatives];
    updated[index] = value;
    setAlternatives(updated);
  };

  return (
    <>
      {alternatives.map((alt, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <Text>Option {i + 1}</Text>
          <Input
            value={alt}
            onChange={(e) => handleChange(i, e.target.value)}
            disabled={!editable}
          />
        </div>
      ))}
    </>
  );
};

export default AlternativeInput;
