/* =============================================================================
   VISTA DE REVISIÓN DE LA RESERVA Y EL CHAT — node scripts/vista.mjs [--comprobar | --quitar]
   -----------------------------------------------------------------------------
   Sólo para las copias de revisión de las rondas (rondas-2026-11-07, v3 en
   adelante). Lautaro, 07/11: las reservas en línea y el chat pueden verse
   funcionando, porque salen esta semana («yes… the plan is to go live with
   these this week»). Nada de esto llega a producción: el merge corre
   `node scripts/vista.mjs --quitar`, que deja cada página byte a byte como
   antes de la ronda 3, y borra vista/, js/vista.js, api/ y lausof/.

   Cómo se arma, sin rediseñar nada de la vitrina ni del chat:
   - La vitrina real: vista/tienda/ es una copia sin cambios de
     tienda-v2-0611 (scripts/tienda*.mjs, tienda.css, js/tienda.js; el sha en
     vista/tienda/ORIGEN). Este script corre su `transformarPagina` con un
     perfil local, así cada página lleva sus zonas GENERADO:TIENDA en el lugar
     exacto del contrato (ponerZonas) y con el contenido que escribe la
     vitrina. Los generadores del sitio ya conservan esas zonas (bloques,
     encabezado, versiones, prefill; menu.mjs desde esta ronda).
   - Dentro de cada zona, el contenido va entre <!-- RONDA:VISTA --> y
     <!-- /RONDA:VISTA -->: es lo que el merge saca (3-diseno §4.2).
   - Tres cambios sobre lo que escribe la vitrina, para la copia local:
     · el chat: en vez del botón real (la app), js/vista.js dibuja el mismo
       botón y un panel con los textos del chat real;
     · la carga: js/vista.js apunta la vitrina al catálogo de prueba que la
       copia sirve (/api/publico/lausof/catalogo, de
       tienda-v2-0611:tests/tienda-catalogo-demo.json, sin sus enlaces) y
       carga vista/tienda/js/tienda.js después del `load`;
     · la barra nueva lleva «vista-barra wa-bar» en vez de «wa-bar», así
       `<div class="wa-bar` sigue una vez por página.
     La hoja de la vitrina va sin su regla `--…-asistente-abajo` (js/vista.js
     mide la barra y pone el botón 12 px arriba); vista/vista.css la pide
     js/vista.js, fuera del <head>.
   - Ningún precio queda en un archivo: los dibuja la vitrina en el navegador
     con el catálogo de prueba, con su marca «PRECIOS DE PRUEBA».

     node scripts/vista.mjs              pone o actualiza la vista en las 82 páginas
     node scripts/vista.mjs --comprobar  sale con 1 si alguna no coincide
     node scripts/vista.mjs --quitar     la saca (para el merge)
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { version } from './versiones.mjs';
import { transformarPagina, leerPerfil } from '../vista/tienda/scripts/tienda.mjs';

export const SITIO = 'https://reservas.invalid';
const APP = 'https://chat.invalid';
export const ABRE_VISTA = '<!-- RONDA:VISTA -->';
export const CIERRA_VISTA = '<!-- /RONDA:VISTA -->';

const PERFIL = { nombre: 'vista', tienda: { activa: true, empresa: 'lausof', sitio: SITIO, app: APP, clave: 'vista-de-revision' } };

const ZONA = /<!-- GENERADO:TIENDA ([a-z0-9-]+) -->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/g;
const zonaRe = (nombre) => `<!-- GENERADO:TIENDA ${nombre} -->[\\s\\S]*?<!-- \\/GENERADO:TIENDA -->`;
const VISTA = /<!-- RONDA:VISTA -->[\s\S]*?<!-- \/RONDA:VISTA -->/g;

// Dónde pone cada zona `ponerZonas` (tienda.mjs) y qué espacio agrega: quitarla
// es sacar la zona con ese espacio. (antes, después)
const ESPACIO = {
  estilos: ['  ', '\n'], cabeza: ['', '\n[ \\t]*'], ir: ['', ''], 'hub-controles': ['', ''], hub: ['', '\n            '],
  pie: ['\n[ \\t]*', ''], barra: ['\n', ''], scripts: ['', '\n'],
};
const espacioDe = (nombre) => ESPACIO[nombre] || (/^bloque(-\d+)?$/.test(nombre) ? ['\n  ', ''] : null);

/** La página sin la vista: sin zonas TIENDA ni RONDA:VISTA, como antes de la ronda. Pura. */
export function quitar(html) {
  let out = html;
  // «destinos» envuelve el título que la página ya tenía: queda el título.
  out = out.replace(new RegExp(`<!-- GENERADO:TIENDA destinos -->([\\s\\S]*?)<!-- \\/GENERADO:TIENDA -->`, 'g'), (_, dentro) => dentro.replace(VISTA, ''));
  const nombres = [...new Set([...out.matchAll(ZONA)].map((m) => m[1]))];
  for (const nombre of nombres) {
    const e = espacioDe(nombre);
    if (!e) throw new Error(`zona TIENDA desconocida: ${nombre}`);
    out = out.replace(new RegExp(`${e[0]}${zonaRe(nombre)}${e[1]}`, 'g'), '');
  }
  if (/GENERADO:TIENDA|RONDA:VISTA/.test(out)) throw new Error('quedó una zona TIENDA o RONDA:VISTA sin sacar');
  return out;
}

let hoja = null;
/** La hoja de la vitrina sin la regla del botón del chat. */
function hojaDeLaVista(estilos) {
  if (hoja) return hoja;
  const sinBoton = estilos.replace(/@media\(max-width:880px\)\{:root\{--[a-z]+-asistente-abajo:[^}]*\}\}/, '');
  if (sinBoton === estilos || /asistente-abajo/.test(sinBoton)) throw new Error('la hoja de la vitrina cambió: no encuentro la regla del botón del chat');
  // La hoja propia de la vista (vista/vista.css) no va acá: la pide js/vista.js,
  // así esta zona pesa lo mismo que la de la vitrina real.
  hoja = sinBoton;
  return hoja;
}

const envolver = (s) => `${ABRE_VISTA}${s}${CIERRA_VISTA}`;

/** El contenido de una zona, tal como lo escribió la vitrina, pasado a la vista local. */
function aVista(nombre, contenido, dentroOriginal) {
  if (nombre === 'destinos') {
    // El título de hoy queda fuera de la vista; adentro, sólo la marca de precios de prueba.
    const marca = contenido.slice(contenido.indexOf(' <span'));
    return `${dentroOriginal}${contenido.includes('<span') ? envolver(marca) : ''}`;
  }
  if (!contenido) return '';
  let c = contenido;
  if (nombre === 'estilos') {
    const m = c.match(/^<style id="tienda-estilos">([\s\S]*)<\/style>$/);
    if (!m) throw new Error('la zona estilos no es un <style>');
    c = `<style id="tienda-estilos">${hojaDeLaVista(m[1])}</style>`;
  }
  if (nombre === 'scripts') {
    const config = (c.match(/<script type="application\/json" id="tienda-config">[\s\S]*?<\/script>/) || [''])[0];
    // Se pide con el `load`, como la vitrina pide los suyos (CARGA en tienda.mjs): no le compite a la foto principal.
    c = `\n${config ? `${config}\n` : ''}<script>addEventListener('load',function(){var s=document.createElement('script');s.src='/js/vista.js?v=${version('js/vista.js')}';document.head.appendChild(s)})</script>\n`;
  }
  if (nombre === 'barra') c = c.replace('<div class="wa-bar', '<div class="vista-barra wa-bar');
  if (c.includes(APP)) throw new Error(`zona ${nombre}: quedó el host del chat`);
  return envolver(c);
}

/** La página con la vista de la reserva y el chat. Pura salvo por leer js/vista.js (su ?v=). Idempotente. */
export function poner(html, archivo) {
  const base = quitar(html);
  const p = leerPerfil(PERFIL);
  const lleno = transformarPagina(base, archivo, p);
  if (lleno === base) return base;
  // Lo que había en cada zona antes de llenarla (sólo «destinos» envuelve texto de la página).
  const vacias = new Map();
  const titulo = base.match(/<article class="card circuito">/) ? (() => {
    const i = base.indexOf('<article class="card circuito">');
    const h2 = base.lastIndexOf('<h2>', i);
    return base.slice(h2 + 4, base.indexOf('</h2>', h2));
  })() : null;
  if (titulo !== null) vacias.set('destinos', titulo);
  return lleno.replace(ZONA, (_, nombre, contenido) => `<!-- GENERADO:TIENDA ${nombre} -->${aVista(nombre, contenido, vacias.get(nombre) || '')}<!-- /GENERADO:TIENDA -->`);
}

function principal() {
  const modo = process.argv.includes('--comprobar') ? 'comprobar' : process.argv.includes('--quitar') ? 'quitar' : 'poner';
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = modo === 'quitar' ? quitar(actual) : poner(actual, pagina);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (modo !== 'comprobar') writeFileSync(ruta, nuevo);
    }
  }
  if (modo === 'comprobar') {
    for (const p of cambiadas) console.log(`vista de revisión sin regenerar: ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`${cambiadas.length} páginas ${modo === 'quitar' ? 'sin la vista' : 'con la vista'}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
