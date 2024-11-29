const express = require('express');
const multer = require('multer');
const tesseract = require('tesseract.js');
const sharp = require('sharp'); // Tambahkan Sharp untuk pemrosesan gambar
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Aktifkan CORS
app.use(cors());

// Konfigurasi multer untuk menyimpan file yang diunggah
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran 5MB
});

async function processKTPImage(inputPath, outputPath) {
  // Resize gambar untuk standar tertentu (opsional)
  const resizedPath = `${inputPath}-resized.png`;
  await sharp(inputPath)
    .rotate() // Auto-orient berdasarkan metadata
    .resize(1000) // Ubah ukuran jika diperlukan
    .toFile(resizedPath);

  // Crop gambar (dengan koordinat tetap)
  const croppedPath = `${inputPath}-cropped.png`;
  await sharp(resizedPath)
    .extract({ left: 100, top: 100, width: 800, height: 400 }) // Sesuaikan nilai
    .toFile(croppedPath);

  // Grayscale dan threshold untuk meningkatkan kontras
  await sharp(croppedPath)
    .greyscale()
    .threshold(150)
    .toFile(outputPath);

  // Hapus file sementara
  [resizedPath, croppedPath].forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Tidak dapat menghapus file sementara: ${filePath}`, err.message);
    }
  });
}


// Endpoint untuk upload dan extract data KTP
app.post('/extract-ktp', upload.single('ktpImage'), async (req, res) => {
    const originalPath = req.file.path;
    const processedPath = `uploads/processed-${req.file.filename}.png`;
  
    try {
      // Pemrosesan gambar
      await processKTPImage(originalPath, processedPath);
  
      // OCR
      const { data: { text } } = await tesseract.recognize(processedPath, 'ind');
  
      // Parsing hasil OCR
      const parsedData = parseKTPData(text);
  
      res.json({
        success: true,
        data: parsedData,
      });
    } catch (err) {
      console.error('Error saat memproses gambar:', err.message);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memproses gambar.',
        error: err.message,
      });
    } finally {
      // Hapus file sementara
      [originalPath, processedPath].forEach((filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error(`Tidak dapat menghapus file ${filePath}:`, err.message);
        }
      });
    }
  });
  
  

// Fungsi untuk parsing data KTP dari teks OCR
function parseKTPData(text) {
  const nikRegex = /\b\d{16}\b/; // Mencocokkan NIK (16 digit angka)
  const nik = text.match(nikRegex);

  const namaRegex = /Nama\s*:\s*(.+)/i; // Cari nama setelah "Nama:"
  const nama = text.match(namaRegex)?.[1]?.trim();

  const ttlRegex = /Tempat\/Tgl Lahir\s*:\s*(.+)/i; // Cari TTL
  const ttl = text.match(ttlRegex)?.[1]?.trim();

  const alamatRegex = /Alamat\s*:\s*(.+)/i; // Cari Alamat
  const alamat = text.match(alamatRegex)?.[1]?.trim();

  return {
    nik: nik ? nik[0] : null,
    nama: nama || null,
    ttl: ttl || null,
    alamat: alamat || null,
  };
}

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
