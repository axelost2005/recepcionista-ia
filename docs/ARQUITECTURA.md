# Arquitectura

Un repo, dos procesos, una base. Todo lo que es "conversación" pasa por el worker; el panel solo lee y escribe estado.

```
                 Meta (WhatsApp Cloud API)
                          │ webhook POST
                          ▼
   ┌──────────── Next.js (app) ─────────────┐       ┌──────── Worker (Node) ────────┐
   │ /api/webhooks/whatsapp                 │       │ cola `turn`      → runTurn()  │
   │   verifica firma → webhook_events      │──────►│ cola `followup`  → send()     │
   │   → upsert contact/conversation        │ pg-   │ cola `reminder`  → 24 h antes │
   │   → insert message (dedupe)            │ boss  │ cola `transcribe`→ audio→texto│
   │   → encola turn (debounce 4 s)         │       └───────────────┬───────────────┘
   │ /(panel)  bandeja · conversación ·     │                       │ WhatsApp client
   │           turnos · métricas · config   │                       ▼
   └──────────────────┬─────────────────────┘              Meta Graph API (send)
                      │ supabase-js (RLS)
                      ▼
              Supabase Postgres (+ Auth + Realtime)
```

## Árbol de carpetas

```
recepcionista-ia/
├── CLAUDE.md                      # instrucciones cortas para Claude Code (siempre cargado)
├── .claude/
│   ├── settings.json              # permisos + hooks deterministas
│   ├── rules/                     # reglas por ruta (se cargan solo al tocar esos archivos)
│   ├── agents/                    # subagentes: revisor, probador
│   └── skills/                    # /nueva-clinica, /simular, /cerrar-tarea
├── docs/                          # este directorio. PLAN.md manda.
├── prompts/recepcionista.md       # template del system prompt
├── supabase/
│   ├── migrations/                # 0001_init.sql, 0002_... (nunca editar aplicadas)
│   ├── seed/                      # dental-nova.sql y un .sql por clínica
│   └── config.toml                # lo genera `supabase init`
├── scripts/
│   ├── simulate.ts                # corre escenarios contra runTurn con WhatsApp falso
│   ├── scenarios/*.json           # escenarios de conversación (son los tests del agente)
│   ├── seed.ts                    # aplica supabase/seed/<slug>.sql
│   └── hooks/                     # hooks de Claude Code (protect, format)
├── src/
│   ├── app/
│   │   ├── (panel)/               # rutas autenticadas
│   │   │   ├── layout.tsx         # shell: rail + contenido + pulso de recepción
│   │   │   ├── page.tsx           # Bandeja (leads por estado)
│   │   │   ├── conversaciones/[id]/page.tsx
│   │   │   ├── turnos/page.tsx
│   │   │   ├── metricas/page.tsx
│   │   │   └── configuracion/page.tsx
│   │   ├── api/
│   │   │   ├── webhooks/whatsapp/route.ts        # GET verify, POST eventos
│   │   │   └── conversations/[id]/
│   │   │       ├── messages/route.ts             # POST respuesta humana
│   │   │       └── handoff/route.ts              # POST tomar / devolver a IA
│   │   └── login/page.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn (generado)
│   │   └── panel/                 # LeadRow, ConversationThread, StatusChip, MetricTile, PulsoRecepcion, ReplyBox
│   ├── lib/
│   │   ├── config.ts              # env validado con zod (única lectura de process.env)
│   │   ├── agent/
│   │   │   ├── run-turn.ts        # orquesta un turno completo
│   │   │   ├── system-prompt.ts   # template + KB → string (y cache por clínica)
│   │   │   ├── provider.ts        # Vercel AI SDK: modelo según LLM_PROVIDER
│   │   │   ├── guardrails.ts      # post-proceso de la respuesta
│   │   │   └── tools/             # ver-disponibilidad.ts, agendar-turno.ts, actualizar-lead.ts, derivar-humano.ts
│   │   ├── whatsapp/
│   │   │   ├── client.ts          # sendText, sendTemplate, markRead, getMediaUrl, downloadMedia
│   │   │   ├── parse-webhook.ts   # payload Meta → InboundMessage[] | StatusUpdate[]
│   │   │   ├── signature.ts       # X-Hub-Signature-256
│   │   │   └── types.ts
│   │   ├── scheduling/
│   │   │   ├── slots.ts           # rules − blocks − appointments → slots libres (en hora local)
│   │   │   ├── book.ts            # llama a book_appointment() y maneja SLOT_TAKEN
│   │   │   └── google-calendar.ts # push opcional (fase 6)
│   │   ├── followups/
│   │   │   ├── plan.ts            # cuándo y en qué modo (free/template)
│   │   │   └── send.ts
│   │   ├── leads/
│   │   │   └── state-machine.ts   # transiciones válidas + lead_events
│   │   ├── db/
│   │   │   ├── server.ts          # cliente service role (solo server/worker)
│   │   │   ├── browser.ts         # cliente anon + sesión
│   │   │   ├── types.ts           # GENERADO (pnpm db:types)
│   │   │   └── queries/           # clinics.ts, contacts.ts, conversations.ts, messages.ts, leads.ts, appointments.ts
│   │   ├── transcribe.ts          # audio → texto (proveedor por env)
│   │   └── time.ts                # helpers de zona horaria (date-fns-tz o Temporal)
│   ├── worker/
│   │   ├── index.ts               # arranca pg-boss y registra los jobs
│   │   └── jobs/                  # turn.ts, followup.ts, reminder.ts, transcribe.ts
│   └── styles/
│       ├── globals.css
│       └── tokens.css             # variables del sistema de diseño (ver DISENO.md)
├── .env.example
├── biome.json · tsconfig.json · package.json · docker-compose.yml (fase 5)
```

## Flujo de un mensaje entrante

1. Meta hace POST al webhook. Se valida la firma. Se guarda el payload crudo en `webhook_events`.
2. Por cada mensaje: ruteo por `phone_number_id` → `clinic`. Upsert `contact` (con `referral` si vino de un anuncio). Busca conversación abierta o crea una. Inserta `message` con `wa_message_id` (si ya existe, termina: es un reintento).
3. Actualiza `conversations.last_inbound_at` y `window_expires_at = + 24 h`. Si el contacto respondió a un follow-up pendiente, lo cancela y registra `contact_replied`.
4. Encola `turn` con `singletonKey = conversation_id` y `startAfter = 4 s`. Si llega otro mensaje antes, pg-boss descarta el duplicado y se re-encola con el nuevo delay: así se agrupan los mensajes partidos.
5. Responde 200. Todo lo anterior tiene que tardar < 1 s.

## El loop del agente (`runTurn`)

```
runTurn(conversationId)
  ├─ conversation.status == 'human' → skip (registra agent_run.outcome = 'skipped')
  ├─ cargar clinic + KB, contact, lead activo (o crearlo en `nuevo`), últimos 30 messages (+ summary)
  ├─ mensajes de audio sin transcript → job transcribe y re-encolar el turno (una vez)
  ├─ systemPrompt = render(prompts/recepcionista.md, datos)     # cacheado por clinic + versión del prompt
  ├─ generateText({ model, system, messages, tools, maxSteps: 6 })
  │     tools: ver_disponibilidad · agendar_turno · actualizar_lead · derivar_humano
  ├─ guardrails(texto): sin markdown, ≤ 2 burbujas, ≤ 600 chars c/u, sin frases clínicas, precios según policy
  ├─ enviar burbujas por WhatsApp (si ventana cerrada → error, no template: el turno es respuesta a un inbound)
  ├─ guardar messages(out, sender='bot'), agent_runs (tokens, latencia, tools)
  └─ post-turno determinista:
        · agendar_turno ok → lead → turno_agendado, cancelar follow-ups, encolar reminder
        · derivar_humano  → conversation.status = 'human', lead → derivado, notificar a recepción
        · sin tools y lead en interesado/calificado → planificar follow-ups (plan.ts)
        · conversación > 40 mensajes → job de resumen (summary) para el próximo turno
```

Decisión clave: **un solo agente con tools + máquina de estados determinista**, no multi-agente. El LLM decide qué decir y qué tool llamar; el código decide qué estado queda. Eso hace el sistema testeable con escenarios.

## Follow-ups y la ventana de 24 hs

Cuando un paciente escribe se abre una ventana de 24 hs donde se puede responder texto libre. Fuera de la ventana solo se envían templates aprobados (y se pagan).

| Paso | Cuándo (desde el último inbound) | Modo | Quién escribe el texto |
|------|----------------------------------|------|------------------------|
| 1 | +3 h | free | el agente, con instrucción "retomá con una pregunta concreta sobre el turno" |
| 2 | +22 h | free (todavía en ventana) | el agente |
| 3 | +72 h | template `turno_evaluacion_pendiente` | fijo, aprobado en Meta |

Reglas: se cancelan todos si el paciente responde, si se agenda un turno, si el lead pasa a `perdido` o si `contacts.opted_out`. Nunca más de 3 pasos. Después del paso 3 sin respuesta: lead → `perdido` con `lost_reason = 'sin_respuesta'`.
Las horas viven en `clinics.settings.followup_hours` para ajustar por clínica.

## Derivación a humano

- Disparadores: el paciente lo pide, urgencia, queja, info que no está en la KB, situación clínica, o el modelo no sabe (`info_faltante`).
- Efecto: `conversations.status = 'human'`, lead → `derivado`, evento `handoff`, aviso a recepción (WhatsApp al número de `settings.handoff_notify_wa_id` vía template, o email).
- La recepcionista responde desde el panel (`ReplyBox` → `POST /api/conversations/:id/messages`). Si la ventana está abierta manda texto; si no, el panel ofrece el template.
- Botón "Devolver a la IA": `status = 'bot'`, evento `returned_to_bot`. El agente retoma con el historial completo.

## Multi-tenant

- Todo filtra por `clinic_id`. Una sola URL de webhook para todas las clínicas; el ruteo es por `phone_number_id`.
- Credenciales de WhatsApp por clínica en `clinics` (fase 5: Supabase Vault).
- Panel: RLS con `clinic_members`. Usuario `agencia` puede pertenecer a varias clínicas.
- Prompt, KB y disponibilidad son datos, no código. Dar de alta una clínica = correr un seed.

## Variables de entorno

Ver `.env.example`. `src/lib/config.ts` las valida con zod al arrancar; si falta una, el proceso no levanta.

## Deploy (fase 5)

- **Base**: Supabase hosteado (Postgres + Auth + Realtime).
- **App + worker**: Railway (dos servicios desde el mismo repo, `pnpm start` y `pnpm worker`) o un VPS con `docker-compose.yml` (app, worker). Sin Vercel para el webhook y el worker.
- **Dominio**: `api.<tu-agencia>.com` para el webhook, `panel.<tu-agencia>.com` para el panel.
- **Local**: `ngrok http 3000` para que Meta llegue al webhook.

## Costos por clínica (estimación para fijar precio)

LLM con prompt caching (el system prompt es grande y estable) + transcripción ocasional + hosting compartido: unos pocos USD por mes por clínica con volumen de consultorio chico. WhatsApp: respuestas dentro de ventana sin costo; templates (recordatorios y follow-up 3) a centavos cada uno. `agent_runs.cost_usd` da el número real.
