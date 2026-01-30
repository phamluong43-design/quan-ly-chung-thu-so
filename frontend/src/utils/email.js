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
  tls: { rejectUnauthorized: false }
});

// Verify một lần khi load (optional, nhưng hữu ích)
transporter.verify((error) => {
  if (error) console.error('Email config error:', error);
  else console.log('Email transporter ready');
});

module.exports = transporter;