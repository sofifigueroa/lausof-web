// Versión en portugués de Brasil bajo /pt/ (03/11/2026). Recomendación y reglas:
// web/seo-deep-2026-11-03/E-languages-markets.md §3. Son sólo 7 páginas (el
// mapa `paresPt` de tests/util.js), cada una gemela de una página en español
// que ya tiene gemela inglesa: grupos es/en/pt.
//
// Lo que estas guardias sostienen:
// - el idioma declarado (lang="pt-BR", og:locale pt_BR, inLanguage pt-BR) y la
//   canónica propia, nunca la del español;
// - que las 7 estén en el sitemap y que ninguna otra URL de /pt/ lo esté;
// - que no quede castellano visible y que el contacto (WhatsApp, correo) esté
//   en portugués y vaya a la línea y la casilla públicas;
// - lo vedado (BUILD-BRIEF): ni flota ni personal dimensionados, ni precios;
// - los datos para el viajero brasileño, con su fuente y fecha.
// El hreflang recíproco, el selector y el pie viven en tests/ingles.test.js,
// junto con las reglas de los pares ES/EN.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  paginasEs, paginasEn, paginasPt, pares, paresPt, urlDe, DOMINIO, sitemap, sinComentarios,
} = require('./util.js');

const textoVisible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/\s+/g, ' ');

const nodosLd = (html, nombre) => {
  const nodos = [];
  for (const [, cuerpo] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let datos;
    assert.doesNotThrow(() => { datos = JSON.parse(cuerpo); }, `JSON-LD roto en ${nombre}`);
    nodos.push(...(datos['@graph'] || [datos]));
  }
  return nodos;
};

// ---------------------------------------------------------------------------
// 1. El mapa y el disco cuentan lo mismo, y cada grupo es un trío.
// ---------------------------------------------------------------------------
test('el mapa ES↔PT y el directorio /pt/ coinciden', () => {
  assert.strictEqual(Object.keys(paresPt).length, 7, 'la recomendación es de 7 páginas, no más');
  for (const [es, pt] of Object.entries(paresPt)) {
    assert.ok(paginasEs[es], `el mapa nombra ${es} y no existe`);
    assert.ok(paginasPt[pt], `el mapa nombra ${pt} y no existe`);
    assert.ok(pt.startsWith('pt/'), `${pt} no vive bajo pt/`);
    assert.ok(pares[es] && paginasEn[pares[es]], `${es} tiene versión pt pero no gemela inglesa`);
  }
  const registradas = new Set(Object.values(paresPt));
  for (const nombre of Object.keys(paginasPt)) {
    assert.ok(registradas.has(nombre), `${nombre} existe y no está en paresPt (tests/util.js)`);
  }
});

for (const [es, pt] of Object.entries(paresPt)) {
  const html = paginasPt[pt];
  if (!html) continue;

  // -------------------------------------------------------------------------
  // 2. Idioma y canónica.
  // -------------------------------------------------------------------------
  test(`${pt}: lang="pt-BR" y canónica propia`, () => {
    assert.match(html, /<html lang="pt-BR"[ >]/, `${pt} no declara <html lang="pt-BR">`);
    const canonica = html.match(/<link rel="canonical" href="([^"]+)">/);
    assert.ok(canonica, `${pt} no declara canónica`);
    assert.strictEqual(canonica[1], urlDe(pt), `la canónica de ${pt} no es la suya`);
    assert.match(html, new RegExp(`<meta property="og:url" content="${urlDe(pt).replace(/[.]/g, '\\.')}">`),
      `${pt}: og:url no es la URL de la página`);
  });

  test(`${pt}: og:locale pt_BR con es_AR y en_US de alternativos; sus gemelas declaran pt_BR`, () => {
    assert.match(html, /<meta property="og:locale" content="pt_BR">/);
    assert.match(html, /<meta property="og:locale:alternate" content="es_AR">/);
    assert.match(html, /<meta property="og:locale:alternate" content="en_US">/);
    for (const gemela of [paginasEs[es], paginasEn[pares[es]]]) {
      assert.match(gemela, /<meta property="og:locale:alternate" content="pt_BR">/,
        `la gemela de ${pt} no declara og:locale:alternate pt_BR`);
    }
  });

  test(`${pt}: title y meta description propios, en portugués`, () => {
    const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(desc, `${pt} no lleva meta description`);
    assert.ok(desc[1].length >= 110 && desc[1].length <= 175,
      `la meta description de ${pt} mide ${desc[1].length} caracteres`);
    assert.notStrictEqual(titulo, paginasEs[es].match(/<title>([^<]+)<\/title>/)[1], `${pt} repite el título en español`);
  });

  // -------------------------------------------------------------------------
  // 3. Datos estructurados: WebPage en pt-BR, la empresa por referencia.
  // -------------------------------------------------------------------------
  test(`${pt}: JSON-LD con WebPage inLanguage "pt-BR" y referencia a #empresa`, () => {
    const nodos = nodosLd(html, pt);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    assert.ok(pagina, `${pt} no tiene un nodo WebPage`);
    assert.strictEqual(pagina.inLanguage, 'pt-BR');
    assert.strictEqual(pagina.url, urlDe(pt), `el WebPage de ${pt} no lleva su propia URL`);
    assert.ok(JSON.stringify(nodos).includes(`${DOMINIO}/#empresa`), `${pt} no referencia #empresa`);
    const propios = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => m[1]).join('\n');
    assert.ok(!/"taxID"|"telephone"/.test(propios), `${pt} redefine a mano la ficha de la empresa`);
    const idsEs = [...propios.matchAll(/"@id":\s*"([^"]+)"/g)].map((m) => m[1])
      .filter((id) => id !== `${DOMINIO}/#empresa` && id.startsWith(`${urlDe(es)}#`));
    assert.deepStrictEqual(idsEs, [], `${pt} reutiliza los @id de la página en español`);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      // El catálogo de servicios de la portada usa Offer sin precio, igual
      // que /  y /en/; un precio, una FAQ o reseñas no van en ninguna.
      assert.doesNotMatch(json, /"@type":\s*"(FAQPage|Review|AggregateRating)"|"price"/, `${pt} lleva marcado vedado`);
      if (es !== 'index.html') assert.doesNotMatch(json, /"@type":\s*"Offer"/, `${pt} lleva Offer`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Sin castellano visible. Los nombres propios ("Quebrada de las Conchas",
  //    "Tren a las Nubes", "Cuesta del Obispo") pasan: la lista sólo tiene
  //    palabras comunes del español que no existen en portugués, y los signos
  //    de apertura ¿ ¡, que el portugués no usa.
  // -------------------------------------------------------------------------
  test(`${pt}: sin castellano residual en el texto visible`, () => {
    const visible = textoVisible(html)
      // Los enlaces de idioma se escriben en su propio idioma ("Español").
      .replace(/\bEspañol\b/g, ' ');
    const castellano = /[¿¡]|\b(usted(es)?|nosotros|cotiz(ar|ación|amos)|envíenos|escríbanos|llamadas|también|pasajeros|choferes|camionetas?|excursi(ón|ones)|ahora|aquí|hacemos|llevamos|según|más|días hábiles|mismo día hábil)\b/i;
    const m = visible.match(castellano);
    assert.ok(!m, `quedó castellano visible en ${pt}: "${m && visible.slice(Math.max(0, m.index - 40), m.index + 40)}"`);
  });

  // -------------------------------------------------------------------------
  // 5. Contacto: la línea pública, mensajes en portugués, una sola casilla.
  // -------------------------------------------------------------------------
  test(`${pt}: los wa.me van al 526-9009 con el mensaje en portugués`, () => {
    const was = [...html.matchAll(/href="https:\/\/wa\.me\/(\d+)\?text=([^"]*)"/g)];
    assert.ok(was.length > 0, `${pt} no tiene ningún wa.me`);
    for (const [, linea, texto] of was) {
      assert.strictEqual(linea, '5493875269009');
      const legible = decodeURIComponent(texto);
      assert.match(legible, /^Olá Lausof, /, `${pt}: el mensaje no abre en portugués: "${legible}"`);
      assert.doesNotMatch(legible, /\b(Hola|quiero|cotizar|Fecha|Pasajeros|Lugar de salida|Solo ida)\b/,
        `${pt}: el mensaje de WhatsApp quedó en castellano: "${legible}"`);
    }
  });

  test(`${pt}: el correo va a transporte@ con asunto y renglones en portugués`, () => {
    const mailtos = [...sinComentarios(html).matchAll(/href="mailto:([^"]+)"/g)]
      .map((m) => new URL(`mailto:${m[1].replace(/&amp;/g, '&')}`));
    assert.ok(mailtos.length > 0, `${pt} no ofrece correo`);
    assert.ok(!/contacto@lausof\.com/.test(textoVisible(html)), `${pt} muestra contacto@: la casilla pública es transporte@`);
    const asuntos = new Set();
    for (const m of mailtos) {
      assert.strictEqual(m.pathname, 'transporte@lausof.com', `${pt}: ${m.href}`);
      asuntos.add(m.searchParams.get('subject'));
      assert.match(m.searchParams.get('subject') || '', /^Pedido de orçamento/, `${pt}: asunto inesperado`);
      assert.match(m.searchParams.get('body') || '', /^(Data|Destino ou passeio|Serviço):/, `${pt}: el cuerpo no está en portugués`);
    }
    assert.strictEqual(asuntos.size, 1, `${pt}: más de un asunto`);
  });

  // -------------------------------------------------------------------------
  // 6. Lo vedado (BUILD-BRIEF 10/10/2026), en portugués.
  // -------------------------------------------------------------------------
  test(`${pt}: sin dimensionar la flota ni el personal, sin precios`, () => {
    const visible = textoVisible(html);
    const numero = '(?:dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|quinze|vinte|trinta|dezenas|centenas|\\d+)';
    const flota = new RegExp(`(?<![\\d-])\\b${numero}\\s+(?:de\\s+)?(?:veículos|vans|caminhões|caminhonetes|micro-ônibus|ônibus|guinchos|empilhadeiras|motoristas|mecânicos|funcionários|unidades)\\b`, 'i');
    const m = visible.match(flota);
    assert.ok(!m, `se dimensiona la flota o el personal en ${pt}: "${m && m[0]}"`);
    assert.doesNotMatch(visible, /R\$\s*\d|US\$\s*\d|USD\s*\d|\$\s*\d/, `${pt} publica un precio`);
    assert.doesNotMatch(visible, /San\s+Crist[oó]bal|\bAMT\s*(n[º°]|nº|#|número)/i, `${pt} publica un dato vedado`);
  });

  // -------------------------------------------------------------------------
  // 6b. Auditoría PT del 05/11/2026 (revision-sitio-2026-11-05/auditoria-pt.md):
  //     ni el guía ni las bodegas se cierran con un «no», «Factura A/B» no le
  //     dice nada a un brasileño (los datos para proveedores del pie lo
  //     conservan), «privativo» en el cuerpo (el <title> y sus espejos pueden
  //     seguir con «privado») y «desde» sólo para el tiempo, nunca un lugar.
  // -------------------------------------------------------------------------
  test(`${pt}: no cierra el guía, sin «Factura A/B» fuera del pie, «privativo» y «desde» sólo temporal`, () => {
    const sinPie = html.split(/<footer class="site"/)[0];
    const visible = textoVisible(sinPie);
    const cerca = (m) => m && visible.slice(Math.max(0, m.index - 40), m.index + 60);
    let m = visible.match(/não é (um passeio guiado|guia)|faz papel de guia\?\s*Não\b/i);
    assert.ok(!m, `${pt} cierra el guía: "${cerca(m)}"`);
    m = visible.match(/reservadas pelo grupo|pela agência que organiza/i);
    assert.ok(!m, `${pt} le pasa la reserva a otro: "${cerca(m)}"`);
    m = visible.match(/\bfactura [AB]\b/i);
    assert.ok(!m, `${pt} dice «factura A/B» fuera del pie: "${cerca(m)}"`);
    const cuerpo = textoVisible(sinPie.split('\n').filter((l) => !l.includes('| Lausof SRL')).join('\n'));
    m = cuerpo.match(/\bprivad[oa]s?\b/i);
    assert.ok(!m, `${pt} dice «privado» en vez de «privativo»: "${m && cuerpo.slice(Math.max(0, m.index - 40), m.index + 40)}"`);
    m = visible.match(/\bdesde (?!\d|então)/i);
    assert.ok(!m, `${pt} usa «desde» para un lugar: "${cerca(m)}"`);
  });
}

// ---------------------------------------------------------------------------
// 7. Sitemap: las 7 URLs de /pt/ y ninguna otra.
// ---------------------------------------------------------------------------
test('el sitemap lista las 7 páginas en portugués y ninguna otra de /pt/', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = new Set(Object.values(paresPt).map(urlDe));
  for (const u of esperadas) assert.ok(urls.includes(u), `falta ${u} en el sitemap`);
  for (const u of urls.filter((x) => x.startsWith(`${DOMINIO}/pt/`))) {
    assert.ok(esperadas.has(u), `${u} está en el sitemap y no es una página pt registrada`);
  }
});

// ---------------------------------------------------------------------------
// 8. Datos para el viajero brasileño, con fuente y fecha (E-languages §3.4).
//    Viven en la sección #brasil del hub; las páginas de ruta enlazan ahí.
// ---------------------------------------------------------------------------
test('pt/passeios-e-traslados.html: la sección "Vindo do Brasil" trae vuelo, documentos y temporada con fuentes', () => {
  const html = paginasPt['pt/passeios-e-traslados.html'];
  const seccion = (html.match(/<section class="block" id="brasil">([\s\S]*?)<\/section>/) || [])[1];
  assert.ok(seccion, 'falta la sección #brasil');
  const visible = textoVisible(seccion);
  assert.match(visible, /GOL/);
  assert.match(visible, /17\/12\/2026/, 'falta la fecha del primer vuelo Rio–Salta');
  assert.match(visible, /RG/);
  assert.match(visible, /CNH não serve/, 'falta la advertencia de que la CNH no sirve');
  assert.match(visible, /julho/i, 'falta la temporada alta de los brasileños');
  assert.match(visible, /português/, 'falta la invitación a escribir en portugués');
  assert.ok(seccion.includes('normas.mercosur.int'), 'falta la fuente oficial de los documentos (Decisão CMC 10/26)');
  assert.ok(seccion.includes('visitsalta.ar/estadisticas'), 'falta la fuente de la temporada');
  assert.match(visible, /iProfesional, 22\/05\/2026/, 'falta la fuente fechada del vuelo');
});

for (const pt of ['pt/traslado-salta-san-pedro-de-atacama.html', 'pt/traslado-salta-uyuni.html']) {
  test(`${pt}: documentos para brasileños con la fuente del Mercosur`, () => {
    const html = paginasPt[pt];
    assert.ok(html, `falta ${pt}`);
    assert.match(textoVisible(html), /Brasileiros:/, `${pt} no tiene el renglón para brasileños`);
    assert.ok(html.includes('normas.mercosur.int'), `${pt} no cita la Decisão MERCOSUL/CMC nº 10/26`);
  });
}

for (const pt of Object.values(paresPt).filter((p) => p !== 'pt/passeios-e-traslados.html')) {
  test(`${pt}: enlaza la sección "Vindo do Brasil" del hub`, () => {
    assert.ok(paginasPt[pt] && paginasPt[pt].includes('href="/pt/passeios-e-traslados.html#brasil"'),
      `${pt} no enlaza /pt/passeios-e-traslados.html#brasil`);
  });
}

// ---------------------------------------------------------------------------
// 9. Mensajes pre-armados: todo tipo tiene sus renglones en portugués.
// ---------------------------------------------------------------------------
test('scripts/prefill.mjs tiene renglones en portugués para todos los tipos', async () => {
  const { TIPOS, PAGINAS } = await import('../scripts/prefill.mjs');
  for (const [tipo, t] of Object.entries(TIPOS)) {
    assert.ok(Array.isArray(t.pt) && t.pt.length === t.es.length, `el tipo ${tipo} no tiene renglones pt`);
  }
  for (const pt of Object.values(paresPt)) assert.ok(PAGINAS[pt], `${pt} no está en PAGINAS`);
});
