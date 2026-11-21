import React, { useState, useEffect, useRef } from "react";
import { APP_NAME, APP_SUBTITLE, APP_FOOTER, SUGERENCIAS, ROAMING_UE, MONEDA, CONSUMO_DEFECTO, IA_OPCIONAL } from "./config.js";
import { LOADERS, geocode, reverse, sleep } from "./services.js";
import { VIEWS } from "./Tabs.jsx";
import { generatePDF } from "./exportPDF.js";
import { C, Md, Note } from "./ui.jsx";

const COMBUSTIBLES = ["Gasolina 95", "Gasolina 98", "Diésel", "Diésel premium", "GLP", "Eléctrico", "Híbrido"];
const MODOS = [
  { id: "publico", label: "Transporte público", icon: "🚆", desc: "Tren, bus, avión, barco" },
  { id: "camper", label: "Camper", icon: "🚐", desc: "Áreas y gasolineras" },
  { id: "vehiculo", label: "Vehículo particular", icon: "🚗", desc: "Gasolineras en ruta" },
];

function tabsFor(ctx) {
  const modo = MODOS.find((m) => m.id === ctx.cfg.transporte) || MODOS[0];
  const t = [
    { id: "alojamiento", label: "Alojamiento", icon: "🏨" },
    { id: "transporte", label: modo.id === "publico" ? "Transporte" : modo.id === "camper" ? "Ruta camper" : "Ruta coche", icon: modo.icon },
    { id: "visitas", label: "Visitas", icon: "🗺️" },
    { id: "actividades", label: "Actividades", icon: "🏃" },
    { id: "gastronomia", label: "Gastronomía", icon: "🍽️" },
    { id: "tiempo", label: "Tiempo", icon: "🌤️" },
    { id: "mareas", label: "Mareas", icon: "🌊" },
  ];
  if (!ROAMING_UE.includes(ctx.geo.cc)) t.push({ id: "esim", label: "eSIM", icon: "📱" });
  const mon = MONEDA[ctx.geo.cc];
  if (mon && mon !== "EUR") t.push({ id: "cambio", label: "Cambio", icon: "💱" });
  t.push({ id: "docs", label: "Docs", icon: "📋" }, { id: "enlaces", label: "Enlaces", icon: "🔗" }, { id: "consejos", label: "Consejos", icon: "💡" });
  return t;
}

const inp = { padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(193,127,80,.35)", background: "#fff", fontSize: "0.95em", color: C.ink, outline: "none", fontFamily: "Georgia,serif", width: "100%" };
const lbl = { display: "block", color: "#4a3728", fontWeight: 700, marginBottom: 6, fontSize: "0.82em", letterSpacing: "0.05em", textTransform: "uppercase" };

function TravelConfig({ dest, onConfirm }) {
  const [ida, setIda] = useState("");
  const [vuelta, setVuelta] = useState("");
  const [origen, setOrigen] = useState("");
  const [origenGeo, setOrigenGeo] = useState(null);
  const [transporte, setTransporte] = useState("");
  const [combustible, setCombustible] = useState("");
  const [consumo, setConsumo] = useState(6.5);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const coche = transporte === "camper" || transporte === "vehiculo";

  const locate = () => {
    if (!navigator.geolocation) { setGeoError("Tu navegador no soporta geolocalización"); return; }
    setGeoLoading(true); setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { const g = await reverse(pos.coords.latitude, pos.coords.longitude); setOrigen(g.text); setOrigenGeo(g); }
        catch { setGeoError("No se pudo obtener la ubicación"); }
        setGeoLoading(false);
      },
      () => { setGeoError("Permiso de ubicación denegado"); setGeoLoading(false); }
    );
  };
  const confirm = () => {
    if (!transporte) { alert("Selecciona un medio de transporte"); return; }
    if (ida && vuelta && vuelta < ida) { alert("La fecha de vuelta no puede ser anterior a la de ida"); return; }
    onConfirm({ ida, vuelta, origen, origenGeo, transporte, combustible: coche ? combustible : "", consumo: coche ? Number(consumo) || CONSUMO_DEFECTO[transporte] : 0 });
  };

  return (
    <div style={{ background: "rgba(255,255,255,.92)", borderRadius: 16, padding: 24, border: "1px solid rgba(193,127,80,.3)", marginBottom: 20, boxShadow: "0 4px 20px rgba(139,94,60,.1)" }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", color: C.ink, marginBottom: 18, fontSize: "1.15em" }}>✈️ Configura tu viaje a <span style={{ color: C.acc }}>{dest}</span></h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div><label style={lbl}>📅 Ida</label><input type="date" value={ida} onChange={(e) => setIda(e.target.value)} style={inp} /></div>
        <div><label style={lbl}>📅 Vuelta</label><input type="date" value={vuelta} min={ida} onChange={(e) => setVuelta(e.target.value)} style={inp} /></div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>📍 Localidad de origen</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={origen} onChange={(e) => { setOrigen(e.target.value); setOrigenGeo(null); }} placeholder="Ej: Ourense" style={{ ...inp, flex: 1 }} />
          <button onClick={locate} disabled={geoLoading} title="Detectar mi ubicación" style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(193,127,80,.4)", background: "#fff", cursor: "pointer", fontSize: "1.2em" }}>{geoLoading ? "⏳" : "📍"}</button>
        </div>
        <p style={{ color: geoError ? "#c0392b" : C.soft, fontSize: ".78em", marginTop: 4 }}>{geoError || "Pulsa 📍 para detectar tu ubicación"}</p>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>🚌 Medio de transporte</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {MODOS.map((t) => (
            <button key={t.id} onClick={() => { setTransporte(t.id); if (t.id !== "publico") setConsumo(CONSUMO_DEFECTO[t.id]); }}
              style={{ padding: "14px 8px", borderRadius: 12, border: `2px solid ${transporte === t.id ? C.acc : "rgba(193,127,80,.3)"}`, background: transporte === t.id ? `linear-gradient(135deg,${C.acc},${C.acc2})` : "#fff", color: transporte === t.id ? "#fff" : "#4a3728", cursor: "pointer", fontFamily: "Georgia,serif", textAlign: "center" }}>
              <div style={{ fontSize: "1.7em" }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: ".8em" }}>{t.label}</div>
              <div style={{ fontSize: ".7em", opacity: 0.85 }}>{t.desc}</div>
            </button>
          ))}
        </div>
        {transporte === "publico" && <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(122,158,110,.1)", borderRadius: 8, fontSize: ".83em", color: "#4a6e40" }}>🌱 ¡Buena elección! Más sostenible y económico.</div>}
      </div>
      {coche && (
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>⛽ Combustible</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {COMBUSTIBLES.map((c) => (
              <button key={c} onClick={() => setCombustible(c)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${combustible === c ? C.acc : "rgba(193,127,80,.3)"}`, background: combustible === c ? `linear-gradient(135deg,${C.acc},${C.acc2})` : "#fff", color: combustible === c ? "#fff" : "#4a3728", fontSize: ".82em", cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: combustible === c ? 700 : 400 }}>{c}</button>
            ))}
          </div>
          <label style={lbl}>Consumo medio (l/100 km)</label>
          <input type="number" step="0.1" min="1" value={consumo} onChange={(e) => setConsumo(e.target.value)} style={{ ...inp, maxWidth: 140 }} />
        </div>
      )}
      <button onClick={confirm} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.acc},${C.acc2})`, color: "#fff", fontWeight: 700, fontSize: "1em", cursor: "pointer", fontFamily: "Georgia,serif", marginTop: 6 }}>Planificar viaje 🚀</button>
    </div>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [geo, setGeo] = useState(null);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");
  const [cfg, setCfg] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [tab, setTab] = useState("alojamiento");
  const [data, setData] = useState({});
  const [ai, setAi] = useState({});
  const [aiBusy, setAiBusy] = useState("");
  const [aiErr, setAiErr] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [install, setInstall] = useState(null);
  const dataRef = useRef({});
  const ctxRef = useRef(null);
  const cfgRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    window.__hideSplash?.();
    const on = () => setOnline(true), off = () => setOnline(false);
    const bip = (e) => { e.preventDefault(); setInstall(e); };
    window.addEventListener("online", on); window.addEventListener("offline", off); window.addEventListener("beforeinstallprompt", bip);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); window.removeEventListener("beforeinstallprompt", bip); };
  }, []);

  const reset = () => { dataRef.current = {}; setData({}); setAi({}); setCtx(null); ctxRef.current = null; setCfg(null); };

  const search = async () => {
    const text = q.trim();
    if (!text) return;
    setSearching(true); setErr(""); reset(); setGeo(null);
    try {
      const g = await geocode(text);
      if (!g) setErr(`No encuentro «${text}». Prueba con otro nombre o añade el país (p. ej. «Split, Croacia»).`);
      else { setGeo(g); setTimeout(() => cfgRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
    } catch { setErr("No se pudo consultar el buscador de lugares. Revisa tu conexión e inténtalo de nuevo."); }
    setSearching(false);
  };

  const load = async (id, force = false) => {
    const c = ctxRef.current;
    if (!c) return;
    const cur = dataRef.current[id];
    if (!force && cur && (cur.s === "ok" || cur.s === "load")) return;
    dataRef.current[id] = { s: "load" };
    setData((p) => ({ ...p, [id]: { s: "load" } }));
    try {
      const v = await LOADERS[id](c);
      dataRef.current[id] = { s: "ok", v };
      setData((p) => ({ ...p, [id]: { s: "ok", v } }));
    } catch (e) {
      dataRef.current[id] = { s: "err" };
      setData((p) => ({ ...p, [id]: { s: "err", e: String(e.message || e) } }));
    }
  };

  const confirmCfg = async (c) => {
    setSearching(true);
    let origin = c.origenGeo;
    if (!origin && c.origen.trim()) { try { origin = await geocode(c.origen.trim()); } catch { origin = null; } }
    const full = { dest: geo.name || q.trim(), geo, cfg: c, origin };
    dataRef.current = {}; setData({}); setAi({});
    ctxRef.current = full; setCtx(full); setCfg(c);
    setTab("alojamiento");
    setSearching(false);
    load("alojamiento");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
  };

  const pick = (id) => { setTab(id); load(id); };
  const tabs = ctx ? tabsFor(ctx) : [];

  const loadAll = async () => {
    setLoadingAll(true);
    for (const t of tabs) { await load(t.id); await sleep(700); }
    setLoadingAll(false);
  };

  const askAI = async (t) => {
    setAiBusy(t.id); setAiErr("");
    try {
      const r = await fetch("/api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: ctx.dest, tab: t.id, label: t.label, fechas: cfg.ida ? `${cfg.ida}${cfg.vuelta ? " a " + cfg.vuelta : ""}` : "", origen: ctx.origin?.name || "" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.text) throw new Error(j.error || `HTTP ${r.status}`);
      setAi((p) => ({ ...p, [t.id]: j.text }));
    } catch (e) { setAiErr(String(e.message || e)); }
    setAiBusy("");
  };

  const View = VIEWS[tab];
  const cur = data[tab];
  const curTab = tabs.find((t) => t.id === tab);
  const card = { background: "rgba(255,255,255,.82)", borderRadius: 20, padding: "26px 22px", boxShadow: "0 8px 40px rgba(139,94,60,.12)", border: "1px solid rgba(200,160,100,.22)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fdf6ec 0%,#f5e6d0 55%,#eddcca 100%)", fontFamily: "Georgia,serif" }}>
      <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "28px 16px 60px" }}>
        {!online && <Note>📴 Sin conexión: puedes ver lo que ya consultaste en este dispositivo.</Note>}

        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2.6em" }}>✈️</div>
          <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(1.7em,5vw,2.7em)", fontWeight: 900, color: C.ink, margin: 0 }}>{APP_NAME}</h1>
          <p style={{ color: C.soft, marginTop: 8 }}>{APP_SUBTITLE}</p>
          <div style={{ width: 56, height: 3, background: `linear-gradient(90deg,${C.acc},${C.acc2})`, borderRadius: 2, margin: "12px auto 0" }} />
          {install && <button onClick={() => { install.prompt(); install.userChoice.then(() => setInstall(null)); }} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 20, border: "1.5px solid rgba(193,127,80,.5)", background: "rgba(255,255,255,.7)", color: C.acc, fontWeight: 700, fontSize: ".82em", cursor: "pointer" }}>📲 Instalar app</button>}
        </header>

        <section style={{ ...card, marginBottom: 22 }}>
          <label style={lbl}>¿A dónde quieres viajar?</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Ej: Split, Tokio, Boceguillas…" style={{ ...inp, flex: 1, minWidth: 180, padding: "13px 16px", fontSize: "1.02em" }} />
            <button onClick={search} disabled={!q.trim() || searching} style={{ padding: "13px 26px", borderRadius: 12, border: "none", background: q.trim() ? `linear-gradient(135deg,${C.acc},${C.acc2})` : "#d4c4b0", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }}>{searching ? "…" : "Explorar 🌍"}</button>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {SUGERENCIAS.map((s) => <button key={s} onClick={() => setQ(s)} style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid rgba(193,127,80,.35)", background: "rgba(232,168,124,.1)", color: C.soft, fontSize: ".8em", cursor: "pointer", fontFamily: "Georgia,serif" }}>{s}</button>)}
          </div>
          {err && <p style={{ color: "#c0392b", marginTop: 12, fontSize: ".9em" }}>{err}</p>}
        </section>

        {geo && (
          <div style={{ background: "rgba(193,127,80,.1)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(193,127,80,.25)", fontSize: ".88em", color: "#4a3728", lineHeight: 1.6 }}>
            📍 <strong>{geo.name}</strong>, {geo.country || "?"} ({geo.cc || "?"})
            {!ROAMING_UE.includes(geo.cc) && <> · <strong style={{ color: C.acc }}>📱 fuera de la zona de roaming UE</strong></>}
            {MONEDA[geo.cc] && MONEDA[geo.cc] !== "EUR" && <> · <strong style={{ color: C.acc }}>💱 {MONEDA[geo.cc]}</strong></>}
            {ctx && <> · {cfg.ida && `📅 ${cfg.ida}${cfg.vuelta ? " → " + cfg.vuelta : ""} · `}{ctx.origin && `🏠 ${ctx.origin.name} · `}{(MODOS.find((m) => m.id === cfg.transporte) || {}).icon} {(MODOS.find((m) => m.id === cfg.transporte) || {}).label}{cfg.combustible && ` · ⛽ ${cfg.combustible}`}
              <button onClick={() => { reset(); setTimeout(() => cfgRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }} style={{ marginLeft: 10, padding: "4px 12px", borderRadius: 8, border: "1.5px solid rgba(193,127,80,.4)", background: "#fff", color: C.acc, fontSize: ".85em", cursor: "pointer", fontWeight: 700, fontFamily: "Georgia,serif" }}>✏️ Editar</button></>}
          </div>
        )}

        {geo && !ctx && <div ref={cfgRef}><TravelConfig dest={geo.name} onConfirm={confirmCfg} /></div>}

        {ctx && (
          <div ref={resultRef}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14, background: "rgba(255,255,255,.5)", padding: 5, borderRadius: 14, border: "1px solid rgba(200,160,100,.2)" }}>
              {tabs.map((t) => {
                const on = tab === t.id, done = data[t.id]?.s === "ok";
                return (
                  <button key={t.id} onClick={() => pick(t.id)} style={{ flex: "1 1 auto", minWidth: 60, padding: "8px 5px", borderRadius: 10, border: "none", background: on ? `linear-gradient(135deg,${C.acc},${C.acc2})` : "transparent", color: on ? "#fff" : done ? C.soft : "#b09070", fontWeight: on ? 700 : 500, fontSize: ".7em", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "Georgia,serif" }}>
                    <span style={{ fontSize: "1.35em" }}>{t.icon}</span><span>{t.label}</span>
                    {done && !on && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.acc }} />}
                  </button>
                );
              })}
            </div>

            <div style={{ ...card, minHeight: 180 }}>
              {(!cur || cur.s === "load") && <p style={{ textAlign: "center", color: C.soft, padding: "40px 0" }}>⏳ Consultando fuentes abiertas…</p>}
              {cur?.s === "err" && (
                <div>
                  <Note>No he podido cargar esta pestaña ({cur.e}). Suele ser un servidor público saturado o falta de cobertura.</Note>
                  <button onClick={() => load(tab, true)} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: C.acc, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }}>🔄 Reintentar</button>
                </div>
              )}
              {cur?.s === "ok" && View && <View d={cur.v} ctx={ctx} />}
              {cur?.s === "ok" && ai[tab] && <div style={{ marginTop: 18 }}><Note>✨ Complemento generado por IA: puede contener errores, verifícalo.</Note><Md text={ai[tab]} /></div>}
              {cur?.s === "ok" && IA_OPCIONAL && curTab && !["cambio", "esim", "docs"].includes(tab) && (
                <div style={{ marginTop: 18, textAlign: "center" }}>
                  <button onClick={() => askAI(curTab)} disabled={!!aiBusy} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px dashed rgba(193,127,80,.5)", background: "transparent", color: C.soft, fontSize: ".82em", cursor: "pointer", fontFamily: "Georgia,serif" }}>{aiBusy === tab ? "…" : "✨ Ampliar con IA (opcional)"}</button>
                  {aiErr && <p style={{ color: "#c0392b", fontSize: ".78em", marginTop: 6 }}>{aiErr}</p>}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={loadAll} disabled={loadingAll} style={{ padding: "11px 22px", borderRadius: 12, border: "1.5px solid rgba(193,127,80,.45)", background: "rgba(255,255,255,.65)", color: C.acc, fontWeight: 700, fontSize: ".85em", cursor: "pointer", fontFamily: "Georgia,serif" }}>{loadingAll ? "Cargando…" : "🔄 Cargar todo"}</button>
              <button onClick={() => generatePDF({ ctx, tabs, data, ai })} style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.acc},${C.acc2})`, color: "#fff", fontWeight: 700, fontSize: ".85em", cursor: "pointer", fontFamily: "Georgia,serif" }}>📄 Descargar guía PDF</button>
            </div>
            <Note>ℹ️ Datos procedentes de fuentes abiertas, orientativos: horarios, precios y requisitos pueden haber cambiado. Verifícalos antes de viajar.</Note>
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 28, color: "#b0956f", fontSize: ".74em", lineHeight: 1.5 }}>{APP_FOOTER}</footer>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>
    </div>
  );
}
