import { describe, expect, it } from "vitest";
import { parseEnv } from "./config";

const base = {
  APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  DATABASE_URL: "postgresql://user:pass@host:5432/postgres",
};

describe("parseEnv", () => {
  it("parses a minimal env and applies defaults", () => {
    const config = parseEnv(base);
    expect(config.APP_URL).toBe("http://localhost:3000");
    expect(config.NODE_ENV).toBe("development");
    expect(config.LOG_LEVEL).toBe("info");
    expect(config.WHATSAPP_API_VERSION).toBe("v25.0");
  });

  it("fails naming the missing required variable", () => {
    expect(() => parseEnv({})).toThrow(/Invalid environment variables/);
    expect(() => parseEnv({})).toThrow(/APP_URL/);
  });

  it("treats empty string as unset", () => {
    expect(() => parseEnv({ ...base, APP_URL: "" })).toThrow(/APP_URL/);
  });

  it("rejects a malformed URL", () => {
    expect(() => parseEnv({ ...base, APP_URL: "not-a-url" })).toThrow(
      /APP_URL/,
    );
  });

  it("fails naming a missing Supabase variable", () => {
    const { SUPABASE_SECRET_KEY, ...withoutSecret } = base;
    expect(() => parseEnv(withoutSecret)).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("rejects a legacy JWT pasted into the new key variable", () => {
    expect(() =>
      parseEnv({ ...base, SUPABASE_SECRET_KEY: "eyJhbGciOiJIUzI1NiJ9.legacy" }),
    ).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it("rejects a DATABASE_URL that kept the Dashboard placeholder brackets", () => {
    expect(() =>
      parseEnv({
        ...base,
        DATABASE_URL: "postgresql://user:[pass]@host:5432/postgres",
      }),
    ).toThrow(/borrá los \[ \] del placeholder/);
  });

  it("requires the API key of the chosen LLM provider", () => {
    expect(() => parseEnv({ ...base, LLM_PROVIDER: "anthropic" })).toThrow(
      /ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic/,
    );
  });

  it("accepts the chosen LLM provider with its key", () => {
    const config = parseEnv({
      ...base,
      LLM_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "sk-test",
    });
    expect(config.LLM_PROVIDER).toBe("anthropic");
  });

  it("requires the API key of the chosen transcription provider", () => {
    expect(() =>
      parseEnv({ ...base, TRANSCRIBE_PROVIDER: "deepgram" }),
    ).toThrow(/DEEPGRAM_API_KEY is required when TRANSCRIBE_PROVIDER=deepgram/);
  });

  it("rejects an unknown provider", () => {
    expect(() => parseEnv({ ...base, LLM_PROVIDER: "cohere" })).toThrow(
      /LLM_PROVIDER/,
    );
  });
});
