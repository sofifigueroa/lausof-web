// Versión en inglés bajo /en/. Estas guardias sostienen las tres cosas que se
// rompen solas en un sitio de dos idiomas: que el hreflang sea RECÍPROCO (si
// no lo es, Google lo descarta entero), que ninguna página de /en/ se sirva
// con rutas relativas (desde un subdirectorio se rompen las imágenes) y que el
// inglés no arrastre castellano, cantidades de flota ni datos vedados.
//
// Están escritas para pasar con el mapa de gemelas vacío: la ola de páginas
// todavía no existe y esto es el andamio. A medida que cada par se registra en
// `pares` (tests/util.js), las guardias se activan solas sobre ese par.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  paginas, paginasEs, paginasEn, pares, sinGemelaEn,
  urlDe, rutaDe, DOMINIO, index, sitemap, redirects, sinComentarios,
} = require('./util.js');

// La 404 en inglés existe pero no es gemela de nadie: no se indexa, no lleva
// hreflang, no va al sitemap y no lleva Open Graph (igual que la 404 en
// español). Las guardias de indexación la saltean por nombre.
const enIndexables = Object.keys(paginasEn).filter((n) => !sinGemelaEn.includes(n));

// Texto que el visitante realmente ve: sin comentarios, sin el contenido de
// <script> y <style> (si no, la CSS embebida entra como "texto"), sin los
// enlaces de correo enteros (el plan permite el castellano dentro de un
// mailto: la dirección contacto@ es la misma en los dos idiomas) y sin
// etiquetas —con lo que se van también todos los atributos—.
const textoVisible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<a[^>]+href="mailto:[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/\s+/g, ' ');

// Los <link rel="alternate" hreflang="..."> de una página, como mapa
// idioma → URL. El orden en el HTML no importa; lo que se compara es el mapa.
const alternativas = (html) => {
  const mapa = {};
  for (const [, etiqueta] of sinComentarios(html).matchAll(/(<link\b[^>]*\brel="alternate"[^>]*>)/gi)) {
    const idioma = etiqueta.match(/\bhreflang="([^"]+)"/i);
    const href = etiqueta.match(/\bhref="([^"]+)"/i);
    if (idioma && href) mapa[idioma[1]] = href[1];
  }
  return mapa;
};

const enlacesDe = (html) =>
  [...sinComentarios(html).matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1]);

// ---------------------------------------------------------------------------
// 1. Cada página de /en/: idioma declarado, canónica propia y cero rutas
//    relativas. Una ruta relativa desde /en/ apunta a /en/assets/... y la
//    imagen no existe: es la forma número uno de romper un subdirectorio.
// ---------------------------------------------------------------------------
for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: lang="en" y sin rutas relativas`, () => {
    assert.match(html, /<html lang="en"[ >]/,
      `${nombre} no declara <html lang="en">`);
    for (const enlace of enlacesDe(html)) {
      if (/^(https?:|mailto:|tel:|#|data:)/i.test(enlace) || enlace === '') continue;
      assert.ok(enlace.startsWith('/'),
        `${nombre} tiene una ruta relativa (se rompe fuera de /en/): ${enlace}`);
    }
  });
}

for (const nombre of enIndexables) {
  test(`${nombre}: canónica propia dentro de /en/`, () => {
    const canonica = paginasEn[nombre].match(/<link rel="canonical" href="([^"]+)">/);
    assert.ok(canonica, `${nombre} no declara canónica`);
    assert.strictEqual(canonica[1], urlDe(nombre),
      `la canónica de ${nombre} no es la suya`);
  });
}

// ---------------------------------------------------------------------------
// 2. El mapa de gemelas y el disco cuentan lo mismo, en las dos direcciones.
// ---------------------------------------------------------------------------
test('cada par ES↔EN del mapa existe en disco', () => {
  for (const [es, en] of Object.entries(pares)) {
    assert.ok(paginasEs[es], `el mapa de pares nombra ${es} y esa página no existe`);
    assert.ok(paginasEn[en], `el mapa de pares nombra ${en} y esa página no existe`);
    assert.ok(en.startsWith('en/'), `la gemela ${en} no vive bajo en/`);
  }
});

test('ninguna página de /en/ quedó huérfana del mapa de pares', () => {
  const registradas = new Set(Object.values(pares));
  for (const nombre of enIndexables) {
    assert.ok(registradas.has(nombre),
      `${nombre} existe pero no está en el mapa de pares de tests/util.js: ` +
      'sin gemela registrada no lleva hreflang y Google la ve suelta');
  }
});

// ---------------------------------------------------------------------------
// 3-5. hreflang: recíproco, con x-default siempre al español, y sólo en las
//      páginas que tienen gemela. Google: "si dos páginas no se apuntan
//      mutuamente, las etiquetas se ignoran".
// ---------------------------------------------------------------------------
for (const [es, en] of Object.entries(pares)) {
  test(`${es} ↔ ${en}: hreflang recíproco e idéntico en las dos gemelas`, () => {
    const esperado = { es: urlDe(es), en: urlDe(en), 'x-default': urlDe(es) };
    for (const [nombre, html] of [[es, paginasEs[es]], [en, paginasEn[en]]]) {
      assert.deepStrictEqual(alternativas(html), esperado,
        `el bloque hreflang de ${nombre} no coincide con el de su gemela`);
    }
  });

  test(`${es} ↔ ${en}: el x-default apunta a la versión en español`, () => {
    for (const [nombre, html] of [[es, paginasEs[es]], [en, paginasEn[en]]]) {
      assert.strictEqual(alternativas(html)['x-default'], urlDe(es),
        `el x-default de ${nombre} no apunta al español`);
    }
  });
}

test('ninguna página sin gemela lleva hreflang', () => {
  const conGemela = new Set([...Object.keys(pares), ...Object.values(pares)]);
  for (const [nombre, html] of Object.entries(paginas)) {
    if (conGemela.has(nombre)) continue;
    assert.deepStrictEqual(alternativas(html), {},
      `${nombre} no tiene gemela y lleva hreflang: una etiqueta suelta no aporta nada`);
  }
});

// ---------------------------------------------------------------------------
// 6. Selector de idioma. Se activa solo: mientras no haya ningún par, las
//    páginas en español todavía no lo llevan (apuntaría al vacío). En cuanto
//    se registra el primer par, TODAS las páginas tienen que tener el suyo.
// ---------------------------------------------------------------------------
const switcherDe = (html) =>
  [...sinComentarios(html).matchAll(/<a\b[^>]*\bclass="[^"]*\blang-switch\b[^"]*"[^>]*>/g)]
    .map((m) => (m[0].match(/\bhref="([^"]+)"/) || [])[1]);

for (const [es, en] of Object.entries(pares)) {
  test(`${es} ↔ ${en}: el selector de idioma enlaza a la gemela en las dos direcciones`, () => {
    assert.deepStrictEqual(switcherDe(paginasEs[es]), [rutaDe(en)],
      `el selector de ${es} no apunta a su gemela ${rutaDe(en)}`);
    assert.deepStrictEqual(switcherDe(paginasEn[en]), [rutaDe(es)],
      `el selector de ${en} no apunta a su gemela ${rutaDe(es)}`);
  });
}

if (Object.keys(pares).length > 0) {
  test('toda página en español sin gemela manda el selector a la portada inglesa', () => {
    const conGemela = new Set(Object.keys(pares));
    for (const nombre of Object.keys(paginasEs)) {
      if (conGemela.has(nombre)) continue;
      assert.deepStrictEqual(switcherDe(paginasEs[nombre]), ['/en/'],
        `${nombre} no tiene gemela: su selector tiene que ir a /en/`);
    }
  });
}

// La 404 en inglés no tiene gemela, pero sí tiene que dar salida al español:
// es una página sin salida y el que llegó desde el sitio en español se queda
// encerrado sin este enlace.
for (const nombre of Object.keys(paginasEn)) {
  test(`${nombre}: lleva un selector de idioma hacia el sitio en español`, () => {
    const hrefs = switcherDe(paginasEn[nombre]);
    assert.ok(hrefs.length > 0, `${nombre} no tiene ningún .lang-switch`);
    for (const href of hrefs) {
      assert.ok(href.startsWith('/') && !href.startsWith('/en/'),
        `el selector de ${nombre} no sale del inglés: ${href}`);
    }
  });
}

// ---------------------------------------------------------------------------
// 6.bis. El enlace de idioma del PIE. B.10 lo pedía ("footer link present") y
//        era la única guardia de esa lista que nunca se escribió: la
//        verificación por inyección del 31/08 comprobó que se podía borrar de
//        una página, o apuntarlo a la gemela equivocada, y la suite seguía en
//        verde.
//
//        Existe además del selector de la barra porque por debajo de 880 px el
//        menú se esconde, y es el único camino al otro idioma que queda abajo
//        de todo. Se lo busca por su LUGAR (dentro del <footer>) y por su
//        atributo hreflang, nunca por una clase: el del pie no lleva
//        .lang-switch a propósito —si la llevara, switcherDe() contaría dos
//        enlaces y la guardia del selector fallaría—, así que una guardia por
//        clase no lo vería nunca.
// ---------------------------------------------------------------------------
const pieDe = (html) => {
  const pie = sinComentarios(html).match(/<footer class="site"[^>]*>[\s\S]*?<\/footer>/);
  return pie ? pie[0] : '';
};

const idiomaEnPie = (html) =>
  [...pieDe(html).matchAll(/<a\b[^>]*\bhreflang="[^"]*"[^>]*>/g)].map((m) => m[0]);

const hrefDe = (etiqueta) => (etiqueta.match(/\bhref="([^"]+)"/) || [])[1];

// Qué gemela le toca al pie de cada página. Una página sin gemela manda a la
// portada del otro idioma, igual que su selector de la barra: es lo más
// cercano que hay, y la portada lista el resto.
const gemelaDelPie = {};
for (const nombre of Object.keys(paginasEs)) {
  gemelaDelPie[nombre] = { href: pares[nombre] ? rutaDe(pares[nombre]) : '/en/', idioma: 'en' };
}
for (const nombre of Object.keys(paginasEn)) {
  const es = Object.keys(pares).find((k) => pares[k] === nombre);
  gemelaDelPie[nombre] = { href: es ? rutaDe(es) : rutaDe('index.html'), idioma: 'es' };
}

for (const [nombre, html] of Object.entries(paginas)) {
  const { href, idioma } = gemelaDelPie[nombre];
  test(`${nombre}: el pie lleva un enlace al otro idioma y apunta a la gemela`, () => {
    const enlaces = idiomaEnPie(html);
    assert.strictEqual(enlaces.length, 1,
      `${nombre} tendría que tener exactamente un enlace de idioma en el pie y tiene ${enlaces.length}` +
      ' (por debajo de 880 px el menú se esconde y el pie es la única salida al otro idioma)');
    assert.strictEqual(hrefDe(enlaces[0]), href,
      `el enlace de idioma del pie de ${nombre} no apunta a ${href}`);
    assert.match(enlaces[0], new RegExp(`hreflang="${idioma}"`),
      `el enlace de idioma del pie de ${nombre} no declara hreflang="${idioma}"`);
    assert.ok(!/class="[^"]*\blang-switch\b/.test(enlaces[0]),
      `el enlace del pie de ${nombre} lleva la clase .lang-switch: esa clase marca el ` +
      'selector de la barra y sólo puede haber uno por página');
  });
}

// ---------------------------------------------------------------------------
// 7. Sitemap: están todas las gemelas inglesas y ninguna URL de /en/ que no
//    sea una gemela registrada. La 404 nunca va.
// ---------------------------------------------------------------------------
test('el sitemap lista las gemelas inglesas y sólo las que existen', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = new Set(Object.values(pares).map(urlDe));
  for (const url of esperadas) {
    assert.ok(urls.includes(url), `falta ${url} en el sitemap`);
  }
  for (const url of urls) {
    if (!url.startsWith(`${DOMINIO}/en/`)) continue;
    assert.ok(esperadas.has(url),
      `el sitemap lista ${url} y esa página no es una gemela registrada`);
  }
  assert.ok(!urls.some((u) => u.includes('/en/404')),
    'la 404 en inglés no va en el sitemap');
});

// ---------------------------------------------------------------------------
// 8. Las dos 404: noindex y meta description. La del español cierra el
//    pendiente 404-META del backlog (venía sin description desde el 29/08).
// ---------------------------------------------------------------------------
for (const nombre of ['404.html', 'en/404.html']) {
  test(`${nombre}: lleva noindex y meta description`, () => {
    const html = paginas[nombre];
    assert.ok(html, `falta ${nombre}`);
    assert.match(html, /<meta name="robots" content="noindex">/,
      `${nombre} no lleva noindex`);
    const desc = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(desc, `${nombre} no lleva meta description`);
    assert.ok(desc[1].length >= 60,
      `la meta description de ${nombre} es demasiado corta: ${desc[1].length} caracteres`);
  });
}

// ---------------------------------------------------------------------------
// 9. _redirects: la 404 propia del directorio inglés y la variante duplicada
//    de la portada. El orden importa: /en/* también matchea /en/index.html y
//    Netlify aplica la primera regla que coincide, así que la específica va
//    antes que el comodín.
// ---------------------------------------------------------------------------
test('_redirects: /en/* cae en la 404 inglesa y /en/index.html va a /en/', () => {
  assert.match(redirects, /^\/en\/\*\s+\/en\/404\.html\s+404$/m,
    'falta la regla de 404 propia del directorio /en/');
  assert.match(redirects, /^\/en\/index\.html\s+\/en\/\s+301!$/m,
    'falta el 301 de /en/index.html a /en/');
  const reglas = redirects.split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]);
  assert.ok(reglas.indexOf('/en/index.html') < reglas.indexOf('/en/*'),
    'el comodín /en/* quedó antes que /en/index.html: Netlify aplica la primera que matchea');
});

// ---------------------------------------------------------------------------
// 10. Open Graph por idioma. og:locale dice en qué idioma está ESTA página y
//     og:locale:alternate en cuáles más existe.
// ---------------------------------------------------------------------------
for (const nombre of enIndexables) {
  test(`${nombre}: meta description, og:locale en_US y og:locale:alternate es_AR`, () => {
    const html = paginasEn[nombre];
    const desc = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(desc, `${nombre} no lleva meta description`);
    assert.ok(desc[1].length >= 120 && desc[1].length <= 170,
      `la meta description de ${nombre} mide ${desc[1].length} caracteres (se buscan 140-160)`);
    assert.match(html, /<meta property="og:locale" content="en_US">/,
      `${nombre} no declara og:locale en_US`);
    assert.match(html, /<meta property="og:locale:alternate" content="es_AR">/,
      `${nombre} no declara og:locale:alternate es_AR`);
  });
}

for (const es of Object.keys(pares)) {
  test(`${es}: declara og:locale:alternate en_US (tiene gemela inglesa)`, () => {
    assert.match(paginasEs[es], /<meta property="og:locale:alternate" content="en_US">/,
      `${es} tiene gemela inglesa y no lo declara en el Open Graph`);
  });
}

// ---------------------------------------------------------------------------
// 11. Datos estructurados. Una sola entidad para toda la empresa: las páginas
//     inglesas REFERENCIAN #empresa por su @id, nunca la redefinen. El idioma
//     va en el nodo WebPage, que es donde schema.org admite inLanguage.
// ---------------------------------------------------------------------------
for (const nombre of enIndexables) {
  test(`${nombre}: JSON-LD válido, con WebPage inLanguage "en" y referencia a #empresa`, () => {
    const bloques = [...paginasEn[nombre].matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(bloques.length > 0, `no hay JSON-LD en ${nombre}`);
    const nodos = [];
    for (const [, cuerpo] of bloques) {
      let datos;
      assert.doesNotThrow(() => { datos = JSON.parse(cuerpo); }, `JSON-LD roto en ${nombre}`);
      nodos.push(...(datos['@graph'] || [datos]));
    }
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    assert.ok(pagina, `${nombre} no tiene un nodo WebPage`);
    assert.strictEqual(pagina.inLanguage, 'en',
      `el WebPage de ${nombre} no declara inLanguage "en"`);
    assert.ok(JSON.stringify(nodos).includes(`${DOMINIO}/#empresa`),
      `${nombre} no referencia la entidad #empresa de la portada`);
    const completa = nodos.find((n) => n['@id'] === `${DOMINIO}/#empresa` && n.taxID);
    assert.ok(!completa,
      `${nombre} redefine la ficha completa de la empresa: tiene que referenciarla por @id`);
  });
}

test('index.html: la ficha declara knowsLanguage es y en', () => {
  const datos = JSON.parse(
    index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.deepStrictEqual(datos.knowsLanguage, ['es', 'en'],
    'la ficha de la empresa no declara que atiende en español e inglés');
});

// ---------------------------------------------------------------------------
// 12. Nada de flota en venta en inglés: un comprador de procurement que
//     aterriza en "vendemos nuestra flota" deja de evaluar al proveedor.
// ---------------------------------------------------------------------------
for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: sin enlace a la flota en venta`, () => {
    assert.ok(!/flota-en-venta/.test(html),
      `${nombre} enlaza la flota en venta`);
  });
}

// ---------------------------------------------------------------------------
// 13. Contacto: el WhatsApp va a la única línea pública y con texto en inglés
//     (un prefill en castellano delata la traducción). Y todo mailto a
//     contacto@ copia a transporte@ — decisión de Lautaro del 31/08: quiere
//     ver todas las consultas en inglés.
// ---------------------------------------------------------------------------
for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: los wa.me van al 526-9009 con texto en inglés`, () => {
    const was = [...html.matchAll(/href="https:\/\/wa\.me\/(\d+)(\?text=([^"]*))?"/g)];
    assert.ok(was.length > 0, `${nombre} no tiene ningún wa.me`);
    for (const [, linea, , texto] of was) {
      assert.strictEqual(linea, '5493875269009',
        `${nombre} manda el WhatsApp a una línea que no es la pública`);
      if (!texto) continue;
      const legible = decodeURIComponent(texto);
      assert.ok(!/\b(hola|cotizar|quiero|consulta|servicio)\b/i.test(legible),
        `el prefill de WhatsApp de ${nombre} quedó en castellano: "${legible}"`);
    }
  });

  test(`${nombre}: todo mailto a contacto@ copia a transporte@`, () => {
    const mailtos = [...html.matchAll(/href="mailto:([^"]+)"/g)].map((m) => m[1]);
    const aContacto = mailtos.filter((m) => m.startsWith('contacto@lausof.com'));
    assert.ok(aContacto.length > 0,
      `${nombre} no ofrece el correo contacto@lausof.com (es el CTA principal en inglés)`);
    for (const enlace of aContacto) {
      assert.match(enlace, /[?&]cc=transporte@lausof\.com(&|$)/,
        `el mailto de ${nombre} no copia a transporte@lausof.com: ${enlace}`);
    }
  });
}

// ---------------------------------------------------------------------------
// 14. Nunca se dimensiona la flota ni el personal, tampoco en inglés. Los
//     patrones van atados al sustantivo para no pisar especificaciones
//     legítimas: "19-seat", "7.5-ton" y "3,000 m²" tienen que pasar.
// ---------------------------------------------------------------------------
// Numerales en palabra y en dígitos. La lista original saltaba de `twelve` a
// `fifteen` y `twenty`, y la verificación por inyección del 31/08 mostró que
// dejaba pasar "a dozen trucks" y "thirty drivers". Ahora está completa hasta
// `ninety`, con `hundred` y `dozen`.
const numeroEn = '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|' +
  'thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|' +
  'fifty|sixty|seventy|eighty|ninety|hundreds?|dozens?|\\d+)';

// Los sustantivos que CUENTAN unidades o gente. `seats`, `tons` y `m²` no están
// y no tienen que estar: "19-seat", "7.5-ton" y "3,000 m²" son la
// especificación de una unidad, no un recuento de cuántas hay. Todo el diseño
// de estas tres guardias se apoya en esa distinción.
const sustantivoFlota = '(?:units?|vehicles?|trucks?|pickups?|vans?|minibus(?:es)?|buses|' +
  'forklifts?|tow trucks?|cranes?|drivers?|mechanics?|employees?|staff)';

// (a) La forma canónica: "12 trucks", "three minibuses". El "of" opcional cubre
//     "dozens of trucks", donde el numeral y el sustantivo no van pegados.
const dimensionEn = new RegExp(`\\b${numeroEn}\\s+(?:of\\s+)?${sustantivoFlota}\\b`, 'i');

// (b) La forma guionada: "our 12-vehicle fleet". El guion rompe el \s+ de (a),
//     así que necesita su propio patrón. Sigue atado al sustantivo de flota,
//     que es lo que deja pasar "19-seat" y "7.5-ton".
const dimensionGuionadaEn = new RegExp(`\\b${numeroEn}-${sustantivoFlota}\\b`, 'i');

// (c) El número pelado detrás de una palabra que ya significa "cuántos":
//     "a fleet of 12", "a team of thirty". Acá el sustantivo va ADELANTE, así
//     que el ancla es esa palabra y no hace falta que detrás siga otra.
const dimensionSueltaEn = new RegExp(
  `\\b(?:fleets?|teams?|crews?|staff|workforce|roster)\\s+of\\s+${numeroEn}\\b`, 'i');

const satelitalEn = new RegExp(`\\b${numeroEn}[\\s-]+satellite phones?\\b`, 'i');

for (const [nombre, html] of Object.entries(paginasEn)) {
  const visible = textoVisible(html);
  test(`${nombre}: sin dimensionar la flota ni el personal`, () => {
    for (const [forma, patron] of [
      ['numeral + sustantivo', dimensionEn],
      ['numeral guionado', dimensionGuionadaEn],
      ['número suelto detrás de "fleet of"', dimensionSueltaEn],
    ]) {
      const m = visible.match(patron);
      assert.ok(!m, `se dimensiona la flota o el personal en ${nombre} (${forma}): "${m && m[0]}"`);
    }
    const s = visible.match(satelitalEn);
    assert.ok(!s, `se publica la cantidad de teléfonos satelitales en ${nombre}: "${s && s[0]}"`);
  });
}

// ---------------------------------------------------------------------------
// 15. Palabras vedadas y líneas dadas de baja, en inglés. Las reglas de
//     contenido (POL-CLAIMS, 29/08) valen igual en los dos idiomas.
// ---------------------------------------------------------------------------
const vedadasEn = [
  ['Posco', /\bposco\b/i],
  ['VTV (acá es RTO)', /\bVTV\b/],
  ['prendas / gravámenes', /\b(pledge|pledged|lien)\b/i],
  ['financiación', /\bfinancing\b/i],
  ['mudanzas', /\b(removals?|house moves?|moving services?)\b/i],
  ['número de habilitación AMT', /\bAMT\s*(No\.?|#|N[º°])/i],
  ['nombre de la aseguradora', /San\s+Crist[oó]bal/i],
  ['promesa de atención telefónica en inglés', /\b(english|24\/7)[^.]{0,40}\bphone (support|line)\b/i],
];

// El único número de habilitación publicable es el de CNRT (60284): es
// verificable por el comprador. Cualquier otro legajo o licencia numerada
// —AMT, agencia de turismo— está vedado mientras no esté confirmado.
const legajoEn = /\b(legajo|licen[cs]e|permit|file)\s*(?:No\.?|#|N[º°])\s*(\d+)/gi;

for (const [nombre, html] of Object.entries(paginasEn)) {
  const visible = textoVisible(html);
  test(`${nombre}: sin palabras vedadas`, () => {
    for (const [etiqueta, patron] of vedadasEn) {
      assert.ok(!patron.test(visible), `"${etiqueta}" aparece en ${nombre}`);
    }
    for (const [entero, , numero] of visible.matchAll(legajoEn)) {
      assert.strictEqual(numero, '60284',
        `${nombre} publica un número de habilitación que no es el CNRT 60284: "${entero}"`);
    }
  });
}

// Líneas dadas de baja o privadas: no vuelven a entrar ni en un enlace, ni en
// el texto, ni en un comentario. Se mira el archivo entero.
const lineasVedadas = ['5377218', '537-7218', '5377527', '537-7527', '4311584',
  '431-1584', '5092489', '509-2489', '5380900', '538-0900'];

for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: no publica ninguna línea de baja ni privada`, () => {
    for (const linea of lineasVedadas) {
      assert.ok(!html.includes(linea),
        `${nombre} publica la línea vedada ${linea}`);
    }
  });
}

// ---------------------------------------------------------------------------
// 16. Sin castellano residual. Google detecta el idioma por el texto visible:
//     una página mezclada no rankea en ninguno de los dos. Los nombres
//     propios ("Quebrada de Humahuaca", "Lausof S.R.L.", "Factura A", "CNRT")
//     quedan permitidos por construcción: la lista sólo tiene verbos y
//     sustantivos comunes del sitio en español.
// ---------------------------------------------------------------------------
const castellano = /\b(cotiz[aá]|cotizamos|escribinos|llamanos|llam[aá]|consult[aá]|habilitaci[oó]n|habilitado|nosotros|servicios|seguridad|contacto|traslados?|choferes|camiones|empresa familiar)\b/i;

for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: sin castellano residual en el texto visible`, () => {
    const m = textoVisible(html).match(castellano);
    assert.ok(!m, `quedó castellano visible en ${nombre}: "${m && m[0]}"`);
  });
}

// ---------------------------------------------------------------------------
// 17. Sin clichés de marketing. Misma vara que la auditoría de copy del 29/08
//     en español: el registro es industrial, no "landing".
// ---------------------------------------------------------------------------
const cliches = /\b(world-class|seamless|hassle-free|premium|best-in-class|state-of-the-art|cutting-edge|trusted partner|passionate|passion for|we pride ourselves|look no further)\b/i;

for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: sin clichés de marketing`, () => {
    const m = textoVisible(html).match(cliches);
    assert.ok(!m, `cliché de marketing en ${nombre}: "${m && m[0]}"`);
  });
}

// ---------------------------------------------------------------------------
// 18. Ortografía estadounidense (decisión de Lautaro, 31/08). Consistente en
//     todas las páginas: mezclar registros delata la traducción.
// ---------------------------------------------------------------------------
const ortografiaBritanica = /\b(licence|licences|organisation|organisations|authorisation|authorised|kilometres|metres|tonnes|programme|centre|tyres?|specialise[ds]?|analyse[ds]?)\b/i;

for (const [nombre, html] of Object.entries(paginasEn)) {
  test(`${nombre}: ortografía estadounidense`, () => {
    const m = textoVisible(html).match(ortografiaBritanica);
    assert.ok(!m, `ortografía británica en ${nombre}: "${m && m[0]}" (el sitio va en inglés de EE.UU.)`);
  });
}

// ---------------------------------------------------------------------------
// 19. Espejo inglés de las afirmaciones verificadas de la portada. Todo lo que
//     el español publica como dato confirmado tiene que seguir estando en la
//     portada inglesa: la versión traducida puede decir MENOS, nunca más, pero
//     tampoco puede perder los datos que hacen cotizable a la empresa.
// ---------------------------------------------------------------------------
const requeridasEn = [
  ['habilitación CNRT', /CNRT/],
  ['número de CNRT', /60284/],
  ['habilitación AMT', /AMT/],
  ['capacidad de carga de 7,5 toneladas', /7\.5[- ]ton/i],
  ['registro de temperatura', /temperature log/i],
  ['agencia de turismo habilitada', /licensed (travel agency|tour operator)/i],
  ['más de una década en la Puna', /more than a decade[^.]{0,30}Puna/i],
  ['psicofísico al día', /medical fitness/i],
  ['ART al día', /\bART\b/],
  ['teléfono satelital en altura', /satellite phone/i],
  ['CUIT', /30-71146774-9/],
  ['empezamos en 2010', /2010/],
  ['grúa y cargas desde 2017', /2017/],
];

if (paginasEn['en/index.html']) {
  const portadaEn = textoVisible(paginasEn['en/index.html']);

  test('en/index.html: las afirmaciones verificadas siguen presentes', () => {
    for (const [etiqueta, patron] of requeridasEn) {
      assert.ok(patron.test(portadaEn), `falta "${etiqueta}" en en/index.html`);
    }
  });

  test('en/index.html: el GPS siempre queda acotado a las unidades en servicio', () => {
    const visibles = portadaEn.match(/GPS/g) || [];
    const acotadas = portadaEn.match(/GPS on the units in service/g) || [];
    assert.ok(visibles.length > 0, 'desapareció la mención del GPS');
    assert.strictEqual(visibles.length, acotadas.length,
      'hay una mención de GPS sin el alcance "on the units in service"');
  });

  test('en/index.html: las 7,5 toneladas nunca se reescriben como izaje', () => {
    assert.ok(!/lifting capacity|hoist/i.test(portadaEn),
      'las 7,5 t son la carga del camión plancha, no su capacidad de izaje');
  });
}
