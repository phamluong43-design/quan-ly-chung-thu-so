const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,                 // false cho local, true nếu dùng Azure
    trustServerCertificate: true,   // cho dev local
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Nếu dùng Windows Authentication (Trusted Connection)
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  dbConfig.trustedConnection = true;
  delete dbConfig.user;
  delete dbConfig.password;
} else {
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
}

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('Kết nối MSSQL thành công!');
    return pool;
  })
  .catch(err => {
    console.error('Kết nối database thất bại:', err);
    process.exit(1);
  });

module.exports = poolPromise;