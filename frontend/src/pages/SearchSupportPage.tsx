// src/pages/SearchSupportPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000/api/certificates';

const SearchSupportPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warn('Vui lòng nhập từ khóa tra cứu');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/search`, {
        params: { q: searchQuery },
      });
      setSearchResults(response.data || []);
    } catch (error) {
      toast.error('Lỗi khi tra cứu. Vui lòng thử lại!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCer = async () => {
    if (!selectedCertId || !uploadFile) return;

    const formData = new FormData();
    formData.append('cerFile', uploadFile);

    try {
      await axios.post(`${API_BASE}/${selectedCertId}/upload-cer`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Upload file .cer thành công!');
      handleSearch(); // Refresh kết quả
    } catch (error) {
      toast.error('Upload file .cer thất bại!');
    } finally {
      setOpenUpload(false);
      setUploadFile(null);
      setSelectedCertId(null);
    }
  };

  const handleDownloadCer = async (certId: number, fileName: string) => {
    try {
      const response = await axios.get(`${API_BASE}/${certId}/cer`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `chung-thu-${certId}.cer`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Không tải được file .cer!');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Tra cứu và hỗ trợ chứng thư số
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Tra cứu thông tin chứng thư số nhanh chóng bằng Serial, Tên chủ thể, Email, Đơn vị... 
        Xem chi tiết và tải file .cer nếu đã lưu trữ.
      </Typography>

      {/* Ô tìm kiếm */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nhập từ khóa tra cứu (Serial, Tên, Email, Đơn vị...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              variant="outlined"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Tra cứu'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Kết quả tra cứu */}
      {searchResults.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Tên chứng thư</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Đơn vị</TableCell>
                <TableCell>Ngày cấp</TableCell>
                <TableCell>Ngày hết hạn</TableCell>
                <TableCell>File .cer</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell>{cert.id}</TableCell>
                  <TableCell>{cert.serialNumber || '-'}</TableCell>
                  <TableCell>{cert.certificateName || '-'}</TableCell>
                  <TableCell>{cert.email || '-'}</TableCell>
                  <TableCell>{cert.unitName || '-'}</TableCell>
                  <TableCell>
                    {cert.issueDate
                      ? new Date(cert.issueDate).toLocaleDateString('vi-VN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {cert.expiryDate
                      ? new Date(cert.expiryDate).toLocaleDateString('vi-VN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {cert.cerFileName ? (
                      <Chip label="Đã có file .cer" color="success" size="small" />
                    ) : (
                      <Chip label="Chưa có" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {cert.cerFileName && (
                      <Tooltip title="Tải file .cer">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadCer(cert.id, cert.cerFileName)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Upload / Cập nhật file .cer">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedCertId(cert.id);
                          setOpenUpload(true);
                        }}
                      >
                        <UploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        searchQuery && !loading && (
          <Alert severity="info" sx={{ mt: 4 }}>
            Không tìm thấy chứng thư số nào khớp với từ khóa "{searchQuery}".
          </Alert>
        )
      )}

      {/* Dialog Upload .cer */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload / Cập nhật file chứng thư .cer</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".cer"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ display: 'block', marginBottom: 16 }}
            />
            <Typography variant="body2" color="text.secondary">
              Chọn file .cer tương ứng với chứng thư số ID: {selectedCertId}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleUploadCer}
            disabled={!uploadFile}
          >
            Upload file .cer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchSupportPage;