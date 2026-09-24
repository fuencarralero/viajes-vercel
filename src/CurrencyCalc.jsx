import { useState, useEffect } from "react";

// Mapa de destinos/países a código de moneda ISO 4217
const CURRENCY_MAP = {
  // Asia
  "japon": "JPY", "tokio": "JPY", "osaka": "JPY", "kioto": "JPY", "kyoto": "JPY",
  "china": "CNY", "pekin": "CNY", "shanghai": "CNY", "beijing": "CNY",
  "corea": "KRW", "seul": "KRW", "seoul": "KRW",
  "tailandia": "THB", "bangkok": "THB", "phuket": "THB",
  "vietnam": "VND", "hanoi": "VND", "ho chi minh": "VND",
  "indonesia": "IDR", "bali": "IDR", "yakarta": "IDR",
  "india": "INR", "nueva delhi": "INR", "mumbai": "INR", "delhi": "INR",
  "singapur": "SGD",
  "hong kong": "HKD",
  "taiwan": "TWD", "taipei": "TWD",
  "malasia": "MYR", "kuala lumpur": "MYR",
  "filipinas": "PHP", "manila": "PHP",
  "nepal": "NPR", "katmandu": "NPR",
  "sri lanka": "LKR", "colombo": "LKR",
  "cambodia": "KHR", "camboya": "KHR", "siem reap": "KHR",
  "myanmar": "MMK", "birmania": "MMK", "yangon": "MMK",
  "laos": "LAK", "vientian": "LAK",
  "bangladesh": "BDT", "dhaka": "BDT",
  "pakistan": "PKR", "karachi": "PKR", "islamabad": "PKR",
  "uzbekistan": "UZS", "tashkent": "UZS", "samarcanda": "UZS",
  // América
  "estados unidos": "USD", "new york": "USD", "nueva york": "USD", "usa": "USD",
  "los angeles": "USD", "miami": "USD", "chicago": "USD", "las vegas": "USD",
  "canada": "CAD", "toronto": "CAD", "vancouver": "CAD", "montreal": "CAD",
  "mexico": "MXN", "ciudad de mexico": "MXN", "cancun": "MXN",
  "brasil": "BRL", "rio de janeiro": "BRL", "sao paulo": "BRL",
  "argentina": "ARS", "buenos aires": "ARS",
  "colombia": "COP", "bogota": "COP", "cartagena": "COP",
  "peru": "PEN", "lima": "PEN", "cusco": "PEN",
  "chile": "CLP", "santiago": "CLP",
  "uruguay": "UYU", "montevideo": "UYU",
  "paraguay": "PYG", "asuncion": "PYG",
  "bolivia": "BOB", "la paz": "BOB",
  "ecuador": "USD", "quito": "USD", "galapagos": "USD",
  "venezuela": "VES", "caracas": "VES",
  "cuba": "CUP", "la habana": "CUP", "habana": "CUP",
  "costa rica": "CRC", "san jose": "CRC",
  "panama": "PAB",
  "republica dominicana": "DOP", "punta cana": "DOP",
  "jamaica": "JMD", "kingston": "JMD",
  "guatemala": "GTQ", "antigua": "GTQ",
  "honduras": "HNL", "tegucigalpa": "HNL",
  "nicaragua": "NIO", "managua": "NIO",
  "el salvador": "USD",
  // África
  "marruecos": "MAD", "marrakech": "MAD", "casablanca": "MAD", "fez": "MAD",
  "egipto": "EGP", "cairo": "EGP", "luxor": "EGP", "hurghada": "EGP",
  "sudafrica": "ZAR", "ciudad del cabo": "ZAR", "johannesburgo": "ZAR",
  "kenia": "KES", "nairobi": "KES", "mombasa": "KES",
  "tanzania": "TZS", "zanzibar": "TZS", "dar es salaam": "TZS",
  "etiopía": "ETB", "etiopia": "ETB", "addis abeba": "ETB",
  "ghana": "GHS", "accra": "GHS",
  "nigeria": "NGN", "lagos": "NGN",
  "senegal": "XOF", "dakar": "XOF",
  "costa de marfil": "XOF", "abidjan": "XOF",
  "mozambique": "MZN", "maputo": "MZN",
  "namibia": "NAD", "windhoek": "NAD",
  "botswana": "BWP", "gaborone": "BWP",
  "zimbabue": "ZWL", "harare": "ZWL",
  "uganda": "UGX", "kampala": "UGX",
  "ruanda": "RWF", "kigali": "RWF",
  "tunez": "TND", "túnez": "TND",
  "argelia": "DZD", "argel": "DZD",
  "libia": "LYD", "tripoli": "LYD",
  // Oriente Medio
  "emiratos": "AED", "dubai": "AED", "abu dhabi": "AED",
  "arabia saudi": "SAR", "riad": "SAR", "meca": "SAR",
  "qatar": "QAR", "doha": "QAR",
  "israel": "ILS", "tel aviv": "ILS", "jerusalen": "ILS",
  "jordania": "JOD", "amman": "JOD", "petra": "JOD",
  "turquia": "TRY", "estambul": "TRY", "capadocia": "TRY", "ankara": "TRY",
  "iran": "IRR", "teheran": "IRR",
  "iraq": "IQD", "bagdad": "IQD",
  "libano": "LBP", "beirut": "LBP",
  "kuwait": "KWD", "ciudad de kuwait": "KWD",
  "bahrein": "BHD", "manama": "BHD",
  "oman": "OMR", "muscat": "OMR",
  // Oceanía
  "australia": "AUD", "sydney": "AUD", "melbourne": "AUD", "brisbane": "AUD",
  "nueva zelanda": "NZD", "auckland": "NZD", "wellington": "NZD",
  "fiji": "FJD", "suva": "FJD",
  // Europa no euro
  "reino unido": "GBP", "londres": "GBP", "escocia": "GBP", "gales": "GBP",
  "suiza": "CHF", "ginebra": "CHF", "zurich": "CHF", "berna": "CHF",
  "noruega": "NOK", "oslo": "NOK",
  "suecia": "SEK", "estocolmo": "SEK",
  "dinamarca": "DKK", "copenhague": "DKK",
  "islandia": "ISK", "reykjavik": "ISK",
  "serbia": "RSD", "belgrado": "RSD",
  "albania": "ALL", "tirana": "ALL",
  "georgia": "GEL", "tiflis": "GEL",
  "armenia": "AMD", "yerevan": "AMD",
  "azerbaiyan": "AZN", "baku": "AZN",
  "ucrania": "UAH", "kiev": "UAH",
  "rusia": "RUB", "moscu": "RUB", "san petersburgo": "RUB",
  "bielorrusia": "BYN", "minsk": "BYN",
  "moldavia": "MDL", "chisinau": "MDL",
  "bosnia": "BAM", "sarajevo": "BAM",
  "macedonia": "MKD", "skopie": "MKD",
  "kosovo": "EUR",
  "montenegro": "EUR",
  // Destinos con euro (no mostrar calculadora)
  "zona euro": "EUR",
};

const CURRENCY_NAMES = {
  JPY: "Yen japonés", CNY: "Yuan chino", KRW: "Won surcoreano",
  THB: "Baht tailandés", VND: "Dong vietnamita", IDR: "Rupia indonesia",
  INR: "Rupia india", SGD: "Dólar de Singapur", HKD: "Dólar de Hong Kong",
  TWD: "Nuevo dólar taiwanés", MYR: "Ringgit malayo", PHP: "Peso filipino",
  USD: "Dólar estadounidense", CAD: "Dólar canadiense", MXN: "Peso mexicano",
  BRL: "Real brasileño", ARS: "Peso argentino", COP: "Peso colombiano",
  PEN: "Sol peruano", CLP: "Peso chileno", UYU: "Peso uruguayo",
  CUP: "Peso cubano", MAD: "Dírham marroquí", EGP: "Libra egipcia",
  ZAR: "Rand sudafricano", KES: "Chelín keniano", TZS: "Chelín tanzano",
  AED: "Dírham emiratí", SAR: "Riyal saudí", QAR: "Riyal catarí",
  ILS: "Séquel israelí", JOD: "Dinar jordano", TRY: "Lira turca",
  AUD: "Dólar australiano", NZD: "Dólar neozelandés",
  GBP: "Libra esterlina", CHF: "Franco suizo", NOK: "Corona noruega",
  SEK: "Corona sueca", DKK: "Corona danesa", ISK: "Corona islandesa",
  RUB: "Rublo ruso", ALL: "Lek albanés", RSD: "Dinar serbio",
  GEL: "Lari georgiano", UAH: "Grivna ucraniana",
  NPR: "Rupia nepalesa", LKR: "Rupia de Sri Lanka",
  DOP: "Peso dominicano", GTQ: "Quetzal guatemalteco",
  KWD: "Dinar kuwaití", OMR: "Rial omaní", BHD: "Dinar bareiní",
  NGN: "Naira nigeriana", GHS: "Cedi ghanés",
  ETB: "Birr etíope", XOF: "Franco CFA",
  UZS: "Som uzbeko", PKR: "Rupia pakistaní",
};

export function getCurrencyForDestination(destination) {
  if (!destination) return null;
  const d = destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, currency] of Object.entries(CURRENCY_MAP)) {
    const k = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (d.includes(k) || k.includes(d)) {
      return currency === "EUR" ? null : currency;
    }
  }
  return null; // null = no mostrar calculadora (moneda desconocida o euro)
}

export default function CurrencyCalc({ destination, currency }) {
  const [rate, setRate]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [amount, setAmount]   = useState("");
  const [direction, setDirection] = useState("EUR_TO_DEST"); // EUR→destino o destino→EUR

  const currencyName = CURRENCY_NAMES[currency] || currency;

  useEffect(() => {
    if (!currency) return;
    setLoading(true);
    setError("");
    // Usamos la API gratuita de exchangerate-api (open.er-api.com)
    fetch(`https://open.er-api.com/v6/latest/EUR`)
      .then(r => r.json())
      .then(data => {
        if (data.rates && data.rates[currency]) {
          setRate(data.rates[currency]);
        } else {
          setError("No se pudo obtener el tipo de cambio.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error al conectar con el servicio de tipos de cambio.");
        setLoading(false);
      });
  }, [currency]);

  const convert = () => {
    if (!rate || !amount) return "";
    const num = parseFloat(amount.replace(",", "."));
    if (isNaN(num)) return "";
    if (direction === "EUR_TO_DEST") {
      return (num * rate).toLocaleString("es-ES", { maximumFractionDigits: 2 });
    } else {
      return (num / rate).toLocaleString("es-ES", { maximumFractionDigits: 2 });
    }
  };

  const result = convert();

  const inp = {
    padding: "12px 16px", borderRadius: 12, border: "2px solid rgba(193,127,80,.3)",
    background: "white", fontSize: "1.1em", color: "#2d1a0e", outline: "none",
    fontFamily: "Georgia,serif", width: "100%",
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.15em", fontWeight: 800, color: "#c17f50", marginBottom: "1em", fontFamily: "'Playfair Display',serif", borderBottom: "1px solid #e8c9a033", paddingBottom: 4 }}>
        💱 Calculadora de cambio de divisa
      </h2>

      {loading ? (
        <p style={{ color: "#8b6545" }}>⏳ Obteniendo tipo de cambio actualizado…</p>
      ) : error ? (
        <p style={{ color: "#c0392b" }}>{error}</p>
      ) : (
        <div>
          {/* Tipo de cambio actual */}
          <div style={{ background: "rgba(193,127,80,.08)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid rgba(193,127,80,.2)" }}>
            <p style={{ color: "#4a3728", fontSize: "0.9em", marginBottom: 4 }}>
              💹 <strong>Tipo de cambio actual</strong>
            </p>
            <p style={{ fontSize: "1.3em", fontWeight: 700, color: "#c17f50" }}>
              1 EUR = {rate?.toLocaleString("es-ES", { maximumFractionDigits: 4 })} {currency}
            </p>
            <p style={{ fontSize: "0.82em", color: "#8b6545", marginTop: 4 }}>
              {currencyName} · Actualizado hoy vía open.er-api.com
            </p>
          </div>

          {/* Dirección del cambio */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { id: "EUR_TO_DEST", label: `€ EUR → ${currency}` },
              { id: "DEST_TO_EUR", label: `${currency} → € EUR` },
            ].map(d => (
              <button key={d.id} onClick={() => { setDirection(d.id); setAmount(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${direction === d.id ? "#c17f50" : "rgba(193,127,80,.3)"}`, background: direction === d.id ? "linear-gradient(135deg,#c17f50,#e8a87c)" : "white", color: direction === d.id ? "white" : "#4a3728", fontWeight: 700, fontSize: "0.85em", cursor: "pointer", fontFamily: "Georgia,serif" }}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#4a3728", fontWeight: 700, marginBottom: 8, fontSize: "0.85em", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {direction === "EUR_TO_DEST" ? "Cantidad en euros (€)" : `Cantidad en ${currency}`}
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={inp}
              onFocus={e => (e.target.style.borderColor = "#c17f50")}
              onBlur={e => (e.target.style.borderColor = "rgba(193,127,80,.3)")}
            />
          </div>

          {/* Resultado */}
          {result && (
            <div style={{ background: "linear-gradient(135deg,rgba(193,127,80,.12),rgba(232,168,124,.08))", borderRadius: 14, padding: "18px 22px", border: "1.5px solid rgba(193,127,80,.3)", textAlign: "center" }}>
              <p style={{ color: "#8b6545", fontSize: "0.85em", marginBottom: 6 }}>
                {direction === "EUR_TO_DEST" ? `${amount} € equivale a` : `${amount} ${currency} equivale a`}
              </p>
              <p style={{ fontSize: "2em", fontWeight: 900, color: "#c17f50", fontFamily: "'Playfair Display',serif" }}>
                {direction === "EUR_TO_DEST"
                  ? `${result} ${currency}`
                  : `${result} €`}
              </p>
              <p style={{ fontSize: "0.78em", color: "#b09070", marginTop: 6 }}>
                {currencyName}
              </p>
            </div>
          )}

          {/* Tabla de referencia rápida */}
          {rate && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontWeight: 700, color: "#4a3728", marginBottom: 10, fontSize: "0.88em" }}>
                📊 Tabla de referencia rápida (€ → {currency})
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[1, 5, 10, 20, 50, 100, 200, 500].map(eur => (
                  <div key={eur} style={{ background: "rgba(255,255,255,.8)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(193,127,80,.2)", textAlign: "center", cursor: "pointer" }}
                    onClick={() => { setDirection("EUR_TO_DEST"); setAmount(String(eur)); }}>
                    <div style={{ fontSize: "0.78em", color: "#8b6545" }}>{eur} €</div>
                    <div style={{ fontSize: "0.85em", fontWeight: 700, color: "#c17f50" }}>
                      {(eur * rate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} {currency}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.75em", color: "#b09070", marginTop: 10, textAlign: "center" }}>
                Pulsa cualquier valor para usarlo en la calculadora · Tipos orientativos, pueden variar
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
