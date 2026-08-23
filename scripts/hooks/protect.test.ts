import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");

function runHook(filePath: string, rawInput?: string): number {
  const res = spawnSync(
    process.execPath,
    [resolve(root, "scripts/hooks/protect.mjs")],
    {
      cwd: root,
      input:
        rawInput ?? JSON.stringify({ tool_input: { file_path: filePath } }),
      encoding: "utf8",
    },
  );
  return res.status ?? -1;
}

describe("protect.mjs hook", () => {
  it("blocks .env files with secrets", () => {
    expect(runHook(".env.local")).toBe(2);
    expect(runHook(".env")).toBe(2);
    expect(runHook(".env.production")).toBe(2);
  });

  it("allows .env.example", () => {
    expect(runHook(".env.example")).toBe(0);
  });

  it("blocks absolute Windows paths to .env files", () => {
    expect(runHook(resolve(root, ".env.local"))).toBe(2);
  });

  it("blocks existing migrations, allows new ones", () => {
    const existing = readdirSync(resolve(root, "supabase/migrations"))[0];
    expect(existing).toBeDefined();
    expect(runHook(`supabase/migrations/${existing}`)).toBe(2);
    expect(runHook("supabase/migrations/9999_next.sql")).toBe(0);
  });

  it("blocks generated db types", () => {
    expect(runHook("src/lib/db/types.ts")).toBe(2);
  });

  it("allows regular source files", () => {
    expect(runHook("src/lib/config.ts")).toBe(0);
  });

  it("fails open on invalid stdin", () => {
    expect(runHook("", "not json")).toBe(0);
  });
});
