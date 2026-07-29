# 🥗 NutriSnap — AI-Powered Nutrition & Fitness Tracking

> Platform pelacakan nutrisi, analisis makanan berbasis AI Gemini, dan olahraga terintegrasi (Web & Mobile Monorepo)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000000?style=flat-square&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5_/_2.0-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Tentang Project

**NutriSnap** adalah aplikasi pelacak nutrisi dan kebugaran modern berbasis AI yang dirancang untuk membantu pengguna mengontrol asupan harian, memantau makronutrisi (Kalori, Protein, Karbohidrat, Lemak), mencatat riwayat olahraga, dan memantau perkembangan berat badan secara terintegrasi. 

Dengan dukungan **Google Gemini AI Vision**, pengguna cukup mengunggah foto makanan untuk mendapatkan estimasi porsi dan kandungan gizi secara otomatis dalam hitungan detik. NutriSnap dibangun menggunakan arsitektur **Monorepo** yang menyatukan Web App (Next.js 14) dan Mobile App (Expo / React Native) dalam satu repositori terpadu.

---

## Fitur Utama

### 🥗 Pelacakan Nutrisi & AI Food Scan
- Scan foto makanan menggunakan **Gemini AI Vision** untuk deteksi porsi & estimasi gizi otomatis
- Pencatatan log makanan harian (*Breakfast*, *Lunch*, *Dinner*, *Snack*)
- Breakdown nutrisi otomatis: Kalori total, Protein (g), Karbohidrat (g), dan Lemak (g)
- Riwayat konsumsi makanan harian (*Food History Logs*)

### 🏋️ Olahraga & Estimasi Pembakaran Kalori
- Pencatatan aktivitas olahraga (Kardio, Angkat Beban, Running, dll.)
- Estimasi pembakaran kalori berbasis AI (*MET-value calculation*)
- Pencatatan durasi (*minutes*), *reps*, dan catatan latihan (*notes*)

### 📊 Dashboard & Progress Tracking
- Grafik visual pencapaian kalori & makronutrisi harian (*Recharts*)
- Pelacakan riwayat berat badan (*Weight Log History*) dan tren BMI
- Indikator target harian berdasarkan BMR (*Basal Metabolic Rate*) & TDEE (*Total Daily Energy Expenditure*)

### 👤 Profil & Onboarding Interaktif
- Perhitungan kebutuhan kalori berdasarkan Usia, Jenis Kelamin, Tinggi, Berat, dan Tingkat Aktivitas
- Manajemen akun & otentikasi aman melalui Supabase Auth

---

## 📸 Tampilan Aplikasi (Screenshots)

### 🖥️ Tampilan Website / Desktop

| 1. Dashboard & Macro Tracking | 2. AI Food Photo Scanner | 3. Riwayat Olahraga & Berat Badan |
| :---: | :---: | :---: |
| <!-- WEBSITE SCREENSHOT 1 --> <img width="100%" alt="Website Dashboard" src="URL_SCREENSHOT_WEBSITE_1" /> | <!-- WEBSITE SCREENSHOT 2 --> <img width="100%" alt="Website AI Scan" src="URL_SCREENSHOT_WEBSITE_2" /> | <!-- WEBSITE SCREENSHOT 3 --> <img width="100%" alt="Website Exercise & Weight History" src="URL_SCREENSHOT_WEBSITE_3" /> |

<br>

### 📱 Tampilan Mobile

| 1. Mobile - Home & Ringkasan Nutrisi | 2. Mobile - Scan Foto Makanan AI | 3. Mobile - Input Olahraga & Profil |
| :---: | :---: | :---: |
| <!-- MOBILE SCREENSHOT 1 --> <img width="100%" alt="Mobile Home" src="URL_SCREENSHOT_MOBILE_1" /> | <!-- MOBILE SCREENSHOT 2 --> <img width="100%" alt="Mobile Scan" src="URL_SCREENSHOT_MOBILE_2" /> | <!-- MOBILE SCREENSHOT 3 --> <img width="100%" alt="Mobile Profile & Log" src="URL_SCREENSHOT_MOBILE_3" /> |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Monorepo** | npm Workspaces |
| **Web Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn UI |
| **Mobile App** | React Native 0.86, Expo SDK 57, React 19 |
| **AI Integration** | Google Generative AI SDK (`@google/generative-ai` / Gemini AI) |
| **Backend & Auth** | Supabase Auth & PostgreSQL Database (`@supabase/supabase-js`, `@supabase/ssr`) |
| **Shared Package** | `@nutrisnap/shared` (TypeScript Interfaces & Common Utilities) |
| **Data Visualization**| Recharts & Lucide React Icons |
| **Hosting & Deploy**| Vercel (Web) & Expo EAS (Mobile) |

---

## Struktur Monorepo

```text
NutriSnap/
├── apps/
│   ├── web/                     → Aplikasi Web (Next.js 14, TailwindCSS, Shadcn UI)
│   │   ├── app/                 → App Router routes (Dashboard, Scan, History, Profile, API)
│   │   └── components/          → UI Components & Navigation
│   └── mobile/                  → Aplikasi Mobile (React Native, Expo SDK 57)
├── packages/
│   └── shared/                  → Shared Types (`database.ts`) & Helper Logic
├── package.json                 → Monorepo Root Workspaces & Scripts
└── README.md                    → Dokumentasi Project NutriSnap
```

---

## Instalasi Lokal

### Prasyarat
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- Akun **Supabase** (Database & Auth URL/Key)
- API Key **Google Gemini AI**

### Langkah Instalasi

**1. Clone Repository**
```bash
git clone <repo-url>
cd NutriSnap
```

**2. Install Monorepo Dependencies**
```bash
npm install
```

**3. Setup Environment Variables**

Buat file `.env.local` pada folder `apps/web/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI API Key
GEMINI_API_KEY=your-google-gemini-api-key
```

**4. Jalankan Server Pengembangan**

* **Untuk Jalankan Aplikasi Web (Next.js):**
  ```bash
  npm run web:dev
  ```
  Akses di browser: `http://localhost:3000`

* **Untuk Jalankan Aplikasi Mobile (Expo):**
  ```bash
  npm run mobile:start
  ```
  Scan QR Code dengan aplikasi **Expo Go** di iOS/Android.

---

## Akun Demo / Pengujian

| Role / Tipe | Email Login | Password | Keterangan |
|---|---|---|---|
| **Demo User** | `demo@nutrisnap.app` | `Password123!` | Akun uji coba lengkap dengan sample log makanan |
| **New User** | *(Daftar via `/register`)* | *(Bebas)* | Otomatis diarahkan ke halaman *Onboarding* profil gizi |

---

## Deployment

### 🌐 Deploy Web ke Vercel

Project `apps/web` dapat di-deploy secara langsung ke **Vercel**:

1. Hubungkan repository GitHub ke Vercel.
2. Set **Root Directory** ke `apps/web`.
3. Tambahkan **Environment Variables** di Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

### 📱 Deploy Mobile via Expo EAS

```bash
cd apps/mobile
npx eas-cli build --platform android
```

---

## Struktur Database (Supabase Schema)

```text
├── profiles
│   ├── id (UUID, FK -> auth.users)
│   ├── tinggi_cm (INTEGER)
│   ├── tanggal_lahir (DATE)
│   ├── gender ('pria' | 'wanita')
│   └── activity_level ('sedentary' | 'light' | 'moderate' | 'active' | 'very_active')
│
├── food_logs
│   ├── id (UUID, PK)
│   ├── user_id (UUID, FK -> auth.users)
│   ├── photo_url (TEXT)
│   ├── items (JSONB -> FoodItem[])
│   ├── total_calories (NUMERIC)
│   ├── total_protein (NUMERIC)
│   ├── total_carbs (NUMERIC)
│   └── total_fat (NUMERIC)
│
├── exercise_logs
│   ├── id (UUID, PK)
│   ├── user_id (UUID, FK -> auth.users)
│   ├── exercise_type (TEXT)
│   ├── duration_minutes (INTEGER)
│   ├── reps (INTEGER)
│   ├── calories_burned (NUMERIC)
│   └── notes (TEXT)
│
└── weight_logs
    ├── id (UUID, PK)
    ├── user_id (UUID, FK -> auth.users)
    ├── berat_kg (NUMERIC)
    └── recorded_at (TIMESTAMP)
```

---

## Arsitektur API

Aplikasi Web menyediakan API internal pada prefix `/api`:

| Method | Endpoint | Deskripsi | Input / Body |
|---|---|---|---|
| `POST` | `/api/analyze-food` | Analisis gambar makanan dengan Gemini AI Vision | `{ imageBase64: string }` |
| `POST` | `/api/estimate-calories-burned` | Estimasi kalori olahraga berdasarkan jenis & durasi | `{ exercise_type, duration, reps, weight_kg }` |

---

<div align="center">
  <sub>NutriSnap © 2026. Built with ❤️ for healthier lifestyles.</sub>
</div>
