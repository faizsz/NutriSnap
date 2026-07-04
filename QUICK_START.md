# Quick Start - NutriSnap Step 2

## 🚀 Langkah Cepat Setup

### 1. Setup Database di Supabase (WAJIB!)

**Copy file ini: `supabase-migration.sql`**

1. Buka https://supabase.com/dashboard
2. Pilih project: **ngeztyabfdquoheavtrc**
3. Klik **SQL Editor** (di sidebar)
4. Klik **+ New query**
5. **Copy SEMUA isi** file `supabase-migration.sql`
6. **Paste** ke SQL Editor
7. Klik **RUN** (atau Ctrl+Enter)
8. Tunggu sampai muncul "Success"

### 2. Disable Email Confirmation (Untuk Development)

Supaya tidak perlu confirm email setiap register:

1. Masih di Supabase Dashboard
2. Klik **Authentication** → **Providers**
3. Klik **Email** provider
4. Scroll ke bawah
5. **Toggle OFF** "Confirm email"
6. Click **Save**

### 3. Jalankan Dev Server

```bash
npm run dev
```

Buka: http://localhost:3000

## ✅ Test Authentication Flow

### Test 1: Register → Onboarding → Dashboard
1. Klik **"Daftar"** di navbar
2. Isi email: `test@nutrisnap.com`
3. Isi password: `password123`
4. Klik **"Daftar"**
5. ✅ Otomatis redirect ke `/onboarding`
6. Isi form:
   - Tinggi: 170 cm
   - Berat: 65 kg
   - Umur: 25 tahun
   - Gender: Pilih salah satu
   - Activity Level: Pilih dari dropdown
7. Klik **"Lanjutkan ke Dashboard"**
8. ✅ Masuk ke dashboard

### Test 2: Logout
1. Di dashboard, klik **"Keluar"**
2. ✅ Redirect ke landing page

### Test 3: Login
1. Klik **"Masuk"** di navbar
2. Email: `test@nutrisnap.com`
3. Password: `password123`
4. Klik **"Masuk"**
5. ✅ Masuk ke dashboard

### Test 4: Protected Routes
1. Logout dulu (klik "Keluar")
2. Manual ketik URL: http://localhost:3000/dashboard
3. ✅ Auto redirect ke `/login`

### Test 5: Cek Database
1. Buka Supabase Dashboard
2. Klik **Table Editor**
3. Pilih tabel `profiles`
4. ✅ Ada 1 row dengan data yang Anda isi di onboarding
5. Pilih tabel `food_logs`
6. ✅ Masih kosong (normal, belum upload foto)

## 🎉 Berhasil!

Kalau semua test di atas pass, berarti:
- ✅ Database setup sukses
- ✅ Authentication berfungsi
- ✅ RLS policies aktif
- ✅ Onboarding menyimpan data
- ✅ Middleware protect routes

## 📋 Files yang Perlu Anda Run Manual

### File: `supabase-migration.sql`
**Lokasi**: Root folder nutrisnap

**Isi**: SQL script lengkap untuk:
- Create tables (profiles, food_logs)
- Enable RLS
- Create policies
- Create triggers
- Create indexes

**Cara run**: Copy paste ke Supabase SQL Editor

## 🐛 Kalau Ada Error

### Error: "Failed to compile" / Build error
```bash
# Clear cache
rm -rf .next
npm run dev
```

### Error: "relation does not exist"
➡️ **SQL migration belum di-run**
- Buka Supabase Dashboard
- SQL Editor
- Run file `supabase-migration.sql`

### Error: "No session" / User tidak login
➡️ **Clear browser cookies**
- Buka DevTools (F12)
- Application → Cookies
- Delete all cookies untuk localhost:3000
- Refresh page

### Error di Onboarding: "Failed to save"
➡️ **RLS policies belum aktif**
- Buka Supabase Dashboard
- Table Editor → profiles
- Klik icon 🔒 (RLS harus enabled)
- Kalau tidak enabled, run SQL migration lagi

## 📸 Screenshot Test Results

Setelah test, Anda akan punya:

1. **Supabase Auth Users**:
   - Dashboard → Authentication → Users
   - ✅ Ada user test@nutrisnap.com

2. **Supabase Profiles Table**:
   - Dashboard → Table Editor → profiles
   - ✅ Ada 1 row dengan tinggi, berat, umur, dll

3. **Browser**:
   - Landing page ✅
   - Login page ✅
   - Register page ✅
   - Onboarding page ✅
   - Dashboard page ✅

## 🎯 Next: Step 3

Setelah Step 2 selesai, lanjut ke:
- Upload foto makanan
- Integrasi Gemini AI
- Parse nutrition info
- Save ke food_logs table
- Dashboard dengan history

---

**Current Step**: 2 ✅
**Next Step**: 3 🚧
