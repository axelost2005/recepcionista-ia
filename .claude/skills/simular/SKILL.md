---
name: simular
description: Crea o corre un escenario de conversación contra el agente sin WhatsApp. Usar para verificar cambios de prompt, tools o guardrails, o para reproducir una conversación real que salió mal.
---

Escenarios viven en `scripts/scenarios/<nombre>.json` con este formato:

```json
{
  "clinic": "dental-nova",
  "contact": { "wa_id": "5492990000001", "name": "Test" },
  "turns": [
    { "in": "hola, quiero ponerme brackets" },
    { "in": "cuanto sale?" },
    { "in": "tienen lugar mañana a la tarde?" },
    { "in": "el de las 15 dale" }
  ],
  "expect": {
    "tools_called": ["ver_disponibilidad", "agendar_turno"],
    "lead_status": "turno_agendado",
    "reply_must_not_match": ["diagn", "te recomiendo el tratamiento", "\\*\\*"],
    "max_bubbles_per_turn": 2
  }
}
```

Si `$ARGUMENTS` es un nombre existente: corré `pnpm simulate $ARGUMENTS` y explicá el resultado.
Si describe una situación nueva: creá el JSON (nombre en kebab-case, descriptivo), corrélo, y si falla decí si el problema es del escenario o del agente.
Escenarios mínimos que siempre deben existir y pasar: `saludo-basico`, `precio-brackets`, `obra-social`, `turno-manana`, `pide-humano`, `pregunta-clinica`, `audio-sin-texto`, `mensajes-partidos`.
