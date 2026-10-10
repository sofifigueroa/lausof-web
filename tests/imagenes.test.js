// Fotos del sitio: medidas, alt, archivos que existen y el pipeline de
// scripts/imagenes.mjs (AVIF + WebP en varios anchos dentro de <picture>).
// Lo que se vigila acá es lo que, si se rompe, no se nota a simple vista:
// un salto de layout por un <img> sin medidas, una variante que no existe
// (el navegador cae al original y se pierde el ahorro, o muestra un hueco),
// la LCP con lazy-loading, o una página que quedó sin regenerar.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const pipeline = import('../scripts/imagenes.mjs');

// Ruta en disco de una URL de la página (relativa a la página, absoluta del
// sitio, o con el dominio delante como en og:image).
function archivoDe(url, pagina) {
  const limpia = url.replace(/^https:\/\/www\.lausof\.com/, '').replace(/[?#].*$/, '');
  return limpia.startsWith('/') ? path.join(raiz, limpia) : path.join(raiz, path.dirname(pagina), limpia);
}

const attr = (etiqueta, nombre) => etiqueta.match(new RegExp(`\\s${nombre}="([^"]*)"`))?.[1];

// Ancho y alto reales: .webp por su encabezado, .avif por la caja 'ispe'.
function medidas(archivo) {
  const b = fs.readFileSync(archivo);
  if (archivo.endsWith('.avif')) {
    const i = b.indexOf('ispe');
    assert.ok(i > 0, `${archivo}: AVIF sin caja ispe`);
    return { ancho: b.readUInt32BE(i + 8), alto: b.readUInt32BE(i + 12) };
  }
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { ancho: 1 + b.readUIntLE(24, 3), alto: 1 + b.readUIntLE(27, 3) };
  if (fourcc === 'VP8 ') return { ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff };
  if (fourcc === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { ancho: 1 + (bits & 0x3fff), alto: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`${archivo}: no sé leer sus medidas`);
}

const imgsDe = (html) => [...sinComentarios(html).matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);

test('todo <img> declara width, height y alt', () => {
  for (const [pagina, html] of Object.entries(paginas)) {
    for (const img of imgsDe(html)) {
      assert.match(img, /\swidth="\d+"/, `${pagina}: <img> sin width (salto de layout): ${img.slice(0, 90)}`);
      assert.match(img, /\sheight="\d+"/, `${pagina}: <img> sin height (salto de layout): ${img.slice(0, 90)}`);
      assert.ok(attr(img, 'alt') !== undefined, `${pagina}: <img> sin alt: ${img.slice(0, 90)}`);
    }
  }
});

test('width/height de cada foto respetan la proporción del archivo real', () => {
  for (const [pagina, html] of Object.entries(paginas)) {
    for (const img of imgsDe(html)) {
      const src = attr(img, 'src');
      if (!/\.webp$/.test(src)) continue;
      const real = medidas(archivoDe(src, pagina));
      const declarada = Number(attr(img, 'width')) / Number(attr(img, 'height'));
      assert.ok(Math.abs(declarada - real.ancho / real.alto) < 0.01,
        `${pagina}: ${src} declara ${attr(img, 'width')}×${attr(img, 'height')} y el archivo es ${real.ancho}×${real.alto}`);
    }
  }
});

test('todo archivo de assets/ que nombran las páginas y las hojas existe', () => {
  const faltan = [];
  for (const [pagina, html] of Object.entries(paginas)) {
    // src, srcset (de <img> y <source>), data-movil, href de iconos, og:image…
    for (const [, url] of sinComentarios(html).matchAll(/((?:https:\/\/www\.lausof\.com)?\/?assets\/[^"'\s,)]+)/g)) {
      if (!fs.existsSync(archivoDe(url, pagina))) faltan.push(`${pagina} → ${url}`);
    }
  }
  for (const hoja of fs.readdirSync(path.join(raiz, 'css'))) {
    const css = fs.readFileSync(path.join(raiz, 'css', hoja), 'utf8');
    for (const [, url] of css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g)) {
      if (url.startsWith('data:')) continue;
      if (!fs.existsSync(path.join(raiz, 'css', url))) faltan.push(`css/${hoja} → ${url}`);
    }
  }
  assert.deepStrictEqual(faltan, [], `archivos inexistentes:\n${faltan.join('\n')}`);
});

test('cada srcset declara el ancho real de cada archivo', () => {
  const vistos = new Set();
  for (const [pagina, html] of Object.entries(paginas)) {
    for (const [, srcset] of sinComentarios(html).matchAll(/\ssrcset="([^"]*)"/g)) {
      for (const parte of srcset.split(',')) {
        const [url, descriptor] = parte.trim().split(/\s+/);
        const archivo = archivoDe(url, pagina);
        if (vistos.has(archivo + descriptor)) continue;
        vistos.add(archivo + descriptor);
        assert.match(descriptor, /^\d+w$/, `${pagina}: ${url} sin descriptor de ancho`);
        assert.strictEqual(`${medidas(archivo).ancho}w`, descriptor,
          `${pagina}: ${url} figura como ${descriptor} y mide ${medidas(archivo).ancho}px`);
      }
    }
  }
});

test('toda foto va en <picture> con AVIF, srcset y sizes', () => {
  for (const [pagina, html] of Object.entries(paginas)) {
    const limpio = sinComentarios(html);
    const sueltos = limpio.replace(/<picture>[\s\S]*?<\/picture>/g, '');
    for (const img of imgsDe(sueltos)) {
      assert.ok(!/assets\/.+\.webp$/.test(attr(img, 'src')),
        `${pagina}: foto fuera de <picture> (correr node scripts/imagenes.mjs): ${img.slice(0, 90)}`);
    }
    for (const [picture] of limpio.matchAll(/<picture>[\s\S]*?<\/picture>/g)) {
      assert.match(picture, /<source type="image\/avif" srcset="[^"]+" sizes="[^"]+">/, `${pagina}: <picture> sin AVIF`);
      const img = picture.match(/<img\s[^>]*>/)[0];
      assert.ok(attr(img, 'srcset'), `${pagina}: <img> sin srcset: ${img.slice(0, 90)}`);
      assert.ok(attr(img, 'sizes'), `${pagina}: <img> sin sizes: ${img.slice(0, 90)}`);
    }
  }
});

test('las páginas están sincronizadas con scripts/imagenes.mjs', async () => {
  const { procesarHtml } = await pipeline;
  for (const [pagina, html] of Object.entries(paginas)) {
    assert.strictEqual(procesarHtml(html, pagina), html,
      `${pagina} quedó desactualizada: correr \`node scripts/imagenes.mjs\``);
  }
});

// LCP: la foto del hero/encabezado es la única con fetchpriority="high" y
// nunca lleva lazy-loading. Todo lo demás (menos el logo del menú, que está
// arriba de todo y pesa poco) carga diferido y decodifica sin bloquear.
test('la LCP se pide con prioridad y el resto de las fotos va diferido', () => {
  for (const [pagina, html] of Object.entries(paginas)) {
    const limpio = sinComentarios(html);
    const hero = limpio.match(/<div class="(?:hero-photo|page-head-photo)(?: [a-z0-9-]+)*" role="presentation">([\s\S]*?)<\/div>/);
    const prioritarias = imgsDe(limpio).filter((img) => /fetchpriority="high"/.test(img));
    if (hero) {
      const img = hero[1].match(/<img\s[^>]*>/);
      assert.ok(img, `${pagina}: el encabezado se quedó sin su foto`);
      assert.match(img[0], /fetchpriority="high"/, `${pagina}: la foto del encabezado (LCP) sin fetchpriority="high"`);
      assert.doesNotMatch(img[0], /loading="lazy"/, `${pagina}: la LCP no puede llevar loading="lazy"`);
      assert.strictEqual(prioritarias.length, 1, `${pagina}: más de una foto con fetchpriority="high"`);
    } else {
      assert.strictEqual(prioritarias.length, 0, `${pagina}: fetchpriority="high" sin encabezado con foto`);
    }
    const sinLogo = limpio.replace(/<a class="brand"[\s\S]*?<\/a>/, '');
    for (const img of imgsDe(sinLogo)) {
      if (/fetchpriority="high"/.test(img)) continue;
      assert.match(img, /loading="lazy"/, `${pagina}: foto debajo del pliegue sin loading="lazy": ${img.slice(0, 90)}`);
      assert.match(img, /decoding="async"/, `${pagina}: foto sin decoding="async": ${img.slice(0, 90)}`);
    }
  }
});

// Con la foto en el HTML, una precarga no adelanta nada y, como no sabe qué
// formato ni qué ancho va a elegir el <picture>, termina bajando la foto dos
// veces.
test('ninguna página precarga imágenes', () => {
  for (const [pagina, html] of Object.entries(paginas)) {
    assert.doesNotMatch(sinComentarios(html), /<link rel="preload" as="image"/,
      `${pagina}: precarga de imagen (la LCP ya está en el HTML)`);
  }
});

test('los encabezados con foto no la vuelven a pedir como fondo de la CSS', () => {
  for (const hoja of fs.readdirSync(path.join(raiz, 'css'))) {
    const css = fs.readFileSync(path.join(raiz, 'css', hoja), 'utf8');
    for (const [regla] of css.matchAll(/\.(?:hero|page-head)-photo(?:\.[a-z0-9-]+)*\{[^}]*\}/g)) {
      assert.doesNotMatch(regla, /url\(/, `css/${hoja}: ${regla.slice(0, 80)} vuelve a usar la foto de fondo`);
    }
  }
});
