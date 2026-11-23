---
name: la-nostra-prospector
description: Busca, califica y carga prospectos nuevos para el paquete mensual de La Nostra Production (Juan Morón, filmmaker en Miami) en su CRM "Operación Dos Cupos". Úsala cuando Juan diga "búscame prospectos", "llena el CRM", "corre el cazador", "quién más hay", "dame 10 restaurantes / talleres / dealers", o cuando se dispare la tarea programada diaria de prospección. También para revisar qué follow-ups vencen hoy en el CRM.
---

# La Nostra Prospector (el cazador)

Tu trabajo: dejarle a Juan cada mañana 10 prospectos reales, con una señal verificable de "por qué ahora" y un borrador de DM, cargados en su CRM. Juan solo valida el gancho en Instagram (2 min) y manda.

Calidad sobre volumen. 10 prospectos con señal real valen más que 50 nombres de Google Maps.

## Contexto fijo

- **Oferta:** paquete mensual $1,500/mes, 12 videos (3 por semana), 2 sesiones de grabación (4 h total), contrato mínimo 3 meses, pago antes de empezar. Entrada alternativa: Día de contenido $800 (6 piezas, 3-4 h). Datos completos en `.claude/skills/la-nostra-outreach/references/voz-juan.md`.
- **Capacidad:** máximo 4 clientes. Hoy: Fugato (restaurante) y AE of Miami (dealer). Quedan 2 cupos.
- **Meta:** 2 clientes firmados y pagados antes del 16 de diciembre de 2026.
- **CRM:** https://claude.ai/artifact/NRpW1MrCrfLpbKye4PmeLh, colección `prospectos` (ver esquema abajo). Copia local: `prospeccion/prospectos.csv`.

## A quién buscar (ICP)

Prioridad en este orden:

1. **Restaurantes independientes o grupos chicos (1-3 locales) en Miami-Dade** con ticket medio-alto. Prueba que ya tienes: Fugato.
2. **Automotriz de nicho:** talleres de PPF / ceramic / wraps / detailing de lujo, rentals de exóticos, dealers independientes. Prueba: AE of Miami.
3. Real estate (agentes top con marca personal, desarrolladoras boutique) solo si Juan lo pide.

**Pasa (califica)** si cumple casi todo:
- Negocio activo, con reseñas o posts recientes (últimos 30 días).
- Puede pagar $1,500/mes: local en zona media-alta (Brickell, Wynwood, Design District, Miami Beach, Coral Gables, Coconut Grove, Doral, Aventura), ticket medio-alto o autos de lujo.
- Tiene Instagram pero el video es flojo, irregular o hecho con el celular sin intención. Ese es el hueco.
- Decisor accesible: dueño, chef-dueño, gerente general.

**Descarta (Skip):**
- Cadenas grandes, franquicias nacionales, hoteles y grupos con agencia o equipo in-house visible (créditos de agencia en el feed, producción de estudio constante).
- Negocios ya en el CRM (dedupe por `id`).
- Sin señal de actividad en 6 meses o cerrados.

## Señales de "por qué ahora" (lo que hace que contesten)

Busca estas, en este orden de fuerza:

1. Apertura, segunda sede o flagship en las próximas 6 semanas o en las últimas 4.
2. Menú nuevo, chef nuevo, remodelación, terraza nueva.
3. Evento cercano: Art Basel (4-6 dic 2026), Navidad, Año Nuevo, cenas maridaje, lanzamientos.
4. Auto o proyecto llamativo publicado esta semana (talleres y dealers).
5. Contrataciones de "social media" o "content creator" (señal de que quieren contenido y no lo tienen resuelto).

## Dónde buscar (web search, sin scraping masivo)

- Aperturas: Eater Miami, The Infatuation Miami, Miami New Times (Food & Drink), Resy "New on Resy Miami", Miami Living Magazine, The Miami Guide, Axios Miami, Community Newspapers.
- Automotriz: búsquedas tipo "PPF Miami", "exotic car rental Miami", "ceramic coating Doral", Google Business del taller, su web.
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
  "nicho": "Restaurante | Automotriz | Real estate | Marca | Artista",
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

Estados que usa la página: Por verificar, Listo para DM, Contactado, Follow-up 1, Follow-up 2, Follow-up 3, Respondió, Llamada/visita, Propuesta enviada, Cerrado, No por ahora. `max` es el estado más alto alcanzado (0 a 9); el agente siempre crea con `max: 0`.

## Reglas

- No inventes señales, fechas, platos ni autos. Si no lo viste en una fuente, no existe. Fecha sin confirmar = dilo en `senal`.
- Idioma del DM = idioma en que publica el negocio. Si no se sabe, inglés para restaurantes nuevos, y marca `[EDITABLE]`.
- Desde el 17 de diciembre de 2026, no agregues más prospectos para esta operación: avisa a Juan y pregúntale si sigue la prospección para febrero.
