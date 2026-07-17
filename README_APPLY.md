# Cara pakai

Ini SEMUA file yang berubah sepanjang sesi Supabase migration (Auth, Employee
Directory, Topbar/nama login, Meeting Schedule, Tasks). Timpa langsung ke
project kamu (replace file yang sama path-nya).

## 1. HAPUS manual 2 file ini (sudah tidak dipakai):
- src/components/auth/PinBoxes.jsx
- src/components/auth/ResetPinForm.jsx

## 2. Copy semua folder/file di zip ini ke root project, overwrite semuanya.

## 3. Khusus package.json — JANGAN main timpa mentah-mentah
File ini kemungkinan udah beda dari punya kamu (misal ada dependency lain
yang kamu tambahin sendiri). Buka package.json yang saya kirim, terus
pastikan project kamu punya baris-baris ini di dalamnya (di "scripts" dan
"dependencies"), tambahin manual kalau belum ada:

  "scripts": {
    ...
    "seed:auth": "node scripts/seed-auth-users.mjs",
    "seed:db": "node scripts/seed-database.mjs",
    "reset:db": "node scripts/reset-database.mjs"
  }

  dependencies harus punya: "@supabase/ssr", "@supabase/supabase-js"
  devDependencies harus punya: "dotenv"

Kalau nggak yakin, kirim isi package.json kamu yang sekarang, saya cek.

## 4. Restart dev server
  npm install
  npm run dev

## 5. Pastikan .env.local masih ada isinya (3 baris Supabase)

## 6. Pastikan sudah pernah run supabase/rls_policies_dev.sql di SQL Editor
