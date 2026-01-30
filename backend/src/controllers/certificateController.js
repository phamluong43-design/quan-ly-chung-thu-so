const sql = require('mssql');
const poolPromise = require('../config/db');
const XLSX = require('xlsx');
const transporter = require('../utils/email');  // Dùng transporter chung đã config đúng và verify thành công

// 1. Lấy tất cả chứng thư
const getAllCertificates = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM dbo.Certificates ORDER BY expiryDate ASC');
    console.log('Dữ liệu trả về từ DB:', result.recordset.length, 'bản ghi');
    res.json(result.recordset);
  } catch (err) {
    console.error('Lỗi getAllCertificates:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách chứng thư' });
  }
};

// 2. Thêm mới chứng thư
const createCertificate = async (req, res) => {
  try {
    const { serialNumber, certificateName, email, unitName, issueDate, expiryDate, status } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('certificateName', sql.NVarChar, certificateName)
      .input('email', sql.NVarChar, email)
      .input('unitName', sql.NVarChar, unitName || null)
      .input('issueDate', sql.Date, issueDate || null)
      .input('expiryDate', sql.Date, expiryDate || null)
      .input('status', sql.NVarChar, status || 'active')
      .query(`
        INSERT INTO dbo.Certificates (serialNumber, certificateName, email, unitName, issueDate, expiryDate, status)
        VALUES (@serialNumber, @certificateName, @email, @unitName, @issueDate, @expiryDate, @status)
      `);

    res.status(201).json({ message: 'Thêm chứng thư thành công' });
  } catch (err) {
    console.error('Lỗi createCertificate:', err);
    let message = 'Lỗi khi thêm chứng thư';
    if (err.number === 2627) { // UNIQUE KEY violation
      message = 'Serial Number đã tồn tại. Vui lòng dùng giá trị khác!';
    }
    res.status(500).json({ error: message });
  }
};

// 3. Sửa chứng thư
const updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { serialNumber, certificateName, email, unitName, issueDate, expiryDate, status } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('serialNumber', sql.NVarChar, serialNumber)
      .input('certificateName', sql.NVarChar, certificateName)
      .input('email', sql.NVarChar, email)
      .input('unitName', sql.NVarChar, unitName || null)
      .input('issueDate', sql.Date, issueDate || null)
      .input('expiryDate', sql.Date, expiryDate || null)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE dbo.Certificates
        SET serialNumber = @serialNumber,
            certificateName = @certificateName,
            email = @email,
            unitName = @unitName,
            issueDate = @issueDate,
            expiryDate = @expiryDate,
            status = @status
        WHERE id = @id
      `);

    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error('Lỗi updateCertificate:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật' });
  }
};

// 4. Xóa / Thu hồi
const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.Certificates WHERE id = @id');

    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error('Lỗi deleteCertificate:', err);
    res.status(500).json({ error: 'Lỗi khi xóa' });
  }
};

// 5. Import từ Excel
const importExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Không có file được upload' });

    console.log('File upload nhận được:', req.file.originalname, 'size:', req.file.size);

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (data.length === 0) return res.status(400).json({ error: 'File Excel rỗng hoặc không có dữ liệu' });

    console.log('Số dòng dữ liệu đọc được:', data.length);

    const pool = await poolPromise;
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      // Bỏ qua nếu thiếu serialNumber (bắt buộc)
      if (!row.serialNumber) {
        console.log('Bỏ qua dòng thiếu serialNumber:', row);
        skippedCount++;
        continue;
      }

      // Kiểm tra trùng serialNumber
      const check = await pool.request()
        .input('serialNumber', sql.NVarChar, row.serialNumber)
        .query('SELECT COUNT(*) AS count FROM dbo.Certificates WHERE serialNumber = @serialNumber');

      if (check.recordset[0].count > 0) {
        console.log(`Trùng serialNumber, bỏ qua: ${row.serialNumber}`);
        skippedCount++;
        continue;
      }

      // Insert bản ghi mới
      await pool.request()
        .input('serialNumber', sql.NVarChar, row.serialNumber)
        .input('certificateName', sql.NVarChar, row.certificateName || null)
        .input('email', sql.NVarChar, row.email || null)
        .input('unitName', sql.NVarChar, row.unitName || null)
        .input('issueDate', sql.Date, row.issueDate ? new Date(row.issueDate) : null)
        .input('expiryDate', sql.Date, row.expiryDate ? new Date(row.expiryDate) : null)
        .input('status', sql.NVarChar, row.status || 'active')
        .query(`
          INSERT INTO dbo.Certificates (serialNumber, certificateName, email, unitName, issueDate, expiryDate, status)
          VALUES (@serialNumber, @certificateName, @email, @unitName, @issueDate, @expiryDate, @status)
        `);

      importedCount++;
      console.log(`Đã import thành công: ${row.serialNumber}`);
    }

    res.status(200).json({
      message: `Import thành công ${importedCount} bản ghi! Bỏ qua ${skippedCount} dòng (trùng hoặc thiếu dữ liệu).`,
      imported: importedCount,
      skipped: skippedCount
    });
  } catch (err) {
    console.error('Lỗi importExcel:', err);
    res.status(500).json({ error: 'Lỗi import: ' + err.message });
  }
};

// 6. Gửi email gia hạn thủ công (khi click icon gia hạn)
const sendRenewalEmail = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          serialNumber, 
          certificateName AS ownerName,  -- Alias để dùng chung với email template
          email, 
          expiryDate, 
          status
        FROM dbo.Certificates 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chứng thư' });
    }

    const cert = result.recordset[0];

    // Logic gia hạn: +1 năm (chị có thể thay đổi thành +3 năm hoặc theo quy định CA)
    const newExpiry = new Date(cert.expiryDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    await pool.request()
      .input('id', sql.Int, id)
      .input('newExpiry', sql.Date, newExpiry)
      .query(`
        UPDATE dbo.Certificates 
        SET expiryDate = @newExpiry, status = 'active' 
        WHERE id = @id
      `);

    // Gửi email nếu có địa chỉ
    if (cert.email && cert.email.trim() !== '') {
      const mailOptions = {
        from: `"Hệ thống Quản lý CTS - Thuế HP" <${process.env.SMTP_USER}>`,
        to: cert.email,
        subject: `Xác nhận gia hạn thành công - Chứng thư số ${cert.serialNumber}`,
        text: `
Kính gửi ${cert.ownerName || 'Quý cán bộ'},

Chứng thư số ${cert.serialNumber} đã được gia hạn thành công.
Ngày hết hạn mới: ${newExpiry.toLocaleDateString('vi-VN')}

Cảm ơn quý vị đã sử dụng hệ thống!
Trân trọng,
Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng
        `.trim(),
        html: `
          <h3 style="color: #2e7d32;">✅ XÁC NHẬN GIA HẠN THÀNH CÔNG</h3>
          <p>Chứng thư số <strong>${cert.serialNumber}</strong> đã được gia hạn.</p>
          <p>Ngày hết hạn mới: <strong>${newExpiry.toLocaleDateString('vi-VN')}</strong></p>
          <hr>
          <small>Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng</small>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email xác nhận gia hạn gửi thành công đến ${cert.email}`);
    }

    res.json({ 
      message: 'Gia hạn thành công', 
      newExpiryDate: newExpiry.toISOString().split('T')[0] 
    });
  } catch (error) {
    console.error('Lỗi gia hạn & gửi email:', error.message);
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
};

module.exports = {
  getAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  importExcel,
  sendRenewalEmail,
};