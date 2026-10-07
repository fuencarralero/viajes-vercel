import { WORKER_URL } from "./config.js";

export async function fetchTravelInfo({ destination, tab, fechas, origen, transporte, combustible, fueraCEE }) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, tab, fechas, origen, transporte, combustible, fueraCEE }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.text ?? "Sin respuesta.";
}
