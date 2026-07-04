# Setup Database NutriSnap

## Langkah-langkah Setup Database di Supabase

### 1. Buka Supabase Dashboard
- Login ke [Supabase Dashboard](https://supabase.com/dashboard)
- Pilih project Anda: **ngeztyabfdquoheavtrc**

### 2. Jalankan SQL Migration
1. Klik **SQL Editor** di sidebar kiri
2. Klik **+ New query**
3. Copy seluruh isi file `supabase-migration.sql`
4. Paste ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`

### 3. Verifikasi Database
Setelah migration berhasil, cek:

#### Di **Table Editor**:
- ✅ Tabel `profiles` sudah dibuat
- ✅ Tabel `food_logs` sudah dibuat

#### Di **Authentication > Policies**:
- ✅ RLS (Row Level Security) enabled untuk kedua tabel
- ✅ Policies sudah terbuat (users can view/insert/update own data)

### 4. Test Authentication
1. Jalankan `npm run dev`
2. Buka http://localhost:3000
3. Klik **Daftar** dan buat akun baru
4. Setelah register, akan otomatis:
   - User dibuat di `auth.users`
   - Profile kosong dibuat di `profiles` (via trigger)
   - Redirect ke halaman onboarding

5. Isi form onboarding (tinggi, berat, umur, dll)
6. Data tersimpan di tabel `profiles`
7. Redirect ke dashboard

## Schema Overview

### Tabel `profiles`
```sql
- id (UUID, FK ke auth.users)
- tinggi_cm (NUMERIC)
- berat_kg (NUMERIC)
- umur (INTEGER)
- gender (TEXT: 'pria' | 'wanita')
- activity_level (TEXT: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ, auto-update via trigger)
```

### Tabel `food_logs`
```sql
- id (UUID, PK)
- user_id (UUID, FK ke auth.users)
- photo_url (TEXT)
- items (JSONB) - Array of food items dengan calories, protein, carbs, fat
- total_calories (NUMERIC)
- total_protein (NUMERIC)
- total_carbs (NUMERIC)
- total_fat (NUMERIC)
- created_at (TIMESTAMPTZ)
```

## Row Level Security (RLS)

Semua data dilindungi dengan RLS policies:
- User **hanya bisa melihat** data miliknya sendiri
- User **hanya bisa insert/update/delete** data miliknya sendiri
- Policies otomatis menggunakan `auth.uid()` untuk validasi

## Troubleshooting

### Error: "relation does not exist"
- Pastikan SQL migration sudah di-run
- Refresh Table Editor di Supabase Dashboard

### Error: "new row violates row-level security policy"
- Pastikan RLS policies sudah dibuat
- Cek di Authentication > Policies

### Error: "insert or update on table violates foreign key constraint"
- Pastikan user sudah login (ada di auth.users)
- Cek session dengan `supabase.auth.getSession()`

## Next Steps

Setelah database setup selesai:
- ✅ Authentication sudah berfungsi
- ✅ Onboarding sudah bisa menyimpan profile
- 🚧 Upload foto makanan (Step 3)
- 🚧 Integrasi Gemini AI (Step 3)
- 🚧 Dashboard dengan history (Step 3)
