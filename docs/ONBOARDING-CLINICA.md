# Formulario de onboarding de clínica

Se completa con el cliente en 20 minutos (llamada o Google Form). Cada respuesta tiene destino en la base. `/nueva-clinica` lo convierte en un seed.

| # | Pregunta | Destino |
|---|----------|---------|
| 1 | Nombre de la clínica tal como querés que lo diga la recepcionista | `clinics.name` |
| 2 | Nombre para la recepcionista virtual (o dejá "Sofi") | `settings.bot_name` |
| 3 | Dirección exacta y link de Google Maps | `profile.address`, `profile.maps_url` |
| 4 | Horarios de atención (por día) | `profile.hours` |
| 5 | Medios de pago y si hay cuotas (cuántas, con o sin interés) | `profile.payment_methods`, FAQ "planes de pago" |
| 6 | Servicios que ofrecen, con una descripción corta de cada uno y palabras con las que la gente los pide ("frenos", "brackets") | `services.name/description/keywords` |
| 7 | Precios: ¿los pasan por WhatsApp? Opciones: exacto / rango / solo en consulta. Si hay precios, listarlos | `settings.price_policy`, `services.price_from/price_to/price_note` |
| 8 | Profesionales: nombre, especialidad, días y horarios de cada uno | `professionals`, `availability_rules` |
| 9 | Duración de la consulta de evaluación | `settings.evaluation_slot_minutes` |
| 10 | Obras sociales y prepagas que aceptan, con planes y qué cubre cada una. Cuáles NO aceptan y se preguntan seguido | `insurances` (accepted true/false, plans, notes) |
| 11 | ¿Atienden niños? ¿urgencias? ¿desde qué edad? | `faqs` |
| 12 | Qué hay que traer a la primera consulta y política de cancelación | `profile.first_visit_notes`, `profile.cancellation_policy` |
| 13 | Las 5 preguntas que más les hacen por WhatsApp y cómo las responden hoy | `faqs` |
| 14 | ¿A quién avisamos cuando hace falta una persona? (número de WhatsApp y/o email de recepción) | `settings.handoff_notify_wa_id`, `settings.handoff_notify_email` |
| 15 | Número de WhatsApp que va a usar la recepcionista (nuevo dedicado o el existente) y quién administra el Meta Business de la clínica | `clinics.wa_*` (se completa en el alta técnica) |

Preguntas extra que conviene hacer aunque no tengan columna:
- ¿Cuánto vale para ustedes un paciente nuevo de ortodoncia/implantes? (para el pitch de métricas, fase 6).
- ¿Quién responde hoy el WhatsApp y en qué horario? (para medir el "fuera de horario").
- ¿Hacen anuncios en Meta/Google? (para activar `referral` y el origen del lead).

Pedir también: logo (para el panel), y un par de capturas de conversaciones reales típicas (para escenarios de simulación con datos reales).
