// src/routes/authRoutes.js
const express = require('express');
const { login } = require('../controllers/authController'); // Giả sử bạn đã có file authController.js

const router = express.Router();

// Route đăng nhập
router.post('/login', login);

module.exports = router;