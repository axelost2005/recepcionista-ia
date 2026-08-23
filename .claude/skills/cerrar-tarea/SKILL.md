---
name: cerrar-tarea
description: Cierra la tarea actual del PLAN con verificación completa, revisión adversarial y commit. Usar al terminar cualquier tarea antes de pasar a la siguiente.
disable-model-invocation: true
---

Cerrá la tarea `$ARGUMENTS` (id del PLAN, ej. `2.3`) siguiendo este orden sin saltear pasos:

1. `pnpm typecheck && pnpm lint && pnpm test`. Si algo falla, arreglalo antes de seguir; no desactives reglas ni tests.
2. Si la tarea toca `src/lib/agent`, `prompts/` o `src/lib/leads`: pedile al subagente `probador` que corra los escenarios y arreglá los FAIL.
3. Pedile al subagente `revisor` que compare el diff contra la tarea. Arreglá los **Bloqueantes**; los **Deberías** arreglalos si llevan menos de 10 minutos, si no anotalos en `docs/PLAN.md` como tarea nueva.
4. Tildá la tarea en `docs/PLAN.md`. Si cambiaste una decisión de arquitectura, agregá una línea en `docs/DECISIONES.md`.
5. `git add -A && git commit -m "<tipo>(<scope>): <qué>"`. Mostrame el mensaje antes de commitear.
6. Terminá con un resumen de 5 líneas máximo: qué se hizo, qué se verificó, qué quedó pendiente, y cuál es la siguiente tarea del PLAN.
