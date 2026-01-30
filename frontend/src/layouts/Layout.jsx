import React, { useContext } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  CssBaseline,
} from '@mui/material';
import { Outlet, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 280;

const Layout = () => {
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { text: 'Tổng quan', icon: <DashboardIcon />, link: '/dashboard' },
    { text: 'Quản lý hệ thống', icon: <SettingsIcon />, link: '/system-management' },
    { text: 'Quản lý thông tin chứng thư số', icon: <SecurityIcon />, link: '/certificate-management' },
    { text: 'Tra cứu và hỗ trợ', icon: <SearchIcon />, link: '/search-support' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflowX: 'hidden', // Ngăn scroll ngang toàn trang
      }}
    >
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'black',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar sx={{ minHeight: '80px', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src="https://images2.thanhnien.vn/zoom/1200_630/Uploaded/2014/Picture20118/Nam/2808/qh11.jpg"
              alt="Quốc huy Việt Nam"
              sx={{ height: 48, width: 'auto', objectFit: 'contain', mr: 2.5 }}
            />
            <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
              HỆ THỐNG QUẢN LÝ CHỨNG THƯ SỐ - THUẾ THÀNH PHỐ HẢI PHÒNG
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 2, fontWeight: 500 }}>
              {user?.username || 'Người dùng'}
            </Typography>
            <Avatar sx={{ bgcolor: '#da251d', width: 40, height: 40 }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, mt: '80px' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: '#002b5c',
              color: 'white',
              borderRight: 'none',
              // Bỏ height cố định để sidebar tự động full theo nội dung
              // Thay vào đó dùng minHeight để luôn full
              minHeight: '100%',
              // Để sidebar dính theo nội dung khi scroll
              position: 'sticky',
              top: 80, // bằng chiều cao AppBar
              height: 'calc(100vh - 80px)', // vẫn giữ full viewport nhưng cho phép vượt nếu cần
              overflowY: 'auto',
            },
          }}
        >
          <List sx={{ pt: 2, pb: 4, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.link}
                  sx={{
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    py: 1.6,
                    px: 3,
                    borderRadius: '0 12px 12px 0',
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 48 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}

            {/* Đẩy nút Đăng xuất xuống dưới cùng */}
            <Box sx={{ flexGrow: 1 }} /> {/* Khoảng trống đẩy xuống */}
            <ListItem disablePadding sx={{ mt: 'auto', mb: 2 }}>
              <ListItemButton
                onClick={logout}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                  py: 1.6,
                  px: 3,
                  borderRadius: '0 12px 12px 0',
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 48 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Đăng Xuất" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: `calc(100% - ${drawerWidth}px)`,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: '#f8f9fa',
            overflowX: 'hidden',
          }}
        >
          <Box
            sx={{
              maxWidth: 1600,
              mx: 'auto',
              width: '100%',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>

      {/* Footer comment lại để sạch sẽ - nếu cần thì uncomment */}
      {/* <Box sx={{ bgcolor: '#002b5c', color: 'white', p: 2, textAlign: 'center' }}>
        <Typography variant="body2">© Thuế thành phố Hải Phòng</Typography>
      </Box> */}
    </Box>
  );
};

export default Layout;