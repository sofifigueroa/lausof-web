// Fotos de la biblioteca «Fotos para mostrar» (lote 1, 06/11/2026). Diseño:
// web/imagenes-2026-11-05/3a-diseno-biblioteca.md §5 (manifiesto y guardia) y
// 3b-diseno-sitio.md §1.1 (regla de tamaño por lugar). Todo lo que está en
// assets/fotos/ es una foto que Lautaro aprobó: la guardia corta cualquier
// archivo o página que use una foto fuera de assets/fotos/biblioteca.json, y
// cualquier archivo cuyos bytes cambien sin cambiar de nombre (/assets/* se
// sirve immutable por un año, así que el que ya la bajó no vería el cambio).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { paginas, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const dir = path.join(raiz, 'assets', 'fotos');
const manifiesto = JSON.parse(fs.readFileSync(path.join(dir, 'biblioteca.json'), 'utf8'));
const fotos = manifiesto.fotos;
const porSrc = new Map(fotos.map((f) => [`/assets/fotos/${f.archivo}`, f]));
const sha = (archivo) => crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex');

// Una foto de la biblioteca en una página: el src de su <img> (las variantes
// del srcset salen de ese archivo).
const usosDe = (html) => [...sinComentarios(html).matchAll(/<img\s[^>]*src="(\/assets\/fotos\/[^"]+)"/g)].map((m) => m[1]);

test('el manifiesto tiene sólo fotos aprobadas, con id único y campos públicos', () => {
  const ids = new Set();
  const rechazadas = new Set(manifiesto.rechazadas.map((r) => r.id));
  for (const f of fotos) {
    assert.match(f.id, /^F\d{4}$/, `${f.archivo}: id`);
    assert.ok(!ids.has(f.id), `${f.id} repetida`);
    ids.add(f.id);
    assert.ok(!rechazadas.has(f.id), `${f.id} está rechazada y no puede ir al sitio`);
    assert.ok(f.alt_es && f.credito && f.lote && f.aprobada, `${f.id}: faltan alt_es, crédito, lote o fecha`);
    assert.match(f.archivo, /^[a-z0-9-]+\/[a-z0-9-]+-lausof-v\d+\.webp$/, `${f.id}: el nombre lleva categoría, «-lausof» y versión (-vN)`);
    // Nada privado en el manifiesto público (3a §6): ni patentes ni GPS.
    for (const prohibido of ['patente', 'gps', 'consentimiento', 'carpeta', 'sha_origen']) {
      assert.ok(!Object.keys(f).some((k) => k.toLowerCase().includes(prohibido)), `${f.id}: campo privado «${prohibido}»`);
    }
  }
});

test('cada foto del manifiesto existe y sus bytes no cambiaron desde que se aprobó', () => {
  for (const f of fotos) {
    const webp = path.join(dir, f.archivo);
    assert.ok(fs.existsSync(webp), `${f.archivo} no existe`);
    assert.ok(fs.existsSync(webp.replace(/\.webp$/, '.jpg')), `${f.archivo}: falta el máster .jpg`);
    assert.strictEqual(sha(webp), f.sha256,
      `${f.archivo} cambió de bytes con el mismo nombre: una foto que cambia, cambia de nombre (-v${Number(f.archivo.match(/-v(\d+)\.webp$/)[1]) + 1})`);
  }
});

test('en assets/fotos/ no hay ningún archivo fuera del manifiesto', () => {
  const bases = new Set(fotos.map((f) => f.archivo.replace(/\.webp$/, '')));
  for (const cat of fs.readdirSync(dir)) {
    const sub = path.join(dir, cat);
    if (!fs.statSync(sub).isDirectory()) {
      assert.strictEqual(cat, 'biblioteca.json', `assets/fotos/${cat}: suelto, fuera de una categoría`);
      continue;
    }
    for (const archivo of fs.readdirSync(sub)) {
      // Variantes de una foto aprobada: sus anchos (-400w…) y el recorte de
      // teléfono del encabezado (-movil, scripts/recortes.mjs, ronda 7), que
      // sale del mismo .webp publicado.
      const base = `${cat}/${archivo}`.replace(/(?:-movil(?:-v\d+)?)?(?:-\d+w)?\.(?:webp|avif|jpg)$/, '');
      assert.ok(bases.has(base), `assets/fotos/${cat}/${archivo} no es una foto aprobada (falta en biblioteca.json)`);
    }
  }
});

test('las páginas usan sólo fotos del manifiesto y el manifiesto dice dónde está cada una', () => {
  const usos = new Map(fotos.map((f) => [f.id, []]));
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.doesNotMatch(sinComentarios(html), /\/assets\/fotos\/(?![a-z0-9-]+\/[a-z0-9-]+-lausof-v\d+(?:-movil(?:-v\d+)?)?(?:-\d+w)?\.(?:webp|avif)[\s",])/,
      `${nombre}: pide de assets/fotos/ algo que no es una foto ni una variante`);
    for (const src of usosDe(html)) {
      const f = porSrc.get(src);
      assert.ok(f, `${nombre}: ${src} no está en assets/fotos/biblioteca.json`);
      if (!usos.get(f.id).includes(nombre)) usos.get(f.id).push(nombre);
    }
  }
  for (const f of fotos) {
    assert.deepStrictEqual([...f.usos].sort(), usos.get(f.id).sort(), `${f.id} (${f.archivo}): «usos» no coincide con las páginas`);
  }
});

// 3b §1.1 r6: ninguna foto nueva va en un encabezado a todo el ancho por
// debajo de 1600 px (se vería estirada a 1440). Sin foto que cumpla, el
// encabezado queda sin foto.
test('una foto de la biblioteca en un encabezado mide al menos 1600 px de ancho', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const cabeza = sinComentarios(html).match(/<div class="page-head-photo[^"]*" role="presentation">([\s\S]*?)<\/div>/);
    if (!cabeza) continue;
    for (const src of usosDe(cabeza[1])) {
      const f = porSrc.get(src);
      assert.ok(f && f.ancho >= 1600, `${nombre}: el encabezado usa ${src}, de ${f && f.ancho} px (mínimo 1600)`);
      assert.ok(f.ancho > f.alto, `${nombre}: el encabezado usa una foto vertical (${src})`);
    }
  }
});
