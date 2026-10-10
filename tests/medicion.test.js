// Medición de contactos: el listener de js/contacto.js que manda un evento
// de GA4 por cada clic en WhatsApp, teléfono o mail, y las redirecciones de
// las direcciones en inglés que daban 404.
//
// El script se corre de verdad, en un contexto aislado de Node (node:vm) con
// un documento y una ventana de utilería: no hace falta navegador ni instalar
// nada. Un enlace de utilería es un objeto con getAttribute, textContent y
// closest, que es todo lo que el script le pide al DOM.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { paginas, paginasEn, redirects, headers } = require('./util.js');

const RUTA = path.join(__dirname, '..', 'js', 'contacto.js');
const codigo = fs.readFileSync(RUTA, 'utf8');

// Carga el script en una página de utilería y devuelve cómo dispararle clics.
// `gtag: false` simula el bloqueador: la función no existe.
const cargar = ({ lang = 'es-AR', pathname = '/', gtag = true } = {}) => {
  const eventos = [];
  const escuchas = [];
  const window = { location: { pathname } };
  if (gtag === true) window.gtag = (...args) => eventos.push(args);
  else if (typeof gtag === 'function') window.gtag = gtag;
  const document = {
    documentElement: { lang },
    addEventListener: (tipo, fn, captura) => escuchas.push({ tipo, fn, captura }),
  };
  vm.runInNewContext(codigo, { window, document });
  assert.strictEqual(escuchas.length, 1, 'el script registra un solo listener');
  return { eventos, escuchas, clic: (target) => escuchas[0].fn({ target }) };
};

// Un <a> de utilería. `zonas` dice qué selectores de closest() encuentran un
// ancestro: { '.wa-bar': true } o { '[id]': { id: 'servicios' } }.
const enlace = (href, texto = '', zonas = {}) => {
  const a = {
    textContent: texto,
    getAttribute: (nombre) => (nombre === 'href' ? href : null),
    closest: (selector) => (selector === 'a[href]' ? a : zonas[selector] || null),
  };
  return a;
};

// El clic suele caer en el <svg> o en el texto de adentro del enlace.
const hijoDe = (a) => ({ closest: (selector) => (selector === 'a[href]' ? a : null) });

const WA = 'https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20cotizar%20un%20servicio';

test('un clic en WhatsApp manda contact_whatsapp con canal, idioma, página, zona y texto', () => {
  const { eventos, clic } = cargar({ lang: 'es-AR', pathname: '/turismo.html' });
  clic(enlace(WA, '\n  Cotizar por   WhatsApp ', { '.wa-bar': true }));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(eventos)), [['event', 'contact_whatsapp', {
    contact_channel: 'whatsapp',
    page_language: 'es',
    contact_page_path: '/turismo.html',
    link_position: 'quick_bar',
    link_text: 'Cotizar por WhatsApp',
  }]]);
});

test('api.whatsapp.com también cuenta como WhatsApp', () => {
  const { eventos, clic } = cargar();
  clic(enlace('https://api.whatsapp.com/send?phone=5493875269009', 'WhatsApp'));
  assert.strictEqual(eventos[0][1], 'contact_whatsapp');
});

test('un clic en tel: manda contact_phone', () => {
  const { eventos, clic } = cargar({ lang: 'en', pathname: '/en/' });
  clic(enlace('tel:+5493875269009', 'Call', { '.hero, .page-head': true }));
  assert.strictEqual(eventos.length, 1);
  const [tipo, nombre, params] = eventos[0];
  assert.strictEqual(tipo, 'event');
  assert.strictEqual(nombre, 'contact_phone');
  assert.strictEqual(params.contact_channel, 'phone');
  assert.strictEqual(params.page_language, 'en');
  assert.strictEqual(params.contact_page_path, '/en/');
  assert.strictEqual(params.link_position, 'hero');
  assert.strictEqual(params.link_text, 'Call');
});

test('un clic en mailto: manda contact_email', () => {
  const { eventos, clic } = cargar({ lang: 'en', pathname: '/en/mining-logistics.html' });
  clic(enlace('mailto:transporte@lausof.com?subject=Quote', 'Email us', { '.cta-final': true }));
  const [, nombre, params] = eventos[0];
  assert.strictEqual(nombre, 'contact_email');
  assert.strictEqual(params.contact_channel, 'email');
  assert.strictEqual(params.page_language, 'en');
  assert.strictEqual(params.link_position, 'cta_final');
  assert.strictEqual(params.link_text, 'Email us');
});

test('el clic en un hijo del enlace (el ícono) cuenta igual', () => {
  const { eventos, clic } = cargar();
  clic(hijoDe(enlace('tel:+5493875269009', 'Llamar')));
  assert.strictEqual(eventos.length, 1);
  assert.strictEqual(eventos[0][1], 'contact_phone');
});

test('la zona sale del ancestro: encabezado, pie, sección con id, o body', () => {
  const casos = [
    [{ 'header, nav': true }, 'header'],
    [{ 'footer.site': true, '[id]': { id: 'contacto' } }, 'footer'],
    [{ '[id]': { id: 'servicios' } }, 'servicios'],
    [{}, 'body'],
  ];
  for (const [zonas, esperada] of casos) {
    const { eventos, clic } = cargar();
    clic(enlace(WA, 'Cotizar', zonas));
    assert.strictEqual(eventos[0][2].link_position, esperada);
  }
});

// Ni el número ni la casilla ni el mensaje pre-armado salen del sitio: cuando
// el texto visible del enlace ES el dato, va el nombre del canal.
test('ningún parámetro lleva teléfonos, mails ni el mensaje pre-armado', () => {
  const { eventos, clic } = cargar({ pathname: '/flota-en-venta.html' });
  clic(enlace('tel:+5493875269009', '(387) 526-9009', { 'footer.site': true }));
  clic(enlace('tel:+543874222222', '+54 387 422 2222'));
  clic(enlace('mailto:transporte@lausof.com', 'transporte@lausof.com'));
  clic(enlace(WA, '387 509-2489'));
  clic(enlace(WA, ''));
  assert.deepStrictEqual(eventos.map((e) => e[2].link_text),
    ['phone', 'phone', 'email', 'whatsapp', 'whatsapp']);
  const todo = JSON.stringify(eventos);
  assert.doesNotMatch(todo, /\d{6,}/, 'se coló un número en los parámetros');
  assert.doesNotMatch(todo, /@|Hola|wa\.me|mailto|tel:/, 'se coló un dato del enlace en los parámetros');
});

test('los valores respetan el límite de 100 caracteres de GA4', () => {
  const { eventos, clic } = cargar({ pathname: `/${'x'.repeat(300)}` });
  clic(enlace(WA, 'palabra '.repeat(60), { '[id]': { id: 'i'.repeat(300) } }));
  for (const [clave, valor] of Object.entries(eventos[0][2])) {
    assert.ok(String(valor).length <= 100, `${clave} pasa los 100 caracteres`);
  }
  assert.ok(eventos[0][1].length <= 40, 'el nombre del evento pasa los 40 caracteres');
});

test('los enlaces que no son de contacto no mandan nada', () => {
  const { eventos, clic } = cargar();
  clic(enlace('/turismo.html', 'Turismo'));
  clic(enlace('#contacto', 'Contacto'));
  clic(enlace('https://www.instagram.com/lausof', 'Instagram'));
  clic(enlace('https://articulo.mercadolibre.com.ar/MLA-1-wa.me-_JM', 'Ver publicación'));
  clic({ closest: () => null });
  assert.deepStrictEqual(eventos, []);
});

test('sin gtag (bloqueador) el clic no da error ni frena nada', () => {
  const { clic } = cargar({ gtag: false });
  for (const href of [WA, 'tel:+5493875269009', 'mailto:transporte@lausof.com']) {
    assert.doesNotThrow(() => clic(enlace(href, 'Contacto')));
  }
});

test('si gtag falla, o el clic no trae un elemento, tampoco hay error', () => {
  const { clic } = cargar({ gtag: () => { throw new Error('bloqueado'); } });
  assert.doesNotThrow(() => clic(enlace(WA, 'Cotizar')));
  assert.doesNotThrow(() => clic(null));
  assert.doesNotThrow(() => clic({}));
});

// El script mira el clic pasar: si llamara a preventDefault o demorara la
// navegación para "asegurar" el envío, un fallo de la medición dejaría los
// botones de contacto muertos.
test('el listener es uno, delegado, en captura, y no toca la navegación', () => {
  const { escuchas } = cargar();
  assert.strictEqual(escuchas[0].tipo, 'click');
  assert.strictEqual(escuchas[0].captura, true);
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(sinComentarios, /preventDefault|stopPropagation|setTimeout|location\.(href|assign|replace)\s*[=(]/);
  assert.strictEqual((sinComentarios.match(/addEventListener/g) || []).length, 1);
});

test('todas las páginas cargan el script una vez, con ruta absoluta, defer y versión', () => {
  const versiones = new Set();
  for (const [nombre, html] of Object.entries(paginas)) {
    const usos = [...html.matchAll(/<script defer src="\/js\/contacto\.js\?v=(\d+)"><\/script>/g)];
    assert.strictEqual(usos.length, 1, `${nombre} no carga /js/contacto.js exactamente una vez`);
    assert.strictEqual((html.match(/contacto\.js/g) || []).length, 1, `${nombre} carga contacto.js de otra forma`);
    versiones.add(usos[0][1]);
  }
  // Con /js/* cacheado como inmutable, dos versiones distintas dejarían a
  // parte del sitio un año con el script viejo.
  assert.strictEqual(versiones.size, 1, `versiones desincronizadas de contacto.js: ${[...versiones]}`);
});

// Los eventos propios sólo sirven si la página tiene qué medir y el script
// reconoce los enlaces tal como están escritos en el HTML.
test('los enlaces de contacto reales del sitio caen en uno de los tres canales', () => {
  const vistos = { whatsapp: 0, phone: 0, email: 0 };
  for (const [nombre, html] of Object.entries(paginas)) {
    const hrefs = [...html.matchAll(/<a\b[^>]*\bhref="((?:tel:|mailto:|https?:\/\/(?:wa\.me|api\.whatsapp\.com))[^"]*)"/g)]
      .map((m) => m[1].replace(/&amp;/g, '&'));
    for (const href of hrefs) {
      const { eventos, clic } = cargar();
      clic(enlace(href, 'Contacto'));
      assert.strictEqual(eventos.length, 1, `${nombre}: ${href.slice(0, 20)}… no manda evento`);
      vistos[eventos[0][2].contact_channel] += 1;
    }
  }
  for (const [canal, cantidad] of Object.entries(vistos)) {
    assert.ok(cantidad > 0, `no hay ningún enlace de ${canal} en el sitio`);
  }
  assert.ok(Object.keys(paginasEn).length > 0);
});

test('_headers cachea /js/ como inmutable', () => {
  assert.match(headers, /^\/js\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/m);
});

// /contact, /contact-us y /about-us daban 404 (las escribe la gente y quedan
// en enlaces viejos). Van a la sección que corresponde de la portada en
// inglés; el ancla tiene que existir ahí.
test('las direcciones en inglés que daban 404 redirigen a la portada en inglés', () => {
  const reglas = [
    ['/contact', '/en/#contact'],
    ['/contact-us', '/en/#contact'],
    ['/about-us', '/en/#about'],
  ];
  const activas = redirects.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  for (const [origen, destino] of reglas) {
    const regla = new RegExp(`^${origen}\\s+${destino.replace(/[/#]/g, '\\$&')}\\s+301$`, 'm');
    assert.match(redirects, regla, `${origen} no redirige a ${destino} con 301`);
    const ancla = destino.split('#')[1];
    assert.match(paginasEn['en/index.html'], new RegExp(`\\bid="${ancla}"`),
      `en/index.html no tiene la sección #${ancla}`);
    // Netlify aplica la primera regla que matchea: ninguna anterior la tapa.
    const primera = activas.find((l) => l.split(/\s+/)[0] === origen);
    assert.ok(primera && primera.split(/\s+/)[1] === destino, `otra regla pisa ${origen}`);
    assert.ok(!fs.existsSync(path.join(__dirname, '..', `${origen.slice(1)}.html`)),
      `${origen}.html existe: la regla necesitaría ! para aplicarse`);
  }
});
