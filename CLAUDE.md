# Recepcionista IA — CLAUDE.md

Recepcionista comercial con IA para WhatsApp, nicho inicial clínicas odontológicas.
Flujo: consulta por WhatsApp → IA responde con datos reales de la clínica → califica → ofrece turnos → agenda → registra en CRM → follow-up si el lead desaparece.
La IA tiene rol SOLO administrativo/comercial. Nunca diagnostica ni recomienda tratamientos.

## Documentos fuente (leer cuando aplique, no todos siempre)
- `docs/PLAN.md` — fases y tareas. Es la fuente de verdad de qué se hace ahora.
- `docs/ARQUITECTURA.md` — árbol de carpetas, flujo de datos, loop del agente, decisiones.
- `docs/DISENO.md` — tokens, tipografía, layout. Obligatorio antes de tocar UI.
- `docs/DECISIONES.md` — decisiones tomadas; no reabrirlas sin avisar.
- `supabase/migrations/0001_init.sql` — esquema. Es la verdad sobre los datos.

## Stack (no cambiar sin registrar en DECISIONES.md)
- Next.js App Router + TypeScript `strict` + Tailwind v4 + shadcn/ui. Un solo repo.
- Supabase (Postgres, Auth, RLS por `clinic_id`). Service role SOLO en servidor/worker.
- Worker Node separado (`src/worker/`) con pg-boss sobre el mismo Postgres: turnos del agente, follow-ups, recordatorios.
- LLM vía Vercel AI SDK (`ai`) con tool calling. Proveedor por env (`LLM_PROVIDER`). Nada atado a un SDK de un proveedor.
- WhatsApp Cloud API oficial de Meta. Nunca librerías no oficiales.
- Zod para validar env y payloads. Vitest para tests. Biome para lint/format. pnpm.

## Comandos
- `pnpm dev` — app. `pnpm worker` — worker. `pnpm typecheck` — tsc sin emit.
- `pnpm test` — vitest. `pnpm lint` — biome check. `pnpm lint:fix` — biome check --write.
- `pnpm simulate <escenario>` — corre `scripts/scenarios/<escenario>.json` contra el agente SIN WhatsApp y devuelve PASS/FAIL.
- `pnpm db:types` — regenera `src/lib/db/types.ts` desde Supabase. `pnpm db:push` — aplica migraciones.
- `pnpm seed:demo` — carga Clínica Dental Nova.

## Reglas que no se negocian
- Multi-tenant desde el día 1: toda tabla lleva `clinic_id`; toda query filtra por clínica; el webhook rutea por `phone_number_id`.
- El webhook responde 200 en <2 s y NO procesa: encola. Dedupe por `wa_message_id`.
- Los mensajes entrantes se agrupan (debounce 4 s por conversación) antes de llamar al LLM. Una sola respuesta por turno.
- Ventana de 24 hs de WhatsApp: fuera de ventana solo se envían templates aprobados. `sendText` debe fallar fuerte si la ventana está cerrada.
- El agente solo responde con info de la base de conocimiento de la clínica. Si no sabe: deriva. Precios según `price_policy` de la clínica.
- Estados de lead y transiciones viven en `src/lib/leads/state-machine.ts`. Nada cambia `leads.status` por fuera.
- No se guarda información clínica (diagnósticos, síntomas detallados) en la base. Solo datos de contacto, servicio de interés y conversación.
- Nunca leer ni imprimir `.env*`. Nunca commitear tokens.
- Migraciones: solo se crean archivos nuevos en `supabase/migrations/`; nunca se edita una aplicada.

## Cómo trabajar
- Antes de implementar una tarea de `docs/PLAN.md`: leer los archivos que toca, proponer plan corto, esperar OK si toca más de 3 archivos.
- Verificación obligatoria al terminar: `pnpm typecheck && pnpm lint && pnpm test`. Si la tarea toca el agente: `pnpm simulate` con los escenarios indicados en la tarea.
- Al terminar una tarea: tildarla en `docs/PLAN.md`, anotar desvíos en `docs/DECISIONES.md` si los hubo, commit con mensaje `tipo(scope): qué` (feat/fix/chore/docs).
- Usar subagentes para explorar código o correr suites ruidosas; traer al contexto principal solo el resumen.
- Respuestas cortas en español rioplatense. Código y comentarios en inglés; textos de UI y del agente en español.
- Al compactar: conservar lista de archivos modificados, la tarea actual del PLAN y los comandos de verificación.
