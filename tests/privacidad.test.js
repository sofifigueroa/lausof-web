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
//   · el aviso dice sólo lo que el sitio tiene (7-auditoria-build.md B1): el
//     asistente, la reserva en línea y Mercado Pago aparecen si y sólo si
//     PERFILES.produccion.tienda.activa (zonas GENERADO:AVISO de
//     scripts/privacidad.mjs; la demo las cambia con O13);
//   · «Vigente desde» es el mismo día en los tres idiomas, y publicar rehúsa
//     un texto nuevo con una fecha que no es hoy en Salta (B2);
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

  test(`${nombre}: quién recibe los datos, con Apacheta sólo por su marca`, async () => {
    const { PERFILES } = await importar('scripts/entorno.mjs');
    const destinatarios = seccion(html, 'destinatarios');
    for (const quien of ['Google', 'Netlify', 'Apacheta']) {
      assert.ok(destinatarios.includes(quien), `${nombre}: falta ${quien}`);
    }
    // Mercado Pago es responsable de sus datos: con el pago en línea se enlaza su aviso.
    assert.strictEqual(destinatarios.includes('https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/31199'),
      PERFILES.produccion.tienda.activa, 'el aviso de Mercado Pago va si y sólo si la vitrina está encendida');
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

// ---------------------------------------------------------------------------
// B1: el aviso dice lo que producción tiene (acople con tienda.activa)
// ---------------------------------------------------------------------------
const cuerpoVisible = (html) => visible((html.match(/<div class="privacidad">[\s\S]*?<\/article>/) || [''])[0]);

test('acople: las zonas del aviso rastreado son las de PERFILES.produccion.tienda.activa', async () => {
  const { PERFILES } = await importar('scripts/entorno.mjs');
  const p = await importar('scripts/privacidad.mjs');
  const activa = PERFILES.produccion.tienda.activa;
  for (const [idioma, nombre] of Object.entries(AVISOS)) {
    assert.deepStrictEqual(p.problemasDeZonas(paginas[nombre], idioma, activa), [], `${nombre}: correr node scripts/privacidad.mjs`);
    // Fuera de las zonas tampoco: con la vitrina apagada nada nombra el
    // asistente, lo «en línea» ni Mercado Pago; encendida, las tres están.
    const texto = cuerpoVisible(paginas[nombre]);
    if (activa) {
      for (const zona of p.ZONAS) assert.ok(paginas[nombre].includes(p.TEXTOS[idioma][zona].tienda), `${nombre}: falta ${zona}`);
    } else {
      assert.doesNotMatch(texto, p.SOLO_CON_TIENDA, `${nombre}: nombra una función que producción no tiene`);
    }
  }
});

test('acople: el texto sigue a la llave en los dos sentidos (control en rojo con la llave dada vuelta)', async () => {
  const { PERFILES } = await importar('scripts/entorno.mjs');
  const p = await importar('scripts/privacidad.mjs');
  const activa = PERFILES.produccion.tienda.activa;
  for (const [idioma, nombre] of Object.entries(AVISOS)) {
    // Si alguien cambia la llave sin regenerar, el test de arriba cae.
    assert.strictEqual(p.problemasDeZonas(paginas[nombre], idioma, !activa).length, 3, `${nombre}: las tres zonas dependen de la llave`);
    const apagado = cuerpoVisible(p.conZonas(paginas[nombre], idioma, false));
    const encendido = cuerpoVisible(p.conZonas(paginas[nombre], idioma, true));
    assert.doesNotMatch(apagado, p.SOLO_CON_TIENDA, `${nombre}: el texto apagado nombra el asistente, lo en línea o Mercado Pago`);
    assert.match(encendido, /as+istente|assistant/i);
    assert.match(encendido, /Mercado Pago/);
    assert.match(encendido, /en línea|online|on-line/);
    // El texto apagado es el P1 de 4-textos §1 y la nota de Apacheta - Web.
    assert.match(apagado, /(Consultas|Inquiries)\. /);
    assert.ok(apagado.includes({ es: 'recibe, por cuenta de Lausof, los correos.', en: 'receives, on Lausof’s behalf, the emails.', pt: 'recebe, em nome da Lausof, os e-mails.' }[idioma]));
    // Idempotente: escribir dos veces da lo mismo.
    assert.strictEqual(p.conZonas(p.conZonas(paginas[nombre], idioma, true), idioma, true), p.conZonas(paginas[nombre], idioma, true));
  }
  const html = paginas[ES].replace(/[ \t]*<!-- GENERADO:AVISO pago[\s\S]*?<!-- \/GENERADO:AVISO -->\n/, '');
  assert.throws(() => p.conZonas(html, 'es', false), /falta la zona GENERADO:AVISO pago/);
});

// ---------------------------------------------------------------------------
// B2: «Vigente desde»
// ---------------------------------------------------------------------------
test('vigencia: las tres páginas dicen el mismo día, cada una en su formato', async () => {
  const p = await importar('scripts/privacidad.mjs');
  const fechas = Object.values(AVISOS).map((n) => p.vigenciaDe(paginas[n]));
  for (const f of fechas) assert.match(f || '', /^\d{4}-\d{2}-\d{2}$/, 'una fecha que no se puede leer');
  assert.strictEqual(new Set(fechas).size, 1, `fechas distintas: ${fechas.join(', ')}`);
  for (const [idioma, n] of Object.entries(AVISOS)) {
    assert.ok(paginas[n].includes(`<p class="vigencia">${p.textoDeVigencia(idioma, fechas[0])}</p>`), `${n}: formato`);
  }
});

test('vigencia: formatos, lectura de vuelta y el día en Salta', async () => {
  const p = await importar('scripts/privacidad.mjs');
  assert.strictEqual(p.textoDeVigencia('es', '2026-11-07'), 'Vigente desde 07/11/2026');
  assert.strictEqual(p.textoDeVigencia('en', '2026-11-07'), 'In force since November 7, 2026');
  assert.strictEqual(p.textoDeVigencia('pt', '2026-11-07'), 'Em vigor desde 07/11/2026');
  for (const idioma of ['es', 'en', 'pt']) {
    assert.strictEqual(p.vigenciaDe(`<p class="vigencia">${p.textoDeVigencia(idioma, '2027-01-03')}</p>`), '2027-01-03');
  }
  assert.strictEqual(p.vigenciaDe('<p class="vigencia">Vigente desde mañana</p>'), null);
  // 02:30 UTC del 07/11 es todavía el 06/11 en Salta (UTC−3).
  assert.strictEqual(p.hoyEnSalta(new Date('2026-11-07T02:30:00Z')), '2026-11-06');
  assert.strictEqual(p.hoyEnSalta(new Date('2026-11-07T03:00:00Z')), '2026-11-07');
  const nueva = p.conVigencia(paginas[EN], 'en', '2026-11-09');
  assert.strictEqual(p.vigenciaDe(nueva), '2026-11-09');
  assert.strictEqual(p.textoDelAviso(nueva), p.textoDelAviso(paginas[EN]), 'la fecha no cuenta como cambio de texto');
});

test('publicar: rehúsa un aviso nuevo o cambiado cuya fecha no es hoy en Salta', async () => {
  const p = await importar('scripts/privacidad.mjs');
  const con = (iso) => Object.fromEntries(Object.entries(AVISOS).map(([i, n]) => [n, p.conVigencia(paginas[n], i, iso)]));
  const nada = Object.fromEntries(Object.values(AVISOS).map((n) => [n, null]));
  const hoy = '2026-11-09';
  // Hoy no está publicado: con la fecha de hoy pasa; con otra, no.
  assert.deepStrictEqual(p.motivosDelAviso({ exportados: con(hoy), enVivo: nada, hoy }), []);
  const viejo = p.motivosDelAviso({ exportados: con('2026-11-06'), enVivo: nada, hoy });
  assert.strictEqual(viejo.length, 3, viejo.join('\n'));
  assert.match(viejo[0], /no hoy en Salta \(2026-11-09\)/);
  // Mismo texto que el publicado: la fecha vieja queda, no hace falta tocarla.
  assert.deepStrictEqual(p.motivosDelAviso({ exportados: con('2026-11-06'), enVivo: con('2026-11-06'), hoy }), []);
  // Cambió el texto (p. ej. la vitrina se encendió) y la fecha no: rehúsa.
  const encendido = Object.fromEntries(Object.entries(con('2026-11-06')).map(([n, h]) => [n, p.conZonas(h, Object.keys(AVISOS).find((i) => AVISOS[i] === n), true)]));
  assert.strictEqual(p.motivosDelAviso({ exportados: encendido, enVivo: con('2026-11-06'), hoy }).length, 3);
  // La fecha cambia sin que cambie el texto: rehúsa.
  assert.match(p.motivosDelAviso({ exportados: con(hoy), enVivo: con('2026-11-06'), hoy }).join('\n'), /sin que cambie el texto/);
  // Fechas distintas entre idiomas.
  const mezcla = { ...con(hoy), [EN]: p.conVigencia(paginas[EN], 'en', '2026-11-08') };
  assert.match(p.motivosDelAviso({ exportados: mezcla, enVivo: nada, hoy }).join('\n'), /no son el mismo día/);
  // Un sha sin aviso no tiene nada que revisar.
  assert.deepStrictEqual(p.motivosDelAviso({ exportados: nada, enVivo: nada, hoy }), []);
});

test('publicar: revisarAviso lee lo publicado y no deja pasar si no puede leerlo', async () => {
  const p = await importar('scripts/privacidad.mjs');
  const fs = require('node:fs');
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aviso-'));
  test.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const n of Object.values(AVISOS)) {
    fs.mkdirSync(path.dirname(path.join(dir, n)), { recursive: true });
    fs.writeFileSync(path.join(dir, n), paginas[n]);
  }
  const fecha = p.vigenciaDe(paginas[ES]);
  const ahora = new Date(`${fecha}T15:00:00Z`);
  const pedidos = [];
  const responde = (status, cuerpo = '') => async (url) => { pedidos.push(url); return { status, text: async () => cuerpo }; };
  assert.deepStrictEqual(await p.revisarAviso({ dir, host: 'https://x.test', ahora, traer: responde(404) }), []);
  assert.deepStrictEqual(pedidos, Object.values(AVISOS).map((n) => `https://x.test/${n}`));
  const otroDia = new Date(new Date(ahora).getTime() + 86400000);
  assert.strictEqual((await p.revisarAviso({ dir, host: 'https://x.test', ahora: otroDia, traer: responde(404) })).length, 3);
  assert.deepStrictEqual(await p.revisarAviso({ dir, host: 'https://x.test', ahora: otroDia, traer: async (url) => ({ status: 200, text: async () => paginas[Object.values(AVISOS).find((n) => url.endsWith(n))] }) }), []);
  assert.match((await p.revisarAviso({ dir, host: 'https://x.test', ahora, traer: responde(503) })).join('\n'), /respondió 503/);
  assert.match((await p.revisarAviso({ dir, host: 'https://x.test', ahora, traer: async () => { throw new Error('sin red'); } })).join('\n'), /sin red/);
});
