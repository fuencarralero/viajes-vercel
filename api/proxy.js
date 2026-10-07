/**
 * Vercel Serverless Function — Proxy para OpenRouter API
 * Variable de entorno necesaria: OPENROUTER_API_KEY
 */

const MODEL = "google/gemini-2.0-flash-exp:free";

function getPrompt(tab, destination, fechas, origen, transporte, combustible) {
  const d = destination;
  const f = fechas ? ` para el período ${fechas}` : "";
  const o = origen ? ` desde ${origen}` : " desde España";

  switch (tab) {
    case "alojamiento":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre alojamiento en ${d}${f}. Responde en español con emojis y markdown (##, -, **negrita**). Sé preciso y veraz, no inventes lugares que no existen.
## Mejores zonas para alojarse
## Tipos de alojamiento y precios
(hoteles, hostels, apartamentos, casas rurales — rangos de precio por noche)
## Recomendaciones específicas
(nombres reales de establecimientos que existen)
## Dónde reservar
Enlace Booking.com: https://www.booking.com/searchresults.es.html?ss=${d.replace(/ /g, "+")}
NO hables de visitas, gastronomía ni transporte.`;

    case "transporte_publico":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre cómo llegar a ${d}${o}${f} en transporte público. Responde en español con emojis y markdown. Sé preciso y veraz.
## Opciones de tren
(compañías reales, duración, precio aproximado, URL donde comprar)
## Opciones de autobús
## Opciones de avión
(aeropuertos reales, aerolíneas, precio, dónde buscar vuelos)
## Opciones de barco/ferry (si aplica geográficamente)
## Combinaciones recomendadas
## Consejos para reservar
NO hables de alojamiento ni gastronomía.`;

    case "transporte_camper":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre viaje en camper desde ${origen || "España"} hasta ${d}${f} con combustible ${combustible || "diésel"}. Responde en español con emojis y markdown. Sé preciso y veraz.
## Ruta recomendada
(carreteras principales reales, distancia total, tiempo estimado)
## Gasolineras en ruta
Consulta precios en: https://preciosgasolineras.es y https://www.dieselogasolina.com
## Servicios para camper EN RUTA
(áreas con vaciado aguas grises/negras, agua potable, electricidad — nombres reales si los conoces)
Webs para encontrar servicios: https://park4night.com y https://www.campercontact.com/es
## Servicios para camper EN DESTINO: ${d}
(áreas de acampada, parkings, campings reales — nombres, ubicación y precio por noche)
- https://park4night.com/search?q=${d.replace(/ /g, "+")}
- https://www.campercontact.com/es/country/search?q=${d.replace(/ /g, "+")}
## Normas y regulaciones en ${d}
(acampada libre permitida o no, zonas restringidas, normativa local)
## Peajes y costes estimados
NO hables de hoteles ni gastronomía.`;

    case "transporte_vehiculo":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre viaje en vehículo desde ${origen || "España"} hasta ${d}${f} con ${combustible || "gasolina"}. Responde en español con emojis y markdown. Sé preciso y veraz.
## Ruta recomendada
(carreteras reales, distancia, tiempo estimado)
## Gasolineras en ruta
Consulta precios en: https://preciosgasolineras.es y https://www.dieselogasolina.com
## Peajes
(autopistas de peaje reales, coste aproximado, alternativas gratuitas)
## Coste estimado del combustible
## Aparcamiento en ${d}
## Consejos de conducción
NO hables de alojamiento ni gastronomía.`;

    case "visitas":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre qué visitar en ${d}${f}. Responde en español con emojis y markdown.
MUY IMPORTANTE: Solo menciona lugares que REALMENTE EXISTEN en ${d}. No inventes monumentos, castillos, murallas ni ningún lugar que no esté realmente en ${d}. Si no conoces bien ${d}, sé honesto y di solo lo que sabes con certeza.
## Los 10 lugares imprescindibles
(solo lugares que realmente existen en ${d}, con descripción real, horarios y precio de entrada)
## Lugares menos conocidos
(joyas ocultas reales de ${d})
## Museos y centros culturales
(solo los que realmente existen en ${d})
## Patrimonio histórico y monumentos
(solo los que realmente están en ${d})
## Rutas y paseos recomendados
## 🚌 Cómo llegar en transporte público
(líneas de bus reales, paradas concretas para los principales puntos de interés en ${d})
## Itinerario sugerido por días
NO hables de alojamiento ni gastronomía. NO inventes lugares que no existen.`;

    case "actividades":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre actividades en ${d}${f}. Responde en español con emojis y markdown. Solo menciona actividades que realmente se pueden hacer en ${d}.
## Actividades de naturaleza
(rutas, parques, espacios naturales reales de ${d})
## Actividades históricas y culturales
## Actividades de aventura
## Actividades familiares
## Eventos y festivales${f}
## Cómo y dónde reservar
NO hables de alojamiento ni transporte.`;

    case "gastronomia":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre gastronomía de ${d}${f}. Responde en español con emojis y markdown. Sé preciso sobre la gastronomía real y típica de ${d}.
## Platos típicos imprescindibles
(gastronomía real y tradicional de ${d})
## Bebidas típicas locales
## Mejores restaurantes por presupuesto
(nombres reales de restaurantes en ${d})
## Mercados y street food
## Horarios y costumbres gastronómicas
## Productos locales para llevar
NO hables de alojamiento ni transporte.`;

    case "tiempo":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre el clima en ${d}${f}. Responde en español con emojis y markdown. Usa datos climáticos reales de ${d}.
## Clima esperado${f}
(temperaturas reales mín/máx)
## Precipitaciones
## Qué ropa llevar
## Fenómenos meteorológicos especiales
## Comparativa por meses
## Consejos según el tiempo
NO hables de alojamiento ni transporte.`;

    case "mareas":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre mareas y zonas costeras en ${d}${f}. Responde en español con emojis y markdown. Sé geográficamente preciso.
Si ${d} es zona costera: coeficientes típicos, playas reales, actividades, seguridad.
Si ${d} NO es zona costera: indica claramente que no es zona costera y menciona las zonas de agua más cercanas reales (ríos, embalses, playas fluviales, costa más próxima con distancia real).
NO hables de alojamiento ni transporte.`;

    case "esim":
      return `Eres un experto en telecomunicaciones y viajes. Habla ÚNICAMENTE sobre conectividad móvil y eSIM para viajar a ${d} desde España. Responde en español con emojis y markdown.
IMPORTANTE: Solo menciona proveedores que realmente operen en ${d}. Omite los que no tengan cobertura allí.
## Por qué necesitas una eSIM
(cargos por roaming fuera de la CEE)
## 📊 Tabla comparativa de proveedores para ${d}
| Proveedor | Tipo | Datos | Precio aprox. | Validez | Llamadas | Enlace |
|-----------|------|-------|---------------|---------|----------|--------|
(incluye SOLO los que operan en ${d}: Revolut, Yoigo, Movistar, MásOrange, Vodafone, Digi, Airalo, Holafly, Ubigi, Nomad, Maya)
## 🏆 Mejor opción para ${d}
## 💳 Revolut eSIM → https://www.revolut.com/es-ES/esim/
## 📱 Yoigo Travel → https://www.yoigo.com/movil/internacional
## 📡 Movistar → https://www.movistar.es/particulares/movil/servicios/roaming-internacional/
## 🟠 MásOrange → https://www.orange.es/particulares/movil/tarifas/roaming/
## 🔴 Vodafone → https://www.vodafone.es/c/particulares/es/productos-y-servicios/movil/roaming-y-viajes/
## 🔵 Digi → https://www.digimobil.es/tarifas/roaming
## 🌍 eSIMs independientes (Airalo, Holafly, Ubigi, Nomad, Maya)
## 📶 Cobertura local en ${d}
## ⚙️ Cómo activar una eSIM paso a paso
## 💡 Consejos de conectividad
NO hables de alojamiento ni gastronomía.`;

    case "documentacion":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre documentación para viajar a ${d} desde España. Responde en español con emojis y markdown. Sé preciso con los requisitos reales actuales.
## Documentos necesarios
(requisitos reales para ciudadanos españoles en ${d})
## Visado (si es necesario: proceso real, coste, tiempo)
## Salud y vacunas
## Seguro de viaje
## Aduana
## Moneda y dinero
NO hables de alojamiento ni actividades.`;

    case "enlaces":
      return `Eres un experto en viajes. Lista ÚNICAMENTE recursos web reales y funcionando para ${d}. Responde en español con emojis y markdown. Solo incluye URLs que realmente existan.
## Web oficial de turismo de ${d}
## Entradas y reservas de monumentos
## Transporte público local
## Apps imprescindibles
## Tours y actividades
## Mapas y navegación
## Otros recursos útiles`;

    case "consejos":
      return `Eres un experto en viajes. Habla ÚNICAMENTE sobre consejos prácticos para ${d}${f}${o}. Responde en español con emojis y markdown. Sé preciso y veraz sobre ${d}.
## Seguridad
## Transporte local
## Idioma (palabras y frases útiles)
## Costumbres y etiqueta
## Estafas comunes
## Presupuesto diario (económico / medio / alto en euros)
## Consejos específicos${f}
NO hables de alojamiento ni gastronomía.`;

    default:
      return `Información general y veraz sobre ${d}. Responde en español con emojis y markdown.`;
  }
}

export default async function handler(req, res) {
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
        "HTTP-Referer": "https://asistentedeviajes.vercel.app",
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
