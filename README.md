# 🥗 NutriSnap Monorepo Workspace

Selamat datang di repositori monorepo **NutriSnap**! Workspace ini mengelola seluruh ekosistem NutriSnap (Website dan Aplikasi Mobile) dalam satu folder terpadu menggunakan **npm workspaces**.

---

## 📂 Struktur Workspace

```text
NutriSnap/
├── apps/
│   ├── web/          # Aplikasi Web (Next.js 14, React 18, Tailwind, TypeScript)
│   └── mobile/       # Aplikasi Mobile Native (Expo SDK 57, React 19, TypeScript)
├── packages/
│   └── shared/       # Shared Package (@nutrisnap/shared) berisi Types dan core logic
├── package.json      # Konfigurasi Monorepo & Script Utama
└── README.md         # Dokumentasi Workspace ini
```

---

## 🚀 Perintah Cepat (Root Commands)

Anda dapat menjalankan perintah untuk masing-masing aplikasi langsung dari root folder ini:

### 🌐 Website (Next.js)
*   **Run Development Server**:
    ```bash
    npm run web:dev
    ```
    Aplikasi web akan berjalan secara lokal di `http://localhost:3000`.
*   **Build Production**:
    ```bash
    npm run web:build
    ```
*   **Linting**:
    ```bash
    npm run web:lint
    ```

### 📱 Mobile App (Expo)
*   **Start Expo Dev Bundler**:
    ```bash
    npm run mobile:start
    ```
*   **Run on Android (Emulator / Device)**:
    ```bash
    npm run mobile:android
    ```
*   **Run on iOS (Simulator)**:
    ```bash
    npm run mobile:ios
    ```
*   **Run Expo Web**:
    ```bash
    npm run mobile:web
    ```

---

## 🛠️ Cara Mulai Pengembangan (Getting Started)

1.  **Instalasi Dependensi**:
    Jalankan perintah ini di root folder untuk menginstall seluruh library web, mobile, dan shared package secara otomatis (npm workspaces):
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Pastikan file `.env.local` di `apps/web/` sudah terisi dengan kredensial Supabase dan Gemini API Anda. Salin dari `.env.example` jika belum ada:
    ```bash
    cp apps/web/.env.example apps/web/.env.local
    ```

3.  **Menambahkan Modul Bersama (Shared Code)**:
    Semua tipe data TypeScript, helper database, dsb. diletakkan di `packages/shared/`.
    *   Setiap kali ada tipe baru, ekspor di `packages/shared/index.ts`.
    *   Web (`apps/web`) dan Mobile (`apps/mobile`) dapat langsung mengimpor tipe tersebut:
        ```typescript
        import { FoodLog, User } from '@nutrisnap/shared'
        ```

---

## 📄 Lisensi
Hak Cipta © 2026 Faiz & NutriSnap Team.
Informasi lebih detail tentang fungsionalitas web dapat dilihat di [apps/web/README.md](file:///c:/React_Project/NutriSnap/apps/web/README.md).
