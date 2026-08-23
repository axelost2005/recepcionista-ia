// PostToolUse hook: formatea el archivo recién editado con Biome (rápido, silencioso).

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const file = input?.tool_input?.file_path ?? input?.tool_input?.path;
if (!file || !/\.(ts|tsx|js|mjs|json|css)$/.test(file)) process.exit(0);

try {
  execSync(`pnpm exec biome format --write "${file}"`, { stdio: "ignore" });
} catch {
  // Si Biome no está instalado todavía (fase 0), no bloquear nada.
}
process.exit(0);
