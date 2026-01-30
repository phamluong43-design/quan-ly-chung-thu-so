import React, { useState, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const { login, loading, error } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #002b5c 0%, #da251d 100%)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          p: 5,
          borderRadius: 4,
          textAlign: 'center',
          bgcolor: 'white',
          maxWidth: 420,
          width: '100%',
          mx: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        <Avatar
          sx={{
            mx: 'auto',
            mb: 3,
            width: 70,
            height: 70,
            bgcolor: '#da251d',
          }}
        >
          <LockOutlinedIcon fontSize="large" />
        </Avatar>

        <Typography variant="h4" fontWeight="bold" color="#002b5c" gutterBottom>
          ĐĂNG NHẬP HỆ THỐNG
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Quản lý chứng thư số - Thuế thành phố Hải Phòng
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Mật khẩu"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.5,
              bgcolor: '#1d95da',
              '&:hover': { bgcolor: '#1c67b7' },
              fontWeight: 'bold',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;