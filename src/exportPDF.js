const TAB_LABELS = {
  alojamiento:        { label: "Alojamiento",         icon: "🏨" },
  transporte_publico: { label: "Transporte público",   icon: "🚆" },
  transporte_camper:  { label: "Ruta en Camper",       icon: "🚐" },
  transporte_vehiculo:{ label: "Ruta en Vehículo",     icon: "🚗" },
  visitas:            { label: "Visitas",               icon: "🗺️" },
  actividades:        { label: "Actividades",           icon: "🏃" },
  gastronomia:        { label: "Gastronomía",           icon: "🍽️" },
  tiempo:             { label: "Tiempo",                icon: "🌤️" },
  mareas:             { label: "Mareas",                icon: "🌊" },
  esim:               { label: "eSIM y Conectividad",  icon: "📱" },
  documentacion:      { label: "Documentación",         icon: "📋" },
  enlaces:            { label: "Recursos web",          icon: "🔗" },
  consejos:           { label: "Consejos",              icon: "💡" },
};

function markdownToHtml(text) {
  if (!text) return "";
  return text.split("\n").map(line => {
    if (!line.trim()) return "<br/>";
    if (line.startsWith("## "))  return `<h2>${line.slice(3)}</h2>`;
    if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
    if (line.startsWith("- ") || line.startsWith("• "))
      return `<li>${line.slice(2)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')}</li>`;
    if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.+)/);
      return m ? `<li>${m[2].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>` : `<p>${line}</p>`;
    }
    return `<p>${line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')}</p>`;
  }).join("\n").replace(/(<li>[\s\S]*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`);
}

export function generatePDF({ destination, travelConfig, cache, tabs, fueraCEE }) {
  const allTabs = fueraCEE
    ? [...tabs, { id: "esim", label: "eSIM", icon: "📱" }]
    : tabs;

  const sections = allTabs
    .filter(tab => cache[`${destination}__${tab.id}`])
    .map(tab => {
      const meta = TAB_LABELS[tab.id] || { label: tab.label, icon: tab.icon };
      return { id: tab.id, label: meta.label, icon: meta.icon, content: cache[`${destination}__${tab.id}`] };
    });

  if (sections.length === 0) {
    alert("No hay información cargada. Carga al menos una sección primero.");
    return;
  }

  const { fechas = "", origen = "", transporte = "", combustible = "" } = travelConfig || {};
  const transporteLabel = transporte === "publico" ? "Transporte público" : transporte === "camper" ? "Camper" : transporte === "vehiculo" ? "Vehículo particular" : "";

  const mapaLinks = (transporte === "vehiculo" || transporte === "camper") && origen
    ? `<div class="map-links">
        <p><strong>🗺️ Navegar con:</strong></p>
        <a href="https://www.google.com/maps/dir/${encodeURIComponent(origen)}/${encodeURIComponent(destination)}" target="_blank">Google Maps</a>
        <a href="https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes" target="_blank">Waze</a>
        <a href="https://maps.apple.com/?saddr=${encodeURIComponent(origen)}&daddr=${encodeURIComponent(destination)}" target="_blank">Apple Maps</a>
      </div>` : "";

  const esimBanner = fueraCEE
    ? `<div class="esim-banner">📱 <strong>${destination} está fuera de la CEE</strong> — Consulta la sección <em>eSIM y Conectividad</em> para evitar cargos por roaming.</div>`
    : "";

  const tocItems = sections.map((s, i) => `<li><a href="#section-${i}">${s.icon} ${s.label}</a></li>`).join("\n");
  const sectionBlocks = sections.map((s, i) => `
    <div class="section" id="section-${i}">
      <div class="section-header"><span class="section-icon">${s.icon}</span><h2>${s.label}</h2></div>
      <div class="section-content">${markdownToHtml(s.content)}</div>
    </div>`).join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Guía de viaje — ${destination}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Georgia,serif;color:#2d1a0e;background:#fdf6ec;line-height:1.7}
    .cover{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(160deg,#fdf6ec 0%,#f5e6d0 55%,#eddcca 100%);padding:60px 40px;page-break-after:always}
    .cover-plane{font-size:5em;margin-bottom:24px}
    .cover h1{font-size:3.5em;font-weight:900;color:#2d1a0e;margin-bottom:12px}
    .cover-subtitle{font-size:1.2em;color:#8b6545;margin-bottom:32px}
    .cover-divider{width:80px;height:4px;background:linear-gradient(90deg,#c17f50,#e8a87c);border-radius:2px;margin:0 auto 32px}
    .cover-info{background:rgba(255,255,255,.7);border-radius:16px;padding:24px 32px;border:1px solid rgba(193,127,80,.25);max-width:500px;width:100%}
    .cover-info-row{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(193,127,80,.15);font-size:1em}
    .cover-info-row:last-child{border-bottom:none}
    .cover-info-label{color:#8b6545;min-width:130px;font-size:.85em}
    .cover-info-value{color:#2d1a0e;font-weight:700}
    .cover-footer{margin-top:40px;font-size:.8em;color:#b0956f;letter-spacing:.06em}
    .esim-banner-cover{margin-top:20px;padding:12px 20px;background:rgba(193,127,80,.15);border-radius:10px;font-size:.9em;color:#4a3728;border:1px solid rgba(193,127,80,.3)}
    .toc{padding:60px;page-break-after:always}
    .toc h2{font-size:1.8em;color:#c17f50;margin-bottom:24px;border-bottom:2px solid rgba(193,127,80,.3);padding-bottom:12px}
    .toc ul{list-style:none}
    .toc li{margin-bottom:10px}
    .toc a{color:#4a3728;text-decoration:none;font-size:1.05em;display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px}
    .toc a:hover{background:rgba(193,127,80,.1)}
    .map-links{background:rgba(193,127,80,.08);border:1px solid rgba(193,127,80,.2);border-radius:12px;padding:16px;margin:20px 0}
    .map-links p{margin-bottom:10px;font-weight:700}
    .map-links a{display:inline-block;margin-right:10px;margin-bottom:6px;padding:7px 16px;border-radius:8px;background:#c17f50;color:white!important;text-decoration:none;font-weight:700;font-size:.88em}
    .esim-banner{background:rgba(255,193,7,.15);border:1px solid rgba(255,193,7,.4);border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:.9em;color:#4a3728}
    .section{padding:50px 60px;page-break-before:always}
    .section-header{display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid rgba(193,127,80,.25)}
    .section-icon{font-size:2.5em}
    .section-header h2{font-size:2em;color:#c17f50;font-weight:900}
    .section-content h2{font-size:1.2em;font-weight:800;color:#c17f50;margin-top:1.4em;margin-bottom:.5em;border-bottom:1px solid rgba(193,127,80,.2);padding-bottom:4px}
    .section-content h3{font-size:1em;font-weight:700;color:#4a3728;margin-top:1em;margin-bottom:.3em}
    .section-content p{color:#3d2b1f;margin-bottom:8px}
    .section-content ul{padding-left:20px;margin-bottom:12px}
    .section-content li{color:#3d2b1f;margin-bottom:5px}
    .section-content strong{color:#4a3728}
    .section-content a{color:#c17f50;font-weight:600}
    .section-content br{display:block;margin-bottom:4px}
    .toolbar{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:10px;z-index:100}
    .toolbar button{padding:12px 20px;border-radius:12px;border:none;background:linear-gradient(135deg,#c17f50,#e8a87c);color:white;font-weight:700;font-size:.9em;cursor:pointer;font-family:Georgia,serif;box-shadow:0 4px 16px rgba(193,127,80,.4)}
    .toolbar button:hover{opacity:.9;transform:translateY(-2px)}
    .fab-nav{position:fixed;bottom:110px;right:24px;background:rgba(255,255,255,.97);border-radius:16px;padding:14px;box-shadow:0 4px 24px rgba(0,0,0,.15);border:1px solid rgba(193,127,80,.25);max-height:60vh;overflow-y:auto;display:none;z-index:100;min-width:200px}
    .fab-nav.open{display:block}
    .fab-nav a{display:block;padding:7px 12px;color:#4a3728;text-decoration:none;font-size:.88em;border-radius:8px;white-space:nowrap}
    .fab-nav a:hover{background:rgba(193,127,80,.1)}
    @media print{body{background:white}.cover{background:#fdf6ec}.section{padding:40px 50px}.toolbar,.fab-nav{display:none!important}a{color:#c17f50!important}}
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-plane">✈️</div>
    <h1>${destination}</h1>
    <p class="cover-subtitle">Guía de viaje personalizada</p>
    <div class="cover-divider"></div>
    <div class="cover-info">
      ${fechas ? `<div class="cover-info-row"><span class="cover-info-label">📅 Fechas</span><span class="cover-info-value">${fechas}</span></div>` : ""}
      ${origen ? `<div class="cover-info-row"><span class="cover-info-label">📍 Origen</span><span class="cover-info-value">${origen}</span></div>` : ""}
      ${transporteLabel ? `<div class="cover-info-row"><span class="cover-info-label">🚌 Transporte</span><span class="cover-info-value">${transporteLabel}</span></div>` : ""}
      ${combustible ? `<div class="cover-info-row"><span class="cover-info-label">⛽ Combustible</span><span class="cover-info-value">${combustible}</span></div>` : ""}
      <div class="cover-info-row"><span class="cover-info-label">📄 Secciones</span><span class="cover-info-value">${sections.length} apartados</span></div>
      ${fueraCEE ? `<div class="cover-info-row"><span class="cover-info-label">📱 Conectividad</span><span class="cover-info-value">Fuera de la CEE — Ver sección eSIM</span></div>` : ""}
    </div>
    ${fueraCEE ? `<div class="esim-banner-cover">⚠️ ${destination} está fuera de la Unión Europea — se incluye información sobre eSIM y conectividad para evitar cargos por roaming.</div>` : ""}
    <p class="cover-footer">Generado con Asistente de Viajes TA · ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
  </div>

  <div class="toc">
    <h2>📋 Índice</h2>
    <ul>${tocItems}</ul>
    ${mapaLinks}
    ${esimBanner}
  </div>

  ${sectionBlocks}

  <div class="toolbar">
    <button onclick="window.print()">🖨️ Guardar PDF</button>
    <button onclick="document.getElementById('toc-nav').classList.toggle('open')">📋 Índice</button>
  </div>
  <div class="fab-nav" id="toc-nav">
    ${sections.map((s, i) => `<a href="#section-${i}" onclick="document.getElementById('toc-nav').classList.remove('open')">${s.icon} ${s.label}</a>`).join("\n")}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) alert("Permite las ventanas emergentes para descargar la guía.");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
