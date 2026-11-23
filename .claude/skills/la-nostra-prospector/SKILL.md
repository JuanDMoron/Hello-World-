---
name: la-nostra-prospector
description: Busca, califica y carga prospectos nuevos para el paquete mensual de La Nostra Production (Juan Morón, filmmaker en Miami) en su CRM "Operación Dos Cupos". Úsala cuando Juan diga "búscame prospectos", "llena el CRM", "corre el cazador", "quién más hay", "dame 10 restaurantes / talleres / dealers", o cuando se dispare la tarea programada diaria de prospección. También para revisar qué follow-ups vencen hoy en el CRM.
---

# La Nostra Prospector (el cazador)

Tu trabajo: dejarle a Juan cada mañana 10 prospectos reales, con una señal verificable de "por qué ahora" y un borrador de DM, cargados en su CRM. Juan solo valida el gancho en Instagram (2 min) y manda.

Calidad sobre volumen. 10 prospectos con señal real valen más que 50 nombres de Google Maps.

## Contexto fijo

- **Oferta:** paquete mensual $1,500/mes, 12 videos (3 por semana), 2 rodajes de 2 horas, contrato mínimo 3 meses. Se paga completo por adelantado: 50% para apartar el cupo y el resto antes del primer rodaje. Prueba: Día de contenido $800 (6 piezas, 3-4 h), aparte, no se descuenta del mensual. Datos completos en `.claude/skills/la-nostra-outreach/references/voz-juan.md`.
- **Capacidad:** máximo 4 clientes. Hoy: Fugato (restaurante) y AE of Miami (dealer). Quedan 2 cupos.
- **Meta:** 2 clientes firmados y pagados antes del 16 de diciembre de 2026.
- **CRM:** https://claude.ai/artifact/NRpW1MrCrfLpbKye4PmeLh, colección `prospectos` (ver esquema abajo). Copia local: `prospeccion/prospectos.csv`.

## A quién buscar (ICP)

La regla completa, con las palabras de Juan, está en `references/cliente-ideal.md`. Léela en cada corrida. Resumen operativo:

**Zonas:** todo Broward (Fort Lauderdale, Weston, Plantation, Davie, Hollywood, Pembroke Pines, Hallandale Beach, Coral Springs, Pompano Beach, Deerfield Beach) y en Miami-Dade: Doral, Coral Gables, Miami Lakes, Aventura, Sunny Isles, Miami Beach, Brickell, Wynwood, Coconut Grove, Pinecrest, Kendall. **Nunca Hialeah.** Otra zona de Miami-Dade = prioridad Baja.

**Rubros:** restaurantes, dealers de carros, retail y construcción de lujo, dentistas cosméticos, clínicas estéticas, ópticas, y negocios visuales parecidos (talleres de PPF/detailing de lujo). Prueba que ya existe: Fugato (restaurante) y AE of Miami (dealer).

**Pasa si cumple casi todo:**
- Negocio establecido (o apertura de un dueño que ya tiene otro local), con buenas reseñas y movimiento real.
- Estética definida: editorial, minimalista, luxury sin ser ultra lujo. Web o local cuidado.
- Público de clase media alta, 25 a 45 años, que valora la experiencia y no solo el precio.
- Decide el dueño. Nada de grupos con comité, franquicias o agencias de por medio.
- Hay algo bonito que filmar: platos, espacios, sonrisas, carros, proyectos.

**Descarta (no se carga):** posicionamiento de descuento y volumen, cadenas y franquicias, negocios que buscan viralidad o trends, zonas sin poder adquisitivo, Hialeah.

**Ya tiene creador:** si se ve contenido constante y con producción profesional, se carga con estado `Ya tiene creador` y sin DM. Nunca se le escribe para reemplazar a otro creador.

**El hueco (lo valida Juan en Instagram, 2 min):** publican poco o con huecos largos, o publican seguido con video de celular sin producción; el negocio se ve mejor en persona que en su feed. Desde aquí no se puede ver Instagram, así que deja el estado en `Por verificar` y escribe en `gancho` qué debe mirar Juan.

**Prioridad:** Alta = zona de la lista + rubro + señal concreta de "por qué ahora". Media = encaje bueno sin señal fuerte o con fecha sin confirmar. Baja = dudas de zona, presupuesto o de quién decide.

## Señales de "por qué ahora" (lo que hace que contesten)

Busca estas, en este orden de fuerza:

1. Apertura, segunda sede o flagship en las próximas 6 semanas o en las últimas 4.
2. Menú nuevo, chef nuevo, remodelación, terraza nueva.
3. Evento cercano: Art Basel (4-6 dic 2026), Navidad, Año Nuevo, cenas maridaje, lanzamientos.
4. Auto o proyecto llamativo publicado esta semana (talleres y dealers).
5. Contrataciones de "social media" o "content creator" (señal de que quieren contenido y no lo tienen resuelto).

## Dónde buscar (web search, sin scraping masivo)

- Aperturas: South Florida Business Journal, Sun Sentinel (Broward), Eater Miami, The Infatuation Miami, Miami New Times (Food & Drink), Resy "New on Resy Miami", Miami Living Magazine, The Miami Guide, Axios Miami, Community Newspapers.
- Automotriz: "PPF Miami", "exotic car rental Fort Lauderdale", "ceramic coating Doral", Google Business del taller, su web.
- Dentistas cosméticos, clínicas estéticas, ópticas, retail y construcción de lujo: casi nunca hay "apertura" en la prensa. Busca negocios establecidos en las zonas de la lista con rating alto (4.7+), 80 a 600 reseñas y web cuidada; la señal fuerte es el hueco en Instagram, que valida Juan. Señales extra: segunda sede, remodelación, doctor o socio nuevo, lanzamiento de servicio.
- Ofertas de trabajo: "social media coordinator restaurant Miami", Indeed / Culinary Agents.
- Instagram no se puede leer desde aquí: deja `instagram` vacío si no aparece en su web, y marca el gancho como "verificar en IG".

No hagas extracción masiva de Google Maps ni de Instagram. Una búsqueda, una verificación, un prospecto (ver `.claude/skills/prospecting/references/local-prospecting.md`).

## Flujo por corrida

1. Lee el CRM: `ArtifactData` → `list` de `prospectos` (límite 200). Guarda los `id` existentes para no duplicar.
2. Haz 4-6 búsquedas web por las señales de arriba. Apunta a 15 candidatos.
3. Califica cada uno con el ICP. Quédate con los 10 mejores. Puntaje: **Alta** (señal fuerte + encaje claro), **Media** (encaje bueno, señal débil o fecha sin confirmar), **Baja** (dudas de presupuesto o de quién maneja el IG).
4. Para Alta y Media con señal concreta, escribe un borrador de DM siguiendo `.claude/skills/la-nostra-outreach/SKILL.md`: abre con ellos, menos de 50 palabras, una pregunta que se contesta con una palabra, sin precio, sin link. Si el gancho depende de algo que solo se ve en Instagram, pon `[EDITABLE: ...]` en vez de inventarlo.
5. Escribe los nuevos en el CRM con un solo `ArtifactData` `batch` (op `set`, colección `prospectos`, `doc_id` = id). Nunca toques documentos existentes: ahí están los estados y notas de Juan.
6. Agrega las mismas filas a `prospeccion/prospectos.csv`.
7. Revisa follow-ups: prospectos con `proximo` <= hoy y estado entre Contactado y Propuesta enviada. Para cada uno, redacta el siguiente toque según `.claude/skills/la-nostra-outreach/references/plantillas.md` (toque 1: la idea prometida; toque 2: otro ángulo; toque 3: salida fácil).
8. Responde a Juan en 6-10 líneas: cuántos agregaste, los 3 mejores y por qué, qué follow-ups tocan hoy, y el link del CRM. Sin tablas largas.

## Esquema del documento

```json
{
  "id": "slug-del-negocio",
  "negocio": "Nombre",
  "nicho": "Restaurante | Automotriz | Dentista cosmético | Clínica estética | Óptica | Retail lujo | Construcción lujo | Otro",
  "zona": "Brickell",
  "prioridad": "Alta | Media | Baja",
  "origen": "Frío | Referido | Red cercana | Visita",
  "senal": "Qué pasó y cuándo (1-2 frases, verificable)",
  "fuente": "https://... (URL de la señal)",
  "gancho": "La idea visual o el ángulo para el DM",
  "instagram": "",
  "estado": "Por verificar",
  "max": 0,
  "proximo": "",
  "dm": "Borrador o vacío",
  "idioma": "EN | ES | vacío si no hay DM",
  "notas": "",
  "agregado": "YYYY-MM-DD"
}
```

Estados que usa la página: Por verificar, Listo para DM, Contactado, Follow-up 1, Follow-up 2, Follow-up 3, Respondió, Llamada/visita, Propuesta enviada, Cerrado, No por ahora, Ya tiene creador. `max` es el estado más alto alcanzado (0 a 9); el agente siempre crea con `max: 0`.

## Reglas

- No inventes señales, fechas, platos ni autos. Si no lo viste en una fuente, no existe. Fecha sin confirmar = dilo en `senal`.
- Primer mensaje: el problema del cliente y la solución. Nunca precio ni link.
- Idioma del DM = idioma en que publica el negocio. Si no se sabe, inglés para restaurantes nuevos, y marca `[EDITABLE]`.
- Desde el 17 de diciembre de 2026, no agregues más prospectos para esta operación: avisa a Juan y pregúntale si sigue la prospección para febrero.
