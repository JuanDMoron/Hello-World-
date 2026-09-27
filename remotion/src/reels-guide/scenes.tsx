import React from "react";
import {
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Accent,
  Body,
  Headline,
  Kicker,
  Reveal,
  SceneFrame,
  Step,
} from "./components";
import { colors, serif } from "./theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const HookScene: React.FC = () => (
  <SceneFrame align="center">
    <Headline delay={0.1} size={120}>
      ¿Subes Reels
      <br />y nadie los ve?
    </Headline>
    <Reveal name="Answer" delay={1.8} style={{ marginTop: 64 }}>
      <div style={{ fontSize: 72, fontFamily: serif }}>
        No es suerte. <Accent>Es método.</Accent>
      </div>
    </Reveal>
  </SceneFrame>
);

export const IntroScene: React.FC = () => (
  <SceneFrame>
    <Kicker>Guía rápida</Kicker>
    <Headline>
      Cómo y cuándo
      <br />
      subir tus <Accent>Reels</Accent>
    </Headline>
    <Body delay={1}>por La Nostra Production</Body>
  </SceneFrame>
);

// Illustrative audience-activity curve: a midday bump and an evening peak.
const activity = Array.from({ length: 24 }, (_, h) => {
  const midday = Math.exp(-((h - 12.5) ** 2) / 4) * 0.75;
  const evening = Math.exp(-((h - 20) ** 2) / 5);
  return Math.max(0.08, midday + evening);
});
const peakHours = new Set([12, 13, 19, 20, 21]);

const ActivityChart: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chartHeight = 380;

  return (
    <Reveal name="Chart" delay={delay} style={{ marginTop: 72, width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          height: chartHeight,
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        {activity.map((v, h) => (
          <div
            key={h}
            style={{
              flex: 1,
              borderRadius: "6px 6px 0 0",
              backgroundColor: peakHours.has(h) ? colors.gold : "rgba(242,237,228,0.18)",
              height: interpolate(
                frame,
                [(delay + 0.3 + h * 0.03) * fps, (delay + 1.2 + h * 0.03) * fps],
                [0, v * chartHeight],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
              ),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
          fontSize: 30,
          color: colors.muted,
        }}
      >
        <span>12 AM</span>
        <span>12 PM</span>
        <span>11 PM</span>
      </div>
    </Reveal>
  );
};

export const WhenDataScene: React.FC = () => (
  <SceneFrame>
    <Kicker>01 — Cuándo</Kicker>
    <Headline>
      Tus datos
      <br />
      <Accent>mandan.</Accent>
    </Headline>
    <Body delay={1}>
      Estadísticas → Seguidores →<br />
      <span style={{ color: colors.cream }}>Horas más activas</span>
    </Body>
    <ActivityChart delay={1.8} />
  </SceneFrame>
);

const TimeSlot: React.FC<{ time: string; label: string; delay: number }> = ({
  time,
  label,
  delay,
}) => (
  <Reveal
    name={`Slot ${label}`}
    delay={delay}
    style={{
      flex: 1,
      padding: "40px 36px",
      border: `1px solid ${colors.line}`,
      borderRadius: 24,
      backgroundColor: "rgba(242,237,228,0.03)",
    }}
  >
    <div style={{ fontSize: 30, letterSpacing: "0.2em", color: colors.gold }}>
      {label.toUpperCase()}
    </div>
    <div style={{ fontFamily: serif, fontSize: 52, marginTop: 16, lineHeight: 1.1, whiteSpace: "nowrap" }}>
      {time}
    </div>
  </Reveal>
);

export const WhenStartScene: React.FC = () => (
  <SceneFrame>
    <Kicker>01 — Cuándo</Kicker>
    <Headline size={92}>
      ¿Sin datos aún?
      <br />
      <Accent>Empieza aquí.</Accent>
    </Headline>
    <div style={{ display: "flex", gap: 28, marginTop: 72, width: "100%" }}>
      <TimeSlot label="Mediodía" time="11 AM – 1 PM" delay={1} />
      <TimeSlot label="Noche" time="6 PM – 9 PM" delay={1.3} />
    </div>
    <Body delay={1.9}>
      <span style={{ color: colors.cream }}>Martes a viernes</span>, en la hora
      local de tu audiencia.
    </Body>
    <Body delay={3} style={{ marginTop: 32 }}>
      <Accent>Punto de partida, no regla.</Accent> Prueba 2 semanas y ajusta.
    </Body>
  </SceneFrame>
);

const days = ["L", "M", "X", "J", "V", "S", "D"];
const postDays = new Set([0, 2, 4, 6]);

export const FrequencyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame>
      <Kicker>02 — Frecuencia</Kicker>
      <Reveal name="Number" delay={0.2}>
        <div
          style={{
            fontFamily: serif,
            fontSize: 260,
            lineHeight: 1,
            color: colors.gold,
            marginBottom: 32,
          }}
        >
          3–4
        </div>
      </Reveal>
      <Headline delay={0.5} size={84}>
        Reels por semana
      </Headline>
      <div style={{ display: "flex", gap: 20, marginTop: 64 }}>
        {days.map((d, i) => (
          <Interactive.Div
            key={d}
            name={`Day ${d}`}
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 600,
              border: `2px solid ${postDays.has(i) ? colors.gold : colors.line}`,
              color: postDays.has(i) ? colors.bg : colors.muted,
              backgroundColor: postDays.has(i)
                ? `rgba(201,164,106,${interpolate(
                    frame,
                    [(1.4 + i * 0.12) * fps, (1.9 + i * 0.12) * fps],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  )})`
                : "transparent",
              opacity: interpolate(
                frame,
                [(1 + i * 0.08) * fps, (1.5 + i * 0.08) * fps],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
            }}
          >
            {d}
          </Interactive.Div>
        ))}
      </div>
      <Body delay={2.6}>
        <Accent>Constancia</Accent> gana a volumen.
      </Body>
    </SceneFrame>
  );
};

export const HowTo1Scene: React.FC = () => (
  <SceneFrame>
    <Kicker>03 — Cómo subirlo</Kicker>
    <Step
      n="1"
      title="Engancha en 3 segundos"
      detail="Si el inicio no atrapa, el resto no existe."
      delay={0.4}
    />
    <Step
      n="2"
      title="Vertical 9:16"
      detail="1080 × 1920. Sin bordes negros."
      delay={1.6}
    />
    <Step
      n="3"
      title="Subtítulos siempre"
      detail="Mucha gente lo ve sin sonido."
      delay={2.8}
    />
  </SceneFrame>
);

export const HowTo2Scene: React.FC = () => (
  <SceneFrame>
    <Kicker>03 — Cómo subirlo</Kicker>
    <Step
      n="4"
      title="Texto en zona segura"
      detail="La interfaz de Instagram tapa arriba y abajo."
      delay={0.4}
    />
    <Step
      n="5"
      title="Portada limpia"
      detail="Que tu perfil se vea como una marca."
      delay={1.6}
    />
    <Step
      n="6"
      title="Descripción que suma"
      detail="Palabras clave + una llamada a la acción."
      delay={2.8}
    />
  </SceneFrame>
);

export const AfterScene: React.FC = () => (
  <SceneFrame>
    <Kicker>04 — Después de publicar</Kicker>
    <Step
      n="→"
      title="Responde comentarios"
      detail="Sobre todo en la primera hora."
      delay={0.4}
    />
    <Step
      n="→"
      title="Compártelo en Stories"
      detail="Más ojos desde el minuto uno."
      delay={1.4}
    />
    <Step
      n="→"
      title="Mide y repite"
      detail="Revisa estadísticas y repite lo que funciona."
      delay={2.4}
    />
  </SceneFrame>
);

export const OutroScene: React.FC = () => (
  <SceneFrame align="center">
    <Headline delay={0.1} size={92}>
      ¿No tienes tiempo
      <br />
      para todo esto?
    </Headline>
    <Reveal name="Answer" delay={1.2} style={{ marginTop: 40 }}>
      <div style={{ fontFamily: serif, fontSize: 96 }}>
        <Accent>Lo hacemos por ti.</Accent>
      </div>
    </Reveal>
    <Reveal name="Brand" delay={2.4} style={{ marginTop: 120 }}>
      <div
        style={{
          fontSize: 40,
          fontWeight: 600,
          letterSpacing: "0.42em",
          color: colors.cream,
        }}
      >
        LA NOSTRA
      </div>
      <div
        style={{
          fontSize: 26,
          letterSpacing: "0.5em",
          color: colors.gold,
          marginTop: 14,
        }}
      >
        PRODUCTION · MIAMI
      </div>
    </Reveal>
  </SceneFrame>
);
