const bcrypt = require('bcryptjs');
bcrypt.hash('admin123', 10, (err, hash) => {
  console.log('Hash mới cho admin123:', hash);
});