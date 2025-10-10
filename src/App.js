import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
// import { Layout } from 'antd'; // Ant Design Layout은 각 컴포넌트에서 사용

function App() {
  return (
    // 애플리케이션 전체를 BrowserRouter로 감싸 라우팅 활성화
    <BrowserRouter>
      {/* Routes는 Route들을 그룹화 */}
      <Routes>
        {/* "/" 경로에 Home 컴포넌트를 연결 */}
        <Route path="/" element={<Home />} />
        
        {/* "/calculator" 경로에 Calculator 컴포넌트를 연결 */}
        <Route path="/calculator" element={<Calculator />} />
        
        {/* 기타 경로가 없는 경우를 위한 404 처리 (선택 사항) */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;