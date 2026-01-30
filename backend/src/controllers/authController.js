// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const poolPromise = require('../config/db');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', username)
      .query(`
        SELECT Id, Username, PasswordHash, HoTen, Email, VaiTro, IsActive 
        FROM dbo.NguoiDung 
        WHERE Username = @username AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc bị khóa' });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu (PasswordHash đã được bcrypt hash)
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user.Id, 
        username: user.Username, 
        fullName: user.HoTen, 
        role: user.VaiTro 
      },
      process.env.JWT_SECRET || 'super_secret_key_very_long_and_random_2026',
      { expiresIn: '1d' } // Token hết hạn sau 1 ngày
    );

    res.json({ 
      token,
      user: { 
        username: user.Username, 
        fullName: user.HoTen, 
        role: user.VaiTro 
      }
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err.message || err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

module.exports = { login };