# Flujo de trabajo con Claude Code

Regla madre: **el contexto es el recurso escaso**. Todo lo de abajo existe para que cada sesión arranque limpia, tenga un solo objetivo y termine con verificación.

## 1. Qué se carga en cada sesión (y qué no)

- Siempre: `CLAUDE.md` (corto a propósito, < 100 líneas) y las reglas de `.claude/rules/` **sin** `paths`. Las reglas con `paths` se cargan solo cuando Claude toca archivos que matchean.
- Bajo demanda: `docs/*.md` (Claude los lee cuando la tarea lo requiere), skills (`/simular`, `/nueva-clinica`, `/cerrar-tarea`), subagentes.
- Chequeo: `/context` muestra qué cargó y cuánto ocupa. Si `CLAUDE.md` crece, mover cosas a `rules/` con `paths` o a skills. `/doctor` propone recortes.
- Antes de la primera sesión real, `/init` puede proponer ajustes sobre este `CLAUDE.md`; revisalos, no los aceptes en bloque.

## 2. Una sesión = una tarea del PLAN

Ciclo completo:

```
/clear
> Leé docs/PLAN.md. La tarea es 2.3 (agenda). Explorá src/lib/scheduling y supabase/migrations/0001_init.sql
> con un subagente y después proponeme un plan de implementación en plan mode.
          [Shift+Tab hasta ver "plan mode" — Claude lee y planea, no edita]
> OK, implementá. Corré los tests que escribiste y mostrame la salida.
> /cerrar-tarea 2.3
/clear
```

- **Plan mode** (Shift+Tab) para todo lo que toque más de 3 archivos o no tengas claro el enfoque. Para un fix de una línea, directo.
- **Course-correct temprano**: `Esc` para frenar, `Esc Esc` o `/rewind` para volver a un checkpoint (restaura conversación y/o código). Si corregiste dos veces lo mismo, `/clear` y reescribí el prompt con lo aprendido; una sesión limpia con mejor prompt le gana a una larga llena de correcciones.
- **`/compact <instrucciones>`** si la sesión es larga y todavía falta: "conservá los archivos modificados, la tarea actual y los comandos de verificación". `CLAUDE.md` ya le dice qué preservar al compactar.
- **`/btw`** para preguntas al costado (no entran al historial).
- **`/rename`** a cada sesión (`fase2-agenda`) para poder retomarla con `claude --resume`.

## 3. Subagentes: cuándo y cuáles

La exploración de código y las salidas ruidosas (tests, logs, docs de Meta) van a un subagente; al contexto principal vuelve solo el resumen.

| Necesidad | Qué usar | Cómo pedirlo |
|-----------|----------|--------------|
| Entender código antes de implementar | `Explore` (built-in, solo lectura) | "usá subagentes para investigar cómo se arma el system prompt y qué queries existen" |
| Leer docs de Meta / Supabase sin llenar el contexto | `Explore` con WebFetch | "investigá con un subagente el formato del payload de statuses del webhook y traeme un ejemplo" |
| Correr los escenarios | `probador` (`.claude/agents/probador.md`) | "pedile al probador que corra todos los escenarios" |
| Revisión adversarial del diff | `revisor` | lo hace `/cerrar-tarea` solo |
| Dos partes independientes en paralelo | dos subagentes en paralelo | "investigá en paralelo con dos subagentes: (a) ... (b) ..." |

No uses subagentes para lo que necesita ida y vuelta con vos (decisiones de diseño, debugging interactivo): eso va en la conversación principal.

## 4. Loops: el agente que verifica hasta que pasa

El principio: **dale a Claude una verificación que devuelva PASS/FAIL y dejalo iterar**. En este proyecto hay cuatro:

1. `pnpm typecheck && pnpm lint && pnpm test` — para código.
2. `pnpm simulate <escenario>` / `all` — para el agente conversacional. Es el loop más valioso: cada cambio de prompt o tool se prueba contra 8+ conversaciones reales en segundos, sin WhatsApp.
3. Captura de pantalla en 390 px y 1280 px comparada contra el wireframe de `DISENO.md` — para UI.
4. Prueba real desde tu celular contra el número de prueba — para el circuito completo.

Cómo encadenarlo sin que seas vos el loop:

- **En el prompt**: "implementá X, corré `pnpm simulate all` y seguí corrigiendo hasta que los 8 pasen; mostrame la salida final."
- **Con `/goal`**: `/goal pnpm typecheck, pnpm test y pnpm simulate all pasan` — un evaluador aparte re-chequea la condición después de cada turno y Claude sigue trabajando hasta cumplirla. Para tareas largas que querés dejar corriendo.
- **Con un Stop hook** (opcional, fase 2+): un script que corre `pnpm simulate all` al final de cada turno y bloquea el cierre si hay FAIL. Es determinista; Claude Code lo fuerza a parar después de 8 bloqueos consecutivos, así que no se cuelga.
- **`/verify`** después de tareas de UI: prueba la app corriendo.

Lo que **no** hagas: loops autónomos sin verificación ("seguí hasta que quede perfecto"), ni dejar una sesión horas en `bypassPermissions`. Sin un check objetivo, "terminado" es solo una sensación del modelo.

## 5. Trabajo en paralelo (cuando ya hay base)

Desde la fase 3, el panel y el agente son independientes. Dos sesiones, cada una en su **git worktree** (`git worktree add ../ria-panel feat/panel` y abrir `claude` ahí, o pedirle a Claude que lo cree) para que no se pisen archivos. Patrón Writer/Reviewer: una sesión implementa, la otra revisa el diff con contexto limpio. El worker y el webhook comparten tipos de `src/lib/db/types.ts`: regenerá después de mergear migraciones.

## 6. Headless para lo repetitivo

- Generar escenarios a partir de conversaciones reales exportadas: `claude -p "convertí este chat en un escenario JSON con el formato de /simular" < chat.txt`.
- Revisión en CI (después): `claude -p "/code-review"` sobre el diff del PR.

## 7. Checklist de sesión

- [ ] `/clear` y una sola tarea del PLAN.
- [ ] Plan mode si toca > 3 archivos.
- [ ] Subagente para explorar; nunca "investigá todo".
- [ ] Verificación objetiva definida antes de implementar.
- [ ] `/cerrar-tarea <id>` al final (typecheck, lint, test, simulate, revisor, PLAN, commit).
- [ ] Si algo te sorprendió o repetiste una corrección: línea nueva en `CLAUDE.md` o en la regla que corresponda. Ese archivo se paga solo con el tiempo.
