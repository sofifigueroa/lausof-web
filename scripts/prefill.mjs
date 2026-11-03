/* =============================================================================
   MENSAJES PRE-ARMADOS — node scripts/prefill.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Cada enlace de WhatsApp (wa.me) y de correo (mailto:) del sitio lleva, debajo
   de su primera línea, los datos que la familia necesita para cotizar, como
   renglones para completar:

     Hola Lausof, quiero cotizar un traslado de Salta a Cafayate
     Fecha:
     Pasajeros:
     Lugar de salida:
     Solo ida o ida y vuelta:

   Por qué: 74% de los clics en WhatsApp salen del encabezado y de la barra, y
   el mensaje llegaba sin fecha, pasajeros ni lugar, así que la primera
   respuesta era siempre una lista de preguntas (auditoría D del 03/11/2026,
   §3). WhatsApp pone el `text` en la caja de escribir y el cliente lo completa
   antes de mandar (faq.whatsapp.com/5913398998672934). Es el mismo formato que
   ya usaban el auxilio de la portada y las cargas refrigeradas en inglés.

   Cómo se arma cada mensaje:
   - La PRIMERA LÍNEA es la que está escrita en el HTML (nombra el servicio, la
     ruta o la fecha del evento) y el script no la toca. Para cambiarla, se
     edita el HTML y se vuelve a correr el script.
   - Los RENGLONES salen del tipo de página (PAGINAS, abajo) o, si un enlace
     cotiza otra cosa que el resto de la página, de su atributo
     `data-prefill="tipo"` (p. ej. el auxilio en la portada).
   - Un wa.me sin texto (el del pie) toma la primera línea más usada en la
     página. Un mailto sin asunto toma el asunto más usado en la página (o
     "Pedido de cotización" / "Quote request" si ninguno tiene).
   - El correo lleva los mismos renglones como `body=`, sin tocar el
     destinatario, la copia (cc) ni el asunto.
   - Las zonas <!-- GENERADO:... --> son de otro script (la flota en venta) y
     no se tocan.

   PÁGINA NUEVA: agregar su renglón en PAGINAS con el tipo que corresponda,
   correr `node scripts/prefill.mjs` y commitear el HTML que reescribe.
   `--comprobar` no escribe nada y sale con 1 si una página no está al día o
   no tiene tipo (lo mismo vigila tests/prefill.test.js).

   js/contacto.js no cambia: mide el clic por el href y nunca manda el texto.
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';

/* ---- renglones por tipo --------------------------------------------------
   `es`/`en`: renglones del WhatsApp y del correo. `correoEs`/`correoEn`, si
   están, reemplazan a los anteriores sólo en el correo (donde entra más). */
const PASAJEROS_ES = ['Fecha', 'Pasajeros', 'Lugar de salida', 'Solo ida o ida y vuelta'];
const PASAJEROS_EN = ['Date', 'Passengers', 'Pickup place', 'One way or return'];

export const TIPOS = {
  // Rutas, excursiones, eventos, grupos: lo mismo que pide cada página al pie.
  pasajeros: { es: PASAJEROS_ES, en: PASAJEROS_EN },
  turismo: { es: ['Destino o excursión', ...PASAJEROS_ES], en: ['Destination or day trip', ...PASAJEROS_EN] },
  internacional: { es: ['Destino', ...PASAJEROS_ES], en: ['Destination', ...PASAJEROS_EN] },
  aeropuerto: {
    es: ['Número de vuelo', 'Fecha y hora del vuelo', 'Pasajeros y valijas', 'Hotel o destino', 'Solo ida o ida y vuelta'],
    en: ['Flight number', 'Flight date and time', 'Passengers and bags', 'Hotel or destination', 'One way or return'],
  },
  'combi-dia': {
    es: ['Fecha', 'Cantidad de días', 'Pasajeros', 'Lugar de salida', 'Recorrido'],
    en: ['Date', 'Number of days', 'Passengers', 'Pickup place', 'Itinerary'],
  },
  camioneta: {
    es: ['Fecha de retiro', 'Cantidad de días', 'Con o sin chofer', 'Pasajeros', 'Lugar de retiro'],
    en: ['Pickup date', 'Number of days', 'Self-drive or with driver', 'Passengers', 'Pickup place'],
  },
  personal: {
    es: ['Fecha o frecuencia', 'Personas', 'Origen', 'Destino', 'Solo ida o ida y vuelta'],
    en: ['Date or schedule', 'People', 'From', 'To', 'One way or return'],
  },
  auxilio: { es: ['Ubicación', 'Vehículo', 'Qué pasó'], en: ['Location', 'Vehicle', 'What happened'] },
  taller: { es: ['Vehículo', 'Qué necesita', 'Fecha'], en: ['Vehicle', 'What it needs', 'Date'] },
  carga: {
    es: ['Carga', 'Peso o volumen', 'Origen', 'Destino', 'Fecha'],
    en: ['Cargo', 'Weight or volume', 'From', 'To', 'Date'],
  },
  refrigerado: {
    es: ['Carga', 'Temperatura', 'Origen', 'Destino', 'Fechas'],
    en: ['Cargo', 'Temperature', 'From', 'To', 'Dates'],
    correoEs: ['Tipo de carga', 'Peso o volumen', 'Temperatura requerida (°C)', 'Origen', 'Destino', 'Fechas de carga y entrega', 'Empresa y contacto'],
    correoEn: ['Cargo type', 'Weight or volume', 'Temperature required (°C)', 'Origin', 'Destination', 'Pickup and delivery dates', 'Company and contact'],
  },
  deposito: {
    es: ['Mercadería', 'Espacio (m² o pallets)', 'Desde cuándo', 'Por cuánto tiempo'],
    en: ['Goods', 'Space (m² or pallets)', 'Start date', 'How long'],
  },
  autoelevador: {
    es: ['Fecha', 'Cantidad de días', 'Lugar', 'Peso a mover'],
    en: ['Date', 'Number of days', 'Location', 'Weight to lift'],
  },
  mineria: {
    es: ['Servicio (personal, carga o asistencia)', 'Mina o campamento', 'Fecha', 'Personas o carga'],
    en: ['Service (crew, cargo or support)', 'Mine or camp', 'Date', 'People or cargo'],
  },
  produccion: {
    es: ['Fechas del rodaje', 'Locaciones', 'Personas del equipo', 'Vehículos o equipos'],
    en: ['Shoot dates', 'Locations', 'Crew size', 'Vehicles or equipment'],
  },
  agencia: {
    es: ['Agencia', 'Servicios que necesitan', 'Temporada o fechas'],
    en: ['Agency', 'Services you need', 'Season or dates'],
  },
  // Agencias y hoteles (la página B2B nombra a los dos).
  'agencia-hotel': {
    es: ['Agencia u hotel', 'Servicios que necesitan', 'Temporada o fechas'],
    en: ['Tour operator or hotel', 'Services you need', 'Season or dates'],
  },
  general: {
    es: ['Servicio', 'Fecha', 'Origen y destino', 'Pasajeros o carga'],
    en: ['Service', 'Date', 'From and to', 'Passengers or cargo'],
  },
  // Venta de unidades (WhatsApp de ventas): no es una cotización.
  flota: { es: ['Unidad'], en: ['Vehicle'] },
};

/* ---- tipo de cada página ---------------------------------------------------
   Toda página con un wa.me o un mailto tiene que estar acá. */
export const PAGINAS = {
  '404.html': 'general',
  'agencias-y-hoteles.html': 'agencia-hotel',
  'alquiler-4x4.html': 'camioneta',
  'alquiler-autoelevadores.html': 'autoelevador',
  'alquiler-combi-con-chofer-salta.html': 'combi-dia',
  'cargas-refrigeradas.html': 'refrigerado',
  'charter-recitales.html': 'pasajeros',
  'clubes-deportivos.html': 'pasajeros',
  'deposito-galpon.html': 'deposito',
  'feriados-fines-de-semana-largos.html': 'pasajeros',
  'flota-en-venta.html': 'flota',
  'galeria.html': 'general',
  'golf-torneos.html': 'pasajeros',
  'grua-salta.html': 'auxilio',
  'index.html': 'general',
  'logistica-minera.html': 'mineria',
  'peregrinaciones-eventos.html': 'pasajeros',
  'producciones.html': 'produccion',
  'salinas-grandes-desde-salta.html': 'pasajeros',
  'semana-santa-salta-jujuy.html': 'pasajeros',
  'transporte-de-personal.html': 'personal',
  'transporte-de-personal-obras-de-litio.html': 'personal',
  'traslado-aeropuerto-salta.html': 'aeropuerto',
  'traslado-salta-jujuy.html': 'pasajeros',
  'traslado-carnaval-quebrada-de-humahuaca.html': 'pasajeros',
  'traslado-salta-cachi.html': 'pasajeros',
  'traslado-salta-cafayate.html': 'pasajeros',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'pasajeros',
  'traslado-salta-san-antonio-de-los-cobres.html': 'pasajeros',
  'traslado-salta-san-pedro-de-atacama.html': 'pasajeros',
  'traslado-salta-uyuni.html': 'pasajeros',
  'traslado-san-pedro-de-atacama-salta.html': 'pasajeros',
  'traslado-serenata-a-cafayate.html': 'pasajeros',
  'traslado-tren-a-las-nubes.html': 'pasajeros',
  'traslado-uyuni-salta.html': 'pasajeros',
  'traslados-casamientos.html': 'pasajeros',
  'traslados-empresas.html': 'personal',
  'traslados-fiesta-del-milagro.html': 'pasajeros',
  'traslados-trail-jujuy-utmb.html': 'pasajeros',
  'turismo.html': 'turismo',
  'viajes-de-estudio.html': 'pasajeros',
  'viajes-internacionales.html': 'internacional',
  'en/404.html': 'general',
  'en/4x4-rental.html': 'camioneta',
  'en/crew-transport-lithium-projects.html': 'personal',
  'en/film-production-logistics.html': 'produccion',
  'en/ground-transport-for-tour-operators.html': 'agencia-hotel',
  'en/holy-week-salta-jujuy.html': 'pasajeros',
  'en/index.html': 'general',
  'en/international-trips.html': 'internacional',
  'en/jujuy-utmb-trail-race-transfers.html': 'pasajeros',
  'en/minibus-with-driver-salta.html': 'combi-dia',
  'en/mining-logistics.html': 'mineria',
  'en/personnel-transport.html': 'personal',
  'en/refrigerated-freight.html': 'refrigerado',
  'en/salinas-grandes-from-salta.html': 'pasajeros',
  'en/salta-airport-transfer.html': 'aeropuerto',
  'en/salta-to-jujuy-transfer.html': 'pasajeros',
  'en/salta-to-cachi-transfer.html': 'pasajeros',
  'en/salta-to-cafayate-transfer.html': 'pasajeros',
  'en/salta-to-purmamarca-tilcara-humahuaca.html': 'pasajeros',
  'en/salta-to-san-antonio-de-los-cobres.html': 'pasajeros',
  'en/salta-to-san-pedro-de-atacama.html': 'pasajeros',
  'en/salta-to-uyuni.html': 'pasajeros',
  'en/san-pedro-de-atacama-to-salta.html': 'pasajeros',
  'en/tours-and-transfers.html': 'turismo',
  'en/tow-truck-salta.html': 'auxilio',
  'en/train-to-the-clouds-transfer.html': 'pasajeros',
  'en/transfer-carnival-quebrada-de-humahuaca.html': 'pasajeros',
  'en/uyuni-to-salta.html': 'pasajeros',
  'en/warehouse.html': 'deposito',
  'en/wedding-transportation.html': 'pasajeros',
};

/* ---- lectura y escritura de enlaces -------------------------------------- */

// Asunto de un mailto que no lo tiene, cuando ningún otro de la página lo da.
const ASUNTO = { es: encodeURIComponent('Pedido de cotización'), en: encodeURIComponent('Quote request') };

export const idiomaDe = (pagina) => (pagina.startsWith('en/') ? 'en' : 'es');

const ZONA_GENERADA = /<!-- GENERADO:([A-Z]+)[\s\S]*?<!-- \/GENERADO:\1 -->/g;
// Una etiqueta de apertura que lleva un enlace de contacto en href o data-enlace.
const ETIQUETA = /<[a-z][a-z0-9]*\b[^>]*\b(?:href|data-enlace)="(?:https:\/\/wa\.me\/|mailto:)[^>]*>/gi;
const ATRIBUTO_CONTACTO = /\b(href|data-enlace)="((?:https:\/\/wa\.me\/|mailto:)[^"]*)"/g;

const escaparAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const desescaparAttr = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

export function leerWa(url) {
  const m = url.match(/^https:\/\/wa\.me\/(\d+)(?:\?text=(.*))?$/);
  if (!m) return null;
  return { numero: m[1], texto: m[2] === undefined ? '' : decodeURIComponent(m[2]) };
}

// Los parámetros quedan tal cual vienen escritos (`cc=transporte@lausof.com`,
// el asunto ya codificado): sólo el cuerpo lo arma este script.
export function leerMailto(url) {
  const [destino, consulta = ''] = url.slice('mailto:'.length).split('?');
  const params = consulta ? consulta.split('&').map((p) => {
    const i = p.indexOf('=');
    return [p.slice(0, i), p.slice(i + 1)];
  }) : [];
  return { destino, params };
}

const escribirMailto = ({ destino, params }) =>
  `mailto:${destino}${params.length ? '?' + params.map(([k, v]) => `${k}=${v}`).join('&') : ''}`;

/** Separa el HTML en tramos editables y zonas generadas por otro script. */
function tramos(html) {
  const lista = [];
  let desde = 0;
  for (const m of html.matchAll(ZONA_GENERADA)) {
    lista.push({ texto: html.slice(desde, m.index), editable: true });
    lista.push({ texto: m[0], editable: false });
    desde = m.index + m[0].length;
  }
  lista.push({ texto: html.slice(desde), editable: true });
  return lista;
}

/** Cada enlace de contacto editable de la página: { tipo, atributo, url }. */
export function enlacesDe(html, pagina) {
  const tipoPagina = PAGINAS[pagina];
  const lista = [];
  for (const { texto, editable } of tramos(html)) {
    if (!editable) continue;
    for (const [etiqueta] of texto.matchAll(ETIQUETA)) {
      const propio = etiqueta.match(/\bdata-prefill="([^"]*)"/);
      for (const [, atributo, valor] of etiqueta.matchAll(ATRIBUTO_CONTACTO)) {
        lista.push({ tipo: propio ? propio[1] : tipoPagina, atributo, url: desescaparAttr(valor) });
      }
    }
  }
  return lista;
}

const masUsado = (valores) => {
  const cuenta = new Map();
  for (const v of valores) if (v) cuenta.set(v, (cuenta.get(v) || 0) + 1);
  let mejor = null;
  for (const [v, n] of cuenta) if (mejor === null || n > cuenta.get(mejor)) mejor = v;
  return mejor;
};

export const renglones = (tipo, idioma, canal) => {
  const t = TIPOS[tipo];
  return (canal === 'correo' && t[idioma === 'en' ? 'correoEn' : 'correoEs']) || t[idioma];
};

export const primeraLinea = (texto) => texto.split('\n')[0].trim();

/** Problemas que impiden armar la página (sin tipo, tipo desconocido, sin texto base). */
export function problemasDe(html, pagina) {
  const enlaces = enlacesDe(html, pagina);
  if (!enlaces.length) return [];
  const problemas = [];
  if (!PAGINAS[pagina]) problemas.push(`${pagina}: sin tipo en PAGINAS (scripts/prefill.mjs)`);
  for (const { tipo } of enlaces) {
    if (tipo && !TIPOS[tipo]) problemas.push(`${pagina}: tipo desconocido "${tipo}"`);
  }
  const was = enlaces.filter((e) => e.url.startsWith('https://wa.me/')).map((e) => leerWa(e.url));
  if (was.some((w) => !w)) problemas.push(`${pagina}: un wa.me con otro formato que https://wa.me/<número>?text=`);
  if (was.length && !masUsado(was.filter(Boolean).map((w) => primeraLinea(w.texto)))) {
    problemas.push(`${pagina}: ningún wa.me tiene texto del que tomar la primera línea`);
  }
  return [...new Set(problemas)];
}

/** Devuelve el HTML con todos los mensajes pre-armados al día. Idempotente. */
export function prefillHtml(html, pagina) {
  if (problemasDe(html, pagina).length) return html;
  const idioma = idiomaDe(pagina);
  const enlaces = enlacesDe(html, pagina);
  const aperturaPagina = masUsado(enlaces.filter((e) => e.url.startsWith('https://wa.me/') && e.tipo === PAGINAS[pagina])
    .map((e) => primeraLinea(leerWa(e.url).texto)))
    || masUsado(enlaces.filter((e) => e.url.startsWith('https://wa.me/')).map((e) => primeraLinea(leerWa(e.url).texto)));
  const asuntoPagina = masUsado(enlaces.filter((e) => e.url.startsWith('mailto:'))
    .map((e) => (leerMailto(e.url).params.find(([k]) => k === 'subject') || [])[1]));

  const armar = (url, tipo) => {
    if (url.startsWith('https://wa.me/')) {
      const { numero, texto } = leerWa(url);
      const apertura = primeraLinea(texto) || aperturaPagina;
      const cuerpo = [apertura, ...renglones(tipo, idioma, 'wa').map((r) => `${r}: `)].join('\n');
      return `https://wa.me/${numero}?text=${encodeURIComponent(cuerpo)}`;
    }
    const correo = leerMailto(url);
    const params = correo.params.filter(([k]) => k !== 'body');
    if (!params.some(([k]) => k === 'subject')) params.push(['subject', asuntoPagina || ASUNTO[idioma]]);
    params.push(['body', encodeURIComponent(renglones(tipo, idioma, 'correo').map((r) => `${r}:`).join('\r\n') + '\r\n')]);
    return escribirMailto({ destino: correo.destino, params });
  };

  return tramos(html).map(({ texto, editable }) => (!editable ? texto : texto.replace(ETIQUETA, (etiqueta) => {
    const propio = etiqueta.match(/\bdata-prefill="([^"]*)"/);
    const tipo = propio ? propio[1] : PAGINAS[pagina];
    return etiqueta.replace(ATRIBUTO_CONTACTO, (todo, atributo, valor) =>
      `${atributo}="${escaparAttr(armar(desescaparAttr(valor), tipo))}"`);
  }))).join('');
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const p = problemasDe(actual, pagina);
    if (p.length) { problemas.push(...p); continue; }
    const nuevo = prefillHtml(actual, pagina);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`sin los mensajes al día: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`${cambiadas.length} páginas reescritas.`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
