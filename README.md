# Minilify Kuliah Portal

Portal belajar pribadi yang ringan: HTML, CSS, Vanilla JavaScript, dan Nginx di Podman.

## Jalankan

```bash
cd /home/nodenix/Documents/kuliah-portal
podman build -t minilify-kuliah .
podman rm -f minilify-kuliah 2>/dev/null || true
podman run -d --name minilify-kuliah -p 127.0.0.1:8080:80 minilify-kuliah
```

Buka `http://localhost:8080`.

## Menambah materi

Tambahkan objek pertemuan di `data/se4ds.json`, lalu buat file content dengan nama yang sama di `content/`. Content memiliki `sections` dan `quiz`. PDF adalah referensi knowledge; halaman membaca memakai penjelasan ulang.

## Notes

Catatan tersimpan di browser dengan `localStorage` supaya tidak membutuhkan backend atau volume. Gambar paste dan drag-drop didukung. Gunakan `backup` untuk mengunduh JSON, lalu `pulihkan` untuk mengembalikannya. Satu browser/perangkat adalah batas penyimpanan versi ringan ini.

## Guideline

Data dipisahkan dari UI, tanpa dependency tambahan, dan tiap file utama dijaga di bawah 400 baris. Fitur yang benar-benar membutuhkan server dapat ditambahkan nanti tanpa mengubah format materi.
