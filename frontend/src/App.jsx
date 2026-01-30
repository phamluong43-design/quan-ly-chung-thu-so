// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CertificateManagementPage from './pages/CertificateManagementPage';
import SearchSupportPage from './pages/SearchSupportPage';      // ← Đã thêm trang Tra cứu và hỗ trợ
import { useContext } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Đang tải...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Trang đăng nhập - không cần bảo vệ */}
          <Route path="/login" element={<Login />} />

          {/* Tất cả các trang đã đăng nhập sẽ dùng Layout chung */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Trang mặc định sau khi đăng nhập thành công */}
            <Route index element={<Dashboard />} />

            {/* Tổng quan */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Quản lý thông tin chứng thư số */}
            <Route 
              path="certificate-management" 
              element={<CertificateManagementPage />} 
            />

            {/* Tra cứu và hỗ trợ */}
            <Route 
              path="search-support" 
              element={<SearchSupportPage />} 
            />

            {/* Quản lý hệ thống - đang xây dựng */}
            <Route 
              path="system-management" 
              element={<div>Trang Quản lý hệ thống - Đang xây dựng</div>} 
            />

            {/* Nếu truy cập route không tồn tại → chuyển về Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Nếu truy cập bất kỳ đường dẫn nào mà chưa đăng nhập → về trang login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;