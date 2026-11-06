// Aviso de privacidad (Ley 25.326 art. 6), versión corta del 06/11/2026.
// Diseño y textos: ~/lausof/web/privacidad-2026-11-05/ (3-diseno.md, 4-textos.md,
// 6-auditoria.md PASA). Lautaro, 06/11: «let's have a short page on lausof.com».
//
// Lo que estas guardias sostienen:
//   · las tres páginas no se indexan (noindex, fuera del sitemap, sin hreflang,
//     canónica ni Open Graph) y la exportación de producción las publica igual;
//   · el párrafo del responsable dice los datos de scripts/empresa.mjs, con el
//     domicilio legal (Res. AAIP 126/2024, Anexo I 3 a), no la base de Junín;
//   · cada página tiene los cuatro apartados del art. 6 y la leyenda de la
//     Res. AAIP 14/2018 art. 3 al pie de la letra;
//   · Apacheta va sólo por su marca, sin enlace ni entidad (auditoría B4);
//   · el pie de todas las páginas enlaza el aviso de su idioma, sin `lang`
//     en el enlace (si no, tests/ingles.test.js lo contaría como idioma).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { paginas, privadas, noIndexables, sitemap, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const importar = (rel) => import(pathToFileURL(path.join(raiz, rel)).href);

const [ES, { en: EN, pt: PT }] = Object.entries(privadas)[0];
const AVISOS = { es: ES, en: EN, pt: PT };
const idiomaDe = (nombre) => (nombre.startsWith('en/') ? 'en' : nombre.startsWith('pt/') ? 'pt' : 'es');

// Res. AAIP 14/2018 art. 3, al pie de la letra (fuentes/res14-2018.md:120-126).
const LEYENDA = 'LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, '
  + 'tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus '
  + 'derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.';

const ANCLAS = ['responsable', 'datos', 'destinatarios', 'derechos'];
const seccion = (html, id) => (html.match(new RegExp(`<section id="${id}">([\\s\\S]*?)</section>`)) || [])[1] || '';
const visible = (html) => sinComentarios(html).replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('las tres páginas del aviso existen y el mapa privadas cubre los tres idiomas', () => {
  for (const nombre of Object.values(AVISOS)) assert.ok(paginas[nombre], `falta ${nombre}`);
  assert.deepStrictEqual(Object.values(AVISOS).map(idiomaDe), ['es', 'en', 'pt']);
});

for (const [idioma, nombre] of Object.entries(AVISOS)) {
  const html = paginas[nombre];

  test(`${nombre}: no se indexa (noindex,follow, sin canónica, Open Graph ni hreflang) y no está en el sitemap`, () => {
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.doesNotMatch(html, /rel="canonical"/, 'una página noindex no declara canónica');
    assert.doesNotMatch(html, /property="og:/, 'sin Open Graph');
    assert.doesNotMatch(html, /<link\b[^>]*rel="alternate"/, 'sin <link rel="alternate" hreflang>');
    assert.doesNotMatch(html, /<a\b[^>]*rel="alternate"/, 'el selector de idioma no declara rel="alternate"');
    assert.ok(!sitemap.includes(nombre), `${nombre} está en el sitemap`);
    assert.ok(noIndexables.includes(nombre), `${nombre} falta en noIndexables (tests/util.js)`);
  });

  test(`${nombre}: lleva los cuatro apartados del art. 6 en orden y la fecha de vigencia`, () => {
    const ids = [...html.matchAll(/<section id="([^"]+)">/g)].map((m) => m[1]);
    assert.deepStrictEqual(ids, ANCLAS);
    assert.match(html, /<p class="vigencia">(Vigente desde|In force since|Em vigor desde) [^<]+<\/p>/);
    assert.strictEqual((html.match(/<h1>/g) || []).length, 1);
  });

  test(`${nombre}: el responsable sale de scripts/empresa.mjs, con el domicilio legal`, async () => {
    const { FICHA, CORREO, DOMICILIO_LEGAL } = await importar('scripts/empresa.mjs');
    const parrafo = seccion(html, 'responsable');
    for (const dato of [FICHA.legalName, FICHA.taxID, DOMICILIO_LEGAL, CORREO]) {
      assert.ok(parrafo.includes(dato), `${nombre}: el responsable no dice «${dato}»`);
    }
    assert.ok(!parrafo.includes(FICHA.address.streetAddress), 'la base de Junín no es el domicilio legal');
    // Art. 6 b: que la base de datos existe, no sólo quién es el responsable.
    assert.match(parrafo, /base de datos|database|base de dados/);
    assert.ok(seccion(html, 'derechos').includes(CORREO), `${nombre}: los derechos no dicen a qué correo escribir`);
  });

  test(`${nombre}: la leyenda de la Res. AAIP 14/2018 va al pie de la letra, una vez`, () => {
    const derechos = seccion(html, 'derechos');
    assert.strictEqual(html.split(LEYENDA).length - 1, 1, `${nombre}: la leyenda no está o está repetida`);
    const parrafo = derechos.match(/<p class="leyenda"([^>]*)>/);
    assert.ok(parrafo, `${nombre}: la leyenda no va en #derechos`);
    // Traducida no vale: en inglés y portugués va en castellano, marcada.
    assert.strictEqual(parrafo[1], idioma === 'es' ? '' : ' lang="es"');
    assert.match(derechos, /\b10\b/, 'plazo de acceso (art. 14.2)');
    assert.match(derechos, /\b5\b/, 'plazo de corrección o borrado (art. 16.2)');
  });

  test(`${nombre}: quién recibe los datos, con Apacheta sólo por su marca`, () => {
    const destinatarios = seccion(html, 'destinatarios');
    for (const quien of ['Google', 'Netlify', 'Apacheta', 'Mercado Pago']) {
      assert.ok(destinatarios.includes(quien), `${nombre}: falta ${quien}`);
    }
    assert.ok(destinatarios.includes('https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/31199'),
      'Mercado Pago es responsable de sus datos: se enlaza su aviso');
    assert.doesNotMatch(destinatarios, /getapacheta|apacheta\.com/i, 'Apacheta va sin enlace (auditoría B4)');
    assert.match(seccion(html, 'datos'), /href="https:\/\/policies\.google\.com\/technologies\/partner-sites/,
      'GA Terms §7: el enlace a cómo usa Google los datos');
    assert.doesNotMatch(visible(html), /\bLLC\b|Figueroa|Texas/, 'ni la sociedad ni el apellido de la familia');
  });

  if (idioma !== 'es') {
    test(`${nombre}: aclara que la traducción no es el texto que vale y enlaza el castellano`, () => {
      assert.match(html, /<p class="traduccion">[^\n]*<a href="\/privacidad\.html" hreflang="es"><span lang="es">Privacidad<\/span><\/a>/);
    });
  }
}

test('noIndexables y PAGINAS_FUERA_DEL_SITEMAP de la publicación nombran las mismas páginas', async () => {
  const { PAGINAS_FUERA_DEL_SITEMAP } = await importar('scripts/publicacion.mjs');
  const paginasFuera = PAGINAS_FUERA_DEL_SITEMAP.filter((n) => !n.startsWith('google'));
  assert.deepStrictEqual([...paginasFuera].sort(), [...noIndexables].sort(),
    'una página que no se indexa va en las dos listas: si no, producción no la publica o el test no la cuida');
});

test('el pie de cada página enlaza el aviso de su idioma, arriba del ©, sin lang', async () => {
  const { PIE_DATOS, zonaLegal } = await importar('scripts/menu.mjs');
  for (const idioma of ['es', 'en', 'pt']) {
    assert.strictEqual(PIE_DATOS[idioma].privacidad[1], `/${AVISOS[idioma]}`, `${idioma}: el pie no apunta a su aviso`);
  }
  let conPie = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const zona = (html.match(/<!-- GENERADO:LEGAL[\s\S]*?<!-- \/GENERADO:LEGAL -->/) || [])[0];
    if (!zona) continue;
    conPie += 1;
    const [texto, href] = PIE_DATOS[idiomaDe(nombre)].privacidad;
    const lineas = zona.split('\n').map((l) => l.trim()).filter((l) => !l.startsWith('<!--'));
    const actual = `/${nombre}` === href ? ' aria-current="page"' : '';
    assert.strictEqual(lineas[0], `<p class="legal-enlaces"><a href="${href}"${actual}>${texto}</a></p>`, `${nombre}: línea del aviso`);
    assert.doesNotMatch(zona, /<a\b[^>]*\slang=/, `${nombre}: un enlace de la línea legal lleva lang`);
  }
  assert.strictEqual(conPie, Object.keys(paginas).length, 'toda página lleva la línea legal');
  assert.match(zonaLegal(PT), /<a href="\/pt\/privacidade\.html" aria-current="page">Privacidade<\/a>/);
  assert.doesNotMatch(zonaLegal('turismo.html'), /aria-current/);
});
