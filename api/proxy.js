/**
 * Vercel Serverless Function — Proxy para Google Gemini API
 * Variable de entorno necesaria: GEMINI_API_KEY
 * Obtén tu key gratis en: https://aistudio.google.com/app/apikey
 */

const MODEL = "gemini-3.8-flash";

function getPrompt(tab, destination, fechas, origen, transporte, combustible) {
  const d = destination;
  const f = fechas ? ` para el período ${fechas}` : "";
  const o = origen ? ` desde ${origen}` : " desde España";

  switch (tab) {
    case "alojamiento":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre alojamiento en ${d}${f}. Responde en español con emojis y markdown (##, -, **negrita**). Sé preciso y veraz.
## Mejores zonas para alojarse
## Tipos de alojamiento y precios
(hoteles, hostels, apartamentos, casas rurales — rangos de precio por noche)
## Recomendaciones específicas
(nombres reales de establecimientos)
## Dónde reservar
Enlace Booking.com: https://www.booking.com/searchresults.es.html?ss=${d.replace(/ /g, "+")}
NO hables de visitas, gastronomía ni transporte.`;

    case "transporte_publico":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre cómo llegar a ${d}${o}${f} en transporte público. Responde en español con emojis y markdown.
## Opciones de tren
## Opciones de autobús
## Opciones de avión
## Opciones de barco/ferry (si aplica)
## Combinaciones recomendadas
## Consejos para reservar
NO hables de alojamiento ni gastronomía.`;

    case "transporte_camper":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre viaje en camper desde ${origen || "España"} hasta ${d}${f} con ${combustible || "diésel"}. Responde en español con emojis y markdown.
## Ruta recomendada
## Gasolineras en ruta → https://preciosgasolineras.es y https://www.dieselogasolina.com
## Servicios camper EN RUTA → https://park4night.com y https://www.campercontact.com/es
## Servicios camper EN DESTINO: ${d} → https://park4night.com/search?q=${d.replace(/ /g, "+")}
## Normas en ${d}
## Peajes y costes
NO hables de hoteles ni gastronomía.`;

    case "transporte_vehiculo":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre viaje en vehículo desde ${origen || "España"} hasta ${d}${f} con ${combustible || "gasolina"}. Responde en español con emojis y markdown.
## Ruta recomendada
## Gasolineras en ruta → https://preciosgasolineras.es y https://www.dieselogasolina.com
## Peajes
## Coste estimado del combustible
## Aparcamiento en ${d}
## Consejos de conducción
NO hables de alojamiento ni gastronomía.`;

    case "visitas":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre qué visitar en ${d}${f}. Responde en español con emojis y markdown.
MUY IMPORTANTE: Solo menciona lugares que REALMENTE EXISTEN en ${d}. No inventes monumentos ni lugares que no estén realmente ahí.
## Los 10 lugares imprescindibles
## Lugares menos conocidos
## Museos y centros culturales
## Patrimonio histórico y monumentos
## Rutas y paseos recomendados
## 🚌 Cómo llegar en transporte público a cada lugar
## Itinerario sugerido por días
NO hables de alojamiento ni gastronomía. NO inventes lugares.`;

    case "actividades":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre actividades en ${d}${f}. Responde en español con emojis y markdown.
## Actividades de naturaleza
## Actividades históricas y culturales
## Actividades de aventura
## Actividades familiares
## Eventos y festivales${f}
## Cómo y dónde reservar
NO hables de alojamiento ni transporte.`;

    case "gastronomia":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre gastronomía de ${d}${f}. Responde en español con emojis y markdown.
## Platos típicos imprescindibles
## Bebidas típicas locales
## Mejores restaurantes por presupuesto
## Mercados y street food
## Horarios y costumbres gastronómicas
## Productos locales para llevar
NO hables de alojamiento ni transporte.`;

    case "tiempo":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre el clima en ${d}${f}. Responde en español con emojis y markdown.
## Clima esperado${f}
## Precipitaciones
## Qué ropa llevar
## Fenómenos meteorológicos especiales
## Comparativa por meses
## Consejos según el tiempo
NO hables de alojamiento ni transporte.`;

    case "mareas":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre mareas y zonas costeras en ${d}${f}. Responde en español con emojis y markdown.
Si ${d} es zona costera: coeficientes típicos, playas reales, actividades, seguridad.
Si ${d} NO es zona costera: indícalo claramente y menciona zonas de agua cercanas reales.
NO hables de alojamiento ni transporte.`;

    case "esim":
      return `Eres un experto en telecomunicaciones y viajes. Habla ÚNICAMENTE sobre conectividad móvil y eSIM para viajar a ${d} desde España. Responde en español con emojis y markdown.
Solo menciona proveedores que realmente operen en ${d}.
## Por qué necesitas una eSIM
## 📊 Tabla comparativa de proveedores para ${d}
| Proveedor | Tipo | Datos | Precio aprox. | Validez | Llamadas | Enlace |
|-----------|------|-------|---------------|---------|----------|--------|
## 🏆 Mejor opción para ${d}
## 💳 Revolut eSIM → https://www.revolut.com/es-ES/esim/
## 📱 Yoigo → https://www.yoigo.com/movil/internacional
## 📡 Movistar → https://www.movistar.es/particulares/movil/servicios/roaming-internacional/
## 🟠 MásOrange → https://www.orange.es/particulares/movil/tarifas/roaming/
## 🔴 Vodafone → https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/roaming-y-viajes/
## 🔵 Digi → https://www.digimobil.es/tarifas/roaming
## 🌍 eSIMs independientes: Airalo, Holafly, Ubigi, Nomad, Maya
## 📶 Cobertura local en ${d}
## ⚙️ Cómo activar una eSIM
## 💡 Consejos de conectividad`;

    case "documentacion":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre documentación para viajar a ${d} desde España. Responde en español con emojis y markdown.
## Documentos necesarios
## Visado (si necesario: proceso, coste, tiempo)
## Salud y vacunas
## Seguro de viaje
## Aduana
## Moneda y dinero
NO hables de alojamiento ni actividades.`;

    case "enlaces":
      return `Eres un experto en viajes. Lista recursos web reales para ${d}. Responde en español con emojis y markdown.
## Web oficial de turismo de ${d}
## Entradas y reservas
## Transporte público local
## Apps imprescindibles
## Tours y actividades
## Mapas y navegación
## Otros recursos útiles`;

    case "consejos":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre consejos prácticos para ${d}${f}${o}. Responde en español con emojis y markdown.
## Seguridad
## Transporte local
## Idioma y frases útiles
## Costumbres y etiqueta
## Estafas comunes
## Presupuesto diario (económico / medio / alto en euros)
## Consejos específicos${f}
NO hables de alojamiento ni gastronomía.`;

    default:
      return `Información general sobre ${d}. Responde en español con emojis y markdown.`;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY no configurada en Vercel" });

  try {
    const { destination, tab, fechas, origen, transporte, combustible, fueraCEE } = req.body;
    if (!destination || !tab) return res.status(400).json({ error: "Faltan parámetros" });

    const prompt = getPrompt(tab, destination, fechas, origen, transporte, combustible, fueraCEE);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? data.error?.message
      ?? JSON.stringify(data);

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Error interno", detail: err.message });
  }
}
