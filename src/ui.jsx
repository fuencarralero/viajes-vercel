import React from "react";

export const C = { acc: "#c17f50", acc2: "#e8a87c", ink: "#2d1a0e", soft: "#8b6545", text: "#3d2b1f", line: "rgba(193,127,80,.25)" };

export const H2 = ({ children }) => (
  <h2 style={{ fontSize: "1.12em", fontWeight: 800, color: C.acc, margin: "1.3em 0 .5em", fontFamily: "'Playfair Display',Georgia,serif", borderBottom: `1px solid ${C.line}`, paddingBottom: 4 }}>{children}</h2>
);
export const H3 = ({ children }) => (
  <h3 style={{ fontSize: "1em", fontWeight: 700, color: "#4a3728", margin: "1em 0 .4em" }}>{children}</h3>
);
export const P = ({ children, style }) => (
  <p style={{ color: C.text, lineHeight: 1.65, margin: "0 0 6px", ...style }}>{children}</p>
);
export const Ext = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: C.acc, fontWeight: 600, textDecoration: "underline" }}>{children} ↗</a>
);
export const Pill = ({ href, children, bg }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", margin: "0 8px 8px 0", padding: "8px 14px", borderRadius: 10, background: bg || C.acc, color: "#fff", fontWeight: 700, fontSize: ".85em", textDecoration: "none" }}>{children}</a>
);
export const Note = ({ children, tone = "warn" }) => (
  <div style={{ background: tone === "warn" ? "rgba(255,193,7,.12)" : "rgba(122,158,110,.12)", border: `1px solid ${tone === "warn" ? "rgba(255,193,7,.4)" : "rgba(122,158,110,.35)"}`, borderRadius: 10, padding: "10px 14px", margin: "10px 0", fontSize: ".86em", color: C.text, lineHeight: 1.55 }}>{children}</div>
);
export const Card = ({ children }) => (
  <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 14px", marginBottom: 8, color: C.text, lineHeight: 1.5 }}>{children}</div>
);
export const Src = ({ children }) => (
  <p style={{ fontSize: ".75em", color: "#b09070", margin: "14px 0 0" }}>Fuente: {children}</p>
);
export const Stale = ({ d }) =>
  d && d._stale ? (
    <Note>📴 Sin conexión o servicio no disponible: se muestran datos guardados el {new Date(d._stale).toLocaleString("es-ES")}.</Note>
  ) : null;

export function Lines({ lines, max = 12 }) {
  return lines.slice(0, max).map((l, i) =>
    l.startsWith("▸ ") ? <H3 key={i}>{l.slice(2)}</H3> : <P key={i}>{l}</P>
  );
}

export function Table({ head, rows }) {
  const th = { textAlign: "left", padding: "6px 8px", background: "rgba(193,127,80,.12)", color: "#4a3728", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
  const td = { padding: "6px 8px", borderBottom: `1px solid ${C.line}`, color: C.text, verticalAlign: "top" };
  return (
    <div style={{ overflowX: "auto", marginBottom: 8 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: ".85em" }}>
        <thead><tr>{head.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

// Markdown mínimo y seguro (solo para el texto opcional de IA)
export function Md({ text }) {
  const bold = (s) => s.split(/\*\*(.+?)\*\*/g).map((t, i) => (i % 2 ? <strong key={i}>{t}</strong> : t));
  return text.split("\n").map((l, i) => {
    const t = l.trim();
    if (!t) return <div key={i} style={{ height: 6 }} />;
    if (t.startsWith("## ")) return <H3 key={i}>{t.slice(3)}</H3>;
    if (t.startsWith("### ")) return <H3 key={i}>{t.slice(4)}</H3>;
    if (/^[-*•]\s/.test(t)) return <P key={i} style={{ paddingLeft: 14 }}>▸ {bold(t.slice(2))}</P>;
    return <P key={i}>{bold(t)}</P>;
  });
}
