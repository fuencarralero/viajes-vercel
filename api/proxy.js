/**
 * Vercel Serverless Function — Proxy para OpenRouter API
 * Variable de entorno: OPENROUTER_API_KEY
 * (configúrala en Vercel → Settings → Environment Variables)
 */

const MODEL = "openrouter/free";

function getPrompt(tab, destination, fechas, origen, transporte, combustible) {
  const d = destination;
  const f = fechas ? ` para el período ${fechas}` : "";
  const o = origen ? ` desde ${origen}` : " desde España";

  switch (tab) {
    case "alojamiento":
      return `Habla ÚNICAMENTE sobre alojamiento en ${d}${f}. Responde en español con emojis y markdown (##, -, **negrita**).
## Mejores zonas para alojarse
## Tipos de alojamiento y precios
(hoteles, hostels, apartamentos, casas rurales — rangos de precio por noche)
## Recomendaciones específicas
(nombres reales de establecimientos)
## Dónde reservar
Enlace Booking.com: https://www.booking.com/searchresults.es.html?ss=${d.replace(/ /g, "+")}
NO hables de visitas, gastronomía ni transporte.`;

    case "transporte_publico":
      return `Habla ÚNICAMENTE sobre cómo llegar a ${d}${o}${f} en transporte público. Responde en español con emojis y markdown.
## Opciones de tren
(compañías, duración, precio aproximado, URL donde comprar)
## Opciones de autobús
## Opciones de avión
(aeropuertos, aerolíneas, precio, dónde buscar vuelos)
## Opciones de barco/ferry (si aplica)
## Combinaciones recomendadas
## Consejos para reservar
NO hables de alojamiento ni gastronomía.`;

    case "transporte_camper":
      return `Habla ÚNICAMENTE sobre viaje en camper desde ${origen || "España"} hasta ${d}${f} con combustible ${combustible || "diésel"}. Responde en español con emojis y markdown.
## Ruta recomendada
(carreteras principales, distancia total, tiempo estimado)
## Gasolineras en ruta
Consulta precios en: https://preciosgasolineras.es y https://www.dieselogasolina.com
## Servicios para camper EN RUTA
(áreas con vaciado aguas grises/negras, agua potable, electricidad)
Webs: https://park4night.com y https://www.campercontact.com/es
## Servicios para camper EN DESTINO: ${d}
(áreas de acampada, parkings, campings — nombres, ubicación y precio por noche)
- https://park4night.com/search?q=${d.replace(/ /g, "+")}
- https://www.campercontact.com/es/country/search?q=${d.replace(/ /g, "+")}
## Normas y regulaciones en ${d}
## Peajes y costes estimados
NO hables de hoteles ni gastronomía.`;

    case "transporte_vehiculo":
      return `Habla ÚNICAMENTE sobre viaje en vehículo desde ${origen || "España"} hasta ${d}${f} con ${combustible || "gasolina"}. Responde en español con emojis y markdown.
## Ruta recomendada
## Gasolineras en ruta
Consulta precios en: https://preciosgasolineras.es y https://www.dieselogasolina.com
## Peajes
## Coste estimado del combustible
## Aparcamiento en ${d}
## Consejos de conducción
NO hables de alojamiento ni gastronomía.`;

    case "visitas":
      return `Habla ÚNICAMENTE sobre qué visitar en ${d}${f}. Responde en español con emojis y markdown.
## Los 10 lugares imprescindibles
(descripción, horarios y precio de entrada de cada uno)
## Lugares menos conocidos
## Museos y centros culturales
## Monumentos y patrimonio histórico
## Rutas y paseos recomendados
## 🚌 Cómo llegar en transporte público
OBLIGATORIO: Para cada lugar indica línea de bus/metro/tranvía, parada más cercana y tiempo desde el centro.
## Itinerario sugerido por días
NO hables de alojamiento ni gastronomía.`;

    case "actividades":
      return `Habla ÚNICAMENTE sobre actividades en ${d}${f}. Responde en español con emojis y markdown.
## Actividades de naturaleza
## Actividades históricas y culturales
## Actividades de aventura
## Actividades familiares
## Eventos y festivales${f}
## Cómo y dónde reservar
NO hables de alojamiento ni transporte.`;

    case "gastronomia":
      return `Habla ÚNICAMENTE sobre gastronomía de ${d}${f}. Responde en español con emojis y markdown.
## Platos típicos imprescindibles
## Bebidas típicas locales
## Mejores restaurantes por presupuesto
## Mercados y street food
## Horarios y costumbres gastronómicas
## Productos locales para llevar
NO hables de alojamiento ni transporte.`;

    case "tiempo":
      return `Habla ÚNICAMENTE sobre el clima en ${d}${f}. Responde en español con emojis y markdown.
## Clima esperado${f}
## Precipitaciones
## Qué ropa llevar
## Fenómenos meteorológicos especiales
## Comparativa por meses
## Consejos según el tiempo
NO hables de alojamiento ni transporte.`;

    case "mareas":
      return `Habla ÚNICAMENTE sobre mareas y zonas costeras en ${d}${f}. Responde en español con emojis y markdown.
Si es zona costera: coeficientes, playas, actividades, seguridad.
Si NO es costera: zonas de agua más cercanas con distancia.
NO hables de alojamiento ni transporte.`;

    case "esim":
      return `Habla ÚNICAMENTE sobre conectividad móvil y eSIM para viajar a ${d} desde España. Responde en español con emojis y markdown.
IMPORTANTE: Solo menciona proveedores que realmente operen en ${d}. Omite los que no tengan cobertura allí.

## Por qué necesitas una eSIM o tarifa internacional
(cargos por roaming fuera de la CEE)

## 📊 Tabla comparativa de proveedores para ${d}
| Proveedor | Tipo | Datos | Precio aprox. | Validez | Llamadas | Enlace |
|-----------|------|-------|---------------|---------|----------|--------|
(incluye SOLO los que operan en ${d}: Revolut eSIM, Yoigo Travel, Movistar, MásOrange, Vodafone, Digi, Airalo, Holafly, Ubigi, Nomad, Maya)

## 🏆 Mejor opción para ${d}
(recomienda el más conveniente — justifica brevemente)

## 💳 Revolut eSIM (si opera en ${d})
App Revolut → "eSIM" → planes Plus/Premium/Metal/Ultra → https://www.revolut.com/es-ES/esim/

## 📱 Yoigo Travel (si opera en ${d})
https://www.yoigo.com/movil/internacional

## 📡 Movistar Internacional (si opera en ${d})
https://www.movistar.es/particulares/movil/servicios/roaming-internacional/

## 🟠 MásOrange / Orange (si opera en ${d})
Orange: https://www.orange.es/particulares/movil/tarifas/roaming/
MásMóvil: https://www.masmovil.es/movil/roaming/

## 🔴 Vodafone Roaming Pass (si opera en ${d})
https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/roaming-y-viajes/

## 🔵 Digi Roaming (si opera en ${d})
https://www.digimobil.es/tarifas/roaming

## 🌍 eSIMs independientes (las que operan en ${d})
Airalo: https://www.airalo.com
Holafly: https://holafly.com/es
Ubigi: https://cellulardata.ubigi.com/es
Nomad: https://www.getnomad.app
Maya: https://maya.net/es

## 📶 Cobertura local en ${d}
(operadores locales con mejor cobertura 4G/5G y dónde comprar SIM local)

## ⚙️ Cómo activar una eSIM paso a paso

## 💡 Consejos de conectividad
NO hables de alojamiento ni gastronomía.`;

    case "documentacion":
      return `Habla ÚNICAMENTE sobre documentación para viajar a ${d} desde España. Responde en español con emojis y markdown.
## Documentos necesarios
## Visado (si es necesario: proceso, coste, tiempo)
## Salud y vacunas
## Seguro de viaje
## Aduana
## Moneda y dinero
NO hables de alojamiento ni actividades.`;

    case "enlaces":
      return `Lista ÚNICAMENTE recursos web para ${d} con URLs reales. Responde en español con emojis y markdown.
## Web oficial de turismo
## Entradas y reservas de monumentos
## Transporte público local
## Apps imprescindibles
## Tours y actividades
## Mapas y navegación
## Otros recursos útiles`;

    case "consejos":
      return `Habla ÚNICAMENTE sobre consejos prácticos para ${d}${f}${o}. Responde en español con emojis y markdown.
## Seguridad
## Transporte local
## Idioma (palabras y frases útiles)
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
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY no configurada" });

  try {
    const { destination, tab, fechas, origen, transporte, combustible, fueraCEE } = req.body;
    if (!destination || !tab) return res.status(400).json({ error: "Faltan parámetros" });

    const prompt = getPrompt(tab, destination, fechas, origen, transporte, combustible, fueraCEE);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://viajes-ta.vercel.app",
        "X-Title": "Asistente de Viajes TA",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content
      ?? data.error?.message
      ?? JSON.stringify(data);

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Error interno", detail: err.message });
  }
}
