# V.E.R.A — Next.js Migration Starter

Ini fondasi awal migrasi dari prototype HTML ke Next.js, dengan fokus utama:
**bikin Ask V.E.R.A jalan reliable**, karena AI-nya sekarang manggil Anthropic
API langsung pakai API key server kamu sendiri — bukan lewat proxy sandbox
preview Claude yang terbatas.

## Status Migrasi — SEMUA MENU SUDAH DIPINDAH ✅

| Menu | Status | Route |
|---|---|---|
| Login / Sign In | Selesai | `/login` |
| Ask V.E.R.A | Selesai | `/vera` |
| Employee Directory | Selesai | `/employees` |
| Meeting Schedule | Selesai | `/meetings` |
| Tasks (+ AI Summary/Issue Analysis/Refine/Moderation) | Selesai | `/tasks` |
| Settings (User Mgmt, Role Mgmt, Division, Branch, Voice AI, Product Knowledge) | Selesai | `/settings` |
| Help & Support | Selesai | `/help` |

Semua endpoint AI (Ask V.E.R.A tool-calling, Task AI Summary/Issue Analysis/Refine, moderasi bahasa) sekarang jalan lewat API Route di server, pakai `ANTHROPIC_API_KEY` asli — bukan lagi lewat proxy sandbox preview.

## Yang sudah jalan
- `POST /api/vera/chat` — endpoint AI dengan tool-calling penuh (get/create
  employee, meeting, task, division, branch), jalan di server.
- `/vera` — halaman chat sederhana buat langsung tes Ask V.E.R.A.
- Data masih **in-memory** (`src/lib/vera/store.js`) — cukup buat testing
  cepat, tapi reset tiap restart server dan **tidak akan jalan di Vercel
  production** (serverless function-nya stateless). Supabase belum
  disambungkan di tahap ini.

## Cara jalanin

1. Install dependencies (kalau belum):
   ```bash
   npm install
   ```

2. Copy env template dan isi API key kamu:
   ```bash
   cp .env.local.example .env.local
   ```
   Buka `.env.local`, isi `ANTHROPIC_API_KEY` dengan API key asli dari
   console.anthropic.com. Ini **wajib** supaya Ask V.E.R.A bisa jawab.

3. Jalankan dev server:
   ```bash
   npm run dev
   ```

4. Buka http://localhost:3000/vera di browser, coba chat langsung.
   Contoh yang bisa dites:
   - "berapa jumlah karyawan saat ini?"
   - "buatkan task untuk Andi Kurniawan, review kontrak vendor, prioritas tinggi"
   - "buatkan meeting dengan tim Finance besok jam 2 siang"

## Kenapa ini seharusnya lebih reliable dari preview sebelumnya

Di prototype HTML, panggilan ke Anthropic API lewat proxy khusus preview
Claude yang gratis tapi terbatas — parameter seperti `tool_choice` kadang
tidak ditegakkan dengan benar, bikin AI kadang "ngeles" tanpa benar-benar
manggil tool. Di sini, request dikirim langsung ke
https://api.anthropic.com/v1/messages pakai API key asli kamu di header
`x-api-key`, sesuai dokumentasi resmi Anthropic — jalur yang jauh lebih
predictable.

Kalau setelah ini masih ada AI yang "ngeles" tanpa manggil tool, kabari saya
— itu baru benar-benar bug di logic kita, bukan keterbatasan environment.


## Alur Login (baru ditambahkan)

Halaman /login sekarang di-port 1:1 dari prototype HTML — sama persis:
- Background panel kiri, logo animasi, form email+PIN
- Alur "Reset forgotten PIN" 3 step (email -> PIN baru -> sukses)
- Intro screen dengan voice greeting setelah login berhasil
- Session persistence via sessionStorage

**PENTING:** validasi PIN-nya masih demo/dummy sama seperti prototype HTML
(dicek ke array employee di memori, PIN default 123456) - BUKAN autentikasi
sungguhan. Ini ditandai jelas dengan komentar TODO di
`src/components/auth/LoginScreen.jsx` dan `ResetPinForm.jsx`. Wajib diganti
ke Supabase Auth asli sebelum production (Fase 2 di roadmap).

Login pakai email siapa saja dari `src/lib/vera/store.js` (misal
`vaulthos@vaulthos.com`) dengan PIN `123456`.

## Struktur project

```
src/
  app/
    page.js                  <- landing page
    vera/page.js              <- halaman chat test Ask V.E.R.A
    api/vera/chat/route.js    <- endpoint AI (tool-calling loop)
  lib/vera/
    tools.js                  <- skema 7 tool yang tersedia
    systemPrompt.js            <- instruksi ke Claude
    executeTool.js             <- eksekusi nyata tiap tool
    store.js                   <- data in-memory sementara (ganti ke Supabase nanti)
```

## Next steps (belum dikerjakan)

Semua HALAMAN sudah dipindah, tapi beberapa hal masih perlu dibereskan
sebelum production:

- [ ] Fase 2 - Setup Supabase Auth beneran, ganti validasi PIN dummy di
      LoginScreen/ResetPinForm
- [ ] Fase 4 - Sambungkan store.js ke Supabase asli (pakai skema SQL
      di folder supabase/vera_schema.sql) - PENTING karena in-memory
      store sekarang reset tiap restart & tidak jalan di Vercel serverless
- [ ] Pindahkan ElevenLabs & Chatbase API key dari localStorage ke server
      (masih ada catatan keamanan di tiap tab-nya)
- [ ] Ganti attachment base64 di Task chat ke Supabase Storage
- [ ] Fase 5 - Row Level Security policies di Supabase
- [ ] Deploy ke Vercel, setup environment variables di sana

Kasih tahu saya kapan mau lanjut ke fase berikutnya.
