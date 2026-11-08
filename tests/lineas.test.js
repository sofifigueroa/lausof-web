// La prueba de línea de la ronda 9 de lausof.com (08/11/2026), como
// guardias baratas: las clases de renglón que la ronda encontró y corrigió
// no vuelven. El registro línea por línea está en rondas-2026-11-07/v9/LINEAS.md.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

const visible = (html) => sinComentarios(html)
  .replace(/<!-- RONDA:VISTA -->[\s\S]*?<!-- \/RONDA:VISTA -->/g, '')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

// 1b L1 (05/11, «why close to business»): ninguna respuesta de las preguntas
// frecuentes empieza con un «No.» seco. Lo que se puede, se dice primero.
const NO_PERMITIDO = new Set();
test('ninguna respuesta frecuente empieza con «No.», «No:» o «Não.»', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (NO_PERMITIDO.has(nombre)) continue;
    const sin = html.replace(/<!-- RONDA:VISTA -->[\s\S]*?<!-- \/RONDA:VISTA -->/g, '');
    for (const m of sin.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)) {
      assert.doesNotMatch(m[2], /^\s*(No|Não)[.:,]/, `${nombre}: «${m[1]}» empieza con un no`);
    }
  }
});

// Ronda 6 (correo, nunca mail) llevada a todo el texto en español.
test('en español se dice «correo», nunca «mail»', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (nombre.startsWith('en/') || nombre.startsWith('pt/')) continue;
    assert.doesNotMatch(visible(html), /\b[Mm]ails?\b/, nombre);
  }
});

// 1b L4: la fila «Unidades» no repite lo que ya dice la salida «¿Más de 19
// pasajeros? Coordinar con el equipo» que va al lado.
test('la fila «Unidades» no repite la salida de los grupos grandes', async () => {
  const { VIAJES } = await import('../scripts/viaje-datos.mjs');
  const { plazasDe } = await import('../scripts/viaje.mjs');
  for (const [pagina, dato] of Object.entries(VIAJES)) {
    if (!plazasDe(dato)) continue;
    assert.doesNotMatch(dato.filas.unidades.valor,
      /más de una unidad|más unidades|grupos (más )?grandes|more minibuses|several minibuses|additional vehicles|more vehicles|extra vehicles|vans adicionais|mais de um veículo/,
      pagina);
  }
});

// El pie: «Teléfono» con una línea, «Teléfonos» sólo donde hay dos (la flota en venta).
test('el pie dice «Teléfono» salvo en la flota en venta', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (nombre.startsWith('en/') || nombre.startsWith('pt/') || !html.includes('<!-- GENERADO:CONTACTO')) continue;
    const pie = html.split('<!-- GENERADO:CONTACTO')[1];
    const esperado = nombre === 'flota-en-venta.html' ? 'Teléfonos' : 'Teléfono';
    assert.ok(pie.includes(`<b>${esperado}</b>`), `${nombre}: el pie no dice «${esperado}»`);
  }
});
