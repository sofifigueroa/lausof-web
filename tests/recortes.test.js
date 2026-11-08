// Recortes de teléfono del encabezado (scripts/recortes.mjs y
// scripts/recortes-medir.mjs, ronda 7 de lausof.com, 08/11/2026). En un
// teléfono se ve sólo la franja central de la foto del encabezado, que es la
// LCP de cada página interna; el recorte es esa franja y baja menos bytes
// (charter-recitales: LCP simulada 3302 → 2103 ms). Lo que vigila este archivo:
// que las páginas estén al día con los datos, que cada recorte exista con la
// medida pedida y que las reglas del cálculo no se muevan sin querer. Que el
// recorte cubra la caja dibujada lo mira el control en navegador.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const guion = import('../scripts/recortes.mjs');
const medir = import('../scripts/recortes-medir.mjs');
const datos = import('../scripts/recortes-datos.mjs');
const attr = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`))?.[1];

const IMG = '<img src="/assets/x.webp" srcset="/assets/x-400w.webp 400w" alt="" width="1600" height="1067" sizes="(max-width: 720px) 755px, 100vw" fetchpriority="high">';
const encabezado = (img) => `<section class="page-head"><div class="page-head-photo" role="presentation"><picture><source type="image/avif" srcset="/assets/x.avif 1600w">${img}</picture></div></section>`;

test('cada página está al día con scripts/recortes.mjs (correr recortes y después imagenes)', async () => {
  const { conRecorte, pedidos } = await guion;
  const pedido = pedidos();
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.strictEqual(conRecorte(html, nombre, pedido[nombre]), html, `${nombre} no está al día`);
  }
});

test('cada recorte existe, con todo el alto de su foto y el ancho de los datos', async () => {
  const { estadoRecortes } = await guion;
  const { faltan, distintos } = estadoRecortes();
  assert.deepStrictEqual(faltan.map((r) => r.foto), []);
  assert.deepStrictEqual(distintos, []);
});

test('las páginas con recorte son las de los datos, y el recorte ahorra al menos 15 %', async () => {
  const { RECORTES, FUERA, MEDIA } = await datos;
  const conDatos = new Set(RECORTES.flatMap((r) => Object.keys(r.paginas)));
  for (const [nombre, html] of Object.entries(paginas)) {
    const img = sinComentarios(html).match(/<div class="page-head-photo"[^>]*>(?:(?!<\/div>)[\s\S])*?(<img\s[^>]*>)/)?.[1];
    const tiene = !!(img && attr(img, 'data-movil-media'));
    assert.strictEqual(tiene, conDatos.has(nombre), `${nombre}: recorte ${tiene ? 'sin datos' : 'que falta'}`);
    if (tiene) {
      assert.strictEqual(attr(img, 'data-movil-media'), MEDIA, `${nombre}: otro corte de pantalla`);
      assert.match(attr(img, 'data-movil-sizes'), /^\(max-width: 360px\) \d+px, \(max-width: 400px\) \d+px, \d+px$/, `${nombre}: sizes del recorte`);
      // Las fuentes del recorte llevan su propio sizes y la escalera con 800.
      const fuente = html.match(new RegExp(`<source media="${MEDIA.replace(/[()]/g, '\\$&')}" type="image/avif"[^>]*>`))?.[0];
      assert.ok(fuente && attr(fuente, 'sizes') === attr(img, 'data-movil-sizes'), `${nombre}: la fuente AVIF del recorte no usa su sizes`);
    }
  }
  for (const r of RECORTES) assert.ok(r.ancho <= r.natural[0] * 0.85, `${r.foto}: el recorte no ahorra 15 %`);
  // Ninguna página queda a la vez dentro y fuera.
  for (const f of FUERA) assert.ok(!conDatos.has(f.pagina), `${f.pagina} está en RECORTES y en FUERA`);
});

test('conRecorte pone los tres atributos antes de alt, los cambia y los saca', async () => {
  const { conRecorte } = await guion;
  const { MEDIA } = await datos;
  const pedido = { foto: '/assets/x.webp', movil: '/assets/x-movil.webp', sizes: '(max-width: 360px) 500px, (max-width: 400px) 480px, 460px' };
  const con = conRecorte(encabezado(IMG), 'p.html', pedido);
  const img = con.match(/<img\s[^>]*>/)[0];
  assert.match(img, new RegExp(`srcset="[^"]*" data-movil="/assets/x-movil.webp" data-movil-media="${MEDIA.replace(/[()]/g, '\\$&')}" data-movil-sizes="[^"]*" alt=""`));
  assert.strictEqual(conRecorte(con, 'p.html', pedido), con, 'no es idempotente');
  const otro = conRecorte(con, 'p.html', { ...pedido, sizes: '(max-width: 360px) 1px, (max-width: 400px) 1px, 1px' });
  assert.strictEqual((otro.match(/data-movil-sizes/g) || []).length, 1);
  assert.strictEqual(conRecorte(con, 'p.html', undefined), encabezado(IMG), 'sin pedido no saca el recorte');
  assert.throws(() => conRecorte(encabezado(IMG), 'p.html', { ...pedido, foto: '/assets/otra.webp' }), /volver a medir/);
  assert.throws(() => conRecorte('<main></main>', 'p.html', pedido), /no tiene foto de encabezado/);
});

test('calcular: ancho por la caja más ancha con holgura, 85 %, fijos, fotos repetidas y tramos de sizes', async () => {
  const { calcular, repiteFoto } = await medir;
  const { MARGEN } = await datos;
  const cajas = (pares) => pares.map(([ancho, w, h]) => ({ ancho, letra: 'sitio', w, h }));
  const medidas = {
    'a.html': { foto: '/assets/a.webp', cajas: cajas([[320, 320, 500], [390, 390, 470], [440, 440, 470]]) },
    'b.html': { foto: '/assets/a.webp', cajas: cajas([[320, 320, 640], [440, 440, 600]]) },
    'c.html': { foto: '/assets/c.webp', cajas: cajas([[440, 440, 300]]) },
    'd.html': { foto: '/assets/a.webp', cajas: cajas([[440, 440, 470]]), repite: true },
  };
  const { recortes, fuera } = calcular(medidas, { '/assets/a.webp': [1600, 1067], '/assets/c.webp': [1600, 1067] });
  assert.strictEqual(recortes.length, 1);
  const [r] = recortes;
  // La caja más ancha en proporción es 440×470 (0,936): 1067 × 0,936 × MARGEN, par hacia arriba.
  assert.strictEqual(r.ancho, 2 * Math.ceil((1067 * (440 / 470) * MARGEN) / 2));
  assert.deepStrictEqual(Object.keys(r.paginas), ['a.html', 'b.html']);
  // a.html a 320: la caja 320×500 dibuja el recorte a 500 × ancho/1067.
  assert.strictEqual(r.paginas['a.html'].sizes, `(max-width: 360px) ${Math.ceil((500 * r.ancho) / 1067)}px, (max-width: 400px) ${Math.ceil((470 * r.ancho) / 1067)}px, ${Math.ceil((470 * r.ancho) / 1067)}px`);
  assert.deepStrictEqual(fuera.map((f) => f.pagina).sort(), ['c.html', 'd.html']);
  assert.match(fuera.find((f) => f.pagina === 'c.html').motivo, /menos del 15 %/);
  assert.match(fuera.find((f) => f.pagina === 'd.html').motivo, /repite la foto/);
  assert.ok(repiteFoto('<div class="page-head-photo"><picture><img src="/assets/a.webp"></picture></div><img src="/assets/a-400w.avif">', '/assets/a.webp'));
  assert.ok(!repiteFoto('<div class="page-head-photo"><picture><img src="/assets/a.webp"></picture></div><img src="/assets/ab.webp">', '/assets/a.webp'));
});

test('los recortes de los datos existen en disco al lado de su foto', async () => {
  const { RECORTES } = await datos;
  const { movilDe } = await guion;
  for (const r of RECORTES) assert.ok(fs.existsSync(path.join(raiz, movilDe(r.foto))), `falta ${movilDe(r.foto)}`);
});
