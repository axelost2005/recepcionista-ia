---
paths:
  - "src/lib/whatsapp/**"
  - "src/app/api/webhooks/**"
  - "src/lib/followups/**"
---

# Reglas de WhatsApp Cloud API

- `GET /api/webhooks/whatsapp` responde el `hub.challenge` si `hub.verify_token` coincide con `WHATSAPP_VERIFY_TOKEN`.
- `POST` valida la firma `X-Hub-Signature-256` con `META_APP_SECRET` (HMAC SHA-256 del body crudo). Sin firma válida → 401 y no se procesa.
- El POST inserta en `webhook_events` y encola; responde 200 siempre, incluso si el payload no se entiende. Meta reintenta si no recibe 200.
- Dedupe: `messages.wa_message_id` es único; un insert duplicado se ignora silenciosamente.
- Ruteo multi-tenant: `entry[].changes[].value.metadata.phone_number_id` → `clinics.wa_phone_number_id`. Si no hay clínica, loguear y descartar.
- Ventana de servicio: `conversations.window_expires_at = último mensaje entrante + 24 h`. `sendText` lanza `WindowClosedError` si expiró; el llamador decide si usa template.
- Templates: nombre + idioma `es_AR` + parámetros. Guardar `messages.type = 'template'` y el nombre en `media`.
- Estados de entrega (`sent`/`delivered`/`read`/`failed`) llegan por el mismo webhook (`statuses[]`): actualizar `messages.status` por `wa_message_id`.
- Marcar como leído (`mark_read`) al recibir y, si la API lo permite, indicador de escritura antes de responder.
- Nunca loguear tokens ni el body completo en producción; solo ids.
