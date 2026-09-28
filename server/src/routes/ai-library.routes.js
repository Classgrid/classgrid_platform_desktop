import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import multer from 'multer';
import { uploadToLibrary, getLibrary, deleteFromLibrary, getQuota } from '../controllers/ai-library.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB per file
const router = express.Router();

router.post('/upload', isAuthenticated, upload.single('file'), uploadToLibrary);
router.get('/', isAuthenticated, getLibrary);
router.delete('/:id', isAuthenticated, deleteFromLibrary);
router.get('/quota', isAuthenticated, getQuota);

export default router;
