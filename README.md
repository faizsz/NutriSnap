# NutriSnap 🍎

Food Calorie Tracker dengan AI Vision - Lacak kalori makanan Anda cukup dengan foto!

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI Vision**: Gemini API (untuk analisis foto makanan)

## Fitur Utama

- 📸 **AI Vision Analysis**: Upload foto makanan dan dapatkan analisis kalori otomatis
- 📊 **Daily Tracking**: Pantau asupan kalori harian Anda
- 🎯 **Personal Goals**: Set target kalori dan nutrisi personal
- 📱 **Responsive Design**: Akses dari desktop atau mobile

## Getting Started

### Prerequisites

- Node.js 18+ dan npm
- Akun Supabase
- Gemini API Key (Google AI Studio)

### Installation

1. Clone repository ini

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
   - Copy `.env.example` menjadi `.env.local`
   - Isi dengan kredensial Supabase Anda:
     - `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/Public key dari Supabase
     - `GEMINI_API_KEY`: API key dari Google AI Studio (akan digunakan nanti)

4. Jalankan development server:
```bash
npm run dev
```

5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda

## Struktur Project

```
nutrisnap/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities & configurations
│   ├── supabase.ts     # Client-side Supabase client
│   ├── supabase-server.ts  # Server-side Supabase client
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared types
└── .env.example        # Environment variables template
```

## Development Roadmap

### ✅ Phase 1: Project Setup (Current)
- [x] Next.js + TypeScript setup
- [x] Tailwind CSS + shadcn/ui integration
- [x] Supabase client configuration
- [x] Basic project structure
- [x] Landing page UI

### 🚧 Phase 2: Database & Authentication (Next)
- [ ] Supabase database schema
- [ ] Authentication flow (sign up, login, logout)
- [ ] Protected routes
- [ ] User profile management

### 📋 Phase 3: Core Features
- [ ] Gemini API integration
- [ ] Photo upload & analysis
- [ ] Food entry management
- [ ] Daily calorie tracking
- [ ] Nutrition dashboard

### 🎨 Phase 4: Enhancement
- [ ] Historical data & charts
- [ ] Goal setting & progress tracking
- [ ] Export data functionality
- [ ] Mobile PWA optimization

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

## Contributing

Project ini masih dalam tahap development awal. Contributions akan dibuka setelah Phase 2 selesai.

## License

MIT

---

Built with ❤️ using Next.js, Supabase, and Gemini AI
