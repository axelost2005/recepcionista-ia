-- 0001_init.sql — Recepcionista IA (multi-tenant por clinic_id)
-- Convenciones: uuid PK, timestamptz en UTC, text + CHECK en vez de enums (más fácil de evolucionar),
-- RLS en toda tabla con clinic_id. El backend usa service role (bypass RLS); el panel usa auth.uid().

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Tenants
-- ---------------------------------------------------------------------------
create table clinics (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,                 -- 'dental-nova'
  name                text not null,                        -- 'Clínica Dental Nova'
  timezone            text not null default 'America/Argentina/Buenos_Aires',
  -- WhatsApp Cloud API (una WABA/número por clínica)
  wa_phone_number_id  text unique,                          -- ruteo del webhook
  wa_waba_id          text,
  wa_display_phone    text,                                 -- '+54 9 299 ...' para mostrar
  wa_access_token     text,                                 -- TODO fase 5: mover a Supabase Vault
  -- Datos que el agente usa tal cual (ver docs/ONBOARDING-CLINICA.md)
  profile             jsonb not null default '{}'::jsonb,
  /* profile = {
       "address": "Av. Argentina 123, Neuquén", "maps_url": "...",
       "hours": "Lun a Vie 9 a 19, Sáb 9 a 13",
       "payment_methods": ["efectivo","débito","crédito 3 cuotas","transferencia"],
       "cancellation_policy": "Avisar con 24 h de anticipación",
       "parking": "...", "notes": "..."
     } */
  settings            jsonb not null default '{}'::jsonb,
  /* settings = {
       "bot_name": "Sofi", "price_policy": "range" | "exact" | "in_person",
       "evaluation_slot_minutes": 30,
       "followup_hours": [3, 22, 72],
       "handoff_notify_wa_id": "549299...", "handoff_notify_email": "...",
       "business_hours_only_bot": false
     } */
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_clinics_updated before update on clinics for each row execute function set_updated_at();

-- Usuarios del panel (mapea auth.users → clínica + rol)
create table clinic_members (
  user_id     uuid not null references auth.users(id) on delete cascade,
  clinic_id   uuid not null references clinics(id) on delete cascade,
  role        text not null check (role in ('owner','recepcion','agencia')),
  name        text,
  created_at  timestamptz not null default now(),
  primary key (user_id, clinic_id)
);

-- Función usada por todas las policies RLS
create or replace function auth_clinic_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select clinic_id from clinic_members where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Base de conocimiento de la clínica
-- ---------------------------------------------------------------------------
create table services (
  id                  uuid primary key default gen_random_uuid(),
  clinic_id           uuid not null references clinics(id) on delete cascade,
  name                text not null,                        -- 'Ortodoncia (brackets)'
  category            text,                                 -- 'ortodoncia' | 'implantes' | ...
  description         text,                                 -- lo que la IA puede decir
  price_from          numeric(12,2),
  price_to            numeric(12,2),
  price_note          text,                                 -- 'según caso, se define en evaluación'
  price_policy        text check (price_policy in ('exact','range','in_person')), -- override del default
  requires_evaluation boolean not null default true,
  keywords            text[] not null default '{}',         -- 'brackets','frenos','aparatos'
  active              boolean not null default true,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);
create index on services (clinic_id) where active;

create table professionals (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  name        text not null,
  specialty   text,
  bio         text,
  color       text,                                         -- para la agenda del panel
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on professionals (clinic_id) where active;

create table insurances (                                   -- obras sociales / prepagas
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  name        text not null,                                -- 'OSDE'
  plans       text[] not null default '{}',                 -- '210','310','410'
  accepted    boolean not null default true,
  notes       text,                                         -- 'solo para consulta y limpieza'
  created_at  timestamptz not null default now()
);
create index on insurances (clinic_id);

create table faqs (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references clinics(id) on delete cascade,
  question    text not null,
  answer      text not null,
  tags        text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on faqs (clinic_id) where active;

-- ---------------------------------------------------------------------------
-- Contactos y conversaciones
-- ---------------------------------------------------------------------------
create table contacts (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references clinics(id) on delete cascade,
  wa_id         text not null,                              -- '5492991234567' (sin +)
  name          text,                                       -- profile.name de WhatsApp o lo que dijo
  source        text not null default 'unknown'
                check (source in ('web','instagram','ads','google','organic','referral','unknown')),
  referral      jsonb,                                      -- objeto referral de click-to-WhatsApp ads
  opted_out     boolean not null default false,             -- pidió no recibir más mensajes
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  unique (clinic_id, wa_id)
);

create table conversations (
  id                 uuid primary key default gen_random_uuid(),
  clinic_id          uuid not null references clinics(id) on delete cascade,
  contact_id         uuid not null references contacts(id) on delete cascade,
  status             text not null default 'bot' check (status in ('bot','human','closed')),
  handoff_reason     text,                                  -- motivo de derivación
  assigned_to        uuid references auth.users(id),
  summary            text,                                  -- resumen para conversaciones largas
  last_inbound_at    timestamptz,
  last_outbound_at   timestamptz,
  last_message_at    timestamptz,
  window_expires_at  timestamptz,                           -- last_inbound_at + 24 h
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_conversations_updated before update on conversations for each row execute function set_updated_at();
-- Una sola conversación abierta por contacto
create unique index conversations_one_open_per_contact on conversations (contact_id) where status <> 'closed';
create index on conversations (clinic_id, status, last_message_at desc);

create table messages (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  conversation_id  uuid not null references conversations(id) on delete cascade,
  direction        text not null check (direction in ('in','out')),
  sender           text not null check (sender in ('contact','bot','human','system')),
  wa_message_id    text unique,                             -- dedupe de webhooks y estados
  type             text not null default 'text'
                   check (type in ('text','audio','image','document','video','sticker','location','interactive','template','reaction','unknown')),
  body             text,                                    -- texto, o transcripción si es audio
  transcript       text,                                    -- transcripción cruda (audio)
  media            jsonb,                                   -- {media_id, mime, url, template_name, params}
  status           text not null default 'received'
                   check (status in ('received','queued','sent','delivered','read','failed')),
  error            jsonb,
  created_at       timestamptz not null default now()
);
create index on messages (conversation_id, created_at);
create index on messages (clinic_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Leads (CRM)
-- ---------------------------------------------------------------------------
create table leads (
  id                    uuid primary key default gen_random_uuid(),
  clinic_id             uuid not null references clinics(id) on delete cascade,
  contact_id            uuid not null references contacts(id) on delete cascade,
  conversation_id       uuid references conversations(id) on delete set null,
  status                text not null default 'nuevo'
                        check (status in ('nuevo','en_conversacion','interesado','calificado',
                                          'turno_agendado','seguimiento','ganado','perdido','derivado')),
  service_id            uuid references services(id) on delete set null,
  service_interest      text,                               -- texto libre si no matchea un servicio
  urgency               text check (urgency in ('baja','media','alta')),
  insurance_name        text,                               -- lo que dijo tener
  notes                 text,                               -- notas de recepción
  source                text,
  lost_reason           text,
  follow_up_count       int not null default 0,
  next_follow_up_at     timestamptz,
  last_status_change_at timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_leads_updated before update on leads for each row execute function set_updated_at();
-- Un lead activo por contacto (ganado/perdido cierran el lead)
create unique index leads_one_active_per_contact on leads (contact_id) where status not in ('ganado','perdido');
create index on leads (clinic_id, status, updated_at desc);
create index on leads (next_follow_up_at) where next_follow_up_at is not null;

create table lead_events (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references clinics(id) on delete cascade,
  lead_id      uuid not null references leads(id) on delete cascade,
  type         text not null
               check (type in ('status_change','note','follow_up_scheduled','follow_up_sent',
                               'appointment_created','appointment_cancelled','handoff','returned_to_bot','contact_replied')),
  from_status  text,
  to_status    text,
  actor        text not null check (actor in ('bot','human','system')),
  payload      jsonb,
  created_at   timestamptz not null default now()
);
create index on lead_events (lead_id, created_at);
create index on lead_events (clinic_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Agenda
-- ---------------------------------------------------------------------------
create table availability_rules (                           -- disponibilidad semanal por profesional
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  professional_id  uuid not null references professionals(id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6),   -- 0 = domingo
  start_time       time not null,                                        -- hora local de la clínica
  end_time         time not null,
  slot_minutes     int not null default 30,
  appointment_type text not null default 'evaluacion',
  active           boolean not null default true,
  check (end_time > start_time)
);
create index on availability_rules (clinic_id, professional_id) where active;

create table availability_blocks (                          -- feriados, vacaciones, bloqueos puntuales
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  professional_id  uuid references professionals(id) on delete cascade, -- null = toda la clínica
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  reason           text,
  check (ends_at > starts_at)
);
create index on availability_blocks (clinic_id, starts_at);

create table appointments (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  contact_id       uuid not null references contacts(id) on delete cascade,
  lead_id          uuid references leads(id) on delete set null,
  professional_id  uuid not null references professionals(id),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  type             text not null default 'evaluacion',
  status           text not null default 'confirmado'
                   check (status in ('pendiente','confirmado','cancelado','asistio','no_asistio')),
  source           text not null default 'bot' check (source in ('bot','human')),
  patient_name     text,
  google_event_id  text,
  reminder_sent_at timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Red de seguridad contra doble reserva del mismo profesional
  exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pendiente','confirmado'))
);
create trigger trg_appointments_updated before update on appointments for each row execute function set_updated_at();
create index on appointments (clinic_id, starts_at);
create index on appointments (starts_at) where status = 'confirmado' and reminder_sent_at is null;

-- Reserva atómica: re-chequea disponibilidad y crea el turno.
-- El agente SIEMPRE agenda por acá (nunca insert directo).
create or replace function book_appointment(
  p_clinic_id uuid, p_contact_id uuid, p_lead_id uuid, p_professional_id uuid,
  p_starts_at timestamptz, p_minutes int, p_patient_name text, p_source text default 'bot'
) returns appointments language plpgsql security definer set search_path = public as $$
declare
  v_ends timestamptz := p_starts_at + make_interval(mins => p_minutes);
  v_row appointments;
begin
  if exists (
    select 1 from availability_blocks b
    where b.clinic_id = p_clinic_id
      and (b.professional_id is null or b.professional_id = p_professional_id)
      and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_starts_at, v_ends)
  ) then
    raise exception 'SLOT_BLOCKED';
  end if;

  insert into appointments (clinic_id, contact_id, lead_id, professional_id, starts_at, ends_at, patient_name, source)
  values (p_clinic_id, p_contact_id, p_lead_id, p_professional_id, p_starts_at, v_ends, p_patient_name, p_source)
  returning * into v_row;
  return v_row;
exception
  when exclusion_violation then
    raise exception 'SLOT_TAKEN';
end $$;

-- ---------------------------------------------------------------------------
-- Follow-ups y templates
-- ---------------------------------------------------------------------------
create table follow_ups (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  lead_id          uuid not null references leads(id) on delete cascade,
  conversation_id  uuid not null references conversations(id) on delete cascade,
  step             smallint not null check (step between 1 and 5),
  scheduled_for    timestamptz not null,
  mode             text not null check (mode in ('free','template')),   -- free = dentro de ventana
  template_name    text,
  status           text not null default 'pending'
                   check (status in ('pending','sent','cancelled','failed','skipped')),
  sent_message_id  uuid references messages(id),
  error            text,
  created_at       timestamptz not null default now()
);
create index on follow_ups (scheduled_for) where status = 'pending';
create index on follow_ups (lead_id);

create table templates (                                    -- templates aprobados en Meta, por clínica
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  name             text not null,                           -- 'seguimiento_turno_pendiente'
  language         text not null default 'es_AR',
  category         text not null check (category in ('utility','marketing','authentication')),
  body             text not null,                           -- con {{1}}, {{2}}
  status           text not null default 'pending' check (status in ('pending','approved','rejected','paused')),
  meta_template_id text,
  created_at       timestamptz not null default now(),
  unique (clinic_id, name, language)
);

-- ---------------------------------------------------------------------------
-- Observabilidad
-- ---------------------------------------------------------------------------
create table agent_runs (
  id               uuid primary key default gen_random_uuid(),
  clinic_id        uuid not null references clinics(id) on delete cascade,
  conversation_id  uuid references conversations(id) on delete set null,
  provider         text,
  model            text,
  input_tokens     int,
  output_tokens    int,
  cached_tokens    int,
  cost_usd         numeric(10,6),
  latency_ms       int,
  steps            int,
  tools_called     text[] not null default '{}',
  outcome          text,                                    -- 'replied' | 'handoff' | 'error' | 'skipped'
  error            text,
  created_at       timestamptz not null default now()
);
create index on agent_runs (clinic_id, created_at desc);

create table webhook_events (                               -- crudo, para debug; purgar > 30 días
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid references clinics(id) on delete set null,
  provider     text not null default 'meta',
  payload      jsonb not null,
  processed_at timestamptz,
  error        text,
  received_at  timestamptz not null default now()
);
create index on webhook_events (received_at desc);

-- ---------------------------------------------------------------------------
-- Métricas (vista simple; suficiente para el dashboard v1). security_invoker: respeta RLS del usuario del panel.
-- ---------------------------------------------------------------------------
create or replace view v_clinic_daily_metrics with (security_invoker = true) as
select
  l.clinic_id,
  (l.created_at at time zone c.timezone)::date as day,
  count(*)                                                         as consultas,
  count(*) filter (where l.status in ('calificado','turno_agendado','ganado','seguimiento')) as calificados,
  count(*) filter (where l.status in ('turno_agendado','ganado')) as turnos,
  count(*) filter (where l.status = 'derivado')                    as derivados,
  count(*) filter (where l.status = 'seguimiento')                 as en_seguimiento,
  count(*) filter (where l.status in ('turno_agendado','ganado')
                   and exists (select 1 from lead_events e
                               where e.lead_id = l.id and e.type = 'follow_up_sent')) as recuperados
from leads l
join clinics c on c.id = l.clinic_id
group by l.clinic_id, day;

-- ---------------------------------------------------------------------------
-- RLS: el panel solo ve su clínica. El backend (service role) saltea RLS.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['clinics','services','professionals','insurances','faqs','contacts','conversations',
                           'messages','leads','lead_events','availability_rules','availability_blocks',
                           'appointments','follow_ups','templates','agent_runs','webhook_events']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

alter table clinic_members enable row level security;
create policy "members see own memberships" on clinic_members
  for select using (user_id = auth.uid());

create policy "clinics by membership" on clinics
  for select using (id in (select auth_clinic_ids()));
create policy "clinics update by owner" on clinics
  for update using (id in (select clinic_id from clinic_members where user_id = auth.uid() and role in ('owner','agencia')));

-- Lectura/escritura para miembros en todas las tablas de la clínica
do $$
declare t text;
begin
  foreach t in array array['services','professionals','insurances','faqs','contacts','conversations',
                           'messages','leads','lead_events','availability_rules','availability_blocks',
                           'appointments','follow_ups','templates','agent_runs']
  loop
    execute format('create policy "%s by clinic" on %I for all using (clinic_id in (select auth_clinic_ids())) with check (clinic_id in (select auth_clinic_ids()))', t, t);
  end loop;
end $$;
-- webhook_events: solo backend (ninguna policy para usuarios)

-- ---------------------------------------------------------------------------
-- Realtime para el panel (Supabase): leads y messages
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table leads, messages, conversations, appointments;
