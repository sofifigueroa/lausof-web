/* =============================================================================
   MEDIR LOS RECORTES DE TELÉFONO — node scripts/recortes-medir.mjs
   -----------------------------------------------------------------------------
   Herramienta (no es un generador ni un test): mide en chrome-headless-shell
   el encabezado (.page-head-photo) de cada página a los anchos de teléfono
   (TELEFONOS) y reescribe scripts/recortes-datos.mjs, que es lo que lee
   scripts/recortes.mjs. Se corre de nuevo cuando cambia el alto de un
   encabezado (otro título, otra bajada, otros botones) o se suma una página;
   el control en navegador (scripts/galeria-navegador.mjs) avisa cuando hace
   falta, con la página y el ancho.

     CHROME=<chrome-headless-shell> node scripts/recortes-medir.mjs

   Sólo chrome-headless-shell (~/.cache/chrome-headless-shell o la caché de
   Playwright), nunca la app de Chrome.

   Qué calcula, por foto de encabezado:
     · En un teléfono la foto va con object-fit:cover y queda limitada por el
       ALTO del encabezado: se ve una franja central. El recorte es esa franja,
       con todo el alto y centrada (object-position x = 50 % en todas).
     · Ancho del recorte = alto × (la caja más ancha en proporción entre todas
       las páginas que usan la foto, a todos los anchos, con la letra del sitio
       y con Arial, que es más ancha y parte otras líneas, con y sin lo que la
       vitrina pone en el encabezado) × MARGEN.
     · Si el recorte no baja al 85 % del ancho de la foto, no se recorta (la
       misma regla que los anchos de scripts/imagenes.mjs): queda en FUERA.
     · Tampoco si la página repite la foto más abajo (una tarjeta, una
       galería): ahí la foto entera ya se baja igual y el recorte sumaría
       bytes (transporte-de-personal: +83 KB, medido el 08/11/2026).
     · `sizes` del recorte en cada página: el ancho con que se dibuja en
       pantalla (el mayor entre el ancho de la caja y alto × proporción del
       recorte) en tres tramos de ancho de pantalla.
   ============================================================================= */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { raiz, archivoDe, medidasWebp } from './imagenes.mjs';
import { paginas } from './rutas-raiz.mjs';
import { MEDIA, MARGEN, FIJOS } from './recortes-datos.mjs';

// Anchos de teléfono que se miden: los de StatCounter Argentina, octubre de
// 2026 (384, 385, 412, 414, 360, 432 son los seis primeros), más los extremos.
export const TELEFONOS = [320, 340, 360, 375, 384, 390, 393, 412, 414, 432, 440];
const TRAMOS = [360, 400, 440];
const LETRAS = [null, 'Arial,sans-serif'];
// Con y sin lo que la vitrina pone en el encabezado (la línea de precio y
// «Ver precios y reservar»): sin precio, sin JS o sin la vitrina (después del
// merge, hasta el rebase) el encabezado es más bajo y pide un recorte más
// ancho. Ronda 10: medido sólo con la vitrina, 6 páginas quedaban cortas sin ella.
const VITRINA = [true, false];

function buscarChrome() {
  const c = [process.env.CHROME];
  const mac = join(homedir(), '.cache', 'chrome-headless-shell', 'chrome-headless-shell');
  if (existsSync(mac)) for (const d of readdirSync(mac).sort().reverse()) c.push(join(mac, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell'));
  const pw = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(pw)) for (const d of readdirSync(pw).filter((x) => x.startsWith('chromium_headless_shell')).sort().reverse()) {
    c.push(join(pw, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
  }
  return c.find((x) => x && existsSync(x) && /headless/.test(x) && !/\.app\//.test(x));
}

// ¿La página usa la foto del encabezado en otro lugar (fuera del encabezado)?
export function repiteFoto(html, foto) {
  const sin = html.replace(/<div class="page-head-photo"[\s\S]*?<\/picture><\/div>/, '');
  return sin.includes(foto.replace(/\.webp$/, '.')) || sin.includes(foto.replace(/\.webp$/, '-'));
}

export function calcular(medidas, naturales) {
  const recortes = [];
  const fuera = [];
  const porFoto = new Map();
  for (const [pagina, { foto, cajas, repite }] of Object.entries(medidas)) {
    if (repite) { fuera.push({ pagina, foto, motivo: 'repite la foto más abajo: el recorte sumaría bytes' }); continue; }
    if (!porFoto.has(foto)) porFoto.set(foto, {});
    porFoto.get(foto)[pagina] = cajas;
  }
  for (const [foto, pags] of [...porFoto.entries()].sort()) {
    const [W0, H] = naturales[foto];
    const proporcion = (cajas) => Math.max(...cajas.map((c) => c.w / c.h));
    let ancho = FIJOS[foto] || 2 * Math.ceil((H * Math.max(...Object.values(pags).map(proporcion)) * MARGEN) / 2);
    const entran = Object.keys(pags).filter((p) => ancho / H >= proporcion(pags[p]) * MARGEN - 1e-9);
    for (const p of Object.keys(pags).filter((x) => !entran.includes(x))) fuera.push({ pagina: p, foto, motivo: `pide más de los ${ancho} px del recorte fijo` });
    if (ancho > W0 * 0.85) {
      for (const p of entran) fuera.push({ pagina: p, foto, motivo: `el recorte (${ancho} de ${W0} px) ahorra menos del 15 %` });
      continue;
    }
    const paginasDe = {};
    for (const p of entran.sort()) {
      const tramo = (hasta, desde) => Math.ceil(Math.max(...pags[p].filter((c) => c.ancho <= hasta && c.ancho > desde)
        .map((c) => Math.max(c.w, (c.h * ancho) / H))));
      const [a, b, c] = [tramo(TRAMOS[0], 0), tramo(TRAMOS[1], TRAMOS[0]), tramo(TRAMOS[2], TRAMOS[1])];
      paginasDe[p] = { proporcion: Number(proporcion(pags[p]).toFixed(3)), sizes: `(max-width: ${TRAMOS[0]}px) ${a}px, (max-width: ${TRAMOS[1]}px) ${b}px, ${c}px` };
    }
    recortes.push({ foto, natural: [W0, H], ancho, paginas: paginasDe });
  }
  return { recortes, fuera };
}

async function medir(chrome) {
  const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.avif': 'image/avif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const servidor = createServer((req, res) => {
    let f = join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (f.endsWith('/')) f += 'index.html';
    if (!f.startsWith(raiz) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}/`;
  const perfil = mkdtempSync(join(tmpdir(), 'recortes-medir-'));
  const proceso = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });
  let puerto = null;
  for (let i = 0; i < 200 && !puerto; i++) {
    const f = join(perfil, 'DevToolsActivePort');
    if (existsSync(f)) { const [p, r] = readFileSync(f, 'utf8').trim().split('\n'); if (p && r) puerto = { p, r }; }
    if (!puerto) await new Promise((r) => setTimeout(r, 50));
  }
  if (!puerto) throw new Error('chrome-headless-shell no abrió DevTools');
  const ws = new WebSocket(`ws://127.0.0.1:${puerto.p}${puerto.r}`);
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
  let sig = 0; const pend = new Map(); const eventos = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const x = pend.get(d.id); pend.delete(d.id); if (d.error) x.mal(new Error(d.error.message)); else x.ok(d.result); } else if (d.method) eventos.push(d); };
  const enviar = (method, params = {}, sessionId) => new Promise((ok, mal) => { const id = ++sig; pend.set(id, { ok, mal }); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (m, p) => enviar(m, p, sessionId);
  await cdp('Page.enable');
  const medidas = {};
  try {
    for (const pagina of paginas()) {
      if (!readFileSync(join(raiz, pagina), 'utf8').includes('class="page-head-photo"')) continue;
      const cajas = [];
      let foto = null;
      for (const ancho of TELEFONOS) {
        await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: 844, deviceScaleFactor: 2, mobile: true });
        // Cada variante de la vitrina, con la página recién cargada: la letra se
        // agrega encima (sitio, después Arial) y sacar la vitrina no se deshace.
        for (const vitrina of VITRINA) {
        eventos.length = 0;
        await cdp('Page.navigate', { url: base + pagina });
        for (let i = 0; i < 200; i++) { if (eventos.some((e) => e.method === 'Page.loadEventFired')) break; await new Promise((r) => setTimeout(r, 25)); }
        for (const letra of LETRAS) {
          const r = await cdp('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: `(async () => {
            ${letra ? `const st = document.createElement('style'); st.textContent = ':root{--font:${letra}}'; document.head.appendChild(st);` : ''}
            ${vitrina ? '' : "document.querySelectorAll('.page-head [data-tienda-cabeza], .page-head [data-tienda-ir]').forEach((n) => n.remove());"}
            if (document.fonts) await document.fonts.ready;
            const c = document.querySelector('.page-head-photo'); const img = c.querySelector('img'); const b = c.getBoundingClientRect();
            return { w: b.width, h: b.height, x: getComputedStyle(img).objectPosition.split(' ')[0], src: img.getAttribute('src') }; })()` });
          const v = r.result.value;
          if (v.x !== '50%') throw new Error(`${pagina}: la foto del encabezado no está centrada (object-position ${v.x}); el recorte sería otro`);
          foto = v.src;
          cajas.push({ ancho, letra: letra || 'sitio', vitrina, w: v.w, h: v.h });
        }
        }
      }
      medidas[pagina] = { foto, cajas, repite: repiteFoto(readFileSync(join(raiz, pagina), 'utf8'), foto) };
      console.log(`${pagina}: ${foto}`);
    }
  } finally {
    ws.close(); servidor.close();
    await new Promise((ok) => { proceso.once('exit', ok); proceso.kill(); setTimeout(ok, 5000); });
    try { rmSync(perfil, { recursive: true, force: true }); } catch { /* carpeta temporal */ }
  }
  return medidas;
}

async function principal() {
  const chrome = buscarChrome();
  if (!chrome) { console.error('recortes-medir: sólo chrome-headless-shell (definir CHROME)'); process.exit(2); }
  const medidas = await medir(chrome);
  const naturales = {};
  for (const { foto } of Object.values(medidas)) { const m = medidasWebp(archivoDe(foto, 'index.html')); naturales[foto] = [m.ancho, m.alto]; }
  const { recortes, fuera } = calcular(medidas, naturales);
  const hoy = new Date().toISOString().slice(0, 10);
  const texto = `/* Recortes de teléfono del encabezado. GENERADO por scripts/recortes-medir.mjs
   (${hoy}, chrome-headless-shell, ${TELEFONOS.join('/')} px, letra del sitio y Arial):
   no editar a mano salvo MEDIA, MARGEN y FIJOS. Lo lee scripts/recortes.mjs. */

// Pantallas que reciben el recorte. 440 cubre los anchos de teléfono más usados
// en Argentina (StatCounter, octubre de 2026: 384, 412, 385, 414, 360 y 432 px).
export const MEDIA = ${JSON.stringify(MEDIA)};
// Holgura sobre la caja más ancha medida: otra letra (Roboto en Android) parte
// las líneas distinto y el encabezado puede quedar un poco más bajo. [J]
export const MARGEN = ${MARGEN};
// Recortes que ya existían y no se vuelven a cortar (ancho en px).
export const FIJOS = ${JSON.stringify(FIJOS, null, 2)};

export const RECORTES = ${JSON.stringify(recortes, null, 2)};

// Páginas con foto de encabezado que no llevan recorte, y por qué.
export const FUERA = ${JSON.stringify(fuera, null, 2)};
`;
  writeFileSync(join(raiz, 'scripts', 'recortes-datos.mjs'), texto);
  console.log(`recortes-medir: ${recortes.length} recortes en ${recortes.reduce((s, r) => s + Object.keys(r.paginas).length, 0)} páginas; ${fuera.length} páginas fuera`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) await principal();
