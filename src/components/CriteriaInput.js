// // 📁 src/components/CriteriaInput.js
// import React from 'react';
// import { Form, Input, InputNumber, Row, Col, Typography } from 'antd';

// const { Title } = Typography;

// const CriteriaInput = ({ criteria, values, setCriteria, setValues }) => {
//   const handleChange = (index, key, value) => {
//     if (key === 'criterion') {
//       const updated = [...criteria];
//       updated[index] = value;
//       setCriteria(updated);
//     } else {
//       const updated = [...values];
//       // updated[index] = parseInt(value) || 0;
//       updated[index] = value;
//       setValues(updated);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <Title level={4}>Enter Criteria and Importance (Integers Only)</Title>
//       <Form layout="vertical">
//         {criteria.map((_, i) => (
//           <Row gutter={16} key={i} style={{ marginBottom: 12 }}>
//             <Col span={12}>
//               <Form.Item label={`Criterion ${i + 1}`}>
//                 <Input
//                   value={criteria[i]}
//                   onChange={(e) => handleChange(i, 'criterion', e.target.value)}
//                   placeholder="e.g. Cost"
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//             <Form.Item label="Importance">
//               <InputNumber
//                 min={0.0}
//                 step={0.1}
//                 value={values[i]}
//                 onChange={(val) => {
//                   if (val === '' || val === null) return;
//                   if (typeof val === 'number' && !isNaN(val)) {
//                     handleChange(i, 'value', val);
//                   }
//                 }}
//                 style={{ width: '100%' }}
//               />
//             </Form.Item>
//             </Col>
//           </Row>
//         ))}
//       </Form>
//     </div>
//   );
// };

// export default CriteriaInput;