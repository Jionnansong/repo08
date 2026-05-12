const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function getFiles(req, res) {
  try {
    const isUserAdmin = req.user.role === 'admin';
    const whereClause = isUserAdmin ? {} : { userId: req.user.id };

    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(files.map(f => ({
      id: f.id,
      filename: f.filename,
      size: f.size,
      mimeType: f.mimeType,
      uploader: f.user.username,
      createdAt: f.createdAt
    })));
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to retrieve files list' });
  }
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, size, mimetype, filename, path: tempPath } = req.file;

  try {
    // 1. Extension Verification
    const extSetting = await prisma.setting.findUnique({ where: { key: 'allowedExtensions' } });
    const allowedExts = extSetting ? extSetting.value.toLowerCase().split(',') : [];
    const fileExt = path.extname(originalname).toLowerCase();

    if (allowedExts.length > 0 && !allowedExts.includes(fileExt)) {
      fs.unlinkSync(tempPath); // delete the uploaded file from temp storage
      return res.status(400).json({ error: `File type ${fileExt} is not allowed` });
    }

    // 2. Size Verification (Dynamic based on settings)
    const sizeSetting = await prisma.setting.findUnique({ where: { key: 'maxFileSize' } });
    const maxMB = sizeSetting ? parseInt(sizeSetting.value) : 100;
    const maxBytes = maxMB * 1024 * 1024;

    if (size > maxBytes) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: `File size exceeds the limit of ${maxMB}MB` });
    }

    // Save record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: originalname,
        path: filename, // store the generated unique path filename
        size: size,
        mimeType: mimetype,
        userId: req.user.id
      }
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        createdAt: fileRecord.createdAt
      }
    });
  } catch (err) {
    console.error('Error handling upload:', err);
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    res.status(500).json({ error: 'Internal server error during upload process' });
  }
}

async function downloadFile(req, res) {
  const { id } = req.params;
  const fileId = parseInt(id);

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { user: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions (only owner or admin can download)
    if (req.user.role !== 'admin' && file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this file' });
    }

    const filePath = path.join(UPLOADS_DIR, file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Physical file not found on disk' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
}

async function deleteFile(req, res) {
  const { id } = req.params;
  const fileId = parseInt(id);

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && file.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this file' });
    }

    const filePath = path.join(UPLOADS_DIR, file.path);
    
    // Delete database record first
    await prisma.file.delete({
      where: { id: fileId }
    });

    // Unlink file from storage if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}

module.exports = {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  UPLOADS_DIR
};
