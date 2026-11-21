import React, { useState } from "react";
import { C, H2, H3, P, Ext, Pill, Note, Card, Src, Stale, Lines, Table } from "./ui.jsx";
import { sec, ALIAS, WMO } from "./services.js";
import { SCHENGEN, UE } from "./config.js";

const enc = encodeURIComponent;
const fmt = (n, d = 0) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: d });
const gmap = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
const dia = (t) => new Date(t + "T12:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
const WV = ({ d }) => (d && d.url ? <Src><Ext href={d.url}>Wikivoyage</Ext> (CC BY-SA 4.0)</Src> : null);
const OSM = () => <Src>© colaboradores de <Ext href="https://www.openstreetmap.org/copyright">OpenStreetMap</Ext> (ODbL)</Src>;

/* ═════════ Alojamiento ═════════ */
const TIPOS = { hotel: "Hoteles", hostel: "Albergues y hostales", guest_house: "Casas de huéspedes y pensiones", apartment: "Apartamentos", motel: "Moteles", chalet: "Chalets", camp_site: "Campings" };

export function Alojamiento({ d, ctx }) {
  const { ida, vuelta } = ctx.cfg;
  const n = enc(ctx.dest);
  const f = ida ? `&checkin=${ida}${vuelta ? `&checkout=${vuelta}` : ""}` : "";
  const groups = {};
  d.items.forEach((i) => { (groups[i.type] = groups[i.type] || []).push(i); });
  return (
    <div>
      <Stale d={d} />
      <H2>🔎 Reservar y comparar precios</H2>
      <Pill href={`https://www.booking.com/searchresults.es.html?ss=${n}${f}&group_adults=2`} bg="#003b95">Booking.com</Pill>
      <Pill href={`https://www.airbnb.es/s/${n}/homes${ida ? `?checkin=${ida}${vuelta ? `&checkout=${vuelta}` : ""}` : ""}`} bg="#ff5a5f">Airbnb</Pill>
      <Pill href={`https://www.google.com/travel/hotels/${n}`} bg="#4285f4">Google Hoteles</Pill>
      <Pill href={`https://www.hostelworld.com/s?q=${n}`} bg="#f15a29">Hostelworld</Pill>
      <Note tone="ok">Precios y disponibilidad cambian a diario y solo se ven en esas webs. Aquí tienes los alojamientos reales de la zona para buscarlos allí.</Note>
      <H2>🏨 Alojamientos cercanos (radio {d.radio} km)</H2>
      {!d.items.length && <Note>No hay alojamientos registrados en OpenStreetMap para esta zona.</Note>}
      {Object.keys(groups).map((t) => (
        <div key={t}>
          <H3>{TIPOS[t] || t}</H3>
          {groups[t].slice(0, 10).map((i, k) => (
            <Card key={k}>
              <strong>{i.name}</strong>{i.stars ? ` · ${i.stars}★` : ""} · {fmt(i.d, 1)} km<br />
              <small>
                <Ext href={`https://www.booking.com/searchresults.es.html?ss=${enc(`${i.name} ${ctx.dest}`)}${f}`}>Ver en Booking</Ext> · <Ext href={gmap(i.lat, i.lon)}>mapa</Ext>
                {i.web && <> · <Ext href={i.web}>web</Ext></>}{i.phone && <> · {i.phone}</>}
              </small>
            </Card>
          ))}
        </div>
      ))}
      <OSM />
    </div>
  );
}

/* ═════════ Transporte ═════════ */
function NavLinks({ o, geo }) {
  const a = `${o.lat},${o.lon}`, b = `${geo.lat},${geo.lon}`;
  return (
    <div>
      <Pill href={`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=driving`} bg="#4285f4">Google Maps</Pill>
      <Pill href={`https://www.google.com/maps/dir/?api=1&origin=${a}&destination=${b}&travelmode=driving&avoid=tolls`} bg="#2a6fd6">Google Maps sin peajes</Pill>
      <Pill href={`https://waze.com/ul?ll=${b}&navigate=yes`} bg="#33a8cc">Waze</Pill>
      <Pill href={`https://maps.apple.com/?saddr=${a}&daddr=${b}&dirflg=d`} bg="#555">Apple Maps</Pill>
    </div>
  );
}

function Gas({ d, ctx }) {
  const g = d.gas, fuel = ctx.cfg.combustible;
  if (fuel === "Eléctrico") return <Note>🔌 Para eléctrico, busca puntos de carga en <Ext href="https://www.electromaps.com/">Electromaps</Ext> o <Ext href="https://es.chargemap.com/">Chargemap</Ext>.</Note>;
  if (!g) return null;
  if (g.error) return <Note>⛽ No he podido obtener ahora los precios oficiales ({g.error}). Consúltalos en <Ext href="https://geoportalgasolineras.es/">geoportalgasolineras.es</Ext>.</Note>;
  const st = g.stations || [];
  if (!st.length) return <Note>⛽ Sin precios para este trayecto: el servicio oficial solo cubre España. Fuera, prueba <Ext href="https://www.google.com/maps/search/gasolineras">Google Maps</Ext>.</Note>;
  const cheap = [...st].sort((a, b) => a.price - b.price).slice(0, 5);
  const seg = {};
  st.forEach((s) => { const k = Math.floor(s.km / 100); if (!seg[k] || s.price < seg[k].price) seg[k] = s; });
  const tramos = Object.keys(seg).map(Number).sort((a, b) => a - b).map((k) => seg[k]);
  const avg = cheap.reduce((t, s) => t + s.price, 0) / cheap.length;
  const cost = d.route ? d.route.km * (ctx.cfg.consumo / 100) * avg : null;
  const row = (s) => [s.n, `${s.m} (${s.p})`, s.a, `${s.price.toFixed(3)} €/l`, `km ${fmt(s.km)}`, <Ext key="m" href={gmap(s.lat, s.lon)}>mapa</Ext>];
  const head = ["Marca", "Localidad", "Dirección", "Precio", "En ruta", ""];
  return (
    <div>
      <H2>⛽ Gasolineras en ruta · {fuel}</H2>
      <Note tone="ok">Precios oficiales del Ministerio para la Transición Ecológica · actualizados {g.fecha}</Note>
      {cost != null && <P>Coste estimado del combustible (solo ida, {ctx.cfg.consumo} l/100 km): <strong>≈ {fmt(cost)} €</strong></P>}
      <H3>Las 5 más baratas del trayecto</H3>
      <Table head={head} rows={cheap.map(row)} />
      <H3>La más barata cada ~100 km</H3>
      <Table head={head} rows={tramos.map(row)} />
    </div>
  );
}

function Lista({ arr, vacio, titulo }) {
  if (arr === null) return <Note>No he podido consultar {titulo.toLowerCase()} ahora mismo (servidor de OpenStreetMap saturado). Inténtalo más tarde.</Note>;
  if (!arr.length) return <P>{vacio}</P>;
  return arr.map((c) => (
    <Card key={c.id}>
      <strong>{c.name || "Sin nombre en OSM"}</strong> · {c.kind}{c.km != null ? ` · km ${fmt(c.km)} de la ruta` : ""}<br />
      <small>
        {[c.fee === "yes" ? `de pago${c.charge ? ` (${c.charge})` : ""}` : c.fee === "no" ? "gratuito" : null, c.dump === "yes" ? "vaciado de aguas" : null, c.water === "yes" ? "agua potable" : null, c.power ? "electricidad" : null, c.cap ? `${c.cap} plazas` : null].filter(Boolean).join(" · ") || "Sin detalles en OSM"}
        {" · "}<Ext href={gmap(c.lat, c.lon)}>mapa</Ext>{c.web && <> · <Ext href={c.web}>web</Ext></>}
      </small>
    </Card>
  ));
}

function Camper({ d, ctx }) {
  return (
    <div>
      <H2>🚐 Servicios para camper en la ruta</H2>
      <Note>OpenStreetMap indica el precio solo en algunas áreas. Para tarifas actualizadas y opiniones usa <Ext href="https://park4night.com/">park4night</Ext> o <Ext href="https://www.campercontact.com/es">Campercontact</Ext>.</Note>
      {d.camperRuta === undefined ? null : <Lista arr={d.camperRuta} titulo="Servicios en ruta" vacio="No hay áreas ni puntos de vaciado registrados cerca del trayecto." />}
      <H2>🚐 Servicios para camper en {ctx.dest} (25 km)</H2>
      <Lista arr={d.camperDestino} titulo="Servicios en destino" vacio="No hay áreas ni puntos de vaciado registrados en OpenStreetMap cerca del destino." />
      <H2>📜 Normas habituales (verifica en el ayuntamiento)</H2>
      <Lines lines={[
        "Estacionar y pernoctar dentro del vehículo suele estar permitido donde no haya señal que lo prohíba.",
        "Acampar (sacar toldo, mesa y sillas, calzos o patas estabilizadoras, vaciar aguas) solo se permite en campings y áreas habilitadas.",
        "Cada ayuntamiento y comunidad autónoma puede limitar el estacionamiento de autocaravanas: respeta la señalización.",
        "Vacía las aguas grises y negras solo en puntos de vaciado.",
        "Fuera de España las normas cambian mucho: en varios países la pernocta libre está prohibida.",
      ]} />
      <OSM />
    </div>
  );
}

function Publico({ d, ctx }) {
  const { origin: o, geo, dest } = ctx;
  const a = enc(o.name), b = enc(geo.name || dest);
  return (
    <div>
      <H2>🚆 Cómo ir en transporte público</H2>
      <Pill href={`https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}&destination=${geo.lat},${geo.lon}&travelmode=transit`} bg="#4285f4">Google Maps (transporte público)</Pill>
      <Pill href={`https://www.rome2rio.com/es/map/${a}/${b}`} bg="#e8505b">Rome2Rio (todas las opciones)</Pill>
      <Pill href={`https://www.google.com/travel/flights?q=${enc(`Vuelos de ${o.name} a ${geo.name || dest}`)}`} bg="#1a73e8">Vuelos</Pill>
      <Pill href="https://www.omio.es/" bg="#2d3a8c">Omio (tren, bus, avión)</Pill>
      <Pill href="https://www.renfe.com/es/es" bg="#6e2c91">Renfe</Pill>
      <Pill href="https://www.alsa.es/" bg="#1d4e89">Alsa</Pill>
      <Pill href="https://www.blablacar.es/" bg="#00aaff">BlaBlaCar</Pill>
      <Pill href="https://www.directferries.es/" bg="#0b6e99">Ferris</Pill>
      {d.straight > 1200 && <Note>Con {fmt(d.straight)} km en línea recta, el avión suele ser lo más rápido; compara también tren nocturno o autobús si no hay vuelos directos.</Note>}
      {d.straight <= 1200 && d.straight > 300 && <Note>A esta distancia compensa comparar tren de alta velocidad, autobús y vuelo.</Note>}
      {d.straight <= 300 && <Note>Distancia corta: suele bastar autobús o tren regional.</Note>}
      <H2>📍 Estaciones en {dest}</H2>
      {!d.estaciones.length ? <P>No hay estaciones registradas cerca en OpenStreetMap.</P> : d.estaciones.map((s, i) => (
        <Card key={i}><strong>{s.name}</strong> · {s.kind} · {fmt(s.d, 1)} km del centro · <small><Ext href={gmap(s.lat, s.lon)}>mapa</Ext></small></Card>
      ))}
      <H2>✈️ Aeropuertos cercanos (90 km)</H2>
      {!d.aeropuertos.length ? <P>No hay aeropuertos comerciales registrados cerca.</P> : d.aeropuertos.map((s, i) => (
        <Card key={i}><strong>{s.name}</strong> ({s.iata}) · {fmt(s.d)} km del centro · <small><Ext href={gmap(s.lat, s.lon)}>mapa</Ext></small></Card>
      ))}
      <OSM />
    </div>
  );
}

export function Transporte({ d, ctx }) {
  const { origin: o, geo, dest, cfg } = ctx;
  if (!o) return <Note>Indica una <strong>localidad de origen</strong> (botón ✏️ Editar) para calcular rutas y transporte.</Note>;
  return (
    <div>
      <Stale d={d} />
      <P>📍 <strong>{o.name}</strong> → <strong>{dest}</strong> · {d.route ? `${fmt(d.route.km)} km por carretera · ${Math.floor(d.route.min / 60)} h ${d.route.min % 60} min sin paradas` : `${fmt(d.straight)} km en línea recta`}</P>
      {cfg.transporte === "publico" ? <Publico d={d} ctx={ctx} /> : (
        <div>
          <H2>🧭 Abrir la ruta en tu navegador</H2>
          <NavLinks o={o} geo={geo} />
          <Note>Los peajes dependen de la ruta elegida: usa «sin peajes» o compara en <Ext href="https://www.viamichelin.es/">ViaMichelin</Ext>.</Note>
          {!d.route && <Note>No he podido calcular la ruta por carretera (¿hay mar de por medio?). Se muestran datos del destino.</Note>}
          <Gas d={d} ctx={ctx} />
          {cfg.transporte === "camper" && <Camper d={d} ctx={ctx} />}
          <H2>🅿️ Aparcar en {dest}</H2>
          <Pill href={`https://www.google.com/maps/search/aparcamiento+${enc(dest)}`}>Aparcamientos cerca</Pill>
        </div>
      )}
    </div>
  );
}

/* ═════════ Visitas ═════════ */
export function Visitas({ d, ctx }) {
  const ver = sec(d.wv.sections, ALIAS.ver);
  const est = d.est[0];
  const transit = (p) => `https://www.google.com/maps/dir/?api=1${est ? `&origin=${enc(`${est.name}, ${ctx.dest}`)}` : ""}&destination=${p.lat},${p.lon}&travelmode=transit`;
  return (
    <div>
      <Stale d={d} />
      {d.wv.intro && <Card><P>{d.wv.intro.text}</P><small><Ext href={d.wv.intro.url}>Wikipedia</Ext></small></Card>}
      <H2>🗺️ Qué ver</H2>
      {ver.length ? <><Lines lines={ver} max={30} /><WV d={d.wv} /></> : <Note>Wikivoyage no tiene una guía detallada de {ctx.dest}. Abajo tienes los lugares de interés registrados en Wikipedia cerca.</Note>}
      <H2>📌 Lugares de interés cercanos y cómo llegar</H2>
      {est && <P>Punto de partida sugerido para el transporte público: <strong>{est.name}</strong>.</P>}
      {!d.near.length && <P>No hay artículos de Wikipedia geolocalizados en 10 km.</P>}
      {d.near.slice(0, 15).map((p) => (
        <Card key={p.title}>
          <div style={{ display: "flex", gap: 10 }}>
            {p.thumb && <img src={p.thumb} alt="" width="64" height="64" style={{ borderRadius: 8, objectFit: "cover" }} />}
            <div>
              <strong>{p.title}</strong> · {fmt(p.d, 1)} km<br />
              <small>{p.extract}</small><br />
              <small><Ext href={transit(p)}>🚌 Cómo llegar</Ext> · <Ext href={gmap(p.lat, p.lon)}>mapa</Ext> · <Ext href={p.url}>Wikipedia</Ext></small>
            </div>
          </div>
        </Card>
      ))}
      <H2>🚉 Estaciones principales</H2>
      {!d.est.length ? <P>Sin estaciones registradas en OpenStreetMap.</P> : d.est.map((s, i) => <Card key={i}><strong>{s.name}</strong> · {s.kind} · {fmt(s.d, 1)} km del centro</Card>)}
      <Src><Ext href="https://es.wikipedia.org">Wikipedia</Ext> (CC BY-SA) · OpenStreetMap (ODbL)</Src>
    </div>
  );
}

/* ═════════ Actividades ═════════ */
export function Actividades({ d, ctx }) {
  const hacer = sec(d.wv.sections, ALIAS.hacer);
  const cats = {};
  d.items.forEach((i) => { (cats[i.cat] = cats[i.cat] || []).push(i); });
  const n = enc(ctx.dest);
  return (
    <div>
      <Stale d={d} />
      <H2>🏃 Qué hacer</H2>
      {hacer.length ? <><Lines lines={hacer} max={25} /><WV d={d.wv} /></> : <Note>Wikivoyage no detalla actividades en {ctx.dest}. Mira lo que hay en la naturaleza cercana.</Note>}
      <H2>🌿 Naturaleza y rutas cerca (20 km)</H2>
      {!d.items.length && <P>No hay espacios naturales, miradores ni rutas registrados en OpenStreetMap cerca.</P>}
      {Object.keys(cats).map((c) => (
        <div key={c}>
          <H3>{c}</H3>
          {cats[c].slice(0, 10).map((i, k) => (
            <Card key={k}><strong>{i.name}</strong>{i.ref ? ` (${i.ref})` : ""}{i.len ? ` · ${i.len} km` : ""} · {fmt(i.d, 1)} km <small><Ext href={gmap(i.lat, i.lon)}>mapa</Ext></small></Card>
          ))}
        </div>
      ))}
      <H2>🎟️ Reservar y buscar más</H2>
      <Pill href={`https://www.getyourguide.es/s/?q=${n}`} bg="#ff5533">GetYourGuide</Pill>
      <Pill href={`https://www.civitatis.com/es/buscador/?q=${n}`} bg="#0099a8">Civitatis</Pill>
      <Pill href={`https://es.wikiloc.com/wikiloc/find.do?q=${n}`} bg="#5a8f29">Rutas en Wikiloc</Pill>
      <Pill href={`https://www.google.com/search?q=${enc(`eventos y fiestas en ${ctx.dest}`)}`} bg="#4285f4">Eventos y fiestas</Pill>
      <OSM />
    </div>
  );
}

/* ═════════ Gastronomía ═════════ */
export function Gastronomia({ d, ctx }) {
  const comer = sec(d.wv.sections, ALIAS.comer), beber = sec(d.wv.sections, ALIAS.beber);
  const n = enc(ctx.dest);
  return (
    <div>
      <Stale d={d} />
      <H2>🍽️ Comer</H2>
      {comer.length ? <Lines lines={comer} max={20} /> : <Note>Wikivoyage no detalla la gastronomía de {ctx.dest}.</Note>}
      {beber.length > 0 && <><H2>🍷 Beber y salir</H2><Lines lines={beber} max={14} /></>}
      <WV d={d.wv} />
      <H2>📍 Restaurantes, cafés y bares registrados</H2>
      {!d.lugares.length && <P>No hay locales registrados en OpenStreetMap.</P>}
      {d.lugares.slice(0, 20).map((l, i) => (
        <Card key={i}>
          <strong>{l.name}</strong>{l.cuisine ? ` · ${l.cuisine.replace(/[;_]/g, ", ")}` : ""} · {fmt(l.d, 1)} km<br />
          <small>{l.hours ? `🕒 ${l.hours} · ` : ""}<Ext href={gmap(l.lat, l.lon)}>mapa</Ext>{l.web && <> · <Ext href={l.web}>web</Ext></>}</small>
        </Card>
      ))}
      {d.mercados.length > 0 && <><H2>🛒 Mercados</H2>{d.mercados.map((l, i) => <Card key={i}><strong>{l.name}</strong> · {fmt(l.d, 1)} km <small><Ext href={gmap(l.lat, l.lon)}>mapa</Ext></small></Card>)}</>}
      <H2>⭐ Opiniones y reservas</H2>
      <Pill href={`https://www.tripadvisor.es/Search?q=${n}%20restaurantes`} bg="#00aa6c">Tripadvisor</Pill>
      <Pill href={`https://www.thefork.es/`} bg="#1f8a70">TheFork</Pill>
      <Pill href={`https://www.google.com/maps/search/restaurantes+${n}`} bg="#4285f4">Google Maps</Pill>
      <OSM />
    </div>
  );
}

/* ═════════ Tiempo ═════════ */
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const filaT = (x) => { const [e, t] = WMO(x.code); return [dia(x.t), `${e} ${t}`, `${fmt(x.max)}° / ${fmt(x.min)}°`, `${fmt(x.rain, 1)} mm${x.prob != null ? ` (${x.prob}%)` : ""}`, `${fmt(x.wind)} km/h`]; };

export function Tiempo({ d }) {
  const head = ["Día", "Cielo", "Máx / mín", "Lluvia", "Viento"];
  return (
    <div>
      <Stale d={d} />
      {d.trip.length > 0 && <><H2>📅 Previsión para tus fechas</H2><Table head={head} rows={d.trip.map(filaT)} /></>}
      {d.hist && (
        <>
          <H2>📅 Tus fechas, según lo ocurrido el año pasado</H2>
          <Note>Tus fechas quedan fuera de los 16 días de previsión. Esto es lo que pasó esos mismos días el año anterior (orientativo).</Note>
          <Table head={["Día", "Máx / mín", "Lluvia"]} rows={d.hist.map((x) => [dia(x.t), `${fmt(x.max)}° / ${fmt(x.min)}°`, `${fmt(x.rain, 1)} mm`])} />
        </>
      )}
      <H2>🌤️ Próximos 7 días</H2>
      <Table head={head} rows={d.next.map(filaT)} />
      {d.months.some(Boolean) && (
        <>
          <H2>📊 Clima típico por meses (último año completo)</H2>
          <Table head={["Mes", "Máx media", "Mín media", "Lluvia total", "Días de lluvia"]} rows={d.months.map((m, i) => (m ? [MESES[i], `${fmt(m.max, 1)}°`, `${fmt(m.min, 1)}°`, `${fmt(m.rain)} mm`, m.rainy] : [MESES[i], "–", "–", "–", "–"]))} />
        </>
      )}
      <H2>🧳 Qué ropa llevar</H2>
      <Lines lines={d.ropa} />
      <Src><Ext href="https://open-meteo.com/">Open-Meteo</Ext> (CC BY 4.0)</Src>
    </div>
  );
}

/* ═════════ Mareas ═════════ */
export function Mareas({ d, ctx }) {
  if (!d.costera) {
    return (
      <div>
        <Note>🌊 No hay datos del modelo marino cerca de {ctx.dest}: probablemente es una zona de interior. Si buscas agua, mira playas fluviales, embalses o la costa más próxima.</Note>
        <Pill href={`https://www.google.com/maps/search/playas+cerca+de+${enc(ctx.dest)}`}>Playas cerca</Pill>
      </div>
    );
  }
  return (
    <div>
      <Stale d={d} />
      <Note>Datos de un modelo oceánico (rejilla de ~8 km, hora local): sirven para planificar playa o paseo, <strong>no para navegar</strong>. Para tablas oficiales usa <Ext href="https://www.tablademareas.com/">tablademareas.com</Ext> o el Instituto Hidrográfico de la Marina.</Note>
      {d.amp < 0.3 && <Note tone="ok">En esta zona la marea es muy pequeña (variación de {fmt(d.amp * 100)} cm): apenas se nota.</Note>}
      <H2>🌊 Mareas y oleaje · próximos 7 días</H2>
      <Table
        head={["Día", "Pleamares ▲", "Bajamares ▼", "Oleaje máx."]}
        rows={d.dias.map((x) => [
          dia(x.fecha),
          x.mareas.filter((m) => m.type === "alta").map((m) => `${m.t.slice(11, 16)} (${fmt(m.h, 1)} m)`).join(" · ") || "–",
          x.mareas.filter((m) => m.type === "baja").map((m) => `${m.t.slice(11, 16)} (${fmt(m.h, 1)} m)`).join(" · ") || "–",
          x.ola != null ? `${fmt(x.ola, 1)} m${x.periodo ? ` · ${fmt(x.periodo)} s` : ""}` : "–",
        ])}
      />
      <Src><Ext href="https://open-meteo.com/en/docs/marine-weather-api">Open-Meteo Marine</Ext> (CC BY 4.0)</Src>
    </div>
  );
}

/* ═════════ eSIM (tabla fija: no depende de IA ni de datos cambiantes) ═════════ */
export function Esim({ ctx }) {
  const { dest, geo } = ctx;
  return (
    <div>
      <Note>📱 {dest} ({geo.country || geo.cc}) queda fuera de la zona de «roaming como en casa» (UE + Noruega, Islandia y Liechtenstein). Fuera de ella el roaming no está regulado y puede salir muy caro.</Note>
      <H2>📊 Opciones para tener datos</H2>
      <Table
        head={["Proveedor", "Qué ofrece", "Dónde contratarlo"]}
        rows={[
          ["Revolut", "Planes de datos eSIM desde la app", <Ext key="a" href="https://www.revolut.com/es-ES/esim/">revolut.com</Ext>],
          ["Airalo", "Tienda de eSIM por país o región", <Ext key="b" href="https://www.airalo.com/">airalo.com</Ext>],
          ["Holafly", "eSIM de datos para viajeros", <Ext key="c" href="https://holafly.com/es/">holafly.com</Ext>],
          ["Ubigi", "eSIM de datos por país o región", <Ext key="d" href="https://www.ubigi.com/">ubigi.com</Ext>],
          ["Nomad", "eSIM de datos por país o región", <Ext key="e" href="https://www.getnomad.app/">getnomad.app</Ext>],
          ["Maya", "eSIM de datos por país o región", <Ext key="f" href="https://maya.net/">maya.net</Ext>],
          ["Movistar", "Bonos de roaming internacional", <Ext key="g" href="https://www.movistar.es/">movistar.es</Ext>],
          ["Vodafone", "Bonos de roaming internacional", <Ext key="h" href="https://www.vodafone.es/">vodafone.es</Ext>],
          ["Orange / MásOrange", "Bonos de roaming internacional", <Ext key="i" href="https://www.orange.es/">orange.es</Ext>],
          ["Yoigo", "Roaming internacional", <Ext key="j" href="https://www.yoigo.com/">yoigo.com</Ext>],
          ["Digi", "Roaming internacional", <Ext key="k" href="https://www.digimobil.es/">digimobil.es</Ext>],
        ]}
      />
      <Note>Precios, GB incluidos y países cubiertos cambian con frecuencia y dependen del destino: <strong>selecciona {geo.country || dest} en cada web</strong> y compara. Los operadores españoles suelen salir más caros que una eSIM de viaje.</Note>
      <H2>⚙️ Cómo hacerlo bien</H2>
      <Lines lines={[
        "Comprueba que tu móvil es libre y compatible con eSIM.",
        "Compra y descarga la eSIM antes de salir, con wifi (recibirás un QR o código).",
        "Mantén tu SIM española para llamadas, SMS y códigos del banco; desactiva su itinerancia de datos.",
        "Activa la eSIM de viaje al llegar y pon «datos en roaming» solo en ella.",
        "Descarga mapas sin conexión por si acaso.",
      ]} />
    </div>
  );
}

/* ═════════ Cambio de divisa ═════════ */
export function Cambio({ d, print }) {
  const [amt, setAmt] = useState("");
  const [dir, setDir] = useState("eur");
  if (!d.rate) return <Note>No hay tipo de cambio disponible para {d.currency} ahora mismo.</Note>;
  const n = parseFloat(String(amt).replace(",", "."));
  const res = Number.isFinite(n) ? (dir === "eur" ? n * d.rate : n / d.rate) : null;
  const dec = d.rate > 100 ? 0 : 2;
  const inp = { padding: "11px 14px", borderRadius: 10, border: `2px solid ${C.line}`, fontSize: "1.05em", width: "100%", fontFamily: "Georgia,serif", outline: "none" };
  return (
    <div>
      <Stale d={d} />
      <H2>💱 Cambio {d.currency} ⇄ EUR</H2>
      <Note tone="ok">1 € = <strong>{fmt(d.rate, 4)} {d.currency}</strong> · 1 {d.currency} = {fmt(1 / d.rate, 4)} € · actualizado {d.updated} UTC</Note>
      {!print && (
        <div style={{ margin: "12px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["eur", `€ → ${d.currency}`], ["loc", `${d.currency} → €`]].map(([k, l]) => (
              <button key={k} onClick={() => { setDir(k); setAmt(""); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px solid ${dir === k ? C.acc : C.line}`, background: dir === k ? `linear-gradient(135deg,${C.acc},${C.acc2})` : "#fff", color: dir === k ? "#fff" : "#4a3728", fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }}>{l}</button>
            ))}
          </div>
          <input type="number" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={dir === "eur" ? "Euros" : d.currency} style={inp} />
          {res != null && <p style={{ textAlign: "center", fontSize: "1.8em", fontWeight: 900, color: C.acc, margin: "12px 0 0", fontFamily: "'Playfair Display',serif" }}>{fmt(res, dec)} {dir === "eur" ? d.currency : "€"}</p>}
        </div>
      )}
      <H3>Tabla rápida</H3>
      <Table head={["Euros", d.currency]} rows={[1, 5, 10, 20, 50, 100, 200, 500].map((e) => [`${e} €`, `${fmt(e * d.rate, dec)} ${d.currency}`])} />
      <Table head={[d.currency, "Euros"]} rows={[1, 5, 10, 20, 50, 100, 200, 500].map((e) => [`${e} ${d.currency}`, `${fmt(e / d.rate, 2)} €`])} />
      <Note>Orientativo y sin comisiones. Al pagar con tarjeta elige siempre la moneda local (rechaza la conversión «a euros» del datáfono). Fuente: <Ext href="https://www.exchangerate-api.com">ExchangeRate-API</Ext>.</Note>
    </div>
  );
}

/* ═════════ Documentación (reglas generales; verifica siempre) ═════════ */
export function Docs({ ctx }) {
  const { geo, cfg, dest } = ctx;
  const cc = geo.cc;
  let doc;
  if (cc === "ES") doc = "Viaje dentro de España: DNI o pasaporte en vigor.";
  else if (SCHENGEN.includes(cc) || cc === "IE" || cc === "CY") doc = "Espacio UE/Schengen: basta el DNI o el pasaporte en vigor.";
  else if (cc === "GB") doc = "Reino Unido: pasaporte en vigor (el DNI ya no vale) y autorización electrónica ETA para visitantes. Verifica el requisito vigente en gov.uk.";
  else if (cc === "US") doc = "Estados Unidos: pasaporte electrónico y autorización ESTA. Verifica el requisito vigente en el sitio oficial.";
  else if (cc === "CA") doc = "Canadá: pasaporte y eTA si llegas en avión. Verifica el requisito vigente.";
  else doc = "Pasaporte en vigor (muchos países exigen 6 meses de validez y páginas libres). Comprueba si necesitas visado o e-visa.";
  const salud = [...UE, "NO", "IS", "LI", "CH"].includes(cc);
  return (
    <div>
      <Note>Información general para ciudadanos españoles. Los requisitos cambian: <strong>confírmalos siempre en las webs oficiales</strong> antes de viajar.</Note>
      <H2>🛂 Documentos de viaje</H2>
      <P>{doc}</P>
      {!SCHENGEN.includes(cc) && cc !== "ES" && (
        <>
          <Pill href="https://www.iatatravelcentre.com/" bg="#005a9c">IATA Travel Centre (visados por país)</Pill>
          <Pill href="https://www.exteriores.gob.es/" bg="#a4332f">Ministerio de Exteriores · Recomendaciones de viaje</Pill>
        </>
      )}
      <H2>🏥 Salud</H2>
      <P>{salud ? "Lleva la Tarjeta Sanitaria Europea (TSE): cubre la atención pública en la UE/EEE y Suiza." : "Fuera de la UE contrata un seguro de viaje con asistencia sanitaria y repatriación."}</P>
      <Pill href="https://www.sanidad.gob.es/areas/sanidadExterior/laSaludTambienViaja/home.htm" bg="#2e7d6b">Sanidad Exterior: vacunas y consejos</Pill>
      <H2>🚗 Si conduces</H2>
      <Lines lines={[
        "Permiso de conducir español válido en la UE. Fuera, algunos países exigen permiso internacional: consúltalo en la DGT.",
        "Lleva la documentación del vehículo (permiso de circulación, ITV vigente) y el seguro en vigor.",
        cfg.transporte === "camper" || cfg.transporte === "vehiculo" ? `Para ${dest} comprueba si tu seguro cubre ese país; fuera de la UE/EEE puede exigirse la Carta Verde.` : "Si alquilas coche, revisa la franquicia y las coberturas.",
      ]} />
      <H2>🧳 Aduana y dinero</H2>
      <Lines lines={[
        "Si entras o sales de la UE con 10.000 € o más en efectivo, debes declararlo.",
        "Hay restricciones para alimentos de origen animal, plantas y medicamentos: infórmate según el destino.",
        "Lleva una tarjeta sin comisiones por cambio de divisa y algo de efectivo local.",
      ]} />
    </div>
  );
}

/* ═════════ Enlaces ═════════ */
export function Enlaces({ d, ctx }) {
  const n = enc(ctx.dest);
  const g = (t) => `https://www.google.com/search?q=${enc(`${t} ${ctx.dest}`)}`;
  return (
    <div>
      <Stale d={d} />
      <H2>🏛️ Oficinas de turismo</H2>
      {!d.oficinas.length && <P>No hay oficinas registradas en OpenStreetMap. Busca la web oficial de turismo:</P>}
      {d.oficinas.map((o, i) => (
        <Card key={i}><strong>{o.name}</strong> · {fmt(o.d, 1)} km<br /><small>{o.hours ? `🕒 ${o.hours} · ` : ""}{o.phone ? `${o.phone} · ` : ""}<Ext href={gmap(o.lat, o.lon)}>mapa</Ext>{o.web && <> · <Ext href={o.web}>web</Ext></>}</small></Card>
      ))}
      <Pill href={g("turismo oficial")}>Web oficial de turismo</Pill>
      <H2>🎟️ Entradas y reservas</H2>
      <Pill href={`https://www.tiqets.com/es/search/?q=${n}`} bg="#e6007e">Tiqets</Pill>
      <Pill href={`https://www.getyourguide.es/s/?q=${n}`} bg="#ff5533">GetYourGuide</Pill>
      <Pill href={`https://www.civitatis.com/es/buscador/?q=${n}`} bg="#0099a8">Civitatis</Pill>
      <Pill href={g("comprar entradas museos monumentos")}>Entradas oficiales</Pill>
      <H2>📖 Guías y mapas</H2>
      <Pill href={`https://es.wikivoyage.org/w/index.php?search=${n}`} bg="#4a7c59">Wikivoyage</Pill>
      <Pill href={`https://es.wikipedia.org/w/index.php?search=${n}`} bg="#555">Wikipedia</Pill>
      <Pill href={`https://www.tripadvisor.es/Search?q=${n}`} bg="#00aa6c">Tripadvisor</Pill>
      <Pill href={`https://www.google.com/maps/search/${n}`} bg="#4285f4">Google Maps</Pill>
      <H2>🚌 Transporte local</H2>
      <Pill href={g("transporte público billetes")}>Transporte público</Pill>
      <Pill href={`https://www.rome2rio.com/es/map/${n}`} bg="#e8505b">Rome2Rio</Pill>
      <OSM />
    </div>
  );
}

/* ═════════ Consejos ═════════ */
export function Consejos({ d, ctx }) {
  const bloques = [["🛡️ Seguridad", ALIAS.seguridad], ["🤝 Costumbres y respeto", ALIAS.respeto], ["🗣️ Idioma y comunicación", ALIAS.comunicacion], ["🩺 Salud", ALIAS.salud]];
  const hay = bloques.some(([, a]) => sec(d.wv.sections, a).length);
  const n = enc(ctx.geo.name || ctx.dest);
  return (
    <div>
      <Stale d={d.wv} />
      {!hay && <Note>Wikivoyage no tiene consejos específicos de {ctx.dest}. Abajo tienes consejos generales y enlaces fiables.</Note>}
      {bloques.map(([t, a]) => { const l = sec(d.wv.sections, a); return l.length ? <div key={t}><H2>{t}</H2><Lines lines={l} max={10} /></div> : null; })}
      {hay && <WV d={d.wv} />}
      <H2>📞 Emergencias</H2>
      <P>{UE.includes(ctx.geo.cc) ? "En la UE el número de emergencias es el 112." : "El 112 funciona en la UE y en muchos otros países; comprueba el número local antes de viajar."}</P>
      <H2>💶 Presupuesto diario</H2>
      <P>Precios medios aportados por usuarios (comida, transporte, ocio):</P>
      <Pill href={`https://www.numbeo.com/cost-of-living/in/${n}`} bg="#3b6ea5">Numbeo · coste de vida en {ctx.geo.name}</Pill>
      <H2>✅ Consejos generales</H2>
      <Lines lines={[
        "Guarda copias digitales del pasaporte, el seguro y las reservas, y descarga mapas sin conexión.",
        "Avisa a tu banco y lleva más de una tarjeta, guardadas en sitios distintos.",
        "Desconfía de quien te aborda con ofertas demasiado buenas; usa taxis oficiales o apps conocidas.",
        "En zonas turísticas masificadas, cuida el móvil y la cartera.",
        "Consulta las recomendaciones de viaje del Ministerio de Exteriores antes de salir.",
      ]} />
      <Pill href="https://www.exteriores.gob.es/" bg="#a4332f">Ministerio de Exteriores</Pill>
    </div>
  );
}

export const VIEWS = { alojamiento: Alojamiento, transporte: Transporte, visitas: Visitas, actividades: Actividades, gastronomia: Gastronomia, tiempo: Tiempo, mareas: Mareas, esim: Esim, cambio: Cambio, docs: Docs, enlaces: Enlaces, consejos: Consejos };
