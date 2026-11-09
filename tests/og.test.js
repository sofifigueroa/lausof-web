// La imagen para compartir (scripts/og.mjs, ronda 4 de lausof.com, 08/11/2026).
// Hasta esa fecha 48 páginas compartían og-portada.jpg, con la grúa vendida y
// el camión rotulado «AUXILIO», y su texto alternativo estaba escrito de 9
// maneras (rondas-2026-11-07/2-estado-actual.md, W13).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas } = require('./util.js');

const guion = import('../scripts/og.mjs');

test('cada página está al día con scripts/og.mjs (correr node scripts/og.mjs)', async () => {
  const { conOg, problemasDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(conOg(html, nombre) === html, `${nombre}: la og:image no está al día`);
  }
});

test('la imagen compartida: un archivo JPEG de 1200×630 y un texto alternativo por idioma', async () => {
  const { OG_COMPARTIDA, usaCompartida } = await guion;
  const archivo = path.join(__dirname, '..', 'assets', OG_COMPARTIDA.archivo);
  const bytes = fs.readFileSync(archivo);
  assert.strictEqual(bytes.readUInt16BE(0), 0xffd8, 'no es JPEG');
  // Tamaño en el marcador SOF (0xFFC0 base, 0xFFC2 progresivo).
  let i = 2; let medida = null;
  while (i < bytes.length) {
    const marca = bytes.readUInt16BE(i);
    if (marca === 0xffc0 || marca === 0xffc2) { medida = [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)]; break; }
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  assert.deepStrictEqual(medida, [1200, 630]);
  const alts = { es: new Set(), en: new Set(), pt: new Set() };
  let n = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    if (!usaCompartida(html)) continue;
    n++;
    const idioma = nombre.startsWith('en/') ? 'en' : nombre.startsWith('pt/') ? 'pt' : 'es';
    alts[idioma].add(html.match(/<meta property="og:image:alt" content="([^"]*)">/)[1]);
    assert.ok(html.includes('<meta property="og:image:width" content="1200">') && html.includes('<meta property="og:image:height" content="630">'), `${nombre}: sin medidas`);
  }
  assert.ok(n >= 48, `se esperaban al menos 48 páginas con la imagen compartida, hay ${n}`);
  for (const [idioma, set] of Object.entries(alts)) assert.deepStrictEqual([...set], [OG_COMPARTIDA.alt[idioma]], idioma);
});

test('conOg reemplaza la imagen retirada, en la meta y en el JSON-LD, y no toca las propias', async () => {
  const { conOg, OG_COMPARTIDA } = await guion;
  const vieja = '<meta property="og:image" content="https://www.lausof.com/assets/og-portada.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="Camiones">\n<script type="application/ld+json">{"image":["https://www.lausof.com/assets/og-portada.jpg"]}</script>';
  const nueva = conOg(vieja, 'en/x.html');
  assert.ok(nueva.includes(`assets/${OG_COMPARTIDA.archivo}">`));
  assert.ok(nueva.includes(`["https://www.lausof.com/assets/${OG_COMPARTIDA.archivo}"]`));
  assert.ok(nueva.includes(`content="${OG_COMPARTIDA.alt.en}"`));
  assert.strictEqual(conOg(nueva, 'en/x.html'), nueva, 'no es idempotente');
  const propia = '<meta property="og:image" content="https://www.lausof.com/assets/og-mineria.jpg">\n<meta property="og:image:alt" content="Minería">';
  assert.strictEqual(conOg(propia, 'x.html'), propia);
});

// Una imagen retirada no queda en assets/: si quedara, la exportación de
// producción la subiría y se podría abrir por URL (auditoría de v10, N4).
test('las imágenes retiradas no están en el repo, así que no se publican', async () => {
  const { OG_RETIRADAS } = await guion;
  for (const archivo of OG_RETIRADAS) {
    assert.ok(!fs.existsSync(path.join(__dirname, '..', 'assets', archivo)), `assets/${archivo} sigue en el repo`);
  }
});
