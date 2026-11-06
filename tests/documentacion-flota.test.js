// Servicio «Documentación de ingreso» / «Mine entry documents» (aprobado por
// Lautaro el 05/11/2026, fila 21 de LAUTARO-2026-11-05-noche.md;
// ~/lausof/web/servicio-documentacion-2026-11-05/, 3-diseno §1.3 y §4,
// 4-textos §1.9, alcance D6B: vehículos y personal). Lo propio del hub (panel,
// ficha, botones, palabras vedadas) está en tests/hub-empresas.test.js; acá va
// lo que cruza páginas:
//   - SICOP, Exactian y Minexus sólo se nombran en el panel del hub: ninguna
//     otra página los dice, ni en el texto ni en el head.
//   - Litio enlaza el servicio desde «Otros servicios para la obra».
//   - GA4: el clic en los botones del panel llega con link_position igual al
//     id del panel, que es lo que lee el control de los 30 días (3-diseno §1.4).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { paginas, sinComentarios, PANEL_FLOTA, PORTALES } = require('./util.js');

const HUB = { es: 'empresas-y-mineria.html', en: 'en/business-and-mining.html' };
const PORTAL_RE = new RegExp(`\\b(${PORTALES.join('|')})\\b`, 'i');

test('ninguna página fuera de los dos hubs nombra SICOP, Exactian o Minexus', () => {
  const hubs = Object.values(HUB);
  let revisadas = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    if (hubs.includes(nombre)) continue;
    revisadas += 1;
    const m = sinComentarios(html).match(PORTAL_RE);
    assert.strictEqual(m, null, `${nombre} nombra ${m && m[0]}: los portales van sólo en el panel del hub`);
  }
  assert.ok(revisadas >= 75, `sólo ${revisadas} páginas revisadas`);
});

const LITIO = {
  'transporte-de-personal-obras-de-litio.html': {
    seccion: 'relacionados', anterior: '/alquiler-4x4.html#empresas',
    enlace: '<a href="/empresas-y-mineria.html#documentacion-flota">Documentación de ingreso para contratistas, al día ante cada minera</a>',
  },
  'en/crew-transport-lithium-projects.html': {
    seccion: 'related', anterior: '/en/4x4-rental.html',
    enlace: '<a href="/en/business-and-mining.html#fleet-documents">Mine entry documents for contractors, kept current with each mine</a>',
  },
};

for (const [nombre, { seccion, anterior, enlace }] of Object.entries(LITIO)) {
  test(`${nombre}: «Otros servicios» enlaza el servicio después de la 4x4, y es el único enlace al panel`, () => {
    const html = sinComentarios(paginas[nombre]);
    const bloque = html.match(new RegExp(`<section class="block" id="${seccion}">([\\s\\S]*?)</section>`))[1];
    const items = [...bloque.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    const i = items.indexOf(enlace);
    assert.ok(i > 0, `${nombre}: falta ${enlace}`);
    assert.ok(items[i - 1].startsWith(`<a href="${anterior}">`), `${nombre}: el enlace va después de la 4x4`);
    const ancla = enlace.match(/#([^"]+)"/)[1];
    const fueraDelMenu = sinComentarios(paginas[nombre].replace(/<!-- GENERADO:MENU[\s\S]*?<!-- \/GENERADO:MENU -->/, ''));
    assert.strictEqual(fueraDelMenu.split(`#${ancla}"`).length - 1, 1, `${nombre}: fuera del menú, el panel se enlaza sólo desde «Otros servicios»`);
  });
}

// ---- GA4 -------------------------------------------------------------------
// js/contacto.js arma link_position con closest(): primero las zonas fijas
// (barra, encabezado, pie, héroe, cierre) y si no, el id del ancestro más
// cercano. Acá se reconstruyen los ancestros reales de cada botón del panel a
// partir del HTML y se corre el script de verdad, como en medicion.test.js.
const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Los elementos abiertos en `indice` (el último es el más cercano), con tag, clases e id. */
function ancestros(html, indice) {
  const pila = [];
  const etiquetas = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*?)(\/?)>/g;
  for (let m; (m = etiquetas.exec(html)) && m.index < indice;) {
    const [, cierre, nombre, attrs, autocierre] = m;
    const tag = nombre.toLowerCase();
    if (cierre) {
      const i = pila.map((e) => e.tag).lastIndexOf(tag);
      if (i >= 0) pila.length = i;
      continue;
    }
    if (VACIOS.has(tag) || autocierre) continue;
    const clase = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
    const id = (attrs.match(/\bid="([^"]*)"/) || [])[1] || '';
    pila.push({ tag, clases: clase.split(/\s+/).filter(Boolean), id });
  }
  return pila;
}

// Los selectores que usa js/contacto.js: «.a», «tag», «tag.a», «[id]», «a[href]»
// y listas separadas por coma.
const cumple = (el, selector) => selector.split(',').map((s) => s.trim()).some((s) => {
  if (s === '[id]') return Boolean(el.id);
  if (s === 'a[href]') return el.tag === 'a';
  const [tag, ...clases] = s.split('.');
  return (!tag || el.tag === tag) && clases.every((c) => el.clases.includes(c));
});

for (const [idioma, nombre] of Object.entries(HUB)) {
  test(`${nombre}: GA4 cuenta los dos botones del panel con link_position «${PANEL_FLOTA[idioma]}»`, () => {
    const html = sinComentarios(paginas[nombre])
      // El contenido de <script> no es marcado: se blanquea sin mover índices.
      .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (t, a, c, b) => a + ' '.repeat(c.length) + b);
    const body = (html.match(/<body([^>]*)>/) || [])[1];
    const attr = (k) => (body.match(new RegExp(`\\b${k}="([^"]*)"`)) || [])[1] || null;
    const botones = [...html.matchAll(/<a\b[^>]*data-prefill="documentacion-flota"[^>]*>/g)];
    assert.strictEqual(botones.length, 2);
    const codigo = fs.readFileSync(path.join(__dirname, '..', 'js', 'contacto.js'), 'utf8');
    const canales = [];
    for (const boton of botones) {
      const href = boton[0].match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&');
      const propio = { tag: 'a', clases: (boton[0].match(/\bclass="([^"]*)"/) || ['', ''])[1].split(/\s+/), id: '' };
      // El enlace mismo primero y después sus ancestros, del más cercano al más lejano.
      const cadena = [propio, ...ancestros(html, boton.index).reverse()];
      const a = {
        textContent: 'Consultar',
        getAttribute: (n) => (n === 'href' ? href : null),
        closest: (selector) => {
          if (selector === 'a[href]') return a;
          const el = cadena.find((e) => cumple(e, selector));
          return el ? { id: el.id } : null;
        },
      };
      const eventos = [];
      let escucha;
      const window = { location: { pathname: `/${nombre}` }, gtag: (...args) => eventos.push(args) };
      const document = {
        documentElement: { lang: idioma === 'es' ? 'es-AR' : 'en' },
        body: { getAttribute: attr },
        addEventListener: (tipo, fn) => { if (tipo === 'click') escucha = fn; },
      };
      vm.runInNewContext(codigo, { window, document });
      escucha({ target: a });
      assert.strictEqual(eventos.length, 1, `${href}: el clic no mandó evento`);
      const [, evento, params] = eventos[0];
      canales.push(evento);
      assert.strictEqual(params.link_position, PANEL_FLOTA[idioma], `${href}: link_position`);
      assert.strictEqual(params.seccion, 'empresas');
      assert.strictEqual(params.tipo, 'empresa', 'el <body> del hub sigue con su tipo de página');
    }
    assert.deepStrictEqual(canales, ['contact_whatsapp', 'contact_email']);
  });
}
