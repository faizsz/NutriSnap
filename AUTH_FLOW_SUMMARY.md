# NutriSnap Authentication Flow - Summary

## ✅ Yang Sudah Dibuat

### 1. Database Schema (`supabase-migration.sql`)
File SQL lengkap yang perlu dijalankan di Supabase SQL Editor:
- ✅ Tabel `profiles` dengan RLS policies
- ✅ Tabel `food_logs` dengan RLS policies
- ✅ Indexes untuk performa
- ✅ Trigger auto-create profile saat user register
- ✅ Trigger auto-update `updated_at` field

### 2. TypeScript Types (`types/database.ts`)
Type definitions yang reflect database schema:
- `Profile`, `ProfileInsert`, `ProfileUpdate`
- `FoodLog`, `FoodLogInsert`, `FoodLogUpdate`
- `FoodItem` interface untuk JSONB items
- `User` helper type

### 3. Authentication Context (`contexts/AuthContext.tsx`)
React Context untuk manage auth state:
- `useAuth()` hook untuk akses user session
- `signUp(email, password)` - Register user baru
- `signIn(email, password)` - Login
- `signOut()` - Logout
- Auto-listen auth state changes
- Loading state management

### 4. Pages

#### `/login` - Halaman Login
- Form email + password
- Error handling
- Redirect ke `/dashboard` setelah login
- Link ke `/register`

#### `/register` - Halaman Daftar
- Form email + password + confirm password
- Password validation (min 6 karakter)
- Redirect ke `/onboarding` setelah register
- Link ke `/login`

#### `/onboarding` - Form Lengkapi Profil
- Input: tinggi_cm, berat_kg, umur, gender, activity_level
- Visual selection untuk gender (button dengan emoji)
- Dropdown untuk activity level
- Submit ke tabel `profiles`
- Redirect ke `/dashboard` setelah selesai

#### `/dashboard` - Dashboard (Placeholder)
- Tampilkan email user
- Button logout
- Placeholder untuk fitur upload foto & history

#### `/` - Landing Page (Updated)
- Button "Masuk" link ke `/login`
- Button "Daftar" link ke `/register`

### 5. Middleware (`middleware.ts`)
Protected routes dengan auto-redirect:
- `/dashboard/*` dan `/onboarding/*` - Butuh login
- Redirect ke `/login` jika belum login
- `/login` dan `/register` - Tidak bisa diakses kalau sudah login
- Redirect ke `/dashboard` jika sudah login

### 6. Root Layout Update
- AuthProvider wrapper di `app/layout.tsx`
- Semua pages bisa akses `useAuth()` hook

## 🔐 Authentication Flow

### Flow 1: Register → Onboarding → Dashboard
```
User → /register
  ↓ (input email + password)
signUp() → Supabase Auth
  ↓ (trigger auto-create profile)
Redirect → /onboarding
  ↓ (input tinggi, berat, umur, gender, activity_level)
Update profiles table
  ↓
Redirect → /dashboard
```

### Flow 2: Login → Dashboard
```
User → /login
  ↓ (input email + password)
signIn() → Supabase Auth
  ↓
Redirect → /dashboard
```

### Flow 3: Logout
```
User di /dashboard
  ↓ (click "Keluar")
signOut() → Supabase Auth
  ↓
Redirect → / (landing page)
```

### Flow 4: Protected Route Access
```
User (belum login) → /dashboard
  ↓ (middleware check)
Redirect → /login

User (sudah login) → /login
  ↓ (middleware check)
Redirect → /dashboard
```

## 🔒 Row Level Security (RLS)

Semua data user dilindungi dengan RLS policies:

### Profiles Table
- `SELECT`: User bisa lihat profile sendiri (`auth.uid() = id`)
- `INSERT`: User bisa create profile sendiri (saat onboarding)
- `UPDATE`: User bisa update profile sendiri

### Food Logs Table
- `SELECT`: User bisa lihat food logs sendiri (`auth.uid() = user_id`)
- `INSERT`: User bisa create food log baru
- `UPDATE`: User bisa update food logs sendiri
- `DELETE`: User bisa delete food logs sendiri

**Penting:** Tidak ada cara untuk user A mengakses data user B!

## 📦 Dependencies Ditambahkan

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "tailwindcss-animate": "^1.x"
}
```

## 🚀 Cara Setup & Test

### 1. Setup Database
```bash
# Buka Supabase Dashboard
# SQL Editor → New Query
# Copy paste isi file: supabase-migration.sql
# Run query
```

### 2. Jalankan Dev Server
```bash
cd nutrisnap
npm run dev
```

### 3. Test Flow
1. Buka http://localhost:3000
2. Klik "Daftar" → Buat akun baru
3. Isi form onboarding
4. Masuk ke dashboard
5. Klik "Keluar" → Redirect ke landing
6. Klik "Masuk" → Login dengan akun yang sama

## 📁 File Structure (Update)

```
nutrisnap/
├── app/
│   ├── login/
│   │   └── page.tsx         ✅ Login page
│   ├── register/
│   │   └── page.tsx         ✅ Register page
│   ├── onboarding/
│   │   └── page.tsx         ✅ Onboarding form
│   ├── dashboard/
│   │   └── page.tsx         ✅ Dashboard (placeholder)
│   ├── page.tsx             ✅ Landing (updated)
│   └── layout.tsx           ✅ AuthProvider wrapper
├── contexts/
│   └── AuthContext.tsx      ✅ Auth context & useAuth hook
├── types/
│   ├── index.ts
│   └── database.ts          ✅ Database types
├── lib/
│   ├── supabase.ts
│   └── supabase-server.ts
├── middleware.ts            ✅ Protected routes
├── supabase-migration.sql   ✅ SQL untuk di-run manual
├── DATABASE_SETUP.md        ✅ Panduan setup database
└── AUTH_FLOW_SUMMARY.md     ✅ Dokumen ini
```

## ⚠️ Catatan Penting

### Supabase Email Confirmation
Secara default, Supabase mengirim email konfirmasi saat register. Untuk development:

**Option 1: Disable Email Confirmation (Recommended untuk dev)**
1. Buka Supabase Dashboard
2. Authentication → Settings
3. Scroll ke "Email Auth"
4. **Disable** "Confirm email"

**Option 2: Check Email**
- User harus klik link konfirmasi di email
- Setelah confirm, baru bisa login

### Environment Variables
Pastikan `.env.local` sudah benar:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ngeztyabfdquoheavtrc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🎯 Next Steps (Step 3)

Fitur yang akan dibuat selanjutnya:
- 📸 Upload foto makanan ke Supabase Storage
- 🤖 Integrasi Gemini API untuk analisis foto
- 📊 Dashboard dengan history food logs
- 📈 Visualisasi kalori harian
- 🎯 Target kalori & progress tracking

## 🐛 Troubleshooting

### Build Error
```bash
# Stop dev server
# Clear .next cache
rm -rf .next
npm run dev
```

### Auth Not Working
```bash
# Cek session di browser console
const { data } = await supabase.auth.getSession()
console.log(data)
```

### Database Error
- Pastikan SQL migration sudah dijalankan
- Cek RLS policies di Supabase Dashboard
- Pastikan user sudah login

---

**Status**: ✅ Authentication & Database Setup Complete
**Ready for**: Step 3 - Upload Foto & Gemini AI Integration
