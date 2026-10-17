export const WORKER_URL = "/api/proxy";
export const APP_NAME = "Asistente de Viajes TA";
export const APP_SUBTITLE = "Planifica tu próxima aventura con torpeza artificial";
export const APP_FOOTER = "Powered by Gemini AI · Los Viajes de Jesús";
export const SUGERENCIAS = ["Madrid", "Segovia", "Ourense", "Boceguillas", "Sepúlveda", "Tokio", "New York", "París"];

// Códigos de país ISO de la UE
export const PAISES_UE = [
  "DE","AT","BE","BG","CY","HR","DK","SK","SI","ES","EE","FI",
  "FR","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT",
  "CZ","RO","SE"
];

// Detecta si un destino está fuera de la UE consultando Nominatim
export async function esFueraCEE(destination) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1&addressdetails=1`,
      { headers: { "Accept-Language": "es" } }
    );
    const data = await res.json();
    if (!data || data.length === 0) return false;
    const countryCode = data[0]?.address?.country_code?.toUpperCase();
    if (!countryCode) return false;
    return !PAISES_UE.includes(countryCode);
  } catch {
    return false; // Si hay error, asumimos que está dentro de la UE
  }
}
