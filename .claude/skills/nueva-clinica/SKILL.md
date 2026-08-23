---
name: nueva-clinica
description: Da de alta una clínica nueva en la base a partir del formulario de onboarding (docs/ONBOARDING-CLINICA.md) y deja el agente listo para probar. Usar cuando se quiere cargar un cliente o un demo.
disable-model-invocation: true
---

Cargá una clínica a partir de las respuestas del formulario que te paso en `$ARGUMENTS` (ruta a un .md o .json con las respuestas, o el texto pegado).

1. Leé `docs/ONBOARDING-CLINICA.md` para el mapeo pregunta → tabla/columna.
2. Generá un archivo `supabase/seed/<slug>.sql` idempotente (upsert por `slug`) que inserte: `clinics` (con `profile` y `settings`), `services`, `professionals`, `insurances`, `faqs`, `availability_rules`.
3. NO inventes datos que el formulario no trae: dejá `NULL` y listá al final qué falta preguntar.
4. Aplicá el seed contra la base local (`pnpm seed -- <slug>`), y corré `pnpm simulate saludo-basico` con `CLINIC_SLUG=<slug>` para confirmar que el prompt se arma con los datos nuevos.
5. Reportá: filas insertadas por tabla, datos faltantes, y el texto del saludo que generó la IA.
