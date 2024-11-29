const express = require('express');
const multer = require('multer');
const tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Tambahkan ini

const app = express();
const PORT = 3000;

// Aktifkan CORS
app.use(cors()); // Izinkan semua origin
// app.use(cors({ origin: 'http://localhost' })); // (Opsional) Izinkan origin tertentu

// Konfigurasi multer untuk menyimpan file yang diunggah
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran 5MB
});

// Endpoint untuk upload dan extract data KTP
app.post('/extract-ktp', upload.single('ktpImage'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Jalankan OCR menggunakan Tesseract.js
    const { data: { text } } = await tesseract.recognize(filePath, 'ind', {
      logger: (info) => console.log(info), // Opsional: untuk debug
    });

    // Hapus file setelah diproses
    fs.unlinkSync(filePath);

    // Lakukan parsing data dari hasil OCR
    const parsedData = parseKTPData(text);

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses gambar.',
      error: error.message,
    });
  }
});

// Fungsi untuk parsing data KTP dari teks OCR
function parseKTPData(text) {
  const lines = text.split('\n').map((line) => line.trim());
  const data = {};

  lines.forEach((line) => {
    if (line.includes('NIK')) {
      data.nik = line.replace('NIK', '').trim();
    } else if (line.includes('Nama')) {
      data.nama = line.replace('Nama', '').trim();
    } else if (line.includes('Tempat/Tgl Lahir')) {
      data.ttl = line.replace('Tempat/Tgl Lahir', '').trim();
    } else if (line.includes('Alamat')) {
      data.alamat = line.replace('Alamat', '').trim();
    } else if (line.includes('RT/RW')) {
      data.rt_rw = line.replace('RT/RW', '').trim();
    } else if (line.includes('Kel/Desa')) {
      data.kelurahan = line.replace('Kel/Desa', '').trim();
    } else if (line.includes('Kecamatan')) {
      data.kecamatan = line.replace('Kecamatan', '').trim();
    } else if (line.includes('Agama')) {
      data.agama = line.replace('Agama', '').trim();
    } else if (line.includes('Status Perkawinan')) {
      data.status = line.replace('Status Perkawinan', '').trim();
    } else if (line.includes('Pekerjaan')) {
      data.pekerjaan = line.replace('Pekerjaan', '').trim();
    } else if (line.includes('Kewarganegaraan')) {
      data.kewarganegaraan = line.replace('Kewarganegaraan', '').trim();
    }
  });

  return data;
}

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
