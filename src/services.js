import { MONEDA } from "./config.js";

const enc = encodeURIComponent;
export const DAY = 864e5;
export const HOUR = 36e5;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const k2 = (g) => `${g.lat.toFixed(2)},${g.lon.toFixed(2)}`;
const safe = (p, fallback) => p.catch(() => fallback);

async function getJSON(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/* ───────── Caché local: lo ya consultado se puede ver sin cobertura ───────── */
function pruneCache() {
  try {
    const ks = Object.keys(localStorage).filter((k) => k.startsWith("vta:"));
    ks.slice(0, Math.ceil(ks.length / 2)).forEach((k) => localStorage.removeItem(k));
  } catch { /* nada */ }
}
export async function cached(key, ttl, fn) {
  const k = "vta:" + key;
  let old = null;
  try { old = JSON.parse(localStorage.getItem(k) || "null"); } catch { /* nada */ }
  if (old && Date.now() - old.t < ttl) return old.v;
  try {
    const v = await fn();
    try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch { pruneCache(); }
    return v;
  } catch (e) {
    if (old) return { ...old.v, _stale: old.t };
    throw e;
  }
}

/* ───────── Geometría ───────── */
const rad = (d) => (d * Math.PI) / 180;
export function km(a, b) {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}
// Convierte la línea de la ruta [[lon,lat],…] en puntos [lat,lon,kmAcumulado] cada stepKm
export function densify(coords, stepKm) {
  const out = [];
  let cum = 0, prev = null, next = 0;
  for (const [lon, lat] of coords) {
    const p = [lat, lon];
    if (prev) {
      const seg = km(prev, p);
      if (seg > 0) {
        while (next <= cum + seg) {
          const f = (next - cum) / seg;
          out.push([prev[0] + (p[0] - prev[0]) * f, prev[1] + (p[1] - prev[1]) * f, next]);
          next += stepKm;
        }
      }
      cum += seg;
    } else { out.push([p[0], p[1], 0]); next = stepKm; }
    prev = p;
  }
  if (prev) out.push([prev[0], prev[1], cum]);
  return out;
}
const sample = (pts, max) => { const s = Math.max(1, Math.ceil(pts.length / max)); return pts.filter((_, i) => i % s === 0); };

/* ───────── Nominatim (OpenStreetMap): buscar y localizar ───────── */
export async function geocode(q) {
  const d = await getJSON(`https://nominatim.openstreetmap.org/search?q=${enc(q)}&format=jsonv2&limit=1&addressdetails=1&accept-language=es`);
  if (!d.length) return null;
  const r = d[0], a = r.address || {};
  return { lat: +r.lat, lon: +r.lon, cc: (a.country_code || "").toUpperCase(), country: a.country || "", name: r.name || q, display: r.display_name };
}
export async function reverse(lat, lon) {
  const d = await getJSON(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&accept-language=es`);
  const a = d.address || {};
  const name = a.city || a.town || a.village || a.municipality || a.county || "";
  return { lat, lon, cc: (a.country_code || "").toUpperCase(), country: a.country || "", name: name || a.country || "Mi ubicación", text: name ? `${name}, ${a.country || ""}` : a.country || "" };
}

/* ───────── Overpass (OpenStreetMap): lugares reales ───────── */
const OVP = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
export async function overpass(q) {
  let err;
  for (const u of OVP) {
    try {
      const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + enc(q) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).elements || [];
    } catch (e) { err = e; }
  }
  throw err;
}
const poi = (e) => ({ id: e.type + e.id, name: (e.tags || {}).name, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, tags: e.tags || {} });
const web = (t) => t.website || t["contact:website"] || null;

/* ───────── Wikivoyage + Wikipedia ───────── */
const WV = "https://es.wikivoyage.org/w/api.php";
export const ALIAS = {
  ver: ["ver", "qué ver", "puntos de interés", "lugares de interés"],
  hacer: ["hacer", "qué hacer", "actividades"],
  comer: ["comer", "dónde comer", "gastronomía"],
  beber: ["beber", "salir", "vida nocturna", "beber y salir"],
  seguridad: ["seguridad", "precauciones"],
  respeto: ["respeto", "costumbres", "etiqueta"],
  comunicacion: ["comunicación", "idioma", "hablar"],
  salud: ["salud", "cuidados"],
  llegar: ["cómo llegar", "llegar", "moverse", "cómo desplazarse"],
  comprar: ["comprar", "compras"],
};
export function splitSections(text) {
  const out = { _intro: [] };
  let cur = "_intro";
  for (const raw of String(text).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(=+)\s*(.+?)\s*\1$/);
    if (m) {
      if (m[1].length === 2) { cur = m[2]; out[cur] = out[cur] || []; } else out[cur].push("▸ " + m[2]);
      continue;
    }
    out[cur].push(line);
  }
  return out;
}
export function sec(sections, aliases) {
  const keys = Object.keys(sections || {});
  for (const a of aliases) { const k = keys.find((x) => norm(x) === norm(a)); if (k && sections[k].length) return sections[k]; }
  for (const a of aliases) { const k = keys.find((x) => norm(x).startsWith(norm(a))); if (k && sections[k].length) return sections[k]; }
  return [];
}
export function wvPage(ctx) {
  const { geo, dest } = ctx;
  return cached(`wv:${k2(geo)}`, 7 * DAY, async () => {
    let title = null;
    for (const n of [geo.name, dest]) {
      if (!n) continue;
      const d = await getJSON(`${WV}?action=opensearch&search=${enc(n)}&limit=1&namespace=0&format=json&origin=*`);
      const t = d[1]?.[0];
      if (t && (norm(t).includes(norm(n)) || norm(n).includes(norm(t)))) { title = t; break; }
    }
    let sections = {}, url = null;
    if (title) {
      const j = await getJSON(`${WV}?action=query&prop=extracts&explaintext=1&redirects=1&titles=${enc(title)}&format=json&origin=*`);
      const p = Object.values(j.query.pages)[0];
      sections = splitSections(p.extract || "");
      url = `https://es.wikivoyage.org/wiki/${enc(title.replace(/ /g, "_"))}`;
    }
    let intro = null;
    try {
      const s = await getJSON(`https://es.wikipedia.org/api/rest_v1/page/summary/${enc(geo.name || dest)}`);
      if (s.type !== "disambiguation" && s.extract) intro = { text: s.extract, url: s.content_urls?.desktop?.page, img: s.thumbnail?.source };
    } catch { /* sin resumen */ }
    return { title, url, sections, intro };
  });
}
function wpNearby(geo) {
  return cached(`wp:${k2(geo)}`, 14 * DAY, async () => {
    const u = `https://es.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${geo.lat}|${geo.lon}&ggsradius=10000&ggslimit=20&prop=extracts|coordinates|pageimages&exintro=1&explaintext=1&exsentences=2&exlimit=max&piprop=thumbnail&pithumbsize=160&colimit=max&format=json&origin=*`;
    const j = await getJSON(u);
    const items = Object.values(j.query?.pages || {})
      .filter((p) => p.extract && p.coordinates?.[0])
      .map((p) => ({
        title: p.title, extract: p.extract, thumb: p.thumbnail?.source,
        lat: p.coordinates[0].lat, lon: p.coordinates[0].lon,
        url: `https://es.wikipedia.org/wiki/${enc(p.title.replace(/ /g, "_"))}`,
        d: km([geo.lat, geo.lon], [p.coordinates[0].lat, p.coordinates[0].lon]),
      }))
      .sort((a, b) => a.d - b.d);
    return { items };
  });
}
function estaciones(geo) {
  return cached(`est:${k2(geo)}`, 14 * DAY, async () => {
    const els = await overpass(`[out:json][timeout:25];(nwr["railway"="station"]["name"](around:8000,${geo.lat},${geo.lon});nwr["amenity"="bus_station"]["name"](around:8000,${geo.lat},${geo.lon}););out center tags 60;`);
    const items = els.map(poi).filter((p) => p.lat != null && !["subway", "light_rail", "tram"].includes(p.tags.station))
      .map((p) => ({ name: p.name, kind: p.tags.amenity === "bus_station" ? "Estación de autobuses" : "Estación de tren", lat: p.lat, lon: p.lon, d: km([geo.lat, geo.lon], [p.lat, p.lon]) }))
      .sort((a, b) => a.d - b.d).slice(0, 8);
    return { items };
  });
}
function aeropuertos(geo) {
  return cached(`apt:${k2(geo)}`, 30 * DAY, async () => {
    const els = await overpass(`[out:json][timeout:25];nwr["aeroway"="aerodrome"]["iata"](around:90000,${geo.lat},${geo.lon});out center tags 15;`);
    const items = els.map(poi).filter((p) => p.lat != null)
      .map((p) => ({ name: p.name, iata: p.tags.iata, lat: p.lat, lon: p.lon, d: km([geo.lat, geo.lon], [p.lat, p.lon]) }))
      .sort((a, b) => a.d - b.d).slice(0, 5);
    return { items };
  });
}

/* ───────── Rutas (OSRM) y gasolineras (Ministerio, vía /api) ───────── */
async function route(a, b) {
  const j = await getJSON(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=simplified&geometries=geojson`);
  if (j.code !== "Ok" || !j.routes?.length) throw new Error("sin ruta");
  const r = j.routes[0];
  return { km: r.distance / 1000, min: r.duration / 60, points: densify(r.geometry.coordinates, 5) };
}
async function gasolineras(points, fuel) {
  const r = await fetch("/api/gasolineras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ points, fuel, radiusKm: 4 }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

/* ───────── Tiempo y mareas (Open-Meteo) ───────── */
export const WMO = (c) =>
  c === 0 ? ["☀️", "Despejado"] : c <= 2 ? ["🌤️", "Poco nuboso"] : c === 3 ? ["☁️", "Nublado"] : c <= 48 ? ["🌫️", "Niebla"] :
  c <= 57 ? ["🌦️", "Llovizna"] : c <= 67 ? ["🌧️", "Lluvia"] : c <= 77 ? ["🌨️", "Nieve"] : c <= 82 ? ["🌦️", "Chubascos"] :
  c <= 86 ? ["🌨️", "Chubascos de nieve"] : ["⛈️", "Tormenta"];
export function ropa(tmin, tmax, lluvia, viento) {
  const r = [];
  if (tmax >= 30) r.push("Ropa ligera y transpirable, gorra, gafas y protector solar; lleva agua.");
  else if (tmax >= 22) r.push("Ropa de verano y algo de manga larga para la noche.");
  else if (tmax >= 14) r.push("Ropa de entretiempo: capas y una chaqueta ligera.");
  else r.push("Abrigo y capas térmicas.");
  if (tmin <= 3) r.push("Gorro y guantes: se esperan mínimas cercanas a 0 °C.");
  if (lluvia) r.push("Chubasquero o paraguas y calzado impermeable.");
  if (viento >= 40) r.push("Cortavientos: se esperan rachas fuertes.");
  return r;
}
const yearBefore = (d) => { const [y, m, dd] = d.split("-"); return `${+y - 1}-${m}-${m === "02" && dd === "29" ? "28" : dd}`; };
async function tiempo(ctx) {
  const { lat, lon } = ctx.geo, { ida, vuelta } = ctx.cfg;
  return cached(`tm:${k2(ctx.geo)}:${ida || ""}:${vuelta || ""}:${new Date().toISOString().slice(0, 13)}`, 3 * HOUR, async () => {
    const f = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=16`);
    const days = f.daily.time.map((t, i) => ({ t, code: f.daily.weather_code[i], max: f.daily.temperature_2m_max[i], min: f.daily.temperature_2m_min[i], rain: f.daily.precipitation_sum[i], prob: f.daily.precipitation_probability_max[i], wind: f.daily.wind_speed_10m_max[i] }));
    const fin = vuelta || ida;
    const trip = ida ? days.filter((x) => x.t >= ida && x.t <= fin) : [];
    let hist = null;
    if (ida && !trip.length) {
      try {
        const h = await getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${yearBefore(ida)}&end_date=${yearBefore(fin)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
        hist = h.daily.time.map((t, i) => ({ t, max: h.daily.temperature_2m_max[i], min: h.daily.temperature_2m_min[i], rain: h.daily.precipitation_sum[i] }));
      } catch { /* sin histórico */ }
    }
    let months = [];
    try {
      const y = new Date().getFullYear() - 1;
      const c = await getJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${y}-01-01&end_date=${y}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
      const acc = Array.from({ length: 12 }, () => ({ max: 0, min: 0, rain: 0, rainy: 0, n: 0 }));
      c.daily.time.forEach((t, i) => {
        const m = +t.slice(5, 7) - 1, a = acc[m];
        if (c.daily.temperature_2m_max[i] == null) return;
        a.max += c.daily.temperature_2m_max[i]; a.min += c.daily.temperature_2m_min[i];
        a.rain += c.daily.precipitation_sum[i] || 0; a.rainy += (c.daily.precipitation_sum[i] || 0) >= 1 ? 1 : 0; a.n++;
      });
      months = acc.map((a) => (a.n ? { max: a.max / a.n, min: a.min / a.n, rain: a.rain, rainy: a.rainy } : null));
    } catch { /* sin clima mensual */ }
    const base = trip.length ? trip : hist || days.slice(0, 7);
    const tmin = Math.min(...base.map((x) => x.min)), tmax = Math.max(...base.map((x) => x.max));
    const lluvia = base.some((x) => (x.rain || 0) >= 1 || (x.prob || 0) >= 50);
    const viento = Math.max(...base.map((x) => x.wind || 0));
    return { next: days.slice(0, 7), trip, hist, months, ropa: ropa(tmin, tmax, lluvia, viento) };
  });
}
function extremes(times, h) {
  const out = [];
  for (let i = 1; i < h.length - 1; i++) {
    if (h[i] == null || h[i - 1] == null || h[i + 1] == null) continue;
    if (h[i] > h[i - 1] && h[i] >= h[i + 1]) out.push({ t: times[i], h: h[i], type: "alta" });
    else if (h[i] < h[i - 1] && h[i] <= h[i + 1]) out.push({ t: times[i], h: h[i], type: "baja" });
  }
  return out;
}
async function mareas(ctx) {
  const { lat, lon } = ctx.geo;
  return cached(`mar:${k2(ctx.geo)}:${new Date().toISOString().slice(0, 13)}`, 6 * HOUR, async () => {
    for (const [dy, dx] of [[0, 0], [0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1], [0.2, 0.2], [-0.2, -0.2]]) {
      try {
        const m = await getJSON(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat + dy}&longitude=${lon + dx}&hourly=sea_level_height_msl&daily=wave_height_max,wave_period_max&timezone=auto&forecast_days=7`);
        const h = m.hourly?.sea_level_height_msl || [];
        if (!h.some((v) => v != null)) continue;
        const ext = extremes(m.hourly.time, h);
        const dias = m.daily.time.map((t, i) => ({ fecha: t, mareas: ext.filter((e) => e.t.startsWith(t)), ola: m.daily.wave_height_max?.[i], periodo: m.daily.wave_period_max?.[i] }));
        const vals = h.filter((v) => v != null);
        return { costera: true, dias, amp: Math.max(...vals) - Math.min(...vals), lejos: Math.abs(dy) + Math.abs(dx) > 0 };
      } catch { /* probar el siguiente punto */ }
    }
    return { costera: false };
  });
}

/* ───────── Moneda ───────── */
async function cambio(ctx) {
  const currency = MONEDA[ctx.geo.cc];
  return cached(`fx:${currency}`, 6 * HOUR, async () => {
    const j = await getJSON("https://open.er-api.com/v6/latest/EUR");
    return { currency, rate: j.rates?.[currency] || null, updated: (j.time_last_update_utc || "").slice(0, 16) };
  });
}

/* ───────── Loaders por pestaña ───────── */
const TIPO_ALOJ = "^(hotel|hostel|guest_house|apartment|motel|chalet|camp_site)$";

async function alojamiento(ctx) {
  const { lat, lon } = ctx.geo;
  return cached(`aloj:${k2(ctx.geo)}`, 7 * DAY, async () => {
    const q = (r) => `[out:json][timeout:25];nwr["tourism"~"${TIPO_ALOJ}"]["name"](around:${r},${lat},${lon});out center tags 150;`;
    let radio = 4, els = await overpass(q(4000));
    if (els.length < 8) { radio = 15; els = await overpass(q(15000)); }
    const items = els.map(poi).filter((p) => p.lat != null)
      .map((p) => ({ name: p.name, type: p.tags.tourism, stars: p.tags.stars, web: web(p.tags), phone: p.tags.phone || p.tags["contact:phone"], lat: p.lat, lon: p.lon, d: km([lat, lon], [p.lat, p.lon]) }))
      .sort((a, b) => (a.web ? 0 : 1) - (b.web ? 0 : 1) || a.d - b.d).slice(0, 80);
    return { radio, items };
  });
}

async function transporte(ctx) {
  const { geo, cfg, origin } = ctx, mode = cfg.transporte;
  const ok = origin ? k2(origin) : "-";
  return cached(`tr:${mode}:${ok}:${k2(geo)}:${cfg.combustible}`, 2 * HOUR, async () => {
    const out = { mode, straight: origin ? Math.round(km([origin.lat, origin.lon], [geo.lat, geo.lon])) : null, route: null, gas: null, camperRuta: [], camperDestino: [], estaciones: [], aeropuertos: [] };
    let pts = null;
    if (origin && mode !== "publico") {
      try { const r = await route(origin, geo); out.route = { km: Math.round(r.km), min: Math.round(r.min) }; pts = r.points; } catch { /* sin ruta por carretera */ }
    } else if (origin) {
      try { const r = await route(origin, geo); out.route = { km: Math.round(r.km), min: Math.round(r.min) }; } catch { /* se ignora */ }
    }
    if (mode === "publico") {
      out.estaciones = (await safe(estaciones(geo), { items: [] })).items;
      out.aeropuertos = (await safe(aeropuertos(geo), { items: [] })).items;
      return out;
    }
    const rutaPts = pts || [[geo.lat, geo.lon, 0]];
    if (cfg.combustible && cfg.combustible !== "Eléctrico") {
      try { out.gas = await gasolineras(rutaPts, cfg.combustible); } catch (e) { out.gas = { error: String(e.message || e) }; }
    }
    if (mode === "camper") {
      const camperQ = (rad, list) => `[out:json][timeout:40];(nwr["tourism"="caravan_site"](around:${rad},${list});nwr["amenity"="sanitary_dump_station"](around:${rad},${list}););out center tags 100;`;
      const item = (e, km0) => { const p = poi(e), t = p.tags; return { id: p.id, name: t.name || null, kind: t.tourism === "caravan_site" ? "Área o camping" : "Punto de vaciado", fee: t.fee, charge: t.charge, power: t.power_supply, water: t.drinking_water, dump: t.sanitary_dump_station, cap: t.capacity, web: web(t), lat: p.lat, lon: p.lon, km: km0 }; };
      try { out.camperDestino = (await overpass(camperQ(25000, `${geo.lat},${geo.lon}`))).map((e) => item(e, null)).filter((c) => c.lat != null).slice(0, 25); } catch { out.camperDestino = null; }
      if (pts) {
        const sp = sample(pts, 30);
        try {
          const els = await overpass(camperQ(3000, sp.map((p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(",")));
          out.camperRuta = els.map((e) => {
            const c = item(e, 0);
            if (c.lat == null) return null;
            let best = Infinity;
            sp.forEach((p) => { const dd = km([c.lat, c.lon], [p[0], p[1]]); if (dd < best) { best = dd; c.km = p[2]; } });
            return c;
          }).filter(Boolean).sort((a, b) => a.km - b.km).slice(0, 40);
        } catch { out.camperRuta = null; }
      }
    }
    return out;
  });
}

async function visitas(ctx) {
  const wv = await safe(wvPage(ctx), { sections: {}, intro: null });
  const [near, est] = await Promise.all([safe(wpNearby(ctx.geo), { items: [] }), safe(estaciones(ctx.geo), { items: [] })]);
  return { wv, near: near.items, est: est.items, _stale: wv._stale };
}

async function actividades(ctx) {
  const { lat, lon } = ctx.geo;
  const wv = await safe(wvPage(ctx), { sections: {} });
  const osm = await safe(cached(`act:${k2(ctx.geo)}`, 14 * DAY, async () => {
    const R = 20000, a = `(around:${R},${lat},${lon})`;
    const els = await overpass(`[out:json][timeout:30];(nwr["leisure"="nature_reserve"]["name"]${a};nwr["boundary"="national_park"]["name"]${a};nwr["tourism"~"^(viewpoint|theme_park|zoo|aquarium)$"]["name"]${a};nwr["natural"~"^(peak|waterfall|beach|cave_entrance|hot_spring)$"]["name"]${a};rel["route"="hiking"]["name"](around:15000,${lat},${lon}););out center tags 150;`);
    const cat = (t) => t.route === "hiking" ? "Rutas de senderismo" : t.boundary === "national_park" || t.leisure === "nature_reserve" ? "Espacios naturales" : t.tourism === "viewpoint" ? "Miradores" : t.natural === "beach" ? "Playas" : ["peak", "waterfall", "cave_entrance", "hot_spring"].includes(t.natural) ? "Cumbres, cascadas y cuevas" : "Ocio y parques";
    const seen = new Set();
    const items = els.map(poi).filter((p) => p.lat != null && p.name && !seen.has(p.name + cat(p.tags)) && seen.add(p.name + cat(p.tags)))
      .map((p) => ({ name: p.name, cat: cat(p.tags), ref: p.tags.ref, len: p.tags.distance, lat: p.lat, lon: p.lon, d: km([lat, lon], [p.lat, p.lon]) }))
      .sort((a, b) => a.d - b.d);
    return { items };
  }), { items: [] });
  return { wv, items: osm.items, _stale: osm._stale };
}

async function gastronomia(ctx) {
  const { lat, lon } = ctx.geo;
  const wv = await safe(wvPage(ctx), { sections: {} });
  const rest = await safe(cached(`gas:${k2(ctx.geo)}`, 14 * DAY, async () => {
    const q = (r) => `[out:json][timeout:30];(nwr["amenity"~"^(restaurant|cafe|bar|pub|ice_cream)$"]["name"](around:${r},${lat},${lon});nwr["amenity"="marketplace"]["name"](around:6000,${lat},${lon}););out center tags 200;`;
    let els = await overpass(q(2000));
    if (els.length < 10) els = await overpass(q(10000));
    const all = els.map(poi).filter((p) => p.lat != null).map((p) => ({ name: p.name, amenity: p.tags.amenity, cuisine: p.tags.cuisine, web: web(p.tags), hours: p.tags.opening_hours, lat: p.lat, lon: p.lon, d: km([lat, lon], [p.lat, p.lon]) }));
    const lugares = all.filter((x) => x.amenity !== "marketplace").sort((a, b) => (b.cuisine ? 1 : 0) + (b.web ? 1 : 0) - ((a.cuisine ? 1 : 0) + (a.web ? 1 : 0)) || a.d - b.d).slice(0, 30);
    return { lugares, mercados: all.filter((x) => x.amenity === "marketplace").sort((a, b) => a.d - b.d).slice(0, 6) };
  }), { lugares: [], mercados: [] });
  return { wv, ...rest };
}

async function consejos(ctx) {
  return { wv: await safe(wvPage(ctx), { sections: {}, intro: null }) };
}

async function enlaces(ctx) {
  const { lat, lon } = ctx.geo;
  const r = await safe(cached(`ofi:${k2(ctx.geo)}`, 30 * DAY, async () => {
    const els = await overpass(`[out:json][timeout:25];nwr["tourism"="information"]["information"="office"](around:8000,${lat},${lon});out center tags 20;`);
    return { items: els.map(poi).filter((p) => p.lat != null).map((p) => ({ name: p.name || "Oficina de turismo", phone: p.tags.phone || p.tags["contact:phone"], web: web(p.tags), hours: p.tags.opening_hours, lat: p.lat, lon: p.lon, d: km([lat, lon], [p.lat, p.lon]) })).sort((a, b) => a.d - b.d).slice(0, 6) };
  }), { items: [] });
  return { oficinas: r.items, _stale: r._stale };
}

const vacio = async () => ({});

export const LOADERS = { alojamiento, transporte, visitas, actividades, gastronomia, tiempo, mareas, cambio, enlaces, consejos, esim: vacio, docs: vacio };
