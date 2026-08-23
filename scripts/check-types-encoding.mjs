// Guards against PowerShell writing UTF-16 into the generated types file.
import { readFileSync } from "node:fs";

const path = "src/lib/db/types.ts";
const b = readFileSync(path);

if (b.length < 500)
  throw new Error(`${path}: empty or truncated (${b.length} bytes)`);
if (b[0] === 0xff || b[0] === 0xfe)
  throw new Error(`${path}: UTF-16 BOM — regenerate from cmd.exe or Git Bash`);
if (b[0] === 0xef) throw new Error(`${path}: UTF-8 BOM — strip it`);
new TextDecoder("utf-8", { fatal: true }).decode(b);

console.log(`UTF-8 ok, ${b.length} bytes`);
