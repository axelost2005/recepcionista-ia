# Empezar acá — lo que tenés que hacer vos, en orden

Este documento es la lista literal. Todo lo que requiere una cuenta, una tarjeta, un clic en un panel de terceros o una decisión tuya está acá. Lo que es código lo hace Claude Code siguiendo `PLAN.md`.

Tiempo estimado total hasta demo funcional: 7 a 10 días de trabajo real, solo.

---

## Día 0 — Cuentas y herramientas (2 a 3 horas)

### Cuentas
1. **Meta for Developers** (developers.facebook.com): iniciá sesión con tu cuenta personal de Facebook → "Mis apps" → "Crear app" → tipo **Empresa** → nombre `Recepcionista IA` → vinculá o creá un **Meta Business Portfolio** de tu agencia.
2. En la app: "Agregar producto" → **WhatsApp** → "Configurar". Te da un **número de prueba** y un **token temporal**. Anotá `Phone number ID`, `WhatsApp Business Account ID` y, en Configuración de la app → Básica, el `App ID` y el `App Secret`.
3. En "API Setup" agregá tu celular y el de tu socio como destinatarios de prueba (verificación por código). Mandate el mensaje "hello_world" desde el panel para confirmar que llega.
4. **Supabase** (supabase.com): proyecto nuevo `recepcionista-ia`, región `sa-east-1` (São Paulo). Guardá la contraseña de la base. Por ahora vas a trabajar con Supabase local; el proyecto hosteado se usa en fase 5.
5. **Anthropic Console** (console.anthropic.com): API key para el agente. Cargá USD 10 para empezar. Si querés comparar proveedores, también OpenAI (te sirve para Whisper en audios).
6. **GitHub**: repo privado `recepcionista-ia`.
7. **ngrok** (ngrok.com): cuenta gratis + authtoken. Es lo que deja que Meta llegue a tu webhook local.
8. (Ya, en paralelo, porque tarda) **Verificación de empresa en Meta Business Manager** → Centro de seguridad → "Iniciar verificación". Pide constancia de CUIT/ARCA, un documento con nombre y dirección (factura de servicio o extracto) y un dominio/email del negocio. No es requisito para arrancar, pero es el único paso que tarda días.

### Herramientas en tu máquina
- Si estás en Windows: instalá **WSL2 (Ubuntu)** y hacé todo desde ahí. Los hooks y scripts asumen un shell tipo Unix. Si preferís Windows nativo, funciona, pero reescribí los hooks de `scripts/hooks/` con `shell: powershell` en `settings.json`.
- Node LTS (vía `nvm`), `pnpm` (`corepack enable`), git, Docker Desktop (lo necesita Supabase local).
- Claude Code: `curl -fsSL https://claude.ai/install.sh | bash` y `claude` para loguearte. Ya usás la extensión de VS Code; la CLI sirve para worktrees y headless.
- Supabase CLI: `pnpm add -g supabase` o brew. `supabase login`.
- `ngrok` instalado y `ngrok config add-authtoken <token>`.

---

## Día 1 — El repo con estas bases

```bash
mkdir recepcionista-ia && cd recepcionista-ia && git init
# copiá acá TODO el contenido del zip: CLAUDE.md, .claude/, docs/, prompts/, supabase/, scripts/, .env.example
cp .env.example .env.local          # y completá META_*, WHATSAPP_DEV_*, ANTHROPIC_API_KEY
git add -A && git commit -m "chore: bases del proyecto (docs, esquema, claude code)"
claude
```

Primera sesión de Claude Code (pegá tal cual):

> Leé `CLAUDE.md`, `docs/PLAN.md`, `docs/ARQUITECTURA.md` y `docs/DECISIONES.md`. Después corré `/init` y proponeme solo los ajustes a `CLAUDE.md` que agreguen información que no esté ya en los documentos; no reescribas lo que existe. Cuando terminemos eso, entrá en plan mode y proponeme el plan para la tarea 0.1.

Después, una tarea por sesión siguiendo `docs/FLUJO-CLAUDE-CODE.md`. Orden: 0.1 → 0.2 → 0.3 → 0.4 → 1.1 → 1.2 → 1.3 → 2.x → 3.x → 4.x.

Para la tarea 0.3 vas a necesitar Docker corriendo y `supabase start`. Te imprime `anon key`, `service_role key` y la URL: van a `.env.local`.

---

## Día 2 — Conectar Meta con tu webhook local (tarea 1.2)

1. `pnpm dev` en una terminal, `ngrok http 3000` en otra. Copiá la URL `https://xxxx.ngrok-free.app`.
2. Meta for Developers → tu app → WhatsApp → Configuración → **Webhook** → "Editar": URL de callback `https://xxxx.ngrok-free.app/api/webhooks/whatsapp`, token de verificación = el valor de `WHATSAPP_VERIFY_TOKEN` de tu `.env.local`. "Verificar y guardar".
3. En "Campos del webhook" suscribite a **messages**.
4. Mandá un WhatsApp desde tu celular al número de prueba. Tiene que aparecer una fila en `messages` y una en `webhook_events`. Si no, mirá la consola de `pnpm dev`.
5. El token temporal de Meta dura 24 hs. Para no renovarlo a mano: Business Settings → Usuarios → **Usuarios del sistema** → crear uno (admin) → "Generar token" con permisos `whatsapp_business_messaging` y `whatsapp_business_management`, sin vencimiento. Ese va a `WHATSAPP_DEV_ACCESS_TOKEN`.

Cada vez que reiniciás ngrok cambia la URL (plan gratis): hay que actualizarla en Meta. Si te molesta, el dominio fijo de ngrok cuesta poco.

---

## Días 3 a 6 — Agente, panel, follow-ups (fases 2, 3 y 4)

Lo tuyo en estos días, además de dirigir a Claude Code:

- Probar **desde tu celular**, no solo con el simulador. Mandá audios, mandá tres mensajes seguidos, pedí hablar con una persona, preguntá por PAMI.
- Cada conversación real que salga mal → `/simular` con esa conversación como escenario nuevo. Así el agente no vuelve a fallar igual.
- Cuando el prompt esté bien: leelo vos en voz alta como si fueras la recepcionista. Si suena a robot o a folleto, decile a Claude qué frase cambiarías.
- Tarea 4.4: en WhatsApp Manager (business.facebook.com → WhatsApp Manager → Plantillas) creá las dos plantillas de categoría **utilidad** con los textos de `supabase/seed/dental-nova.sql`. Aprobación: de minutos a un día.

---

## Día 7 — Demo y material de venta (no es código)

1. Grabá el video de 60 a 90 segundos: pantalla partida, tu celular escribiendo a "Clínica Dental Nova" a la izquierda, la bandeja del panel a la derecha; termina con el turno apareciendo. Sin voz en off larga; subtítulos con la pregunta del paciente.
2. Propuesta de una hoja: qué hace, qué no hace (no diagnostica), setup + mensual, piloto de 14 días, qué necesitan de ellos (20 minutos del formulario de onboarding y un número de WhatsApp).
3. Formulario de onboarding como Google Form con las 15 preguntas de `docs/ONBOARDING-CLINICA.md`.
4. Lista de las 30 primeras clínicas. Primero las que ya conocen a la agencia.

---

## Antes del primer cliente real (fase 5)

- Deploy: Railway (dos servicios del mismo repo) o VPS + docker-compose. Dominio con HTTPS para el webhook. Actualizar la URL del webhook en Meta.
- Migraciones aplicadas en el Supabase hosteado (`supabase link` + `supabase db push`).
- Alta técnica del cliente (30 a 40 minutos, en llamada con ellos):
  1. Ellos (o vos como admin de su Business Portfolio) agregan el producto WhatsApp en una app de Meta y cargan el **número nuevo** (chip prepago que compran ellos).
  2. Cargan una tarjeta en el método de pago de la WABA (necesaria para templates/recordatorios).
  3. Generás un token de usuario del sistema de **su** portfolio y lo guardás cifrado (tarea 5.2) en la fila de `clinics`.
  4. `/nueva-clinica` con el formulario completo.
  5. Prueba cruzada: vos escribís a su número desde tu celular y agendás un turno. Ellos ven el turno en el panel.
- Contrato simple con una cláusula de tratamiento de datos (solo datos de contacto y conversación; sin datos clínicos). No soy abogado: que lo mire uno antes de firmar con la primera clínica.

---

## Rutina mientras dure el proyecto

- Una sesión de Claude Code = una tarea. `/clear` entre tareas. `/cerrar-tarea` siempre.
- Cada corrección que repetís dos veces → una línea en `CLAUDE.md` o en una regla.
- `docs/PLAN.md` es el único lugar donde vive "qué falta". Si se te ocurre algo nuevo, va ahí como tarea, no se implementa en el momento.
- Viernes: `git log --oneline` de la semana, releer `DECISIONES.md`, y decidir si la semana que viene es código o ventas. A partir de la fase 3, la respuesta tiene que ser ventas al menos dos días.
