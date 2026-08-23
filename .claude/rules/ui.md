---
paths:
  - "src/app/**/*.tsx"
  - "src/components/**"
  - "src/styles/**"
---

# Reglas de UI

- Leer `docs/DISENO.md` antes de crear o modificar pantallas. Tokens en `src/styles/tokens.css`; nunca hex sueltos en componentes.
- Componentes base: shadcn/ui re-tematizado con los tokens. Íconos: lucide-react. Nada de emojis como íconos.
- Server Components por defecto; `"use client"` solo donde hay interacción. Datos vía queries tipadas, no fetch a la propia API desde el servidor.
- Textos en español rioplatense, voseo, sentence case ("Tomar conversación", no "Tomar Conversación"). Los botones dicen lo que hacen.
- Estados vacíos y errores con acción concreta ("Todavía no hay consultas hoy. Compartí el número en la web e Instagram.").
- Accesibilidad mínima: contraste 4.5:1, foco visible, targets ≥ 44 px, labels visibles en formularios.
- Mobile primero para la Bandeja y el detalle de conversación: la recepcionista lo va a abrir desde el celular.
- Motion: 150–300 ms, solo con significado (entrada de un lead nuevo, cambio de estado). Respetar `prefers-reduced-motion`.
