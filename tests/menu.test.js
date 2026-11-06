// Menú del sitio y sección de cada página (estructura aprobada el 05/11/2026,
// opción A: web/estructura-sitio-2026-11-05/3a-diseno-estructura.md §3.2,
// §3.3 y §3.8). El menú lo arma scripts/menu.mjs; estas guardias miran que
// esté al día en todas las páginas, que sea el MISMO en todas las páginas de
// un idioma, que sus enlaces lleven a páginas que existen y que la
// reestructura no mueva ni pierda ninguna URL.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { paginas, sitemap, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const cargar = () => import(pathToFileURL(path.join(raiz, 'scripts', 'menu.mjs')).href);

const zonaMenu = (html) => (html.match(/<!-- GENERADO:MENU[\s\S]*?<!-- \/GENERADO:MENU -->/) || [null])[0];
const idiomaDe = (nombre) => (nombre.startsWith('en/') ? 'en' : nombre.startsWith('pt/') ? 'pt' : 'es');

// Lo que cambia legítimamente de una página a otra dentro del menú: la marca
// de la sección actual, la sección abierta en la hoja del teléfono y la
// etiqueta de sección. El resto tiene que ser idéntico.
const normalizar = (zona) => zona
  .replace(/ menu-actual/g, '')
  .replace(/<details class="hoja-seccion" open>/g, '<details class="hoja-seccion">')
  .replace(/\n\s*<a class="menu-chip"[^>]*>[^<]*<\/a>/, '');

// en/404.html lleva a propósito una barra mínima (marca e idioma), sin menú.
const SIN_MENU = ['en/404.html'];
const conMenu = Object.entries(paginas)
  .filter(([nombre, html]) => /<header class="topbar"/.test(html) && !SIN_MENU.includes(nombre));

test('cada página con barra superior tiene el menú generado y ningún menú viejo', () => {
  assert.ok(conMenu.length >= 75, `sólo ${conMenu.length} páginas con barra superior`);
  for (const [nombre, html] of conMenu) {
    assert.ok(zonaMenu(html), `${nombre}: sin la zona GENERADO:MENU (correr node scripts/menu.mjs)`);
    assert.strictEqual((html.match(/<nav class="main"/g) || []).length, 1, `${nombre}: más de un nav.main`);
    const barra = sinComentarios(html).match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
    assert.doesNotMatch(barra, /href="\/(?:en\/|pt\/)?#(?:servicios|services|servicos|seguridad|safety|seguranca|flota|fleet|frota)"/,
      `${nombre}: quedó en la barra un enlace del menú viejo de anclas`);
    assert.match(html, /<script defer src="\/js\/menu\.js\?v=\d+"><\/script>/, `${nombre}: no carga /js/menu.js`);
  }
});

test('el menú es el mismo en todas las páginas de un idioma', () => {
  const porIdioma = {};
  for (const [nombre, html] of conMenu) {
    const idioma = idiomaDe(nombre);
    const zona = normalizar(zonaMenu(html));
    if (!porIdioma[idioma]) porIdioma[idioma] = { nombre, zona };
    else assert.strictEqual(zona, porIdioma[idioma].zona, `${nombre}: el menú difiere del de ${porIdioma[idioma].nombre}`);
  }
  assert.deepStrictEqual(Object.keys(porIdioma).sort(), ['en', 'es', 'pt']);
});

test('las dos secciones, en el orden del diseño, con los nombres de 4-textos §0.1', () => {
  const esperado = {
    es: ['Turismo y traslados', 'Empresas y minería', 'Nosotros', 'Contacto'],
    en: ['Tours &amp; transfers', 'Business &amp; mining', 'About', 'Contact'],
    pt: ['Passeios e traslados', 'Empresas e mineração (em espanhol)', 'Sobre nós', 'Contato'],
  };
  for (const [nombre, idioma] of [['index.html', 'es'], ['en/index.html', 'en'], ['pt/index.html', 'pt']]) {
    const nav = zonaMenu(paginas[nombre]).match(/<nav class="main"[^>]*>([\s\S]*?)<\/nav>/)[1];
    // Primer nivel: el <summary> de cada desplegable o el enlace directo.
    const primerNivel = [...nav.matchAll(/<details class="menu-grupo[^"]*"><summary>([^<]+)<\/summary>[\s\S]*?<\/details>|<a(?: class="menu-directo")? href="[^"]*"(?: hreflang="es")?>([^<]+)<\/a>/g)]
      .map((m) => m[1] || m[2]);
    assert.deepStrictEqual(primerNivel, esperado[idioma], `${nombre}: el primer nivel del menú`);
  }
  // Las columnas del desplegable de empresas: Personal para minería, después Cargas.
  const es = zonaMenu(paginas['index.html']);
  assert.ok(es.indexOf('Personal para minería') < es.indexOf('>Cargas<'), 'Cargas tiene que ir después de Personal para minería');
});

// En las columnas de sección del pie de las portadas, «Ver todo» va al final
// de cada columna, después de los servicios (Lautaro, 05/11/2026).
test('en el pie de las portadas, «Ver todo» es el último enlace de cada columna', async () => {
  const { MENU, PORTADAS } = await cargar();
  for (const portada of PORTADAS) {
    const t = MENU[idiomaDe(portada)];
    const zona = paginas[portada].match(/<!-- GENERADO:PIE[\s\S]*?<!-- \/GENERADO:PIE -->/)[0];
    const columnas = zona.match(/<div class="wrap pie-secciones"><div>([\s\S]*?)<\/div><div>([\s\S]*)<\/div><\/div>/);
    assert.ok(columnas, `${portada}: no encuentro las dos columnas del pie`);
    const enlaces = (col) => [...col.matchAll(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[2], m[1]]);
    const turismo = enlaces(columnas[1]);
    assert.deepStrictEqual(turismo.at(-1), [t.verTodo, t.turismo.hub], `${portada}: «${t.verTodo}» no cierra la columna de turismo`);
    assert.strictEqual(turismo.filter(([texto]) => texto === t.verTodo).length, 1);
    if (!t.empresas.es) {
      const empresas = enlaces(columnas[2]);
      assert.deepStrictEqual(empresas.at(-1), [t.verTodo, t.empresas.hub], `${portada}: «${t.verTodo}» no cierra la columna de empresas`);
      assert.strictEqual(empresas.filter(([texto]) => texto === t.verTodo).length, 1);
    }
  }
});

// Servicio «Documentación de ingreso» (fila 21 de LAUTARO-2026-11-05-noche.md;
// servicio-documentacion-2026-11-05/3-diseno §1.3): un ítem en la columna de
// Personal para minería, justo después de «4x4 mensual», que baja al panel
// del hub. Sin página propia, así que no cambia ningún contador. El pie de
// las portadas lo toma del menú, antes de «Ver todo». En portugués, nada.
test('el menú lleva «Documentación de ingreso» después de «4x4 mensual», al panel del hub, y el pie de las portadas también', async () => {
  const { MENU } = await cargar();
  const ESPERADO = {
    es: ['Documentación de ingreso', '/empresas-y-mineria.html#documentacion-flota', '4x4 mensual', 'index.html'],
    en: ['Mine entry documents', '/en/business-and-mining.html#fleet-documents', 'Monthly 4x4', 'en/index.html'],
  };
  for (const [idioma, [rotulo, destino, anterior, portada]] of Object.entries(ESPERADO)) {
    const [, items] = MENU[idioma].empresas.columnas[0];
    const i = items.findIndex(([r]) => r === rotulo);
    assert.ok(i > 0, `${idioma}: falta «${rotulo}» en la columna de personal`);
    assert.strictEqual(items[i - 1][0], anterior, `${idioma}: «${rotulo}» tiene que ir después de «${anterior}»`);
    assert.strictEqual(items[i][1], destino);
    assert.ok(rotulo.length <= 24, `${idioma}: el rótulo pasa de 24 caracteres`);
    assert.ok(MENU[idioma].empresas.columnas[1][1].every(([r]) => r !== rotulo), `${idioma}: el servicio no va en Cargas`);
    const [ruta, ancla] = destino.split('#');
    assert.match(paginas[ruta.slice(1)], new RegExp(`\\bid="${ancla}"`), `${destino}: no existe el ancla`);
    const pie = paginas[portada].match(/<!-- GENERADO:PIE[\s\S]*?<!-- \/GENERADO:PIE -->/)[0];
    assert.ok(pie.includes(`<a href="${destino}">${rotulo}</a>`), `${portada}: el pie no lleva el servicio`);
  }
  const pt = JSON.stringify(MENU.pt);
  assert.doesNotMatch(pt, /documentacion-flota|fleet-documents/, 'el sitio pt es sólo turismo');
});

// El bloque de facturación y la línea legal del pie salen de scripts/menu.mjs
// (PIE_DATOS), iguales en todas las páginas de un idioma. Revisión del
// 05/11/2026: «Datos para proveedores y compras» se leía como los proveedores
// de Lausof, y «NOA» no se entiende fuera de la Argentina.
test('el pie lleva «Datos de facturación» y la línea legal generados, sin «proveedores» ni «NOA»', async () => {
  const { PIE_DATOS } = await cargar();
  let conBloque = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const pie = (html.match(/<footer class="site"[^>]*>[\s\S]*?<\/footer>/) || [''])[0];
    if (!pie) continue;
    const d = PIE_DATOS[idiomaDe(nombre)];
    const legal = pie.match(/<!-- GENERADO:LEGAL[\s\S]*?<!-- \/GENERADO:LEGAL -->/);
    assert.ok(legal, `${nombre}: el pie no tiene la zona GENERADO:LEGAL`);
    assert.deepStrictEqual([...legal[0].matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1]), d.legal, `${nombre}: línea legal`);
    const texto = sinComentarios(pie).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.doesNotMatch(texto, /proveedores y compras|Supplier and procurement|fornecedores e compras/i, `${nombre}: título viejo del bloque`);
    assert.doesNotMatch(texto, /\bNOA\b/, `${nombre}: «NOA» en el pie`);
    if (!/<div class="wrap proveedores">/.test(pie)) continue;
    conBloque += 1;
    const zona = pie.match(/<!-- GENERADO:FACTURACION[\s\S]*?<!-- \/GENERADO:FACTURACION -->/);
    assert.ok(zona, `${nombre}: el bloque de facturación no está generado`);
    assert.ok(zona[0].includes(`<b>${d.titulo}</b>`), `${nombre}: el título no es «${d.titulo}»`);
    for (const item of d.items) assert.ok(zona[0].includes(`<li>${item}</li>`), `${nombre}: falta «${item}»`);
  }
  assert.ok(conBloque >= 75, `sólo ${conBloque} pies con bloque de facturación`);
  assert.ok(PIE_DATOS.es.items.includes('Emitimos factura A o B.'), 'el español dice A o B: Lausof emite las dos');
});

test('la etiqueta de sección del teléfono sólo va en páginas de turismo y empresas', async () => {
  const { seccionDe } = await cargar();
  for (const [nombre, html] of conMenu) {
    const chip = (zonaMenu(html).match(/<a class="menu-chip" href="([^"]*)">([^<]*)<\/a>/) || []);
    const seccion = seccionDe(nombre);
    if (seccion === 'turismo') assert.match(chip[2] || '', /^(Turismo|Tours|Passeios)$/, `${nombre}: etiqueta de turismo`);
    else if (seccion === 'empresas') assert.match(chip[2] || '', /^(Empresas|Business)$/, `${nombre}: etiqueta de empresas`);
    else assert.strictEqual(chip.length, 0, `${nombre} (${seccion}) no lleva etiqueta de sección`);
  }
});

test('los enlaces del menú llevan a páginas y anclas que existen', () => {
  // Los dos hubs de empresas los construye otra rama (web-hub-empresas-0511):
  // mientras no estén en el árbol, sus enlaces se saltean; cuando llegan, se
  // controlan como cualquier otro (archivo y ancla).
  const HUBS = ['empresas-y-mineria.html', 'en/business-and-mining.html'];
  const vistos = new Set();
  for (const [nombre, html] of conMenu) {
    for (const [, href] of zonaMenu(html).matchAll(/href="(\/[^"]*)"/g)) {
      if (vistos.has(href)) continue;
      vistos.add(href);
      const [ruta, ancla] = href.split('#');
      let archivo = ruta.slice(1) || 'index.html';
      if (archivo.endsWith('/')) archivo += 'index.html';
      if (HUBS.includes(archivo) && !fs.existsSync(path.join(raiz, archivo))) continue;
      assert.ok(paginas[archivo], `${nombre}: el menú enlaza ${href} y ${archivo} no existe`);
      if (ancla) assert.match(paginas[archivo], new RegExp(`\\bid="${ancla}"`), `${href}: no existe el ancla #${ancla}`);
    }
  }
  assert.ok(vistos.size > 30, 'el menú tiene menos enlaces de los esperados');
});

test('los enlaces a páginas que sólo existen en español lo dicen, en inglés y en portugués', () => {
  for (const [nombre, html] of conMenu) {
    const idioma = idiomaDe(nombre);
    if (idioma === 'es') continue;
    const carpeta = `/${idioma}/`;
    for (const [etiqueta, href, texto] of zonaMenu(html).matchAll(/<a[^>]*href="(\/[^"]*)"[^>]*>([^<]*)<\/a>/g)) {
      if (href.startsWith(carpeta) || href.startsWith('#') || href.startsWith('/en/') || href.startsWith('/pt/')) continue;
      assert.match(etiqueta, /hreflang="es"/, `${nombre}: ${href} va al español sin hreflang="es"`);
      assert.match(texto, idioma === 'en' ? /\(in Spanish\)$/ : /\(em espanhol\)$/, `${nombre}: ${href} no avisa que está en español`);
    }
  }
});

test('el menú está al día con scripts/menu.mjs en todas las páginas', async () => {
  const { conMenu: regenerar } = await cargar();
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.strictEqual(regenerar(html, nombre), html, `${nombre}: sin regenerar (node scripts/menu.mjs)`);
  }
});

// 3a §3.8: cada <body> dice su sección, su línea si es de empresas y su tipo.
// Son enganches inertes: nada del sitio los lee todavía y no hay script del
// asistente.
test('cada página declara su sección, su línea y su tipo en <body>', async () => {
  const { seccionDe, EMPRESAS } = await cargar();
  const { PAGINAS } = await import(pathToFileURL(path.join(raiz, 'scripts', 'prefill.mjs')).href);
  const cuenta = { turismo: 0, empresas: 0, inicio: 0, institucional: 0 };
  for (const [nombre, html] of Object.entries(paginas)) {
    const body = html.match(/<body([^>]*)>/)[1];
    const attr = (k) => (body.match(new RegExp(`\\b${k}="([^"]*)"`)) || [])[1];
    const seccion = attr('data-seccion');
    assert.strictEqual(seccion, seccionDe(nombre), `${nombre}: data-seccion`);
    cuenta[seccion] += 1;
    assert.strictEqual(attr('data-tipo'), PAGINAS[nombre], `${nombre}: data-tipo`);
    if (seccion === 'empresas' && EMPRESAS[nombre]) assert.match(attr('data-linea') || '', /^(personal|cargas)$/, `${nombre}: data-linea`);
    else assert.strictEqual(attr('data-linea'), undefined, `${nombre}: data-linea fuera de empresas`);
  }
  // 3a §3.3: 14 páginas de empresas (9 personal, 5 cargas) sin contar los hubs.
  const lineas = Object.values(EMPRESAS).filter(Boolean);
  assert.strictEqual(lineas.filter((l) => l === 'personal').length, 9);
  assert.strictEqual(lineas.filter((l) => l === 'cargas').length, 5);
  assert.strictEqual(cuenta.inicio, 3);
  // Los enganches siguen inertes para todo lo demás: sólo js/contacto.js y
  // js/galeria.js leen data-seccion y data-tipo, para los parámetros de GA4
  // (3a §7, 3b §2.3; la galería, imagenes-2026-11-05/3b-diseno-sitio.md §2.2).
  // Nada lee data-linea; el asistente se instala recién en W5.
  for (const archivo of fs.readdirSync(path.join(raiz, 'js'))) {
    const js = fs.readFileSync(path.join(raiz, 'js', archivo), 'utf8');
    if (archivo === 'contacto.js' || archivo === 'galeria.js') {
      assert.doesNotMatch(js, /data-linea|dataset\./, 'js/contacto.js lee otro enganche');
      assert.match(js, /'data-seccion'/);
      assert.match(js, /'data-tipo'/);
      continue;
    }
    assert.doesNotMatch(js, /data-seccion|data-linea|data-tipo|dataset\.(seccion|linea|tipo)/, `js/${archivo} lee los enganches`);
  }
});

// 3b §2.2–§2.3: el asistente sabe qué se cotiza en una página por el
// serviceType de su JSON-LD. Cada página de servicio (turismo y empresas)
// declara exactamente uno; los hubs de empresas, las portadas y las páginas
// institucionales no declaran ninguno (van por ruta). Sin Event ni Review en
// ninguna página (BRIEF-COMUN-BUILD, reglas fijas).
const nodosLd = (html) => {
  const nodos = [];
  const recorrer = (n) => {
    if (Array.isArray(n)) return n.forEach(recorrer);
    if (!n || typeof n !== 'object') return;
    nodos.push(n);
    Object.values(n).forEach(recorrer);
  };
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) recorrer(JSON.parse(json));
  return nodos;
};

test('cada página de servicio declara un solo serviceType; hubs, portadas e institucionales, ninguno', async () => {
  const { seccionDe, EMPRESAS } = await cargar();
  let conServicio = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const nodos = nodosLd(html);
    const tipos = nodos.filter((n) => 'serviceType' in n).map((n) => n.serviceType);
    const seccion = seccionDe(nombre);
    const esServicio = seccion === 'turismo' || (seccion === 'empresas' && EMPRESAS[nombre]);
    if (esServicio) {
      assert.strictEqual(tipos.length, 1, `${nombre}: ${tipos.length} serviceType (tiene que ser uno)`);
      assert.ok(typeof tipos[0] === 'string' && tipos[0].trim(), `${nombre}: serviceType vacío`);
      conServicio += 1;
    } else {
      assert.strictEqual(tipos.length, 0, `${nombre}: no es página de servicio y declara serviceType`);
    }
    for (const n of nodos) {
      const tipo = [].concat(n['@type'] || []);
      assert.ok(!tipo.some((t) => /Event$|^Review$|^AggregateRating$/.test(t)), `${nombre}: marcado ${tipo} vedado`);
    }
  }
  // 56 de turismo + 14 de empresas (3a §3.3).
  assert.strictEqual(conServicio, 70);
});

// 3a §3.5: en las 14 páginas de empresas y en sus dos hubs la barra fija del
// teléfono es Llamar · Mail · WhatsApp (3 de 4 toques en minería fueron
// correo, 1c §5): el 526-9009, transporte@ con asunto y renglones, y el
// WhatsApp pre-armado. Turismo, portadas e institucionales quedan como hoy.
test('la barra del teléfono de empresas es Llamar · Mail · WhatsApp; el resto queda como estaba', async () => {
  const { seccionDe } = await cargar();
  const ROTULOS = { es: ['Llamar', 'Mail', 'WhatsApp'], en: ['Call', 'Email', 'WhatsApp'] };
  let empresas = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const barras = sinComentarios(html).match(/<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
    if (seccionDe(nombre) !== 'empresas') {
      assert.ok(barras.every((b) => !b.startsWith('<div class="wa-bar tres"')), `${nombre}: barra de empresas fuera de empresas`);
      continue;
    }
    empresas += 1;
    assert.strictEqual(barras.length, 1, `${nombre}: una sola barra`);
    assert.ok(barras[0].startsWith('<div class="wa-bar tres"'), `${nombre}: la barra no es la de tres caminos`);
    const anclas = [...barras[0].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/svg>([^<]*)<\/a>/g)];
    assert.deepStrictEqual(anclas.map((a) => a[2]), ROTULOS[idiomaDe(nombre)], `${nombre}: rótulos`);
    const [tel, mail, wa] = anclas.map((a) => a[1].replace(/&amp;/g, '&'));
    assert.strictEqual(tel, 'tel:+5493875269009', `${nombre}: el botón de llamar no es el 526-9009`);
    const correo = new URL(mail);
    assert.strictEqual(correo.pathname, 'transporte@lausof.com', `${nombre}: el mail no va a transporte@`);
    assert.ok(correo.searchParams.get('subject'), `${nombre}: el mail no tiene asunto`);
    assert.match(correo.searchParams.get('body') || '', /^[^\n]+:\r\n/, `${nombre}: el mail no trae los renglones`);
    assert.strictEqual(correo.searchParams.get('cc'), null, `${nombre}: el mail lleva copia`);
    assert.match(wa, /^https:\/\/wa\.me\/5493875269009\?text=[^\n]+%0A/, `${nombre}: el WhatsApp no está pre-armado`);
  }
  assert.strictEqual(empresas, 16, '14 páginas de empresas y los dos hubs');
  // Las páginas de empresas sólo cargan styles.css y su hoja propia: la regla
  // de los tres botones vive en la hoja común.
  const css = fs.readFileSync(path.join(raiz, 'css', 'styles.css'), 'utf8');
  assert.match(css, /\.wa-bar\.tres \.btn,\.wa-bar\.tres \.btn-ghost\{flex:1 1 0/);
});

// Ninguna URL se mueve con la reestructura (3a §3.3: «0 of 75 URLs move, no
// redirects»): las 75 del sitemap del 05/11/2026 siguen ahí, con su archivo,
// y el sitemap sólo puede crecer.
const URLS_0511 = [
  '', 'flota-en-venta.html', 'turismo.html', 'logistica-minera.html', 'transporte-de-personal.html',
  'cargas-refrigeradas.html', 'galeria.html', 'golf-torneos.html', 'charter-recitales.html',
  'clubes-deportivos.html', 'viajes-de-estudio.html', 'traslados-empresas.html', 'peregrinaciones-eventos.html',
  'alquiler-4x4.html', 'deposito-galpon.html', 'producciones.html', 'alquiler-autoelevadores.html',
  'en/', 'en/mining-logistics.html', 'en/personnel-transport.html', 'en/tours-and-transfers.html',
  'en/4x4-rental.html', 'en/refrigerated-freight.html', 'en/warehouse.html', 'en/film-production-logistics.html',
  'traslado-salta-purmamarca-tilcara-humahuaca.html', 'salinas-grandes-desde-salta.html',
  'en/salta-to-purmamarca-tilcara-humahuaca.html', 'en/salinas-grandes-from-salta.html',
  'traslado-salta-cafayate.html', 'traslado-salta-cachi.html', 'traslado-salta-san-antonio-de-los-cobres.html',
  'traslados-casamientos.html', 'en/salta-to-cafayate-transfer.html', 'en/salta-to-cachi-transfer.html',
  'en/salta-to-san-antonio-de-los-cobres.html', 'en/wedding-transportation.html',
  'feriados-fines-de-semana-largos.html', 'traslado-carnaval-quebrada-de-humahuaca.html',
  'traslado-serenata-a-cafayate.html', 'en/transfer-carnival-quebrada-de-humahuaca.html',
  'viajes-internacionales.html', 'traslado-salta-san-pedro-de-atacama.html', 'traslado-salta-uyuni.html',
  'traslado-san-pedro-de-atacama-salta.html', 'traslado-uyuni-salta.html', 'en/international-trips.html',
  'en/salta-to-san-pedro-de-atacama.html', 'en/salta-to-uyuni.html', 'en/san-pedro-de-atacama-to-salta.html',
  'en/uyuni-to-salta.html', 'traslados-trail-jujuy-utmb.html', 'traslado-tren-a-las-nubes.html',
  'semana-santa-salta-jujuy.html', 'traslados-fiesta-del-milagro.html', 'en/jujuy-utmb-trail-race-transfers.html',
  'en/train-to-the-clouds-transfer.html', 'en/holy-week-salta-jujuy.html', 'traslado-aeropuerto-salta.html',
  'traslado-salta-jujuy.html', 'alquiler-combi-con-chofer-salta.html', 'en/salta-airport-transfer.html',
  'en/salta-to-jujuy-transfer.html', 'en/minibus-with-driver-salta.html', 'agencias-y-hoteles.html',
  'en/ground-transport-for-tour-operators.html', 'transporte-de-personal-obras-de-litio.html',
  'en/crew-transport-lithium-projects.html', 'pt/', 'pt/passeios-e-traslados.html',
  'pt/traslado-salta-san-pedro-de-atacama.html', 'pt/traslado-salta-uyuni.html',
  'pt/salinas-grandes-saindo-de-salta.html', 'pt/traslado-salta-cafayate.html',
  'pt/traslado-salta-purmamarca-tilcara-humahuaca.html',
];

test('ninguna URL del 05/11/2026 se movió y el sitemap no achica', () => {
  assert.strictEqual(URLS_0511.length, 75);
  const enSitemap = new Set([...sitemap.matchAll(/<loc>https:\/\/www\.lausof\.com\/([^<]*)<\/loc>/g)].map((m) => m[1]));
  assert.ok(enSitemap.size >= 75, `el sitemap tiene ${enSitemap.size} URLs, menos que las 75 del 05/11/2026`);
  for (const url of URLS_0511) {
    assert.ok(enSitemap.has(url), `/${url} salió del sitemap`);
    const archivo = url === '' || url.endsWith('/') ? `${url}index.html` : url;
    assert.ok(fs.existsSync(path.join(raiz, archivo)), `/${url}: falta ${archivo}`);
  }
  // Sin redirecciones nuevas desde ninguna de esas URLs.
  const redirects = fs.readFileSync(path.join(raiz, '_redirects'), 'utf8');
  for (const url of URLS_0511.filter((u) => u.endsWith('.html'))) {
    assert.doesNotMatch(redirects, new RegExp(`^/${url.replace(/[.]/g, '\\.')}\\s`, 'm'), `/${url} redirige`);
  }
});
