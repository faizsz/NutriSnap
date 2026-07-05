# 🥗 NutriSnap — AI Calorie Tracker

> Scan makanan, biarkan AI yang hitung kalorinya.

NutriSnap adalah aplikasi web (mobile-first) untuk tracking kalori harian yang menghilangkan friction terbesar dalam food logging: input data manual. Cukup foto makanan, dan AI (Gemini Vision) akan mengidentifikasi item makanan beserta estimasi kalori dan makronutriennya secara otomatis.

<p align="center">
  <img src="https://github.com/user-attachments/assets/6b281f80-a322-44e1-9655-66e413845b36" width="32%" />
  <img src="https://github.com/user-attachments/assets/cbe1fdaf-c0dc-4220-af5b-b4a98f744422" width="32%" />
  <img src="https://github.com/user-attachments/assets/2e271c61-a9bc-4269-9bce-bc5d4702b638" width="32%" />
</p>

---

## 📌 Latar Belakang

Kebanyakan aplikasi kalori tracker mengharuskan pengguna mencari dan memilih makanan satu-per-satu dari database yang seringkali tidak lengkap (apalagi untuk makanan lokal Indonesia). Hal ini membuat banyak orang berhenti tracking kalori di hari ke-2 atau ke-3.

NutriSnap mencoba menyelesaikan masalah ini dengan pendekatan **AI-first**: foto → analisis otomatis → pengguna tinggal konfirmasi/edit. Dikombinasikan dengan perhitungan kebutuhan kalori harian (BMR/TDEE) yang personal berdasarkan data fisik pengguna, aplikasi ini memberi gambaran lengkap: kalori masuk vs kalori keluar, setiap hari.

---

## ✨ Fitur Utama

- **🔐 Autentikasi** — Register/login dengan Supabase Auth
- **📋 Onboarding personal** — Input tinggi badan, berat badan, tanggal lahir, gender, dan activity level untuk kalkulasi kebutuhan kalori yang akurat
- **📸 Food Scan (AI Vision)** — Upload/foto makanan, dianalisis oleh Gemini API untuk mendeteksi item makanan, estimasi porsi, kalori, protein, karbohidrat, dan lemak
- **✏️ Review & Edit** — Hasil analisis AI selalu bisa dikoreksi manual sebelum disimpan, karena estimasi AI tidak selalu 100% akurat
- **🏋️ Input Olahraga + Estimasi Kalori Terbakar** — Catat aktivitas (situp, pushup, lari, renang, dll), Gemini menghitung estimasi kalori terbakar menggunakan formula MET yang mempertimbangkan berat badan terkini pengguna
- **⚖️ Weight Tracking** — Riwayat berat badan tersimpan terpisah (bukan cuma 1 angka statis), sehingga bisa melihat tren progress dari waktu ke waktu
- **📊 Dashboard** — Ringkasan kalori harian (TDEE vs kalori masuk vs kalori keluar), breakdown makronutrien, dan grafik tren 7 hari terakhir
- **📜 Riwayat** — Log lengkap semua food & exercise entry, dikelompokkan per tanggal

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend & Database | Supabase (PostgreSQL, Auth, Storage) |
| AI | Google Gemini API (vision + text, model: `gemini-3-flash`) |
| Charts | Recharts |
| Desain UI/UX | Google Stitch |

---

## 🏗️ Arsitektur

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Browser    │─────▶│   Next.js App     │─────▶│  Supabase        │
│  (Next.js UI)│◀─────│  (API Routes)     │◀─────│  (Auth/DB/Storage)│
└─────────────┘      └────────┬──────────┘      └─────────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │   Gemini API      │
                      │ (Vision & Text)   │
                      └──────────────────┘
```

**Alur food scan:**
```
User upload foto
  → Foto disimpan ke Supabase Storage
  → Foto dikirim ke Gemini Vision dengan structured prompt
  → Gemini mengembalikan JSON (item, porsi, kalori, makronutrien)
  → User review & edit hasil
  → Data final disimpan ke tabel food_logs
```

**Alur estimasi kalori olahraga:**
```
User input jenis olahraga + durasi/reps
  → Sistem ambil berat badan terbaru dari weight_logs
  → Sistem ambil umur (dihitung dari tanggal_lahir), gender,
    activity_level dari profiles
  → Data dikirim ke Gemini (formula MET) untuk estimasi kalori terbakar
  → User review & konfirmasi
  → Data disimpan ke tabel exercise_logs
```

### Skema Database (ringkas)

| Tabel | Fungsi |
|---|---|
| `profiles` | Data fisik yang jarang berubah: tinggi badan, tanggal lahir, gender, activity level |
| `weight_logs` | Histori berat badan (banyak entry per user, untuk tracking tren) |
| `food_logs` | Hasil scan makanan: foto, item terdeteksi, kalori & makronutrien |
| `exercise_logs` | Catatan olahraga: jenis, durasi/reps, estimasi kalori terbakar |

Semua tabel dilindungi **Row Level Security (RLS)** — user hanya bisa membaca/menulis data miliknya sendiri.

---

## ⚠️ Known Limitations

Setiap sistem punya trade-off, dan berikut batasan di NutriSnap:

- **Akurasi estimasi AI terbatas** — Gemini Vision menebak porsi & kalori dari visual foto, bukan menimbang langsung. Estimasi bisa meleset 20–40%, terutama untuk makanan campur dalam satu piring atau porsi yang tertutup bumbu/saus. Karena itu, semua hasil AI **selalu bisa diedit manual** sebelum disimpan.
- **Konsistensi hasil** — Foto yang sama, dianalisis dua kali, berpotensi memberi hasil sedikit berbeda karena sifat generatif model AI.
- **Ketergantungan pada satu provider AI** — Jika Gemini API mengalami downtime atau perubahan kebijakan, fitur inti (food scan & estimasi exercise) akan terdampak.
- **Model AI kurang familiar dengan makanan lokal spesifik** — Makanan seperti rendang, gado-gado, atau soto kadang kurang akurat diidentifikasi dibanding makanan yang lebih umum secara global.
- **Belum ada validasi ground-truth** — Tidak ada cara sistem memverifikasi apakah estimasi kalori benar-benar akurat, sehingga akurasi jangka panjang data bergantung pada seberapa rajin pengguna mengoreksi hasil AI.

---

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)
- API key [Google AI Studio](https://aistudio.google.com) untuk Gemini (gratis, model Flash)

### Langkah-langkah

```bash
# 1. Clone repository
git clone https://github.com/username/nutrisnap.git
cd nutrisnap

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
```

Isi `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3-flash
```

```bash
# 4. Jalankan migration SQL
# Buka Supabase Dashboard > SQL Editor, jalankan file di /supabase/migrations/

# 5. Buat Storage bucket "food-photos" secara manual di Supabase Dashboard

# 6. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 🗺️ Roadmap Selanjutnya

- [ ] Autentikasi Google OAuth
- [ ] Notifikasi reminder tracking harian
- [ ] Ekspor laporan mingguan/bulanan (PDF)
- [ ] Dukungan input audio untuk deskripsi makanan
- [ ] Aplikasi mobile native (React Native)

---

## 👤 Tentang Developer

Dibuat sebagai project portofolio pribadi untuk mendalami full-stack development dengan integrasi AI. Project ini dibangun dengan pendekatan iteratif — setiap fitur dikembangkan step-by-step dengan validasi manual di setiap tahap, termasuk kesadaran penuh terhadap limitasi teknologi AI yang digunakan.
