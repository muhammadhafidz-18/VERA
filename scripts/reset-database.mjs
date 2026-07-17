// scripts/reset-database.mjs
//
// DANGER: wipes every row from every app table AND deletes every Supabase
// Auth user. Meant for cleaning up a messy dev/testing project before a
// fresh `npm run seed:auth && npm run seed:db`.
//
// Usage:
//   node scripts/reset-database.mjs --yes-i-am-sure
//
// (Requires the extra flag on purpose — this is destructive and
// irreversible. There's no confirmation prompt beyond that.)

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!process.argv.includes("--yes-i-am-sure")) {
  console.error(
    "This deletes ALL rows in ALL tables and ALL Supabase Auth users.\n" +
      "Re-run with: node scripts/reset-database.mjs --yes-i-am-sure"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Child tables first, parents last — respects FK constraints.
const TABLES_IN_DELETE_ORDER = [
  "task_notifications",
  "task_audit_log",
  "task_chats",
  "tasks",
  "meeting_attendees",
  "meetings",
  "vera_conversations",
  "employees",
  "roles",
  "divisions",
  "branches",
  "integration_settings",
];

async function wipeTables() {
  for (const table of TABLES_IN_DELETE_ORDER) {
    const { error, count } = await supabase.from(table).delete({ count: "exact" }).not("id", "is", null);
    if (error) {
      console.log(`  skip   ${table} — ${error.message}`);
    } else {
      console.log(`  ok     ${table} (${count ?? "?"} rows deleted)`);
    }
  }
}

async function wipeAuthUsers() {
  let page = 1;
  let total = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("  FAILED listing auth users:", error.message);
      return;
    }
    if (!data.users.length) break;

    for (const u of data.users) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) console.log(`  FAILED  ${u.email} — ${delErr.message}`);
      else {
        console.log(`  deleted ${u.email}`);
        total++;
      }
    }
    if (data.users.length < 200) break;
    page++;
  }
  console.log(`  ${total} auth user(s) deleted.`);
}

async function main() {
  console.log("Wiping table data...");
  await wipeTables();

  console.log("\nDeleting Auth users...");
  await wipeAuthUsers();

  console.log("\nDone. Next steps:");
  console.log("  npm run seed:auth   # recreate Auth accounts");
  console.log("  npm run seed:db     # re-insert employees/meetings/tasks, linked to fresh Auth accounts");
}

main();
