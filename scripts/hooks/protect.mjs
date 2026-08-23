// PreToolUse hook: bloquea ediciones a archivos sensibles.
// Claude Code pasa el JSON del evento por stdin. Exit 2 = bloquear (el mensaje de stderr vuelve a Claude).
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}
const file = input?.tool_input?.file_path ?? input?.tool_input?.path;
if (!file) process.exit(0);

const rel = relative(process.cwd(), resolve(file)).replaceAll("\\", "/");

// 1) Nunca tocar secretos reales (.env.example sí se puede).
if (/^\.env(\..+)?$/.test(rel) && rel !== ".env.example") {
  console.error(`Bloqueado: ${rel} contiene secretos. Editalo vos a mano.`);
  process.exit(2);
}

// 2) Migraciones aplicadas son inmutables: solo se crean archivos nuevos.
if (rel.startsWith("supabase/migrations/") && existsSync(resolve(file))) {
  console.error(
    `Bloqueado: ${rel} ya existe. Creá una migración nueva (NNNN_descripcion.sql).`,
  );
  process.exit(2);
}

// 3) Tipos generados no se editan a mano.
if (rel === "src/lib/db/types.ts") {
  console.error(
    "Bloqueado: src/lib/db/types.ts es generado. Corré `pnpm db:types`.",
  );
  process.exit(2);
}

process.exit(0);
