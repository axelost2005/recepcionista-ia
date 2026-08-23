// Worker entry point. pg-boss queues are registered here (task 1.3).
import { loadEnvConfig } from "@next/env";
import { getConfig } from "../lib/config";

// Same .env loading order as Next, outside the Next runtime (docs/DECISIONES.md #13).
loadEnvConfig(process.cwd());
const config = getConfig();

console.log(
  `worker: config ok (${config.NODE_ENV}); queues not implemented yet (PLAN 1.3)`,
);
process.exit(0);
