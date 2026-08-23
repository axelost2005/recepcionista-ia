// Applies supabase/seed/<slug>.sql to DATABASE_URL in a single transaction.
// The seed is idempotent (delete by clinic_id + on conflict do update), so it can be re-run.
import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { getConfig } from "../src/lib/config";

// Same .env loading order as Next, outside the Next runtime (docs/DECISIONES.md #13).
loadEnvConfig(process.cwd());

const slug = process.argv[2];
if (!slug) {
  console.error("usage: tsx scripts/seed.ts <slug>");
  process.exit(1);
}

const file = `supabase/seed/${slug}.sql`;
const sql = readFileSync(file, "utf8");

// pg-connection-string parses sslmode from the URL and that value takes precedence over
// the `ssl` option below, silently. In pg 8.23 `sslmode=require` is an alias for
// `verify-full`, which rejects Supabase's chain with SELF_SIGNED_CERT_IN_CHAIN — so the
// param is stripped here and `ssl` is left as the single source of truth.
// Do NOT carry rejectUnauthorized:false into production (task 5.2) — use Supabase's
// root CA there. Also revisit when upgrading pg: v9 switches sslmode to libpq semantics.
//
// String surgery on purpose: `new URL(x).toString()` percent-encodes the password
// (a `[` becomes `%5B`) and pg does not decode it back, which fails auth with 28P01.
// Never let the URL parser touch this string.
function stripSslmode(url: string): string {
  const [base, query = ""] = url.split("?");
  const kept = query.split("&").filter((p) => p && !/^sslmode=/i.test(p));
  return kept.length > 0 ? `${base}?${kept.join("&")}` : base;
}

const client = new Client({
  connectionString: stripSslmode(getConfig().DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log(`seed: applied ${file}`);
  } catch (err) {
    await client.query("rollback");
    console.error(`seed: failed, rolled back ${file}`);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  // exitCode, not exit(): lets stderr flush. A seed that fails must not exit 0.
  process.exitCode = 1;
});
