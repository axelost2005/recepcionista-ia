---
paths:
  - "supabase/**"
  - "src/lib/db/**"
  - "src/lib/leads/**"
  - "src/lib/scheduling/**"
---

# Reglas de datos

- Fuente de verdad: `supabase/migrations/0001_init.sql`. Cambios de esquema = migración NUEVA numerada; nunca editar una existente.
- Después de cada migración: `pnpm db:push && pnpm db:types`. No escribir tipos de tablas a mano.
- Toda tabla con `clinic_id` tiene RLS activada y la policy `clinic_members`. El servidor usa service role; el browser usa anon + sesión.
- Queries viven en `src/lib/db/queries/<dominio>.ts` y devuelven tipos de `types.ts`. Nada de SQL suelto en componentes o route handlers.
- Transiciones de `leads.status` SOLO vía `src/lib/leads/state-machine.ts` (`transition(lead, to, actor, payload)`), que además inserta en `lead_events`.
- Turnos: crear siempre dentro de una función SQL `book_appointment(...)` que re-chequea disponibilidad; la exclusión GiST es la red de seguridad, no la validación principal.
- Horarios en UTC en la base; conversión a la zona de la clínica (`clinics.timezone`) solo en bordes (prompt, UI, mensajes).
- Datos de salud: no existen columnas para diagnóstico/síntomas. Si aparece la tentación, frenar y leer `docs/DECISIONES.md` #6.
