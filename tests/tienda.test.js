// Vitrina (scripts/tienda.mjs + js/tienda.js): precios y «Reservar» en las
// páginas de turismo. Diseño 3a, textos 4, contrato con el armado de la demo
// (7-contrato-overlay.md) y contrato de Apacheta en
// ~/lausof/web/demo-reservas-2026-11-06/. Todo se prueba sobre texto y un
// catálogo de prueba (tienda-catalogo-demo.json, precios de la propuesta v2
// del 04/11): sin navegador y sin red (testing-principles §2).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { paginas, pares, paresPt } = require('./util.js');
const t = require('../js/tienda.js');

const raiz = path.join(__dirname, '..');
const cargar = async () => ({
  ...(await import('../scripts/tienda.mjs')),
  ...(await import('../scripts/tienda-mapa.mjs')),
  ...(await import('../scripts/tienda-textos.mjs')),
  ...(await import('../scripts/tienda-elecciones.mjs')),
  entorno: await import('../scripts/entorno.mjs').catch(() => null),
});

const SITIO = 'https://apacheta-demo-sitio.vercel.app';
const APP = 'https://apacheta-demo.vercel.app';
const CLAVE = 'clavePublicaDePrueba0123456789ab';
const perfilDemo = (tienda = {}) => ({
  nombre: 'demo',
  marcaDemo: true,
  tienda: { activa: true, empresa: 'lausof', sitio: SITIO, app: APP, clave: CLAVE, ...tienda },
});
const perfilProduccion = { nombre: 'produccion', tienda: { activa: false, empresa: 'lausof', sitio: 'https://getapacheta.com', app: 'https://app.getapacheta.com', clave: null } };
// El catálogo de prueba tiene la forma del vivo del 18/11: `reservar` y `enlaces.cancelar` en null.
const catalogo = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'tienda-catalogo-demo.json'), 'utf8'));
// El mismo con compra: `reservar` con la dirección que Apacheta mandaba antes del 18/11.
const conCompra = (cat) => { for (const s of cat.servicios) s.reservar = `${SITIO}/lausof/reservar?servicio=${s.clave}&idioma=es`; return cat; };
const ENLACES = { cancelar: `${SITIO}/lausof/cancelar`, condiciones: `${SITIO}/lausof/condiciones`, privacidad: `${SITIO}/lausof/privacidad` };

// La salida de la vitrina para todas las páginas, una vez por perfil.
const salidas = new Map();
async function salida(perfil = perfilDemo(), enlaces = null) {
  const clave = JSON.stringify([perfil, enlaces]);
  if (!salidas.has(clave)) {
    const { transformarPagina, leerPerfil } = await cargar();
    const p = leerPerfil(perfil, enlaces);
    salidas.set(clave, Object.fromEntries(Object.entries(paginas).map(([a, html]) => [a, transformarPagina(html, a, p)])));
  }
  return salidas.get(clave);
}

const configDe = (html) => {
  const m = html.match(/<script type="application\/json" id="tienda-config">([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
};
const sinEstilos = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '');
const idiomaDe = (a) => (a.startsWith('en/') ? 'en' : a.startsWith('pt/') ? 'pt' : 'es');

/* ---- el árbol del repo: zonas vacías ------------------------------------- */

test('producción no cambia: las páginas del repo no llevan zonas TIENDA y el perfil apagado no escribe nada', async () => {
  const { transformarPagina, leerPerfil, zonasDe, ponerZonas } = await cargar();
  const p = leerPerfil(perfilProduccion);
  for (const [archivo, html] of Object.entries(paginas)) {
    assert.doesNotMatch(html, /GENERADO:TIENDA|tienda-config|\/js\/tienda\.js/, `${archivo}: la vitrina en el repo`);
    assert.strictEqual(transformarPagina(html, archivo, p), html, archivo);
    if (!/<body[\s>]/.test(html)) continue;
    // En la copia de la demo, cada página recibe exactamente sus zonas, una vez.
    const marcada = ponerZonas(html, archivo);
    assert.deepStrictEqual([...marcada.matchAll(/<!-- GENERADO:TIENDA ([a-z0-9-]+) -->/g)].map((m) => m[1]), zonasDe(archivo), archivo);
    assert.strictEqual(ponerZonas(marcada, archivo), marcada, `${archivo}: ponerZonas no es idempotente`);
  }
  // Control en rojo: una zona de más (una página editada a mano) no se genera.
  const doble = ponerZonas(paginas['traslado-salta-cafayate.html'], 'traslado-salta-cafayate.html')
    .replace('</main>', '<!-- GENERADO:TIENDA bloque --><!-- /GENERADO:TIENDA --></main>');
  assert.throws(() => transformarPagina(doble, 'traslado-salta-cafayate.html', leerPerfil(perfilDemo())), /zonas TIENDA/);
});

test('el perfil de producción de scripts/entorno.mjs deja la vitrina apagada', async () => {
  const { entorno, leerPerfil } = await cargar();
  if (!entorno) return; // scripts/entorno.mjs llega con la rama del armado de la demo
  assert.deepStrictEqual(leerPerfil(entorno.perfil('produccion')), { activa: false });
});

/* ---- el mapa ------------------------------------------------------------- */

test('mapa: cada página y su gemela existen y coinciden con los pares del sitio', async () => {
  const { PAGINAS, HUB, SERVICIOS } = await cargar();
  for (const [es, o] of Object.entries(PAGINAS)) {
    assert.ok(paginas[es], `${es} no existe`);
    if (o.en) assert.strictEqual(pares[es], o.en, `${es}: gemela en distinta de tests/util.js`);
    if (o.pt) assert.strictEqual(paresPt[es], o.pt, `${es}: gemela pt distinta de tests/util.js`);
    for (const b of o.bloques) for (const s of b.servicios) assert.ok(s.clave in SERVICIOS, `${es}: ${s.clave} sin unidad`);
    if (o.cabeza) assert.strictEqual(o.cabeza, o.bloques[0].servicios[0].clave, `${es}: el encabezado muestra el primer servicio`);
  }
  assert.strictEqual(pares[HUB.paginas.es], HUB.paginas.en);
  assert.strictEqual(paresPt[HUB.paginas.es], HUB.paginas.pt);
});

/* ---- la salida con el perfil demo ---------------------------------------- */

test('cada página con oferta: un solo #precios, configuración válida, ningún id repetido, scripts después del load', async () => {
  const { ofertaDe } = await cargar();
  const { version } = await import('../scripts/versiones.mjs');
  const out = await salida();
  let conOferta = 0;
  for (const [archivo, html] of Object.entries(out)) {
    const o = ofertaDe(archivo);
    if (!o) { assert.doesNotMatch(html, /id="precios"/, `${archivo}: bloque sin oferta`); continue; }
    conOferta += 1;
    assert.strictEqual((html.match(/id="precios"/g) || []).length, 1, `${archivo}: bloques #precios`);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepStrictEqual(ids.filter((id, i) => ids.indexOf(id) !== i), [], `${archivo}: ids repetidos`);
    const c = configDe(html);
    assert.ok(c, `${archivo}: sin configuración`);
    assert.strictEqual(c.sitio, SITIO);
    assert.strictEqual(c.desde, `/${archivo}`);
    assert.strictEqual(c.idioma, o.idioma);
    assert.match(c.wa, /^https:\/\/wa\.me\/5493875269009\?text=/, `${archivo}: WhatsApp de la página`);
    assert.strictEqual(c.bloques.filter((b) => b.servicios.length).length, (html.match(/data-tienda-bloque="/g) || []).length);
    // precios-host.js antes que tienda.js, los dos con el `load` (LCP), con el
    // ?v= = hash del archivo (scripts/versiones.mjs; /js/* es immutable); el
    // chat, si está, último en la misma carga.
    const vitrina = `<script>addEventListener('load',function(){['/js/precios-host.js?v=${version('js/precios-host.js')}','/js/tienda.js?v=${version('js/tienda.js')}'`;
    assert.ok(html.includes(vitrina), `${archivo}: carga de los scripts con su hash`);
    assert.match(html.slice(html.indexOf(vitrina) + vitrina.length), /^(?:,'[^']+\/boton\.js')?\]\.forEach/, `${archivo}: después de tienda.js, sólo el chat`);
    assert.doesNotMatch(html, /<script[^>]+src="\/js\/tienda\.js/, `${archivo}: tienda.js no se pide al parsear`);
  }
  assert.ok(conOferta >= 45, `sólo ${conOferta} páginas con oferta`);
});

test('ningún precio queda escrito en un archivo: los montos los dibuja el navegador con el catálogo', async () => {
  const out = await salida();
  for (const [archivo, html] of Object.entries(out)) {
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');
    assert.doesNotMatch(visible, /\bARS\s?\d/, `${archivo}: un monto escrito`);
    assert.doesNotMatch(visible, /Precio sin impuestos nacionales:/, `${archivo}: una leyenda de neto sin monto`);
  }
});

test('la barra del teléfono: WhatsApp · Reservar sólo en las páginas de turismo con precio; la de hoy queda detrás', async () => {
  const { ofertaDe } = await cargar();
  const out = await salida();
  for (const [archivo, html] of Object.entries(out)) {
    const o = ofertaDe(archivo);
    const nueva = (html.match(/<div class="wa-bar[^"]*"[^>]*data-tienda-barra>[\s\S]*?<\/div>/) || [''])[0];
    if (o && o.barra) {
      assert.match(nueva, /<a class="btn btn-reservar" href="#precios">(Reservar|Book)<\/a>/, `${archivo}: barra sin Reservar`);
      assert.doesNotMatch(nueva, /tel:/, `${archivo}: «Llamar» sale de la barra (3a §6.1)`);
      assert.match(nueva, />WhatsApp<\/a>/, `${archivo}: la etiqueta corta de WhatsApp`);
      // Ruling 5 A (06/11): WhatsApp · Reservar en los tres idiomas, sin Email ni Llamar.
      assert.match(nueva, /^<div class="wa-bar" [^>]*data-tienda-barra>\n {2}<a class="btn btn-wa"[\s\S]*>WhatsApp<\/a>\n {2}<a class="btn btn-reservar"/, archivo);
      assert.doesNotMatch(nueva, /mailto:/, `${archivo}: sin Email`);
      assert.ok(html.includes(paginas[archivo].match(/<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/)[0]), `${archivo}: la barra de hoy sigue en la página`);
    } else {
      assert.strictEqual(nueva, '', `${archivo}: Reservar en una barra sin precio`);
    }
  }
});

test('el encabezado: línea de precio y «Ver precios y reservar» sólo donde el mapa lo pide', async () => {
  const { ofertaDe } = await cargar();
  const out = await salida();
  for (const [archivo, html] of Object.entries(out)) {
    const o = ofertaDe(archivo);
    assert.strictEqual(/data-tienda-cabeza/.test(html), Boolean(o && o.cabeza), `${archivo}: línea del encabezado`);
    if (o && o.cabeza) {
      assert.match(html, /<!-- GENERADO:TIENDA cabeza --><p class="tienda-cabeza" data-tienda-cabeza><\/p><!-- \/GENERADO:TIENDA -->\s*<div class="ctas"><!-- GENERADO:TIENDA ir --><a class="btn btn-reservar" href="#precios" data-tienda-ir>/);
      assert.strictEqual(configDe(html).cabeza.clave, o.cabeza);
    }
  }
});

test('el hub de turismo: cada tarjeta de circuito lleva su zona de precio, en los tres idiomas', async () => {
  const { HUB } = await cargar();
  const out = await salida();
  for (const archivo of Object.values(HUB.paginas)) {
    assert.deepStrictEqual([...out[archivo].matchAll(/data-tienda-hub="([^"]+)"/g)].map((m) => m[1]), HUB.circuitos, archivo);
    assert.ok(configDe(out[archivo]), `${archivo}: sin configuración`);
  }
});

test('«Botón de arrepentimiento»: literal, en la fila legal del pie de cada página, a la página que manda el catálogo', async () => {
  const otra = `${SITIO}/lausof/arrepentimiento?x=1`;
  const out = await salida(perfilDemo(), { ...ENLACES, cancelar: otra });
  const etiquetas = { es: 'Botón de arrepentimiento', en: 'Botón de arrepentimiento (withdraw from a purchase)', pt: 'Botón de arrepentimiento (desistir da compra)' };
  for (const [archivo, html] of Object.entries(out)) {
    if (!/<body[\s>]/.test(html)) continue;
    const legal = html.match(/<div class="wrap legal">[\s\S]*?<\/div>/)[0];
    assert.ok(legal.includes(`<a class="pie-arrepentimiento" href="${otra.replace('&', '&amp;')}">${etiquetas[idiomaDe(archivo)]}</a>`), `${archivo}: enlace de arrepentimiento, la dirección del catálogo tal cual`);
    assert.strictEqual((sinEstilos(html).match(/pie-arrepentimiento"/g) || []).length, 1, `${archivo}: un solo enlace`);
  }
  // `enlaces.cancelar` null (el catálogo vivo del 18/11: la página no existe), sin enlaces, de otro origen o
  // inválido: ningún enlace; Web no arma {sitio}/{empresa}/cancelar (terminaba en la pantalla de ingreso).
  for (const enlaces of [{ ...ENLACES, cancelar: null }, null, { cancelar: 'https://otro.example/lausof/cancelar' }, { cancelar: 'no es una url' }]) {
    const sin = await salida(perfilDemo(), enlaces);
    for (const [archivo, html] of Object.entries(sin)) {
      if (!/<body[\s>]/.test(html)) continue;
      assert.doesNotMatch(sinEstilos(html), /pie-arrepentimiento|\/cancelar/, `${archivo} con ${JSON.stringify(enlaces)}`);
      assert.match(html, /<!-- GENERADO:TIENDA pie --><!-- \/GENERADO:TIENDA -->/, `${archivo}: la zona queda vacía`);
    }
  }
  // Peso normal, como «Privacidad» (Lautaro 09/11, V5; reemplaza el dorado en negrita del 05/11):
  // ninguna regla de la vitrina le da color, peso ni tamaño propios.
  const css = fs.readFileSync(path.join(raiz, 'css', 'tienda.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /pie-arrepentimiento/, 'tienda.css no estiliza el enlace de arrepentimiento');
});

test('el botón del chat va redondo y sobre la barra del teléfono (R5)', () => {
  const css = fs.readFileSync(path.join(raiz, 'css', 'tienda.css'), 'utf8');
  assert.match(css, /@media\(max-width:880px\)\{:root\{--apacheta-asistente-abajo:calc\(85px \+ env\(safe-area-inset-bottom\)\);--apacheta-asistente-forma:redonda\}\}/);
});

test('el chat de Apacheta: un script por página con la clave pública; sin clave, ninguno', async () => {
  let out = await salida();
  for (const [archivo, html] of Object.entries(out)) {
    if (!/<body[\s>]/.test(html)) continue;
    // Una vez, dentro de la carga que corre con el `load` (rondas v3 (c): pedido al parsear subía el LCP), y último.
    assert.strictEqual((html.match(/boton\.js/g) || []).length, 1, archivo);
    assert.match(html, /<script>addEventListener\('load',function\(\)\{\[(?:'[^']*',)*'https:\/\/apacheta-demo\.vercel\.app\/asistente\/clavePublicaDePrueba0123456789ab\/boton\.js'\]\.forEach\(function\(u\)\{var s=document\.createElement\('script'\);s\.src=u;s\.async=false;document\.head\.appendChild\(s\)\}\)\}\)<\/script>/, archivo);
    assert.doesNotMatch(html, /<script[^>]+src="[^"]*boton\.js"/, `${archivo}: boton.js no se pide al parsear`);
  }
  out = await salida(perfilDemo({ clave: null }));
  for (const html of Object.values(out)) assert.doesNotMatch(html, /boton\.js/);
});

test('sin SITIO (Apacheta todavía sin host): la página queda con su contacto de hoy, sin bloque ni enlace roto', async () => {
  const out = await salida(perfilDemo({ sitio: null, app: null, clave: null }));
  for (const [archivo, html] of Object.entries(out)) assert.strictEqual(html, paginas[archivo], archivo);
});

/* ---- las elecciones abiertas con Lautaro --------------------------------- */

test('elecciones: cada opción B es un cambio de una línea en el perfil', async () => {
  const sobre = (elecciones) => salida(perfilDemo({ elecciones }), ENLACES);
  let out = await sobre({ barraEn: 'correo-whatsapp-reservar' });
  assert.match(out['en/salta-to-cafayate-transfer.html'], /<div class="wa-bar tres" aria-label="Quick actions" data-tienda-barra>\n {2}<a class="btn btn-ghost" href="mailto:[^"]+">[\s\S]*>Email<\/a>/);

  out = await sobre({ eventos: 'solo-presupuesto' });
  const serenata = out['traslado-serenata-a-cafayate.html'];
  assert.deepStrictEqual(configDe(serenata).bloques[0].servicios.map((s) => s.clave), ['ev_serenata']);
  assert.match(serenata, /<p class="kicker" data-tienda-kicker>Presupuesto<\/p><h2 id="precios-h2">Serenata a Cafayate<\/h2>/);
  assert.doesNotMatch(sinEstilos(serenata), /data-tienda-con-precio|data-tienda-controles/, 'sólo presupuesto: sin precio y sin contador');

  out = await sobre({ arrepentimientoEtiqueta: 'solo-es' });
  assert.match(out['en/index.html'], /<a class="pie-arrepentimiento" href="[^"]+">Botón de arrepentimiento<\/a>/);

  out = await sobre({ netoEtiqueta: 'traduccion' });
  assert.strictEqual(configDe(out['en/salta-to-cafayate-transfer.html']).textos['tienda.neto'], 'Price excl. Argentine national taxes: {neto}');

  out = await sobre({ idiomas: ['es'] });
  assert.strictEqual(configDe(out['en/salta-to-cafayate-transfer.html']), null);
  assert.ok(configDe(out['traslado-salta-cafayate.html']));

  // S1 (por persona): 'demo' la enciende fuera de producción; 'nunca' la apaga; 'siempre' sólo con su sí.
  assert.strictEqual(configDe((await salida())['traslado-salta-cafayate.html']).porPersona, true);
  assert.strictEqual(configDe((await sobre({ porPersona: 'nunca' }))['traslado-salta-cafayate.html']).porPersona, false);
  const { leerPerfil, eleccionesDe } = await cargar();
  assert.strictEqual(leerPerfil({ ...perfilDemo(), nombre: 'produccion' }).porPersona, false, 'S1 no llega a producción sin su sí');
  assert.strictEqual(leerPerfil({ ...perfilDemo({ elecciones: { porPersona: 'siempre' } }), nombre: 'produccion' }).porPersona, true);

  // Sólo pesos (3e §5 A): la moneda ya no es una elección.
  for (const elecciones of [{ moneda: 'USD' }, { monedas: ['USD'] }, { clp: true }]) {
    assert.throws(() => eleccionesDe(perfilDemo({ elecciones })), /desconocida/, JSON.stringify(elecciones));
  }
  assert.throws(() => eleccionesDe(perfilDemo({ elecciones: { porPersona: 'sí' } })), /porPersona/);
  assert.throws(() => eleccionesDe(perfilDemo({ elecciones: { colorBoton: 'rojo' } })), /desconocida/);
});

/* ---- generarTienda (el gancho O4) ---------------------------------------- */

test('generarTienda: rehúsa el repo con el perfil demo, un host http y una copia incompleta', async () => {
  const { generarTienda } = await cargar();
  await assert.rejects(generarTienda({ raiz, perfil: perfilDemo() }), /no se escribe en el repositorio/);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tienda-'));
  fs.writeFileSync(path.join(tmp, 'index.html'), paginas['index.html']);
  await assert.rejects(generarTienda({ raiz: tmp, perfil: perfilDemo({ sitio: 'http://apacheta-demo-sitio.vercel.app' }) }), /https/);
  await assert.rejects(generarTienda({ raiz: tmp, perfil: perfilDemo() }), /no existe/);
});

test('generarTienda sobre una copia: llena las zonas y devuelve lo que escribió; con producción, nada', async () => {
  const { generarTienda } = await cargar();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tienda-'));
  for (const [archivo, html] of Object.entries(paginas)) {
    fs.mkdirSync(path.dirname(path.join(tmp, archivo)), { recursive: true });
    fs.writeFileSync(path.join(tmp, archivo), html);
  }
  assert.deepStrictEqual(await generarTienda({ raiz: tmp, perfil: perfilProduccion }), { escritos: [] });
  const { escritos } = await generarTienda({ raiz: tmp, perfil: perfilDemo() });
  for (const f of ['traslado-salta-cafayate.html', 'turismo.html', 'en/index.html', '404.html']) assert.ok(escritos.includes(f), f);
  assert.match(fs.readFileSync(path.join(tmp, 'turismo.html'), 'utf8'), /<!-- GENERADO:TIENDA estilos --><link rel="stylesheet" href="\/css\/tienda\.css\?v=[0-9a-f]{10}">/);
});

/* ---- el dibujo con el catálogo (js/tienda.js, núcleo puro) -------------- */

const DEMO = 'https://lausof-demo-uvhgjf.netlify.app';
async function ctxDe(archivo, cat = catalogo(), perfil = perfilDemo(), mostrar = true) {
  const config = configDe((await salida(perfil))[archivo]);
  return { config, ctx: t.contexto(config, cat, mostrar, DEMO), cat };
}
const servicioDe = (cat, clave) => cat.servicios.find((s) => s.clave === clave);
const sinEtiquetas = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('el tramo del contador: 1–4 la 4x4, 5–19 la combi, 20 o más «Pedir presupuesto» (3c §2.3, §4)', async () => {
  const { ctx, cat } = await ctxDe('traslado-salta-cafayate.html', conCompra(catalogo()));
  const caf = servicioDe(cat, 'cafayate');
  const e = { clave: 'cafayate', unidad: 'excursion' };
  const ver = (n) => t.zonaDe(caf, e, n, ctx);
  for (const n of [1, 2, 4]) {
    const z = ver(n);
    assert.strictEqual(z.tipo, 'precio', `n=${n}`);
    assert.match(z.zona, /^<span class="tienda-tramo">Para 1 a 4 personas<\/span><b class="tienda-total">ARS 101\.000<\/b><small class="tienda-neto">Precio sin impuestos nacionales: ARS 91\.403<\/small>/);
    assert.strictEqual(z.info, 'En 4x4 con chofer. Entradas y comidas aparte.');
  }
  for (const n of [5, 19]) {
    const z = ver(n);
    assert.match(z.zona, /Para 5 a 19 personas<\/span><b class="tienda-total">ARS 102\.000<\/b><small class="tienda-neto">Precio sin impuestos nacionales: ARS 92\.308/, `n=${n}`);
    assert.strictEqual(z.info, 'En combi con chofer. Entradas y comidas aparte.');
  }
  for (const n of [20, 99]) {
    const z = ver(n);
    assert.strictEqual(z.tipo, 'presupuesto', `n=${n}`);
    assert.strictEqual(z.zona, `<span class="tienda-tramo">Para ${n} personas</span><p class="tienda-mas-de">Para más de 19 personas, se coordina con Lausof.</p>`);
    assert.doesNotMatch(z.zona, /ARS|Precio sin impuestos/, 'sin monto ni neto arriba del máximo');
    assert.strictEqual(z.info, '', 'sin la línea del vehículo');
    assert.deepStrictEqual([z.accion.texto, z.accion.clase], ['Pedir presupuesto', 'btn btn-presupuesto']);
    assert.match(z.accion.href, new RegExp(`[?&]pasajeros=${n}&`), 'el presupuesto llega con la cantidad (R15)');
  }
  // Nunca «desde», «aprox.» en un peso, ni «por vehículo».
  for (const n of [1, 4, 5, 19, 20]) assert.doesNotMatch(sinEtiquetas(ver(n).zona + ver(n).info), /desde|a partir|aprox|orientativ|por vehículo|\$|≈/i);
});

test('un tramo de una sola persona y uno de bordes iguales se leen bien; el máximo del catálogo manda', async () => {
  const { ctx, cat } = await ctxDe('traslado-salta-cafayate.html');
  const caf = servicioDe(cat, 'cafayate');
  const base = caf.precio.tramos;
  caf.precio.tramos = [{ ...base[0], pasajeros_min: 1, pasajeros_max: 1 }, { ...base[0], pasajeros_min: 2, pasajeros_max: 2 }, { ...base[1], pasajeros_min: 3, pasajeros_max: 19 }];
  const e = { clave: 'cafayate', unidad: 'excursion' };
  assert.match(t.zonaDe(caf, e, 1, ctx).zona, />Para 1 persona</);
  assert.match(t.zonaDe(caf, e, 2, ctx).zona, />Para 2 personas</);
  caf.precio.pasajeros_max_reservable = 10;
  assert.strictEqual(t.zonaDe(caf, e, 10, ctx).tipo, 'precio');
  assert.strictEqual(t.zonaDe(caf, e, 11, ctx).tipo, 'presupuesto', 'pasajeros_max_reservable corta antes del último tramo');
  assert.match(t.zonaDe(caf, e, 11, ctx).zona, />Para más de 10 personas, se coordina con Lausof\.</, '{max} es el del catálogo');
  caf.precio.pasajeros_max_reservable = 40;
  assert.strictEqual(t.zonaDe(caf, e, 20, ctx).tipo, 'presupuesto', 'nunca más allá del último tramo');
  assert.match(t.zonaDe(caf, e, 20, ctx).zona, />Para más de 19 personas,/, '{max} nunca pasa del último tramo');
});

test('pasado el máximo, «coordinar» en los tres idiomas con {max} y {empresa} del catálogo (L82)', async () => {
  const e = { clave: 'cafayate', unidad: 'excursion' };
  const casos = [
    ['traslado-salta-cafayate.html', 'Para 25 personas', 'Para más de 19 personas, se coordina con Lausof.', 'Pedir presupuesto'],
    ['en/salta-to-cafayate-transfer.html', 'For 25 people', 'For more than 19 people, Lausof arranges it with you.', 'Request a quote'],
    ['pt/traslado-salta-cafayate.html', 'Para 25 pessoas', 'Para mais de 19 pessoas, é preciso combinar com Lausof.', 'Pedir orçamento'],
  ];
  for (const [archivo, tramo, linea, boton] of casos) {
    const { ctx, cat } = await ctxDe(archivo, conCompra(catalogo()));
    assert.strictEqual(cat.empresa.nombre, 'Lausof', 'el nombre sale del catálogo de prueba');
    const z = t.zonaDe(servicioDe(cat, 'cafayate'), e, 25, ctx);
    assert.strictEqual(z.zona, `<span class="tienda-tramo">${tramo}</span><p class="tienda-mas-de">${linea}</p>`, archivo);
    // El botón y su enlace no cambian: «Pedir presupuesto» con la cantidad (R15).
    assert.deepStrictEqual([z.accion.texto, z.accion.clase], [boton, 'btn btn-presupuesto'], archivo);
    assert.match(z.accion.href, /[?&]pasajeros=25&/, archivo);
  }

  // Otro catálogo: otro máximo y otro nombre. Ningún «19» ni «Lausof» fijo en la salida.
  for (const [archivo, linea] of [
    ['traslado-salta-cafayate.html', 'Para más de 12 personas, se coordina con Empresa de Prueba &amp; Cía.'],
    ['en/salta-to-cafayate-transfer.html', 'For more than 12 people, Empresa de Prueba &amp; Cía arranges it with you.'],
    ['pt/traslado-salta-cafayate.html', 'Para mais de 12 pessoas, é preciso combinar com Empresa de Prueba &amp; Cía.'],
  ]) {
    const cat = catalogo();
    cat.empresa.nombre = ' Empresa de Prueba & Cía ';
    const caf = servicioDe(cat, 'cafayate');
    caf.precio.pasajeros_max_reservable = 12;
    const { ctx } = await ctxDe(archivo, cat);
    const z = t.zonaDe(caf, e, 13, ctx);
    assert.strictEqual(z.tipo, 'presupuesto', archivo);
    assert.ok(z.zona.includes(`<p class="tienda-mas-de">${linea}</p>`), `${archivo}: ${z.zona}`);
    assert.doesNotMatch(z.zona, /19|Lausof/, `${archivo}: ni el 19 ni el nombre de la demo`);
  }

  // Sin nombre en el catálogo: sin la línea (la tarjeta se degrada), el botón queda; nunca un marcador a la vista.
  for (const sinNombre of [(c) => { delete c.empresa; }, (c) => { c.empresa.nombre = '  '; }]) {
    const cat = catalogo();
    sinNombre(cat);
    const { ctx } = await ctxDe('traslado-salta-cafayate.html', cat);
    const z = t.zonaDe(servicioDe(cat, 'cafayate'), e, 25, ctx);
    assert.strictEqual(z.zona, '<span class="tienda-tramo">Para 25 personas</span>');
    assert.strictEqual(z.accion.texto, 'Pedir presupuesto');
    assert.doesNotMatch(z.zona, /\{|\}/);
  }
});

test('tramos con huecos, cruces o sin datos: ningún monto (falla cerrado), «Reservar» queda', async () => {
  const { ctx, cat } = await ctxDe('traslado-salta-cafayate.html');
  const caf = servicioDe(cat, 'cafayate');
  const e = { clave: 'cafayate', unidad: 'excursion' };
  const [a, b] = caf.precio.tramos;
  const casos = {
    hueco: [a, { ...b, pasajeros_min: 6 }],
    cruce: [a, { ...b, pasajeros_min: 4 }],
    'no empieza en 1': [{ ...a, pasajeros_min: 2 }, b],
    'sin neto': [{ ...a, neto_texto: null }, b],
    'sin vehículo': [a, { ...b, vehiculo: '' }],
    'bordes al revés': [{ ...a, pasajeros_min: 4, pasajeros_max: 1 }, b],
    vacio: [],
  };
  for (const [que, tramos] of Object.entries(casos)) {
    caf.precio.tramos = tramos;
    const z = t.zonaDe(caf, e, 2, ctx);
    assert.strictEqual(z.tipo, 'sin_monto', que);
    assert.doesNotMatch(z.zona, /ARS/, que);
    assert.strictEqual(z.accion.texto, 'Reservar', que);
  }
  // El catálogo de antes de R1′ (opciones por vehículo, sin tramos): sin monto.
  caf.precio = { desde: '101000.00', moneda: 'ARS', opciones: [{ vehiculo: '4x4', pasajeros_max: 4, total_texto: 'ARS 101.000', neto_texto: 'ARS 91.403' }] };
  assert.strictEqual(t.zonaDe(caf, e, 2, ctx).tipo, 'sin_monto');
});

test('los montos se imprimen como llegan: Web no calcula, no divide, no convierte (RC-0b)', async () => {
  const cat = catalogo();
  const caf = servicioDe(cat, 'cafayate');
  caf.precio.tramos[0].total_texto = 'ARS 101.000,00 ⟂';
  caf.precio.tramos[0].por_persona_texto['3'] = 'ARS 1 ⟂ raro';
  const { ctx } = await ctxDe('traslado-salta-cafayate.html', cat);
  const e = { clave: 'cafayate', unidad: 'excursion' };
  const z = t.zonaDe(caf, e, 3, ctx);
  assert.match(z.zona, /<b class="tienda-total">ARS 101\.000,00 ⟂<\/b>/);
  assert.match(z.zona, /<span class="tienda-pp">ARS 1 ⟂ raro por persona<\/span>/, 'el por persona es el del catálogo, palabra por palabra');
  const codigo = fs.readFileSync(path.join(raiz, 'js', 'tienda.js'), 'utf8');
  assert.doesNotMatch(codigo, /toLocaleString|NumberFormat|\/\s*n\b|parseFloat/, 'js/tienda.js no formatea ni divide montos');
});

test('el total nunca sin su neto ni su tramo; el por persona sólo a partir de 2, con la elección y nunca por día (S1)', async () => {
  const { ctx, cat } = await ctxDe('traslado-salta-cafayate.html');
  const caf = servicioDe(cat, 'cafayate');
  const e = { clave: 'cafayate', unidad: 'excursion' };
  for (let n = 1; n <= 19; n += 1) {
    const z = t.zonaDe(caf, e, n, ctx).zona;
    assert.match(z, /<span class="tienda-tramo">Para \d+ a \d+ personas<\/span><b class="tienda-total">ARS [\d.]+<\/b><small class="tienda-neto">Precio sin impuestos nacionales: ARS [\d.]+<\/small>/, `n=${n}`);
  }
  assert.doesNotMatch(t.zonaDe(caf, e, 1, ctx).zona, /por persona/, 'a 1 persona es igual al total (A4)');
  assert.match(t.zonaDe(caf, e, 2, ctx).zona, /<span class="tienda-pp">ARS 50\.500 por persona<\/span>$/);
  assert.match(t.zonaDe(caf, e, 5, ctx).zona, /ARS 20\.400 por persona/);
  // Sin el texto del catálogo para esa cantidad, no hay línea (Web no divide).
  delete caf.precio.tramos[0].por_persona_texto['3'];
  assert.doesNotMatch(t.zonaDe(caf, e, 3, ctx).zona, /por persona/);
  // La elección 'nunca': sin línea aunque el catálogo la mande.
  const { ctx: sinPp } = await ctxDe('traslado-salta-cafayate.html', cat, perfilDemo({ elecciones: { porPersona: 'nunca' } }));
  assert.doesNotMatch(t.zonaDe(caf, e, 2, sinPp).zona, /por persona/);
  // Por día: nunca por persona, aunque el catálogo lo mande.
  const dia = servicioDe(cat, 'charter_dia');
  dia.precio.tramos[0].por_persona_texto = { 2: 'ARS 1.150.500' };
  assert.doesNotMatch(t.zonaDe(dia, { clave: 'charter_dia', unidad: 'por_dia' }, 2, ctx).zona, /por persona/);
});

test('por día: «ARS 2.301.000 por día», «Hasta 250 km por día.» y sin km no hay monto (4-textos §2.3)', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-serenata-a-cafayate.html');
  assert.deepStrictEqual(config.bloques[0].servicios.map((s) => [s.clave, s.unidad]), [['charter_dia', 'por_dia'], ['ev_serenata', null]]);
  const dia = servicioDe(cat, 'charter_dia');
  const e = config.bloques[0].servicios[0];
  const z = t.zonaDe(dia, e, 2, ctx);
  assert.match(z.zona, /Para 1 a 4 personas<\/span><b class="tienda-total">ARS 2\.301\.000<small> por día<\/small><\/b><small class="tienda-neto">Precio sin impuestos nacionales/);
  assert.strictEqual(z.info, 'En 4x4 con chofer. Hasta 250 km por día.');
  assert.match(t.zonaDe(dia, e, 6, ctx).zona, /Para 5 a 19 personas[\s\S]*ARS 2\.302\.000<small> por día/);
  assert.match(z.voz, /: ARS 2\.301\.000 por día\.$/);
  // Los dos: arriba de 19, el por día y el del evento son presupuesto.
  const hecho = t.bloque(cat, config.bloques[0].servicios, 20, ctx);
  assert.deepStrictEqual(hecho.zonas.map((x) => x.tipo), ['presupuesto', 'sin_precio']);
  for (const x of dia.precio.tramos) delete x.km_incluidos;
  assert.strictEqual(t.zonaDe(dia, e, 2, ctx).tipo, 'sin_monto', 'un precio por día sin sus km no se muestra');
});

test('la página de la 4x4: sólo el primer tramo; más personas, «Pedir presupuesto» (3c §8)', async () => {
  const { config, ctx, cat } = await ctxDe('alquiler-4x4.html');
  const e = config.bloques[0].servicios[0];
  assert.strictEqual(e.tramos, 'primero');
  const dia = servicioDe(cat, 'charter_dia');
  assert.match(t.zonaDe(dia, e, 4, ctx).zona, /Para 1 a 4 personas[\s\S]*ARS 2\.301\.000/);
  assert.strictEqual(t.zonaDe(dia, e, 5, ctx).tipo, 'presupuesto');
  assert.doesNotMatch(t.bloque(cat, config.bloques[0].servicios, 2, ctx).html, /combi/);
  assert.match(t.lineaCabeza(cat, config.cabeza, 2, ctx), /· para 1 a 4 personas/);
});

test('«Reservar» con compra en el catálogo: su dirección con pasajeros, idioma y desde, nunca moneda; misma pestaña (R8, R15; 3e §5 A)', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cafayate.html', conCompra(catalogo()));
  const caf = servicioDe(cat, 'cafayate');
  const e = config.bloques[0].servicios[0];
  const desde = 'desde=https%3A%2F%2Flausof-demo-uvhgjf.netlify.app%2Ftraslado-salta-cafayate.html';
  assert.strictEqual(t.zonaDe(caf, e, 5, ctx).accion.href, `${SITIO}/lausof/reservar?servicio=cafayate&idioma=es&pasajeros=5&${desde}`);
  assert.strictEqual(t.zonaDe(caf, e, 5, ctx).accion.chat, false);
  const hecho = t.bloque(cat, config.bloques[0].servicios, 2, ctx);
  assert.doesNotMatch(hecho.html, /target="_blank"[^>]*>Reservar/);
  assert.doesNotMatch(hecho.html, /data-asistente-abrir[^>]*data-tienda-accion/, 'la compra no es el chat');
  for (const href of [...hecho.html.matchAll(/href="([^"]+)" data-tienda-accion/g)].map((m) => m[1].replace(/&amp;/g, '&'))) {
    const u = new URL(href);
    assert.deepStrictEqual([...u.searchParams.keys()], ['servicio', 'idioma', 'pasajeros', 'desde'], href);
    assert.strictEqual(u.searchParams.get('pasajeros'), '2');
  }
  // Otra ruta del mismo origen: se usa tal cual llega (Web no la cambia ni la arma).
  caf.reservar = `${SITIO}/lausof/compra/cafayate?ref=catalogo`;
  assert.strictEqual(t.zonaDe(caf, e, 3, ctx).accion.href, `${SITIO}/lausof/compra/cafayate?ref=catalogo&pasajeros=3&idioma=es&${desde}`);
  // En inglés, el idioma de la página aunque el catálogo diga otro.
  const en = await ctxDe('en/salta-to-cafayate-transfer.html', conCompra(catalogo()));
  assert.match(t.zonaDe(servicioDe(en.cat, 'cafayate'), en.config.bloques[0].servicios[0], 2, en.ctx).accion.href, /[?&]idioma=en&/);
  // Sin precio publicado: el presupuesto también lleva la cantidad.
  const uyuni = await ctxDe('traslado-uyuni-salta.html', conCompra(catalogo()));
  const vuelta = t.bloque(uyuni.cat, uyuni.config.bloques[0].servicios, 7, uyuni.ctx);
  assert.ok(vuelta.soloPresupuesto);
  assert.match(vuelta.html, /<p class="tienda-sin-precio">Precio a medida del viaje\.<\/p><\/div><p class="tienda-info" data-tienda-info hidden><\/p><a class="btn btn-presupuesto" href="[^"]+idioma=es&amp;pasajeros=7[^"]+" data-tienda-accion>Pedir presupuesto<\/a>/);
  assert.doesNotMatch(vuelta.html, /no disponible|consultar|sin precio/i);
});

test('«Reservar» sin compra en el catálogo (`reservar: null`, 18/11): abre el chat, o WhatsApp sin chat; nunca una dirección armada con la clave', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cafayate.html');
  const caf = servicioDe(cat, 'cafayate');
  assert.strictEqual(caf.reservar, null, 'el catálogo de prueba tiene la forma del vivo');
  const e = config.bloques[0].servicios[0];
  const wa = config.wa;
  assert.match(wa, /^https:\/\/wa\.me\/5493875269009\?text=/, 'el WhatsApp de la barra de la página, el 526-9009');
  for (const [n, texto, clase] of [[2, 'Reservar', 'btn btn-reservar'], [25, 'Pedir presupuesto', 'btn btn-presupuesto']]) {
    const z = t.zonaDe(caf, e, n, ctx);
    assert.deepStrictEqual(z.accion, { texto, clase, href: wa, chat: true }, `n=${n}`);
  }
  const hecho = t.bloque(cat, config.bloques[0].servicios, 2, ctx);
  const botones = [...hecho.html.matchAll(/<a class="btn btn-reservar"[^>]*data-tienda-accion>/g)].map((m) => m[0]);
  assert.strictEqual(botones.length, 3);
  // El enganche del chat con lo que sabe la tarjeta (contrato vitrina → chat v1): la clave del catálogo, las personas y el idioma.
  const claves = config.bloques[0].servicios.map((x) => t.buscar(cat, x).clave);
  botones.forEach((b, i) => assert.strictEqual(b, `<a class="btn btn-reservar" href="${wa.replace(/&/g, '&amp;')}" target="_blank" rel="noopener" data-asistente-abrir data-asistente-v="1" data-asistente-servicio="${claves[i]}" data-asistente-pasajeros="2" data-asistente-idioma="es" data-tienda-accion>`));
  assert.doesNotMatch(hecho.html, /\/reservar|[?&]servicio=/, 'ninguna dirección de compra');
  // Pasado el máximo, «o armarlo en el chat» no se repite: el botón ya abre el chat.
  assert.match(t.tarjeta(caf, e, 25, ctx).html, /<a class="tienda-chat"[^>]*data-asistente-abrir data-asistente-v="1" data-asistente-servicio="cafayate" data-asistente-pasajeros="25" data-asistente-idioma="es" hidden>o armarlo en el chat<\/a>/);
  assert.match(t.lineaCabeza(cat, config.cabeza, 25, ctx), new RegExp(`<a class="tienda-total" href="${wa.replace(/&/g, '&amp;').replace(/[.?+]/g, '\\$&')}" target="_blank" rel="noopener" data-asistente-abrir data-asistente-v="1" data-asistente-servicio="cafayate" data-asistente-pasajeros="25" data-asistente-idioma="es">Pedir presupuesto</a>$`));
  // Sin chat en la página (sin clave): WhatsApp, sin el enganche del chat.
  const sin = await ctxDe('traslado-salta-cafayate.html', catalogo(), perfilDemo({ clave: null }));
  const zs = t.zonaDe(servicioDe(sin.cat, 'cafayate'), e, 2, sin.ctx);
  assert.strictEqual(zs.accion.href, wa);
  assert.doesNotMatch(t.bloque(sin.cat, sin.config.bloques[0].servicios, 2, sin.ctx).html, /data-asistente-abrir/);
  assert.match(t.bloque(sin.cat, sin.config.bloques[0].servicios, 2, sin.ctx).html, /<a class="btn btn-reservar" href="https:\/\/wa\.me\/5493875269009\?text=[^"]+" target="_blank" rel="noopener" data-tienda-accion>Reservar<\/a>/);
  // Una compra de otro origen, o que no es una URL, cuenta como sin compra.
  for (const malo of ['https://otro.example/lausof/reservar?servicio=robado', 'no es una url', '']) {
    caf.reservar = malo;
    assert.deepStrictEqual([t.urlReservar(caf, ctx, { pasajeros: 2 }), t.zonaDe(caf, e, 2, ctx).accion.href], [null, wa], malo);
  }
  delete caf.reservar;
  assert.strictEqual(t.zonaDe(caf, e, 2, ctx).accion.href, wa, 'sin el campo, igual');
});

/* ---- lo que el chat sabe de la tarjeta (contrato vitrina → chat v1 de Apacheta) ---- */

// Los enlaces al chat de un pedazo de HTML, cada uno con sus data-asistente-*.
const CONTEXTO = /\sdata-asistente-(?:v|servicio|pasajeros|fecha|idioma)="[^"]*"/g;
const enlacesAlChat = (html) => [...html.matchAll(/<a [^>]*data-asistente-abrir[^>]*>([^<]*)<\/a>/g)].map((m) => ({
  texto: m[1],
  clase: (m[0].match(/class="([^"]+)"/) || [])[1],
  datos: Object.fromEntries([...m[0].matchAll(/data-asistente-([a-z]+)="([^"]*)"/g)].map((x) => [x[1], x[2]])),
}));

test('chat con contexto: «Reservar», «Pedir presupuesto» y «o armarlo en el chat» llevan la clave del catálogo, las personas y el idioma de la página, en es/en/pt; nunca fecha', async () => {
  for (const [archivo, idioma] of [['traslado-salta-cafayate.html', 'es'], ['en/salta-to-cafayate-transfer.html', 'en'], ['pt/traslado-salta-cafayate.html', 'pt']]) {
    const sinCompra = await ctxDe(archivo);
    const conLa = await ctxDe(archivo, conCompra(catalogo()));
    const entradas = sinCompra.config.bloques[0].servicios;
    const claves = entradas.map((x) => t.buscar(sinCompra.cat, x).clave);
    assert.deepStrictEqual(claves, ['cafayate', 'tr_cafayate', 'valles_2d'], archivo);
    // Con precio (n=2) y pasado el máximo, «coordinar» (n=25): los dos botones, con las personas que eligió.
    for (const n of [2, 25]) {
      const chat = enlacesAlChat(t.bloque(sinCompra.cat, entradas, n, sinCompra.ctx).html).filter((x) => x.clase.startsWith('btn '));
      assert.strictEqual(chat.length, 3, `${archivo} n=${n}`);
      chat.forEach((x, i) => assert.deepStrictEqual(x.datos, { v: '1', servicio: claves[i], pasajeros: String(n), idioma }, `${archivo} n=${n} ${x.texto}`));
      assert.deepStrictEqual(chat.map((x) => x.clase), Array(3).fill(n === 2 ? 'btn btn-reservar' : 'btn btn-presupuesto'));
    }
    // Con compra: el botón es la compra (sin contexto del chat) y «o armarlo en el chat» lleva el contexto.
    const compra = t.bloque(conLa.cat, entradas, 25, conLa.ctx).html;
    assert.doesNotMatch(compra.match(/<a class="btn btn-presupuesto"[^>]*>/)[0], /data-asistente/, 'la compra no lleva nada del chat');
    const aparte = enlacesAlChat(compra).filter((x) => x.clase === 'tienda-chat');
    assert.deepStrictEqual(aparte.map((x) => x.datos), claves.map((servicio) => ({ v: '1', servicio, pasajeros: '25', idioma })), archivo);
    // El encabezado «para 25 personas · Pedir presupuesto».
    assert.deepStrictEqual(enlacesAlChat(t.lineaCabeza(sinCompra.cat, sinCompra.config.cabeza, 25, sinCompra.ctx))[0].datos, { v: '1', servicio: 'cafayate', pasajeros: '25', idioma });
    // La vitrina no elige día: ningún enlace inventa uno.
    assert.doesNotMatch(t.bloque(sinCompra.cat, entradas, 2, sinCompra.ctx).html + compra, /data-asistente-fecha/, archivo);
  }
});

test('chat con contexto: la clave sale del catálogo al dibujar (otra clave, otro servicio, el id si falta), nunca de una lista escrita', async () => {
  const { config, ctx } = await ctxDe('traslado-salta-cafayate.html');
  const cat = catalogo();
  // Otras claves en el catálogo (el mapa ata por nombre): el atributo sigue al catálogo.
  servicioDe(cat, 'cafayate').clave = 'clave_de_prueba_7';
  servicioDe(cat, 'tr_cafayate').clave = 'otro_servicio_8';
  const valles = servicioDe(cat, 'valles_2d');
  delete valles.clave; // sin clave: su id, que el contrato también acepta
  const datos = enlacesAlChat(t.bloque(cat, config.bloques[0].servicios, 2, ctx).html).filter((x) => x.clase.startsWith('btn ')).map((x) => x.datos.servicio);
  assert.deepStrictEqual(datos, ['clave_de_prueba_7', 'otro_servicio_8', valles.id]);
  // Una clave o un id con otra forma no viajan (ni se escriben en el HTML); el resto del contexto sí.
  valles.clave = 'Valles"><script>';
  valles.id = 'no-es-un-id';
  const html = t.tarjeta(valles, config.bloques[0].servicios[2], 2, ctx).html;
  assert.doesNotMatch(html, /<script>|Valles"/);
  assert.deepStrictEqual(enlacesAlChat(html)[0].datos, { v: '1', pasajeros: '2', idioma: 'es' });
  // contextoChat: sólo los cinco campos del contrato, valores ya válidos.
  assert.deepStrictEqual(t.contextoChat({ clave: 'cafayate', nombre: 'X', precio: {} }, ctx, 7), [['data-asistente-v', '1'], ['data-asistente-servicio', 'cafayate'], ['data-asistente-pasajeros', '7'], ['data-asistente-idioma', 'es']]);
  assert.deepStrictEqual(t.contextoChat(null, { idioma: 'fr' }, 0), [['data-asistente-v', '1']], 'sin servicio, personas inválidas, idioma que no es es/en/pt');
});

test('chat con contexto: sin contador no hay personas elegidas (bloque sólo «Precio a medida»); el evento a medida al lado de uno con precio sí las lleva', async () => {
  const uyuni = await ctxDe('traslado-uyuni-salta.html');
  const vuelta = t.bloque(uyuni.cat, uyuni.config.bloques[0].servicios, 7, uyuni.ctx);
  assert.ok(vuelta.soloPresupuesto && !vuelta.conTramos, 'este bloque oculta el contador');
  assert.deepStrictEqual(enlacesAlChat(vuelta.html).filter((x) => x.clase.startsWith('btn ')).map((x) => x.datos), [{ v: '1', servicio: 'uyuni_vuelta', idioma: 'es' }]);
  const serenata = await ctxDe('traslado-serenata-a-cafayate.html');
  const ev = t.bloque(serenata.cat, serenata.config.bloques[0].servicios, 3, serenata.ctx);
  assert.ok(ev.conTramos);
  const datos = [...serenata.config.bloques.flatMap((b) => enlacesAlChat(t.bloque(serenata.cat, b.servicios, 3, serenata.ctx).html))].filter((x) => x.clase.startsWith('btn ')).map((x) => x.datos);
  assert.ok(datos.some((d) => d.servicio === 'ev_serenata' && d.pasajeros === '3'), JSON.stringify(datos));
});

test('chat con contexto: nada visible cambia y sin chat no hay ningún atributo del chat', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cafayate.html');
  const entradas = config.bloques[0].servicios;
  for (const n of [2, 25]) {
    const html = t.bloque(cat, entradas, n, ctx).html;
    // Sacando los atributos del contrato queda el HTML de antes (el enganche R6 sólo), y el texto es el mismo.
    assert.doesNotMatch(html.replace(CONTEXTO, ''), /data-asistente-(?!abrir)/);
    assert.strictEqual(sinEtiquetas(html), sinEtiquetas(html.replace(CONTEXTO, '')));
  }
  const sin = await ctxDe('traslado-salta-cafayate.html', catalogo(), perfilDemo({ clave: null }));
  const todo = t.bloque(sin.cat, sin.config.bloques[0].servicios, 25, sin.ctx).html + t.renglonFinal(sin.ctx) + t.lineaCabeza(sin.cat, sin.config.cabeza, 25, sin.ctx);
  assert.doesNotMatch(todo, /data-asistente/);
});

test('el anuncio del contador: la cantidad y hasta tres precios; presupuesto con su palabra; nada de las tarjetas a medida (3c §6)', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cachi.html');
  const entradas = config.bloques[0].servicios;
  assert.strictEqual(entradas.length, 5);
  const zonas = (n) => t.bloque(cat, entradas, n, ctx).zonas;
  assert.strictEqual(t.textoVivo(zonas(5), 5, ctx),
    '5 personas. Cachi (Cuesta del Obispo y Los Cardones): ARS 602.000, ARS 120.400 por persona. Salta – Cachi (un tramo): ARS 702.000, ARS 140.400 por persona. Vuelta a los Valles en 1 día (Cachi – Ruta 40 – Cafayate): ARS 302.000, ARS 60.400 por persona. Y 2 precios más en esta sección.');
  assert.match(t.textoVivo(zonas(1), 1, ctx), /^1 persona\. Cachi \(Cuesta del Obispo y Los Cardones\): ARS 601\.000\. /, 'a 1 persona, sin por persona');
  assert.match(t.textoVivo(zonas(20), 20, ctx), /^20 personas\. Cachi \(Cuesta del Obispo y Los Cardones\): pedir presupuesto\. Salta – Cachi \(un tramo\): pedir presupuesto\./);
  // Una sola de más: «Y 1 precio más».
  assert.match(t.textoVivo(zonas(2).slice(0, 4), 2, ctx), /Y 1 precio más en esta sección\.$/);
  // Las de «Precio a medida» no se nombran.
  const serenata = await ctxDe('traslado-serenata-a-cafayate.html');
  const vivo = t.textoVivo(t.bloque(serenata.cat, serenata.config.bloques[0].servicios, 3, serenata.ctx).zonas, 3, serenata.ctx);
  assert.doesNotMatch(vivo, /Serenata/);
  // EN y PT.
  const en = await ctxDe('en/salta-to-cachi-transfer.html');
  assert.match(t.textoVivo(t.bloque(cat, en.config.bloques[0].servicios, 5, en.ctx).zonas, 5, en.ctx), /^5 people\. [^.]+\): ARS 602\.000, ARS 120\.400 per person\. [\s\S]*And 2 more prices in this section\.$/);
  const pt = await ctxDe('pt/traslado-salta-cafayate.html');
  assert.match(t.textoVivo(t.bloque(cat, pt.config.bloques[0].servicios, 1, pt.ctx).zonas, 1, pt.ctx), /^1 pessoa\. /);
});

test('sólo pesos: un catálogo que todavía manda `monedas` y `aprox` se ve en pesos, sin «Ver en», sin «Aprox.» y sin `moneda` (3e §5 A, D13)', async () => {
  const cat = catalogo();
  // El catálogo de prueba guarda los campos de la moneda a propósito (3e §10 Δ8).
  assert.ok(cat.monedas.length > 0, 'el catálogo de prueba manda monedas');
  assert.ok(cat.servicios.some((s) => s.precio && (s.precio.tramos || []).some((x) => x.aprox && Object.keys(x.aprox).length)), 'y aprox');
  const out = await salida();
  // En la página entera, las marcas de la moneda; en las tarjetas, además, cualquier código o palabra de la conversión.
  const marcas = /Aprox\.|Approx\.|tienda-aprox|tienda-moneda|tienda-chip-m|data-tienda-moneda|data-tienda-nota|lausof\.moneda|data-moneda|[?&](amp;)?moneda=|BCRA/;
  const prohibido = new RegExp(`${marcas.source}|type="radio"|Ver en|Show in|Ver em|USD|EUR|BRL|CLP`);
  for (const a of ['traslado-salta-cafayate.html', 'en/salta-to-cafayate-transfer.html', 'pt/traslado-salta-cafayate.html', 'turismo.html', 'traslado-serenata-a-cafayate.html']) {
    assert.doesNotMatch(out[a], marcas, `${a}: la página no trae selector, nota ni lectura de una moneda guardada`);
    assert.ok(!('monedas' in configDe(out[a])), `${a}: la configuración no lleva monedas`);
  }
  for (const archivo of ['traslado-salta-cafayate.html', 'traslado-salta-cachi.html', 'traslado-serenata-a-cafayate.html', 'en/salta-to-cafayate-transfer.html']) {
    const { config, ctx } = await ctxDe(archivo, cat);
    for (const n of [1, 2, 5, 19, 20]) {
      const hecho = t.bloque(cat, config.bloques[0].servicios, n, ctx);
      assert.ok(hecho.montos > 0 || n === 20, `${archivo} n=${n}: con montos`);
      assert.doesNotMatch(hecho.html, prohibido, `${archivo} n=${n}`);
      assert.doesNotMatch(t.textoVivo(hecho.zonas, n, ctx), /aproximad|approximat|Aprox|USD|EUR|BRL/i, `${archivo} n=${n}: el anuncio`);
      for (const href of [...hecho.html.matchAll(/href="([^"]+)" data-tienda-accion/g)].map((m) => m[1].replace(/&amp;/g, '&'))) {
        assert.ok(!new URL(href).searchParams.has('moneda'), href);
      }
      if (config.cabeza) assert.doesNotMatch(t.lineaCabeza(cat, config.cabeza, n, ctx) || '', prohibido, `${archivo} n=${n}: el encabezado`);
    }
  }
  // js/tienda.js no lee las monedas del catálogo ni guarda una moneda.
  const codigo = fs.readFileSync(path.join(raiz, 'js', 'tienda.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, /\.monedas\b|\.aprox\b|lausof\.moneda|localStorage|data-moneda/);
});

test('el contador acepta sólo números de 1 a 99; lo demás vuelve al último válido (3c §6)', () => {
  assert.strictEqual(t.personasValidas('5'), 5);
  assert.strictEqual(t.personasValidas(' 19 '), 19);
  assert.strictEqual(t.personasValidas('150'), 99);
  for (const malo of ['', '0', '00', '-3', '2a', 'abc', null, undefined, '1.5', '1e2']) assert.strictEqual(t.personasValidas(malo), null, String(malo));
  assert.strictEqual(t.personasIniciales('6', null), 6, 'la de la sesión');
  assert.strictEqual(t.personasIniciales(null, { precio: { pasajeros_defecto: 3 } }), 3, 'la del catálogo');
  assert.strictEqual(t.personasIniciales('x', null), 2, 'si no, 2');
  assert.strictEqual(t.personasIniciales(null, { precio: { pasajeros_defecto: 0 } }), 2);
});

test('sin el visto de precios-host.js no hay montos, ni PRUEBA, ni contador (3b G10)', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cafayate.html', catalogo(), perfilDemo(), false);
  assert.strictEqual(ctx.mostrarPrecios, false);
  assert.strictEqual(ctx.chips, false);
  const hecho = t.bloque(cat, config.bloques[0].servicios, 2, ctx);
  assert.strictEqual(hecho.montos, 0);
  assert.strictEqual(hecho.conTramos, false);
  assert.doesNotMatch(hecho.html, /ARS \d/);
  assert.strictEqual(t.lineaCabeza(cat, config.cabeza, 2, ctx), null);
  const real = catalogo(); real.demo = false;
  assert.strictEqual((await ctxDe('traslado-salta-cafayate.html', real)).ctx.chips, false, 'PRUEBA sólo con "demo": true');
  const demo = await ctxDe('traslado-salta-cafayate.html');
  assert.match(t.lineaCabeza(demo.cat, demo.config.cabeza, 2, demo.ctx), /<span class="tienda-chip">PRUEBA<\/span>/);
});

test('la línea del encabezado sigue al contador: el primer servicio, su tramo, su neto; arriba del máximo, el presupuesto', async () => {
  const { config, ctx, cat } = await ctxDe('traslado-salta-cafayate.html', conCompra(catalogo()));
  assert.strictEqual(t.lineaCabeza(cat, config.cabeza, 2, ctx),
    '<span class="tienda-cabeza-q">Cafayate (Quebrada de las Conchas) · para 1 a 4 personas</span> <b class="tienda-total">ARS 101.000</b> <span class="tienda-chip">PRUEBA</span><small class="tienda-neto">Precio sin impuestos nacionales: ARS 91.403</small>');
  assert.match(t.lineaCabeza(cat, config.cabeza, 7, ctx), /· para 5 a 19 personas<\/span> <b class="tienda-total">ARS 102\.000/);
  assert.doesNotMatch(t.lineaCabeza(cat, config.cabeza, 2, ctx), /por persona/, 'sin por persona en el encabezado (3c §2.2)');
  assert.match(t.lineaCabeza(cat, config.cabeza, 20, ctx), /^<span class="tienda-cabeza-q">Cafayate \(Quebrada de las Conchas\) · para 20 personas<\/span> <a class="tienda-total" href="[^"]+pasajeros=20[^"]+">Pedir presupuesto<\/a>$/);
  const en = await ctxDe('en/salta-to-cafayate-transfer.html');
  assert.match(t.lineaCabeza(cat, en.config.cabeza, 1, en.ctx), /· for 1 to 4 people/);
});

test('inglés y portugués: la leyenda del catálogo con su traducción, el vehículo en la frase del idioma, los montos como llegan', async () => {
  const cat = conCompra(catalogo());
  cat.textos.neto = 'PRECIO SIN IMPUESTOS NACIONALES'; // si Lautaro elige mayúsculas (LEG-01 B), Web no cambia código
  const en = await ctxDe('en/salta-to-cafayate-transfer.html', cat);
  const z = t.zonaDe(servicioDe(cat, 'cafayate'), en.config.bloques[0].servicios[0], 6, en.ctx);
  assert.match(z.zona, /For 5 to 19 people<\/span><b class="tienda-total">ARS 102\.000<\/b><small class="tienda-neto">PRECIO SIN IMPUESTOS NACIONALES \(excl\. Argentine taxes\): ARS 92\.308<\/small><span class="tienda-pp">ARS 17\.000 per person/);
  assert.strictEqual(z.info, 'By combi with a driver. Entry fees and meals not included.');
  assert.match(z.accion.href, /idioma=en&pasajeros=6&desde=https%3A%2F%2Flausof-demo-uvhgjf\.netlify\.app%2Fen%2Fsalta-to-cafayate-transfer\.html$/);
  assert.strictEqual(z.accion.texto, 'Book');
  const pt = await ctxDe('pt/traslado-salta-cafayate.html');
  const zp = t.zonaDe(servicioDe(pt.cat, 'cafayate'), pt.config.bloques[0].servicios[0], 1, pt.ctx);
  assert.match(zp.zona, /Para 1 a 4 pessoas[\s\S]*Precio sin impuestos nacionales \(sem impostos argentinos\)/);
  assert.strictEqual(zp.info, 'De 4x4 com motorista. Ingressos e refeições à parte.');
});

test('el título del bloque es el nombre corto de la página y no cambia al cargar (4-textos §2.1)', async () => {
  const out = await salida();
  const h2 = (a) => (out[a].match(/<h2 id="precios-h2">([^<]*?)(?: <span class="tienda-chip" data-tienda-chip>[^<]+<\/span>)?<\/h2>/) || [])[1];
  assert.strictEqual(h2('traslado-salta-cafayate.html'), 'Salta – Cafayate');
  assert.strictEqual(h2('en/salta-to-cafayate-transfer.html'), 'Salta to Cafayate');
  assert.strictEqual(h2('traslado-serenata-a-cafayate.html'), 'Serenata a Cafayate');
  assert.strictEqual(h2('traslado-uyuni-salta.html'), 'Uyuni – Salta');
  // La 4x4 fija su título en el mapa (`titulo`): su miga es «Camionetas 4x4»,
  // pero el turista siempre va con chofer, y el bloque de precios lo dice.
  assert.match(out['alquiler-4x4.html'], /<li aria-current="page">Camionetas 4x4<\/li>/, 'la miga sigue diciendo «Camionetas 4x4»');
  assert.strictEqual(h2('alquiler-4x4.html'), '4x4 con chofer', 'el bloque de la 4x4 dice «con chofer», no la miga');
  assert.strictEqual(h2('en/4x4-rental.html'), '4x4 with a driver');
  for (const a of ['alquiler-4x4.html', 'en/4x4-rental.html']) {
    const bloque = (out[a].match(/<!-- GENERADO:TIENDA bloque -->[\s\S]*?<!-- \/GENERADO:TIENDA -->/) || [''])[0];
    assert.doesNotMatch(bloque, /Camionetas 4x4|4x4 pickup rental/, `${a}: el bloque de precios no se titula con la miga`);
  }
  assert.strictEqual(h2('golf-torneos.html'), 'Torneos de golf', 'sin migas: el <h1> de la página');
  for (const [a, html] of Object.entries(out)) {
    const x = (html.match(/<h2 id="precios-h2">([^<]*)/) || [])[1];
    if (x !== undefined) assert.doesNotMatch(x, /Cuánto cuesta|What it costs|: prices|Quanto custa|^Precios y reserva$/, a);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(raiz, 'js', 'tienda.js'), 'utf8'), /h2\.textContent\s*=/, 'js/tienda.js no reescribe el título');
  // El chip va en el HTML (invisible) sólo fuera de producción, y sólo en bloques con precio.
  assert.match(out['traslado-salta-cafayate.html'], /<h2 id="precios-h2">Salta – Cafayate <span class="tienda-chip" data-tienda-chip>PRECIOS DE PRUEBA<\/span><\/h2>/);
  assert.doesNotMatch(sinEstilos(out['traslado-uyuni-salta.html']), /data-tienda-chip/, 'sólo presupuesto: sin chip');
  const { leerPerfil } = await cargar();
  assert.strictEqual(leerPerfil({ ...perfilDemo(), nombre: 'produccion' }).chipDemo, false, 'producción nunca lleva el chip de prueba');
});

test('el bloque: el contador inerte en el HTML, la región viva vacía de precios, el esqueleto y el <noscript> (3c §5, §6)', async () => {
  const out = await salida();
  const html = out['traslado-salta-cafayate.html'];
  const bloque = html.match(/<!-- GENERADO:TIENDA bloque -->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/)[1];
  assert.match(bloque, /<label for="personas-precios">Personas<\/label><span class="tienda-contador-ctl"><button type="button" class="tienda-menos" data-tienda-menos aria-label="Quitar una persona" aria-controls="personas-precios" disabled>−<\/button><input id="personas-precios" data-tienda-personas type="text" inputmode="numeric" pattern="\[0-9\]\*" role="spinbutton" aria-valuemin="1" aria-valuemax="99" aria-valuenow="2" aria-valuetext="2 personas" value="2" autocomplete="off" disabled><button type="button" class="tienda-mas-uno" data-tienda-mas-uno aria-label="Agregar una persona" aria-controls="personas-precios" disabled>\+<\/button>/);
  assert.doesNotMatch(bloque, /tienda-moneda|<fieldset|type="radio"/, 'sin selector de moneda (3e §5 A)');
  assert.doesNotMatch(bloque, /type="number"/, 'nunca type=number (GOV.UK)');
  assert.strictEqual((bloque.match(/aria-live="polite"/g) || []).length, 1, 'una región viva por bloque');
  assert.match(bloque, /<p class="tienda-sr" aria-live="polite" aria-atomic="true" data-tienda-vivo>Cargando precios…<\/p>/);
  assert.doesNotMatch(bloque, /tienda-nota/, 'sin nota del cambio');
  // Sin JavaScript no hay catálogo, así que tampoco dirección de compra: WhatsApp (Web no arma /reservar, 18/11).
  assert.match(bloque, /<noscript><div class="cards tienda-cards"><article class="card tienda-card tienda-error"><div class="card-body"><p>Los precios no se pudieron mostrar en este momento\.<\/p><a class="btn btn-wa" href="https:\/\/wa\.me\/5493875269009\?text=[^"]+" target="_blank" rel="noopener">Consultar por WhatsApp<\/a><\/div><\/article><\/div><\/noscript>/);
  for (const [archivo, h] of Object.entries(out)) assert.doesNotMatch(sinEstilos(h), /\/reservar\?|\/cancelar/, `${archivo}: ninguna dirección de Apacheta armada en el HTML`);
  // En la página EN, las palabras de EN.
  assert.match(out['en/salta-to-cafayate-transfer.html'], /<label for="personas-precios">People<\/label>[\s\S]*aria-label="Remove one person"[\s\S]*aria-valuetext="2 people"/);
  // El hub: los controles bajo la bajada, con su propia región.
  const hub = out['turismo.html'];
  assert.match(hub, /<p class="sub">[^<]+<\/p><!-- GENERADO:TIENDA hub-controles -->\n {6}<div class="tienda-controles" data-tienda-controles data-inerte>[\s\S]*?id="personas-destinos"[\s\S]*?data-tienda-vivo>Cargando precios…<\/p><!-- \/GENERADO:TIENDA -->/);
  // La 4x4 mensual (bloque secundario): sin controles propios.
  const cuatro = out['alquiler-4x4.html'];
  assert.strictEqual((sinEstilos(cuatro).match(/data-tienda-controles/g) || []).length, 1);
});

test('un servicio que el catálogo no trae no dibuja tarjeta; si no queda ninguno, el bloque se oculta', async () => {
  const { config, ctx } = await ctxDe('traslado-salta-cafayate.html');
  const parcial = catalogo();
  parcial.servicios = parcial.servicios.filter((s) => s.clave !== 'tr_cafayate');
  assert.strictEqual(t.bloque(parcial, config.bloques[0].servicios, 2, ctx).zonas.length, 2);
  assert.strictEqual(t.bloque({ ok: true, servicios: [] }, config.bloques[0].servicios, 2, ctx), null);
});

test('el mapa cruza el catálogo por clave, por id o por el nombre de la semilla', () => {
  const cat = { ok: true, servicios: [{ id: 'u1', nombre: '  CAFAYATE  (quebrada de las conchas) ' }, { id: 'u2', clave: 'cachi', nombre: 'otro' }, { id: 'tr_cachi', nombre: 'x' }] };
  assert.strictEqual(t.buscar(cat, { clave: 'cafayate', nombre: 'Cafayate (Quebrada de las Conchas)' }).id, 'u1');
  assert.strictEqual(t.buscar(cat, { clave: 'cachi', nombre: 'Cachi (Cuesta del Obispo y Los Cardones)' }).id, 'u2');
  assert.strictEqual(t.buscar(cat, { clave: 'tr_cachi', nombre: null }).id, 'tr_cachi');
  assert.strictEqual(t.buscar(cat, { clave: 'iruya_1d', nombre: 'Iruya en el día' }), null);
});

test('el hub: «Destinos» en la demo, en los tres idiomas; producción conserva su título', async () => {
  const out = await salida();
  assert.match(out['turismo.html'], /<h2><!-- GENERADO:TIENDA destinos -->Destinos <span class="tienda-chip" data-tienda-chip>PRECIOS DE PRUEBA<\/span><!-- \/GENERADO:TIENDA --><\/h2>/);
  assert.match(out['en/tours-and-transfers.html'], /<h2><!-- GENERADO:TIENDA destinos -->Destinations <span class="tienda-chip" data-tienda-chip>TEST PRICES<\/span><!-- \/GENERADO:TIENDA --><\/h2>/);
  assert.match(out['pt/passeios-e-traslados.html'], /<h2><!-- GENERADO:TIENDA destinos -->Destinos <span class="tienda-chip" data-tienda-chip>PREÇOS DE TESTE<\/span><!-- \/GENERADO:TIENDA --><\/h2>/);
  assert.match(paginas['turismo.html'], /<h2>Destinos<\/h2>/);
  const sinSitio = await salida(perfilDemo({ sitio: null, app: null, clave: null }));
  assert.strictEqual(sinSitio['turismo.html'], paginas['turismo.html']);
});

test('la leyenda del neto es gris y legible: al menos 4,5:1 sobre cada fondo (D11, WCAG AA)', () => {
  const css = fs.readFileSync(path.join(raiz, 'css', 'tienda.css'), 'utf8');
  const luz = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const enTarjeta = css.match(/\.tienda-neto\{[^}]*color:(#[0-9a-f]{6})/)[1];
  const enCabeza = css.match(/\.page-head \.tienda-cabeza \.tienda-neto\{[^}]*color:(#[0-9a-f]{6})/)[1];
  for (const fondo of ['#ffffff', '#fbfcfe', '#e9eef7']) assert.ok(contraste(enTarjeta, fondo) >= 4.5, `${enTarjeta} sobre ${fondo}`);
  for (const fondo of ['#131b30', '#1d2947', '#3a4250']) assert.ok(contraste(enCabeza, fondo) >= 4.5, `${enCabeza} sobre ${fondo}`);
  for (const g of [enTarjeta, enCabeza]) {
    const [r, gg, b] = [1, 3, 5].map((i) => parseInt(g.slice(i, i + 2), 16));
    assert.ok(Math.max(r, gg, b) - Math.min(r, gg, b) <= 16, `${g} no es gris`);
  }
  // Los controles: 44 px (C11) y el foco de 2 px.
  assert.match(css, /\.tienda-contador button\{width:44px;height:44px;/);
  assert.match(css, /\.tienda-contador input\{width:56px;height:44px;/);
  assert.match(css, /outline:2px solid var\(--navy\);outline-offset:2px/);
  assert.match(css, /\.tienda-zona\{[^}]*min-height:118px/, 'la zona de precio tiene alto fijo (C10), el del esqueleto: 118 px (3e §10 Δ5)');
  assert.match(css, /\.tienda-esqueleto \.e-zona\{height:118px\}/);
  assert.doesNotMatch(css, /tienda-moneda|tienda-chips|tienda-chip-m|tienda-chip-v|tienda-nota|tienda-aprox|data-moneda/, 'sin estilos de la moneda');
});

test('«Armar el viaje en el chat»: un WhatsApp de verdad que el chat abre (R6), sólo si la página tiene chat', async () => {
  const con = await ctxDe('traslado-salta-cafayate.html');
  assert.match(t.renglonFinal(con.ctx), /^<span>¿Otro recorrido\?<\/span><a class="tienda-chat" href="https:\/\/wa\.me\/5493875269009\?text=[^"]+" target="_blank" rel="noopener" data-asistente-abrir data-asistente-v="1" data-asistente-idioma="es">Armar el viaje en el chat<\/a>/);
  assert.doesNotMatch(t.renglonFinal(con.ctx), /data-asistente-(servicio|pasajeros|fecha)/, 'el renglón es para otro recorrido: sin servicio ni personas');
  const sin = await ctxDe('traslado-salta-cafayate.html', catalogo(), perfilDemo({ clave: null }));
  assert.doesNotMatch(t.renglonFinal(sin.ctx), /data-asistente-abrir/);
});

test('el error del catálogo dice qué pasó y deja WhatsApp; sin catálogo no hay dirección de compra', async () => {
  const { ctx } = await ctxDe('traslado-salta-cafayate.html', null);
  const html = t.estadoError(ctx);
  assert.match(html, /^<article class="card tienda-card tienda-error"><div class="card-body"><p>Los precios no se pudieron mostrar en este momento\.<\/p><a class="btn btn-wa" href="https:\/\/wa\.me\/5493875269009\?text=[^"]+" target="_blank" rel="noopener">Consultar por WhatsApp<\/a><\/div><\/article>$/);
  assert.doesNotMatch(html, /reservar\?|btn-reservar/);
  const { eleccionesDe } = await cargar();
  assert.throws(() => eleccionesDe(perfilDemo({ elecciones: { compraEnError: true } })), /desconocida/, 'la compra en el error ya no es una elección');
});

test('el texto del catálogo se escapa', async () => {
  const { ctx } = await ctxDe('traslado-salta-cafayate.html');
  const malo = { id: 'x"1', nombre: '<img src=x onerror=alert(1)>', descripcion: 'a & b', precio: null, reservar: `${SITIO}/lausof/reservar?servicio=x"1` };
  const h = t.tarjeta(malo, { clave: 'x' }, 2, ctx).html;
  assert.doesNotMatch(h, /<img/);
  assert.match(h, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(h, /a &amp; b/);
  assert.match(h, /reservar\?servicio=x%221&amp;pasajeros=2&amp;/);
  const cat = catalogo();
  servicioDe(cat, 'cafayate').precio.tramos[0].vehiculo = '<b>4x4</b>';
  const z = t.zonaDe(servicioDe(cat, 'cafayate'), { clave: 'cafayate', unidad: 'excursion' }, 2, ctx);
  assert.strictEqual(z.info, 'En &lt;b&gt;4x4&lt;/b&gt; con chofer. Entradas y comidas aparte.');
});

/* ---- los textos ---------------------------------------------------------- */

test('textos: los tres idiomas tienen las mismas claves, y ninguno dice lo que la vitrina no dice', async () => {
  const { TEXTOS } = await cargar();
  const claves = Object.keys(TEXTOS.es).sort();
  for (const idioma of ['en', 'pt']) {
    assert.deepStrictEqual(Object.keys(TEXTOS[idioma]).filter((k) => k !== 'tienda.neto_traduccion').sort(), claves, idioma);
  }
  // Sólo pesos (3e §5 A): ningún texto de moneda, ni «Aprox.»; nunca «$» ni «≈».
  for (const [idioma, textos] of Object.entries(TEXTOS)) {
    for (const [id, valor] of Object.entries(textos)) {
      assert.doesNotMatch(valor, /\bdesde\s+(ARS|USD|\$|\d)|a partir de|\bfrom\s+(ARS|USD|\$|\d)|starting at|orientativ|Apacheta|tienda|e-commerce|carrito|comprar|tarifario|seña|respondemos|a la brevedad|por vehículo|per vehicle|por veículo|\$|≈|US\$/i, `${idioma} ${id}`);
      assert.doesNotMatch(valor, /\ba(pp|p)rox|aproximad|BCRA|\{aprox|\{codigo\}|\{cotizacion\}/i, `${idioma} ${id}: sin conversión`);
      assert.ok(!/^tienda\.(moneda\.|vivo\.(moneda|ars|aprox)$)/.test(id), `${idioma} ${id}: sin textos de moneda`);
    }
    assert.strictEqual(textos['tienda.vivo.card'], '{servicio}: {total}{pp}.', idioma);
    // Calificación 5: un monto por día siempre con «por día» después.
    assert.match(textos['tienda.card.por_dia'], /^\{total\} (por día|per day|por dia)$/, idioma);
    assert.match(textos['tienda.card.unidad.por_dia'], /\{km\} km (por día|per day|por dia)\.$/, idioma);
    // Ningún tú en las páginas de lausof.com (A17; el tú es de la compra de Apacheta).
    for (const [id, valor] of Object.entries(textos)) if (idioma === 'es') assert.doesNotMatch(valor, /\b(tu|tus|te|elegí|reservá)\b/i, `es ${id}`);
  }
  // Ids sacados en 4b (4-textos §15): no vuelven.
  for (const id of ['tienda.cabeza.servicio', 'tienda.card.vehiculo', 'tienda.card.unidad.traslado', 'tienda.hub.linea', 'tienda.hub.nota', 'tienda.moneda', 'tienda.moneda.info', 'tienda.moneda.grupo', 'tienda.bloque.otro_sin_max']) {
    assert.ok(!(id in TEXTOS.es), id);
  }
  assert.strictEqual(TEXTOS.es['tienda.bloque.otro'], '¿Otro recorrido?');
  // L82 (Lautaro 09/11; en/pt de motor v3.6): quien coordina, con nombre; «más de un vehículo» se fue.
  assert.strictEqual(TEXTOS.es['tienda.card.coordinar'], 'Para más de {max} personas, se coordina con {empresa}.');
  assert.strictEqual(TEXTOS.en['tienda.card.coordinar'], 'For more than {max} people, {empresa} arranges it with you.');
  assert.strictEqual(TEXTOS.pt['tienda.card.coordinar'], 'Para mais de {max} pessoas, é preciso combinar com {empresa}.');
  for (const idioma of ['es', 'en', 'pt']) assert.ok(!('tienda.card.mas_de' in TEXTOS[idioma]), `${idioma}: tienda.card.mas_de no vuelve`);
  // Calificación 5 (4-textos §0.2, §9): la leyenda (la del catálogo) y la etiqueta, literales.
  assert.strictEqual(TEXTOS.es['tienda.neto'], '{leyenda}: {neto}');
  assert.match(fs.readFileSync(path.join(raiz, 'js', 'tienda.js'), 'utf8'), /const LEYENDA_DEL_NETO = 'Precio sin impuestos nacionales';/);
  assert.strictEqual(TEXTOS.es['pie.arrepentimiento'], 'Botón de arrepentimiento');
});

test('la salida no suma teléfonos: el único número es el 526-9009', async () => {
  const out = await salida();
  for (const [archivo, html] of Object.entries(out)) {
    const antes = new Set(paginas[archivo].match(/tel:\+?\d+|wa\.me\/\d+/g) || []);
    for (const n of html.match(/tel:\+?\d+|wa\.me\/\d+/g) || []) assert.ok(antes.has(n), `${archivo}: ${n}`);
  }
});

test('js/tienda.js lee sólo sus enganches y no nombra un host', () => {
  const codigo = fs.readFileSync(path.join(raiz, 'js', 'tienda.js'), 'utf8');
  assert.doesNotMatch(codigo, /data-seccion|data-linea|data-tipo|apacheta-demo|getapacheta|lausof-demo/);
});
