/* =============================================================================
   EL AVISO DE PRIVACIDAD — node scripts/privacidad.mjs [--comprobar | vigencia [--fecha AAAA-MM-DD]]
   -----------------------------------------------------------------------------
   /privacidad.html, /en/privacy.html y /pt/privacidade.html (Ley 25.326
   art. 6). Diseño, textos y auditorías: ~/lausof/web/privacidad-2026-11-05/
   (4-textos.md §1, 7-auditoria-build.md B1 y B2).

   1. Lo que el aviso dice sigue a lo que el sitio tiene (auditoría B1).
      El asistente, la reserva en línea y el pago con Mercado Pago existen
      sólo con `perfil.tienda.activa` (scripts/entorno.mjs). Las tres frases
      que los nombran viven acá, en TEXTOS, y se escriben en las zonas
      <!-- GENERADO:AVISO <nombre> --> de las tres páginas:
        · sin la vitrina (producción hoy): el texto P1 de 4-textos §1 y la
          línea de Apacheta de su nota del 06/11 («…recibe, por cuenta de
          Lausof, los correos.»), sin párrafo de Mercado Pago;
        · con la vitrina (la demo, y producción el día que se encienda): las
          frases del asistente, las reservas en línea y Mercado Pago.
      `node scripts/privacidad.mjs` escribe las zonas del árbol con el perfil
      de producción; `--comprobar` sale con 1 si no coinciden. La demo las
      cambia con O13 (scripts/demo.mjs). tests/privacidad.test.js ata el
      texto rastreado a `PERFILES.produccion.tienda.activa`.
   2. «Vigente desde» es el día en que el texto se publica (auditoría B2).
      `node scripts/privacidad.mjs vigencia` pone hoy (en Salta) en las tres
      páginas, cada una en su formato; va en el commit del deploy.
      `publicacion.mjs publicar` rehúsa si el texto difiere del publicado y
      las fechas no son hoy en Salta (motivosDelAviso).
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { perfil as perfilDe } from './entorno.mjs';

export const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export const AVISOS = { es: 'privacidad.html', en: 'en/privacy.html', pt: 'pt/privacidade.html' };
export const ZONAS = ['consultas', 'apacheta', 'pago'];
export const ZONA_HORARIA = 'America/Argentina/Salta';

// `base`: sin la vitrina. `tienda`: con la vitrina. Una zona vacía es ''.
export const TEXTOS = {
  es: {
    consultas: {
      base: '<p><b>Consultas.</b> Lo que se escribe por WhatsApp o por correo, o se dice por teléfono, se usa para responder, cotizar y prestar el servicio.</p>',
      tienda: '<p><b>Consultas y reservas.</b> Lo que se escribe por WhatsApp o por correo, o se dice por teléfono, se usa para responder, cotizar y prestar el servicio. Si se usa el asistente del sitio o se reserva en línea, se guardan además la conversación, la página desde la que se escribe y de dónde llegó la visita, y los datos de la reserva: el nombre, un correo o WhatsApp y los datos del servicio. Se usan para responder, confirmar la reserva y gestionar las solicitudes de cancelación.</p>',
    },
    apacheta: {
      base: '<li><b>Apacheta:</b> el sistema de gestión que recibe, por cuenta de Lausof, los correos.</li>',
      tienda: '<li><b>Apacheta:</b> el sistema de gestión que recibe, por cuenta de Lausof, los correos, las conversaciones del asistente y las reservas en línea.</li>',
    },
    pago: {
      base: '',
      tienda: '<p>Si se paga en línea, el pago lo procesa Mercado Pago, que es responsable de esos datos según su <a href="https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/31199" target="_blank" rel="noopener">aviso de privacidad</a>.</p>',
    },
  },
  en: {
    consultas: {
      base: '<p><b>Inquiries.</b> What you write by WhatsApp or email, or say by phone, is used to reply, to quote and to provide the service.</p>',
      tienda: '<p><b>Inquiries and bookings.</b> What you write by WhatsApp or email, or say by phone, is used to reply, to quote and to provide the service. If you use the site’s assistant or book online, the conversation, the page it was written from and where the visit came from are also kept, together with the booking details: a name, an email or WhatsApp number and the service details. They are used to reply, to confirm the booking and to handle cancellation requests.</p>',
    },
    apacheta: {
      base: '<li><b>Apacheta:</b> the management system that receives, on Lausof’s behalf, the emails.</li>',
      tienda: '<li><b>Apacheta:</b> the management system that receives, on Lausof’s behalf, the emails, the assistant’s conversations and online bookings.</li>',
    },
    pago: {
      base: '',
      tienda: '<p>If you pay online, the payment is processed by Mercado Pago, which is responsible for that data under its <a href="https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/31199" target="_blank" rel="noopener">privacy notice</a> (in Spanish).</p>',
    },
  },
  pt: {
    consultas: {
      base: '<p><b>Consultas.</b> O que se escreve por WhatsApp ou e-mail, ou se diz por telefone, é usado para responder, fazer o orçamento e prestar o serviço.</p>',
      tienda: '<p><b>Consultas e reservas.</b> O que se escreve por WhatsApp ou e-mail, ou se diz por telefone, é usado para responder, fazer o orçamento e prestar o serviço. Ao usar o assistente do site ou reservar on-line, ficam registrados também a conversa, a página de onde se escreve e de onde veio a visita, além dos dados da reserva: o nome, um e-mail ou WhatsApp e os dados do serviço. Servem para responder, confirmar a reserva e atender as solicitações de cancelamento.</p>',
    },
    apacheta: {
      base: '<li><b>Apacheta:</b> o sistema de gestão que recebe, em nome da Lausof, os e-mails.</li>',
      tienda: '<li><b>Apacheta:</b> o sistema de gestão que recebe, em nome da Lausof, os e-mails, as conversas do assistente e as reservas on-line.</li>',
    },
    pago: {
      base: '',
      tienda: '<p>Se o pagamento for on-line, quem o processa é o Mercado Pago, responsável por esses dados segundo seu <a href="https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/31199" target="_blank" rel="noopener">aviso de privacidade</a> (em espanhol).</p>',
    },
  },
};

// Lo que sólo puede decirse con la vitrina encendida: el asistente, lo «en
// línea» y Mercado Pago, en los tres idiomas. La prueba de acople lo busca en
// el texto visible del aviso.
export const SOLO_CON_TIENDA = /as+istente|assistant|Mercado Pago|en línea|online|on-line/i;

const MARCA = (nombre) => `<!-- GENERADO:AVISO ${nombre} — no editar a mano: editar scripts/privacidad.mjs y correr \`node scripts/privacidad.mjs\` -->`;
const CIERRE = '<!-- /GENERADO:AVISO -->';
const zonaRe = (nombre) => new RegExp(`^([ \\t]*)<!-- GENERADO:AVISO ${nombre} [^\\n]*-->\\n([\\s\\S]*?)^[ \\t]*<!-- \\/GENERADO:AVISO -->`, 'm');

/** Lo que va dentro de una zona, según la vitrina. Pura. */
export const textoDeZona = (idioma, nombre, activa) => TEXTOS[idioma][nombre][activa ? 'tienda' : 'base'];

/** Lo que hay hoy dentro de una zona de `html`, sin sangría; null si no está. */
export function zonaDe(html, nombre) {
  const m = html.match(zonaRe(nombre));
  return m ? m[2].split('\n').map((l) => l.trim()).filter(Boolean).join('\n') : null;
}

/** El aviso de `idioma` con sus zonas escritas para `activa`. Pura. */
export function conZonas(html, idioma, activa) {
  let salida = html;
  for (const nombre of ZONAS) {
    if (!zonaRe(nombre).test(salida)) throw new Error(`${AVISOS[idioma]}: falta la zona GENERADO:AVISO ${nombre}`);
    salida = salida.replace(zonaRe(nombre), (_, sangria) => {
      const dentro = textoDeZona(idioma, nombre, activa);
      return [`${sangria}${MARCA(nombre)}`, ...(dentro ? [`${sangria}${dentro}`] : []), `${sangria}${CIERRE}`].join('\n');
    });
  }
  return salida;
}

/** Las zonas que no dicen lo que `activa` pide, como lista de problemas. Pura. */
export function problemasDeZonas(html, idioma, activa) {
  return ZONAS.filter((nombre) => zonaDe(html, nombre) !== textoDeZona(idioma, nombre, activa))
    .map((nombre) => `${AVISOS[idioma]}: la zona ${nombre} no es la de tienda.activa=${activa} (correr node scripts/privacidad.mjs)`);
}

/** Escribe las zonas de los avisos que hay en `raiz` para `perfil`. Devuelve las rutas cambiadas. */
export function escribirAvisos({ raiz = RAIZ, perfil = perfilDe('produccion') } = {}) {
  const cambiados = [];
  for (const [idioma, rel] of Object.entries(AVISOS)) {
    const archivo = path.join(raiz, rel);
    const antes = fs.readFileSync(archivo, 'utf8');
    const despues = conZonas(antes, idioma, perfil.tienda.activa);
    if (despues !== antes) { fs.writeFileSync(archivo, despues); cambiados.push(rel); }
  }
  return cambiados;
}

// ---------------------------------------------------------------------------
// «Vigente desde» (auditoría B2)
// ---------------------------------------------------------------------------
const PREFIJO = { es: 'Vigente desde', en: 'In force since', pt: 'Em vigor desde' };
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const VIGENCIA = /<p class="vigencia">([^<]*)<\/p>/;

/** El día de hoy en Salta, AAAA-MM-DD. */
export const hoyEnSalta = (ahora = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);

/** La línea de vigencia de `idioma` para el día `iso` (AAAA-MM-DD). Pura. */
export function textoDeVigencia(idioma, iso) {
  const [a, m, d] = iso.split('-');
  if (idioma === 'en') return `${PREFIJO.en} ${MESES_EN[Number(m) - 1]} ${Number(d)}, ${a}`;
  return `${PREFIJO[idioma]} ${d}/${m}/${a}`;
}

/** El día que dice la línea de vigencia de `html`, AAAA-MM-DD, o null. Pura. */
export function vigenciaDe(html) {
  const linea = (String(html || '').match(VIGENCIA) || [])[1];
  if (!linea) return null;
  let m = linea.match(/^(?:Vigente desde|Em vigor desde) (\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = linea.match(/^In force since ([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (m && MESES_EN.includes(m[1])) return `${m[3]}-${String(MESES_EN.indexOf(m[1]) + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return null;
}

/** El aviso con su línea de vigencia en el día `iso`. Pura. */
export function conVigencia(html, idioma, iso) {
  if (!VIGENCIA.test(html)) throw new Error(`${AVISOS[idioma]}: falta <p class="vigencia">`);
  return html.replace(VIGENCIA, `<p class="vigencia">${textoDeVigencia(idioma, iso)}</p>`);
}

/** Lo que el aviso dice, sin la línea de vigencia: el texto visible de <div class="privacidad">. Pura. */
export function textoDelAviso(html) {
  const cuerpo = (String(html || '').match(/<div class="privacidad">([\s\S]*?)<\/div>\s*<\/article>/) || [])[1];
  if (cuerpo === undefined) return null;
  return cuerpo.replace(/<!--[\s\S]*?-->/g, '').replace(VIGENCIA, '').replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/**
 * ¿Se puede publicar el aviso así? Pura. Lista vacía = sí.
 * `exportados` y `enVivo`: { 'privacidad.html': html | null, … }; en vivo,
 * null es que la página no está publicada (404). `hoy`: AAAA-MM-DD en Salta.
 */
export function motivosDelAviso({ exportados, enVivo, hoy }) {
  const rels = Object.values(AVISOS);
  const presentes = rels.filter((rel) => exportados[rel]);
  if (presentes.length === 0) return [];
  const motivos = [];
  for (const rel of rels) if (!exportados[rel]) motivos.push(`${rel}: falta en lo que se publica y los otros avisos están`);
  const fechas = Object.fromEntries(presentes.map((rel) => [rel, vigenciaDe(exportados[rel])]));
  for (const [rel, f] of Object.entries(fechas)) if (!f) motivos.push(`${rel}: la línea «vigencia» no tiene una fecha que se pueda leer`);
  if (new Set(Object.values(fechas)).size > 1) {
    motivos.push(`las fechas de vigencia no son el mismo día (${presentes.map((rel) => `${rel} ${fechas[rel]}`).join(', ')})`);
  }
  for (const rel of presentes) {
    const vivo = enVivo[rel] || null;
    const cambia = !vivo || textoDelAviso(vivo) !== textoDelAviso(exportados[rel]);
    if (cambia && fechas[rel] && fechas[rel] !== hoy) {
      motivos.push(`${rel}: el texto cambia respecto de lo publicado${vivo ? '' : ' (hoy no está publicado)'} y dice vigente desde ${fechas[rel]}, no hoy en Salta (${hoy}). Correr node scripts/privacidad.mjs vigencia, commitear, empujar y publicar ese sha`);
    }
    if (!cambia && vivo && fechas[rel] && fechas[rel] !== vigenciaDe(vivo)) {
      motivos.push(`${rel}: la fecha de vigencia cambia (${vigenciaDe(vivo)} → ${fechas[rel]}) sin que cambie el texto`);
    }
  }
  return motivos;
}

/** Los avisos publicados en `host`: html con 200, null con 404; otro estado o un error de red, excepción. */
export async function avisosEnVivo(host, { traer = fetch } = {}) {
  const salida = {};
  for (const rel of Object.values(AVISOS)) {
    const r = await traer(`${host}/${rel}`, { redirect: 'follow' });
    if (r.status === 404) salida[rel] = null;
    else if (r.status === 200) salida[rel] = await r.text();
    else throw new Error(`${host}/${rel} respondió ${r.status}: sin eso no se sabe si el aviso cambia`);
  }
  return salida;
}

/** Los avisos de una carpeta (la exportación): html, o null si no está. */
export const avisosDe = (dir) => Object.fromEntries(Object.values(AVISOS)
  .map((rel) => [rel, fs.existsSync(path.join(dir, rel)) ? fs.readFileSync(path.join(dir, rel), 'utf8') : null]));

/** Lo que publicar corre antes del deploy: motivos para no publicar el aviso de `dir`. */
export async function revisarAviso({ dir, host, ahora = new Date(), traer = fetch }) {
  const exportados = avisosDe(dir);
  if (Object.values(exportados).every((h) => !h)) return [];
  let enVivo;
  try { enVivo = await avisosEnVivo(host, { traer }); } catch (e) { return [`aviso de privacidad: ${e.message}`]; }
  return motivosDelAviso({ exportados, enVivo, hoy: hoyEnSalta(ahora) });
}

/** Pone el día `iso` en las tres páginas de `raiz`. Devuelve las rutas cambiadas. */
export function escribirVigencia({ raiz = RAIZ, iso }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) throw new Error(`fecha inválida: ${iso} (AAAA-MM-DD)`);
  const cambiados = [];
  for (const [idioma, rel] of Object.entries(AVISOS)) {
    const archivo = path.join(raiz, rel);
    const antes = fs.readFileSync(archivo, 'utf8');
    const despues = conVigencia(antes, idioma, iso);
    if (despues !== antes) { fs.writeFileSync(archivo, despues); cambiados.push(rel); }
  }
  return cambiados;
}

// ---------------------------------------------------------------------------
// Línea de comandos
// ---------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  try {
    if (args[0] === 'vigencia') {
      const i = args.indexOf('--fecha');
      const iso = i >= 0 ? args[i + 1] : hoyEnSalta();
      const cambiados = escribirVigencia({ iso });
      console.log(`vigencia ${iso}: ${cambiados.length ? cambiados.join(', ') : 'sin cambios'}`);
    } else if (args[0] === '--comprobar') {
      const p = perfilDe('produccion');
      const problemas = Object.entries(AVISOS).flatMap(([idioma, rel]) => problemasDeZonas(fs.readFileSync(path.join(RAIZ, rel), 'utf8'), idioma, p.tienda.activa));
      for (const x of problemas) console.error(`ROJO ${x}`);
      process.exitCode = problemas.length ? 1 : 0;
    } else if (args.length === 0) {
      const cambiados = escribirAvisos();
      console.log(`zonas del aviso (tienda.activa=${perfilDe('produccion').tienda.activa}): ${cambiados.length ? cambiados.join(', ') : 'sin cambios'}`);
    } else {
      console.error('uso: node scripts/privacidad.mjs [--comprobar | vigencia [--fecha AAAA-MM-DD]]');
      process.exitCode = 64;
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
