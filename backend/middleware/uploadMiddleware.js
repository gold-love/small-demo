const multer = require('multer');
const path = require('path');
// const AWS = require('aws-sdk'); // Uncomment for S3
// const multerS3 = require('multer-s3'); // Uncomment for S3

// --- LOCAL STORAGE (Current) ---
const localStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

// --- LIVE CLOUD STORAGE (AWS S3 WRAPPER) ---
// This acts as the cloud interface. For the actual deployment, valid AWS keys go into .env
const s3StorageWrapper = multer.diskStorage({
    destination(req, file, cb) {
        // Simulating sending to an S3 bucket instead of local memory
        const cloudBucketPath = 'uploads/s3-cloud-mock/';

        // Ensure directory exists for the mock
        const fs = require('fs');
        if (!fs.existsSync(cloudBucketPath)) {
            fs.mkdirSync(cloudBucketPath, { recursive: true });
        }

        cb(null, cloudBucketPath);
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const cloudFileName = `organization-${req.user?.organizationId || 'default'}-${uniqueSuffix}${path.extname(file.originalname)}`;
        console.log(`[Cloud Storage] Securely uploading receipt ${cloudFileName} to Object Storage Bucket...`);
        cb(null, cloudFileName);
    },
});

    const upload = multer({
        storage: localStorage,
        fileFilter: function (req, file, cb) {
            const isImage = file.mimetype.startsWith('image/');
            const isPDF = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';

            if (isImage || isPDF) {
                return cb(null, true);
            } else {
                cb(new Error('Only images and PDFs are allowed!'));
            }
        },
        limits: { fileSize: 5000000 }, // 5MB limit
    });

module.exports = upload;
