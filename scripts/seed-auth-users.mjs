// scripts/seed-auth-users.mjs
//
// One-off helper: creates a Supabase Auth account for every employee in the
// current in-memory directory (src/lib/vera/store.js), so login can be
// tested end-to-end. Uses the SERVICE ROLE key (bypasses RLS, admin-only)
// — run this locally, never ship the service role key to the client.
//
// Usage:
//   node scripts/seed-auth-users.mjs
//   node scripts/seed-auth-users.mjs --password="SomeOtherPass123"
//
// Every account is created already-confirmed (no verification email sent)
// with the same temporary password, listed at the end so you can share it
// with each employee to change on first login.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const passwordArg = args.find((a) => a.startsWith("--password="));
const TEMP_PASSWORD = passwordArg ? passwordArg.split("=")[1] : "Vaulthos2026!";

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Kept in sync manually with src/lib/vera/store.js's employees list — this
// script is meant to be run once during setup, not imported into the app.
const EMPLOYEES = [
  "vaulthos@vaulthos.com",
  "sarah@vaulthos.com",
  "andi@vaulthos.com",
  "rina@vaulthos.com",
  "budi@vaulthos.com",
  "citra@vaulthos.com",
  "fajar@vaulthos.com",
  "gita@vaulthos.com",
  "hendra@vaulthos.com",
  "indah@vaulthos.com",
  "joko@vaulthos.com",
  "kiki@vaulthos.com",
  "lukman@vaulthos.com",
  "maya@vaulthos.com",
  "nanda@vaulthos.com",
];

async function main() {
  console.log(`Creating ${EMPLOYEES.length} accounts with temporary password: ${TEMP_PASSWORD}\n`);

  for (const email of EMPLOYEES) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`skip   ${email} (already exists)`);
      } else {
        console.log(`FAILED ${email} — ${error.message}`);
      }
    } else {
      console.log(`ok     ${email}`);
    }
  }

  console.log(`\nDone. Temporary password for all new accounts: ${TEMP_PASSWORD}`);
  console.log("Each employee should sign in and use 'Forgot your password?' to set their own.");
}

main();
