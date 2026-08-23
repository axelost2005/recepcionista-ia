import { describe, expect, it } from "vitest";
import { parseEnv } from "./config";

const base = { APP_URL: "http://localhost:3000" };

describe("parseEnv", () => {
  it("parses a minimal env and applies defaults", () => {
    const config = parseEnv(base);
    expect(config.APP_URL).toBe("http://localhost:3000");
    expect(config.NODE_ENV).toBe("development");
    expect(config.LOG_LEVEL).toBe("info");
    expect(config.WHATSAPP_API_VERSION).toBe("v23.0");
  });

  it("fails naming the missing required variable", () => {
    expect(() => parseEnv({})).toThrow(/Invalid environment variables/);
    expect(() => parseEnv({})).toThrow(/APP_URL/);
  });

  it("treats empty string as unset", () => {
    expect(() => parseEnv({ APP_URL: "" })).toThrow(/APP_URL/);
  });

  it("rejects a malformed URL", () => {
    expect(() => parseEnv({ APP_URL: "not-a-url" })).toThrow(/APP_URL/);
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
