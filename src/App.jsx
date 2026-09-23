import { useState, useEffect, useRef, useCallback } from "react";
import { fetchTravelInfo } from "./api.js";
import { WORKER_URL, APP_NAME, APP_SUBTITLE, APP_FOOTER, SUGERENCIAS, PAISES_CEE } from "./config.js";
import { generatePDF } from "./exportPDF.js";

const TABS_BASE = [
  { id: "alojamiento",   label: "Alojamiento", icon: "🏨" },
  { id: "visitas",       label: "Visitas",      icon: "🗺️" },
  { id: "actividades",   label: "Actividades",  icon: "🏃" },
  { id: "gastronomia",   label: "Gastronomía",  icon: "🍽️" },
  { id: "tiempo",        label: "Tiempo",       icon: "🌤️" },
  { id: "mareas",        label: "Mareas",       icon: "🌊" },
  { id: "documentacion", label: "Docs",         icon: "📋" },
  { id: "enlaces",       label: "Enlaces",      icon: "🔗" },
  { id: "consejos",      label: "Consejos",     icon: "💡" },
];

const COMBUSTIBLES = ["Gasolina 95", "Gasolina 98", "Diésel", "Diésel premium", "GLP", "Eléctrico", "Híbrido"];

// Detecta si un destino está fuera de la CEE
function esFueraCEE(destination) {
  const d = destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return !PAISES_CEE.some(p => d.includes(p.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#4a3728">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener" style="color:#c17f50;font-weight:600;text-decoration:underline">$1 ↗</a>');
}

function MarkdownRenderer({ text }) {
  return (
    <div>
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        if (line.startsWith("## "))
          return <h2 key={i} style={{ fontSize: "1.15em", fontWeight: 800, color: "#c17f50", marginTop: "1.4em", marginBottom: "0.5em", fontFamily: "'Playfair Display',serif", borderBottom: "1px solid #e8c9a033", paddingBottom: 4 }}>{line.slice(3)}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} style={{ fontSize: "1em", fontWeight: 700, color: "#4a3728", marginTop: "1em", marginBottom: "0.3em" }}>{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("• "))
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ color: "#e8a87c", minWidth: 14, marginTop: 2 }}>▸</span>
              <span style={{ color: "#3d2b1f", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        if (/^\d+\.\s/.test(line)) {
          const m = line.match(/^(\d+)\.\s(.+)/);
          return m ? (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ color: "#e8a87c", fontWeight: 700, minWidth: 22, marginTop: 2 }}>{m[1]}.</span>
              <span style={{ color: "#3d2b1f", lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: formatInline(m[2]) }} />
            </div>
          ) : null;
        }
        return <p key={i} style={{ color: "#3d2b1f", lineHeight: 1.7, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 6, padding: "14px 0", alignItems: "center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8a87c", animation: `dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
      <style>{`@keyframes dot{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function MapLinks({ origen, destino }) {
  if (!origen || !destino) return null;
  return (
    <div style={{ marginBottom: 14, padding: "16px", background: "rgba(193,127,80,.08)", borderRadius: 12, border: "1px solid rgba(193,127,80,.2)" }}>
      <p style={{ fontWeight: 700, color: "#4a3728", marginBottom: 10, fontSize: "0.9em" }}>🗺️ Navegar con:</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { name: "Google Maps", icon: "🗺️", url: `https://www.google.com/maps/dir/${encodeURIComponent(origen)}/${encodeURIComponent(destino)}`, color: "#4285f4" },
          { name: "Waze", icon: "🚗", url: `https://waze.com/ul?q=${encodeURIComponent(destino)}&navigate=yes`, color: "#33ccff" },
          { name: "Apple Maps", icon: "🍎", url: `https://maps.apple.com/?saddr=${encodeURIComponent(origen)}&daddr=${encodeURIComponent(destino)}`, color: "#555" },
        ].map(l => (
          <a key={l.name} href={l.url} target="_blank" rel="noopener"
            style={{ padding: "8px 16px", borderRadius: 8, background: l.color, color: "white", fontWeight: 700, fontSize: "0.85em", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            {l.icon} {l.name}
          </a>
        ))}
      </div>
    </div>
  );
}

// Panel configuración del viaje — con geolocalización
function TravelConfig({ destination, onConfirm }) {
  const [fechaIda, setFechaIda]       = useState("");
  const [fechaVuelta, setFechaVuelta] = useState("");
  const [origen, setOrigen]           = useState("");
  const [transporte, setTransporte]   = useState("");
  const [combustible, setCombustible] = useState("");
  const [geoLoading, setGeoLoading]   = useState(false);
  const [geoError, setGeoError]       = useState("");

  const necesitaCombustible = transporte === "camper" || transporte === "vehiculo";

  // Geolocalización → convertir coordenadas a ciudad
  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGeoError("Tu navegador no soporta geolocalización"); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`);
          const data = await res.json();
          const ciudad = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const pais = data.address?.country || "";
          setOrigen(ciudad ? `${ciudad}, ${pais}` : pais);
        } catch {
          setGeoError("No se pudo obtener la ubicación");
        }
        setGeoLoading(false);
      },
      () => { setGeoError("Permiso de ubicación denegado"); setGeoLoading(false); }
    );
  };

  const handleConfirm = () => {
    if (!transporte) { alert("Por favor selecciona un medio de transporte"); return; }
    const fechas = fechaIda ? `${fechaIda}${fechaVuelta ? ` a ${fechaVuelta}` : ""}` : "";
    onConfirm({ fechas, origen, transporte, combustible: necesitaCombustible ? combustible : "" });
  };

  const inp = { padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(193,127,80,.35)", background: "white", fontSize: "0.95em", color: "#2d1a0e", outline: "none", fontFamily: "Georgia,serif", width: "100%" };
  const lbl = { display: "block", color: "#4a3728", fontWeight: 700, marginBottom: 6, fontSize: "0.82em", letterSpacing: "0.05em", textTransform: "uppercase" };

  return (
    <div style={{ background: "rgba(255,255,255,.92)", borderRadius: 16, padding: "24px", border: "1px solid rgba(193,127,80,.3)", marginBottom: 20, boxShadow: "0 4px 20px rgba(139,94,60,.1)" }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#2d1a0e", marginBottom: 18, fontSize: "1.15em" }}>
        ✈️ Configura tu viaje a <span style={{ color: "#c17f50" }}>{destination}</span>
      </h3>

      {/* Fechas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={lbl}>📅 Fecha de ida</label>
          <input type="date" value={fechaIda} onChange={e => setFechaIda(e.target.value)} style={inp} />
        </div>
        <div>
          <label style={lbl}>📅 Fecha de vuelta</label>
          <input type="date" value={fechaVuelta} onChange={e => setFechaVuelta(e.target.value)} style={inp} />
        </div>
      </div>

      {/* Origen con geolocalización */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>📍 Localidad de origen</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" value={origen} onChange={e => setOrigen(e.target.value)}
            placeholder="Ej: Ourense, Madrid…" style={{ ...inp, flex: 1 }} />
          <button onClick={handleGeolocate} disabled={geoLoading}
            title="Detectar mi ubicación actual"
            style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(193,127,80,.4)", background: geoLoading ? "#e8d5c0" : "white", cursor: geoLoading ? "wait" : "pointer", fontSize: "1.2em", minWidth: 48 }}>
            {geoLoading ? "⏳" : "📍"}
          </button>
        </div>
        {geoError && <p style={{ color: "#c0392b", fontSize: "0.8em", marginTop: 4 }}>{geoError}</p>}
        {!geoError && <p style={{ color: "#8b6545", fontSize: "0.78em", marginTop: 4 }}>Pulsa 📍 para detectar tu ubicación automáticamente</p>}
      </div>

      {/* Transporte */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>🚌 Medio de transporte</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { id: "publico",  label: "Transporte público", icon: "🚆", desc: "Tren, bus, avión, barco" },
            { id: "camper",   label: "Camper",             icon: "🚐", desc: "Áreas y gasolineras" },
            { id: "vehiculo", label: "Vehículo particular",icon: "🚗", desc: "Gasolineras en ruta" },
          ].map(t => (
            <button key={t.id} onClick={() => setTransporte(t.id)}
              style={{ padding: "14px 10px", borderRadius: 12, border: `2px solid ${transporte === t.id ? "#c17f50" : "rgba(193,127,80,.3)"}`, background: transporte === t.id ? "linear-gradient(135deg,#c17f50,#e8a87c)" : "white", color: transporte === t.id ? "white" : "#4a3728", cursor: "pointer", fontFamily: "Georgia,serif", textAlign: "center", boxShadow: transporte === t.id ? "0 4px 12px rgba(193,127,80,.35)" : "none", transition: "all .2s" }}>
              <div style={{ fontSize: "1.8em", marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.82em", marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: "0.72em", opacity: 0.8 }}>{t.desc}</div>
            </button>
          ))}
        </div>
        {transporte === "publico" && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(122,158,110,.1)", borderRadius: 8, fontSize: "0.83em", color: "#4a6e40" }}>
            🌱 ¡Excelente elección! El transporte público es más sostenible y económico.
          </div>
        )}
      </div>

      {/* Combustible */}
      {necesitaCombustible && (
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>⛽ Tipo de combustible</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COMBUSTIBLES.map(c => (
              <button key={c} onClick={() => setCombustible(c)}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${combustible === c ? "#c17f50" : "rgba(193,127,80,.3)"}`, background: combustible === c ? "linear-gradient(135deg,#c17f50,#e8a87c)" : "white", color: combustible === c ? "white" : "#4a3728", fontSize: "0.82em", cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: combustible === c ? 700 : 400 }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleConfirm}
        style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#c17f50,#e8a87c)", color: "white", fontWeight: 700, fontSize: "1em", cursor: "pointer", fontFamily: "Georgia,serif", marginTop: 6 }}>
        Planificar viaje 🚀
      </button>
    </div>
  );
}

export default function App() {
  const [destination, setDestination]   = useState("");
  const [confirmed, setConfirmed]       = useState("");
  const [fueraCEE, setFueraCEE]         = useState(false);
  const [travelConfig, setTravelConfig] = useState(null);
  const [showConfig, setShowConfig]     = useState(false);
  const [activeTab, setActiveTab]       = useState("alojamiento");
  const [cache, setCache]               = useState({});
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled]       = useState(false);
  const resultRef = useRef(null);
  const configRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => { window.__hideSplash?.(); }, []);

  const getTabs = () => {
    const transportTab = travelConfig?.transporte === "publico"
      ? { id: "transporte_publico", label: "Transporte", icon: "🚆" }
      : travelConfig?.transporte === "camper"
      ? { id: "transporte_camper", label: "Ruta Camper", icon: "🚐" }
      : { id: "transporte_vehiculo", label: "Ruta Coche", icon: "🚗" };

    const base = [TABS_BASE[0], transportTab, ...TABS_BASE.slice(1)];
    // Añadir pestaña eSIM si está fuera de CEE
    if (fueraCEE) {
      base.splice(base.findIndex(t => t.id === "documentacion"), 0, { id: "esim", label: "eSIM", icon: "📱" });
    }
    return base;
  };

  const TABS = travelConfig ? getTabs() : [];

  const doFetch = useCallback(async (dest, tab, config = travelConfig) => {
    const cacheKey = `${dest}__${tab}`;
    if (cache[cacheKey]) return;
    setLoading(true);
    setError("");
    try {
      const text = await fetchTravelInfo({
        destination: dest, tab,
        fechas: config?.fechas,
        origen: config?.origen,
        transporte: config?.transporte,
        combustible: config?.combustible,
        fueraCEE: esFueraCEE(dest),
      });
      setCache(prev => ({ ...prev, [cacheKey]: text }));
    } catch (e) {
      setError("❌ Error al obtener información. Inténtalo de nuevo.");
    }
    setLoading(false);
  }, [cache, travelConfig]);

  const handleSearch = () => {
    const d = destination.trim();
    if (!d) return;
    const fuera = esFueraCEE(d);
    setConfirmed(d);
    setFueraCEE(fuera);
    setCache({});
    setTravelConfig(null);
    setShowConfig(true);
    setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleConfigConfirm = (config) => {
    setTravelConfig(config);
    setShowConfig(false);
    setActiveTab("alojamiento");
    doFetch(confirmed, "alojamiento", config);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleTab = (tab) => {
    setActiveTab(tab);
    if (confirmed && travelConfig) doFetch(confirmed, tab);
  };

  const currentContent = cache[`${confirmed}__${activeTab}`];
  const esVehiculo = travelConfig?.transporte === "vehiculo" || travelConfig?.transporte === "camper";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fdf6ec 0%,#f5e6d0 55%,#eddcca 100%)", fontFamily: "Georgia,serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(193,127,80,.13) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(160,100,50,.09) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 860, margin: "0 auto", padding: "32px 16px 60px" }}>

        {/* CABECERA */}
        <header style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: "2.8em", marginBottom: 6 }}>✈️</div>
          <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(1.8em,5vw,2.8em)", fontWeight: 900, color: "#2d1a0e", margin: 0 }}>{APP_NAME}</h1>
          <p style={{ color: "#8b6545", fontSize: "0.98em", marginTop: 10 }}>{APP_SUBTITLE}</p>
          <div style={{ width: 56, height: 3, background: "linear-gradient(90deg,#c17f50,#e8a87c)", borderRadius: 2, margin: "14px auto 0" }} />
          {installPrompt && !installed && (
            <button onClick={() => { installPrompt.prompt(); installPrompt.userChoice.then(() => setInstallPrompt(null)); }}
              style={{ marginTop: 14, padding: "9px 22px", borderRadius: 20, border: "1.5px solid rgba(193,127,80,.5)", background: "rgba(255,255,255,.7)", color: "#c17f50", fontWeight: 700, fontSize: "0.82em", cursor: "pointer" }}>
              📲 Instalar app
            </button>
          )}
        </header>

        {/* BUSCADOR */}
        <section style={{ background: "rgba(255,255,255,.78)", backdropFilter: "blur(14px)", borderRadius: 20, padding: "26px 24px", boxShadow: "0 8px 40px rgba(139,94,60,.14)", border: "1px solid rgba(200,160,100,.25)", marginBottom: 24 }}>
          <label style={{ display: "block", color: "#4a3728", fontWeight: 700, marginBottom: 10, fontSize: "0.88em", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ¿A dónde quieres viajar?
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={destination} onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ej: Tokio, Marruecos, Lisboa…"
              style={{ flex: 1, minWidth: 180, padding: "13px 16px", borderRadius: 12, border: "2px solid rgba(200,160,100,.35)", background: "rgba(255,255,255,.92)", fontSize: "1.02em", color: "#2d1a0e", outline: "none", fontFamily: "Georgia,serif" }}
              onFocus={e => (e.target.style.borderColor = "#c17f50")}
              onBlur={e => (e.target.style.borderColor = "rgba(200,160,100,.35)")} />
            <button onClick={handleSearch} disabled={!destination.trim()}
              style={{ padding: "13px 26px", borderRadius: 12, border: "none", background: destination.trim() ? "linear-gradient(135deg,#c17f50,#e8a87c)" : "#d4c4b0", color: "white", fontWeight: 700, cursor: destination.trim() ? "pointer" : "not-allowed", fontFamily: "Georgia,serif" }}>
              Explorar 🌍
            </button>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => setDestination(s)}
                style={{ padding: "5px 14px", borderRadius: 20, border: "1.5px solid rgba(193,127,80,.35)", background: "rgba(232,168,124,.1)", color: "#8b6545", fontSize: "0.8em", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: "0.75em", color: WORKER_URL ? "#7a9e6e" : "#b07840" }}>
            {WORKER_URL ? "🔒 Modo seguro (Worker activo)" : "⚠️ Configura WORKER_URL en config.js"}
          </div>
        </section>

        {/* AVISO eSIM */}
        {confirmed && fueraCEE && (
          <div style={{ background: "rgba(255,193,7,.12)", border: "1px solid rgba(255,193,7,.4)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: "0.88em", color: "#4a3728" }}>
            📱 <strong>{confirmed} está fuera de la Unión Europea</strong> — se añade automáticamente información sobre eSIM y conectividad para evitar cargos por roaming.
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {confirmed && showConfig && (
          <div ref={configRef}>
            <TravelConfig destination={confirmed} onConfirm={handleConfigConfirm} />
          </div>
        )}

        {/* RESUMEN */}
        {confirmed && travelConfig && (
          <div style={{ background: "rgba(193,127,80,.1)", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(193,127,80,.25)", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: "0.84em", color: "#4a3728" }}>
              <span>📍 <strong>{confirmed}</strong></span>
              {fueraCEE && <span style={{ color: "#c17f50", fontWeight: 700 }}>📱 Fuera CEE</span>}
              {travelConfig.fechas && <span>📅 {travelConfig.fechas}</span>}
              {travelConfig.origen && <span>🏠 Desde {travelConfig.origen}</span>}
              {travelConfig.transporte === "publico" && <span>🚆 Transporte público</span>}
              {travelConfig.transporte === "camper" && <span>🚐 Camper</span>}
              {travelConfig.transporte === "vehiculo" && <span>🚗 Vehículo particular</span>}
              {travelConfig.combustible && <span>⛽ {travelConfig.combustible}</span>}
            </div>
            <button onClick={() => { setShowConfig(true); setTravelConfig(null); setCache({}); }}
              style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid rgba(193,127,80,.4)", background: "white", color: "#c17f50", fontSize: "0.78em", cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: 700 }}>
              ✏️ Editar
            </button>
          </div>
        )}

        {/* RESULTADOS */}
        {confirmed && travelConfig && (
          <div ref={resultRef}>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 4, height: 38, background: "linear-gradient(180deg,#c17f50,#e8a87c)", borderRadius: 2 }} />
              <div>
                <div style={{ fontSize: "0.73em", color: "#8b6545", textTransform: "uppercase", letterSpacing: "0.1em" }}>Explorando</div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.75em", color: "#2d1a0e", fontWeight: 900 }}>{confirmed}</h2>
              </div>
            </div>

            {/* PESTAÑAS */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14, background: "rgba(255,255,255,.5)", padding: 5, borderRadius: 14, border: "1px solid rgba(200,160,100,.2)" }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const isDone = !!cache[`${confirmed}__${tab.id}`];
                return (
                  <button key={tab.id} onClick={() => handleTab(tab.id)}
                    style={{ flex: "1 1 auto", minWidth: 58, padding: "8px 5px", borderRadius: 10, border: "none", background: isActive ? "linear-gradient(135deg,#c17f50,#e8a87c)" : "transparent", color: isActive ? "white" : isDone ? "#8b6545" : "#b09070", fontWeight: isActive ? 700 : 500, fontSize: "0.68em", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, boxShadow: isActive ? "0 3px 12px rgba(193,127,80,.3)" : "none", fontFamily: "Georgia,serif", transition: "all .15s" }}>
                    <span style={{ fontSize: "1.3em" }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {isDone && !isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c17f50" }} />}
                  </button>
                );
              })}
            </div>

            {/* MAPA */}
            {(activeTab === "transporte_vehiculo" || activeTab === "transporte_camper") && esVehiculo && travelConfig.origen && (
              <MapLinks origen={travelConfig.origen} destino={confirmed} />
            )}

            {/* CONTENIDO */}
            <div style={{ background: "rgba(255,255,255,.82)", backdropFilter: "blur(16px)", borderRadius: 20, padding: "28px 24px", boxShadow: "0 8px 40px rgba(139,94,60,.12)", border: "1px solid rgba(200,160,100,.22)", minHeight: 180 }}>
              {error && <p style={{ color: "#c0392b", lineHeight: 1.6 }}>{error}</p>}
              {loading && !currentContent ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 0", gap: 10 }}>
                  <span style={{ fontSize: "2.4em" }}>{TABS.find(t => t.id === activeTab)?.icon}</span>
                  <LoadingDots />
                  <p style={{ color: "#8b6545", fontSize: "0.88em", margin: 0 }}>Buscando información actualizada…</p>
                </div>
              ) : currentContent ? (
                <MarkdownRenderer text={currentContent} />
              ) : !error ? (
                <p style={{ color: "#b09070", textAlign: "center", padding: "30px 0" }}>Pulsa una pestaña para cargar la información.</p>
              ) : null}
            </div>

            {/* BOTONES */}
            <div style={{ textAlign: "center", marginTop: 14, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={async () => {
                for (const t of TABS) {
                  await doFetch(confirmed, t.id);
                  await new Promise(r => setTimeout(r, 4000));
                }
              }}
                style={{ padding: "11px 22px", borderRadius: 12, border: "1.5px solid rgba(193,127,80,.45)", background: "rgba(255,255,255,.65)", color: "#c17f50", fontWeight: 700, fontSize: "0.85em", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                🔄 Cargar todo
              </button>
              <button onClick={() => generatePDF({ destination: confirmed, travelConfig, cache, tabs: TABS, fueraCEE })}
                style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#c17f50,#e8a87c)", color: "white", fontWeight: 700, fontSize: "0.85em", cursor: "pointer", fontFamily: "Georgia,serif", boxShadow: "0 4px 16px rgba(193,127,80,.35)" }}>
                📄 Descargar guía PDF
              </button>
            </div>
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 48, color: "#b0956f", fontSize: "0.76em", letterSpacing: "0.05em" }}>
          {APP_FOOTER}
        </footer>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');*{box-sizing:border-box}`}</style>
    </div>
  );
}
