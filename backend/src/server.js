const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();
const cron = require('node-cron');
const transporter = require('./utils/email');  // ← Import transporter chung

const certificateRoutes = require('./routes/certificateRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Cấu hình CORS chi tiết cho frontend Vite
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend OK! Đăng nhập tại /api/auth/login' });
});

// ==================== CRON JOB GỬI THÔNG BÁO CHỨNG THƯ SỐ SẮP HẾT HẠN ====================
cron.schedule('0 8 * * *', async () => {
  console.log('🕗 Bắt đầu kiểm tra chứng thư số sắp hết hạn...');

  try {
    const pool = await sql.connect({
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 1433),
      options: { encrypt: false, trustServerCertificate: true }
    });

    const result = await pool.request().query(`
      SELECT 
        serialNumber,
        certificateName,  -- Sử dụng certificateName làm tên chủ thể (fallback nếu không có ownerName)
        unitName,         -- Fallback thêm nếu cần
        email,
        expiryDate,
        DATEDIFF(DAY, GETDATE(), expiryDate) AS daysLeft
      FROM dbo.Certificates
      WHERE expiryDate IS NOT NULL
  AND DATEDIFF(DAY, GETDATE(), expiryDate) BETWEEN 0 AND 45  -- linh hoạt hơn, bao gồm hôm nay
  AND status = 'active'
  AND email IS NOT NULL AND email != ''
      ORDER BY expiryDate ASC
    `);

    if (result.recordset.length === 0) {
      console.log('Không có chứng thư nào sắp hết hạn trong 30 ngày tới.');
      return;
    }

    console.log(`Phát hiện ${result.recordset.length} chứng thư sắp hết hạn. Đang gửi thông báo chủ động...`);

    for (const cert of result.recordset) {
      const daysLeft = cert.daysLeft;

      // Chỉ gửi ở các mốc quan trọng
      if ([30, 15, 7].includes(daysLeft)) {
        const ownerDisplay = cert.certificateName || cert.unitName || 'Anh Chị/ Đơn vị';

        const mailOptions = {
          from: `"Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng" <${process.env.SMTP_USER}>`,
          to: cert.email,
          // cc: 'phamthi@haiphong.gdt.gov.vn', // Bật nếu cần gửi thêm cho lãnh đạo
          subject: `THÔNG BÁO: Chứng thư số sắp hết hạn sau ${daysLeft} ngày - Vui lòng chủ động gia hạn`,
          text: `
Kính gửi ${ownerDisplay},

Hệ thống Quản lý Chứng thư số (Thuế TP. Hải Phòng) thông báo:

Chứng thư số của Quý vị sẽ hết hạn trong ${daysLeft} ngày nữa.

Thông tin chi tiết:
- Số serial chứng thư: ${cert.serialNumber}
- Chủ thể / Đơn vị: ${ownerDisplay}
- Ngày hết hạn: ${new Date(cert.expiryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}

Việc chứng thư số hết hạn sẽ gây gián đoạn nghiêm trọng các thủ tục kê khai thuế điện tử (eTax), hóa đơn điện tử (TMS), và các giao dịch điện tử khác.

**Quý vị vui lòng chủ động thực hiện gia hạn chứng thư số kịp thời** trước ngày hết hạn để đảm bảo công việc hành chính không bị ảnh hưởng và tuân thủ quy định về chứng thực điện tử.

Nếu cần hỗ trợ, Quý vị có thể liên hệ bộ phận Công nghệ thông tin Thuế TP Hải Phòng hoặc tra cứu hướng dẫn sử dụng tại hệ thống.

Trân trọng thông báo!

Hệ thống Quản lý Chứng thư số
Thuế thành phố Hải Phòng
          `.trim(),

          html: `
            <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9;">
              <h2 style="color: #c62828; text-align: center; margin-bottom: 20px;">THÔNG BÁO CHỨNG THƯ SỐ SẮP HẾT HẠN</h2>
              
              <p>Kính gửi <strong>${ownerDisplay}</strong>,</p>
              
              <p style="font-size: 16px;">Hệ thống Quản lý Chứng thư số thông báo:</p>
              <p style="font-size: 18px; font-weight: bold; color: #c62828;">
                Chứng thư số của Quý vị sẽ hết hạn sau <u>${daysLeft} ngày</u>.
              </p>

              <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white;">
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Số serial:</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${cert.serialNumber}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Chủ thể / Đơn vị:</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${ownerDisplay}</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>Ngày hết hạn:</strong></td><td style="padding: 10px; border: 1px solid #ddd;">${new Date(cert.expiryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td></tr>
              </table>

              <p style="color: #c62828; font-weight: bold; line-height: 1.5;">
                Việc hết hạn chứng thư số sẽ gây gián đoạn các thủ tục thuế điện tử.<br>
                <span style="font-size: 16px;">Vui lòng chủ động gia hạn ngay để tránh ảnh hưởng công việc!</span>
              </p>

              <p>Nếu cần hỗ trợ, vui lòng liên hệ bộ phận Công nghệ thông tin Thuế TP. Hải Phòng</p>

              <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">

              <small style="color: #555; font-size: 12px;">
                Đây là email tự động từ Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng.<br>
                Vui lòng không trả lời email này. Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
              </small>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`✅ Đã gửi THÔNG BÁO chủ động gia hạn (${daysLeft} ngày) đến ${cert.email} (${ownerDisplay})`);
        } catch (mailErr) {
          console.error(`❌ Lỗi gửi thông báo đến ${cert.email}:`, mailErr.message);
        }
      }
    }

    console.log('Hoàn thành gửi thông báo hết hạn');
  } catch (error) {
    console.error('Lỗi trong cron job:', error.message);
  }
}, { timezone: "Asia/Ho_Chi_Minh" });

console.log('Cron job cảnh báo hết hạn đã khởi động (8:00 sáng hàng ngày)');

// Test email route
app.get('/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'ptluong.hdu@gdt.gov.vn',
      subject: 'Test Email từ Hệ thống CTS',
      text: 'Đây là email test - chức năng cảnh báo hết hạn đang hoạt động!'
    });
    res.json({ message: 'Email test đã gửi thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==================== ROUTE MỚI: GỬI CẢNH BÁO THỦ CÔNG NGAY LẬP TỨC (khi click nút) ====================
app.get('/api/certificates/trigger-warning-now', async (req, res) => {
  console.log('⚡ Người dùng kích hoạt gửi cảnh báo thủ công NGAY LẬP TỨC (trong 45 ngày)...');

  try {
    const pool = await sql.connect({
      server: process.env.DB_SERVER,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 1433),
      options: { encrypt: false, trustServerCertificate: true }
    });

    const result = await pool.request().query(`
      SELECT 
        serialNumber,
        certificateName,
        unitName,
        email,
        expiryDate,
        DATEDIFF(DAY, GETDATE(), expiryDate) AS daysLeft
      FROM dbo.Certificates
      WHERE expiryDate IS NOT NULL
        AND DATEDIFF(DAY, GETDATE(), expiryDate) BETWEEN 0 AND 45   -- Linh hoạt: còn 0 đến 45 ngày
        AND status = 'active'
        AND email IS NOT NULL AND email != ''
      ORDER BY expiryDate ASC
    `);

    if (result.recordset.length === 0) {
      console.log('Không có chứng thư nào còn trong vòng 45 ngày tới (hoặc không thỏa status/email).');
      return res.json({ 
        message: 'Không có chứng thư nào còn trong vòng 45 ngày tới (hoặc không thỏa status/email).',
        sent: 0,
        debug: 'Kiểm tra status = active và email có giá trị trong DB'
      });
    }

    let sentCount = 0;
    for (const cert of result.recordset) {
      const daysLeft = cert.daysLeft;
      const ownerDisplay = cert.certificateName || cert.unitName || 'Quý cán bộ';

      const mailOptions = {
        from: `"Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng" <${process.env.SMTP_USER}>`,
        to: cert.email,
        subject: `CẢNH BÁO KHẨN: Chứng thư số còn ${daysLeft} ngày sẽ hết hạn - Vui lòng gia hạn NGAY!`,
        text: `
Kính gửi ${ownerDisplay},

[THÔNG BÁO GỬI THỦ CÔNG - ${new Date().toLocaleString('vi-VN')}]

Hệ thống phát hiện chứng thư số của Quý vị còn **${daysLeft} ngày** sẽ hết hạn.

Thông tin chi tiết:
- Số serial: ${cert.serialNumber}
- Chủ thể / Đơn vị: ${ownerDisplay}
- Ngày hết hạn: ${new Date(cert.expiryDate).toLocaleDateString('vi-VN')}

Việc hết hạn chứng thư số sẽ gây gián đoạn các thủ tục thuế điện tử (eTax, TMS, hóa đơn điện tử...).

**Quý vị vui lòng chủ động gia hạn NGAY LẬP TỨC** để tránh ảnh hưởng công việc.

Nếu cần hỗ trợ, liên hệ bộ phận CNTT Thuế TP. Hải Phòng.

Trân trọng,
Hệ thống Quản lý Chứng thư số
Thuế TP. Hải Phòng
        `.trim(),

        html: `
          <div style="font-family: Arial; padding: 20px; border: 2px solid #d32f2f; border-radius: 10px; background: #fff8f8; max-width: 600px;">
            <h2 style="color: #d32f2f; text-align: center;">⚠️ CẢNH BÁO KHẨN - GỬI THỦ CÔNG</h2>
            <p><strong>Thời gian gửi:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p style="font-size: 18px; color: #d32f2f;">
              Chứng thư số của Quý vị còn <strong>${daysLeft} ngày</strong> sẽ hết hạn!
            </p>
            <hr>
            <ul style="line-height: 1.8;">
              <li><strong>Số serial:</strong> ${cert.serialNumber}</li>
              <li><strong>Chủ thể / Đơn vị:</strong> ${ownerDisplay}</li>
              <li><strong>Ngày hết hạn:</strong> ${new Date(cert.expiryDate).toLocaleDateString('vi-VN')}</li>
            </ul>
            <p style="font-size: 17px; font-weight: bold; color: #b71c1c;">
              Vui lòng chủ động gia hạn NGAY để tránh gián đoạn công việc!
            </p>
            <p>Hỗ trợ: Liên hệ bộ phận CNTT Thuế TP. Hải Phòng</p>
            <hr>
            <small style="color: #555;">Hệ thống Quản lý Chứng thư số - Thuế TP. Hải Phòng</small>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        sentCount++;
        console.log(`Đã gửi thủ công đến ${cert.email} (còn ${daysLeft} ngày)`);
      } catch (mailErr) {
        console.error(`Lỗi gửi thủ công đến ${cert.email}:`, mailErr.message);
      }
    }

    res.json({ 
      message: `Đã kiểm tra và gửi thành công ${sentCount} thông báo cảnh báo (trong 45 ngày tới)!`,
      sent: sentCount,
      totalFound: result.recordset.length
    });

  } catch (error) {
    console.error('Lỗi gửi cảnh báo thủ công:', error.message);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi cảnh báo thủ công: ' + error.message });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend chạy tại http://localhost:${PORT}`);
});