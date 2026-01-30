const express = require('express');
const multer = require('multer');
const {
  getAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  importExcel,
  sendRenewalEmail,
} = require('../controllers/certificateController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// API routes
router.get('/', getAllCertificates);
router.post('/', createCertificate);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);
router.post('/import', upload.single('file'), importExcel);
router.post('/renew/:id', sendRenewalEmail);

module.exports = router;