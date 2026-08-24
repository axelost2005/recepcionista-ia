// WhatsApp Cloud API client (docs/tareas/1.1-cliente-whatsapp.md).
// INVARIANT: no method here reads process.env. Credentials come in by parameter, because they are
// per clinic (`clinics.wa_phone_number_id` / `wa_access_token`). Reading them from the env would make
// every clinic send from the same number and break the multi-tenant rule of CLAUDE.md.
// The single env reader is whatsappCredentialsFromEnv(), used only in development (Meta test number).
import { getConfig } from "@/lib/config";
import { WhatsAppApiError, WindowClosedError } from "./errors";
import type {
  DownloadedMedia,
  GraphErrorBody,
  MediaInfo,
  MediaResponse,
  SendMessageResponse,
  SendResult,
  TemplateMessage,
  WhatsAppClient,
  WhatsAppCredentials,
} from "./types";

const GRAPH_HOST = "https://graph.facebook.com";

/** 131047: re-engagement message. 470: legacy code for the same thing (window expired). */
const WINDOW_CLOSED_CODES = new Set([131047, 470]);

/** Graph calls are small and synchronous from the worker's point of view. */
const MESSAGE_TIMEOUT_MS = 10_000;
/** Media downloads carry bytes, so they get a wider budget. */
const DOWNLOAD_TIMEOUT_MS = 30_000;

type RequestOptions = {
  init?: RequestInit;
  /** Recipient, only when the call can fail with the 24 h window closed. */
  to?: string;
  timeoutMs?: number;
};

async function failFromResponse(res: Response, to?: string): Promise<never> {
  const raw = await res.text();
  let body: GraphErrorBody | undefined;
  try {
    body = JSON.parse(raw) as GraphErrorBody;
  } catch {
    // Not every failure comes from Graph itself (proxies, 502 HTML pages).
  }
  const error = body?.error;
  const message = error?.message ?? `WhatsApp API ${res.status}`;

  if (
    to !== undefined &&
    error?.code !== undefined &&
    WINDOW_CLOSED_CODES.has(error.code)
  ) {
    throw new WindowClosedError(to, error.code, message);
  }
  throw new WhatsAppApiError(message, {
    status: res.status,
    code: error?.code,
    subcode: error?.error_subcode,
    fbtraceId: error?.fbtrace_id,
    raw,
  });
}

export function createWhatsAppClient(
  credentials: WhatsAppCredentials,
): WhatsAppClient {
  const { phoneNumberId, accessToken, apiVersion } = credentials;
  const messagesUrl = `${GRAPH_HOST}/${apiVersion}/${phoneNumberId}/messages`;

  async function authorizedFetch(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const { init, to, timeoutMs = MESSAGE_TIMEOUT_MS } = options;
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
      });
    } catch (cause) {
      // No HTTP response at all: DNS, socket, or the AbortSignal firing. The raw
      // TypeError/DOMException never escapes — callers only know the two typed errors.
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      throw new WhatsAppApiError(
        timedOut
          ? `WhatsApp API: timeout a los ${timeoutMs} ms`
          : "WhatsApp API: error de red",
        { status: 0, raw: "", cause },
      );
    }
    if (!res.ok) await failFromResponse(res, to);
    return res;
  }

  async function postMessage(
    to: string,
    payload: Record<string, unknown>,
  ): Promise<SendResult> {
    const res = await authorizedFetch(messagesUrl, {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      },
      to,
    });
    const body = (await res.json()) as SendMessageResponse;
    const waMessageId = body.messages?.[0]?.id;
    if (!waMessageId) {
      throw new WhatsAppApiError("WhatsApp API: respuesta sin message id", {
        status: res.status,
        raw: JSON.stringify(body),
      });
    }
    return { waMessageId, waId: body.contacts?.[0]?.wa_id };
  }

  return {
    /** Free-form text. Only allowed inside the 24 h window; outside it Graph answers 131047/470. */
    sendText(to, body) {
      return postMessage(to, {
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      });
    },

    /** Approved template. The only thing that can be sent outside the 24 h window. */
    sendTemplate(to, template: TemplateMessage) {
      const params = template.bodyParams ?? [];
      return postMessage(to, {
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: template.name,
          language: { code: template.languageCode },
          ...(params.length > 0
            ? {
                components: [
                  {
                    type: "body",
                    parameters: params.map((text) => ({ type: "text", text })),
                  },
                ],
              }
            : {}),
        },
      });
    },

    async markRead(waMessageId) {
      await authorizedFetch(messagesUrl, {
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            status: "read",
            message_id: waMessageId,
          }),
        },
      });
    },

    async getMediaUrl(mediaId): Promise<MediaInfo> {
      const res = await authorizedFetch(
        `${GRAPH_HOST}/${apiVersion}/${mediaId}`,
      );
      const body = (await res.json()) as MediaResponse;
      if (!body.url) {
        throw new WhatsAppApiError(`WhatsApp API: media ${mediaId} sin url`, {
          status: res.status,
          raw: JSON.stringify(body),
        });
      }
      return {
        id: body.id ?? mediaId,
        url: body.url,
        mimeType: body.mime_type ?? "application/octet-stream",
        sha256: body.sha256 ?? "",
        fileSize: body.file_size ?? 0,
      };
    },

    /** The media URL lives on a Meta CDN host and also requires the Bearer token. */
    async downloadMedia(url): Promise<DownloadedMedia> {
      const res = await authorizedFetch(url, {
        timeoutMs: DOWNLOAD_TIMEOUT_MS,
      });
      const data = new Uint8Array(await res.arrayBuffer());
      return {
        data,
        mimeType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    },
  };
}

/**
 * Development credentials (Meta test number). Per-clinic resolution arrives with the webhook
 * routing by phone_number_id (task 1.2); when it does, a clinic without credentials is an error
 * naming the clinic, in every environment — never a fallback to these.
 */
export function whatsappCredentialsFromEnv(): WhatsAppCredentials {
  const {
    WHATSAPP_DEV_PHONE_NUMBER_ID: phoneNumberId,
    WHATSAPP_DEV_ACCESS_TOKEN: accessToken,
    WHATSAPP_API_VERSION: apiVersion,
  } = getConfig();

  // apiVersion is defensive: config.ts defaults it today, but the guard covers the three
  // variables this function reads, not two.
  if (!phoneNumberId || !accessToken || !apiVersion) {
    const missing = [
      !phoneNumberId && "WHATSAPP_DEV_PHONE_NUMBER_ID",
      !accessToken && "WHATSAPP_DEV_ACCESS_TOKEN",
      !apiVersion && "WHATSAPP_API_VERSION",
    ].filter(Boolean);
    throw new Error(`Faltan variables de WhatsApp: ${missing.join(", ")}`);
  }

  return { phoneNumberId, accessToken, apiVersion };
}
