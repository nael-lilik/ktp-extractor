document.getElementById('uploadForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Mencegah form refresh halaman
  
    const fileInput = document.getElementById('ktpImage');
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
  
    // Periksa apakah ada file yang dipilih
    if (fileInput.files.length === 0) {
      alert('Harap unggah gambar KTP terlebih dahulu.');
      return;
    }
  
    const formData = new FormData();
    formData.append('ktpImage', fileInput.files[0]);
  
    try {
      // Tampilkan loading saat proses upload
      resultDiv.style.display = 'none';
      resultText.textContent = 'Mengunggah dan memproses gambar...';
  
      const response = await fetch('http://localhost:3000/extract-ktp', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Gagal mengunggah gambar. Pastikan server API berjalan.');
      }
  
      const result = await response.json();
  
      // Tampilkan hasil ekstraksi
      resultDiv.style.display = 'block';
      resultText.textContent = JSON.stringify(result, null, 2);
    } catch (error) {
      // Tampilkan pesan kesalahan
      resultDiv.style.display = 'block';
      resultText.textContent = `Terjadi kesalahan: ${error.message}`;
    }
  });
  