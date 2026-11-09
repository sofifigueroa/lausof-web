/* =============================================================================
   ACCIONES DE CONTACTO — node scripts/acciones.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Pone una sola redacción por idioma en los botones genéricos de WhatsApp y de
   correo que cada página tiene escritos a mano: el botón del menú (nav-cta),
   los del encabezado (.ctas) y los demás `a.btn` de contacto del cuerpo.
   Las redacciones salen de ACCIONES (scripts/empresa.mjs), las mismas que usa
   scripts/bloques.mjs en la barra, el cierre y el pie. Ronda 6 de lausof.com
   (08/11/2026): hasta ese día el mismo botón decía «Cotizá por WhatsApp»,
   «Consultar disponibilidad», «Escríbanos por WhatsApp», «Quote on
   WhatsApp», «WhatsApp us»… según la página (2-estado-actual.md, W14).

   Qué cuenta como genérico: un rótulo de GENERICOS (abajo), que sólo nombra el
   canal y un verbo de pedir. Un botón que nombra lo que cotiza («Cotizar el
   traslado», «Reservar por correo», «Request the documents by email») es de
   su página y no se toca; en español, igual, «mail» pasa a «correo».

   La acción (cotizar o consultar) sale del tipo del enlace: su
   `data-prefill` o, si no tiene, el tipo de la página (scripts/prefill.mjs).
   Sólo cambia el texto del botón: el enlace, las clases y el ícono quedan.
   No entra a las zonas <!-- GENERADO:… --> (son de otros scripts).

     node scripts/acciones.mjs              reescribe lo que haga falta
     node scripts/acciones.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { ACCIONES, accionDe } from './empresa.mjs';
import { PAGINAS, idiomaDe } from './prefill.mjs';

/* Los rótulos genéricos que había el 08/11/2026, por idioma y canal. `soloMenu`
   son los que sólo nombran el canal: genéricos en el botón del menú, de su
   página en cualquier otro lado (una tabla con un botón «WhatsApp» por fila). */
export const GENERICOS = {
  es: {
    wa: ['Cotizar por WhatsApp', 'Consultar por WhatsApp', 'Cotizá por WhatsApp', 'Consultá por WhatsApp', 'Escribinos por WhatsApp',
      'Escríbanos por WhatsApp', 'Escribir por WhatsApp', 'Consultar disponibilidad'],
    correo: ['Cotizar por correo', 'Consultar por correo', 'Escribir por correo', 'Pedir cotización por mail', 'Pedir cotización por correo',
      'Consultar por mail', 'Escribir por mail'],
    soloMenu: { wa: ['WhatsApp'], correo: ['Mail', 'Correo'] },
  },
  en: {
    wa: ['Get a quote on WhatsApp', 'Ask on WhatsApp', 'Message us on WhatsApp', 'WhatsApp us', 'Quote on WhatsApp', 'Quote by WhatsApp'],
    correo: ['Get a quote by email', 'Ask by email', 'Request a quote by email', 'Request a quote', 'Email us'],
    soloMenu: { wa: ['WhatsApp'], correo: ['Email'] },
  },
  pt: {
    wa: ['Orçamento pelo WhatsApp', 'Falar pelo WhatsApp', 'Consultar pelo WhatsApp', 'Consultar disponibilidade', 'Fale conosco pelo WhatsApp'],
    correo: ['Orçamento por e-mail', 'Escrever por e-mail'],
    soloMenu: { wa: ['WhatsApp'], correo: ['E-mail'] },
  },
};

const ZONA = /<!-- GENERADO:([A-Z]+)\b[\s\S]*?<!-- \/GENERADO:\1 -->/g;
// Un botón de contacto: <a … class="btn …" … href="wa.me|mailto"…>[ícono]texto</a>
const BOTON = /<a\b([^>]*\bclass="btn\b[^"]*"[^>]*)>((?:<svg[\s\S]*?<\/svg>)?)([^<]*)<\/a>/g;

const canalDe = (atributos) => {
  const href = (atributos.match(/\bhref="([^"]*)"/) || [])[1] || '';
  if (href.startsWith('https://wa.me/')) return 'wa';
  if (href.startsWith('mailto:')) return 'correo';
  return null;
};

/** El rótulo que le toca a un botón de contacto, o el mismo si es de su página. */
export function rotuloDe(rotulo, { idioma, canal, tipo, menu }) {
  const texto = rotulo.trim();
  const g = GENERICOS[idioma];
  const generico = g[canal].includes(texto) || (menu && g.soloMenu[canal].includes(texto));
  if (generico) return ACCIONES[idioma][accionDe(tipo)][canal];
  // Fuera de la lista, en español «mail» siempre pasa a «correo» (N5).
  if (idioma === 'es') return texto.replace(/\bmail\b/g, 'correo').replace(/\bMail\b/g, 'Correo');
  return texto;
}

/** Los tramos de la página que este script puede tocar (fuera de las zonas). */
function tramos(html) {
  const lista = [];
  let desde = 0;
  for (const m of html.matchAll(ZONA)) {
    lista.push({ texto: html.slice(desde, m.index), editable: true });
    lista.push({ texto: m[0], editable: false });
    desde = m.index + m[0].length;
  }
  lista.push({ texto: html.slice(desde), editable: true });
  return lista;
}

/** La página con los botones genéricos al día. Pura e idempotente. */
export function conAcciones(html, pagina) {
  const idioma = idiomaDe(pagina);
  return tramos(html).map(({ texto, editable }) => (!editable ? texto : texto.replace(BOTON, (todo, atributos, icono, rotulo) => {
    const canal = canalDe(atributos);
    if (!canal || !rotulo.trim()) return todo;
    const tipo = (atributos.match(/\bdata-prefill="([^"]*)"/) || [])[1] || PAGINAS[pagina];
    const menu = /\bnav-cta\b/.test(atributos);
    const nuevo = rotuloDe(rotulo, { idioma, canal, tipo, menu });
    if (nuevo === rotulo.trim()) return todo;
    return `<a${atributos}>${icono}${rotulo.replace(rotulo.trim(), nuevo)}</a>`;
  }))).join('');
}

/** Cada botón de contacto de la página, con su rótulo, canal y si es del menú (lo usa también tests/acciones.test.js). */
export function botonesDe(html) {
  return [...html.matchAll(BOTON)].map(([, atributos, , rotulo]) => ({ canal: canalDe(atributos), rotulo: rotulo.trim(), atributos }))
    .filter((b) => b.canal && b.rotulo);
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conAcciones(actual, pagina);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const p of cambiadas) console.log(`acciones sin regenerar: ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`acciones: ${cambiadas.length} página(s) reescrita(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
