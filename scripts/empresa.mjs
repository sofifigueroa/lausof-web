/* =============================================================================
   FICHA DE LA EMPRESA EN CADA PÁGINA — node scripts/empresa.mjs
   -----------------------------------------------------------------------------
   Todas las páginas referencian la entidad https://www.lausof.com/#empresa por
   su @id (el "provider" de cada Service, el "about" de cada WebPage). Los
   buscadores leen cada página por separado: una referencia a un @id que no
   está definido EN ESA PÁGINA no hereda nada de la portada. Hasta el
   13/10/2026 la ficha completa (teléfono, dirección, CUIT) estaba sólo en
   index.html, y las demás páginas apuntaban a un @id vacío.

   Este script escribe en el <head> de cada página, entre los comentarios
   GENERADO:EMPRESA, un bloque JSON-LD con la ficha de abajo, idéntico en
   todas:

     node scripts/empresa.mjs              escribe el bloque donde falte o haya cambiado
     node scripts/empresa.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide

   La ÚNICA fuente de los datos de la empresa para las páginas es FICHA. La
   portada (index.html) no lleva el bloque generado: su nodo principal es la
   ficha ampliada (descripción, horario, fotos, catálogo), escrita a mano, y
   tests/empresa.test.js exige que cada dato de FICHA figure igual ahí.

   Qué va y qué no (BUILD-BRIEF, política de afirmaciones):
     · Va: razón social, marca, domicilio de la empresa (Junín 1334: no
       recibe clientes, decisión del 03/11/2026), la línea pública
       387 526-9009, el correo público (CORREO), CUIT, y la habilitación CNRT N.º 60284 (verificable en
       consultapme.cnrt.gob.ar), como `identifier` y como `hasCertification`.
     · No va: número de permiso o expediente de AMT, aseguradora, cantidad de
       unidades ni otros teléfonos.

   Por qué hasCertification y no hasCredential: en schema.org el valor de
   hasCredential es el tipo Credential, que sigue en el área "new" (en
   revisión); Certification / hasCertification están publicados y admiten
   Organization (schema.org/hasCertification, schema.org/Credential, leídas el
   13/10/2026). Google documenta legalName, alternateName, taxID, telephone,
   address y logo para Organization, y aclara que alcanza con la portada: que
   esté en todas no molesta y deja resuelta la referencia en cada página
   (developers.google.com/search/docs/appearance/structured-data/organization,
   actualizada el 08/09/2026).
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { paginas as todasLasPaginas } from './rutas-raiz.mjs';

export const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID_EMPRESA = 'https://www.lausof.com/#empresa';

// Correo público de la empresa: el que muestra el sitio, el destinatario de
// cada mailto (scripts/prefill.mjs) y el `email` de esta ficha. Decisión de
// Lautaro del 03/11/2026: transporte@ (es donde se responde), a revisar en un
// mes. La casilla contacto@ sigue existiendo, pero el sitio ya no la ofrece.
export const CORREO = 'transporte@lausof.com';

// Domicilio legal (sede social inscripta) de LAUSOF S.R.L.: BO Salta del
// 17/09/2010 y del 30/10/2015, «Los Perales 22». Es el que exige el aviso de
// privacidad (Res. AAIP 126/2024, Anexo I 3 a); no es la dirección de la
// base (Junín 1334, `address` de FICHA). No va en el JSON-LD.
// Fuente: web/privacidad-2026-11-05/3-diseno.md §2.1.
export const DOMICILIO_LEGAL = 'Los Perales 22, Salta';

export const FICHA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': ID_EMPRESA,
  name: 'Lausof SRL',
  legalName: 'LAUSOF S.R.L.',
  alternateName: 'Lausof Transportes',
  brand: { '@type': 'Brand', name: 'Lausof Transportes' },
  url: 'https://www.lausof.com/',
  logo: 'https://www.lausof.com/assets/logo-horizontal-web.png',
  telephone: '+54-9-387-526-9009',
  email: CORREO,
  taxID: '30-71146774-9',
  foundingDate: '2010',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Junín 1334',
    addressLocality: 'Salta',
    addressRegion: 'Salta',
    postalCode: 'A4400',
    addressCountry: 'AR',
  },
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'CNRT',
    name: 'Habilitación CNRT',
    value: '60284',
  },
  hasCertification: {
    '@type': 'Certification',
    name: 'Habilitación CNRT N.º 60284',
    certificationIdentification: '60284',
    issuedBy: {
      '@type': 'GovernmentOrganization',
      name: 'Comisión Nacional de Regulación del Transporte (CNRT)',
    },
  },
};

const ABRE = '<!-- GENERADO:EMPRESA — no editar a mano: editar scripts/empresa.mjs y correr `node scripts/empresa.mjs` -->';
const CIERRA = '<!-- /GENERADO:EMPRESA -->';
const ZONA = /[ \t]*<!-- GENERADO:EMPRESA[\s\S]*?<!-- \/GENERADO:EMPRESA -->\n?/;

export const bloque = () =>
  `  ${ABRE}\n  <script type="application/ld+json" id="empresa">${JSON.stringify(FICHA)}</script>\n  ${CIERRA}\n`;

// Páginas que llevan el bloque: todas menos la portada (que tiene la ficha
// ampliada), las 404 (no se indexan y no tienen datos estructurados) y el
// archivo de verificación de Google.
// La lista de idiomas (raíz, /en/, /pt/) vive en scripts/rutas-raiz.mjs.
export function paginas() {
  return todasLasPaginas().filter((f) => f !== 'index.html' && !f.endsWith('404.html')).sort();
}

// La página con el bloque al día, justo antes de </head>; si la vitrina
// (tienda-v2-0611:scripts/tienda.mjs, ponerZonas) ya puso ahí su zona TIENDA
// «estilos», justo antes de esa zona, así las dos quedan quietas al
// regenerar. Pura e idempotente.
const ESTILOS_TIENDA = /[ \t]*<!-- GENERADO:TIENDA estilos -->/;
export function conFicha(html) {
  const sin = html.replace(ZONA, '');
  const fin = sin.indexOf('</head>');
  if (fin < 0) throw new Error('la página no tiene </head>');
  const estilos = sin.search(ESTILOS_TIENDA);
  const i = estilos >= 0 && estilos < fin ? estilos : fin;
  return sin.slice(0, i) + bloque() + sin.slice(i);
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = path.join(raiz, pagina);
    const actual = fs.readFileSync(ruta, 'utf8');
    const nuevo = conFicha(actual);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) fs.writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const p of cambiadas) console.log(`desactualizada ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`empresa: ${cambiadas.length} página(s) reescrita(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}

/* =============================================================================
   DATOS DE LOS BLOQUES COMPARTIDOS (ronda 1 de lausof.com, 08/11/2026)
   -----------------------------------------------------------------------------
   La franja de habilitaciones, el bloque de cierre, el pie de contacto y la
   barra del teléfono se generan con scripts/bloques.mjs a partir de estos
   datos (y de scripts/bloques-datos.mjs, lo propio de cada página). Hasta el
   07/11/2026 estaban copiados a mano en cada página: 39 versiones de la franja
   y 28 del pie (rondas-2026-11-07/2-estado-actual.md, W2 y W11). Cambiar un
   dato acá y correr `node scripts/bloques.mjs` lo cambia en todas.

   Mismas reglas que FICHA: sin número de AMT, sin aseguradora, sin cantidad
   de unidades, un solo teléfono (526-9009; el de ventas sólo en la flota en
   venta) y un solo correo (CORREO, sin copia).
   ============================================================================= */

const tel = FICHA.telephone.replace(/-/g, '');          // +5493875269009
export const WA_EMPRESA = tel.slice(1);                  // 5493875269009
// La línea de ventas de unidades (decisión del 28/08/2026): sólo en flota-en-venta.
export const WA_VENTAS = { numero: '5493875092489', texto: '387 509-2489' };

// Puntaje público del perfil de Google, leído con la Places API el 03/11/2026
// (sweep-2026-11-03/06-listings.md). Se muestra como texto con enlace al
// perfil; nunca como marcado de reseñas (tests/resenas.test.js).
export const RESENAS_GOOGLE = {
  url: 'https://www.google.com/maps?cid=13700114490953273065',
  puntaje: 4.9,
  cantidad: 9,
  fecha: '2026-11-03',
};
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** «4,9 de 5, con 9 reseñas (03/11/2026)» en el idioma pedido: un solo dato, tres idiomas. */
export function datoResenas(idioma) {
  const { puntaje, cantidad, fecha } = RESENAS_GOOGLE;
  const [a, m, d] = fecha.split('-');
  if (idioma === 'en') return `${puntaje.toFixed(1)} out of 5 from ${cantidad} reviews (${MESES_EN[Number(m) - 1]} ${Number(d)}, ${a})`;
  const coma = puntaje.toFixed(1).replace('.', ',');
  return idioma === 'pt' ? `${coma} de 5, com ${cantidad} avaliações (${d}/${m}/${a})` : `${coma} de 5, con ${cantidad} reseñas (${d}/${m}/${a})`;
}

const CUIT = FICHA.taxID;
const CNRT = FICHA.identifier.value;
const RESENA = { resena: true };

/* La franja de habilitaciones, por familia de página y por idioma. Cada
   renglón es [negrita, resto], un texto llano (las portadas) o RESENA. Ningún
   reclamo que el cliente busca se cae al unificar (1b A7): CNRT, AMT, agencia
   de turismo, seguro, ART y RTO están en las familias que los llevaban. */
export const FRANJAS = {
  pasajeros: {
    es: { rotulo: 'Habilitaciones', items: [
      ['Habilitación CNRT', ` N.º ${CNRT}`],
      ['Habilitación AMT', ' para el transporte dentro de Salta'],
      ['Agencia de turismo', ' habilitada'],
      ['Seguro de pasajeros', ' vigente'],
      ['Choferes profesionales', ' con psicofísico y ART al día'],
      ['Factura A o B', ` — CUIT ${CUIT}`],
      ['Empresa familiar', ' desde 2010'],
      RESENA] },
    en: { rotulo: 'Licenses and credentials', items: [
      [`CNRT license No. ${CNRT}`, ', the national road-transport regulator'],
      ['AMT permit', ', passenger transport within Salta province'],
      ['Licensed tourism agency', ' (agencia de turismo)'],
      ['Passenger insurance', ' in force'],
      ['Professional drivers', " with current medical fitness and workers' compensation (ART)"],
      ['Factura A or B', `, the Argentine tax invoice. CUIT ${CUIT}`],
      ['Family-owned', ', passenger transport since 2010'],
      RESENA] },
    pt: { rotulo: 'Habilitações', items: [
      ['Habilitação CNRT', ` nº ${CNRT}`],
      ['Habilitação AMT', ' para o transporte dentro de Salta'],
      ['Agência de turismo', ' habilitada'],
      ['Seguro de passageiros', ' em dia'],
      ['Motoristas profissionais', ' com exame psicofísico e seguro de acidentes de trabalho (ART) em dia'],
      ['Nota fiscal argentina', ` — CUIT ${CUIT}`],
      ['Empresa familiar', ' desde 2010'],
      RESENA] },
  },
  empresas: {
    es: { rotulo: 'Habilitaciones', items: [
      ['Habilitación CNRT', ` N.º ${CNRT} — viajes entre provincias`],
      ['Habilitación AMT', ' para el transporte dentro de Salta'],
      ['Seguro de carga y pasajeros', ' vigente'],
      ['Choferes profesionales', ' con psicofísico y ART al día'],
      ['Unidades en servicio', ' con revisión técnica (RTO) y seguro vigentes'],
      ['GPS', ' en las unidades en servicio'],
      ['Factura A', ` — CUIT ${CUIT}`],
      RESENA] },
    en: { rotulo: 'Licenses and compliance', items: [
      [`CNRT license No. ${CNRT}`, " — Argentina's national road-transport regulator, interprovincial"],
      ['AMT permit', ' — passenger transport within Salta province'],
      ['Cargo and passenger insurance', ' in force'],
      ['Professional drivers', " with current medical fitness and workers' compensation (ART)"],
      ['Units in service', ' with the mandatory technical inspection (RTO) and insurance in force'],
      ['GPS', ' on the units in service'],
      ['Factura A', ` (Argentine tax invoice) — CUIT ${CUIT}`],
      RESENA] },
  },
  // Las portadas: renglones cortos, sin negrita (portadas.test.js).
  portada: {
    es: { clase: 'certs prueba', rotulo: 'Habilitaciones', items: ['Salidas de madrugada', `CNRT ${CNRT}`, 'AMT', 'Agencia de turismo habilitada', 'Viajes internacionales', 'Factura A', 'Flota y taller propios'] },
    en: { clase: 'certs prueba', rotulo: 'Licenses and credentials', items: ['Dawn departures', `CNRT ${CNRT}`, 'AMT', 'Licensed tourism agency', 'International trips', 'Factura A (tax invoice)', 'Own fleet and workshop'] },
    pt: { clase: 'certs prueba', rotulo: 'Habilitações', items: ['Saídas de madrugada', `CNRT ${CNRT}`, 'AMT (Salta)', 'Agência de turismo habilitada', 'Viagens internacionais', 'Frota e oficina próprias'] },
  },
  // La 4x4 y los autoelevadores muestran datos del servicio en la franja.
  camioneta: {
    es: { rotulo: 'Respaldo', items: [
      ['Con chofer', ' para viajeros, por mes para empresas'],
      ['Camionetas 4x4', ' preparadas para ripio y altura'],
      ['Mantenimiento', ' en taller propio'],
      ['GPS', ' en las unidades en servicio'],
      ['Más de una década', ' operando en la Puna'],
      ['Facturamos A', ` — CUIT ${CUIT}`]] },
    en: { rotulo: 'Credentials', items: [
      ['With a driver', ' for travelers, monthly for companies'],
      ['4x4 pickups', ' prepared for gravel and altitude'],
      ['Maintenance', ' included in the rental'],
      ['GPS', ' on the units in service'],
      ['More than a decade', ' working in the Puna'],
      ['Factura A', ` (Argentine tax invoice) — CUIT ${CUIT}`]] },
  },
  autoelevador: {
    es: { rotulo: 'Datos del servicio', items: [
      ['3 y 4 toneladas', ' de capacidad de carga'],
      ['Mástil de 4,5 metros', ' con torres desplazables'],
      ['Con o sin operador', ', por jornada o por período'],
      ['Factura A', ` — CUIT ${CUIT}`]] },
  },
};

/* Textos del pie de contacto, del cierre y de la barra, por idioma. Los
   rótulos de la barra de empresas (Llamar · Mail · WhatsApp) los fija
   tests/menu.test.js. */
export const TEXTOS_BLOQUES = {
  es: {
    pie: 'Transporte y logística en Salta y el norte argentino.<br>Junín 1334 / Siria 1333 — Salta Capital (4400)',
    telefonos: 'Teléfonos', telefono: '387 526-9009', llamadasY: 'llamadas y', correo: 'Correo', notasTelefono: [],
    flotaEnVenta: '<a href="/flota-en-venta.html">Flota en venta →</a>',
    barra: 'Acciones rápidas', llamar: 'Llamar', mail: 'Mail', barraWa: 'Cotizar por WhatsApp',
    cierreWa: 'Consultar por WhatsApp', cierreCorreo: 'Escribir por correo', cierreNota: null,
  },
  en: {
    pie: 'Transport and logistics in Salta and northwest Argentina.<br>Junín 1334 / Siria 1333 — Salta (A4400), Argentina',
    telefonos: 'Phone', telefono: '+54 9 387 526-9009', llamadasY: 'calls and', correo: 'Email',
    notasTelefono: ['Argentine mobile numbers include a 9 after the country code when dialed from abroad.'],
    flotaEnVenta: null,
    barra: 'Quick actions', llamar: 'Call', mail: 'Email', barraWa: 'WhatsApp',
    cierreWa: 'Message us on WhatsApp', cierreCorreo: 'Request a quote by email',
    // Ya estaba en 22 cierres y pies en inglés (plan C.7): promete lo que se
    // cumple (correo y WhatsApp en inglés) y no repite el teléfono ni el correo,
    // que están en los botones de al lado.
    cierreNota: 'We reply in English by email or WhatsApp. Phone calls are answered in Spanish.',
  },
  pt: {
    pie: 'Transporte e logística em Salta e no norte da Argentina.<br>Junín 1334 / Siria 1333 — Salta Capital (4400), Argentina',
    telefonos: 'Telefone', telefono: '387 526-9009', llamadasY: 'ligações e', correo: 'E-mail', notasTelefono: [],
    flotaEnVenta: null,
    barra: 'Ações rápidas', llamar: 'Ligar', mail: 'E-mail', barraWa: 'Consultar disponibilidade',
    cierreWa: 'Consultar pelo WhatsApp', cierreCorreo: 'Escrever por e-mail', cierreNota: null,
  },
};
export const REDES = 'Instagram <a href="https://www.instagram.com/lausofsrl" target="_blank" rel="noopener">@lausofsrl</a> · Facebook <a href="https://www.facebook.com/lausoftransportes" target="_blank" rel="noopener">@lausoftransportes</a>';
export const TEL_HREF = `tel:${tel}`;
