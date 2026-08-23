# Decisiones

Formato: número, fecha, decisión, por qué, qué descartamos. Se agrega al final; no se edita el pasado.

1. **2026-08 · Un solo repo Next.js + worker Node, sin NestJS.** Velocidad con una sola persona. NestJS agrega ceremonia sin beneficio a esta escala. Se descartó también separar frontend y backend en repos.
2. **2026-08 · Supabase (Postgres + Auth + RLS + Realtime).** Multi-tenant gratis con RLS por `clinic_id`, realtime para la bandeja, y una base que después se puede migrar. Descartado: Prisma + Postgres pelado (más código para lo mismo).
3. **2026-08 · pg-boss sobre el mismo Postgres para colas.** Debounce de mensajes, follow-ups y recordatorios necesitan jobs con delay y `singletonKey`. Descartado: Redis/BullMQ (otra pieza de infra) y n8n para el loop conversacional (no se testea ni se versiona bien por clínica).
4. **2026-08 · Vercel AI SDK como capa de LLM.** Cumple "no atarse a un proveedor" sin escribir una abstracción propia. Proveedor por env. Descartado: SDK de Anthropic directo (atado) y LangChain (demasiado para 4 tools).
5. **2026-08 · Un solo agente con tools + máquina de estados determinista.** El LLM decide qué decir y qué tool llamar; el código decide el estado del lead. Testeable con escenarios. Descartado: multi-agente (router + especialistas), que suma latencia y puntos de falla sin mejorar una conversación de recepción.
6. **2026-08 · No se almacena información clínica.** Solo contacto, servicio de interés, obra social declarada y la conversación. Reduce riesgo legal (datos de salud, Ley 25.326) y mantiene el rol administrativo del producto. Si un tratamiento requiere datos clínicos, eso pasa en la consulta, no en el bot.
7. **2026-08 · Agenda propia con reglas semanales por profesional; Google Calendar solo como espejo (fase 6).** Evita OAuth por clínica en el MVP y soporta varios profesionales. Descartado: FreeBusy de Google como fuente de verdad.
8. **2026-08 · El bot agenda únicamente "consulta de evaluación".** Simplifica la agenda (un tipo, una duración) y coincide con cómo trabajan las clínicas. Tratamientos se agendan desde recepción.
9. **2026-08 · Follow-ups 1 y 2 dentro de la ventana de 24 hs (texto libre), el 3 por template.** Dos de tres sin costo y sin aprobación. Horas configurables por clínica.
10. **2026-08 · WhatsApp Cloud API oficial; número nuevo dedicado para los primeros clientes.** Sin riesgo de baneo, alta en minutos. Coexistencia con el número existente vía Embedded Signup/Tech Provider queda para la fase 6.
11. **2026-08 · Deploy en Railway o VPS, no Vercel.** El webhook necesita responder rápido y el worker necesita un proceso persistente.
12. **2026-08 · Biome en vez de ESLint + Prettier.** Una herramienta, un comando, rápido en el hook de formato.
