/**
 * File Upload Utility
 * Handles file uploads and storage for homework submissions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const HOMEWORK_DIR = path.join(UPLOADS_DIR, 'homework');

/**
 * Ensure upload directories exist
 */
const ensureUploadDirs = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(HOMEWORK_DIR)) {
    fs.mkdirSync(HOMEWORK_DIR, { recursive: true });
  }
};

/**
 * Generate unique filename
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const hash = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `${nameWithoutExt}_${timestamp}_${hash}${ext}`;
};

/**
 * Save uploaded file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} subDir - Subdirectory (e.g., 'submissions')
 * @returns {Object} File info with path and url
 */
const saveUploadedFile = (fileBuffer, originalName, subDir = 'submissions') => {
  try {
    ensureUploadDirs();

    const filename = generateUniqueFilename(originalName);
    // Use UPLOADS_DIR as base, not HOMEWORK_DIR, to avoid double paths
    const fileDir = path.join(UPLOADS_DIR, 'homework', subDir);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    const filePath = path.join(fileDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    const relativePath = path.relative(path.join(__dirname, '../../'), filePath);
    const url = `/uploads/homework/${subDir}/${filename}`;

    return {
      name: originalName,
      filename: filename,
      path: filePath,
      url: url,
      size: fileBuffer.length,
      uploadedAt: new Date()
    };
  } catch (error) {
    throw new Error(`Failed to save uploaded file: ${error.message}`);
  }
};

/**
 * Delete uploaded file
 * @param {string} filePath - File path to delete
 * @returns {boolean} True if deleted successfully
 */
const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file: ${error.message}`);
    return false;
  }
};

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Max allowed size in bytes (default 50MB)
 * @returns {boolean} True if valid
 */
const validateFileSize = (fileSize, maxSize = 50 * 1024 * 1024) => {
  return fileSize <= maxSize;
};

/**
 * Validate file type
 * @param {string} mimeType - MIME type
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if valid
 */
const validateFileType = (mimeType, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
  return allowedTypes.includes(mimeType);
};

/**
 * Get file info
 * @param {string} filePath - File path
 * @returns {Object} File info or null
 */
const getFileInfo = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);

    return {
      filename: filename,
      path: filePath,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    console.error(`Failed to get file info: ${error.message}`);
    return null;
  }
};

/**
 * Process multiple uploaded files
 * @param {Array} files - Array of uploaded files
 * @param {string} subDir - Subdirectory
 * @returns {Array} Array of file info objects
 */
const processUploadedFiles = (files, subDir = 'submissions') => {
  if (!Array.isArray(files)) {
    files = [files];
  }

  return files
    .filter(file => file && file.buffer)
    .map(file => {
      if (!validateFileSize(file.size)) {
        throw new Error(`File ${file.originalname} exceeds maximum allowed size`);
      }
      if (!validateFileType(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} not allowed for ${file.originalname}`);
      }
      return saveUploadedFile(file.buffer, file.originalname, subDir);
    });
};

module.exports = {
  ensureUploadDirs,
  generateUniqueFilename,
  saveUploadedFile,
  deleteUploadedFile,
  validateFileSize,
  validateFileType,
  getFileInfo,
  processUploadedFiles,
  UPLOADS_DIR,
  HOMEWORK_DIR
};
