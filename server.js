const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const UPLOAD_DIR = path.join(__dirname, 'public');

// Middleware to simulate admin access (replace with real auth later)
const isAdmin = (req, res, next) => {
  // Simple check — replace with real login/auth
  if (req.query.admin === 'true') return next();
  res.status(403).send('Forbidden');
};

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Serve uploaded files directly (no directory listing)
app.use('/files', express.static(UPLOAD_DIR));

// Admin dashboard
app.get('/admin', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Upload handler
app.post('/upload', isAdmin, upload.single('file'), async (req, res) => {
  const uploadedFile = req.file;
  const filePath = path.join(UPLOAD_DIR, uploadedFile.filename);

  // If it's a zip file, extract to a subfolder named after the zip file
  if (uploadedFile.originalname.endsWith('.zip')) {
    const folderName = path.basename(uploadedFile.originalname, '.zip');
    const extractPath = path.join(UPLOAD_DIR, folderName);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);

    fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', () => {
        fs.unlinkSync(filePath); // Remove zip after extraction
        res.redirect('/admin?admin=true');
      })
      .on('error', err => {
        console.error('Extraction error:', err);
        res.status(500).send('Failed to extract zip file.');
      });
  } else {
    res.redirect('/admin?admin=true');
  }
});


// List files for admin
app.get('/list-files', isAdmin, (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) return res.status(500).send('Error reading files');
    res.json(files);
  });
});

// Delete file
app.post('/delete-file', isAdmin, express.json(), (req, res) => {
  const fileName = req.body.name;
  const targetPath = path.join(UPLOAD_DIR, fileName);

  fs.stat(targetPath, (err, stats) => {
    if (err) return res.status(404).send('File or folder not found');

    if (stats.isDirectory()) {
      // Recursively delete folder
      fs.rm(targetPath, { recursive: true, force: true }, err => {
        if (err) return res.status(500).send('Error deleting folder');
        res.send('Folder deleted');
      });
    } else {
      // Delete file
      fs.unlink(targetPath, err => {
        if (err) return res.status(500).send('Error deleting file');
        res.send('File deleted');
      });
    }
  });
});


app.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}/admin?admin=true`);
});

