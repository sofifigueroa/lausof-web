// Hub «Empresas y minería» (estructura del sitio aprobada el 05/11/2026,
// ~/lausof/web/estructura-sitio-2026-11-05/: diseño 3a §3.3 y §3.6.1, textos
// 4 §2, decisiones en DECISION-2026-11-05.md).
//   - Una página por idioma: /empresas-y-mineria.html y
//     /en/business-and-mining.html. El sitio en portugués es sólo de turismo:
//     no hay hub pt (la portada pt enlaza el hub en español).
//   - Orden de las líneas, donde aparezca un orden: Turismo y traslados ·
//     Personal para minería · Cargas. El hub no muestra turismo: Personal
//     primero, Cargas después.
//   - Las 14 páginas de la sección llevan la miga Inicio › Empresas y minería ›
//     Personal para minería | Cargas › página, visible y en JSON-LD.
// Las guardias de todo el sitio (palabras vedadas, flota sin dimensionar,
// teléfonos, registro, castellano residual, hreflang recíproco del mapa de
// pares) ya alcanzan al hub; acá va lo propio de esta página.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, paresPt, sitemap, redirects, urlDe, sinComentarios, DOMINIO,
  ASUNTO_FLOTA, PANEL_FLOTA, PORTALES } = require('./util.js');

const raiz = path.join(__dirname, '..');
const ES = 'empresas-y-mineria.html';
const EN = 'en/business-and-mining.html';
const HUBS = [ES, EN];

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

const main = (html) => sinComentarios(html).match(/<main>([\s\S]*?)<\/main>/)[1];
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap((m) => { const d = JSON.parse(m[1]); return d['@graph'] || [d]; });

// Un elemento completo (de su etiqueta de apertura a su cierre), contando los
// <div> anidados. `apertura` es el texto exacto de la etiqueta.
const bloqueDiv = (html, apertura) => {
  const desde = html.indexOf(apertura);
  if (desde < 0) return null;
  const etiquetas = /<\/?div\b[^>]*>/g;
  etiquetas.lastIndex = desde;
  let nivel = 0;
  for (let m; (m = etiquetas.exec(html));) {
    nivel += m[0].startsWith('</') ? -1 : 1;
    if (nivel === 0) return html.slice(desde, m.index + m[0].length);
  }
  return null;
};

// Servicio «Documentación de ingreso» (fila 21 de LAUTARO-2026-11-05-noche.md;
// ~/lausof/web/servicio-documentacion-2026-11-05/, 3-diseno §4, alcance D6B).
// Las reglas viven en funciones para poder probarlas también contra páginas
// rotas a propósito (el control en rojo, más abajo).
const APERTURA_PANEL = (id) => `<div class="docs docs-servicio" id="${id}">`;
const panelServicio = (html, id) => bloqueDiv(sinComentarios(html), APERTURA_PANEL(id));
const PORTAL_RE = new RegExp(`\\b(${PORTALES.join('|')})\\b`, 'i');
// Palabras de Apacheta o de un producto de software (Lautaro 24/10 y 31/10:
// Lausof y Apacheta no se mezclan; 3-diseno §2.4).
const VEDADAS_APACHETA = /apacheta|plataforma|sistema|software|\bapps?\b|aplicaci[oó]n|autom[aá]tic|automatizad|sincroniz|integraci[oó]n|\bIA\b|\bAI\b|alertas?\b|\bpanel\b|tablero|tiempo real|carg[aá] una vez|un papel, todos los portales|platform|\bsystems?\b|automat|\bsync|integrat|alerts?\b|dashboard|real[- ]time|upload once/i;
// Promesas sobre el ingreso a mina (dos bloqueos en 8 semanas están en el
// registro; DNU 274/2019).
const VEDADAS_RESULTADO = /sin bloqueos|cero rechazos|garantiz|asegur\w* el ingreso|without (any )?blocks|guarantee|zero rejections/i;
// Socios, certificaciones u homologaciones que no existen. «Certificado de
// ART» es un papel del personal (D6B) y no cuenta.
const VEDADAS_SOCIOS = /partner|\bsocios?\b|aliad|homologad|certificad(?![oa] de ART)|aprobad\w* por|integrad|oficial|todas las plataformas|every platform|all platforms|certified|certification|approved by|official|endorsed/i;

/** Lanza si el hub rompe alguna regla del servicio. `html` es la página entera. */
function reglasServicio(html, idioma) {
  const id = PANEL_FLOTA[idioma];
  const panel = panelServicio(html, id);
  assert.ok(panel, `falta el panel #${id}`);
  const enPanel = visible(panel);
  // Los portales: cada uno exactamente una vez en el panel, y en ningún otro
  // lugar visible de la página (head incluido).
  for (const portal of PORTALES) {
    assert.strictEqual((enPanel.match(new RegExp(`\\b${portal}\\b`, 'gi')) || []).length, 1, `#${id}: ${portal} tiene que ir una vez`);
  }
  const resto = sinComentarios(html).replace(panel, ' ');
  assert.doesNotMatch(resto, PORTAL_RE, 'un portal nombrado fuera del panel del servicio (texto, atributos, head o JSON-LD)');
  // La nota de marcas, con la no asociación (CSJN 19/12/2024, 1 §3.1).
  const nota = panel.match(/<p class="nota-marcas">([^<]+)<\/p>/);
  assert.ok(nota, `#${id}: falta la nota de marcas (.nota-marcas)`);
  assert.match(nota[1], idioma === 'es' ? /sin asociación con Lausof/ : /not affiliated with Lausof/);
  assert.doesNotMatch(panel, /<a\b[^>]*href="https?:\/\/(?!wa\.me\/)/, `#${id}: los portales no se enlazan`);
  assert.doesNotMatch(panel, /<img\b/, `#${id}: sin logos`);
  assert.doesNotMatch(enPanel, VEDADAS_APACHETA, `#${id}: palabras de Apacheta o de software`);
  assert.doesNotMatch(enPanel, VEDADAS_RESULTADO, `#${id}: promesa sobre el ingreso`);
  assert.doesNotMatch(enPanel, VEDADAS_SOCIOS, `#${id}: socios o certificaciones que no existen`);
}

// Lo que el diseño fija para cada idioma: anclas, grupos y destinos.
const DISENO = {
  [ES]: {
    h1: 'Transporte de personal y cargas para minería y empresas',
    grupos: [['personal', 'Personal para minería'], ['cargas', 'Cargas']],
    secciones: ['servicios', 'seguridad', 'equipamiento', 'como-trabajamos', 'documentacion', 'contacto'],
    pruebas: ['CNRT 60284', 'AMT', 'Todas las zonas mineras', '24 h',
      'CUIT · Factura A', 'Flota y taller propios', 'Desde 2010', 'Viajes internacionales'],
    enlacesPrueba: { 'Todas las zonas mineras': '/logistica-minera.html#zonas', 'Flota y taller propios': '#equipamiento' },
    practicas: ['Unidades equipadas para ingreso a mina', 'Libro de a bordo por unidad',
      'Reporte de incidentes firmado por el chofer', 'Tolerancia cero', 'Mantenimiento preventivo documentado',
      'Choferes con licencia profesional', 'Seguro vigente'],
    unidades: ['Camionetas 4x4 equipadas para ingreso a mina', 'Combis 19+1 plazas', 'Camiones térmicos con equipo de frío',
      'Camión 4x4 refrigerado', 'Camiones de carga general', 'Comunicación'],
    fichas: {
      personal: [['Transporte de personal', '/transporte-de-personal.html'],
        ['Obras de litio', '/transporte-de-personal-obras-de-litio.html'], ['Logística minera', '/logistica-minera.html'],
        ['Traslados corporativos', '/traslados-empresas.html'], ['4x4 mensual', '/alquiler-4x4.html#empresas'],
        ['Documentación de ingreso', '#documentacion-flota'], ['Producciones', '/producciones.html']],
      cargas: [['Cargas refrigeradas', '/cargas-refrigeradas.html'], ['Depósito y cámara de frío', '/deposito-galpon.html'],
        ['Autoelevadores', '/alquiler-autoelevadores.html'], ['Traslado de vehículos', null], ['Taller', null]],
    },
  },
  [EN]: {
    h1: 'Crew transport and freight for mining and business',
    grupos: [['crew', 'Mining crew transport'], ['freight', 'Freight']],
    secciones: ['services', 'safety', 'equipment', 'how-we-work', 'documents', 'contact'],
    pruebas: ['CNRT 60284 · interprovincial', 'AMT', 'Every mining area', '24/7',
      'Tax ID · Factura A', 'Own fleet and workshop', 'Since 2010', 'International trips'],
    enlacesPrueba: { 'Every mining area': '/en/mining-logistics.html#areas', 'Own fleet and workshop': '#equipment' },
    practicas: ['Units fitted out for mine-site entry', 'On-board trip log per unit', 'Incident reports signed by the driver',
      'Zero tolerance', 'Documented preventive maintenance', 'Drivers with a professional license', 'Insurance in force'],
    unidades: ['4x4 pickups equipped for mine-site entry', '19-seat minibuses', 'Refrigerated trucks with refrigeration units',
      '4x4 refrigerated truck', 'General freight trucks', 'Communications'],
    fichas: {
      crew: [['Crew transport', '/en/personnel-transport.html'], ['Lithium projects', '/en/crew-transport-lithium-projects.html'],
        ['Mining logistics', '/en/mining-logistics.html'], ['Corporate transfers', null],
        ['Monthly 4x4', '/en/4x4-rental.html#companies'], ['Mine entry documents', '#fleet-documents'],
        ['Film productions', '/en/film-production-logistics.html']],
      freight: [['Refrigerated freight', '/en/refrigerated-freight.html'], ['Warehouse & cold room', '/en/warehouse.html'],
        ['Forklifts', null], ['Vehicle transfers', null], ['Workshop', null]],
    },
  },
};

// Las 14 páginas de la sección y la línea de cada una (3a §3.3, 4 §2.3).
const SECCION = {
  'logistica-minera.html': 'personal', 'transporte-de-personal.html': 'personal',
  'transporte-de-personal-obras-de-litio.html': 'personal', 'traslados-empresas.html': 'personal',
  'producciones.html': 'personal', 'cargas-refrigeradas.html': 'cargas', 'deposito-galpon.html': 'cargas',
  'alquiler-autoelevadores.html': 'cargas', 'en/mining-logistics.html': 'personal',
  'en/personnel-transport.html': 'personal', 'en/crew-transport-lithium-projects.html': 'personal',
  'en/film-production-logistics.html': 'personal', 'en/refrigerated-freight.html': 'cargas', 'en/warehouse.html': 'cargas',
};

test('el hub existe en español y en inglés, con par, sitemap, 301 y canónica; no hay hub en portugués', () => {
  assert.strictEqual(pares[ES], EN, 'el hub no está en el mapa de pares');
  assert.ok(!paresPt[ES], 'el sitio pt es sólo de turismo: el hub no lleva gemela pt');
  for (const n of HUBS) {
    assert.ok(paginas[n], `falta ${n}`);
    assert.ok(paginas[n].includes(`<link rel="canonical" href="${urlDe(n)}">`), `${n}: canónica`);
    assert.match(sitemap, new RegExp(`<loc>${urlDe(n).replace(/[./]/g, '\\$&')}</loc>\\s*<lastmod>`), `${n} no está en el sitemap`);
    const desde = `/${n.replace(/\.html$/, '')}`;
    assert.match(redirects, new RegExp(`^${desde}\\s+/${n.replace(/[./]/g, '\\$&')}\\s+301!$`, 'm'), `falta el 301 de ${desde}`);
  }
  assert.ok(!fs.readdirSync(path.join(raiz, 'pt')).some((f) => /empresa|business|mineracao/.test(f)), 'apareció un hub pt');
});

test('hreflang recíproco: es, en y x-default al español, idéntico en las dos páginas, sin pt', () => {
  const bloque = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
    .map((m) => `${m[1]} ${m[2]}`).sort();
  const esperado = [`en ${urlDe(EN)}`, `es ${urlDe(ES)}`, `x-default ${urlDe(ES)}`];
  for (const n of HUBS) assert.deepStrictEqual(bloque(paginas[n]), esperado, n);
});

for (const nombre of HUBS) {
  const html = paginas[nombre];
  const d = DISENO[nombre];
  const cuerpo = main(html);
  const texto = visible(html);

  test(`${nombre}: H1 aprobado y las secciones en el orden del diseño (3a §3.6.1)`, () => {
    assert.strictEqual(html.match(/<h1>([^<]+)<\/h1>/)[1], d.h1);
    const pos = (marca) => cuerpo.indexOf(marca);
    const orden = ['class="crumbs', '<h1>', 'class="prueba"', ...d.secciones.map((id) => `id="${id}"`)];
    for (const marca of orden) assert.ok(pos(marca) >= 0, `${nombre}: falta ${marca}`);
    for (let i = 1; i < orden.length; i++) {
      assert.ok(pos(orden[i - 1]) < pos(orden[i]), `${nombre}: ${orden[i - 1]} tiene que ir antes que ${orden[i]}`);
    }
  });

  test(`${nombre}: las ocho pruebas en el orden de compras, «Viajes internacionales» al final`, () => {
    const items = [...cuerpo.match(/<ul class="prueba-grid">([\s\S]*?)<\/ul>/)[1].matchAll(/<li><b>([\s\S]*?)<\/b>/g)]
      .map((m) => m[1]);
    assert.deepStrictEqual(items.map((b) => b.replace(/<[^>]+>/g, '')), d.pruebas);
    for (const [rotulo, destino] of Object.entries(d.enlacesPrueba)) {
      assert.ok(items.includes(`<a href="${destino}">${rotulo}</a>`), `${nombre}: «${rotulo}» no enlaza a ${destino}`);
    }
  });

  test(`${nombre}: Personal para minería antes que Cargas, sin líneas de turismo en el cuerpo`, () => {
    const [[idA, tituloA], [idB, tituloB]] = d.grupos;
    const a = cuerpo.indexOf(`<div id="${idA}">`);
    const b = cuerpo.indexOf(`<div id="${idB}">`);
    assert.ok(a >= 0 && b > a, `${nombre}: el orden tiene que ser ${tituloA} · ${tituloB}`);
    assert.ok(cuerpo.includes(`<h2>${tituloA}</h2>`) && cuerpo.includes(`<h2>${tituloB.replace('&', '&amp;')}</h2>`));
    assert.doesNotMatch(visible(cuerpo), /Turismo y traslados|Tours & transfers|Excursiones|Day trips/, 'el hub no ofrece turismo');
  });

  test(`${nombre}: cada ficha de servicio en su grupo y con su destino`, () => {
    for (const [id, fichas] of Object.entries(d.fichas)) {
      const grupo = cuerpo.match(new RegExp(`<div id="${id}">([\\s\\S]*?)<\\/div>\\s*<\\/div>`))[1];
      const vistas = [...grupo.matchAll(/<(a|div) class="ficha-linea"(?: href="([^"]+)")?[^>]*><b>([^<]+)<\/b>/g)]
        .map((m) => [m[3].replace(/&amp;/g, '&'), m[2] || null]);
      assert.deepStrictEqual(vistas, fichas, `${nombre}: grupo ${id}`);
    }
  });

  test(`${nombre}: Seguridad con las siete prácticas y Equipamiento con tipos de unidad, en el orden de la portada`, () => {
    const seg = cuerpo.match(/<section class="block alt" id="(?:seguridad|safety)">([\s\S]*?)<\/section>/)[1];
    assert.deepStrictEqual([...seg.matchAll(/<div class="why-item"><b>([^<]+)<\/b>/g)].map((m) => m[1]), d.practicas);
    const eq = cuerpo.match(/<section class="block" id="(?:equipamiento|equipment)">([\s\S]*?)<\/section>/)[1];
    assert.deepStrictEqual([...eq.matchAll(/<th scope="row">([^<]+)<\/th>/g)].map((m) => m[1]), d.unidades);
  });

  test(`${nombre}: nada de lo vedado (cantidades, otro teléfono, aseguradora, AMT con número, clientes, precios, marcado de eventos o reseñas)`, () => {
    // Un solo número público: 526-9009, en tel:, wa.me y el texto.
    for (const [, numero] of html.matchAll(/(?:tel:\+|wa\.me\/)(\d+)/g)) assert.strictEqual(numero, '5493875269009');
    const telefonos = texto.match(/\b\d{3}\s?\d{3}-\d{4}\b|\b\d{3}-\d{4}\b/g) || [];
    for (const t of telefonos) assert.match(t, /526-9009$/, `${nombre}: otro teléfono «${t}»`);
    assert.doesNotMatch(texto, /aseguradora|insurer|san crist[oó]bal|p[oó]liza|policy no|cobertura de \$|coverage of/i);
    assert.doesNotMatch(texto, /\bAMT\b[^.]{0,30}(N\.?[º°o]|No\.|#|n[uú]mero|permit no)\s*\d/i);
    assert.doesNotMatch(texto, /(US\$|USD|ARS|\$\s?\d|€)/, 'precio publicado');
    assert.doesNotMatch(texto, /\b\d+\s+(unidades|veh[ií]culos|camiones|camionetas|combis|choferes|units|vehicles|trucks|pickups|minibuses|drivers)\b/i);
    assert.doesNotMatch(texto, /rio\s*tinto|\beramet\b|\bposco\b|\bganfeng\b|\bgal[aá]n\b|\blivent\b|\bclientes? como\b|our clients/i);
    // Desde el 05/11/2026 (fila 21) los portales se nombran sólo en el panel
    // del servicio (la prueba de abajo); las certificaciones, en ningún lado.
    assert.doesNotMatch(texto, /\bISO\s?9001\b|\bIRAM\b/i, 'sin certificaciones (4 §2.3, 3a §3.6)');
    assert.doesNotMatch(texto, /respondemos en|en menos de \d|within \d+ (hours|minutes)|same business day|en el día/i,
      'sin promesa de tiempo de respuesta (3a §3.6)');
    const tipos = JSON.stringify(jsonLd(html).map((n) => n['@type']));
    assert.doesNotMatch(tipos, /Event|Review|AggregateRating|Offer|FAQPage/);
    assert.doesNotMatch(html, /apacheta/i, 'el widget de Apacheta no va todavía');
  });

  // Revisión de Lautaro del 05/11/2026 (noche, filas 1–3): el héroe ya no
  // lleva «Solicitar documentación de proveedor»; el pedido vive sólo en la
  // sección de documentación, que dice en claro que Lausof manda SU
  // documentación para el alta de proveedor. Nada de «tarifario del
  // cliente». Desde la fila 21 la misma sección lleva además, primero, el
  // panel del servicio (papeles de vehículos y personal de contratistas en
  // los portales de las mineras), con sus propios botones y asunto.
  test(`${nombre}: dos caminos de contacto en el héroe, y el pedido de documentación sólo en su sección`, () => {
    const head = cuerpo.match(/<section class="page-head hub-head"[\s\S]*?<\/section>/)[0];
    assert.strictEqual((head.match(/<a class="btn/g) || []).length, 2);
    assert.match(head, /href="https:\/\/wa\.me\/5493875269009\?text=/);
    assert.strictEqual((head.match(/href="mailto:transporte@lausof\.com\?/g) || []).length, 1);
    assert.doesNotMatch(head, /data-prefill="proveedor"/, 'el pedido de documentación volvió al héroe');
    const asunto = nombre === ES ? 'Documentaci%C3%B3n%20para%20alta%20de%20proveedor' : 'Supplier%20registration%20%E2%80%94%20Lausof%20documents';
    const docs = cuerpo.match(/<section class="block" id="(?:documentacion|documents)">([\s\S]*?)<\/section>/)[1];
    assert.strictEqual((cuerpo.match(/data-prefill="proveedor"/g) || []).length, 1, 'un solo pedido de documentación');
    assert.ok(docs.includes(`mailto:transporte@lausof.com?subject=${asunto}&amp;body=`), 'falta el pedido de documentación');
    assert.match(visible(docs), nombre === ES ? /dar de alta a Lausof como proveedor/ : /register Lausof as a supplier/);
    assert.doesNotMatch(texto, /tarifario|rate sheet|documentaci[oó]n de proveedor|supplier documents|portal del contratista|contractor's portal/i,
      'frases que Lautaro no entendió (05/11 noche)');
    const barra = html.match(/<div class="wa-bar tres"[\s\S]*?<\/div>/)[0];
    assert.deepStrictEqual([...barra.matchAll(/href="(tel|mailto|https:\/\/wa)/g)].map((m) => m[1]), ['tel', 'mailto', 'https://wa']);
  });

  const idioma = nombre === ES ? 'es' : 'en';
  const idPanel = PANEL_FLOTA[idioma];

  test(`${nombre}: el servicio «Documentación de ingreso» nombra los portales sólo en su panel, con la nota de marcas y sin palabras vedadas`, () => {
    reglasServicio(html, idioma);
  });

  test(`${nombre}: la sección de documentación lleva dos paneles, el servicio primero y el alta de proveedor después`, () => {
    const docs = sinComentarios(cuerpo).match(/<section class="block" id="(?:documentacion|documents)">([\s\S]*?)<\/section>/)[1];
    assert.match(docs, new RegExp(`<p class="kicker">${idioma === 'es' ? 'Documentación' : 'Documents'}</p>\\s*<div class="docs-par">`));
    const par = bloqueDiv(docs, '<div class="docs-par">');
    const paneles = [...par.matchAll(/<div class="docs(?: [^"]*)?"(?: id="([^"]+)")?>/g)].map((m) => m[1] || 'alta');
    assert.deepStrictEqual(paneles, [idPanel, 'alta'], 'el servicio primero, el alta de proveedor al lado');
    const h2 = [...par.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1].replace(/&#39;/g, "'"));
    assert.deepStrictEqual(h2, idioma === 'es'
      ? ['Documentación de vehículos y personal de empresas contratistas', 'Documentación para el alta de proveedor']
      : ["Documents for contractors' vehicles and crew", 'Documents for supplier registration'], 'cada H2 dice de quién son los papeles');
    // La ficha del grupo baja al panel.
    assert.ok(cuerpo.includes(`<a class="ficha-linea" href="#${idPanel}">`), 'la ficha no baja al panel');
  });

  test(`${nombre}: el panel del servicio tiene un WhatsApp y un mail propios; el héroe no`, () => {
    const panel = panelServicio(html, idPanel);
    const head = cuerpo.match(/<section class="page-head hub-head"[\s\S]*?<\/section>/)[0];
    assert.doesNotMatch(head, /data-prefill="documentacion-flota"/, 'el servicio no va en el héroe');
    const enlaces = [...panel.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
    assert.strictEqual(enlaces.length, 2, 'dos botones en el panel');
    assert.strictEqual(enlaces.filter((a) => a.includes('href="https://wa.me/5493875269009?text=')).length, 1);
    assert.strictEqual(enlaces.filter((a) => a.includes('href="mailto:transporte@lausof.com?')).length, 1);
    for (const a of enlaces) assert.match(a, /data-prefill="documentacion-flota"/, `sin el tipo del servicio: ${a}`);
    assert.strictEqual((sinComentarios(html).match(/data-prefill="documentacion-flota"/g) || []).length, 2, 'el tipo del servicio fuera del panel');
    const asunto = `subject=${encodeURIComponent(ASUNTO_FLOTA[idioma])}&amp;`;
    assert.ok(panel.includes(asunto), `el mail del panel no lleva el asunto «${ASUNTO_FLOTA[idioma]}»`);
    assert.strictEqual(sinComentarios(html).split(asunto).length - 1, 1, 'el asunto del servicio aparece fuera del panel');
    const rotulos = [...panel.matchAll(/<a\b[^>]*>(?:[\s\S]*?<\/svg>)?([^<]+)<\/a>/g)].map((m) => m[1]);
    assert.deepStrictEqual(rotulos, idioma === 'es' ? ['Consultar por WhatsApp', 'Consultar por mail'] : ['Ask on WhatsApp', 'Ask by email']);
    for (const r of rotulos) assert.ok(r.length <= 24, `botón de más de 24 caracteres: ${r}`);
  });

  test(`${nombre}: todo enlace interno resuelve a un archivo y a un ancla que existen`, () => {
    const ids = (h) => new Set([...sinComentarios(h).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    for (const [, href] of sinComentarios(html).matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:)/.test(href) && !href.startsWith(DOMINIO)) continue;
      const [ruta, ancla] = href.replace(DOMINIO, '').split('#');
      let archivo = nombre;
      if (ruta) archivo = ruta === '/' ? 'index.html' : /\/$/.test(ruta) ? `${ruta.slice(1)}index.html` : ruta.slice(1);
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre}: ${href} no existe`);
      if (ancla) assert.ok(ids(fs.readFileSync(path.join(raiz, archivo), 'utf8')).has(ancla), `${nombre}: ${href} apunta a un ancla que no existe`);
    }
  });

  test(`${nombre}: JSON-LD WebPage + BreadcrumbList, con #empresa, igual a la miga visible`, () => {
    const nodos = jsonLd(html);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.inLanguage, nombre === ES ? 'es' : 'en');
    assert.strictEqual(pagina.name, html.match(/<title>([^<]+)<\/title>/)[1]);
    assert.strictEqual(pagina.about['@id'], `${DOMINIO}/#empresa`);
    const miga = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement.map((i) => i.name);
    const nav = cuerpo.match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/)[1];
    assert.deepStrictEqual([...nav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')), miga);
  });
}

// Control en rojo (3-diseno §6): las reglas del servicio frenan una página
// rota a propósito. Si alguna de estas versiones pasara, la guardia no
// estaría guardando nada.
test('control en rojo: las reglas del servicio frenan un portal fuera del panel y las promesas o palabras vedadas dentro', () => {
  const html = paginas[ES];
  assert.doesNotThrow(() => reglasServicio(html, 'es'), 'la página real tiene que pasar');
  const enPanel = (agregado) => html.replace('<p>Incluye:</p>', `<p>Incluye: ${agregado}</p>`);
  const rotas = {
    'SICOP en el héroe': html.replace('<h1>Transporte de personal', '<h1>SICOP. Transporte de personal'),
    'Minexus en el pie': html.replace('<footer class="site">', '<footer class="site"><p>Minexus</p>'),
    'Exactian en la meta descripción': html.replace('<meta name="description" content="', '<meta name="description" content="Exactian. '),
    'un portal dos veces en el panel': enPanel('SICOP'),
    '«sin bloqueos» en el panel': enPanel('sin bloqueos en el ingreso'),
    '«garantizamos» en el panel': enPanel('garantizamos el ingreso'),
    'una palabra de software en el panel': enPanel('con nuestra plataforma'),
    'un socio en el panel': enPanel('socios oficiales de los portales'),
    'sin la nota de marcas': html.replace('<p class="nota-marcas">', '<p class="nota">'),
    'un logo en el panel': enPanel('<img src="/assets/x.webp" alt="">'),
  };
  for (const [caso, rota] of Object.entries(rotas)) {
    assert.notStrictEqual(rota, html, `${caso}: la versión rota no cambió nada`);
    assert.throws(() => reglasServicio(rota, 'es'), assert.AssertionError, `${caso}: la guardia no lo frenó`);
  }
});

for (const [nombre, linea] of Object.entries(SECCION)) {
  test(`${nombre}: miga Inicio › Empresas y minería › ${linea === 'personal' ? 'Personal para minería' : 'Cargas'} › página, visible y en JSON-LD`, () => {
    const html = paginas[nombre];
    const en = nombre.startsWith('en/');
    const hub = en ? EN : ES;
    const ancla = en ? { personal: 'crew', cargas: 'freight' }[linea] : linea;
    const rotulo = en ? { personal: 'Mining crew transport', cargas: 'Freight' }[linea] : { personal: 'Personal para minería', cargas: 'Cargas' }[linea];
    const nav = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, `${nombre}: falta la miga visible`);
    const lis = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.strictEqual(lis.length, 4);
    assert.strictEqual(lis[1], `<a href="/${hub}">${en ? 'Business &amp; mining' : 'Empresas y minería'}</a>`);
    assert.strictEqual(lis[2], `<a href="/${hub}#${ancla}">${rotulo}</a>`);
    const miga = jsonLd(html).find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.deepStrictEqual(miga.map((i) => i.name), lis.map((l) => l.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&')));
    assert.strictEqual(miga[1].item, urlDe(hub));
    assert.strictEqual(miga[2].item, `${urlDe(hub)}#${ancla}`);
    assert.ok(!miga[3].item, 'la página actual no lleva item');
  });
}
