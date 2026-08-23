// Validated env (zod). The ONLY place that reads process.env (docs/ARQUITECTURA.md).
// INVARIANT: parsing is lazy (getConfig) — never parse at module top level. The worker
// loads .env files at runtime, after all imports have already been evaluated.
import { z } from "zod";

const PROVIDER_API_KEY = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  deepgram: "DEEPGRAM_API_KEY",
} as const;

const envSchema = z
  .object({
    // Core (phase 0)
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_URL: z.url(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

    // Supabase — flip to required in task 0.3 (values come from `supabase start`)
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    DATABASE_URL: z.string().optional(),

    // WhatsApp Cloud API — flip to required in task 1.2
    META_APP_ID: z.string().optional(),
    META_APP_SECRET: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),
    WHATSAPP_API_VERSION: z.string().default("v23.0"),
    WHATSAPP_DEV_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_DEV_ACCESS_TOKEN: z.string().optional(),

    // LLM — flip to required in task 2.4; the chosen provider's key is enforced below
    LLM_PROVIDER: z.enum(["anthropic", "openai", "google"]).optional(),
    LLM_MODEL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),

    // Audio transcription
    TRANSCRIBE_PROVIDER: z.enum(["openai", "deepgram", "google"]).optional(),
    DEEPGRAM_API_KEY: z.string().optional(),

    // Simulator
    CLINIC_SLUG: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    for (const [provider, source] of [
      [env.LLM_PROVIDER, "LLM_PROVIDER"],
      [env.TRANSCRIBE_PROVIDER, "TRANSCRIBE_PROVIDER"],
    ] as const) {
      if (!provider) continue;
      const key = PROVIDER_API_KEY[provider];
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when ${source}=${provider}`,
        });
      }
    }
  });

export type Config = z.infer<typeof envSchema>;

/** Parses an env object. Empty strings count as unset. Exported for tests. */
export function parseEnv(env: Record<string, string | undefined>): Config {
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, v]) => v !== undefined && v !== ""),
  );
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

let cached: Config | undefined;

/** Validated config from process.env. Parses once; throws with a clear message. */
export function getConfig(): Config {
  cached ??= parseEnv(process.env);
  return cached;
}
