import multer from 'multer';

/**
 * Multer configuration for image uploads
 * Uses MEMORY storage (not disk) - collaboration-safe
 */

// Memory storage - files stored as Buffer in memory
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter for ID cards - allow images and PDFs
const idCardFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed for ID cards.'), false);
  }
};

// Configure multer for posts/images
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Configure multer for student ID cards (images + PDFs)
export const uploadIdCard = multer({
  storage,
  fileFilter: idCardFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// File filter for messaging - allow images, documents, and audio
const messagingFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images, PDFs, documents, and audio files.`), false);
  }
};

// Configure multer for messaging files (images, documents)
export const uploadMessageFile = multer({
  storage,
  fileFilter: messagingFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for message files
  },
});

// Audio-specific file filter
const audioFileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid audio file type: ${file.mimetype}. Allowed: mp3, wav, m4a, ogg, webm.`), false);
  }
};

// Configure multer for voice messages
export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for audio
  },
});

export default upload;

