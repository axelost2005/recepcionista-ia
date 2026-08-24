// WhatsApp Cloud API types (docs/tareas/1.1-cliente-whatsapp.md).

/**
 * Everything a call needs to know WHICH number it sends from. Credentials are per clinic
 * (`clinics.wa_phone_number_id` / `wa_access_token`), never read from the env by the client:
 * that is what keeps the multi-tenant guarantee of CLAUDE.md.
 */
export type WhatsAppCredentials = {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
};

export type SendResult = {
  waMessageId: string;
  /**
   * The recipient's canonical WhatsApp identity, as Meta resolved it. It can differ from the `to`
   * we sent: Argentine mobiles are written with a `9` after the country code (`549299...`) and the
   * wa_id Meta answers with usually drops it (`54299...`). Optional because Graph does not
   * guarantee `contacts` in the response.
   */
  waId?: string;
};

/** Approved template. Positional body params only ({{1}}, {{2}}, ...). */
export type TemplateMessage = {
  name: string;
  languageCode: string;
  bodyParams?: string[];
};

export type MediaInfo = {
  id: string;
  url: string;
  mimeType: string;
  sha256: string;
  fileSize: number;
};

export type DownloadedMedia = {
  data: Uint8Array;
  mimeType: string;
};

export type WhatsAppClient = {
  sendText(to: string, body: string): Promise<SendResult>;
  sendTemplate(to: string, template: TemplateMessage): Promise<SendResult>;
  markRead(waMessageId: string): Promise<void>;
  getMediaUrl(mediaId: string): Promise<MediaInfo>;
  downloadMedia(url: string): Promise<DownloadedMedia>;
};

/** Graph error envelope. Meta returns this for every 4xx/5xx of the API. */
export type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

/** POST /{phone_number_id}/messages response. */
export type SendMessageResponse = {
  contacts?: Array<{ input?: string; wa_id?: string }>;
  messages?: Array<{ id?: string }>;
};

/** GET /{media_id} response. */
export type MediaResponse = {
  id?: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
};
