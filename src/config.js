// ╔══════════════════════════════════════════════════╗
// ║  CONFIGURACIÓN — textos y listas editables aquí  ║
// ╚══════════════════════════════════════════════════╝

export const APP_NAME = "Asistente de Viajes TA";
export const APP_SUBTITLE = "Planifica tu próxima aventura con torpeza artificial";
export const APP_FOOTER = "Datos abiertos: OpenStreetMap · Wikivoyage · Wikipedia · Open-Meteo · Ministerio de Industria · Los Viajes de Jesús";
export const SUGERENCIAS = ["Madrid", "Segovia", "Ourense", "Boceguillas", "Sepúlveda", "Tokio", "New York", "París"];

// Consumo medio (l/100 km) que se propone en el formulario
export const CONSUMO_DEFECTO = { vehiculo: 6.5, camper: 11 };

// Botón opcional "Ampliar con IA" (necesita GEMINI_API_KEY en Vercel). La app funciona sin él.
export const IA_OPCIONAL = true;

// Países de la UE (código ISO)
export const UE = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];
// Zona de "roaming como en casa": UE + Noruega, Islandia y Liechtenstein
export const ROAMING_UE = [...UE, "NO", "IS", "LI"];
// Espacio Schengen
export const SCHENGEN = [...UE.filter((c) => c !== "IE" && c !== "CY"), "NO", "IS", "LI", "CH"];

// País (ISO) → moneda
export const MONEDA = {
  AD: "EUR", AE: "AED", AF: "AFN", AL: "ALL", AM: "AMD", AO: "AOA", AR: "ARS", AT: "EUR", AU: "AUD",
  AZ: "AZN", BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "EUR", BH: "BHD", BJ: "XOF",
  BN: "BND", BO: "BOB", BR: "BRL", BS: "BSD", BT: "BTN", BW: "BWP", BY: "BYN", BZ: "BZD", CA: "CAD",
  CD: "CDF", CH: "CHF", CI: "XOF", CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP", CR: "CRC", CU: "CUP",
  CV: "CVE", CY: "EUR", CZ: "CZK", DE: "EUR", DJ: "DJF", DK: "DKK", DO: "DOP", DZ: "DZD", EC: "USD",
  EE: "EUR", EG: "EGP", ES: "EUR", ET: "ETB", FI: "EUR", FJ: "FJD", FR: "EUR", GB: "GBP", GE: "GEL",
  GH: "GHS", GR: "EUR", GT: "GTQ", GY: "GYD", HK: "HKD", HN: "HNL", HR: "EUR", HT: "HTG", HU: "HUF",
  ID: "IDR", IE: "EUR", IL: "ILS", IN: "INR", IQ: "IQD", IR: "IRR", IS: "ISK", IT: "EUR", JM: "JMD",
  JO: "JOD", JP: "JPY", KE: "KES", KG: "KGS", KH: "KHR", KR: "KRW", KW: "KWD", KZ: "KZT", LA: "LAK",
  LB: "LBP", LI: "CHF", LK: "LKR", LT: "EUR", LU: "EUR", LV: "EUR", MA: "MAD", MC: "EUR", MD: "MDL",
  ME: "EUR", MG: "MGA", MK: "MKD", MM: "MMK", MN: "MNT", MT: "EUR", MU: "MUR", MV: "MVR", MX: "MXN",
  MY: "MYR", MZ: "MZN", NA: "NAD", NG: "NGN", NI: "NIO", NL: "EUR", NO: "NOK", NP: "NPR", NZ: "NZD",
  OM: "OMR", PA: "PAB", PE: "PEN", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PT: "EUR", PY: "PYG",
  QA: "QAR", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF", SA: "SAR", SC: "SCR", SE: "SEK", SG: "SGD",
  SI: "EUR", SK: "EUR", SM: "EUR", SN: "XOF", SV: "USD", TH: "THB", TN: "TND", TR: "TRY", TT: "TTD",
  TW: "TWD", TZ: "TZS", UA: "UAH", UG: "UGX", US: "USD", UY: "UYU", UZ: "UZS", VA: "EUR", VE: "VES",
  VN: "VND", XK: "EUR", ZA: "ZAR", ZM: "ZMW", ZW: "ZWL",
};
