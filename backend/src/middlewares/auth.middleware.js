const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db.config');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, decoded.id)
      .query(`
        SELECT Id, Username, HoTen, VaiTro, MaDonVi 
        FROM NguoiDung 
        WHERE Id = @id AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc tài khoản bị khóa' });
    }

    req.user = result.recordset[0];
    next();
  } catch (err) {
    console.error('Lỗi verify token:', err);
    res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ' });
  }
};

module.exports = authMiddleware;