// src/utils/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false  // Giữ cho local, production nên remove hoặc config cert đúng
  }
});

// Optional: Verify khi load module (giúp debug sớm)
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter config error:', error.message);
  } else {
    console.log('Email transporter ready and verified');
  }
});

module.exports = transporter;