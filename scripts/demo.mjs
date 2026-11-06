/* =============================================================================
   LA DEMO DE LA VITRINA — node scripts/demo.mjs <armar|publicar|comprobar|llave-nueva>
   -----------------------------------------------------------------------------
   Diseño: ~/lausof/web/demo-reservas-2026-11-06/3b-diseno-entorno.md (§1, §2,
   §3). Contrato con la vitrina: 7-contrato-overlay.md, misma carpeta. La
   excepción a «sin entornos de prueba» y sus reglas: CLAUDE.md de este repo.

   armar --sha <sha40> --salida <carpeta nueva> [--permitir-anterior]
       Escribe el árbol exacto de ese sha (git archive) en <salida>/sitio/, le
       aplica el MANIFIESTO (la lista cerrada de lo que la demo cambia) y pone
       al lado netlify.toml y la puerta de la llave. Nunca escribe en una
       carpeta que ya existe ni borra nada fuera de lo que acaba de crear.
   publicar --sha <sha40> [--salida <carpeta nueva>] [--permitir-anterior]
       armar + las guardias de la salida + deploy al sitio de la DEMO con el
       CLI de Netlify. Rehúsa el sitio de producción, un sitio sin «demo» en el
       nombre, un árbol sucio, un HEAD distinto del sha y un sha que no esté en
       origin/rediseno-agosto-2026.
   comprobar [--sha <sha40>]
       Sólo lecturas (API de Netlify y HTTPS): producción = el sha; demo =
       producción + manifiesto; cabeceras y cuerpos en vivo; catálogo de la
       demo de Apacheta. Una línea VERDE/ROJO por control; sale con 1 si hay
       algún rojo. Lo que falta de Apacheta (perfil.pendientes) sale en rojo.
   llave-nueva
       Genera la llave del enlace (32 bytes), la guarda en el Llavero y en la
       variable DEMO_LLAVE del sitio de la demo. No la imprime nunca. Después
       hay que volver a publicar para que la edge function la lea.

   El token de Netlify sale de la configuración del CLI y la llave del
   Llavero, dentro de este proceso: nunca van a una línea de comandos ni a la
   salida. Sin dependencias: Node solo.
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  APACHETA, GA4_PRODUCCION, HOST_PRODUCCION, NETLIFY_PRODUCCION, perfil as perfilDe,
} from './entorno.mjs';

export const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RAMA = 'rediseno-agosto-2026';
export const REF_RAMA = `origin/${RAMA}`;

// ---------------------------------------------------------------------------
// Utilidades de árbol
// ---------------------------------------------------------------------------

const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(raiz, rel));
const escribir = (raiz, rel, texto) => {
  fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true });
  fs.writeFileSync(path.join(raiz, rel), texto);
};

// Todos los archivos de un árbol, con ruta relativa y «/» como separador.
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

// Las páginas: .html de la raíz, en/ y pt/. El archivo de verificación de
// Search Console no es una página (y la demo no lo lleva).
export const paginasDe = (raiz) => archivosDe(raiz)
  .filter((rel) => /^(?:(?:en|pt)\/)?[^/]+\.html$/.test(rel) && !/^google[0-9a-f]+\.html$/.test(rel));

export const idiomaDe = (html) => {
  const lang = ((html.match(/<html\b[^>]*\blang="([^"]+)"/) || [])[1] || 'es').toLowerCase();
  return lang.startsWith('en') ? 'en' : lang.startsWith('pt') ? 'pt' : 'es';
};

const claveIndexNow = (raiz) => (leer(raiz, 'scripts/indexnow.mjs').match(/export const CLAVE = '([0-9a-f]+)'/) || [])[1];

// Rutas que _redirects esconde con 404! (README, tests/, scripts/, demo/…):
// se suben con el deploy pero nadie las ve. Las guardias de «lo que se sirve»
// las dejan afuera.
export const internosDe = (redirects) => redirects.split('\n').map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/))
  .filter((r) => r[2] === '404!' && r[1] === '/404.html').map((r) => r[0]);

export const esInterno = (rel, internos) => internos.some((regla) => (regla.endsWith('/*')
  ? `/${rel}`.startsWith(regla.slice(0, -1)) : `/${rel}` === regla));

const esTexto = (rel) => /\.(html|css|js|mjs|json|txt|xml|md|toml)$|^_headers$|^_redirects$/.test(rel);

// ---------------------------------------------------------------------------
// El manifiesto: la lista cerrada de lo que la demo cambia (3b §1.3)
// ---------------------------------------------------------------------------
// Cada entrada aplica su cambio sobre <sitio> y anota qué rutas tocó. Las
// condicionales (O4, O11, O12) pueden no tocar nada mientras la vitrina no
// exista; las demás tienen que cambiar algo o la salida no pasa (G8).

const LINEA_GTAG_SRC = /^[ \t]*<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+"><\/script>\n/m;
const LINEA_GTAG_CFG = /^[ \t]*<script>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\)\}gtag\('js',new Date\(\)\);gtag\('config','G-[A-Z0-9]+'\)<\/script>\n/m;
const COMENTARIO_GA4 = /^[ \t]*<!--(?:(?!-->)[\s\S])*Google Analytics(?:(?!-->)[\s\S])*-->\n(?=[ \t]*<script async src="https:\/\/www\.googletagmanager\.com)/m;

export const META_NOINDEX = '<meta name="robots" content="noindex, nofollow">';
export const CLASE_FRANJA = 'demo-franja';

const franjaHtml = (FRANJA, idioma) => {
  const f = FRANJA[idioma] || FRANJA.es;
  return `<div class="${CLASE_FRANJA}" role="note" aria-label="${f.aria}"><span class="demo-franja-etiqueta">${f.etiqueta}</span>${f.texto}</div>\n`;
};

// La vitrina escrita por el generador (7-contrato-overlay.md): lo que hay entre
// <!-- GENERADO:TIENDA … --> y <!-- /GENERADO:TIENDA -->.
export const zonaTienda = (html) => [...html.matchAll(/<!-- GENERADO:TIENDA[^>]*-->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/g)]
  .map((m) => m[1]).join('').trim();

const PREGUNTA_PRECIO = /(<summary>(?:¿Cuánto cuesta\?|How much does it cost\?|Quanto custa\?)<\/summary>\s*<p>)([\s\S]*?)(<\/p>)/;

export const MANIFIESTO = [
  {
    id: 'O4', tipo: 'generado', condicional: true,
    que: 'la vitrina: scripts/tienda.mjs del mismo sha, con el perfil demo (7-contrato-overlay.md)',
    async aplicar(c) {
      if (!existe(c.sitio, 'scripts/tienda.mjs')) { c.pendiente('O4: scripts/tienda.mjs no existe en este sha: la demo sale sin vitrina'); return; }
      const { generarTienda } = await import(pathToFileURL(path.join(c.sitio, 'scripts/tienda.mjs')).href);
      if (typeof generarTienda !== 'function') throw new Error('O4: scripts/tienda.mjs no exporta generarTienda');
      const antes = new Map(archivosDe(c.sitio).map((rel) => [rel, huellaArchivo(c.sitio, rel)]));
      await generarTienda({ raiz: c.sitio, perfil: c.perfil });
      for (const rel of archivosDe(c.sitio)) {
        if (!antes.has(rel)) c.agregado(rel);
        else if (antes.get(rel) !== huellaArchivo(c.sitio, rel)) c.cambiado(rel);
      }
      for (const rel of antes.keys()) if (!existe(c.sitio, rel)) throw new Error(`O4: el generador borró ${rel}`);
    },
  },
  {
    id: 'O12', tipo: 'solo-demo', condicional: true,
    que: 'archivos sólo de la demo de la vitrina: demo/sitio/** a la misma ruta',
    aplicar(c) {
      const base = path.join(c.sitio, 'demo', 'sitio');
      if (!fs.existsSync(base)) return;
      for (const rel of archivosDe(base)) {
        if (existe(c.sitio, rel)) throw new Error(`O12: demo/sitio/${rel} pisaría un archivo del sitio`);
        escribir(c.sitio, rel, fs.readFileSync(path.join(base, rel)));
        c.agregado(rel);
      }
    },
  },
  {
    id: 'O6', tipo: 'solo-demo',
    que: 'sin sitemap.xml, sin el archivo de IndexNow y sin el de Search Console',
    aplicar(c) {
      const quitar = ['sitemap.xml', `${claveIndexNow(c.sitio)}.txt`,
        ...archivosDe(c.sitio).filter((rel) => /^google[0-9a-f]+\.html$/.test(rel))];
      for (const rel of quitar) {
        if (!existe(c.sitio, rel)) continue;
        fs.unlinkSync(path.join(c.sitio, rel));
        c.quitado(rel);
      }
    },
  },
  {
    id: 'O1', tipo: 'valor',
    que: 'GA4: el ID de la propiedad demo en las dos líneas de gtag, o sin gtag si el perfil no tiene ID',
    aplicar(c) {
      for (const rel of paginasDe(c.sitio)) {
        c.editar(rel, (html) => {
          if (c.perfil.ga4) return html.split(GA4_PRODUCCION).join(c.perfil.ga4);
          return html.replace(COMENTARIO_GA4, '').replace(LINEA_GTAG_SRC, '').replace(LINEA_GTAG_CFG, '');
        });
      }
    },
  },
  {
    id: 'O2', tipo: 'solo-demo',
    que: '<meta name="robots" content="noindex, nofollow"> en cada página',
    aplicar(c) {
      for (const rel of paginasDe(c.sitio)) {
        c.editar(rel, (html) => {
          if (/<meta name="robots" content="[^"]*">/.test(html)) return html.replace(/<meta name="robots" content="[^"]*">/, META_NOINDEX);
          return html.replace(/(<meta charset="[^"]*">\n?)/i, `$1  ${META_NOINDEX}\n`);
        });
      }
    },
  },
  {
    id: 'O3', tipo: 'solo-demo',
    que: 'la marca: franja después de <body>, su estilo en línea en <head> y «[Demo] » en el <title>',
    aplicar(c) {
      // En línea y no como /css/demo.css: un pedido más que bloquea el render en
      // cada página (pedido 5 del contrato; la vitrina hace lo mismo con su CSS).
      const css = leer(c.fuentes, 'demo/marca.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '').trim();
      for (const rel of paginasDe(c.sitio)) {
        c.editar(rel, (html) => html
          .replace(/<title>/, `<title>${c.textos.PREFIJO_TITULO}`)
          .replace(/<\/head>/, `  <style id="demo-marca">${css}</style>\n</head>`)
          .replace(/(<body\b[^>]*>\n?)/, `$1${franjaHtml(c.textos.FRANJA, idiomaDe(html))}`));
      }
    },
  },
  {
    id: 'O11', tipo: 'valor', condicional: true,
    que: 'la respuesta de «¿Cuánto cuesta?» de 4-textos §5, en las páginas de FAQ_PRECIO cuya vitrina tiene una tarjeta con precio (data-tienda-con-precio)',
    aplicar(c) {
      for (const [rel, tipo] of Object.entries(c.textos.FAQ_PRECIO)) {
        if (!existe(c.sitio, rel)) throw new Error(`O11: ${rel} no existe`);
        const html = leer(c.sitio, rel);
        if (!PREGUNTA_PRECIO.test(html)) throw new Error(`O11: ${rel} no tiene la pregunta del precio`);
        const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
        if (/¿Cuánto cuesta\?|How much does it cost\?|Quanto custa\?/.test(jsonld)) {
          throw new Error(`O11: ${rel} repite la pregunta en su JSON-LD; O11 no sabe reemplazarla ahí`);
        }
        // Sólo si la vitrina tiene una tarjeta con precio (7-contrato-overlay.md, pedido 3).
        if (!/\bdata-tienda-con-precio\b/.test(zonaTienda(html))) continue;
        const respuesta = c.textos.RESPUESTA_PRECIO[idiomaDe(html)]?.[tipo];
        if (!respuesta) throw new Error(`O11: falta el texto ${idiomaDe(html)}/${tipo}`);
        c.editar(rel, (h) => h.replace(PREGUNTA_PRECIO, (_, a, __, z) => `${a}${respuesta}${z}`));
      }
    },
  },
  {
    id: 'O5', tipo: 'valor',
    que: 'robots.txt: Allow: / sin la línea Sitemap (un Disallow escondería el noindex)',
    aplicar(c) { c.editar('robots.txt', () => 'User-agent: *\nAllow: /\n'); },
  },
  {
    id: 'O7', tipo: 'valor y solo-demo',
    que: '_headers: X-Robots-Tag en /* y los hosts de producción de Apacheta cambiados por los de la demo',
    aplicar(c) {
      c.editar('_headers', (h) => {
        if (!/^\/\*\n/m.test(h)) throw new Error('O7: _headers no tiene el bloque /*');
        return h.replace(/^\/\*\n/m, '/*\n  X-Robots-Tag: noindex, nofollow\n')
          .split(APACHETA.produccion.app).join(c.perfil.tienda.app)
          .split(APACHETA.produccion.sitio).join(c.perfil.tienda.sitio);
      });
    },
  },
];

// Fuera de sitio/: O8 y O9.
export const NETLIFY_TOML = `# Sólo la demo (scripts/demo.mjs armar, O8). Producción no tiene netlify.toml.
[build]
  publish = "sitio"
  edge_functions = "netlify/edge-functions"

[[edge_functions]]
  function = "llave"
  path = "/*"
  excludedPath = ["/assets/*", "/robots.txt"]
`;

const huellaArchivo = (raiz, rel) => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, rel))).digest('hex');

// Aplica el manifiesto sobre <salida>/sitio (que ya tiene el árbol del sha) y
// escribe O8, O9 y O10. Devuelve el registro que va en version-demo.json.
// `fuentes` es el checkout que corre este script: de ahí salen las piezas del
// mecanismo (demo/textos.mjs, demo/marca.css, demo/llave.mjs). Publicar exige
// HEAD = sha, así que son las del mismo sha; el contenido (páginas, vitrina,
// demo/sitio/**) sale siempre del árbol del sha.
export async function aplicarManifiesto({ salida, perfil, sha, ahora = new Date(), manifiesto = MANIFIESTO, fuentes = RAIZ }) {
  const sitio = path.join(salida, 'sitio');
  const textos = await import(pathToFileURL(path.join(fuentes, 'demo', 'textos.mjs')).href);
  const registro = [];
  const pendientes = [];
  for (const entrada of manifiesto) {
    const r = { id: entrada.id, cambiados: [], agregados: [], quitados: [] };
    const c = {
      sitio, perfil, textos, fuentes,
      cambiado: (rel) => { if (!r.cambiados.includes(rel) && !r.agregados.includes(rel)) r.cambiados.push(rel); },
      agregado: (rel) => { if (!r.agregados.includes(rel)) r.agregados.push(rel); },
      quitado: (rel) => r.quitados.push(rel),
      pendiente: (texto) => pendientes.push(texto),
      editar: (rel, fn) => {
        const antes = leer(sitio, rel);
        const despues = fn(antes);
        if (despues !== antes) { escribir(sitio, rel, despues); c.cambiado(rel); }
      },
    };
    await entrada.aplicar(c);
    registro.push(r);
  }
  // O8 y O9: la configuración de Netlify y la puerta, al lado de sitio/.
  escribir(salida, 'netlify.toml', NETLIFY_TOML);
  escribir(salida, 'netlify/edge-functions/llave.js', leer(fuentes, 'demo/llave.mjs'));
  // O10: qué sha es y qué cambió, para QA y para comprobar.
  registro.push({ id: 'O10', cambiados: [], agregados: ['version-demo.json'], quitados: [] });
  const version = { sha, perfil: perfil.nombre, armado: ahora.toISOString(), manifiesto: registro, pendientes };
  escribir(sitio, 'version-demo.json', `${JSON.stringify(version, null, 2)}\n`);
  return version;
}

// Rutas que el manifiesto declara haber tocado.
export const rutasDelRegistro = (registro) => new Set(registro.flatMap((r) => [...r.cambiados, ...r.agregados, ...r.quitados]));

// ---------------------------------------------------------------------------
// Guardias de la salida (G6–G9 de 3b §2). Devuelve la lista de problemas.
// ---------------------------------------------------------------------------
export function verificarSalida({ salida, origen, perfil, manifiesto = MANIFIESTO, fuentes = RAIZ }) {
  const problemas = [];
  const sitio = path.join(salida, 'sitio');
  const mal = (texto) => problemas.push(texto);
  if (!fs.existsSync(path.join(sitio, 'version-demo.json'))) return ['falta sitio/version-demo.json (O10)'];
  const version = JSON.parse(leer(sitio, 'version-demo.json'));
  const internos = internosDe(leer(sitio, '_redirects'));
  const servidos = archivosDe(sitio).filter((rel) => !esInterno(rel, internos) && esTexto(rel));

  // G6: la demo siempre se esconde.
  for (const rel of paginasDe(sitio)) {
    const html = leer(sitio, rel);
    if (!html.includes(META_NOINDEX)) mal(`G6 ${rel}: sin ${META_NOINDEX}`);
    if ((html.match(/<meta name="robots"/g) || []).length !== 1) mal(`G6 ${rel}: más de un meta robots`);
    if (!html.includes(`class="${CLASE_FRANJA}"`)) mal(`G6 ${rel}: sin la franja de la demo`);
    if (!/<title>\[Demo\] /.test(html)) mal(`G6 ${rel}: el <title> no empieza con «[Demo] »`);
    if (!html.includes('<style id="demo-marca">.demo-franja{')) mal(`G6 ${rel}: sin el estilo de la franja`);
  }
  const headers = leer(sitio, '_headers');
  if (!/^\/\*\n(?:[ \t]+\S[^\n]*\n)*?[ \t]+X-Robots-Tag: noindex, nofollow\n/m.test(headers)) mal('G6 _headers: sin X-Robots-Tag: noindex, nofollow en /*');
  for (const rel of ['sitemap.xml', `${claveIndexNow(sitio)}.txt`]) if (existe(sitio, rel)) mal(`G6 ${rel}: la demo no lo lleva`);
  for (const rel of archivosDe(sitio)) if (/^google[0-9a-f]+\.html$/.test(rel)) mal(`G6 ${rel}: la demo no lleva el archivo de Search Console`);
  const robots = leer(sitio, 'robots.txt');
  if (/^Sitemap:/mi.test(robots)) mal('G6 robots.txt: con Sitemap:');
  if (/^Disallow:\s*\/\s*$/mi.test(robots)) mal('G6 robots.txt: Disallow: / esconde el noindex');
  if (!/^Allow: \/$/m.test(robots)) mal('G6 robots.txt: sin Allow: /');
  for (const rel of servidos) if (leer(sitio, rel).includes(GA4_PRODUCCION)) mal(`G6 ${rel}: lleva el GA4 de producción`);
  if (!existe(salida, 'netlify.toml') || leer(salida, 'netlify.toml') !== NETLIFY_TOML) mal('G6 netlify.toml: falta o no es el de O8');
  if (!existe(salida, 'netlify/edge-functions/llave.js')) mal('G6 netlify/edge-functions/llave.js: falta la puerta (O9)');
  else if (leer(salida, 'netlify/edge-functions/llave.js') !== leer(fuentes, 'demo/llave.mjs')) mal('G6 llave.js no es copia de demo/llave.mjs');
  if (existe(sitio, 'netlify') || existe(sitio, 'netlify.toml')) mal('G6 sitio/: netlify/ o netlify.toml dentro de lo publicado');

  // G7: la demo nunca apunta a la Apacheta de producción.
  if (perfil.tienda.app !== APACHETA.demo.app || perfil.tienda.sitio !== APACHETA.demo.sitio) {
    mal(`G7 perfil demo: app/sitio tienen que ser ${APACHETA.demo.app} y ${APACHETA.demo.sitio}`);
  }
  for (const rel of servidos) {
    const texto = leer(sitio, rel);
    if (/\bgetapacheta\.com/.test(texto)) mal(`G7 ${rel}: nombra un host de producción de Apacheta`);
  }
  const csp = (headers.match(/Content-Security-Policy-Report-Only: ([^\n]+)/) || [])[1] || '';
  const directiva = (n) => ((csp.match(new RegExp(`(?:^|; )${n} ([^;]+)`)) || [])[1] || '').split(/\s+/);
  // Si algo de lo servido carga de la demo de Apacheta (la vitrina o el chat),
  // la política tiene que nombrar esos hosts (contrato de Apacheta §3.1).
  const cargaApacheta = servidos.some((rel) => rel !== '_headers' && rel !== 'version-demo.json'
    && [perfil.tienda.app, perfil.tienda.sitio].some((h) => leer(sitio, rel).includes(h)));
  if (cargaApacheta) {
    if (!directiva('script-src').includes(perfil.tienda.app)) mal('G7 _headers: script-src sin el APP de la demo');
    if (!directiva('frame-src').includes(perfil.tienda.app)) mal('G7 _headers: frame-src sin el APP de la demo');
    if (!directiva('connect-src').includes(perfil.tienda.sitio)) mal('G7 _headers: connect-src sin el SITIO de la demo');
  }

  // G8: demo = producción + manifiesto, ni más ni menos.
  if (origen) {
    const declaradas = rutasDelRegistro(version.manifiesto);
    const delOrigen = new Set(archivosDe(origen));
    const deLaDemo = new Set(archivosDe(sitio));
    const distintas = new Set();
    for (const rel of delOrigen) if (!deLaDemo.has(rel) || huellaArchivo(origen, rel) !== huellaArchivo(sitio, rel)) distintas.add(rel);
    for (const rel of deLaDemo) if (!delOrigen.has(rel)) distintas.add(rel);
    for (const rel of distintas) if (!declaradas.has(rel)) mal(`G8 ${rel}: cambia y no está en el manifiesto`);
    for (const rel of declaradas) if (!distintas.has(rel)) mal(`G8 ${rel}: el manifiesto lo declara y no cambió`);
  }
  for (const entrada of manifiesto) {
    const r = version.manifiesto.find((x) => x.id === entrada.id);
    if (!r) { mal(`G8 ${entrada.id}: no corrió`); continue; }
    if (!entrada.condicional && r.cambiados.length + r.agregados.length + r.quitados.length === 0) mal(`G8 ${entrada.id}: no cambió nada (${entrada.que})`);
  }
  const conocidas = new Set([...manifiesto.map((e) => e.id), 'O10']);
  for (const r of version.manifiesto) if (!conocidas.has(r.id)) mal(`G8 ${r.id}: entrada que no está en el manifiesto`);

  // O11 remite a «Precios y reserva» (#precios): en esas páginas el ancla
  // tiene que ser única y estar dentro de la vitrina.
  for (const rel of version.manifiesto.find((r) => r.id === 'O11')?.cambiados || []) {
    const html = leer(sitio, rel);
    if ((html.match(/\bid="precios"/g) || []).length !== 1 || !/\bid="precios"/.test(zonaTienda(html))) {
      mal(`G8 ${rel}: O11 enlaza a #precios y el ancla no es única o no está en la vitrina`);
    }
  }

  // G9: quien prueba no sale de la demo.
  for (const rel of paginasDe(sitio)) {
    for (const [, href] of leer(sitio, rel).matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      if (href.startsWith(HOST_PRODUCCION) || /^https?:\/\/(?:www\.)?lausof\.com(?:\/|$)/.test(href)) mal(`G9 ${rel}: enlace absoluto a producción ${href}`);
    }
  }
  return problemas;
}

// ---------------------------------------------------------------------------
// G11: ¿se puede publicar? Pura; publicar le pasa lo que midió.
// ---------------------------------------------------------------------------
export function motivosParaNoPublicar({ sitio, limpio, head, sha, enRama, problemas = [] }) {
  const motivos = [];
  if (!sitio || !sitio.id) motivos.push('sin sitio de destino');
  else {
    if (sitio.id === NETLIFY_PRODUCCION.id) motivos.push('el destino es el sitio de PRODUCCIÓN');
    if (!/demo/.test(sitio.nombre || '')) motivos.push(`el sitio «${sitio.nombre}» no tiene «demo» en el nombre`);
  }
  if (!/^[0-9a-f]{40}$/.test(sha || '')) motivos.push('el sha no es de 40 caracteres');
  if (!limpio) motivos.push('el árbol tiene cambios sin commitear');
  if (head !== sha) motivos.push(`HEAD (${head}) no es el sha a publicar (${sha})`);
  if (!enRama) motivos.push(`el sha no está en ${REF_RAMA}`);
  if (problemas.length) motivos.push(`${problemas.length} guardia(s) de la salida en rojo`);
  return motivos;
}

// ---------------------------------------------------------------------------
// git
// ---------------------------------------------------------------------------
const git = (...args) => execFileSync('git', ['-C', RAIZ, ...args], { encoding: 'utf8' }).trim();

export const resolverSha = (ref) => git('rev-parse', '--verify', `${ref}^{commit}`);

// ¿El sha es la punta de origin/rediseno-agosto-2026 (o anterior, si se pide)?
export function shaEnRama(sha, { permitirAnterior = false } = {}) {
  const punta = resolverSha(REF_RAMA);
  if (sha === punta) return { ok: true, punta };
  if (!permitirAnterior) return { ok: false, punta, motivo: `${sha} no es la punta de ${REF_RAMA} (${punta}); --permitir-anterior para uno anterior` };
  const r = spawnSync('git', ['-C', RAIZ, 'merge-base', '--is-ancestor', sha, punta]);
  return r.status === 0 ? { ok: true, punta } : { ok: false, punta, motivo: `${sha} no está en ${REF_RAMA}` };
}

const extraer = (sha, destino) => new Promise((resolve, reject) => {
  fs.mkdirSync(destino, { recursive: true });
  const archivo = spawn('git', ['-C', RAIZ, 'archive', '--format=tar', sha], { stdio: ['ignore', 'pipe', 'inherit'] });
  const tar = spawn('tar', ['-x', '-f', '-', '-C', destino], { stdio: ['pipe', 'inherit', 'inherit'] });
  archivo.stdout.pipe(tar.stdin);
  let fallo = null;
  archivo.on('close', (code) => { if (code !== 0) fallo = new Error(`git archive salió con ${code}`); });
  tar.on('close', (code) => (fallo || code !== 0 ? reject(fallo || new Error(`tar salió con ${code}`)) : resolve()));
});

// SHA-1 del contenido de cada archivo del árbol de un sha (lo que Netlify
// lista por archivo).
export function huellasDelSha(sha) {
  const lista = git('ls-tree', '-r', '-z', sha).split('\0').filter(Boolean).map((l) => {
    const [meta, rel] = l.split('\t');
    return { rel, blob: meta.split(' ')[2] };
  });
  const r = spawnSync('git', ['-C', RAIZ, 'cat-file', '--batch'], { input: `${lista.map((x) => x.blob).join('\n')}\n`, maxBuffer: 1 << 30 });
  const buf = r.stdout;
  const salida = new Map();
  let i = 0;
  for (const { rel } of lista) {
    const fin = buf.indexOf(10, i);
    const tam = Number(buf.subarray(i, fin).toString().split(' ')[2]);
    const contenido = buf.subarray(fin + 1, fin + 1 + tam);
    salida.set(rel, crypto.createHash('sha1').update(contenido).digest('hex'));
    i = fin + 1 + tam + 1;
  }
  return salida;
}

// ---------------------------------------------------------------------------
// armar
// ---------------------------------------------------------------------------
export async function armar({ sha, salida, permitirAnterior = false, perfil = perfilDe('demo') }) {
  if (!salida) throw new Error('falta --salida <carpeta nueva>');
  if (fs.existsSync(salida)) throw new Error(`${salida} ya existe: armar sólo escribe en una carpeta nueva`);
  const completo = resolverSha(sha);
  if (completo !== sha) throw new Error(`--sha tiene que ser el sha de 40 caracteres (${sha} → ${completo})`);
  const rama = shaEnRama(sha, { permitirAnterior });
  if (!rama.ok) throw new Error(rama.motivo);
  await extraer(sha, path.join(salida, 'sitio'));
  return aplicarManifiesto({ salida, perfil, sha });
}

// El árbol de referencia (producción) para G8: el mismo git archive, aparte.
async function origenPara(sha, salida) {
  const origen = path.join(salida, 'produccion');
  await extraer(sha, origen);
  return origen;
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

async function netlify(ruta, { metodo = 'GET', cuerpo } = {}) {
  const r = await fetch(`https://api.netlify.com/api/v1${ruta}`, {
    method: metodo,
    headers: { authorization: `Bearer ${tokenNetlify()}`, ...(cuerpo ? { 'content-type': 'application/json' } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = null; }
  return { status: r.status, ok: r.ok, json };
}

// ---------------------------------------------------------------------------
// Llavero (la llave nunca va a argv ni a la salida)
// ---------------------------------------------------------------------------
export function leerLlave(p = perfilDe('demo')) {
  const r = spawnSync('security', ['find-generic-password', '-s', p.llave.servicio, '-a', p.llave.cuenta, '-w'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function guardarLlave(valor, p) {
  // security -i lee el comando por stdin: la llave no aparece en la lista de procesos.
  const r = spawnSync('security', ['-i'], { input: `add-generic-password -U -s ${p.llave.servicio} -a ${p.llave.cuenta} -w ${valor}\n`, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('no se pudo guardar la llave en el Llavero');
  if (leerLlave(p) !== valor) throw new Error('el Llavero no devolvió la llave recién guardada');
}

async function llaveNueva() {
  const p = perfilDe('demo');
  const valor = crypto.randomBytes(32).toString('hex');
  const sitio = await netlify(`/sites/${p.netlify.id}`);
  if (!sitio.ok) throw new Error(`no se pudo leer el sitio de la demo (${sitio.status})`);
  if (sitio.json.id === NETLIFY_PRODUCCION.id || !/demo/.test(sitio.json.name)) throw new Error('el sitio de la llave no es el de la demo');
  const cuenta = sitio.json.account_id;
  const variable = p.llave.variable;
  const cuerpo = { key: variable, values: [{ value: valor, context: 'all' }] };
  const hay = await netlify(`/accounts/${cuenta}/env/${variable}?site_id=${p.netlify.id}`);
  const r = hay.ok
    ? await netlify(`/accounts/${cuenta}/env/${variable}?site_id=${p.netlify.id}`, { metodo: 'PUT', cuerpo })
    : await netlify(`/accounts/${cuenta}/env?site_id=${p.netlify.id}`, { metodo: 'POST', cuerpo: [cuerpo] });
  if (!r.ok) throw new Error(`Netlify no aceptó la variable ${variable} (${r.status})`);
  guardarLlave(valor, p);
  console.log(`llave nueva: Llavero ${p.llave.servicio}/${p.llave.cuenta} y variable ${variable} del sitio ${p.netlify.nombre}.`);
  console.log('La edge function la lee en el próximo deploy: node scripts/demo.mjs publicar --sha <sha40 publicado>.');
}

// ---------------------------------------------------------------------------
// publicar
// ---------------------------------------------------------------------------
async function publicar({ sha, salida, permitirAnterior }) {
  const p = perfilDe('demo');
  if (!sha) throw new Error('falta --sha <sha40>');
  const destino = salida || path.join(os.tmpdir(), `lausof-demo-${sha.slice(0, 12)}-${Date.now()}`);
  const limpio = git('status', '--porcelain') === '';
  const head = git('rev-parse', 'HEAD');
  const rama = shaEnRama(sha, { permitirAnterior });
  const sitio = await netlify(`/sites/${p.netlify.id}`);
  const destinoSitio = sitio.ok ? { id: sitio.json.id, nombre: sitio.json.name } : null;
  const previos = motivosParaNoPublicar({ sitio: destinoSitio, limpio, head, sha, enRama: rama.ok });
  if (previos.length) throw new Error(`no se publica:\n  - ${previos.join('\n  - ')}`);
  const version = await armar({ sha, salida: destino, permitirAnterior, perfil: p });
  const origen = await origenPara(sha, destino);
  const problemas = verificarSalida({ salida: destino, origen, perfil: p });
  const motivos = motivosParaNoPublicar({ sitio: destinoSitio, limpio, head, sha, enRama: rama.ok, problemas });
  for (const x of problemas) console.error(`ROJO ${x}`);
  if (motivos.length) throw new Error(`no se publica:\n  - ${motivos.join('\n  - ')}`);
  for (const x of version.pendientes) console.log(`PENDIENTE ${x}`);
  console.log(`armado en ${destino}; deploy al sitio ${destinoSitio.nombre} (${destinoSitio.id})`);
  const r = spawnSync('npx', ['--yes', 'netlify-cli', 'deploy', '--prod', '--no-build', '--dir', 'sitio',
    '--site', destinoSitio.id, '--message', `demo ${sha}`], { cwd: destino, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`el deploy de Netlify salió con ${r.status}`);
  console.log(`publicado: ${p.host} = ${sha} + manifiesto. Siguiente: node scripts/demo.mjs comprobar --sha ${sha}`);
}

// ---------------------------------------------------------------------------
// comprobar (sólo lecturas)
// ---------------------------------------------------------------------------
// Cómo lista Netlify los archivos de un deploy (medido el 06/11/2026 contra los
// dos sitios): todas las rutas en minúsculas (README.md → /readme.md); sin los
// que empiezan con punto (el CLI no los sube); sin _headers ni _redirects (son
// reglas, no archivos), y con un /netlify.toml que arma Netlify con la
// configuración procesada (no se sirve: 404). Las comparaciones van en
// minúsculas y dejan afuera esos tres.
const NO_LISTADOS = (rel) => rel.startsWith('.') || rel.includes('/.') || ['_headers', '_redirects', 'netlify.toml'].includes(rel);
const ruta = (rel) => rel.toLowerCase();

export async function comprobar({ sha }) {
  const p = perfilDe('demo');
  const lineas = [];
  const verde = (t) => lineas.push(`VERDE ${t}`);
  const rojo = (t) => lineas.push(`ROJO  ${t}`);
  for (const x of p.pendientes) rojo(`PENDIENTE ${x}`);
  if (!p.tienda.clave) rojo('PENDIENTE tienda.clave es null: la demo no tiene chat');

  const objetivo = sha || resolverSha(REF_RAMA);
  const listar = async (id) => {
    const s = await netlify(`/sites/${id}`);
    if (!s.ok) return { error: `sitio ${id}: ${s.status}` };
    const deploy = s.json.published_deploy;
    const f = await netlify(`/sites/${id}/files`);
    if (!f.ok || !Array.isArray(f.json)) return { error: `archivos de ${id}: ${f.status}` };
    return { sitio: s.json, deploy, archivos: new Map(f.json.map((x) => [x.path.replace(/^\//, ''), x.sha])) };
  };

  // C1: producción = el sha.
  const prod = await listar(NETLIFY_PRODUCCION.id);
  if (prod.error) rojo(`C1 producción: ${prod.error}`);
  else {
    const esperado = huellasDelSha(objetivo);
    const faltan = []; const sobran = []; const distintos = [];
    const esperadas = new Map([...esperado].map(([rel, h]) => [ruta(rel), h]));
    for (const [rel, h] of esperadas) {
      if (NO_LISTADOS(rel)) continue;
      if (!prod.archivos.has(rel)) faltan.push(rel);
      else if (prod.archivos.get(rel) !== h) distintos.push(rel);
    }
    for (const rel of prod.archivos.keys()) if (!esperadas.has(rel) && !NO_LISTADOS(rel)) sobran.push(rel);
    const n = faltan.length + sobran.length + distintos.length;
    if (n === 0) verde(`C1 producción (deploy ${prod.deploy?.id}) = ${objetivo}, ${prod.archivos.size} archivos`);
    else rojo(`C1 producción ≠ ${objetivo}: ${distintos.length} distintos, ${faltan.length} faltan, ${sobran.length} sobran (p. ej. ${[...distintos, ...faltan, ...sobran].slice(0, 5).join(', ')})`);
  }

  // C3: en vivo. La llave sale del Llavero y queda en este proceso.
  const llave = leerLlave(p);
  const pedir = (url, opciones = {}) => fetch(url, { redirect: 'manual', ...opciones });
  const raizProd = await pedir(`${HOST_PRODUCCION}/`);
  const htmlProd = await raizProd.text();
  if (raizProd.status === 200 && !raizProd.headers.get('x-robots-tag') && !htmlProd.includes(CLASE_FRANJA) && htmlProd.includes(GA4_PRODUCCION)) {
    verde('C3 www.lausof.com/: 200, sin X-Robots-Tag, sin la franja, con el GA4 de producción');
  } else rojo(`C3 www.lausof.com/: ${raizProd.status}, X-Robots-Tag=${raizProd.headers.get('x-robots-tag')}, franja=${htmlProd.includes(CLASE_FRANJA)}, GA4=${htmlProd.includes(GA4_PRODUCCION)}`);

  // Los internos con mayúsculas se sirven en minúsculas (ver NO_LISTADOS).
  const internosProd = await Promise.all(['/readme.md', '/claude.md'].map(async (r) => [r, (await pedir(`${HOST_PRODUCCION}${r}`)).status]));
  if (internosProd.every(([, st]) => st === 404)) verde('C3 www.lausof.com: /readme.md y /claude.md dan 404');
  else rojo(`C3 www.lausof.com: ${internosProd.map(([r, st]) => `${r} ${st}`).join(', ')} (internos a la vista; regla 404! en minúsculas)`);

  const sinLlave = await pedir(`${p.host}/`);
  if (sinLlave.status === 401 && /noindex/.test(sinLlave.headers.get('x-robots-tag') || '')) verde('C3 demo / sin llave: 401 con X-Robots-Tag');
  else rojo(`C3 demo / sin llave: ${sinLlave.status}, X-Robots-Tag=${sinLlave.headers.get('x-robots-tag')}`);

  let version = null;
  if (!llave) rojo(`C3 demo con llave: no hay llave en el Llavero (${p.llave.servicio}); node scripts/demo.mjs llave-nueva`);
  else {
    const entrada = await pedir(`${p.host}/?llave=${encodeURIComponent(llave)}`);
    const cookie = (entrada.headers.get('set-cookie') || '').split(';')[0];
    const destino = entrada.headers.get('location');
    if (entrada.status === 302 && cookie && destino === '/') verde('C3 demo ?llave=: 302 a / sin la llave, con cookie');
    else rojo(`C3 demo ?llave=: ${entrada.status}, location=${destino}, cookie=${Boolean(cookie)}`);
    const conCookie = (ruta) => pedir(`${p.host}${ruta}`, { headers: { cookie } });
    const raiz = await conCookie('/');
    const html = await raiz.text();
    const okRaiz = raiz.status === 200 && /noindex/.test(raiz.headers.get('x-robots-tag') || '') && html.includes(CLASE_FRANJA)
      && !html.includes(GA4_PRODUCCION) && (p.ga4 ? html.includes(p.ga4) : !html.includes('googletagmanager.com/gtag'));
    if (okRaiz) verde(`C3 demo / con cookie: 200, X-Robots-Tag, franja, ${p.ga4 ? `GA4 ${p.ga4}` : 'sin GA4'}`);
    else rojo(`C3 demo / con cookie: ${raiz.status}, X-Robots-Tag=${raiz.headers.get('x-robots-tag')}, franja=${html.includes(CLASE_FRANJA)}, GA4 prod=${html.includes(GA4_PRODUCCION)}`);
    const sitemap = await conCookie('/sitemap.xml');
    const robots = await conCookie('/robots.txt');
    const robotsTexto = await robots.text();
    const indexnow = await conCookie('/d1eb0835b80b7ebe76ad80c22dc86589.txt');
    if (sitemap.status === 404 && robots.status === 200 && !/Sitemap:/i.test(robotsTexto) && indexnow.status === 404) verde('C3 demo: sitemap 404, robots sin Sitemap, IndexNow 404');
    else rojo(`C3 demo: sitemap ${sitemap.status}, robots ${robots.status} Sitemap=${/Sitemap:/i.test(robotsTexto)}, IndexNow ${indexnow.status}`);
    const v = await conCookie('/version-demo.json');
    if (v.status === 200) {
      version = await v.json();
      if (version.sha === objetivo) verde(`C3 demo version-demo.json: sha ${version.sha}`);
      else rojo(`C3 demo version-demo.json: sha ${version.sha}, se esperaba ${objetivo} (demo atrasada)`);
    } else rojo(`C3 demo version-demo.json: ${v.status}`);
  }

  // C2: demo = producción + manifiesto.
  const demo = await listar(p.netlify.id);
  if (demo.error) rojo(`C2 demo: ${demo.error}`);
  else if (!prod.error && version) {
    const declaradas = new Set([...rutasDelRegistro(version.manifiesto)].map(ruta));
    const distintas = new Set();
    for (const [rel, h] of prod.archivos) if (demo.archivos.get(rel) !== h) distintas.add(rel);
    for (const rel of demo.archivos.keys()) if (!prod.archivos.has(rel)) distintas.add(rel);
    const deMas = [...distintas].filter((rel) => !declaradas.has(rel) && !NO_LISTADOS(rel));
    const deMenos = [...declaradas].filter((rel) => !distintas.has(rel) && !NO_LISTADOS(rel));
    if (!deMas.length && !deMenos.length) verde(`C2 demo = producción + manifiesto (${distintas.size} rutas declaradas)`);
    else rojo(`C2 demo ≠ producción + manifiesto: ${deMas.length} sin declarar (${deMas.slice(0, 5).join(', ')}), ${deMenos.length} declaradas sin cambio (${deMenos.slice(0, 5).join(', ')})`);
  } else rojo('C2 demo = producción + manifiesto: no se pudo comparar (falta producción o version-demo.json)');

  // C4: el catálogo de la demo de Apacheta.
  try {
    const cat = await fetch(`${p.tienda.sitio}/api/publico/${p.tienda.empresa}/catalogo?idioma=es`, { headers: { origin: p.host }, redirect: 'manual' });
    const acao = cat.headers.get('access-control-allow-origin');
    const json = cat.status === 200 ? await cat.json().catch(() => null) : null;
    if (json && json.demo === true && acao === p.host) verde(`C4 catálogo de la demo: "demo": true, CORS para ${p.host}`);
    else rojo(`C4 catálogo de la demo (${p.tienda.sitio}): ${cat.status}, demo=${json?.demo}, Access-Control-Allow-Origin=${acao}`);
  } catch (e) {
    rojo(`C4 catálogo de la demo (${p.tienda.sitio}): sin respuesta (${e.cause?.code || e.message})`);
  }

  for (const l of lineas) console.log(l);
  return lineas;
}

// ---------------------------------------------------------------------------
// Línea de comandos
// ---------------------------------------------------------------------------
const opciones = (args) => {
  const o = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--sha') o.sha = args[++i];
    else if (args[i] === '--salida') o.salida = args[++i] && path.resolve(args[i]);
    else if (args[i] === '--permitir-anterior') o.permitirAnterior = true;
    else throw new Error(`opción desconocida: ${args[i]}`);
  }
  return o;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [orden, ...resto] = process.argv.slice(2);
  try {
    const o = opciones(resto);
    if (orden === 'armar') {
      const version = await armar(o);
      const origen = await origenPara(o.sha, o.salida);
      const problemas = verificarSalida({ salida: o.salida, origen, perfil: perfilDe('demo') });
      for (const r of version.manifiesto) console.log(`${r.id}: ${r.cambiados.length} cambiados, ${r.agregados.length} agregados, ${r.quitados.length} quitados`);
      for (const x of version.pendientes) console.log(`PENDIENTE ${x}`);
      for (const x of problemas) console.log(`ROJO ${x}`);
      console.log(problemas.length ? `${problemas.length} guardia(s) en rojo` : `salida en ${o.salida}: guardias G6–G9 en verde`);
      process.exitCode = problemas.length ? 1 : 0;
    } else if (orden === 'publicar') await publicar(o);
    else if (orden === 'comprobar') {
      const lineas = await comprobar(o);
      process.exitCode = lineas.some((l) => l.startsWith('ROJO')) ? 1 : 0;
    } else if (orden === 'llave-nueva') await llaveNueva();
    else {
      console.error('uso: node scripts/demo.mjs <armar|publicar|comprobar|llave-nueva> [--sha <sha40>] [--salida <carpeta nueva>] [--permitir-anterior]');
      process.exitCode = 64;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
