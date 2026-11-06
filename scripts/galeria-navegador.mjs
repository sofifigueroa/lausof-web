/* =============================================================================
   CONTROL EN NAVEGADOR DE LA GALERÍA — node scripts/galeria-navegador.mjs
   -----------------------------------------------------------------------------
   Lo único de la galería que un test de Node sobre el HTML no puede probar
   (3b-diseno-sitio.md §2.3): teclado, el <dialog>, a dónde vuelve el foco, que
   nada se mueva solo, que el cambio de foto se anuncie al lector de pantalla
   (WCAG 4.1.3: región aria-live, callada al cargar) y que ninguna página
   quede con scroll horizontal a 390 px.
   Un solo recorrido por el componente, no uno por página.

   Sin dependencias: levanta un servidor estático de la carpeta del sitio, abre
   Chrome sin ventana y le habla por el protocolo de DevTools con el WebSocket
   que trae Node 22. Chrome: $CHROME, o el primero que encuentre (macOS, Linux
   o la caché de Playwright).

     node scripts/galeria-navegador.mjs                 # controla y sale 0/1
     node scripts/galeria-navegador.mjs --capturas DIR  # además, PNG a 1440 y 390

   En la PC de pruebas se corre por el gate, nunca por ssh:
     ~/.lausof-fleet/remote-gate.sh --no-db --require-clean <worktree> -- node scripts/galeria-navegador.mjs
   ============================================================================= */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdtempSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const iCapturas = process.argv.indexOf('--capturas');
const dirCapturas = iCapturas > 0 ? process.argv[iCapturas + 1] : null;

// Páginas que tocaron las fotos (fase 1 y lote 1 de la biblioteca, 06/11/2026):
// se miran sin scroll horizontal y, con --capturas, se fotografían.
const PAGINAS = ['galeria.html', 'cargas-refrigeradas.html', 'en/refrigerated-freight.html',
  'logistica-minera.html', 'en/mining-logistics.html', 'producciones.html', 'en/film-production-logistics.html',
  'alquiler-4x4.html', 'en/4x4-rental.html', 'charter-recitales.html', 'clubes-deportivos.html', 'viajes-de-estudio.html',
  'alquiler-combi-con-chofer-salta.html', 'en/minibus-with-driver-salta.html', 'traslados-casamientos.html',
  'en/wedding-transportation.html', 'viajes-internacionales.html', 'en/international-trips.html', 'traslados-empresas.html',
  'salinas-grandes-desde-salta.html', 'en/salinas-grandes-from-salta.html', 'pt/salinas-grandes-saindo-de-salta.html',
  'alquiler-autoelevadores.html', 'index.html'];

/* ---- servidor estático ---- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const servidor = createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.endsWith('/')) ruta += 'index.html';
  const archivo = join(raiz, ruta);
  if (!archivo.startsWith(raiz) || !existsSync(archivo) || !statSync(archivo).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] || 'application/octet-stream' });
  res.end(readFileSync(archivo));
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${servidor.address().port}/`;

/* ---- Chrome ---- */
function buscarChrome() {
  const candidatos = [process.env.CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const cache = join(homedir(), '.cache', 'ms-playwright');
  if (existsSync(cache)) {
    for (const d of readdirSync(cache).sort().reverse()) {
      candidatos.push(join(cache, d, 'chrome-linux', 'headless_shell'), join(cache, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
        join(cache, d, 'chrome-linux', 'chrome'), join(cache, d, 'chrome-linux64', 'chrome'));
    }
  }
  return candidatos.find((c) => c && existsSync(c));
}
const chrome = buscarChrome();
if (!chrome) { console.error('galeria-navegador: no encontré Chrome (definir $CHROME)'); process.exit(2); }
const perfil = mkdtempSync(join(tmpdir(), 'galeria-navegador-'));
const proceso = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

let puerto = null;
for (let i = 0; i < 200 && !puerto; i++) {
  const f = join(perfil, 'DevToolsActivePort');
  if (existsSync(f)) {
    const [p, ruta] = readFileSync(f, 'utf8').trim().split('\n');
    if (p && ruta) puerto = { p, ruta };
  }
  if (!puerto) await new Promise((r) => setTimeout(r, 50));
}
if (!puerto) { console.error('galeria-navegador: Chrome no abrió el puerto de DevTools'); proceso.kill(); process.exit(2); }

/* ---- protocolo de DevTools ---- */
const ws = new WebSocket(`ws://127.0.0.1:${puerto.p}${puerto.ruta}`);
await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
let siguiente = 0;
const pendientes = new Map();
const eventos = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pendientes.has(d.id)) {
    const { ok, mal } = pendientes.get(d.id); pendientes.delete(d.id);
    if (d.error) mal(new Error(d.error.message)); else ok(d.result);
  } else if (d.method) eventos.push(d);
};
const enviar = (method, params = {}, sessionId) => new Promise((ok, mal) => {
  const id = ++siguiente; pendientes.set(id, { ok, mal });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
const cdp = (m, p) => enviar(m, p, sessionId);
await cdp('Page.enable');
await cdp('Runtime.enable');

async function evaluar(expresion) {
  const r = await cdp('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`${expresion.slice(0, 60)}…: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
  return r.result.value;
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrir(pagina, ancho, { quieto = false } = {}) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: ancho < 600 ? 844 : 900,
    deviceScaleFactor: ancho < 600 ? 2 : 1, mobile: ancho < 600 });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: quieto ? 'reduce' : 'no-preference' }] });
  eventos.length = 0;
  await cdp('Page.navigate', { url: base + pagina });
  for (let i = 0; i < 200; i++) {
    if (eventos.some((e) => e.method === 'Page.loadEventFired')) break;
    await esperar(50);
  }
  await evaluar('document.fonts ? document.fonts.ready.then(() => true) : true');
}

// Enter lleva su texto, como una tecla real: sin él el botón no se activa.
async function tecla(key, code, keyCode) {
  const texto = key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {};
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...texto });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

const fallas = [];
let controles = 0;
function comprobar(condicion, mensaje) {
  controles++;
  if (!condicion) fallas.push(mensaje);
}

try {
  /* 1. Sin scroll horizontal a 390 ni a 1440 en las páginas tocadas. */
  for (const pagina of PAGINAS) {
    for (const ancho of [390, 1440]) {
      await abrir(pagina, ancho);
      const m = await evaluar('({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth })');
      comprobar(m.s <= m.c, `${pagina} a ${ancho}px: scroll horizontal (${m.s} > ${m.c})`);
      if (dirCapturas) {
        mkdirSync(dirCapturas, { recursive: true });
        // La captura de página entera no dispara la carga diferida: se piden
        // todas las fotos antes, para que la captura las muestre.
        // Se recorre la página de arriba abajo (y cada pista de galería) para
        // que pidan todo, y se espera a que termine de cargar.
        await evaluar(`(async () => { const h = document.documentElement.scrollHeight;
          for (let y = 0; y < h; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
          scrollTo(0, 0);
          [...document.images].forEach((i) => { i.loading = 'eager'; });
          await Promise.race([Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))),
            new Promise((r) => setTimeout(r, 8000))]);
          return true; })()`);
        const alto = await evaluar('Math.ceil(document.documentElement.scrollHeight)');
        const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: ancho, height: alto, scale: 1 } });
        writeFileSync(join(dirCapturas, `${pagina.replace('/', '_').replace('.html', '')}-${ancho}.png`), Buffer.from(data, 'base64'));
      }
    }
  }

  /* 2. La galería a 390 y a 1440: controles, teclado, diálogo, foco y anuncio. */
  // Lo que anuncia una región viva: su texto sin lo que está aria-hidden.
  const AYUDA = `window.__vivo = (raiz) => { const r = raiz && raiz.querySelector('[aria-live="polite"]');
      if (!r) return { existe: false };
      const c = r.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      return { existe: true, oculto: !!r.closest('[aria-hidden="true"]'), atomica: r.getAttribute('aria-atomic') === 'true',
               texto: c.textContent.replace(/\\s+/g, ' ').trim() }; };
    window.__visto = (c) => c ? (c.querySelector('.galeria-contador-visto') || c).textContent : '';
    true`;
  for (const ancho of [390, 1440]) {
    await abrir('galeria.html', ancho, { quieto: true });
    await evaluar(AYUDA);
    // Al cargar: cada galería tiene su región viva en los controles, visible
    // para el lector y callada (no anuncia tres galerías al abrir la página).
    const alCargar = await evaluar(`[...document.querySelectorAll('.galeria')].map((g) => __vivo(g.querySelector('.galeria-control')))`);
    alCargar.forEach((v, k) => {
      comprobar(v.existe && !v.oculto && v.atomica && v.texto === '',
        `${ancho}px galería ${k + 1}: sin región aria-live callada y legible en el contador (${JSON.stringify(v)})`);
    });
    const armado = await evaluar(`[...document.querySelectorAll('.galeria')].map((g) => ({
      cuadros: g.querySelectorAll('.galeria-pista > figure').length,
      miniaturas: g.querySelectorAll('.galeria-miniaturas button[aria-label]').length,
      actual: g.querySelectorAll('.galeria-miniaturas button[aria-current="true"]').length,
      visibles: [...g.querySelectorAll('.galeria-control button')].every((b) => b.getBoundingClientRect().width > 0)
    }))`);
    comprobar(armado.length >= 3, `${ancho}px: se esperaban al menos 3 galerías y hay ${armado.length}`);
    armado.forEach((g, k) => {
      comprobar(g.miniaturas === g.cuadros, `${ancho}px galería ${k + 1}: ${g.miniaturas} miniaturas para ${g.cuadros} cuadros`);
      comprobar(g.actual === 1, `${ancho}px galería ${k + 1}: ${g.actual} miniaturas marcadas`);
      comprobar(g.visibles, `${ancho}px galería ${k + 1}: un control sin tamaño (invisible)`);
    });

    // Las miniaturas se ven: con la galería en pantalla, cada una cargó su
    // foto (una miniatura vacía es un control que no dice nada).
    const vacias = await evaluar(`(async () => { const fuera = [];
      for (const [k, g] of [...document.querySelectorAll('.galeria')].entries()) {
        g.scrollIntoView({ block: 'center' });
        // js/galeria.js les pone la foto desde un IntersectionObserver, que
        // avisa en el cuadro siguiente: se le da tiempo antes de mirar.
        await new Promise((r) => setTimeout(r, 400));
        const imgs = [...g.querySelectorAll('.galeria-miniaturas img')];
        await Promise.race([Promise.all(imgs.map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))),
          new Promise((r) => setTimeout(r, 4000))]);
        imgs.forEach((i, n) => { if (!(i.complete && i.naturalWidth > 0)) fuera.push(\`galería \${k + 1}, miniatura \${n + 1}: \${i.currentSrc || i.getAttribute('src')}\`); });
      }
      window.scrollTo(0, 0); return fuera; })()`);
    comprobar(vacias.length === 0, `${ancho}px: miniaturas sin foto (${vacias.join('; ')})`);

    // Cuántas fotos tiene la primera galería (la que se recorre): el control no
    // depende de cuántas haya hoy.
    const N = armado[0].cuadros;
    comprobar(N >= 3, `${ancho}px: la primera galería tiene ${N} cuadros (van de 3 a 5)`);
    const vivoN = (k) => new RegExp(`^Foto ${k} de ${N}: \\S`);

    const estado = `(() => { const g = document.querySelector('.galeria'); const p = g.querySelector('.galeria-pista');
      const b = [...g.querySelectorAll('.galeria-miniaturas button')];
      const i = b.findIndex((x) => x.getAttribute('aria-current') === 'true');
      const f = g.querySelectorAll('.galeria-pista > figure')[i];
      return { i, alineado: Math.abs((f.offsetLeft - p.offsetLeft) - p.scrollLeft) < 2,
               contador: __visto(g.querySelector('.galeria-contador')),
               vivo: __vivo(g.querySelector('.galeria-control')) }; })()`;
    await evaluar(`document.querySelector('.galeria .galeria-pista').focus()`);
    await tecla('ArrowRight', 'ArrowRight', 39); await esperar(150);
    let e = await evaluar(estado);
    comprobar(e.i === 1 && e.alineado && e.contador === `2 de ${N}`, `${ancho}px: → no pasó a la foto 2 (${JSON.stringify(e)})`);
    comprobar(e.vivo.existe && !e.vivo.oculto && vivoN(2).test(e.vivo.texto),
      `${ancho}px: → no anunció «Foto 2 de 3: pie» al lector (${JSON.stringify(e.vivo)})`);
    await tecla('End', 'End', 35); await esperar(150);
    e = await evaluar(estado);
    comprobar(e.i === N - 1 && e.alineado, `${ancho}px: Fin no fue a la última (${JSON.stringify(e)})`);
    await tecla('Home', 'Home', 36); await esperar(150);
    e = await evaluar(estado);
    comprobar(e.i === 0 && e.alineado, `${ancho}px: Inicio no fue a la primera (${JSON.stringify(e)})`);
    await tecla('ArrowLeft', 'ArrowLeft', 37); await esperar(150);
    e = await evaluar(estado);
    comprobar(e.i === N - 1, `${ancho}px: ← desde la primera no dio la vuelta (${JSON.stringify(e)})`);
    await evaluar(`document.querySelectorAll('.galeria .galeria-miniaturas button')[1].click()`); await esperar(150);
    e = await evaluar(estado);
    comprobar(e.i === 1 && e.alineado, `${ancho}px: la miniatura 2 no llevó a la foto 2 (${JSON.stringify(e)})`);

    // Ampliar: abre el <dialog>, el foco queda adentro, ← → cambian de foto,
    // Esc cierra y el foco vuelve al botón que lo abrió.
    await evaluar(`document.querySelector('.galeria .galeria-ampliar').focus()`);
    await tecla('Enter', 'Enter', 13); await esperar(300);
    let d = await evaluar(`(() => { const d = document.querySelector('dialog.galeria-dialogo');
      const img = d && d.querySelector('img');
      return { abierto: !!(d && d.open), foco: !!(d && d.contains(document.activeElement)),
               contador: d ? __visto(d.querySelector('.galeria-dialogo-contador')) : '',
               pie: d ? d.querySelector('figcaption').textContent : '',
               real: img ? img.naturalWidth : 0, mostrado: img ? img.getBoundingClientRect().width : 0,
               cabe: img ? img.getBoundingClientRect().right <= innerWidth + 1 : false }; })()`);
    comprobar(d.abierto && d.foco, `${ancho}px: «Ampliar» no abrió el diálogo con el foco adentro (${JSON.stringify(d)})`);
    comprobar(d.contador === `Foto 2 de ${N}` && d.pie.length > 0, `${ancho}px: el diálogo no muestra la foto 2 con su pie (${JSON.stringify(d)})`);
    comprobar(d.real > 0 && d.mostrado <= d.real + 0.5, `${ancho}px: la foto ampliada se estira por encima de su ancho real (${d.mostrado} > ${d.real})`);
    comprobar(d.cabe, `${ancho}px: la foto ampliada se sale de la pantalla`);
    await tecla('ArrowRight', 'ArrowRight', 39); await esperar(200);
    d = await evaluar(`__visto(document.querySelector('dialog.galeria-dialogo .galeria-dialogo-contador'))`);
    comprobar(d === `Foto 3 de ${N}`, `${ancho}px: → en el diálogo no pasó a la foto 3 (${d})`);
    const vd = await evaluar(`__vivo(document.querySelector('dialog.galeria-dialogo .galeria-dialogo-barra'))`);
    comprobar(vd.existe && !vd.oculto && vivoN(3).test(vd.texto),
      `${ancho}px: → en el diálogo no anunció «Foto 3 de 3: pie» (${JSON.stringify(vd)})`);
    e = await evaluar(estado);
    comprobar(e.i === 2, `${ancho}px: la galería no acompañó al diálogo (${JSON.stringify(e)})`);
    comprobar(e.vivo.texto === '', `${ancho}px: con el diálogo abierto también anuncia la galería de atrás (${JSON.stringify(e.vivo)})`);
    await tecla('Escape', 'Escape', 27); await esperar(200);
    d = await evaluar(`({ abierto: document.querySelector('dialog.galeria-dialogo').open,
      foco: document.activeElement === document.querySelector('.galeria .galeria-ampliar') })`);
    comprobar(!d.abierto && d.foco, `${ancho}px: Esc no cerró el diálogo o el foco no volvió a «Ampliar» (${JSON.stringify(d)})`);

    // Deslizar la pista (dedo o rueda) también marca y anuncia la foto.
    // Chrome sin ventana deja la pestaña oculta después del Esc, y una página
    // oculta no corre requestAnimationFrame (lo usa el deslizar): al frente.
    await cdp('Page.bringToFront');
    await evaluar(`(() => { const p = document.querySelector('.galeria .galeria-pista');
      p.scrollTo({ left: 0, behavior: 'instant' }); return true; })()`); await esperar(250);
    e = await evaluar(estado);
    comprobar(e.i === 0 && vivoN(1).test(e.vivo.texto),
      `${ancho}px: deslizar a la primera no la marcó ni la anunció (${JSON.stringify(e)})`);

    // Nada se mueve solo: 7 s quieta (más que el ciclo más lento permitido)
    // y la foto marcada no cambia, sin animaciones sobre imágenes.
    if (ancho === 1440) {
      await abrir('galeria.html', ancho);
      await evaluar(AYUDA);
      const antes = await evaluar(estado);
      await esperar(7000);
      const despues = await evaluar(estado);
      comprobar(antes.i === despues.i && despues.alineado, `la galería cambió de foto sola (${antes.i} → ${despues.i})`);
      const animadas = await evaluar(`document.getAnimations().filter((a) => a.effect && a.effect.target &&
        /^(IMG|PICTURE|FIGURE)$/.test(a.effect.target.tagName)).length`);
      comprobar(animadas === 0, `hay ${animadas} animaciones sobre fotos`);
    }
  }

  /* 3. Sin JavaScript no queda ningún control muerto. */
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  await abrir('galeria.html', 390);
  const sinJs = await evaluar('document.querySelectorAll(".galeria-control, .galeria-ampliar").length');
  comprobar(sinJs === 0, `sin JavaScript aparecen ${sinJs} controles`);
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
} catch (error) {
  fallas.push(`error del control: ${error.message}`);
} finally {
  ws.close();
  proceso.kill();
  servidor.close();
}

console.log(`galeria-navegador: ${controles - fallas.length}/${controles} controles en verde (Chrome: ${chrome})`);
for (const f of fallas) console.log(`  ✗ ${f}`);
process.exit(fallas.length ? 1 : 0);
