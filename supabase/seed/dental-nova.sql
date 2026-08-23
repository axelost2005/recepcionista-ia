-- Seed demo: Clínica Dental Nova (ficticia). Idempotente: se puede correr N veces.
-- UUIDs fijos para poder referenciarlos desde escenarios de simulación.

insert into clinics (id, slug, name, timezone, wa_display_phone, profile, settings)
values (
  '00000000-0000-4000-8000-000000000001', 'dental-nova', 'Clínica Dental Nova',
  'America/Argentina/Buenos_Aires', '+54 9 299 555-0101',
  '{
    "address": "Av. Argentina 345, Neuquén Capital",
    "maps_url": "https://maps.app.goo.gl/ejemplo",
    "hours": "Lunes a viernes de 9 a 19 hs. Sábados de 9 a 13 hs.",
    "payment_methods": ["efectivo", "débito", "crédito hasta 6 cuotas", "transferencia", "Mercado Pago"],
    "cancellation_policy": "Pedimos avisar con 24 horas de anticipación para reprogramar.",
    "parking": "Hay estacionamiento medido en la cuadra.",
    "first_visit_notes": "Traé DNI y credencial de obra social si tenés. La consulta de evaluación dura 30 minutos."
  }'::jsonb,
  '{
    "bot_name": "Sofi",
    "price_policy": "range",
    "evaluation_slot_minutes": 30,
    "followup_hours": [3, 22, 72],
    "handoff_notify_wa_id": null,
    "business_hours_only_bot": false
  }'::jsonb
)
on conflict (slug) do update set name = excluded.name, profile = excluded.profile, settings = excluded.settings;

-- Profesionales
insert into professionals (id, clinic_id, name, specialty, color) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Dra. Valentina Ríos', 'Ortodoncia', '#1F8A7A'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Dr. Martín Soler', 'Implantes y cirugía', '#3B6FB6'),
  ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'Dra. Carla Méndez', 'Odontología general y estética', '#D9931F')
on conflict (id) do update set name = excluded.name, specialty = excluded.specialty;

-- Servicios (precios ficticios, en pesos)
delete from services where clinic_id = '00000000-0000-4000-8000-000000000001';
insert into services (clinic_id, name, category, description, price_from, price_to, price_note, keywords, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'Consulta de evaluación', 'consulta', 'Primera visita: revisión completa y plan de tratamiento. Es el punto de partida de cualquier tratamiento.', 25000, 25000, 'Sin cargo si iniciás el tratamiento en la clínica.', '{"consulta","evaluación","revisión","primera vez"}', 0),
  ('00000000-0000-4000-8000-000000000001', 'Ortodoncia (brackets)', 'ortodoncia', 'Brackets metálicos, estéticos o alineadores. Duración típica 12 a 24 meses.', 180000, 450000, 'Depende del tipo de brackets y del caso. Se define en la evaluación. Hay planes de pago mensuales.', '{"brackets","frenos","aparatos","ortodoncia","alineadores","invisalign"}', 1),
  ('00000000-0000-4000-8000-000000000001', 'Implantes dentales', 'implantes', 'Implante de titanio + corona. Incluye estudios previos.', 900000, 1400000, 'Por pieza. El presupuesto final sale de la evaluación con tomografía.', '{"implante","implantes","diente faltante","pieza"}', 2),
  ('00000000-0000-4000-8000-000000000001', 'Blanqueamiento', 'estética', 'Blanqueamiento en consultorio con LED, una sesión de 60 minutos.', 120000, 150000, null, '{"blanqueamiento","blanquear","dientes blancos"}', 3),
  ('00000000-0000-4000-8000-000000000001', 'Limpieza dental', 'general', 'Limpieza profesional y control. Recomendada cada 6 meses.', 35000, 45000, null, '{"limpieza","sarro","control"}', 4),
  ('00000000-0000-4000-8000-000000000001', 'Endodoncia (tratamiento de conducto)', 'general', 'Tratamiento de conducto en una o dos sesiones.', 150000, 260000, 'Según la pieza (anterior, premolar o molar).', '{"conducto","endodoncia","nervio","dolor de muela"}', 5);

-- Obras sociales
delete from insurances where clinic_id = '00000000-0000-4000-8000-000000000001';
insert into insurances (clinic_id, name, plans, accepted, notes) values
  ('00000000-0000-4000-8000-000000000001', 'OSDE', '{"210","310","410","450","510"}', true, 'Cubre consulta, limpieza y conducto. Ortodoncia e implantes son particulares.'),
  ('00000000-0000-4000-8000-000000000001', 'Swiss Medical', '{}', true, 'Cubre consulta y limpieza.'),
  ('00000000-0000-4000-8000-000000000001', 'ISSN', '{}', true, 'Cubre consulta, limpieza y conducto con coseguro.'),
  ('00000000-0000-4000-8000-000000000001', 'OSPE', '{}', true, null),
  ('00000000-0000-4000-8000-000000000001', 'PAMI', '{}', false, 'No atendemos PAMI.');

-- FAQs
delete from faqs where clinic_id = '00000000-0000-4000-8000-000000000001';
insert into faqs (clinic_id, question, answer, tags) values
  ('00000000-0000-4000-8000-000000000001', '¿Atienden niños?', 'Sí, atendemos a partir de los 4 años. La primera visita es una evaluación de 30 minutos.', '{"niños","pediatría"}'),
  ('00000000-0000-4000-8000-000000000001', '¿Atienden urgencias?', 'Sí, de lunes a viernes en horario de atención. Si tenés dolor fuerte o un golpe, avisanos y te derivamos con la recepción para darte prioridad.', '{"urgencia","dolor","emergencia"}'),
  ('00000000-0000-4000-8000-000000000001', '¿Tienen planes de pago?', 'Sí. Ortodoncia e implantes se pueden pagar en cuotas mensuales sin interés. El detalle se arma en la evaluación.', '{"cuotas","pago","financiación"}'),
  ('00000000-0000-4000-8000-000000000001', '¿Hacen blanqueamiento el mismo día de la consulta?', 'Si en la evaluación se confirma que estás en condiciones, sí, se puede hacer en la misma visita.', '{"blanqueamiento"}');

-- Disponibilidad semanal (hora local). Dra. Ríos: lun/mié/vie tarde. Dr. Soler: mar/jue mañana. Dra. Méndez: lun a vie todo el día.
delete from availability_rules where clinic_id = '00000000-0000-4000-8000-000000000001';
insert into availability_rules (clinic_id, professional_id, weekday, start_time, end_time, slot_minutes) values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 1, '14:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 3, '14:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 5, '14:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 2, '09:00', '13:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 4, '09:00', '13:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 1, '09:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 2, '09:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 3, '09:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 4, '09:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 5, '09:00', '19:00', 30),
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 6, '09:00', '13:00', 30);

-- Template de seguimiento (paso 3, fuera de ventana). Se envía a aprobar en Meta en la fase 4.
insert into templates (clinic_id, name, language, category, body, status) values
  ('00000000-0000-4000-8000-000000000001', 'turno_evaluacion_pendiente', 'es_AR', 'utility',
   'Hola {{1}}, te escribimos de {{2}}. Quedó pendiente coordinar tu turno de evaluación. ¿Querés que te pasemos horarios disponibles? Respondé a este mensaje y te ayudamos.', 'pending')
on conflict (clinic_id, name, language) do nothing;
