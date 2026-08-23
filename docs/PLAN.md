# PLAN — Recepcionista IA

Fuente de verdad de qué se hace ahora. Cada tarea tiene un id, alcance y **Verificación** (lo que tiene que pasar para tildarla).
Se trabaja **una tarea por sesión de Claude Code**. Al cerrar: `/cerrar-tarea <id>`.

Convención de estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecha · `[-]` descartada (decir por qué en DECISIONES.md).

---

## Fase 0 — Cimientos (medio día)

- [ ] **0.1 Scaffold del repo.** `create-next-app` con TypeScript, Tailwind v4, App Router, `src/`. Agregar Biome, Vitest, zod, `ai` + proveedores (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`), `@supabase/supabase-js`, `@supabase/ssr`, `pg-boss`, `tsx`, `date-fns` + `date-fns-tz`. Scripts de `package.json` exactamente como los lista `CLAUDE.md`.
  - Verificación: `pnpm typecheck && pnpm lint && pnpm test` pasan con un test trivial. `pnpm dev` levanta.
- [ ] **0.2 Config y env.** `src/lib/config.ts` con zod. `.env.example` completo. `scripts/hooks/*` funcionando (probar editando `.env` con Claude: debe bloquear).
  - Verificación: arrancar sin una variable requerida falla con mensaje claro.
- [ ] **0.3 Base de datos.** `supabase init`, `supabase start` (local), aplicar `0001_init.sql`, `pnpm db:types`. `scripts/seed.ts` + `pnpm seed:demo` carga Dental Nova.
  - Verificación: `select count(*) from services where clinic_id = '...001'` = 6. `book_appointment` con dos turnos solapados lanza `SLOT_TAKEN`.
- [ ] **0.4 Tokens de diseño + shell del panel.** `src/styles/tokens.css` con los tokens de `docs/DISENO.md`, shadcn instalado y re-tematizado, layout `(panel)` con rail, header y "Pulso de recepción" estático. Login con Supabase Auth (magic link).
  - Verificación: captura de pantalla del shell en desktop y mobile; contraste de texto ≥ 4.5:1 (verificar con los tokens).

## Fase 1 — WhatsApp entra y sale (1 día)

- [ ] **1.1 Cliente de WhatsApp.** `client.ts`: `sendText`, `sendTemplate`, `markRead`, `getMediaUrl`, `downloadMedia`. Tipos de `types.ts`. Errores tipados (`WindowClosedError`, `WhatsAppApiError`).
  - Verificación: test unitario con fetch mockeado; prueba manual enviando un texto al número de prueba.
- [ ] **1.2 Webhook.** `route.ts` GET (verify) y POST (firma, `webhook_events`, parse, upsert contact/conversation, insert message con dedupe, encolar `turn`). Statuses actualizan `messages.status`.
  - Verificación: test con 3 payloads reales de Meta (texto, audio, status). Enviar el mismo payload dos veces → un solo message. Responde en < 1 s.
- [ ] **1.3 Worker base.** `src/worker/index.ts` con pg-boss, cola `turn` con `singletonKey` + `startAfter 4 s`. Por ahora el job responde "Recibido" para probar el circuito completo.
  - Verificación: mandar 3 mensajes seguidos desde el celular → una sola respuesta después de ~4 s.

## Fase 2 — El agente (2 días)

- [ ] **2.1 System prompt desde datos.** `system-prompt.ts` renderiza `prompts/recepcionista.md` con la KB de la clínica (bloques de servicios, profesionales, obras sociales, FAQs, política de precios). Cache por clínica + hash del template.
  - Verificación: snapshot test del prompt de Dental Nova. Cambiar `price_policy` cambia el bloque de precios.
- [ ] **2.2 Máquina de estados de leads.** `state-machine.ts` con transiciones válidas, `transition()` que escribe `lead_events`. Tabla de transiciones en el archivo como comentario.
  - Verificación: tests de transiciones válidas e inválidas (ej. `perdido → turno_agendado` falla).
- [ ] **2.3 Agenda.** `slots.ts` (rules − blocks − appointments, en hora local, próximos 14 días, franja mañana/tarde) y `book.ts` (usa `book_appointment`, mapea `SLOT_TAKEN`).
  - Verificación: tests con reglas de Dental Nova: martes a la mañana solo Dr. Soler y Dra. Méndez; feriado bloqueado no aparece.
- [ ] **2.4 Tools + runTurn.** Las 4 tools con zod, `provider.ts`, `guardrails.ts`, `run-turn.ts` con el post-turno determinista. `agent_runs` completo.
  - Verificación: `pnpm simulate saludo-basico` y `precio-brackets` en PASS.
- [ ] **2.5 Simulador y escenarios base.** `scripts/simulate.ts` (WhatsApp falso en memoria, clínica por env, expectativas del JSON) + los 8 escenarios de `/simular`.
  - Verificación: `pnpm simulate all` → 8/8 PASS. El subagente `probador` devuelve una línea.
- [ ] **2.6 Audios e imágenes.** `transcribe.ts` + job `transcribe`; imágenes → respuesta fija + `actualizar_lead`. Mensajes partidos cubiertos por el debounce.
  - Verificación: escenarios `audio-sin-texto` y `mensajes-partidos` en PASS; prueba real con un audio desde el celular.

## Fase 3 — Panel (1,5 días)

- [ ] **3.1 Bandeja.** Lista de leads con filtros por estado, búsqueda por nombre/teléfono, orden por último contacto. Realtime: un lead nuevo aparece sin recargar. "Requiere atención humana" arriba, con el estilo de `DISENO.md`.
  - Verificación: captura desktop y mobile; un mensaje real desde el celular aparece en < 3 s.
- [ ] **3.2 Detalle de conversación.** Hilo de mensajes (contacto / IA / humano diferenciados), datos del lead editables (servicio, obra social, notas, estado vía máquina de estados), turno si existe.
  - Verificación: cambiar estado desde el panel escribe `lead_events` con `actor = 'human'`.
- [ ] **3.3 Tomar / devolver + responder.** Botón "Tomar conversación" (handoff manual), `ReplyBox` con envío por `POST /messages` respetando ventana (si está cerrada, ofrece template), "Devolver a la IA".
  - Verificación: derivar desde el celular ("quiero hablar con una persona") → aparece marcado; responder desde el panel llega al celular; devolver a la IA y el agente retoma.
- [ ] **3.4 Métricas v1.** Cuatro números de hoy y de la semana desde `v_clinic_daily_metrics`: consultas, turnos, conversión, requirieron humano. Nada más.
  - Verificación: los números coinciden con un `select` manual.

## Fase 4 — Follow-ups y recordatorios (1 día)

- [ ] **4.1 Planificación.** `plan.ts`: al cerrar un turno del agente sin tool de turno y lead en `interesado`/`calificado`, crear pasos 1 y 2 (free) y 3 (template) según `settings.followup_hours`. Cancelación por respuesta, turno, perdido u opt-out.
  - Verificación: tests de planificación y cancelación; escenario `seguimiento-cancela-al-responder`.
- [ ] **4.2 Envío.** Job `followup`: free → `runTurn` con instrucción de retomar; template → `sendTemplate`. Registra `follow_up_sent`. Paso 3 sin respuesta → `perdido`.
  - Verificación: con `followup_hours = [0.01, 0.02, 0.03]` en local, los tres pasos salen y el lead termina en `perdido`.
- [ ] **4.3 Recordatorio de turno.** Job `reminder` 24 h antes (template `recordatorio_turno`) + `reminder_sent_at`.
  - Verificación: turno para mañana → recordatorio encolado con la hora correcta en zona local.
- [ ] **4.4 Templates en Meta.** Enviar a aprobar `turno_evaluacion_pendiente` y `recordatorio_turno` (categoría utility) desde el WhatsApp Manager. Guardar `meta_template_id`.
  - Verificación: `templates.status = 'approved'`; un envío real fuera de ventana llega.

## Fase 5 — Producción (1 día)

- [ ] **5.1 Deploy.** Railway (app + worker) o VPS con docker-compose. Supabase hosteado con migraciones aplicadas. Dominio del webhook con HTTPS.
- [ ] **5.2 Secretos.** Tokens de WhatsApp por clínica fuera de texto plano (Supabase Vault o cifrado con clave en env). Token permanente de usuario del sistema.
- [ ] **5.3 Observabilidad mínima.** Logs estructurados (pino), alerta por WhatsApp/email a la agencia si `agent_runs.outcome = 'error'` 3 veces en 10 min, purga de `webhook_events` > 30 días.
- [ ] **5.4 Onboarding de clínica real.** `/nueva-clinica` con el formulario completo, conectar su número (Business Manager del cliente, app y token), webhook apuntando a producción.
  - Verificación: la clínica manda un mensaje desde un celular ajeno y agenda un turno de punta a punta.

## Fase 6 — Después del primer cliente

- [ ] 6.1 Google Calendar push por profesional.
- [ ] 6.2 Métricas económicas (valor por turno configurable) y exportación CSV.
- [ ] 6.3 Embedded Signup + Tech Provider (onboarding de 5 minutos y coexistencia con el número existente).
- [ ] 6.4 Segundo nicho (estética): mismo core, prompt y onboarding distintos.

---

## Fuera de alcance (no discutir hasta tener 3 clientes)
Historias clínicas, diagnóstico, recetas, facturación, app móvil, portal de pacientes, llamadas con IA, marketing masivo, integraciones con software de gestión odontológica.
