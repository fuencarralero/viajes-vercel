# Asistente de Viajes TA (datos abiertos, sin depender de IA)

Fuentes: OpenStreetMap (Nominatim + Overpass), Wikivoyage/Wikipedia, Open-Meteo (tiempo y mareas),
OSRM (rutas), Ministerio para la Transición Ecológica (gasolineras, vía api/gasolineras.js),
ExchangeRate-API (divisas). El botón «Ampliar con IA» (api/ia.js) es opcional.

## Subir a GitHub
1. Descomprime el ZIP. Entra en la carpeta `viajes-open`.
2. En tu repositorio de GitHub: Add file → Upload files.
3. Arrastra TODO lo que hay DENTRO de la carpeta (incluidas las carpetas src, api y public).
4. Comprueba que en la raíz del repositorio se ven: api, public, src, index.html, package.json,
   vercel.json y vite.config.js. Commit changes.

## Vercel
- Se redespliega solo al hacer commit. No hace falta tocar Framework ni comandos (los fija vercel.json).
- Variable opcional: GEMINI_API_KEY (solo para el botón de IA).

## Ajustes rápidos (src/config.js)
Título, subtítulo, ciudades sugeridas, consumo por defecto y IA_OPCIONAL = false para quitar el botón.
