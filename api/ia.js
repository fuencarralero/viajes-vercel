/**
 * OPCIONAL: complemento con IA (Gemini). La app funciona sin esto.
 * Variable de entorno: GEMINI_API_KEY (aistudio.google.com/app/apikey)
 */
const PRIMARY = "gemini-2.5-flash-lite";
const FALLBACK = "gemini-3.8-flash";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(key, model, prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 4096 } }),
  });
  return r.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "La IA opcional no está configurada (falta GEMINI_API_KEY)." });
  try {
    const { destination, tab, label, fechas, origen } = req.body || {};
    if (!destination || !tab) return res.status(400).json({ error: "Faltan datos" });
    const prompt = `Eres un asistente de viajes. Complementa en español, con markdown breve (## y listas con -), el apartado «${label || tab}» de un viaje a ${destination}${fechas ? ` (${fechas})` : ""}${origen ? ` desde ${origen}` : ""}. Incluye SOLO datos que conozcas con certeza y que existan realmente; si no estás seguro de algo, dilo claramente. No inventes lugares, horarios ni precios. Máximo 250 palabras.`;
    for (const model of [PRIMARY, PRIMARY, FALLBACK]) {
      const j = await ask(key, model, prompt);
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.status(200).json({ text });
      await sleep(2500);
    }
    res.status(503).json({ error: "La IA no está disponible ahora mismo. La app sigue funcionando con datos abiertos." });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
