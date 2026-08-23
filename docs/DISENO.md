# DISEÑO — el panel de recepción

## Punto de partida

**Sujeto**: un mostrador de recepción de clínica odontológica, visto desde adentro.
**Quién lo usa**: la recepcionista (en el celular entre pacientes, o en una PC vieja del mostrador) y el dueño (una vez por día, desde el celular, para ver si sirve).
**El único trabajo de la pantalla principal**: mostrar en 3 segundos quién escribió, quién necesita una persona, y cuántos turnos entraron. Calma, no alarma.

La estética sale del mundo del sujeto: porcelana, luz de consultorio, el cuaderno de turnos, el verde del canal (WhatsApp) sin copiarlo. No sale de "dashboard SaaS genérico".

Lo que **no** vamos a hacer, porque es el default que produce cualquier generador: fondo crema con serif grande y acento terracota; fondo negro con verde ácido; hojas de periódico con filetes finos. Ninguno de los tres habla de una clínica.

## Tokens (`src/styles/tokens.css`)

```css
:root {
  /* superficie */
  --porcelana: #F4F6F3;      /* fondo de la app: blanco con un grado de verde, nunca gris puro */
  --esmalte:   #FFFFFF;      /* tarjetas, hilo de conversación */
  --bruma:     #DCE4E0;      /* bordes y separadores */
  /* texto */
  --tinta:     #10292E;      /* texto principal: negro-verdoso, no #000 */
  --pizarra:   #5E6F72;      /* texto secundario, metadatos */
  /* acento y semántica */
  --menta:     #1F8A7A;      /* acción primaria, turno agendado, "la IA está atendiendo" */
  --menta-suave: #E3F2EE;    /* fondos de chips y filas activas */
  --ambar:     #D9931F;      /* requiere atención humana */
  --ambar-suave: #FBF1DE;
  --arcilla:   #B5533C;      /* perdido, error. Se usa poco. */
  --arcilla-suave: #F8E7E2;

  --radio: 10px;             /* tarjetas */
  --radio-chip: 999px;
  --sombra: 0 1px 2px rgb(16 41 46 / .06), 0 4px 12px rgb(16 41 46 / .05);

  /* escala de espaciado (densidad media-alta: es una herramienta de trabajo) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px;
}
```

Contrastes verificados: `--tinta` sobre `--porcelana` ≈ 14:1; `--pizarra` sobre `--esmalte` ≈ 5.3:1; blanco sobre `--menta` ≈ 4.6:1 (usar para botones, no para texto chico); `--ambar` solo como fondo suave + texto `--tinta`, nunca texto ámbar sobre blanco.

Semántica de color (no negociable, es la lectura rápida del mostrador):
- **Menta** = la IA lo tiene / está resuelto / turno agendado.
- **Ámbar** = una persona tiene que hacer algo.
- **Arcilla** = se perdió o falló.
- Todo lo demás es tinta/pizarra sobre porcelana. No hay azul "de sistema".

## Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | **Bricolage Grotesque** (variable), 600–700, tracking -0.02em | Título de sección, el número grande de métricas, el saludo del día |
| Texto | **Public Sans**, 400/500/600 | Todo lo demás. Base 16 px, line-height 1.5 |
| Datos | **IBM Plex Mono**, 400, tabular | Teléfonos, horas, ids, contadores chicos |

Escala: 32 / 24 / 18 / 16 / 14 / 12. Nada por debajo de 12. Las horas y los teléfonos **siempre** en mono con dígitos tabulares: en una bandeja se escanean verticalmente.

Por qué estas y no Inter/Roboto: Bricolage tiene una voz cálida y un poco irregular que hace que un número de turnos parezca escrito por alguien, no por un sistema; Public Sans es neutra y muy legible en pantallas malas; Plex Mono separa visualmente "dato" de "texto" sin colorear.

## Layout

```
┌──────────┬───────────────────────────────────────────┬─────────────────────────────┐
│  rail    │  Bandeja                                  │  Detalle                    │
│  56px    │  ● 3 conversaciones atendidas ahora       │  Jimena Ruiz · 299 555 0134 │
│          │  [Todas] [Necesitan humano 2] [Turnos]    │  Interés: Ortodoncia        │
│  ▣       │  ┌───────────────────────────────────┐    │  Estado: ● Turno agendado   │
│  ◷       │  │▌Carlos P.  · pide hablar con…  9:41│    │ ───────────────────────     │
│  ▤       │  │ Ortodoncia · requiere humano       │    │  hilo de mensajes           │
│  ⚙       │  ├───────────────────────────────────┤    │   paciente  (izq, esmalte)  │
│          │  │ Jimena R.  · turno mañana 15:00   │    │   IA        (der, menta sv) │
│          │  │ ● Turno agendado · hace 12 min    │    │   humano    (der, tinta)    │
│          │  ├───────────────────────────────────┤    │ ───────────────────────     │
│          │  │ +54 299… · "hola, precio de…"     │    │  [Tomar conversación]       │
│          │  │ En conversación · hace 1 min      │    │  caja de respuesta          │
└──────────┴───────────────────────────────────────────┴─────────────────────────────┘
```

- Desktop: tres columnas, la del medio es la protagonista. Detalle se abre a la derecha sin navegar.
- Mobile (lo que usa la recepcionista): bandeja a pantalla completa; el detalle es una ruta (`/conversaciones/[id]`) con botón volver arriba a la izquierda y la caja de respuesta pegada abajo.
- Las filas que requieren humano van **arriba** siempre, con una barra ámbar de 4 px a la izquierda, como una ficha que sobresale de la carpeta. No parpadean, no vibran.

## El elemento firma: el pulso de recepción

Arriba de la bandeja, una línea de texto con un punto menta que respira lento (2 s, `prefers-reduced-motion` lo deja fijo): **"Sofi está atendiendo 3 conversaciones · 2 turnos agendados hoy"**. Es el producto hablando: la clínica compró una recepcionista, y la pantalla muestra a la recepcionista trabajando. Es lo único con movimiento en la página. Todo lo demás es quieto.

En el estado vacío del día dice: "Sofi está atenta. Todavía no escribió nadie hoy." y abajo, chico: "Compartí el número en la web, Instagram y el perfil de Google."

## Componentes (`src/components/panel/`)

- **PulsoRecepcion**: el firma. Props: `botName`, `activeCount`, `bookedToday`.
- **LeadRow**: nombre o teléfono (mono si no hay nombre), último mensaje truncado, `StatusChip`, hora relativa (mono). Barra ámbar si `conversation.status = 'human'` o lead `derivado`. Altura mínima 56 px (touch).
- **StatusChip**: texto en sentence case + punto de color. Mapa fijo: nuevo/en conversación → pizarra; interesado/calificado → tinta sobre bruma; turno agendado/ganado → menta; seguimiento → pizarra con ícono de reloj; derivado → ámbar; perdido → arcilla.
- **ConversationThread**: burbujas. Paciente a la izquierda en esmalte con borde bruma; IA a la derecha en menta-suave; humano a la derecha en tinta con texto blanco (se distingue de la IA sin leer). Audios muestran la transcripción con un ícono de micrófono y "Transcripción automática". Templates muestran una etiqueta "Mensaje automático".
- **ReplyBox**: textarea + botón "Enviar". Si la ventana de 24 hs está cerrada: el textarea se deshabilita y aparece "Pasaron más de 24 hs. Podés mandar un mensaje de plantilla." con el selector.
- **MetricTile**: número en Bricolage 32, label en Public Sans 14 pizarra, comparación con ayer en mono 12. Cuatro tiles, una fila, sin gráficos en v1.
- **Botones**: primario menta (texto blanco), secundario borde bruma sobre esmalte, peligroso arcilla solo para "Marcar como perdido". Verbos: "Tomar conversación", "Devolver a la IA", "Agendar turno", "Guardar cambios".

## Motion

Solo tres: el pulso (respira), la entrada de un lead nuevo (aparece con 200 ms de opacidad + 8 px desde arriba), el cambio de chip de estado (150 ms). Nada en hover más que el cambio de fondo. `@media (prefers-reduced-motion: reduce)` apaga todo.

## Textos

Voseo, sentence case, verbos que dicen lo que pasa. Errores con salida: "No se pudo enviar. WhatsApp devolvió un error; probá de nuevo en un minuto." Vacíos con acción. Sin "¡Ups!", sin signos de exclamación, sin "Submit".

## Cómo pedirle UI a Claude Code

Pegar al empezar cualquier tarea de la fase 3:

> Leé `docs/DISENO.md` completo. Implementá [componente/pantalla] usando solo los tokens de `src/styles/tokens.css` y los componentes de shadcn re-tematizados. Después sacá una captura con el preview (o `/verify`) en 390 px y en 1280 px, compará contra el wireframe del documento y listá las diferencias antes de corregirlas. Sin hex sueltos, sin emojis, sin gradientes.

Si tenés instaladas skills de diseño web (skills.sh), dejá que actúen sobre la implementación, pero este documento manda sobre paleta, tipografía y semántica de color.
