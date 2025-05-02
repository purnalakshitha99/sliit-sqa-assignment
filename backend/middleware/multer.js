// backend/middleware/multer.js
const multer = require('multer');

// Configure multer to store files in memory instead of disk
const storage = multer.memoryStorage();

// Create the multer instance with memory storage configuration
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

module.exports = upload;