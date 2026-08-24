import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWhatsAppClient } from "./client";
import { WhatsAppApiError, WindowClosedError } from "./errors";
import type { WhatsAppCredentials } from "./types";

const NOVA: WhatsAppCredentials = {
  phoneNumberId: "111111111",
  accessToken: "token-nova",
  apiVersion: "v25.0",
};

const OTRA: WhatsAppCredentials = {
  phoneNumberId: "222222222",
  accessToken: "token-otra",
  apiVersion: "v25.0",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sent(body: string): Response {
  return jsonResponse({ messages: [{ id: body }] });
}

function graphError(status: number, code: number, message: string): Response {
  return jsonResponse(
    { error: { message, type: "OAuthException", code, fbtrace_id: "AbC" } },
    status,
  );
}

const fetchMock = vi.fn<typeof fetch>();

function lastCall(): [string, RequestInit] {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error("fetch was not called");
  return [call[0] as string, (call[1] ?? {}) as RequestInit];
}

function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string> | undefined)?.[name];
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendText", () => {
  it("posts to the clinic's phone number id and returns the wa_message_id", async () => {
    fetchMock.mockResolvedValue(sent("wamid.1"));

    const result = await createWhatsAppClient(NOVA).sendText(
      "5492995551234",
      "Hola!",
    );

    expect(result).toEqual({ waMessageId: "wamid.1" });
    // Graph does not guarantee `contacts`: no waId, and nothing fails.
    expect(result.waId).toBeUndefined();
    const [url, init] = lastCall();
    expect(url).toBe("https://graph.facebook.com/v25.0/111111111/messages");
    expect(init.method).toBe("POST");
    expect(headerOf(init, "Authorization")).toBe("Bearer token-nova");
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "5492995551234",
      type: "text",
      text: { body: "Hola!" },
    });
  });

  // The multi-tenant guarantee: credentials come in by parameter, so two clinics never
  // share a number or a token. See docs/tareas/1.1-cliente-whatsapp.md.
  it("sends each clinic from its own number with its own token", async () => {
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(async () => sent("wamid.x"));

    await createWhatsAppClient(NOVA).sendText("549299", "a");
    await createWhatsAppClient(OTRA).sendText("549299", "b");

    const [first, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [second, secondInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(first).toContain("/111111111/messages");
    expect(second).toContain("/222222222/messages");
    expect(headerOf(firstInit, "Authorization")).toBe("Bearer token-nova");
    expect(headerOf(secondInit, "Authorization")).toBe("Bearer token-otra");
  });

  it.each([
    131047, 470,
  ])("maps Graph code %i to WindowClosedError", async (code) => {
    fetchMock.mockResolvedValue(graphError(400, code, "Re-engagement message"));

    const promise = createWhatsAppClient(NOVA).sendText(
      "5492995551234",
      "Hola!",
    );

    await expect(promise).rejects.toBeInstanceOf(WindowClosedError);
    await expect(promise).rejects.toMatchObject({ code, to: "5492995551234" });
  });

  it("maps any other Graph error to WhatsAppApiError", async () => {
    fetchMock.mockResolvedValue(graphError(401, 190, "Session has expired"));

    const promise = createWhatsAppClient(NOVA).sendText("549299", "Hola!");

    await expect(promise).rejects.toBeInstanceOf(WhatsAppApiError);
    await expect(promise).rejects.toMatchObject({
      status: 401,
      code: 190,
      fbtraceId: "AbC",
      message: "Session has expired",
    });
    // A WindowClosedError must not be swallowed by `instanceof WhatsAppApiError`, and viceversa.
    await expect(promise).rejects.not.toBeInstanceOf(WindowClosedError);
  });

  it("does not blow up on a non-JSON error body", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>bad gateway</html>", { status: 502 }),
    );

    const promise = createWhatsAppClient(NOVA).sendText("549299", "Hola!");

    await expect(promise).rejects.toBeInstanceOf(WhatsAppApiError);
    await expect(promise).rejects.toMatchObject({
      status: 502,
      message: "WhatsApp API 502",
      raw: "<html>bad gateway</html>",
    });
  });

  it("fails when Graph answers ok but without a message id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ messages: [] }));

    await expect(
      createWhatsAppClient(NOVA).sendText("549299", "Hola!"),
    ).rejects.toBeInstanceOf(WhatsAppApiError);
  });

  // The wa_id Meta resolves is the canonical identity and differs from what we sent:
  // Argentine mobiles carry a 9 after the country code that Meta drops.
  it("returns the wa_id from contacts when Graph sends it", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        contacts: [{ input: "5492995551234", wa_id: "542995551234" }],
        messages: [{ id: "wamid.1" }],
      }),
    );

    const result = await createWhatsAppClient(NOVA).sendText(
      "5492995551234",
      "Hola!",
    );

    expect(result).toEqual({
      waMessageId: "wamid.1",
      waId: "542995551234",
    });
  });
});

describe("transport failures", () => {
  it("wraps a rejected fetch in WhatsAppApiError with status 0", async () => {
    const cause = new TypeError("fetch failed");
    fetchMock.mockRejectedValue(cause);

    const promise = createWhatsAppClient(NOVA).sendText("549299", "Hola!");

    await expect(promise).rejects.toBeInstanceOf(WhatsAppApiError);
    await expect(promise).rejects.toMatchObject({
      status: 0,
      message: "WhatsApp API: error de red",
      cause,
    });
    // The whole point: no raw TypeError reaches the caller.
    await expect(promise).rejects.not.toBeInstanceOf(TypeError);
  });

  it("names the timeout when the AbortSignal fires", async () => {
    const cause = new Error("The operation was aborted due to timeout");
    cause.name = "TimeoutError";
    fetchMock.mockRejectedValue(cause);

    const promise = createWhatsAppClient(NOVA).sendText("549299", "Hola!");

    await expect(promise).rejects.toBeInstanceOf(WhatsAppApiError);
    await expect(promise).rejects.toMatchObject({
      status: 0,
      message: "WhatsApp API: timeout a los 10000 ms",
      cause,
    });
  });

  it("gives messages 10 s and media downloads 30 s", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    fetchMock.mockImplementation(async () => sent("wamid.x"));
    const client = createWhatsAppClient(NOVA);

    await client.sendText("549299", "Hola!");
    expect(timeout).toHaveBeenLastCalledWith(10_000);

    fetchMock.mockResolvedValue(new Response(new Uint8Array([1])));
    await client.downloadMedia("https://lookaside.fbsbx.com/whatsapp/1");
    expect(timeout).toHaveBeenLastCalledWith(30_000);
  });
});

describe("sendTemplate", () => {
  it("sends name and language, without components when there are no params", async () => {
    fetchMock.mockResolvedValue(sent("wamid.t"));

    await createWhatsAppClient(NOVA).sendTemplate("549299", {
      name: "hello_world",
      languageCode: "en_US",
    });

    const [, init] = lastCall();
    expect(JSON.parse(init.body as string).template).toEqual({
      name: "hello_world",
      language: { code: "en_US" },
    });
  });

  it("builds the body component from the positional params", async () => {
    fetchMock.mockResolvedValue(sent("wamid.t"));

    await createWhatsAppClient(NOVA).sendTemplate("549299", {
      name: "recordatorio_turno",
      languageCode: "es_AR",
      bodyParams: ["Ana", "mañana 10:00"],
    });

    const [, init] = lastCall();
    expect(JSON.parse(init.body as string).template.components).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", text: "Ana" },
          { type: "text", text: "mañana 10:00" },
        ],
      },
    ]);
  });
});

describe("markRead", () => {
  it("posts the read status for the inbound message", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await createWhatsAppClient(NOVA).markRead("wamid.in");

    const [url, init] = lastCall();
    expect(url).toBe("https://graph.facebook.com/v25.0/111111111/messages");
    expect(headerOf(init, "Authorization")).toBe("Bearer token-nova");
    expect(JSON.parse(init.body as string)).toEqual({
      messaging_product: "whatsapp",
      status: "read",
      message_id: "wamid.in",
    });
  });
});

describe("media", () => {
  it("getMediaUrl resolves the media id against the Graph version", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: "media-1",
        url: "https://lookaside.fbsbx.com/whatsapp/1",
        mime_type: "audio/ogg; codecs=opus",
        sha256: "abc",
        file_size: 4321,
      }),
    );

    const info = await createWhatsAppClient(NOVA).getMediaUrl("media-1");

    const [url, init] = lastCall();
    expect(url).toBe("https://graph.facebook.com/v25.0/media-1");
    expect(headerOf(init, "Authorization")).toBe("Bearer token-nova");
    expect(info).toEqual({
      id: "media-1",
      url: "https://lookaside.fbsbx.com/whatsapp/1",
      mimeType: "audio/ogg; codecs=opus",
      sha256: "abc",
      fileSize: 4321,
    });
  });

  it("downloadMedia sends the token to the CDN url and returns the bytes", async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "audio/ogg" },
      }),
    );

    const media = await createWhatsAppClient(NOVA).downloadMedia(
      "https://lookaside.fbsbx.com/whatsapp/1",
    );

    const [url, init] = lastCall();
    expect(url).toBe("https://lookaside.fbsbx.com/whatsapp/1");
    expect(headerOf(init, "Authorization")).toBe("Bearer token-nova");
    expect(Array.from(media.data)).toEqual([1, 2, 3]);
    expect(media.mimeType).toBe("audio/ogg");
  });

  it("surfaces a media error as WhatsAppApiError, never as WindowClosedError", async () => {
    fetchMock.mockResolvedValue(
      graphError(404, 100, "Unsupported get request"),
    );

    await expect(
      createWhatsAppClient(NOVA).getMediaUrl("nope"),
    ).rejects.toBeInstanceOf(WhatsAppApiError);
  });
});
