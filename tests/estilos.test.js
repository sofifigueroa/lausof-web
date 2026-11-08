// Las hojas de estilo y sus versiones (ronda 2 de lausof.com, 08/11/2026):
//  · el ?v= de cada hoja y script es el hash del archivo (scripts/versiones.mjs);
//    hasta el 07/11/2026 se subía a mano en 82 páginas (2-estado-actual.md, W7);
//  · el encabezado de página y las preguntas frecuentes viven sólo en
//    styles.css (antes copiados en 14 y 13 hojas, W3, W6);
//  · los cortes de pantalla son los de la lista de styles.css (antes 13, W10);
//  · el script del botón de la barra de arriba es un archivo, no código en
//    línea (W8).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas } = require('./util.js');

const raiz = path.join(__dirname, '..');
const hojas = fs.readdirSync(path.join(raiz, 'css')).filter((n) => n.endsWith('.css'));
const leerHoja = (n) => fs.readFileSync(path.join(raiz, 'css', n), 'utf8');
const sinComentariosCss = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

test('cada página está al día con scripts/versiones.mjs (correr node scripts/versiones.mjs)', async () => {
  const { conVersiones, referenciasDe, version } = await import('../scripts/versiones.mjs');
  let n = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.ok(conVersiones(html) === html, `${nombre}: algún ?v= no es el hash de su archivo`);
    for (const { ruta, v } of referenciasDe(html)) {
      n += 1;
      assert.strictEqual(v, version(ruta), `${nombre}: ${ruta}?v=${v}`);
    }
  }
  assert.ok(n > 300, `sólo ${n} referencias a hojas y scripts`);
});

test('el ?v= cambia cuando cambia el archivo y no cuando no cambia', async (t) => {
  const { version } = await import('../scripts/versiones.mjs');
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'versiones-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  fs.mkdirSync(path.join(tmp, 'css'));
  fs.writeFileSync(path.join(tmp, 'css', 'a.css'), 'a{color:red}');
  const v1 = version('css/a.css', tmp);
  assert.match(v1, /^[0-9a-f]{10}$/);
  fs.mkdirSync(path.join(tmp, 'otra', 'css'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'otra', 'css', 'a.css'), 'a{color:blue}');
  assert.notStrictEqual(version('css/a.css', path.join(tmp, 'otra')), v1);
});

test('las zonas de la vitrina no se tocan', async () => {
  const { conVersiones } = await import('../scripts/versiones.mjs');
  const zona = '<!-- GENERADO:TIENDA estilos --><link rel="stylesheet" href="/css/styles.css?v=lo-de-la-vitrina"><!-- /GENERADO:TIENDA -->';
  assert.ok(conVersiones(`<head>${zona}</head>`).includes(zona));
});

test('el encabezado de página y las preguntas frecuentes viven sólo en styles.css', () => {
  const comun = sinComentariosCss(leerHoja('styles.css'));
  for (const sel of ['.page-head{', '.page-head-inner{', '.page-head h1{', '.page-head .ctas{', '.faq{', '.faq details{', '.faq-item{']) {
    assert.ok(comun.includes(sel), `styles.css no define ${sel}`);
  }
  for (const hoja of hojas.filter((n) => n !== 'styles.css')) {
    const css = sinComentariosCss(leerHoja(hoja));
    for (const sel of ['.page-head-inner{', '.page-head h1{', '.page-head .lead{', '.page-head .ctas{', '.page-head-photo::after{', '.faq details{', '.faq summary{', '.faq-item{', '.faq-item p{', '.migas{']) {
      assert.ok(!css.includes(sel), `${hoja} repite ${sel} de styles.css`);
    }
    // Lo único que una hoja puede poner en .page-head son sus variables (o el fondo sin foto de autoelevadores).
    for (const [, cuerpo] of css.matchAll(/(?:^|\})\s*\.page-head\{([^}]*)\}/g)) {
      for (const decl of cuerpo.split(';').map((d) => d.trim()).filter(Boolean)) {
        assert.match(decl, /^(--ph-(h1|lead|foco|velo)|background):/, `${hoja}: .page-head{${decl}} no es una variable del molde`);
      }
    }
  }
});

test('los cortes de pantalla son los de la lista de styles.css', () => {
  const permitidos = new Set(['480', '560', '720', '721', '880', '881', '960', '1080', '1239']);
  const vistos = new Set();
  for (const hoja of hojas) {
    for (const [consulta] of leerHoja(hoja).matchAll(/@media[^{]+/g)) {
      for (const [, ancho] of consulta.matchAll(/(\d+)px/g)) {
        vistos.add(ancho);
        assert.ok(permitidos.has(ancho), `${hoja}: ${consulta.trim()} usa ${ancho}px, que no está en la lista de styles.css`);
      }
    }
  }
  assert.ok(vistos.size <= permitidos.size);
});

test('el botón de la barra de arriba se maneja desde js/encabezado.js, sin código en línea', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const enLinea = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.ok(!enLinea.some((s) => s.includes('past-hero')), `${nombre}: todavía tiene el script de past-hero en línea`);
    if (!html.includes('<body')) continue;
    assert.strictEqual((html.match(/<script defer src="\/js\/encabezado\.js\?v=[0-9a-f]+"><\/script>/g) || []).length, 1, `${nombre}: no carga /js/encabezado.js una vez`);
  }
  const js = fs.readFileSync(path.join(raiz, 'js', 'encabezado.js'), 'utf8');
  assert.match(js, /querySelector\('\.hero, \.page-head'\)/);
  assert.match(js, /classList\.toggle\('past-hero'/);
});
