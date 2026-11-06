/* =============================================================================
   PUERTA DE LA DEMO — edge function de Netlify (plan Free)
   -----------------------------------------------------------------------------
   Diseño: ~/lausof/web/demo-reservas-2026-11-06/3b-diseno-entorno.md §3.
   Este archivo vive en demo/ y NO en netlify/edge-functions/: el deploy de
   producción corre desde la raíz del repo y el CLI empaqueta las edge
   functions que encuentra ahí aunque se use --no-build (netlify/cli #7933).
   Sólo `node scripts/demo.mjs armar` lo copia al lado de la salida de la demo.

   - El enlace trae la llave una vez (?llave=…). Si es la correcta, se responde
     302 a la misma ruta sin la llave y con una cookie (HMAC de la llave,
     30 días, HttpOnly, Secure, SameSite=Lax). La llave nunca queda en la barra
     de direcciones, el historial ni un Referer.
   - Con la cookie correcta, la página pasa.
   - Todo lo demás recibe 401 con X-Robots-Tag. Sin la variable DEMO_LLAVE, o
     con una llave corta, también 401: la puerta falla cerrada.
   - Cambiar la llave (node scripts/demo.mjs llave-nueva) invalida todas las
     cookies, porque la cookie es la firma de la llave.

   `decidir` es pura (sin Netlify): tests/demo.test.js la importa con Node.
   ============================================================================= */

export const COOKIE = 'lausof_demo';
export const DURACION_COOKIE = 30 * 24 * 60 * 60;
export const LARGO_MINIMO = 32;

const codificar = new TextEncoder();
const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

const huella = async (texto) => hex(await crypto.subtle.digest('SHA-256', codificar.encode(texto)));

export const firmaDe = async (llave) => {
  const clave = await crypto.subtle.importKey('raw', codificar.encode(llave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', clave, codificar.encode('lausof-demo-acceso-v1')));
};

// Comparación de tiempo constante sobre textos del mismo largo.
const iguales = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i += 1) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
};

const leerCookie = (cabecera, nombre) => {
  for (const parte of String(cabecera || '').split(';')) {
    const i = parte.indexOf('=');
    if (i > -1 && parte.slice(0, i).trim() === nombre) return parte.slice(i + 1).trim();
  }
  return null;
};

const SIN_INDICE = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };

// 4-textos §7.4: una página, las tres líneas. Sin «acceso denegado», sin
// «privado», sin contacto: le dice qué hacer a quien tenía el enlace y nada a
// quien no.
export const PAGINA_401 = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Lausof</title>
<style>body{font-family:'Avenir Next',Helvetica,Arial,sans-serif;color:#1d2947;background:#fbfcfe;margin:0;padding:3rem 1rem;line-height:1.5}main{max-width:32rem;margin:0 auto}p{margin:0 0 .75rem}</style>
</head><body><main>
<p lang="es">Esta página se abre con el enlace de acceso completo.</p>
<p lang="en">This page opens with the full access link.</p>
<p lang="pt-BR">Esta página abre com o link de acesso completo.</p>
</main></body></html>
`;

const negar = () => new Response(PAGINA_401, {
  status: 401,
  headers: { ...SIN_INDICE, 'Content-Type': 'text/html; charset=utf-8' },
});

// Devuelve una Response (302 o 401) o null si la página pasa.
export async function decidir(request, { llave } = {}) {
  if (typeof llave !== 'string' || llave.length < LARGO_MINIMO) return negar();
  const url = new URL(request.url);
  const dada = url.searchParams.get('llave');
  if (dada !== null) {
    if (!iguales(await huella(dada), await huella(llave))) return negar();
    url.searchParams.delete('llave');
    const destino = `${url.pathname}${url.search}`;
    return new Response(null, {
      status: 302,
      headers: {
        ...SIN_INDICE,
        Location: destino,
        'Set-Cookie': `${COOKIE}=${await firmaDe(llave)}; Max-Age=${DURACION_COOKIE}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }
  const cookie = leerCookie(request.headers.get('cookie'), COOKIE);
  if (cookie && iguales(cookie, await firmaDe(llave))) return null;
  return negar();
}

// Envoltorio de Netlify: lee la llave del entorno del sitio de la demo.
export default async function puerta(request, context) {
  let llave;
  try {
    llave = globalThis.Netlify?.env?.get('DEMO_LLAVE');
  } catch {
    llave = undefined;
  }
  const respuesta = await decidir(request, { llave });
  return respuesta ?? context.next();
}
