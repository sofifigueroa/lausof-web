/* =============================================================================
   MENÚ DEL SITIO Y SECCIÓN DE CADA PÁGINA — node scripts/menu.mjs [--comprobar]
   -----------------------------------------------------------------------------
   El sitio tiene dos secciones (estructura aprobada el 05/11/2026, opción A:
   web/estructura-sitio-2026-11-05/3a-diseno-estructura.md §3.2 y §3.8):

     · Turismo y traslados  → /turismo.html (hub)
     · Empresas y minería   → /empresas-y-mineria.html (hub), con dos líneas:
                              Personal para minería y Cargas

   Este script es la ÚNICA fuente del menú. Para cada página:
     1. reemplaza el <nav class="main"> de la barra superior por la zona
        <!-- GENERADO:MENU -->: el menú de escritorio (dos desplegables, más
        Nosotros y Contacto), la etiqueta de sección del teléfono y el botón
        «Menú» con su hoja. Todo es <details>/<summary>: funciona sin
        JavaScript; /js/menu.js sólo cierra lo abierto al tocar afuera, con
        Escape o al elegir un enlace.
     2. escribe en <body> los atributos de contexto de la página:
          data-seccion  turismo | empresas | inicio | institucional
          data-linea    personal | cargas   (sólo páginas de empresas)
          data-tipo     el tipo de PAGINAS de scripts/prefill.mjs
        Hoy sólo /js/contacto.js lee data-seccion y data-tipo, para los
        parámetros `seccion` y `tipo` de GA4 (3a §7). Son además el
        enganche que va a usar el asistente del sitio cuando se instale
        (fase W5 de la propuesta). No se agrega ningún script de terceros.
     3. carga /js/menu.js en el <head>, al lado de /js/contacto.js.
     4. en las páginas de turismo y de empresas, escribe en la primera columna
        del pie la zona <!-- GENERADO:CRUCE -->: un solo enlace al hub de la
        otra sección (3a §3.4, reglas T2 y B1). Es, junto con el menú, el
        único camino de turismo a empresas; tests/cruces.test.js lo vigila.

   Los textos salen de 4-textos.md §0.1 y §1.4 (misma carpeta), al pie de la
   letra. Una página a la que el menú apunta y que no existe en un idioma va
   a la página en español con hreflang="es" y la aclaración del idioma, como
   ya hace /pt/ con «(em espanhol)».

   PÁGINA NUEVA: si es de empresas, sumarla a EMPRESAS con su línea; si es
   institucional, a INSTITUCIONAL; si no, queda en turismo. Correr
   `node scripts/menu.mjs` y commitear el HTML. `--comprobar` no escribe nada
   y sale con 1 si alguna página quedó vieja (lo mismo vigila
   tests/menu.test.js).
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { PAGINAS, idiomaDe } from './prefill.mjs';

/* ---- sección de cada página (3a §3.3) ------------------------------------
   Las 14 páginas de empresas y su línea, más los dos hubs de empresas, que
   cubren las dos líneas y por eso no llevan data-linea. */
export const EMPRESAS = {
  'empresas-y-mineria.html': null,
  'en/business-and-mining.html': null,
  'logistica-minera.html': 'personal',
  'transporte-de-personal.html': 'personal',
  'transporte-de-personal-obras-de-litio.html': 'personal',
  'traslados-empresas.html': 'personal',
  'producciones.html': 'personal',
  'en/mining-logistics.html': 'personal',
  'en/personnel-transport.html': 'personal',
  'en/crew-transport-lithium-projects.html': 'personal',
  'en/film-production-logistics.html': 'personal',
  'cargas-refrigeradas.html': 'cargas',
  'deposito-galpon.html': 'cargas',
  'alquiler-autoelevadores.html': 'cargas',
  'en/refrigerated-freight.html': 'cargas',
  'en/warehouse.html': 'cargas',
};

export const PORTADAS = ['index.html', 'en/index.html', 'pt/index.html'];
export const INSTITUCIONAL = ['flota-en-venta.html', 'galeria.html', '404.html', 'en/404.html'];

export function seccionDe(pagina) {
  if (PORTADAS.includes(pagina)) return 'inicio';
  if (INSTITUCIONAL.includes(pagina)) return 'institucional';
  if (pagina in EMPRESAS) return 'empresas';
  return 'turismo';
}

/* ---- textos y destinos del menú, por idioma (4-textos.md §0.1, §1.4) ------
   `es: true` = la página existe sólo en español. */
const HUB_EMPRESAS = '/empresas-y-mineria.html';

export const MENU = {
  es: {
    etiqueta: 'Secciones',
    turismo: {
      titulo: 'Turismo y traslados', chip: 'Turismo', hub: '/turismo.html',
      items: [
        ['Excursiones y traslados', '/turismo.html#circuitos'],
        ['Chile y Bolivia', '/viajes-internacionales.html'],
        ['Fechas y eventos', '/feriados-fines-de-semana-largos.html'],
        ['Grupos y ocasiones', '/turismo.html#eventos'],
        ['Agencias y hoteles', '/agencias-y-hoteles.html'],
        ['4x4 con chofer', '/alquiler-4x4.html#viajeros'],
        ['Aeropuerto', '/traslado-aeropuerto-salta.html'],
      ],
    },
    empresas: {
      titulo: 'Empresas y minería', chip: 'Empresas', hub: HUB_EMPRESAS,
      columnas: [
        ['Personal para minería', [
          ['Transporte de personal', '/transporte-de-personal.html'],
          ['Obras de litio', '/transporte-de-personal-obras-de-litio.html'],
          ['Logística minera', '/logistica-minera.html'],
          ['Traslados corporativos', '/traslados-empresas.html'],
          ['4x4 mensual', '/alquiler-4x4.html#empresas'],
          ['Producciones', '/producciones.html'],
        ]],
        ['Cargas', [
          ['Cargas refrigeradas', '/cargas-refrigeradas.html'],
          ['Depósito y cámara de frío', '/deposito-galpon.html'],
          ['Autoelevadores', '/alquiler-autoelevadores.html'],
          ['Traslado de vehículos', `${HUB_EMPRESAS}#traslado-de-vehiculos`],
          ['Taller', `${HUB_EMPRESAS}#taller`],
        ]],
      ],
    },
    nosotros: ['Nosotros', '/#nosotros'],
    contacto: ['Contacto', '#contacto'],
    verTodo: 'Ver todo', menu: 'Menú', cerrar: 'Cerrar', enEspanol: '',
  },
  en: {
    etiqueta: 'Sections',
    turismo: {
      titulo: 'Tours & transfers', chip: 'Tours', hub: '/en/tours-and-transfers.html',
      items: [
        ['Day trips & transfers', '/en/tours-and-transfers.html#routes'],
        ['Chile & Bolivia', '/en/international-trips.html'],
        ['Dates & events', '/feriados-fines-de-semana-largos.html', true],
        ['Groups & occasions', '/turismo.html#eventos', true],
        ['Agencies & hotels', '/en/ground-transport-for-tour-operators.html'],
        ['4x4 with driver', '/en/4x4-rental.html#travelers'],
        ['Airport', '/en/salta-airport-transfer.html'],
      ],
    },
    empresas: {
      titulo: 'Business & mining', chip: 'Business', hub: '/en/business-and-mining.html',
      columnas: [
        ['Mining crew transport', [
          ['Crew transport', '/en/personnel-transport.html'],
          ['Lithium projects', '/en/crew-transport-lithium-projects.html'],
          ['Mining logistics', '/en/mining-logistics.html'],
          ['Corporate transfers', '/en/business-and-mining.html#corporate-transfers'],
          ['Monthly 4x4', '/en/4x4-rental.html#companies'],
          ['Film productions', '/en/film-production-logistics.html'],
        ]],
        ['Freight', [
          ['Refrigerated freight', '/en/refrigerated-freight.html'],
          ['Warehouse & cold room', '/en/warehouse.html'],
          ['Forklifts', '/en/business-and-mining.html#forklifts'],
          ['Vehicle transfers', '/en/business-and-mining.html#vehicle-transfers'],
          ['Workshop', '/en/business-and-mining.html#workshop'],
        ]],
      ],
    },
    nosotros: ['About', '/en/#about'],
    contacto: ['Contact', '#contact'],
    verTodo: 'See all', menu: 'Menu', cerrar: 'Close', enEspanol: ' (in Spanish)',
  },
  pt: {
    etiqueta: 'Seções',
    turismo: {
      titulo: 'Passeios e traslados', chip: 'Passeios', hub: '/pt/passeios-e-traslados.html',
      items: [
        ['Roteiros', '/pt/passeios-e-traslados.html#circuitos'],
        ['Chile e Bolívia', '/viajes-internacionales.html', true],
        ['Datas e eventos', '/feriados-fines-de-semana-largos.html', true],
        ['Grupos e ocasiões', '/pt/passeios-e-traslados.html#eventos'],
        ['Agências e hotéis', '/pt/passeios-e-traslados.html#agencias'],
        ['4x4 com motorista', '/alquiler-4x4.html#viajeros', true],
        ['Aeroporto', '/pt/passeios-e-traslados.html#detalles'],
      ],
    },
    // El sitio en portugués es sólo turismo (3a §3.1): la sección de empresas
    // es un enlace directo al hub en español, sin desplegable.
    empresas: { titulo: 'Empresas e mineração (em espanhol)', chip: null, hub: HUB_EMPRESAS, es: true },
    nosotros: ['Sobre nós', '/pt/#quem-somos'],
    contacto: ['Contato', '#contato'],
    verTodo: 'Ver tudo', menu: 'Menu', cerrar: 'Fechar', enEspanol: ' (em espanhol)',
  },
};

export const TELEFONO = { href: 'tel:+5493875269009', texto: '387 526-9009' };

/* ---- armado del HTML ------------------------------------------------------ */

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const enlace = ([texto, href, es], t, clase = '') =>
  `<a${clase ? ` class="${clase}"` : ''} href="${href}"${es ? ' hreflang="es"' : ''}>${escapar(texto)}${es ? escapar(t.enEspanol) : ''}</a>`;

const lista = (items, t) => `<ul>${items.map((i) => `<li>${enlace(i, t)}</li>`).join('')}</ul>`;

function panelEmpresas(t) {
  return t.empresas.columnas.map(([titulo, items]) =>
    `<div class="menu-col"><p class="menu-col-titulo">${escapar(titulo)}</p>${lista(items, t)}</div>`).join('');
}

/** La zona GENERADO:MENU de una página. Pura. */
export function zonaMenu(pagina) {
  const idioma = idiomaDe(pagina);
  const t = MENU[idioma];
  const seccion = seccionDe(pagina);
  const actual = (s) => (seccion === s ? ' menu-actual' : '');
  const conDesplegable = !t.empresas.es;

  // Escritorio (≥ 881 px).
  const escritorio = [
    `<nav class="main" aria-label="${t.etiqueta}">`,
    `<details class="menu-grupo${actual('turismo')}"><summary>${escapar(t.turismo.titulo)}</summary>`
      + `<div class="menu-panel">${enlace([t.verTodo, t.turismo.hub], t, 'menu-todo')}${lista(t.turismo.items, t)}</div></details>`,
    conDesplegable
      ? `<details class="menu-grupo${actual('empresas')}"><summary>${escapar(t.empresas.titulo)}</summary>`
        + `<div class="menu-panel menu-panel-doble">${enlace([t.verTodo, t.empresas.hub], t, 'menu-todo')}${panelEmpresas(t)}</div></details>`
      : enlace([t.empresas.titulo, t.empresas.hub, true], { enEspanol: '' }, 'menu-directo'),
    enlace(t.nosotros, t),
    enlace(t.contacto, t),
    '</nav>',
  ];

  // Teléfono (≤ 880 px): etiqueta de sección en las páginas internas y la hoja.
  const seccionPagina = seccion === 'turismo' || seccion === 'empresas' ? t[seccion] : null;
  const chip = seccionPagina && seccionPagina.chip
    ? `<a class="menu-chip" href="${seccionPagina.hub}">${escapar(seccionPagina.chip)}</a>` : '';
  const abierta = (s) => (seccion === s ? ' open' : '');
  const hoja = [
    `<details class="menu-movil"><summary><span class="menu-abrir">${t.menu}</span><span class="menu-cerrar">${t.cerrar} ✕</span></summary>`,
    `<div class="menu-hoja">`,
    `<details class="hoja-seccion"${abierta('turismo')}><summary>${escapar(t.turismo.titulo)}</summary>`
      + `${enlace([t.verTodo, t.turismo.hub], t, 'menu-todo')}${lista(t.turismo.items, t)}</details>`,
    conDesplegable
      ? `<details class="hoja-seccion"${abierta('empresas')}><summary>${escapar(t.empresas.titulo)}</summary>`
        + `${enlace([t.verTodo, t.empresas.hub], t, 'menu-todo')}${panelEmpresas(t)}</details>`
      : `<p class="hoja-enlace">${enlace([t.empresas.titulo, t.empresas.hub, true], { enEspanol: '' })}</p>`,
    `<p class="hoja-enlace">${enlace(t.nosotros, t)}</p>`,
    `<p class="hoja-enlace">${enlace(t.contacto, t)} · <a href="${TELEFONO.href}">${TELEFONO.texto}</a></p>`,
    `</div></details>`,
  ];

  return [
    '<!-- GENERADO:MENU — no editar a mano: editar scripts/menu.mjs y correr `node scripts/menu.mjs` -->',
    ...escritorio,
    ...(chip ? [chip] : []),
    ...hoja,
    '<!-- /GENERADO:MENU -->',
  ].map((l) => `    ${l}`).join('\n');
}

/** Las dos columnas de sección del pie de las portadas (3a §3.1). Pura.
    «Ver todo» va al final de cada columna, después de los servicios
    (Lautaro, 05/11/2026). En el menú de arriba sigue primero. */
export function zonaPie(pagina) {
  const t = MENU[idiomaDe(pagina)];
  const columna = (titulo, cuerpo) => `<div><b>${escapar(titulo)}</b>${cuerpo}</div>`;
  const turismo = columna(t.turismo.titulo, lista([...t.turismo.items, [t.verTodo, t.turismo.hub]], t));
  const empresas = t.empresas.es
    ? columna(t.empresas.titulo.replace(/ \(.*\)$/, ''), lista([[t.empresas.titulo, t.empresas.hub, true]], { enEspanol: '' }))
    : columna(t.empresas.titulo,
      t.empresas.columnas.map(([sub, items]) => `<div><p class="pie-sub">${escapar(sub)}</p>${lista(items, t)}</div>`).join('')
      + lista([[t.verTodo, t.empresas.hub]], t));
  return [
    '<!-- GENERADO:PIE — no editar a mano: editar scripts/menu.mjs y correr `node scripts/menu.mjs` -->',
    `<div class="wrap pie-secciones">${turismo}${empresas}</div>`,
    '<!-- /GENERADO:PIE -->',
  ].map((l) => `  ${l}`).join('\n');
}

/** El enlace del pie al hub de la otra sección (3a §3.4, T2 y B1), o null
    si la página no es de turismo ni de empresas. Pura. */
export function zonaCruce(pagina) {
  const seccion = seccionDe(pagina);
  if (seccion !== 'turismo' && seccion !== 'empresas') return null;
  const t = MENU[idiomaDe(pagina)];
  const otra = t[seccion === 'turismo' ? 'empresas' : 'turismo'];
  // El hub de empresas no existe en portugués: su título ya dice «(em espanhol)».
  const enlaceOtra = enlace([`${otra.titulo} →`, otra.hub, otra.es], { enEspanol: '' });
  return [
    '<!-- GENERADO:CRUCE — no editar a mano: editar scripts/menu.mjs y correr `node scripts/menu.mjs` -->',
    `<p>${enlaceOtra}</p>`,
    '<!-- /GENERADO:CRUCE -->',
  ].map((l) => `      ${l}`).join('\n');
}

/** Los atributos de contexto de <body> para una página. */
export function atributosBody(pagina) {
  const seccion = seccionDe(pagina);
  const attrs = [['data-seccion', seccion]];
  if (seccion === 'empresas' && EMPRESAS[pagina]) attrs.push(['data-linea', EMPRESAS[pagina]]);
  if (PAGINAS[pagina]) attrs.push(['data-tipo', PAGINAS[pagina]]);
  return attrs;
}

const ZONA = /[ \t]*<!-- GENERADO:MENU[\s\S]*?<!-- \/GENERADO:MENU -->/;
const ZONA_PIE = /[ \t]*<!-- GENERADO:PIE[\s\S]*?<!-- \/GENERADO:PIE -->/;
const ZONA_CRUCE = /\n[ \t]*<!-- GENERADO:CRUCE[\s\S]*?<!-- \/GENERADO:CRUCE -->/;
// Fin de la primera columna del pie: ahí va el enlace de cruce.
const PRIMERA_COLUMNA_PIE = /(<footer class="site"[^>]*>\s*<div class="wrap foot-grid">\s*<div>[\s\S]*?)(\n[ \t]*<\/div>\s*<div>\s*<b>)/;
const NAV_VIEJO = /[ \t]*<nav class="main"[\s\S]*?<\/nav>/;
const SCRIPT_MENU = '<script defer src="/js/menu.js?v=1"></script>';
const SCRIPT_CONTACTO = /^([ \t]*)<script defer src="\/js\/contacto\.js\?v=\d+"><\/script>$/m;

/** La página con el menú, los atributos de <body> y el script al día. Pura e idempotente. */
export function conMenu(html, pagina) {
  let nuevo = html.replace(/<body\b[^>]*>/, `<body ${atributosBody(pagina).map(([k, v]) => `${k}="${v}"`).join(' ')}>`);
  if (PORTADAS.includes(pagina)) nuevo = nuevo.replace(ZONA_PIE, () => zonaPie(pagina));
  const cruce = zonaCruce(pagina);
  nuevo = nuevo.replace(ZONA_CRUCE, '');
  if (cruce) {
    if (!PRIMERA_COLUMNA_PIE.test(nuevo)) throw new Error(`${pagina}: no encuentro la primera columna del pie para el enlace a la otra sección`);
    nuevo = nuevo.replace(PRIMERA_COLUMNA_PIE, (_, columna, cierre) => `${columna.replace(/[ \t]+$/, '')}\n${cruce}${cierre}`);
  }
  const tieneMenu = ZONA.test(nuevo) || NAV_VIEJO.test(nuevo);
  if (!tieneMenu) return nuevo;
  nuevo = ZONA.test(nuevo) ? nuevo.replace(ZONA, () => zonaMenu(pagina)) : nuevo.replace(NAV_VIEJO, () => zonaMenu(pagina));
  if (!nuevo.includes(SCRIPT_MENU)) {
    if (!SCRIPT_CONTACTO.test(nuevo)) throw new Error(`${pagina}: no carga /js/contacto.js, no sé dónde poner /js/menu.js`);
    nuevo = nuevo.replace(SCRIPT_CONTACTO, (linea, sangria) => `${linea}\n${sangria}${SCRIPT_MENU}`);
  }
  return nuevo;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conMenu(actual, pagina);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const p of cambiadas) console.log(`menú o sección sin regenerar: ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`${cambiadas.length} páginas reescritas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
