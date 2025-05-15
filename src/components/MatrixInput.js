// // 📁 src/components/MatrixInput.js
// import React from 'react';
// import { Typography, Table } from 'antd';

// const { Title } = Typography;

// const MatrixInput = ({ matrix, criteria }) => {
//   const columns = [
//     {
//       title: '#',
//       dataIndex: 'rowHeader',
//       key: 'rowHeader',
//       fixed: 'left'
//     },
//     ...criteria.map((c, i) => ({
//       title: c,
//       dataIndex: `col${i}`,
//       key: `col${i}`,
//       align: 'center'
//     }))
//   ];

//   const dataSource = matrix.map((row, i) => {
//     const rowObj = { rowHeader: criteria[i] };
//     row.forEach((val, j) => {
//       rowObj[`col${j}`] =
//       typeof val === 'number' && !isNaN(val)
//         ? Math.round(val * 100) / 100
//         : '-';
//     });
//     return { key: i, ...rowObj };
//   });

//   return (
//     <div>
//       <Title level={5}>Generated AHP Matrix (Fractional View)</Title>
//       <Table
//         dataSource={dataSource}
//         columns={columns}
//         pagination={false}
//         bordered
//         size="small"
//       />
//     </div>
//   );
// };

// export default MatrixInput;

