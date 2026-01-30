// src/pages/Dashboard.tsx
import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

// Dữ liệu mẫu - sau này thay bằng API từ backend Node.js + MSSQL
const stats = {
  active: 7842,
  expiringSoon: 218,
  expired: 45,
  urgent: 32,
};

const Dashboard = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tổng quan
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} color="primary">
          Làm mới dữ liệu
        </Button>
      </Box>

      {/* Cảnh báo khẩn cấp nếu có chứng thư cần xử lý ngay */}
      {stats.urgent > 0 && (
        <Alert severity="error" sx={{ mb: 4 }}>
          <strong>CẢNH BÁO KHẨN CẤP:</strong> Có {stats.urgent} chứng thư số cần gia hạn trong vòng dưới 7 ngày. Vui lòng kiểm tra và xử lý ngay để tránh gián đoạn!
        </Alert>
      )}

      {/* Thẻ thống kê nhanh */}
      <Grid container spacing={3}>
        {/* Đang hoạt động */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Đang hoạt động
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.active.toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2">Tổng số chứng thư</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sắp hết hạn */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Sắp hết hạn
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.expiringSoon.toLocaleString()}
              </Typography>
              <Chip
                label="Cảnh báo sớm (30/15/7 ngày)"
                color="warning"
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Đã hết hạn */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ bgcolor: '#ffebee', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Đã hết hạn
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {stats.expired.toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2">Cần xử lý ngay</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Khẩn cấp (dưới 7 ngày) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Khẩn cấp (dưới 7 ngày)
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.dark">
                {stats.urgent}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <WarningAmberIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2">Email cảnh báo đã gửi</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phần mở rộng sau này: Biểu đồ và danh sách sắp hết hạn */}
      {/* 
        - Thêm PieChart (phân bố trạng thái) và BarChart (xu hướng) bằng Recharts
        - Thêm bảng top 10 chứng thư sắp hết hạn với nút "Gia hạn ngay"
        Nếu bạn muốn thêm ngay, mình sẽ gửi code bổ sung (cần cài npm install recharts)
      */}

    </Box>
  );
};

export default Dashboard;