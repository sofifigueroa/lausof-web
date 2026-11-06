// Fotos en las páginas (fase 1, 05/11/2026): la galería que maneja el
// visitante, la regla de que nada se mueve solo y los techos de fotos por
// tipo de página. Diseño: web/imagenes-2026-11-05/3b-diseno-sitio.md §1–§3;
// textos: 4-textos.md §2. Lo que necesita un navegador de verdad (teclado,
// <dialog>, foco, 390 px) lo controla scripts/galeria-navegador.mjs.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, index, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(raiz, r), 'utf8');
const attr = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}(?:="([^"]*)")?[\\s>]`))?.[1];
const texto = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const IDIOMA = (nombre) => (nombre.startsWith('en/') ? 'en' : nombre.startsWith('pt/') ? 'pt' : 'es');
const ROL = { es: ['galería', 'foto', 'de'], en: ['gallery', 'photo', 'of'], pt: ['galeria', 'foto', 'de'] };

// Cada <section class="galeria"> con su marcado completo.
function galeriasDe(html) {
  const limpio = sinComentarios(html);
  const lista = [];
  for (const m of limpio.matchAll(/<section class="galeria"([^>]*)>([\s\S]*?)\n\s*<\/section>/g)) {
    const cuadros = [...m[2].matchAll(/<figure([^>]*)>([\s\S]*?)<\/figure>/g)]
      .map(([, a, cuerpo]) => ({ a, cuerpo, img: cuerpo.match(/<img\s[^>]*>/)?.[0] || '' }));
    lista.push({ abre: `<section${m[1]}>`, cuerpo: m[2], cuadros });
  }
  return lista;
}

test('cada galería: 3 a 5 cuadros con rol, número, miniatura, alt y pie', () => {
  let vistas = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const [rolGaleria, rolFoto, de] = ROL[IDIOMA(nombre)];
    for (const g of galeriasDe(html)) {
      vistas++;
      assert.strictEqual(attr(g.abre, 'aria-roledescription'), rolGaleria, `${nombre}: aria-roledescription de la galería`);
      assert.ok(attr(g.abre, 'aria-label'), `${nombre}: galería sin aria-label`);
      assert.doesNotMatch(attr(g.abre, 'aria-label'), /carrusel|carousel|galer[ií]a/i,
        `${nombre}: la etiqueta repite el rol («${attr(g.abre, 'aria-label')}»)`);
      assert.match(g.cuerpo, /<div class="galeria-pista" tabindex="0"/, `${nombre}: la pista no se enfoca con el teclado`);
      const n = g.cuadros.length;
      assert.ok(n >= 3 && n <= 5, `${nombre}: «${attr(g.abre, 'aria-label')}» tiene ${n} cuadros (van de 3 a 5)`);
      g.cuadros.forEach((c, k) => {
        const donde = `${nombre}, «${attr(g.abre, 'aria-label')}» cuadro ${k + 1}`;
        assert.strictEqual(attr(`<figure${c.a}>`, 'role'), 'group', `${donde}: role="group"`);
        assert.strictEqual(attr(`<figure${c.a}>`, 'aria-roledescription'), rolFoto, `${donde}: aria-roledescription`);
        assert.strictEqual(attr(`<figure${c.a}>`, 'aria-label'), `${k + 1} ${de} ${n}`, `${donde}: aria-label`);
        assert.ok(attr(`<figure${c.a}>`, 'data-miniatura'), `${donde}: sin etiqueta corta para la miniatura`);
        assert.ok(c.img, `${donde}: sin <img>`);
        assert.ok(attr(c.img, 'alt'), `${donde}: alt vacío`);
        assert.match(c.img, /\swidth="\d+" height="\d+"/, `${donde}: sin medidas`);
        const pie = c.cuerpo.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
        assert.ok(pie && texto(pie[1]).length > 0, `${donde}: sin pie de foto`);
        assert.notStrictEqual(texto(pie[1]), attr(c.img, 'alt'), `${donde}: el pie copia el alt`);
      });
    }
  }
  assert.ok(vistas >= 3, `se esperaban al menos las 3 galerías de la página de flota y hay ${vistas}`);
});

// La foto que pinta primero (LCP) es la del encabezado; en una página sin foto
// de encabezado puede serlo el primer cuadro de la primera galería, marcado
// data-lcp. Todo lo demás de una galería carga diferido.
test('sólo el primer cuadro de una galería marcada data-lcp carga sin demora', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const galerias = galeriasDe(html);
    const conEncabezado = /<div class="(?:hero-photo|page-head-photo)[^"]*" role="presentation">/.test(sinComentarios(html));
    galerias.forEach((g, k) => {
      const lcp = /\sdata-lcp[\s>]/.test(g.abre);
      if (lcp) {
        assert.ok(k === 0 && !conEncabezado, `${nombre}: data-lcp sólo en la primera galería de una página sin foto de encabezado`);
      }
      g.cuadros.forEach((c, i) => {
        if (lcp && i === 0) {
          assert.match(c.img, /fetchpriority="high"/, `${nombre}: el primer cuadro (LCP) sin fetchpriority="high"`);
          assert.doesNotMatch(c.img, /loading="lazy"/, `${nombre}: el primer cuadro (LCP) con loading="lazy"`);
        } else {
          assert.match(c.img, /loading="lazy"/, `${nombre}: cuadro ${i + 1} sin loading="lazy"`);
          assert.doesNotMatch(c.img, /fetchpriority/, `${nombre}: cuadro ${i + 1} compite con la LCP`);
        }
      });
    });
  }
});

test('las páginas con galería cargan js/galeria.js y su hoja una sola vez; las demás no', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const tiene = galeriasDe(html).length > 0;
    const js = (html.match(/<script defer src="\/js\/galeria\.js\?v=\d+"><\/script>/g) || []).length;
    const hoja = (html.match(/<link rel="stylesheet" href="\/css\/galeria-componente\.css\?v=\d+">/g) || []).length;
    assert.strictEqual(js, tiene ? 1 : 0, `${nombre}: js/galeria.js cargado ${js} veces`);
    assert.strictEqual(hoja, tiene ? 1 : 0, `${nombre}: css/galeria-componente.css cargada ${hoja} veces`);
  }
});

// js/galeria.js arma los controles: si el marcado que espera cambia, se
// rompen en silencio. Se vigilan las piezas que el diseño exige.
test('js/galeria.js arma botones nativos con nombre, el diálogo y mide el uso', () => {
  const js = leer('js/galeria.js');
  assert.match(js, /el\('button'/, 'los controles no son <button>');
  assert.match(js, /setAttribute\('aria-label'/, 'los controles no llevan aria-label');
  assert.match(js, /setAttribute\('aria-current', 'true'\)/, 'la miniatura actual no lleva aria-current');
  assert.match(js, /\.showModal\(\)/, 'la foto ampliada no usa <dialog> modal');
  assert.match(js, /addEventListener\('close'[\s\S]*?\.focus\(\)/, 'el foco no vuelve al cerrar el diálogo');
  assert.match(js, /prefers-reduced-motion: reduce/, 'no respeta el movimiento reducido');
  for (const k of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) assert.ok(js.includes(k), `falta la tecla ${k}`);
  assert.match(js, /gtag\('event', 'galeria'/, 'no mide el uso (evento galeria)');
  for (const accion of ['miniatura', 'siguiente', 'anterior', 'ampliar']) {
    assert.ok(js.includes(`'${accion}'`), `el evento galeria no distingue «${accion}»`);
  }
  // Los textos de los controles, en los tres idiomas (4-textos.md §2.3).
  for (const t of ['Foto anterior', 'Foto siguiente', 'Ampliar', 'Cerrar', 'Previous photo', 'Next photo',
    'Enlarge', 'Close', 'Próxima foto', 'Fechar']) assert.ok(js.includes(`'${t}'`), `falta el texto «${t}»`);
  assert.doesNotMatch(js, /carrusel|carousel/i, 'la palabra «carrusel» no va en ninguna etiqueta');
});

// WCAG 2.2.2 (nivel A): lo que se mueve solo más de 5 s necesita un control
// para pausarlo. Hasta el 05/11/2026 el sitio tenía una rotación por CSS
// (rotarFotos, 3,4 s por foto, sin pausa) que ninguna tarjeta usaba; se borró.
// Esta guardia corta cualquier imagen que se mueva sola. Si algún día una
// tira que solo ambienta tiene que rotar (Lautaro, 05/11: «autoplay looks good
// sometimes»), se construye en js/galeria.js con: botón de pausa visible,
// 5–7 s por foto, freno con el mouse y con el foco, nada en teléfonos ni con
// movimiento reducido (3b-diseno-sitio.md, nota del 05/11 sobre el carrusel),
// y esta guardia se cambia para exigir ese control, no para saltearlo.
test('ninguna imagen se mueve sola sin un control para pausarla', () => {
  for (const hoja of fs.readdirSync(path.join(raiz, 'css'))) {
    const css = leer(`css/${hoja}`);
    assert.doesNotMatch(css, /animation[^;{}]*infinite/, `css/${hoja}: animación infinita`);
    assert.doesNotMatch(css, /rotarFotos|\.slideshow/, `css/${hoja}: volvió la rotación de fotos`);
    for (const [, selector, cuerpo] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/\b(img|picture|figure)\b|galeria/.test(selector)) {
        assert.doesNotMatch(cuerpo, /(?:^|;)\s*animation(?:-name)?\s*:\s*(?!none)/,
          `css/${hoja}: ${selector.trim()} anima fotos`);
      }
    }
  }
  for (const archivo of fs.readdirSync(path.join(raiz, 'js'))) {
    const js = leer(`js/${archivo}`);
    assert.doesNotMatch(js, /setInterval/, `js/${archivo}: setInterval`);
    if (archivo === 'galeria.js') {
      assert.doesNotMatch(js, /setTimeout|requestAnimationFrame\([^)]*ir\(/, 'js/galeria.js cambia de foto con un temporizador');
    }
  }
  for (const [nombre, html] of Object.entries(paginas)) {
    const limpio = sinComentarios(html);
    assert.doesNotMatch(limpio, /<(?:img|video|picture|source)\b[^>]*\sautoplay\b/i, `${nombre}: autoplay`);
    assert.doesNotMatch(limpio, /data-autoplay|<marquee/i, `${nombre}: algo rota sin control de pausa`);
    assert.doesNotMatch(limpio, /class="slideshow/, `${nombre}: volvió el slideshow`);
  }
});

/* ---- techos de fotos por tipo de página (3b §1.2, ítem 2A del 05/11) ----
   Se cuentan las fotos de contenido (sin logos). El encabezado cuenta. */
const fotosDe = (html) => [...sinComentarios(html).matchAll(/<img\s[^>]*>/g)]
  .map((m) => m[0]).filter((img) => !/assets\/logo-/.test(img));
const cuerpoDe = (html) => sinComentarios(html).match(/<body([^>]*)>/)?.[1] || '';
const HUBS_TURISMO = ['turismo.html', 'en/tours-and-transfers.html', 'pt/passeios-e-traslados.html'];
const HUBS_EMPRESAS = ['empresas-y-mineria.html', 'en/business-and-mining.html'];
const PORTADAS = ['index.html', 'en/index.html', 'pt/index.html'];
// Excepciones fechadas: el techo vale, pero hoy no se cumple por algo que
// resuelve la biblioteca de fotos. Sólo pueden bajar.
const EXCEPCIONES = {
  // 12 fotos del torneo con caras: esperan el permiso de las personas
  // (3b §1.2, fila «páginas de eventos con personas»; fase 2).
  'golf-torneos.html': 12,
};

function techoDe(nombre, html) {
  if (EXCEPCIONES[nombre] !== undefined) return EXCEPCIONES[nombre];
  if (PORTADAS.includes(nombre)) return 5;              // héroe, 3 puertas, Nosotros
  if (HUBS_TURISMO.includes(nombre)) return 7;          // héroe + una por circuito
  if (HUBS_EMPRESAS.includes(nombre)) return 7;         // héroe + hasta 6 miniaturas
  if (nombre === 'galeria.html') return 6 * 5;          // flota: ≤5 por tipo, ≤6 tipos
  if (nombre === 'flota-en-venta.html') return Infinity; // avisos de venta, su generador
  if (/data-seccion="(?:turismo|empresas)"/.test(cuerpoDe(html))) return 6; // héroe + galería de ≤5
  return 0;
}

test('ninguna página pasa el techo de fotos de su tipo', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const n = fotosDe(html).length;
    const techo = techoDe(nombre, html);
    assert.ok(n <= techo, `${nombre}: ${n} fotos, el techo de su tipo es ${techo}`);
  }
});

test('las excepciones fechadas sólo bajan: cuando una página cumple, sale de la lista', () => {
  for (const [nombre, techo] of Object.entries(EXCEPCIONES)) {
    assert.strictEqual(fotosDe(paginas[nombre]).length, techo,
      `${nombre}: tiene ${fotosDe(paginas[nombre]).length} fotos y la excepción dice ${techo}; ajustarla o sacarla`);
  }
});

/* ---- página de flota ---- */
const flota = sinComentarios(paginas['galeria.html']);

test('la página de flota tiene hasta 5 fotos por tipo y ningún tipo con galería de relleno', () => {
  const tipos = [...flota.matchAll(/<section class="flota-tipo[^"]*" id="([^"]+)"[\s\S]*?\n  <\/section>/g)];
  assert.ok(tipos.length >= 1 && tipos.length <= 6, `${tipos.length} tipos (máximo 6)`);
  for (const [bloque, id] of tipos) {
    const n = fotosDe(bloque).length;
    assert.ok(n <= 5, `#${id}: ${n} fotos (máximo 5 por tipo)`);
    assert.doesNotMatch(texto(bloque), /pr[oó]ximamente|muy pronto|en breve/i, `#${id}: promete fotos con fecha`);
  }
});

// Los nombres, el orden y el texto de cada tipo salen de la tabla «Qué
// podemos mover» de la portada (index.html #flota), así la fila y sus fotos
// se llaman igual. Si la tabla cambia, esta página tiene que acompañarla.
test('la página de flota sigue los nombres, el orden y el texto de la tabla de la portada', () => {
  const tabla = sinComentarios(index).match(/<section class="block alt" id="flota">[\s\S]*?<\/table>/)[0];
  const filas = [...tabla.matchAll(/<tr><th scope="row">([^<]+)<\/th><td>([^<]+)<\/td><\/tr>/g)]
    .map(([, tipo, para]) => ({ tipo, para }))
    .filter((f) => f.tipo !== 'Comunicación');
  const bloques = [...flota.matchAll(/<h2 id="t-[^"]+">([^<]+)<\/h2>\s*<p>([^<]+)<\/p>/g)]
    .map(([, h2, p]) => ({ h2, p }));
  // Taller y depósito van juntos en un bloque, con las dos filas en su texto.
  const esperados = [];
  for (const f of filas) {
    if (f.tipo === 'Taller propio' || f.tipo === 'Depósito con cámara frigorífica') continue;
    esperados.push({ h2: f.tipo, p: f.para });
  }
  assert.deepStrictEqual(bloques.slice(0, esperados.length), esperados, 'nombres, orden o texto distintos de la tabla');
  const taller = bloques[esperados.length];
  assert.ok(taller && taller.h2 === 'Taller y depósito', 'falta el bloque «Taller y depósito» al final');
  const minus = (t) => t.toLowerCase();
  for (const f of filas.filter((x) => /Taller propio|Depósito con cámara/.test(x.tipo))) {
    assert.ok(minus(taller.p).includes(minus(`${f.tipo}: ${f.para}`)), `«Taller y depósito» no dice «${f.tipo}: ${f.para}»`);
  }
});
