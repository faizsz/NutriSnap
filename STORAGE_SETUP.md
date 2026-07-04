# Setup Supabase Storage untuk Food Photos

## Langkah Setup Storage Bucket

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com/dashboard
- Pilih project: **ngeztyabfdquoheavtrc**

### 2. Buat Storage Bucket
1. Klik **Storage** di sidebar kiri
2. Klik **+ New bucket**
3. Isi form:
   - **Name**: `food-photos`
   - **Public bucket**: ✅ **Centang** (supaya foto bisa diakses publik)
   - **File size limit**: 10 MB (optional)
   - **Allowed MIME types**: image/* (optional)
4. Klik **Create bucket**

### 3. Setup RLS Policies untuk Storage

Buka **SQL Editor** dan jalankan query berikut:

```sql
-- Enable RLS untuk storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users dapat upload foto mereka sendiri
CREATE POLICY "Users can upload their own food photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view food photos (public bucket)
CREATE POLICY "Anyone can view food photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'food-photos');

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own food photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own food photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'food-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Verifikasi
1. Kembali ke **Storage** di dashboard
2. Anda akan lihat bucket **food-photos**
3. Bucket harus sudah **Public** (ada icon 🌐)

### 5. Test Upload (Optional)
1. Klik bucket **food-photos**
2. Coba **Upload** manual satu file image
3. Kalau berhasil, berarti setup sudah benar

## Structure Folder di Storage

Files akan tersimpan dengan struktur:
```
food-photos/
  ├── {user_id_1}/
  │   ├── 1234567890.jpg
  │   ├── 1234567891.jpg
  │   └── ...
  ├── {user_id_2}/
  │   ├── 1234567892.jpg
  │   └── ...
  └── ...
```

Setiap user punya folder sendiri berdasarkan `user_id` mereka.

## Troubleshooting

### Error: "new row violates row-level security policy"
➡️ RLS policies belum di-setup. Jalankan SQL query di atas.

### Error: "bucket not found"
➡️ Bucket belum dibuat. Ikuti step 2.

### Foto tidak bisa diakses (404)
➡️ Bucket belum di-set sebagai **Public**. 
- Klik bucket → Settings → Make bucket public

## Next: Get Gemini API Key

Setelah storage setup, Anda perlu Gemini API key:

1. Buka https://aistudio.google.com/app/apikey
2. Klik **Get API Key** atau **Create API Key**
3. Copy API key yang dibuat
4. Paste ke file `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

Done! 🎉
