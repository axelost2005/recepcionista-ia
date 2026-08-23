---
paths:
  - "src/lib/agent/**"
  - "prompts/**"
  - "scripts/scenarios/**"
---

# Reglas del agente conversacional

- Un turno = `runTurn(conversationId)`. Entrada: últimos 30 mensajes (+ `conversations.summary` si existe) + config de la clínica + estado del lead. Salida: 1 o 2 mensajes de WhatsApp, nunca más.
- El system prompt se ARMA desde `prompts/recepcionista.md` + filas de `services`, `professionals`, `insurances`, `faqs` y `clinics.profile`. Nunca hardcodear datos de una clínica en código.
- Tools (Vercel AI SDK, esquema Zod): `ver_disponibilidad`, `agendar_turno`, `actualizar_lead`, `derivar_humano`. `maxSteps` ≤ 6. Cada tool devuelve texto corto y determinista para el modelo.
- Guardrails post-respuesta (`guardrails.ts`): sin markdown (WhatsApp no lo renderiza salvo *negrita*), ≤ 600 caracteres por burbuja, sin diagnóstico (lista de frases prohibidas), sin precios si `price_policy = in_person`.
- Si el modelo no llama a ninguna tool y el lead está `interesado`/`calificado`, el post-proceso (no el modelo) programa follow-ups.
- Audios: transcribir antes de armar el turno; si falla la transcripción, responder pidiendo texto. Imágenes: nunca interpretar contenido clínico; ofrecer turno de evaluación.
- Toda respuesta del LLM se registra en `agent_runs` con tokens, latencia y tools usadas.
- Cambios de prompt se verifican con `pnpm simulate` sobre TODOS los escenarios, no solo el nuevo.
