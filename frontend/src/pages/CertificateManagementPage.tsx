import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  DialogContentText,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Autorenew as AutorenewIcon,
  Block as BlockIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { differenceInDays } from 'date-fns';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'http://localhost:5000/api/certificates';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Alert severity="error">Có lỗi hiển thị bảng. Vui lòng reload hoặc kiểm tra console.</Alert>;
    }
    return this.props.children;
  }
}

const CertificateManagementPage = () => {
  const [openImport, setOpenImport] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(API_BASE);
      setRows(response.data || []);
    } catch (error) {
      toast.error('Không tải được danh sách chứng thư!');
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleAddOrEdit = async () => {
    if (!formData.serialNumber || !formData.certificateName || !formData.email) {
      toast.warn('Vui lòng điền Serial Number, Tên chứng thư và Email!');
      return;
    }

    try {
      if (selectedId) {
        await axios.put(`${API_BASE}/${selectedId}`, formData);
        toast.success('Cập nhật thành công!');
      } else {
        await axios.post(API_BASE, formData);
        toast.success('Thêm mới thành công!');
      }
      fetchCertificates();
    } catch (error) {
      toast.error('Lưu thất bại!');
    }

    setOpenForm(false);
    setFormData({});
    setSelectedId(null);
  };

  const handleImport = async () => {
    if (!file) return;

    const formDataImport = new FormData();
    formDataImport.append('file', file);

    try {
      await axios.post(`${API_BASE}/import`, formDataImport, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Import Excel thành công!');
      fetchCertificates();
    } catch (error) {
      toast.error('Import thất bại!');
    }

    setOpenImport(false);
    setFile(null);
  };

  const handleExport = () => {
    const headers = [
      'serialNumber',
      'certificateName',
      'email',
      'unitName',
      'issueDate',
      'expiryDate',
      'status'
    ];

    const data = rows.map(row => [
      row.serialNumber || '',
      row.certificateName || '',
      row.email || '',
      row.unitName || '',
      row.issueDate ? new Date(row.issueDate).toISOString().split('T')[0] : '',
      row.expiryDate ? new Date(row.expiryDate).toISOString().split('T')[0] : '',
      row.status || 'active'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chứng thư số');
    XLSX.writeFile(workbook, 'danh-sach-chung-thu-so.xlsx');
  };

  const handleRenew = async (row: any) => {
    try {
      await axios.post(`${API_BASE}/renew/${row.id}`);
      toast.success(`Đã gửi email xác nhận gia hạn đến ${row.email}`);
      fetchCertificates();
    } catch (error) {
      toast.error('Gửi email gia hạn thất bại!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Thu hồi chứng thư này?')) return;

    try {
      await axios.delete(`${API_BASE}/${id}`);
      toast.success('Thu hồi thành công!');
      fetchCertificates();
    } catch (error) {
      toast.error('Thu hồi thất bại!');
    }
  };

  const handleTriggerWarningNow = async () => {
    if (!window.confirm('Bạn có chắc muốn gửi NGAY thông báo cảnh báo hết hạn cho tất cả chứng thư sắp hết hạn không?')) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/trigger-warning-now`);
      toast.success(response.data.message || 'Đã gửi cảnh báo thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gửi cảnh báo thất bại!');
    }
  };

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !searchText ||
      row.certificateName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.serialNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'serialNumber', headerName: 'Serial Number', width: 180 },
    {
      field: 'certificateName',
      headerName: 'Tên chứng thư số',
      width: 320,
      flex: 1,
    },
    { field: 'email', headerName: 'Email', width: 240 },
    { field: 'unitName', headerName: 'Đơn vị', width: 220 },
    {
      field: 'issueDate',
      headerName: 'Ngày cấp',
      width: 140,
      type: 'date',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
    },
    {
      field: 'expiryDate',
      headerName: 'Ngày hết hạn',
      width: 160,
      type: 'date',
      valueGetter: (value) => value ? new Date(value) : null,
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        const expiry = new Date(params.value);
        const today = new Date();
        const daysLeft = differenceInDays(expiry, today);

        let color = 'inherit';
        let fontWeight = 'normal';

        if (daysLeft < 0) {
          color = 'error.main';
          fontWeight = 'bold';
        } else if (daysLeft <= 7) {
          color = 'error.main';
          fontWeight = 'bold';
        } else if (daysLeft <= 30) {
          color = 'warning.main';
          fontWeight = 'medium';
        }

        return (
          <Typography color={color} fontWeight={fontWeight}>
            {params.formattedValue}
          </Typography>
        );
      },
    },
    {
      field: 'daysLeft',
      headerName: 'Còn lại',
      width: 130,
      sortable: true,
      valueGetter: (value, row) => {
        if (!row.expiryDate) return Infinity;
        const expiry = new Date(row.expiryDate);
        if (isNaN(expiry.getTime())) return Infinity;
        return differenceInDays(expiry, new Date());
      },
      renderCell: (params) => {
        const days = params.value;
        if (days === Infinity) return '-';
        if (days < 0) return `Hết hạn ${Math.abs(days)} ngày`;
        return `${days} ngày`;
      },
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        let color: 'success' | 'warning' | 'error' | 'default' = 'default';
        let label = '';

        switch (params.row?.status) {
          case 'active':
            color = 'success';
            label = 'Đang hoạt động';
            break;
          case 'expiring':
            color = 'warning';
            label = 'Sắp hết hạn';
            break;
          case 'expired':
            color = 'error';
            label = 'Hết hạn';
            break;
          case 'revoked':
            color = 'error';
            label = 'Đã thu hồi';
            break;
          default:
            label = params.row?.status || 'Không xác định';
        }

        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="Xem chi tiết">
            <IconButton size="small" color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sửa">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedId(params.row?.id);
                setFormData(params.row);
                setOpenForm(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gia hạn (gửi email xác nhận)">
            <IconButton size="small" color="success" onClick={() => handleRenew(params.row)}>
              <AutorenewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thu hồi">
            <IconButton size="small" color="error" onClick={() => handleDelete(params.row?.id)}>
              <BlockIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Quản lý thông tin chứng thư số
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quản lý vòng đời chứng thư số của các đơn vị thuộc Thuế TP. Hải Phòng
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
        <TextField
          label="Tìm kiếm nhanh"
          placeholder="Tên chứng thư, Serial, Email..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 320 }}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="active">Đang hoạt động</MenuItem>
            <MenuItem value="expiring">Sắp hết hạn</MenuItem>
            <MenuItem value="expired">Hết hạn</MenuItem>
            <MenuItem value="revoked">Đã thu hồi</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setOpenForm(true);
              setFormData({});
              setSelectedId(null);
            }}
          >
            Thêm chứng thư mới
          </Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setOpenImport(true)}>
            Import từ Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
            Xuất báo cáo
          </Button>

          <Tooltip title="Kiểm tra toàn bộ chứng thư và gửi NGAY email cảnh báo hết hạn (30/15/7 ngày) cho người sử dụng">
            <Button
              variant="contained"
              color="error"
              startIcon={<WarningAmberIcon />}
              onClick={handleTriggerWarningNow}
              sx={{ fontWeight: 'bold' }}
            >
              Gửi cảnh báo hết hạn NGAY
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ height: 650, width: '100%' }}>
        <ErrorBoundary>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSizeOptions={[10, 20, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
              sorting: { sortModel: [{ field: 'expiryDate', sort: 'asc' }] },
            }}
            getRowClassName={(params) => {
              const days = differenceInDays(new Date(params.row.expiryDate), new Date());
              if (days < 0) return 'row-expired';
              if (days <= 30) return 'row-expiring';
              return '';
            }}
            sx={{
              border: 0,
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f5f5f5' },
              '& .row-expiring': { bgcolor: '#fff3cd !important' },
              '& .row-expired': { bgcolor: '#f8d7da !important' },
            }}
          />
        </ErrorBoundary>
      </Box>

      <Dialog open={openImport} onClose={() => setOpenImport(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import chứng thư số từ file Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Tải file mẫu Excel để điền thông tin chuẩn (định dạng .xlsx):
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              href="/templates/mau-chung-thu-so.xlsx"
              download
            >
              Tải mẫu Excel
            </Button>
          </Box>

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 5,
              textAlign: 'center',
              mb: 3,
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              id="excel-upload"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="excel-upload">
              <Button variant="contained" component="span" startIcon={<UploadIcon />}>
                Chọn file Excel
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Hoặc kéo thả file vào đây
            </Typography>
          </Box>

          <Alert severity="info">
            Hệ thống sẽ tự động kiểm tra trùng lặp serial number và các trường bắt buộc. Dữ liệu không hợp lệ sẽ được đánh dấu để bạn xem xét trước khi xác nhận import.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImport(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleImport} disabled={!file}>
            Xác nhận import
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedId ? 'Sửa chứng thư số' : 'Thêm chứng thư số mới'}</DialogTitle>
        <DialogContent>
          <DialogContentText>Điền đầy đủ thông tin bên dưới</DialogContentText>

          <TextField
            label="Serial Number"
            value={formData.serialNumber || ''}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Tên chứng thư số"
            value={formData.certificateName || ''}
            onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Đơn vị"
            value={formData.unitName || ''}
            onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Ngày cấp (YYYY-MM-DD)"
            value={formData.issueDate || ''}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Ngày hết hạn (YYYY-MM-DD)"
            value={formData.expiryDate || ''}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            fullWidth
            margin="dense"
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={formData.status || ''}
              label="Trạng thái"
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="active">Đang hoạt động</MenuItem>
              <MenuItem value="expiring">Sắp hết hạn</MenuItem>
              <MenuItem value="expired">Hết hạn</MenuItem>
              <MenuItem value="revoked">Đã thu hồi</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleAddOrEdit}>
            {selectedId ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CertificateManagementPage;