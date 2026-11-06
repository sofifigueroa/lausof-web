/* =============================================================================
   LO QUE SE PUBLICA — node scripts/publicacion.mjs <exportar|publicar|comprobar>
   -----------------------------------------------------------------------------
   Producción (y la demo) publican una carpeta armada con una LISTA DE PERMITIDOS,
   nunca la raíz del repo. Por qué: Netlify guarda y sirve los archivos en
   minúsculas, y las reglas 404! de _redirects distinguen mayúsculas
   (docs.netlify.com/manage/routing/redirects/overview/, «Paths are
   case-sensitive», leído 06/11/2026). Con `--dir .` el README, scripts/, tests/
   y package.json respondían 200 en /Readme.md, /Scripts/…, /Package.json
   (auditoría 8-auditoria-entorno.md, 06/11/2026). Lo que no se sube no se
   sirve en ninguna grafía.

   exportar --sha <sha40> --salida <carpeta nueva fuera del repo>
       git archive del sha, SÓLO con las rutas permitidas (PERMITIDOS abajo).
       Después revisa la carpeta (problemasDeLaExportacion) y sale con 1 si algo
       sobra o si una página enlaza un archivo que no quedó adentro.
   publicar --sha <sha40> [--salida <carpeta nueva>] [--conservar] [--permitir-anterior]
       exportar + deploy a PRODUCCIÓN (sitio lausof) con
       `netlify-cli deploy --prod --no-build --dir <salida>`. Primero trae
       origin/rediseno-agosto-2026 (git fetch) y rehúsa un árbol sucio, un HEAD
       distinto del sha y un sha que no sea la punta de origin
       (motivosParaNoPublicar). Por eso el sha se empuja ANTES de publicar.
       Rehúsa también si el aviso de privacidad exportado dice otra cosa que
       el publicado en www.lausof.com y su «Vigente desde» no es hoy en Salta
       (scripts/privacidad.mjs, revisarAviso; auditoría B2 de
       web/privacidad-2026-11-05/7-auditoria-build.md).
       Borra la carpeta al terminar bien, salvo --conservar.
   comprobar
       Sólo lecturas: la lista de archivos del deploy publicado (API de
       Netlify) tiene que tener sólo rutas permitidas, y las rutas internas
       conocidas, en varias grafías, tienen que dar 404 en www.lausof.com.
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HOST_PRODUCCION, NETLIFY_PRODUCCION } from './entorno.mjs';
import { revisarAviso } from './privacidad.mjs';

export const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RAMA = 'rediseno-agosto-2026';
export const REF_RAMA = `origin/${RAMA}`;

// ---------------------------------------------------------------------------
// La lista de permitidos. Todo lo que no entra acá no se publica.
// ---------------------------------------------------------------------------
// Nombres en minúsculas: Netlify los sirve en minúsculas de todos modos, y una
// mayúscula en un archivo público es un error que conviene ver.
const NOMBRE = '[a-z0-9][a-z0-9._-]*';
const IMAGEN = 'avif|webp|jpg|jpeg|png|svg|gif|ico';
export const PERMITIDOS = [
  { que: 'páginas de la raíz (incluye 404.html y la verificación de Search Console)', re: new RegExp(`^${NOMBRE}\\.html$`) },
  { que: 'páginas en inglés y portugués', re: new RegExp(`^(?:en|pt)/(?:${NOMBRE}/)*${NOMBRE}\\.html$`) },
  { que: 'hojas de estilo', re: new RegExp(`^css/(?:${NOMBRE}/)*${NOMBRE}\\.css$`) },
  { que: 'scripts del navegador', re: new RegExp(`^js/(?:${NOMBRE}/)*${NOMBRE}\\.js$`) },
  { que: 'fotos e íconos', re: new RegExp(`^assets/(?:${NOMBRE}/)*${NOMBRE}\\.(?:${IMAGEN}|woff2?)$`) },
  { que: 'robots, sitemap y reglas de Netlify', re: /^(?:robots\.txt|sitemap\.xml|_headers|_redirects)$/ },
  { que: '.well-known (security.txt y afines)', re: new RegExp(`^\\.well-known/${NOMBRE}\\.(?:txt|json)$`) },
];

// El archivo de IndexNow es el único .txt de la raíz: su nombre es la clave
// de scripts/indexnow.mjs del mismo sha.
export const claveIndexNowDe = (textoIndexNow) => (String(textoIndexNow).match(/export const CLAVE = '([0-9a-f]{32})'/) || [])[1] || null;

export function esPublico(rel, { clave = null, extras = [] } = {}) {
  if (extras.includes(rel)) return true;
  if (clave && rel === `${clave}.txt`) return true;
  return PERMITIDOS.some((p) => p.re.test(rel));
}

// ---------------------------------------------------------------------------
// Qué páginas son públicas: las del sitemap más esta lista cerrada. La forma
// del nombre (PERMITIDOS) no alcanza: una página de revisión o una nota en
// .html en la raíz, en en/ o en pt/ entraría igual (auditoría 9, N1). Una
// página nueva entra al sitemap o, si no se indexa, a esta lista.
// ---------------------------------------------------------------------------
export const PAGINAS_FUERA_DEL_SITEMAP = ['404.html', 'en/404.html', 'google40eac84837fa77f1.html',
  'privacidad.html', 'en/privacy.html', 'pt/privacidade.html'];

// Las rutas de archivo que nombra un sitemap (https://www.lausof.com/<url>).
export function paginasDelSitemap(texto) {
  const urls = [...String(texto || '').matchAll(/<loc>\s*https:\/\/www\.lausof\.com\/([^<\s]*)\s*<\/loc>/g)].map((m) => m[1]);
  return new Set(urls.flatMap((u) => {
    if (u === '' || u.endsWith('/')) return [`${u}index.html`];
    if (u.endsWith('.html')) return [u];
    return [`${u}.html`, `${u}/index.html`];
  }));
}

// Cada .html tiene que estar en el sitemap o en PAGINAS_FUERA_DEL_SITEMAP.
// Sin sitemap no se puede saber: todas las páginas cuentan como no declaradas.
export function paginasNoDeclaradas(archivos, textoSitemap, { fuera = PAGINAS_FUERA_DEL_SITEMAP } = {}) {
  const declaradas = paginasDelSitemap(textoSitemap);
  return archivos.filter((rel) => rel.toLowerCase().endsWith('.html') && !declaradas.has(rel) && !fuera.includes(rel))
    .map((rel) => `${rel}: página que no está en sitemap.xml ni en PAGINAS_FUERA_DEL_SITEMAP`);
}

// ---------------------------------------------------------------------------
// La guardia de la carpeta exportada. Independiente de PERMITIDOS a propósito:
// nombra lo que nunca puede salir, en cualquier grafía, y además revisa que
// cada archivo esté permitido y que cada enlace interno resuelva adentro.
// ---------------------------------------------------------------------------
const NUNCA = [
  { que: 'un .md', re: /\.md$/i },
  { que: 'CLAUDE.md / README', re: /(?:^|\/)(?:claude|readme)(?:\.|$)/i },
  { que: 'scripts/', re: /^scripts\//i },
  { que: 'tests/', re: /^tests\//i },
  { que: 'e2e/', re: /^e2e\//i },
  { que: 'demo/', re: /^demo\//i },
  { que: 'netlify/ o netlify.toml', re: /^netlify(?:\/|\.toml$)/i },
  { que: 'package*.json', re: /(?:^|\/)package(?:-lock)?\.json$/i },
  { que: 'un .mjs (código de Node)', re: /\.mjs$/i },
  { que: '.git', re: /(?:^|\/)\.git(?:\/|$|ignore|attributes)/i },
  { que: 'un archivo con punto fuera de .well-known/', re: /(?:^|\/)\.(?!well-known\/)/ },
];

// Todos los archivos de un árbol, con «/» como separador.
export const archivosDe = (raiz) => {
  const salida = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(path.join(raiz, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) recorrer(rel);
      else salida.push(rel);
    }
  };
  recorrer('');
  return salida.sort();
};

// Orígenes de _redirects que llevan a otra página (no los 404!), para no
// contar como roto un enlace a una ruta que Netlify redirige (p. ej. /contact).
const origenesDeRedirects = (texto) => String(texto || '').split('\n').map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/))
  .filter((r) => !/^404/.test(r[r.length - 1])).map((r) => r[0]);

// Las referencias internas de una página o una hoja de estilo.
export function referenciasDe(texto, rel) {
  const refs = [];
  if (rel.endsWith('.html')) {
    for (const m of texto.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) refs.push(m[1]);
    // <meta content> sólo cuando es una URL (og:image, og:url, twitter:image).
    for (const m of texto.matchAll(/\bcontent="((?:https?:\/\/|\/)[^"]+)"/g)) refs.push(m[1]);
    for (const m of texto.matchAll(/\bsrcset="([^"]+)"/g)) for (const parte of m[1].split(',')) refs.push(parte.trim().split(/\s+/)[0]);
  }
  for (const m of texto.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) refs.push(m[1]);
  return refs;
}

// Lleva una referencia a una ruta del árbol, o null si no es interna.
export function rutaInterna(ref, desde) {
  let r = ref.trim();
  if (!r || /\s/.test(r) || /^(?:data:|mailto:|tel:|javascript:|#|\{)/i.test(r)) return null;
  if (/^https?:\/\//i.test(r)) {
    const u = new URL(r);
    if (!['www.lausof.com', 'lausof.com'].includes(u.hostname)) return null;
    r = u.pathname;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(r) || r.startsWith('//')) return null;
  r = r.split('#')[0].split('?')[0];
  if (!r) return null;
  const base = r.startsWith('/') ? '' : path.posix.dirname(desde);
  const limpia = path.posix.normalize(path.posix.join('/', base, decodeURIComponent(r))).slice(1);
  return limpia;
}

// ¿Netlify sirve algo en esa ruta? Archivo, carpeta con index.html, URL
// linda (/turismo → turismo.html) o una regla de _redirects.
const resuelve = (limpia, presentes, origenes) => {
  if (limpia === '' || limpia.endsWith('/')) return presentes.has(`${limpia}index.html`) || origenes.has(`/${limpia}`);
  return presentes.has(limpia) || presentes.has(`${limpia}.html`) || presentes.has(`${limpia}/index.html`)
    || origenes.has(`/${limpia}`) || origenes.has(`/${limpia}/`);
};

// La guardia sobre una lista de rutas y una forma de leerlas: sirve para la
// carpeta exportada y para el árbol del repo sin copiar las fotos. `sitemap`
// es el texto contra el que se declaran las páginas; por defecto, el
// sitemap.xml de la propia lista (la demo, que no lo lleva, pasa el de origen).
export function problemasDeLosArchivos(archivos, leer, { clave = null, extras = [], revisarEnlaces = true, sitemap } = {}) {
  const problemas = [];
  for (const rel of archivos) {
    for (const n of NUNCA) if (n.re.test(rel)) problemas.push(`${rel}: ${n.que} no se publica nunca`);
    if (!esPublico(rel, { clave, extras })) problemas.push(`${rel}: no está en la lista de permitidos`);
  }
  const textoSitemap = sitemap !== undefined ? sitemap : (archivos.includes('sitemap.xml') ? leer('sitemap.xml') : '');
  problemas.push(...paginasNoDeclaradas(archivos, textoSitemap));
  if (!revisarEnlaces) return problemas;
  const presentes = new Set(archivos);
  const origenes = new Set(origenesDeRedirects(presentes.has('_redirects') ? leer('_redirects') : ''));
  for (const rel of archivos.filter((r) => /\.(?:html|css)$/.test(r))) {
    for (const ref of referenciasDe(leer(rel), rel)) {
      const limpia = rutaInterna(ref, rel);
      if (limpia === null || resuelve(limpia, presentes, origenes)) continue;
      problemas.push(`${rel}: enlaza ${ref} y ${limpia || '/'} no está en lo exportado`);
    }
  }
  return [...new Set(problemas)];
}

export const problemasDeLaExportacion = (dir, opciones = {}) =>
  problemasDeLosArchivos(archivosDe(dir), (rel) => fs.readFileSync(path.join(dir, rel), 'utf8'), opciones);

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------
const git = (raiz, ...args) => execFileSync('git', ['-C', raiz, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();

// Archivos normales del sha (sin enlaces simbólicos ni submódulos).
export function archivosDelSha(sha, raiz = RAIZ) {
  return git(raiz, 'ls-tree', '-r', '-z', sha).split('\0').filter(Boolean)
    .map((l) => { const [meta, rel] = l.split('\t'); return { modo: meta.split(' ')[0], tipo: meta.split(' ')[1], rel }; })
    .filter((x) => x.tipo === 'blob' && (x.modo === '100644' || x.modo === '100755')).map((x) => x.rel);
}

export const claveDelSha = (sha, raiz = RAIZ) => {
  const r = spawnSync('git', ['-C', raiz, 'show', `${sha}:scripts/indexnow.mjs`], { encoding: 'utf8' });
  return r.status === 0 ? claveIndexNowDe(r.stdout) : null;
};

// Escribe en `destino` sólo las rutas `rutas` del sha, en tandas: las rutas van
// como argumentos de git archive y así nunca chocan con ARG_MAX aunque assets/
// crezca (auditoría 9, N3).
export const TANDA = 400;
const archivar = async (sha, rutas, destino, raiz) => {
  fs.mkdirSync(destino, { recursive: true });
  for (let i = 0; i < rutas.length; i += TANDA) await archivarTanda(sha, rutas.slice(i, i + TANDA), destino, raiz);
};
const archivarTanda = (sha, rutas, destino, raiz) => new Promise((resolve, reject) => {
  const lista = spawn('git', ['-C', raiz, 'archive', '--format=tar', sha, '--', ...rutas], {
    stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' },
  });
  const tar = spawn('tar', ['-x', '-f', '-', '-C', destino], { stdio: ['pipe', 'inherit', 'inherit'] });
  lista.stdout.pipe(tar.stdin);
  let fallo = null;
  lista.on('close', (code) => { if (code !== 0) fallo = new Error(`git archive salió con ${code}`); });
  tar.on('close', (code) => (fallo || code !== 0 ? reject(fallo || new Error(`tar salió con ${code}`)) : resolve()));
});

const dentroDe = (padre, hijo) => {
  const rel = path.relative(fs.realpathSync(padre), hijo);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};

// El paso que comparten producción y la demo: el sha, sólo lo permitido, en
// una carpeta nueva fuera del repo. Devuelve qué entró y qué quedó afuera.
export async function exportar({ sha, salida, raiz = RAIZ, extras = [] }) {
  if (!salida) throw new Error('falta --salida <carpeta nueva>');
  const destino = path.resolve(salida);
  if (fs.existsSync(destino)) throw new Error(`${destino} ya existe: exportar sólo escribe en una carpeta nueva`);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (dentroDe(raiz, path.join(fs.realpathSync(path.dirname(destino)), path.basename(destino)))) {
    throw new Error(`${destino} queda dentro del repo: la exportación va afuera`);
  }
  const completo = git(raiz, 'rev-parse', '--verify', `${sha}^{commit}`);
  if (completo !== sha) throw new Error(`--sha tiene que ser el sha de 40 caracteres (${sha} → ${completo})`);
  const clave = claveDelSha(sha, raiz);
  const todos = archivosDelSha(sha, raiz);
  const publicos = todos.filter((rel) => esPublico(rel, { clave, extras }));
  const afuera = todos.filter((rel) => !publicos.includes(rel));
  await archivar(sha, publicos, destino, raiz);
  const escritos = archivosDe(destino);
  if (escritos.join('\n') !== [...publicos].sort().join('\n')) throw new Error('lo escrito no coincide con la lista de permitidos');
  return { sha, salida: destino, clave, publicos, afuera };
}

// Para un árbol ya armado (la demo): quita lo que no está permitido. Sólo
// dentro de `dir`, que tiene que ser una carpeta que este proceso creó.
export function podar(dir, { clave = null, extras = [] } = {}) {
  const quitados = [];
  for (const rel of archivosDe(dir)) {
    if (esPublico(rel, { clave, extras })) continue;
    fs.unlinkSync(path.join(dir, rel));
    quitados.push(rel);
  }
  const vaciar = (d) => {
    for (const e of fs.readdirSync(path.join(dir, d), { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const rel = d ? `${d}/${e.name}` : e.name;
      vaciar(rel);
      if (fs.readdirSync(path.join(dir, rel)).length === 0) fs.rmdirSync(path.join(dir, rel));
    }
  };
  vaciar('');
  return quitados;
}

// ---------------------------------------------------------------------------
// Netlify (token del CLI, sólo en memoria)
// ---------------------------------------------------------------------------
const tokenNetlify = () => {
  const archivo = path.join(os.homedir(), 'Library', 'Preferences', 'netlify', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const token = cfg.users?.[cfg.userId]?.auth?.token;
  if (!token) throw new Error('el CLI de Netlify no tiene sesión (npx netlify-cli login)');
  return token;
};

export async function netlify(ruta) {
  const r = await fetch(`https://api.netlify.com/api/v1${ruta}`, { headers: { authorization: `Bearer ${tokenNetlify()}` } });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = null; }
  return { status: r.status, ok: r.ok, json };
}

// Cómo lista Netlify un deploy (medido 06/11/2026): rutas en minúsculas, sin
// _headers ni _redirects y con un /netlify.toml que arma Netlify (no se sirve).
// La lista en vivo se compara contra la lista de permitidos en minúsculas.
// Con `sitemap` (el texto servido), además cada página tiene que estar declarada.
export function problemasDeLaListaEnVivo(rutas, { clave = null, sitemap } = {}) {
  const problemas = [];
  const rels = [];
  for (const r of rutas) {
    const rel = r.replace(/^\//, '').toLowerCase();
    if (rel === 'netlify.toml') continue;
    rels.push(rel);
    for (const n of NUNCA) if (n.re.test(rel)) problemas.push(`/${rel}: ${n.que}`);
    if (!esPublico(rel, { clave })) problemas.push(`/${rel}: no está en la lista de permitidos`);
  }
  if (sitemap !== undefined) problemas.push(...paginasNoDeclaradas(rels, sitemap).map((p) => `/${p}`));
  return [...new Set(problemas)];
}

// Rutas internas conocidas, en varias grafías: tienen que dar 404 en vivo.
export const SONDAS = ['/readme.md', '/Readme.md', '/README.MD', '/claude.md', '/Claude.md', '/Scripts/menu.mjs',
  '/scripts/menu.mjs', '/Tests/', '/Tests/util.js', '/tests/util.js', '/Package.json', '/package.json', '/Demo/llave.mjs',
  '/Scripts/entorno.mjs', '/assets/fotos/biblioteca.json'];

export async function comprobar({ sitio = NETLIFY_PRODUCCION.id, host = HOST_PRODUCCION, raiz = RAIZ } = {}) {
  const lineas = [];
  const s = await netlify(`/sites/${sitio}`);
  if (!s.ok) return [`ROJO  sitio ${sitio}: ${s.status}`];
  const deploy = s.json.published_deploy;
  const f = await netlify(`/sites/${sitio}/files`);
  if (!f.ok || !Array.isArray(f.json)) return [`ROJO  archivos de ${sitio}: ${f.status}`];
  // La clave de IndexNow no cambia entre deploys: la del checkout que corre esto.
  const clave = claveIndexNowDe(fs.readFileSync(path.join(raiz, 'scripts', 'indexnow.mjs'), 'utf8'));
  // Las páginas se declaran contra el sitemap que se sirve, no el del checkout.
  const sm = await fetch(`${host}/sitemap.xml`, { redirect: 'manual' });
  if (sm.status !== 200) return [`ROJO  P1 ${host}/sitemap.xml: ${sm.status}`];
  const problemas = problemasDeLaListaEnVivo(f.json.map((x) => x.path), { clave, sitemap: await sm.text() });
  if (problemas.length === 0) lineas.push(`VERDE P1 deploy ${deploy?.id}: ${f.json.length} archivos, todos permitidos`);
  else lineas.push(`ROJO  P1 deploy ${deploy?.id}: ${problemas.length} rutas no permitidas (p. ej. ${problemas.slice(0, 5).join('; ')})`);
  const estados = await Promise.all(SONDAS.map(async (r) => [r, (await fetch(`${host}${r}`, { redirect: 'manual' })).status]));
  const abiertas = estados.filter(([, st]) => st !== 404);
  if (abiertas.length === 0) lineas.push(`VERDE P2 ${host}: ${SONDAS.length} rutas internas en varias grafías dan 404`);
  else lineas.push(`ROJO  P2 ${host}: ${abiertas.map(([r, st]) => `${r} ${st}`).join(', ')}`);
  for (const l of lineas) console.log(l);
  return lineas;
}

// ---------------------------------------------------------------------------
// publicar (producción)
// ---------------------------------------------------------------------------
// Por qué no se publica, sin tocar git ni la red (los datos los junta
// estadoParaPublicar). Lista vacía = se puede publicar.
export function motivosParaNoPublicar({ sha, limpio, head, origenAlDia, punta, enOrigen, permitirAnterior = false }) {
  if (!/^[0-9a-f]{40}$/.test(sha || '')) return ['falta --sha <sha40>'];
  const motivos = [];
  if (!limpio) motivos.push('el árbol tiene cambios sin commitear');
  if (head !== sha) motivos.push(`HEAD (${head}) no es el sha a publicar (${sha})`);
  if (!origenAlDia) motivos.push(`no se pudo traer ${REF_RAMA} (git fetch origin ${RAMA}); sin eso no se sabe cuál es la punta`);
  else if (!punta) motivos.push(`no existe ${REF_RAMA}`);
  else if (sha !== punta) {
    if (!permitirAnterior) motivos.push(`${sha} no es la punta de ${REF_RAMA} (${punta}): primero se empuja (avance rápido) y después se publica; --permitir-anterior sólo para volver a uno anterior`);
    else if (!enOrigen) motivos.push(`${sha} no está en ${REF_RAMA}`);
  }
  return motivos;
}

// Lo que motivosParaNoPublicar necesita, leído de git. Trae la rama de origin
// antes de compararla: el ref local puede estar viejo si se empujó desde otro
// clon (auditoría 9, N2).
export function estadoParaPublicar(sha, { raiz = RAIZ, permitirAnterior = false } = {}) {
  const traer = spawnSync('git', ['-C', raiz, 'fetch', '--quiet', 'origin', RAMA], { encoding: 'utf8' });
  const origenAlDia = traer.status === 0;
  const p = spawnSync('git', ['-C', raiz, 'rev-parse', '--verify', '--quiet', `${REF_RAMA}^{commit}`], { encoding: 'utf8' });
  const punta = p.status === 0 ? p.stdout.trim() : null;
  const enOrigen = Boolean(punta) && /^[0-9a-f]{40}$/.test(sha || '')
    && spawnSync('git', ['-C', raiz, 'merge-base', '--is-ancestor', sha, punta]).status === 0;
  return { sha, limpio: git(raiz, 'status', '--porcelain') === '', head: git(raiz, 'rev-parse', 'HEAD'), origenAlDia, punta, enOrigen, permitirAnterior };
}

async function publicar({ sha, salida, conservar = false, permitirAnterior = false }) {
  const motivos = motivosParaNoPublicar(estadoParaPublicar(sha, { permitirAnterior }));
  if (motivos.length) throw new Error(`no se publica:\n  - ${motivos.join('\n  - ')}`);
  const destino = salida || path.join(os.tmpdir(), 'lausof-publicacion', `${sha.slice(0, 12)}-${Date.now()}`);
  const x = await exportar({ sha, salida: destino });
  const problemas = problemasDeLaExportacion(x.salida, { clave: x.clave });
  for (const p of problemas) console.error(`ROJO ${p}`);
  if (problemas.length) throw new Error(`no se publica: ${problemas.length} problema(s) en la exportación (${x.salida})`);
  const aviso = await revisarAviso({ dir: x.salida, host: HOST_PRODUCCION });
  if (aviso.length) throw new Error(`no se publica (exportación en ${x.salida}):\n  - ${aviso.join('\n  - ')}`);
  console.log(`exportado ${x.publicos.length} archivos (${x.afuera.length} quedan afuera) en ${x.salida}`);
  const r = spawnSync('npx', ['--yes', 'netlify-cli', 'deploy', '--prod', '--no-build', '--dir', x.salida,
    '--site', NETLIFY_PRODUCCION.id, '--message', `${RAMA} ${sha}`], { cwd: os.tmpdir(), stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`el deploy de Netlify salió con ${r.status} (exportación en ${x.salida})`);
  if (!conservar) fs.rmSync(x.salida, { recursive: true, force: true });
  console.log('publicado. Siguiente: node scripts/publicacion.mjs comprobar');
}

// ---------------------------------------------------------------------------
// Línea de comandos
// ---------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [orden, ...args] = process.argv.slice(2);
  const o = {};
  try {
    for (let i = 0; i < args.length; i += 1) {
      if (args[i] === '--sha') o.sha = args[++i];
      else if (args[i] === '--salida') o.salida = path.resolve(args[++i]);
      else if (args[i] === '--conservar') o.conservar = true;
      else if (args[i] === '--permitir-anterior') o.permitirAnterior = true;
      else throw new Error(`opción desconocida: ${args[i]}`);
    }
    if (orden === 'exportar') {
      const x = await exportar(o);
      const problemas = problemasDeLaExportacion(x.salida, { clave: x.clave });
      for (const p of problemas) console.log(`ROJO ${p}`);
      console.log(`${x.publicos.length} archivos exportados en ${x.salida}; ${x.afuera.length} quedan afuera`);
      process.exitCode = problemas.length ? 1 : 0;
    } else if (orden === 'publicar') await publicar(o);
    else if (orden === 'comprobar') process.exitCode = (await comprobar()).some((l) => l.startsWith('ROJO')) ? 1 : 0;
    else {
      console.error('uso: node scripts/publicacion.mjs <exportar|publicar|comprobar> [--sha <sha40>] [--salida <carpeta nueva>] [--conservar] [--permitir-anterior]');
      process.exitCode = 64;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
