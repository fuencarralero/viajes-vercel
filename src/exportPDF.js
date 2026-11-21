import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VIEWS } from "./Tabs.jsx";
import { Md } from "./ui.jsx";

const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MODO = { publico: "Transporte público", camper: "Camper", vehiculo: "Vehículo particular" };

export function generatePDF({ ctx, tabs, data, ai }) {
  const secciones = tabs
    .filter((t) => (data[t.id]?.s === "ok" || ["esim", "docs"].includes(t.id)) && VIEWS[t.id])
    .map((t) => {
      const V = VIEWS[t.id];
      let html = renderToStaticMarkup(React.createElement(V, { d: data[t.id]?.v || {}, ctx, print: true }));
      if (ai[t.id]) html += renderToStaticMarkup(React.createElement("div", null, React.createElement("h3", null, "✨ Complemento de IA (verificar)"), React.createElement(Md, { text: ai[t.id] })));
      return { ...t, html };
    });
  if (!secciones.length) { alert("Carga al menos una pestaña antes de descargar la guía."); return; }

  const { cfg, dest, geo, origin } = ctx;
  const filas = [
    cfg.ida && ["📅 Fechas", cfg.ida + (cfg.vuelta ? " → " + cfg.vuelta : "")],
    origin && ["📍 Origen", origin.name],
    cfg.transporte && ["🚌 Transporte", MODO[cfg.transporte]],
    cfg.combustible && ["⛽ Combustible", cfg.combustible],
    ["🌍 País", geo.country || geo.cc],
  ].filter(Boolean);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Guía de viaje — ${esc(dest)}</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Georgia,serif;color:#2d1a0e;background:#fdf6ec;line-height:1.6}
.cover{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:50px 30px;background:linear-gradient(160deg,#fdf6ec,#eddcca);page-break-after:always}
.cover h1{font-size:3em;margin:10px 0}.cover .info{background:rgba(255,255,255,.7);border:1px solid rgba(193,127,80,.3);border-radius:14px;padding:14px 24px;margin-top:18px;min-width:280px;text-align:left}
.cover .info div{padding:5px 0;border-bottom:1px solid rgba(193,127,80,.15)}.cover .info div:last-child{border:0}
.toc{padding:50px 40px;page-break-after:always}.toc h2{color:#c17f50}.toc a{display:block;padding:8px 10px;color:#4a3728;text-decoration:none;font-size:1.05em}
.sec{padding:36px 40px;page-break-before:always}.sec>h1{color:#c17f50;border-bottom:2px solid rgba(193,127,80,.3);padding-bottom:8px}
.aviso{margin:20px 0;padding:12px 16px;border:1px solid rgba(255,193,7,.45);background:rgba(255,193,7,.12);border-radius:10px;font-size:.85em}
.bar{position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px}.bar button{padding:11px 18px;border:0;border-radius:12px;background:#c17f50;color:#fff;font-weight:700;font-family:Georgia,serif;cursor:pointer}
@media print{.bar{display:none}.sec{padding:20px}}
</style></head><body>
<div class="cover"><div style="font-size:4em">✈️</div><h1>${esc(dest)}</h1><p>Guía de viaje personalizada</p>
<div class="info">${filas.map(([a, b]) => `<div><b>${esc(a)}</b> · ${esc(b)}</div>`).join("")}</div>
<p style="font-size:.8em;color:#8b6545;margin-top:26px">Generada el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} con Asistente de Viajes TA</p></div>
<div class="toc"><h2>📋 Índice</h2>${secciones.map((s, i) => `<a href="#s${i}">${s.icon} ${esc(s.label)}</a>`).join("")}
<div class="aviso">Guía elaborada con datos abiertos (OpenStreetMap, Wikivoyage, Wikipedia, Open-Meteo y el Ministerio para la Transición Ecológica). Horarios, precios y requisitos cambian: verifícalos en fuentes oficiales antes de viajar.</div></div>
${secciones.map((s, i) => `<div class="sec" id="s${i}"><h1>${s.icon} ${esc(s.label)}</h1>${s.html}</div>`).join("")}
<div class="bar"><button onclick="window.print()">🖨️ Guardar PDF</button></div></body></html>`;

  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  if (!window.open(url, "_blank")) alert("Permite las ventanas emergentes para ver la guía.");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
