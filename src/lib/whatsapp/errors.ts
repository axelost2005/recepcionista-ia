// Typed errors for the WhatsApp Cloud API (docs/tareas/1.1-cliente-whatsapp.md).

type WhatsAppApiErrorDetails = {
  /** HTTP status, or 0 when there was no HTTP response at all (network error, timeout). */
  status: number;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  raw: string;
  cause?: unknown;
};

/** Any non-ok answer from Graph that is not the 24 h window being closed. */
export class WhatsAppApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;
  readonly fbtraceId?: string;
  readonly raw: string;

  constructor(message: string, details: WhatsAppApiErrorDetails) {
    super(message, { cause: details.cause });
    this.name = "WhatsAppApiError";
    this.status = details.status;
    this.code = details.code;
    this.subcode = details.subcode;
    this.fbtraceId = details.fbtraceId;
    this.raw = details.raw;
  }
}

/**
 * The 24 h customer service window is closed: only approved templates go out.
 * Sibling of WhatsAppApiError on purpose — callers must be able to tell it apart
 * to fall back to a template, so it must not be swallowed by `instanceof WhatsAppApiError`.
 */
export class WindowClosedError extends Error {
  readonly code: number;
  readonly to: string;

  constructor(to: string, code: number, message: string) {
    super(message);
    this.name = "WindowClosedError";
    this.code = code;
    this.to = to;
  }
}
