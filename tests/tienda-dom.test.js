// Vitrina en un documento: el contador «Personas», la región viva, lo que se
// guarda y sólo pesos (3c §5–§6, 3e §5 A). js/tienda.js corre
// sobre la página que arma scripts/tienda.mjs con el perfil demo, en jsdom,
// con el catálogo de prueba y un reloj propio: sin navegador, sin red y sin
// esperas reales (testing-principles §2: lo más barato que prueba el
// comportamiento del DOM). Lo que no se puede probar acá (lo que de verdad lee
// VoiceOver o TalkBack, el corrimiento medido) es de la auditoría en la caja.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { paginas } = require('./util.js');
const tienda = require('../js/tienda.js');
const preciosHost = require('../js/precios-host.js');

const SITIO = 'https://apacheta-demo-sitio.vercel.app';
const DEMO = 'https://lausof-demo-uvhgjf.netlify.app';
const perfilDemo = (tiendaExtra = {}) => ({
  nombre: 'demo', host: DEMO, marcaDemo: true,
  tienda: { activa: true, empresa: 'lausof', sitio: SITIO, app: 'https://apacheta-demo.vercel.app', clave: 'clavePublicaDePrueba0123456789ab', ...tiendaExtra },
});
// La forma del catálogo vivo del 18/11 (`reservar: null`); conCompra le pone la compra que Apacheta mandaba antes.
const catalogo = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'tienda-catalogo-demo.json'), 'utf8'));
const conCompra = (cat = catalogo()) => { for (const s of cat.servicios) s.reservar = `${SITIO}/lausof/reservar?servicio=${s.clave}&idioma=es`; return cat; };

/** Un reloj que avanza sólo cuando el test lo dice. */
function reloj() {
  let ahora = 0;
  let siguiente = 1;
  const pendientes = new Map();
  return {
    setTimeout: (fn, ms = 0) => { const id = siguiente++; pendientes.set(id, { fn, cuando: ahora + ms }); return id; },
    clearTimeout: (id) => { pendientes.delete(id); },
    avanzar(ms) {
      const hasta = ahora + ms;
      for (;;) {
        const listos = [...pendientes.entries()].filter(([, p]) => p.cuando <= hasta).sort((a, b) => a[1].cuando - b[1].cuando);
        if (!listos.length) break;
        const [id, p] = listos[0];
        pendientes.delete(id);
        ahora = p.cuando;
        p.fn();
      }
      ahora = hasta;
    },
  };
}

/**
 * Arma la página con el perfil demo y corre la vitrina en jsdom.
 * `antes(window)` prepara el almacenamiento; `cat` es el catálogo (null = el
 * pedido falla); `host` es el host desde el que se mira.
 */
async function abrir(archivo, { cat = catalogo(), antes, host = 'lausof-demo-uvhgjf.netlify.app', perfil = perfilDemo() } = {}) {
  const { transformarPagina, leerPerfil } = await import('../scripts/tienda.mjs');
  const html = transformarPagina(paginas[archivo], archivo, leerPerfil(perfil));
  const dom = new JSDOM(html, { url: `https://${host}/${archivo}` });
  const win = dom.window;
  const r = reloj();
  win.setTimeout = r.setTimeout;
  win.clearTimeout = r.clearTimeout;
  win.console.warn = () => {};
  win.LausofPrecios = preciosHost;
  const pedidos = [];
  win.fetch = async (url) => {
    pedidos.push(url);
    if (!cat) throw new Error('sin red');
    return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(cat)) };
  };
  if (antes) antes(win);
  const vitrina = await tienda.iniciar(win.document, win);
  const doc = win.document;
  const $ = (sel) => doc.querySelector(sel);
  const $$ = (sel) => [...doc.querySelectorAll(sel)];
  const campo = () => $('#personas-precios') || $('#personas-destinos');
  return {
    dom, win, doc, r, vitrina, pedidos, $, $$,
    campo,
    menos: () => campo().closest('[data-tienda-controles]').querySelector('[data-tienda-menos]'),
    mas: () => campo().closest('[data-tienda-controles]').querySelector('[data-tienda-mas-uno]'),
    vivo: () => campo().closest('section').querySelector('[data-tienda-vivo]').textContent,
    // El texto de cada zona, una línea tras otra (cada línea es su propio elemento).
    zonas: () => $$('[data-tienda-zona]').map((z) => {
      const w = doc.createTreeWalker(z, win.NodeFilter.SHOW_TEXT);
      const partes = [];
      while (w.nextNode()) partes.push(w.currentNode.nodeValue);
      return partes.join(' ').replace(/\s+/g, ' ').trim();
    }),
    enlaces: () => $$('[data-tienda-accion]').map((a) => new URL(a.getAttribute('href'))),
    clic: (el) => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true })),
    tecla: (el, key) => el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })),
    tipear: (valor) => { campo().value = valor; campo().dispatchEvent(new win.Event('input', { bubbles: true })); },
    salir: () => campo().dispatchEvent(new win.FocusEvent('blur')),
  };
}

test('al cargar: el contador en 2 y habilitado, el tramo de 1 a 4 en cada tarjeta y en el encabezado, nada anunciado (3c §5)', async () => {
  const p = await abrir('traslado-salta-cafayate.html');
  assert.strictEqual(p.pedidos.length, 1);
  assert.strictEqual(p.campo().value, '2');
  assert.strictEqual(p.campo().disabled, false);
  assert.strictEqual(p.campo().getAttribute('aria-valuenow'), '2');
  assert.strictEqual(p.campo().getAttribute('aria-valuetext'), '2 personas');
  assert.strictEqual(p.menos().getAttribute('aria-disabled'), 'false');
  assert.ok(!p.$('[data-tienda-controles]').hasAttribute('data-inerte'));
  assert.strictEqual(p.vivo(), '', 'el «Cargando precios…» se va sin anunciar nada');
  assert.deepStrictEqual(p.zonas(), [
    'Para 1 a 4 personas ARS 101.000 Precio sin impuestos nacionales: ARS 91.403 ARS 50.500 por persona',
    'Para 1 a 4 personas ARS 201.000 Precio sin impuestos nacionales: ARS 181.900 ARS 100.500 por persona',
    'Para 1 a 4 personas ARS 401.000 Precio sin impuestos nacionales: ARS 362.896 ARS 200.500 por persona',
  ]);
  assert.match(p.$('[data-tienda-cabeza]').textContent, /^Cafayate \(Quebrada de las Conchas\) · para 1 a 4 personas ARS 101\.000 PRUEBA/);
  assert.strictEqual(p.$('#precios-h2').textContent, 'Salta – Cafayate PRECIOS DE PRUEBA', 'el título no cambia');
  assert.ok(p.$('#precios-h2 [data-tienda-chip]').hasAttribute('data-visible'), 'el chip del HTML se muestra con el catálogo de prueba');
  assert.ok(p.enlaces().every((u) => u.host === 'wa.me'), 'sin compra en el catálogo, «Reservar» es el chat');
  assert.strictEqual(p.$('[data-tienda-bloque]').hasAttribute('aria-busy'), false);
  const conLaCompra = await abrir('traslado-salta-cafayate.html', { cat: conCompra() });
  for (const u of conLaCompra.enlaces()) assert.strictEqual(u.searchParams.get('pasajeros'), '2');
});

test('ningún bloque queda ocupado: tampoco el que se oculta porque el catálogo no trae su servicio (la 4x4 mensual)', async () => {
  const p = await abrir('alquiler-4x4.html');
  const segundo = p.$('[data-tienda-bloque="1"]');
  assert.ok(segundo && segundo.closest('section').hidden, 'el bloque de la 4x4 mensual se oculta: el catálogo de prueba no la trae');
  assert.deepStrictEqual(p.$$('[aria-busy]').map((z) => z.getAttribute('data-tienda-bloque')), []);
  const sinRed = await abrir('alquiler-4x4.html', { cat: null });
  assert.deepStrictEqual(sinRed.$$('[aria-busy]').map((z) => z.getAttribute('data-tienda-bloque')), [], 'sin catálogo tampoco');
});

test('− y +: cambian el tramo al instante, el enlace lleva la cantidad, se guarda en la sesión y se anuncia 500 ms después', async () => {
  const p = await abrir('traslado-salta-cafayate.html', { cat: conCompra() });
  p.clic(p.mas()); p.clic(p.mas()); p.clic(p.mas());
  assert.strictEqual(p.campo().value, '5');
  assert.match(p.zonas()[0], /^Para 5 a 19 personas ARS 102\.000 Precio sin impuestos nacionales: ARS 92\.308 ARS 20\.400 por persona$/);
  assert.strictEqual(p.$('[data-tienda-info]').textContent, 'En combi con chofer. Entradas y comidas aparte.');
  assert.ok(p.enlaces().every((u) => u.searchParams.get('pasajeros') === '5'));
  assert.match(p.$('[data-tienda-cabeza]').textContent, /· para 5 a 19 personas ARS 102\.000/);
  assert.strictEqual(p.win.sessionStorage.getItem('lausof.personas'), '5');
  p.r.avanzar(499);
  assert.strictEqual(p.vivo(), '', 'el anuncio espera a que el visitante pare');
  p.r.avanzar(1);
  assert.strictEqual(p.vivo(), '5 personas. Cafayate (Quebrada de las Conchas): ARS 102.000, ARS 20.400 por persona. Salta – Cafayate (un tramo): ARS 202.000, ARS 40.400 por persona. Vuelta a los Valles Calchaquíes (noche en Cafayate o Cachi): ARS 402.000, ARS 80.400 por persona.');
  // Una tanda de cambios rápidos da un solo anuncio, el del final.
  p.clic(p.menos()); p.r.avanzar(200); p.clic(p.menos());
  p.r.avanzar(500);
  assert.match(p.vivo(), /^3 personas\. /);
});

test('en 1 el − queda marcado aria-disabled pero conserva el foco; nunca baja de 1 ni pasa de 99', async () => {
  const p = await abrir('traslado-salta-cafayate.html');
  p.clic(p.menos());
  assert.strictEqual(p.campo().value, '1');
  assert.strictEqual(p.menos().getAttribute('aria-disabled'), 'true');
  assert.strictEqual(p.menos().disabled, false, 'no `disabled`: el foco del teclado no se pierde');
  p.menos().focus();
  p.clic(p.menos());
  assert.strictEqual(p.campo().value, '1');
  assert.strictEqual(p.doc.activeElement, p.menos());
  assert.doesNotMatch(p.zonas()[0], /por persona/, 'a 1 persona no hay línea por persona');
  assert.strictEqual(p.campo().getAttribute('aria-valuetext'), '1 persona');
  p.tipear('99'); p.salir();
  p.clic(p.mas());
  assert.strictEqual(p.campo().value, '99');
  assert.strictEqual(p.mas().getAttribute('aria-disabled'), 'true');
});

test('flechas del teclado en el campo: ↑ suma, ↓ resta (APG spinbutton)', async () => {
  const p = await abrir('traslado-salta-cafayate.html');
  p.tecla(p.campo(), 'ArrowUp');
  p.tecla(p.campo(), 'ArrowUp');
  assert.strictEqual(p.campo().value, '4');
  assert.strictEqual(p.campo().getAttribute('aria-valuenow'), '4');
  p.tecla(p.campo(), 'ArrowDown');
  assert.strictEqual(p.campo().value, '3');
});

test('al tipear: las tarjetas siguen al número, queda a los 700 ms o con Enter; lo inválido vuelve en silencio al salir', async () => {
  const p = await abrir('traslado-salta-cafayate.html');
  p.tipear('7');
  assert.match(p.zonas()[0], /^Para 5 a 19 personas/, 'siguen mientras se tipea');
  assert.strictEqual(p.win.sessionStorage.getItem('lausof.personas'), null, 'todavía no quedó');
  p.r.avanzar(700);
  assert.strictEqual(p.win.sessionStorage.getItem('lausof.personas'), '7');
  p.tipear('3');
  p.tecla(p.campo(), 'Enter');
  assert.strictEqual(p.win.sessionStorage.getItem('lausof.personas'), '3');
  for (const malo of ['', '0', 'abc']) {
    p.tipear(malo);
    p.salir();
    assert.strictEqual(p.campo().value, '3', `«${malo}» vuelve al último válido`);
    assert.match(p.zonas()[0], /^Para 1 a 4 personas/);
  }
  p.tipear('4b');
  assert.strictEqual(p.campo().value, '4', 'sólo dígitos');
  p.r.avanzar(1000);
  assert.match(p.vivo(), /^4 personas\. /);
});

test('más que el vehículo más grande: «Pedir presupuesto» en la tarjeta y en el encabezado, con la cantidad (3c §4)', async () => {
  const p = await abrir('traslado-salta-cafayate.html', { cat: conCompra() });
  p.tipear('20'); p.salir();
  assert.deepStrictEqual(p.zonas(), Array(3).fill('Para 20 personas Para más de 19 personas, se coordina con Lausof.'));
  const a = p.$('[data-tienda-accion]');
  assert.strictEqual(a.textContent, 'Pedir presupuesto');
  assert.strictEqual(a.className, 'btn btn-presupuesto');
  assert.strictEqual(new URL(a.href).searchParams.get('pasajeros'), '20');
  assert.strictEqual(p.$('[data-tienda-info]').hidden, true, 'sin la línea del vehículo; la zona guarda su alto');
  assert.match(p.$('[data-tienda-cabeza]').textContent, /^Cafayate \(Quebrada de las Conchas\) · para 20 personas Pedir presupuesto$/);
  p.r.avanzar(500);
  assert.strictEqual(p.vivo(), '20 personas. Cafayate (Quebrada de las Conchas): pedir presupuesto. Salta – Cafayate (un tramo): pedir presupuesto. Vuelta a los Valles Calchaquíes (noche en Cafayate o Cachi): pedir presupuesto.');
  p.tipear('19'); p.salir();
  assert.strictEqual(p.$('[data-tienda-accion]').textContent, 'Reservar');
  assert.strictEqual(p.$('[data-tienda-info]').hidden, false);
});

test('sólo pesos: con `monedas` y `aprox` en el catálogo y una moneda guardada de antes, todo en pesos; nada lee ni guarda una moneda (3e §5 A, D13)', async () => {
  const cat = catalogo();
  assert.ok(cat.monedas.length > 0, 'el catálogo de prueba manda monedas (3e §10 Δ8)');
  const escritos = [];
  // Un visitante que eligió USD en la versión con «Ver en» (3d) vuelve.
  const p = await abrir('traslado-salta-cafayate.html', {
    cat,
    antes: (w) => {
      w.localStorage.setItem('lausof.moneda', 'USD');
      const original = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function (k, v) { escritos.push(k); return original.call(this, k, v); };
    },
  });
  const sinMoneda = () => {
    const texto = p.$('#precios').textContent + p.$('[data-tienda-cabeza]').textContent;
    assert.doesNotMatch(texto, /Aprox|aproximad|BCRA|USD|EUR|BRL|CLP|Ver en/);
    assert.ok(p.zonas().every((z) => /^Para \d+ a \d+ personas ARS [\d.]+ Precio sin impuestos nacionales: ARS [\d.]+/.test(z)), p.zonas().join(' | '));
    assert.strictEqual(p.$$('[data-tienda-moneda], [data-tienda-nota], .tienda-aprox, input[type="radio"]').length, 0, 'sin chips, sin nota, sin «Aprox.»');
    assert.ok(p.enlaces().every((u) => !u.searchParams.has('moneda')), 'sin moneda en el enlace');
    assert.ok(!p.doc.documentElement.hasAttribute('data-moneda'));
  };
  sinMoneda();
  p.clic(p.mas()); p.clic(p.mas()); p.clic(p.mas());
  sinMoneda();
  p.r.avanzar(500);
  assert.doesNotMatch(p.vivo(), /aproximad|USD|EUR|BRL/);
  assert.deepStrictEqual(escritos.filter((k) => k !== 'lausof.personas'), [], 'sólo se guardan las personas');
  assert.strictEqual(p.win.localStorage.getItem('lausof.moneda'), 'USD', 'la de antes ni se lee ni se toca');
});

test('las personas vuelven en la sesión y no se anuncian al cargar', async () => {
  const p = await abrir('traslado-salta-cafayate.html', { antes: (w) => w.sessionStorage.setItem('lausof.personas', '6') });
  assert.strictEqual(p.campo().value, '6');
  assert.match(p.zonas()[0], /^Para 5 a 19 personas ARS 102\.000/);
  assert.strictEqual(p.vivo(), '', 'tampoco se anuncia lo que vino guardado');
});

test('si el almacenamiento falla (modo privado, sitio bloqueado): 2 personas y la vitrina funciona igual', async () => {
  const p = await abrir('traslado-salta-cafayate.html', {
    antes: (w) => {
      for (const cual of ['localStorage', 'sessionStorage']) Object.defineProperty(w, cual, { configurable: true, get() { throw new Error('bloqueado'); } });
    },
  });
  assert.strictEqual(p.campo().value, '2');
  p.clic(p.mas());
  assert.strictEqual(p.campo().value, '3');
  assert.match(p.zonas()[0], /^Para 1 a 4 personas ARS 101\.000 /);
});

test('el catálogo no responde: el estado de error con WhatsApp, sin compra armada y sin contador (3c §5)', async () => {
  const p = await abrir('traslado-salta-cafayate.html', { cat: null });
  const error = p.$('.tienda-error');
  assert.ok(error);
  assert.match(error.textContent, /Los precios no se pudieron mostrar en este momento\./);
  assert.strictEqual(error.querySelector('.btn-reservar'), null, 'sin catálogo no hay dirección de compra');
  assert.strictEqual(new URL(error.querySelector('.btn-wa').href).host, 'wa.me');
  assert.strictEqual(p.$('[data-tienda-controles]').hidden, true);
  assert.strictEqual(p.$('[data-tienda-cabeza]').hidden, true);
  assert.strictEqual(p.$('[data-tienda-ir]').textContent, 'Ver opciones y reservar');
  assert.strictEqual(p.vivo(), '');
});

test('un catálogo de producción en la demo: ningún monto, ni contador, ni PRUEBA (precios-host.js, 3b G10)', async () => {
  const cat = catalogo();
  cat.demo = false;
  const p = await abrir('traslado-salta-cafayate.html', { cat });
  assert.doesNotMatch(p.$('#precios').textContent.replace(p.$('#precios-h2 [data-tienda-chip]').textContent, ''), /ARS \d|PRUEBA/);
  assert.ok(!p.$('#precios-h2 [data-tienda-chip]').hasAttribute('data-visible'), 'el chip queda invisible');
  assert.strictEqual(p.$('[data-tienda-controles]').hidden, true);
  assert.ok(p.$$('[data-tienda-accion]').every((a) => a.textContent === 'Reservar'));
});

test('el hub: un contador bajo la bajada mueve las seis tarjetas; el valor sigue a la página del destino (3c §3)', async () => {
  const p = await abrir('turismo.html');
  assert.strictEqual(p.$('#circuitos h2').textContent, 'Destinos PRECIOS DE PRUEBA');
  assert.strictEqual(p.$$('[data-tienda-hub]:not([hidden])').length, 6);
  assert.ok(p.zonas().every((z) => z.startsWith('Para 1 a 4 personas ARS ')));
  p.clic(p.mas()); p.clic(p.mas()); p.clic(p.mas()); p.clic(p.mas());
  assert.ok(p.zonas().every((z) => z.startsWith('Para 5 a 19 personas ARS ')));
  p.r.avanzar(500);
  assert.match(p.vivo(), /^6 personas\. Cafayate \(Quebrada de las Conchas\): ARS 102\.000, ARS 17\.000 por persona\. .+\. .+\. Y 3 precios más en esta sección\.$/);
  // La tarjeta del hub conserva su foto, su texto y su enlace a la página.
  assert.ok(p.$('.card.circuito .ruta-link[href="/traslado-salta-cafayate.html"]'));
  const guardadas = p.win.sessionStorage.getItem('lausof.personas');
  const destino = await abrir('traslado-salta-cafayate.html', { antes: (w) => w.sessionStorage.setItem('lausof.personas', guardadas) });
  assert.strictEqual(destino.campo().value, '6');
});

test('la página del evento: el por día por tramo y el presupuesto del evento; arriba de 19 los dos son presupuesto (3c §8)', async () => {
  const p = await abrir('traslado-serenata-a-cafayate.html', { cat: conCompra() });
  assert.deepStrictEqual(p.zonas(), ['Para 1 a 4 personas ARS 2.301.000 por día Precio sin impuestos nacionales: ARS 2.082.353', 'Precio a medida del viaje.']);
  assert.strictEqual(p.$('[data-tienda-info]').textContent, 'En 4x4 con chofer. Hasta 250 km por día.');
  p.tipear('25'); p.salir();
  assert.deepStrictEqual(p.$$('[data-tienda-accion]').map((a) => a.textContent), ['Pedir presupuesto', 'Pedir presupuesto']);
  assert.ok(p.enlaces().every((u) => u.searchParams.get('pasajeros') === '25'));
  p.r.avanzar(500);
  assert.strictEqual(p.vivo(), '25 personas. Vehículo con chofer a disposición (día, hasta 250 km): pedir presupuesto.', 'la tarjeta a medida no se nombra');
});

test('sin compra en el catálogo (`reservar: null`, 18/11): «Reservar» y «Pedir presupuesto» abren el chat al cargar y después de cada cambio', async () => {
  const cat = catalogo();
  // Un servicio con compra y los demás sin: cada botón sigue a su servicio.
  cat.servicios.find((s) => s.clave === 'tr_cafayate').reservar = `${SITIO}/lausof/reservar?servicio=tr_cafayate&idioma=es`;
  const p = await abrir('traslado-salta-cafayate.html', { cat });
  const botones = () => p.$$('[data-tienda-accion]');
  const esChat = (a) => new URL(a.href).host === 'wa.me' && a.target === '_blank' && a.rel === 'noopener' && a.hasAttribute('data-asistente-abrir');
  const esCompra = (a) => new URL(a.href).pathname === '/lausof/reservar' && !a.hasAttribute('target') && !a.hasAttribute('rel') && !a.hasAttribute('data-asistente-abrir');
  const ver = (n) => {
    const [caf, tr, valles] = botones();
    assert.ok(esChat(caf) && esChat(valles), `n=${n}: sin compra, el chat`);
    assert.ok(esCompra(tr), `n=${n}: con compra, la compra`);
    assert.strictEqual(new URL(tr.href).searchParams.get('pasajeros'), String(n));
    assert.strictEqual(new URL(caf.href).href, new URL(p.$('.wa-bar .btn-wa').href).href, 'el mismo WhatsApp de la barra de la página');
  };
  ver(2);
  p.clic(p.mas()); p.clic(p.mas()); p.clic(p.mas());
  ver(5);
  p.tipear('20'); p.salir();
  ver(20);
  assert.deepStrictEqual(botones().map((a) => a.textContent), Array(3).fill('Pedir presupuesto'));
  // «o armarlo en el chat» sólo donde el botón no abre ya el chat.
  assert.deepStrictEqual(p.$$('[data-tienda-tarjeta] .tienda-chat').map((a) => a.hidden), [true, false, true]);
  assert.ok(esChat(p.$('[data-tienda-cabeza] a')), 'el presupuesto del encabezado también');
  p.tipear('3'); p.salir();
  ver(3);
  assert.deepStrictEqual(p.$$('[data-tienda-tarjeta] .tienda-chat').map((a) => a.hidden), [true, true, true]);
  // Sin chat en la página: WhatsApp, sin el enganche del chat.
  const sin = await abrir('traslado-salta-cafayate.html', { perfil: perfilDemo({ clave: null }) });
  assert.ok(sin.$$('[data-tienda-accion]').every((a) => new URL(a.href).host === 'wa.me' && a.target === '_blank' && !a.hasAttribute('data-asistente-abrir')));
  assert.strictEqual(sin.$$('[data-asistente-abrir]').length, 0);
});

test('el catálogo se pide en el idioma de la página, y los nombres y vehículos se muestran como llegan', async () => {
  for (const [archivo, idioma] of [['traslado-salta-cafayate.html', 'es'], ['en/salta-to-cafayate-transfer.html', 'en'], ['pt/traslado-salta-cafayate.html', 'pt']]) {
    const p = await abrir(archivo);
    assert.deepStrictEqual(p.pedidos, [`${SITIO}/api/publico/lausof/catalogo?idioma=${idioma}`], archivo);
  }
  // Lo que manda el catálogo en inglés (GET ?idioma=en, 18/11): el nombre y el vehículo en inglés.
  const cat = catalogo();
  const tr = cat.servicios.find((s) => s.clave === 'tr_cafayate');
  tr.nombre = 'Salta – Cafayate (one way)';
  tr.precio.tramos[1].vehiculo = 'minibus';
  const p = await abrir('en/salta-to-cafayate-transfer.html', { cat });
  assert.strictEqual(p.$$('[data-tienda-tarjeta] h3')[1].textContent, 'Salta – Cafayate (one way)');
  p.tipear('6'); p.salir();
  assert.strictEqual(p.$$('[data-tienda-info]')[1].textContent, 'By minibus with a driver.');
  assert.strictEqual(p.$('#precios-h2').firstChild.textContent.trim(), 'Salta to Cafayate', 'el título del bloque es de la página, no del catálogo');
});

test('en inglés: los mismos controles con sus palabras', async () => {
  const p = await abrir('en/salta-to-cafayate-transfer.html');
  assert.strictEqual(p.campo().getAttribute('aria-valuetext'), '2 people');
  p.clic(p.menos());
  assert.strictEqual(p.campo().getAttribute('aria-valuetext'), '1 person');
  assert.doesNotMatch(p.zonas().join(' '), /Approx|USD|EUR/);
  p.r.avanzar(500);
  assert.match(p.vivo(), /^1 person\. /);
});
