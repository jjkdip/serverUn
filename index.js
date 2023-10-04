const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { uploadByBuffer } = require('telegraph-uploader');
const fileUpload = require('express-fileupload');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors({
    origin: '*'
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Membaca data dari database.json
let data = loadDatabase(); // Fungsi untuk membaca data dari file

function loadDatabase() {
  try {
    const rawData = fs.readFileSync('database.json');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error saat membaca database:', error);
    return {}; // Jika terjadi kesalahan, kembalikan objek kosong
  }
}

function saveDatabase(data) {
  try {
    fs.writeFileSync('database.json', JSON.stringify(data));
  } catch (error) {
    console.error('Error saat menyimpan ke database:', error);
  }
}



// Rute untuk mengirimkan data baru dengan mengunggah gambar
app.post('/input', async (req, res) => {
  const newData = req.body;

  // Pemeriksaan apakah ID sudah ada
if (data.hasOwnProperty(newData.id)) {
  return res.status(400).json({ error: 'ID sudah ada dalam database' });
}

  try {



    
    // Mengunggah gambar fotodepan
    if (req.files && req.files.fotodepan) {
      const fotodepanUploadResult = await uploadByBuffer(req.files.fotodepan.data, req.files.fotodepan.mimetype);
      newData.fotodepan = fotodepanUploadResult.link;
    }
 newData.title = `The Wedding of ${newData['laki.pangilan']} & ${newData['perempuan.pangilan']}`;
    // Simpan data laki-laki
    newData.laki = {
      pangilan: newData['laki.pangilan'],
      namalengkap: newData['laki.namalengkap'],
      anakke: newData['laki.anakke'],
      bapak: newData['laki.bapak'],
      ibu: newData['laki.ibu'],
      foto: null, // Foto laki-laki akan diunggah terpisah
    };

    // Simpan data akad
    newData.akad = {
      lokasi: newData['akad.lokasi'],
      hari: newData['akad.hari'],
      tanggal: newData['akad.tanggal'],
      jam: newData['akad.jam'],
      alamat: newData['akad.alamat'],
      gmap: newData['akad.gmap'],
    };

    // Simpan data resepsi
    newData.resepsi = {
      lokasi: newData['resepsi.lokasi'],
      hari: newData['resepsi.hari'],
      tanggal: newData['resepsi.tanggal'],
      alamat: newData['resepsi.alamat'],
      gmap: newData['resepsi.gmap'],
    };

    // Simpan data galeri
    newData.galery = [];

    // Simpan data perempuan
    newData.perempuan = {
      pangilan: newData['perempuan.pangilan'],
      namalengkap: newData['perempuan.namalengkap'],
      anakke: newData['perempuan.anakke'],
      bapak: newData['perempuan.bapak'],
      ibu: newData['perempuan.ibu'],
      foto: null, // Foto perempuan akan diunggah terpisah
    };

    // Mengunggah gambar laki.foto
    if (req.files && req.files['laki.foto']) {
      const lakiFotoUploadResult = await uploadByBuffer(req.files['laki.foto'].data, req.files['laki.foto'].mimetype);
      newData.laki.foto = lakiFotoUploadResult.link;
    }

    // Mengunggah gambar perempuan.foto
    if (req.files && req.files['perempuan.foto']) {
      const perempuanFotoUploadResult = await uploadByBuffer(req.files['perempuan.foto'].data, req.files['perempuan.foto'].mimetype);
      newData.perempuan.foto = perempuanFotoUploadResult.link;
    }

    // Mengunggah galeri (jika ada)
    if (req.files && req.files['galery']) {
      console.log('Mengunggah galeri...');
      const galeriUploadResults = await Promise.all(req.files['galery'].map(async (image) => {
        const imageUploadResult = await uploadByBuffer(image.data, image.mimetype);
        return imageUploadResult.link;
      }));
      // Menambahkan setiap tautan gambar ke dalam array galeri
      newData.galery = galeriUploadResults.map(link => ({ link }));
    } else {
      // Jika tidak ada gambar yang diunggah, tetapkan galery ke array kosong
      newData.galery = [];
      console.log('Tidak ada gambar galeri yang diunggah.');
    }

    // Simpan kembali data ke dalam database.json
    data[newData.id] = newData;
  
    
    saveDatabase(data);

   delete newData['akad.hari'];
    delete newData['akad.tanggal'];
    delete newData['akad.jam'];
    delete newData['akad.alamat'];
    delete newData['akad.gmap'];
    delete newData['resepsi.hari'];
    delete newData['resepsi.tanggal'];
    delete newData['resepsi.alamat'];
    delete newData['resepsi.gmap'];
    delete newData['laki.pangilan'];
    delete newData['laki.namalengkap'];
    delete newData['laki.anakke'];
    delete newData['laki.bapak'];
    delete newData['laki.ibu'];
    delete newData['perempuan.pangilan'];
    delete newData['perempuan.namalengkap'];
    delete newData['perempuan.anakke'];
    delete newData['perempuan.bapak'];
    delete newData['perempuan.ibu'];

    
    res.json(newData); // Mengembalikan data yang telah disimpan
  } catch (error) {
    console.error('Error saat mengunggah gambar:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah gambar' });
  }
});











// Rute untuk merender file HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/cekid', (req, res) => {
  const id = req.query.id;
  if (!id){
      return res.status(200).json({ error: 'data id belum dimasukan' });
  }
  if (data[id] && id) {
    return res.status(200).json({ status: 'sudahada' });
  } else {
    return res.status(200).json({ status: 'belumada' });
  }
});
// Rute untuk menampilkan data
app.get('/data', (req, res) => {
  const id = req.query.id;
   if (!id) {
    return res.status(400).json({ error: 'ID belum diisi' });
  }
 if (!data[id]) {
    return res.status(400).json({ error: 'ID tidak ditemukan' });
  }
try {
  
  // Pemeriksaan apakah ID yang diminta ada dalam data
     if (id && data[id]) {
      delete data[id].password;
       delete data[id]['akad.hari'];
delete data[id]['akad.tanggal'];
delete data[id]['akad.jam'];
delete data[id]['akad.alamat'];
delete data[id]['akad.gmap'];
delete data[id]['resepsi.hari'];
delete data[id]['resepsi.tanggal'];
delete data[id]['resepsi.alamat'];
delete data[id]['resepsi.gmap'];
delete data[id]['laki.pangilan'];
delete data[id]['laki.namalengkap'];
delete data[id]['laki.anakke'];
delete data[id]['laki.bapak'];
delete data[id]['laki.ibu'];
delete data[id]['perempuan.pangilan'];
delete data[id]['perempuan.namalengkap'];
delete data[id]['perempuan.anakke'];
delete data[id]['perempuan.bapak'];
delete data[id]['perempuan.ibu'];
    
    res.json(data[id])}
  }
  catch (error){
    res.status(404).json({ error: 'Data tidak ditemukan' });
  }
});




// Rute untuk menghapus data berdasarkan ID
app.get('/hapus', (req, res) => {
  const id = req.query.id;
  const password = req.query.password;

  if (!id) {
    return res.status(400).json({ error: 'Parameter id tidak ada atau belum diisi' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Parameter password tidak ada atau belum diisi' });
  }

  // Pemeriksaan apakah ID sudah ada dalam data
  if (!data[id]) {
    return res.status(404).json({ error: 'Data tidak ditemukan' });
  }

  // Pemeriksaan apakah password sesuai
  if (data[id].password !== password) {
    return res.status(401).json({ error: 'Password salah' });
  }

  // Hapus data dengan ID yang sesuai
  delete data[id];

  // Simpan kembali data ke dalam database.json
  saveDatabase(data);

  res.json({ message: `Data dengan ID ${id} telah dihapus.` });
});



app.get('/dataku', (req, res) => {
  res.json(data);
});





app.listen(port, () => {
  console.log(`Aplikasi berjalan di Port:${port}`);
});
