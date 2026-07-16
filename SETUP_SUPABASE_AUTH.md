# Setup Login Supabase Auth (V.E.R.A)

Login sekarang pakai **Supabase Auth beneran** (email + password), menggantikan
validasi PIN dummy yang sebelumnya cuma cek array in-memory.

## 1. Isi environment variable

```bash
cp .env.local.example .env.local
```

Buka Supabase Dashboard project kamu → **Settings > API**, lalu isi:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (⚠️ rahasia, jangan pernah
  commit atau expose ke browser — cuma dipakai script seed di bawah, jalan
  di local/CI, tidak pernah dibundle ke app)

## 2. Buat akun untuk 15 employee yang sudah ada

Karena employee directory masih in-memory (belum di Fase 4 — sambung ke tabel
`employees` beneran), buat akun Supabase Auth-nya lewat script sekali-jalan:

```bash
npm run seed:auth
```

Ini akan bikin 15 akun (email dari `src/lib/vera/store.js`) dengan password
sementara `Vaulthos2026!` (bisa diganti: `npm run seed:auth -- --password="LainNya123"`).
Kalau email sudah ada, otomatis di-skip, aman dijalankan berkali-kali.

Setelah itu tiap employee bisa login pakai email mereka + password sementara,
lalu ganti sendiri lewat **Forgot your password?** di halaman login.

## 3. Redirect URL untuk reset password

Di Supabase Dashboard → **Authentication > URL Configuration**, tambahkan ke
**Redirect URLs**:

- `http://localhost:3000/reset-password` (dev)
- `https://<domain-production-kamu>/reset-password` (setelah deploy ke Vercel)

Tanpa ini, link reset password dari email akan ditolak Supabase.

## 4. Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/login`, login pakai salah satu email di atas +
password sementara.

## Apa yang berubah

| Sebelum | Sekarang |
|---|---|
| PIN 6 digit, dicek ke array in-memory | Email + password, dicek ke Supabase Auth (`signInWithPassword`) |
| "Reset PIN" set password baru langsung tanpa verifikasi | "Forgot password" kirim email link reset asli (`resetPasswordForEmail`) |
| Sesi cuma `sessionStorage` (hilang tiap tab baru / restart browser) | Sesi Supabase via cookie (`@supabase/ssr`), di-refresh otomatis lewat `middleware.js`, route dashboard otomatis redirect ke `/login` kalau belum login |
| Logout cuma hapus `sessionStorage` | Logout beneran manggil `supabase.auth.signOut()` |

## Yang BELUM dikerjakan (di luar scope ini, lanjut nanti)

- **Fase 4**: tabel `employees` di Supabase belum dipakai — app masih baca
  dari `src/lib/vera/store.js` (in-memory). Setelah login, profil employee
  dicari lewat **pencocokan email** ke array in-memory itu (lihat komentar
  "Bridge" di `LoginScreen.jsx`). Setelah Fase 4 selesai, ini harus diganti
  jadi query `employees` by `auth_user_id`.
- `CURRENT_USER_ID` masih hardcoded ke `"EMP-0001"` di beberapa tempat
  (`taskUiHelpers.js`, `store.js`) — belum otomatis ikut user yang login.
  Ini juga nunggu Fase 4.
- Belum ada UI untuk admin bikin akun baru (signup masih dummy link). Untuk
  sekarang, akun baru dibuat manual lewat Supabase Dashboard atau nambah ke
  `scripts/seed-auth-users.mjs`.
- **Row Level Security (RLS)** di tabel `employees`/`tasks`/dst masih belum
  di-enable (Fase 5 di `vera_schema.sql`) — tidak berpengaruh ke login ini
  karena Auth adalah sistem terpisah dari tabel-tabel itu, tapi wajib
  dibereskan sebelum Fase 4 jalan ke production.
