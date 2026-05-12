const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authController = require('./controllers/auth');
const dashboardController = require('./controllers/dashboard');
const usersController = require('./controllers/users');
const filesController = require('./controllers/files');
const settingsController = require('./controllers/settings');

const { authenticateToken, requireAdmin } = require('./middlewares/auth');

const router = express.Router();

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesController.UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Public Routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Protected Routes (Authenticate token is applied to all below)
router.use(authenticateToken);

// Dashboard stats
router.get('/dashboard/stats', dashboardController.getStats);

// Files management
router.get('/files', filesController.getFiles);
router.post('/files/upload', upload.single('file'), filesController.uploadFile);
router.get('/files/download/:id', filesController.downloadFile);
router.delete('/files/:id', filesController.deleteFile);

// System Settings
router.get('/settings', settingsController.getSettings);
router.put('/settings', requireAdmin, settingsController.updateSettings);

// Users management (Admin only)
router.get('/users', requireAdmin, usersController.getUsers);
router.post('/users', requireAdmin, usersController.createUser);
router.put('/users/:id', requireAdmin, usersController.updateUser);
router.delete('/users/:id', requireAdmin, usersController.deleteUser);

module.exports = router;
