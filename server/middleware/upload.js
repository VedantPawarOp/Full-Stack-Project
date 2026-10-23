// ===================================================================
// multer file-upload middleware, backed by the Node.js `fs` module
// (Unit 3: "Node.js File System & Events ... Upload Files").
// Saves team logos to /public/uploads and rejects anything that isn't
// a small image, which also demonstrates basic server-side validation.
// ===================================================================
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // fs API, Unit 3
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    cb(null, safeName);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only PNG, JPEG or WEBP logos are allowed'));
  }
  cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = upload;
