/**
 * Precios oficiales de carburantes (Ministerio para la Transición Ecológica).
 * Se llama desde el servidor porque el servicio del Ministerio no permite CORS.
 * Recibe: { points: [[lat, lon, kmDesdeOrigen], …], fuel, radiusKm }
 */
const URL_API = "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";
const FUEL = {
  "Gasolina 95": "Precio Gasolina 95 E5",
  "Gasolina 98": "Precio Gasolina 98 E5",
  "Diésel": "Precio Gasoleo A",
  "Diésel premium": "Precio Gasoleo Premium",
  "GLP": "Precio Gases licuados del petróleo",
  "Híbrido": "Precio Gasolina 95 E5",
};
let cache = { t: 0, j: null };
const num = (s) => { const n = parseFloat(String(s ?? "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
const rad = (d) => (d * Math.PI) / 180;
const dist = (la1, lo1, la2, lo2) => {
  const a = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  try {
    const { points, fuel, radiusKm = 4 } = req.body || {};
    const key = FUEL[fuel];
    if (!key || !Array.isArray(points) || !points.length) return res.status(400).json({ error: "Parámetros no válidos" });

    if (!cache.j || Date.now() - cache.t > 20 * 60 * 1000) {
      const r = await fetch(URL_API, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error("El Ministerio respondió HTTP " + r.status);
      cache = { t: Date.now(), j: await r.json() };
    }
    const list = cache.j.ListaEESSPrecio || [];
    const pad = radiusKm / 70;
    const minLa = Math.min(...points.map((p) => p[0])) - pad, maxLa = Math.max(...points.map((p) => p[0])) + pad;
    const minLo = Math.min(...points.map((p) => p[1])) - pad, maxLo = Math.max(...points.map((p) => p[1])) + pad;

    const found = [];
    for (const s of list) {
      const la = num(s["Latitud"]), lo = num(s["Longitud (WGS84)"]), price = num(s[key]);
      if (!Number.isFinite(la) || !Number.isFinite(lo) || !Number.isFinite(price)) continue;
      if (la < minLa || la > maxLa || lo < minLo || lo > maxLo) continue;
      let best = Infinity, at = 0;
      for (const p of points) {
        if (Math.abs(p[0] - la) > pad || Math.abs(p[1] - lo) > pad) continue;
        const d = dist(la, lo, p[0], p[1]);
        if (d < best) { best = d; at = p[2] || 0; }
      }
      if (best <= radiusKm) found.push({ n: s["Rótulo"], m: s["Municipio"], p: s["Provincia"], a: s["Dirección"], h: s["Horario"], price, off: +best.toFixed(1), km: Math.round(at), lat: la, lon: lo });
    }
    // Para no enviar de más: las 3 más baratas de cada tramo de 25 km
    const groups = {};
    found.forEach((s) => { (groups[Math.floor(s.km / 25)] = groups[Math.floor(s.km / 25)] || []).push(s); });
    const stations = Object.values(groups).flatMap((g) => g.sort((a, b) => a.price - b.price).slice(0, 3)).sort((a, b) => a.km - b.km);
    res.status(200).json({ fecha: cache.j.Fecha, fuel, total: found.length, stations });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
