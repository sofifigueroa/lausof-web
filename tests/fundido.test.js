// Fundido de fotos: en vez de buscar porcentajes puntuales en la CSS (que
// se rompen con cualquier reformateo y no detectan un porcentaje mal
// corrido), acá se simula la animación completa. Se leen los @keyframes,
// las duraciones y los retardos reales de la hoja, se interpola la opacidad
// de cada foto a lo largo de un ciclo entero en régimen, y se exige que en
// todo momento haya al menos una foto en opacidad plena: si eso se cumple,
// el fondo azul del recuadro nunca se ve.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { css } = require('./util.js');

// { rotarFotos: [{pct, op}, ...], rotarFotos3: [...], ... }
function leerKeyframes() {
  const bloques = {};
  for (const [, nombre, cuerpo] of css.matchAll(/@keyframes (rotarFotos\d*)\{([\s\S]*?)\n\}/g)) {
    bloques[nombre] = [...cuerpo.matchAll(/([\d.]+)%\{opacity:([\d.]+)\}/g)]
      .map(([, pct, op]) => ({ pct: Number(pct), op: Number(op) }))
      .sort((a, b) => a.pct - b.pct);
  }
  return bloques;
}

// { rotarFotos: 17, rotarFotos3: 10.2, ... } en segundos
function leerDuraciones() {
  const duraciones = {};
  for (const [, nombre, dur] of css.matchAll(/animation:(rotarFotos\d*) ([\d.]+)s infinite/g)) {
    duraciones[nombre] = Number(dur);
  }
  return duraciones;
}

// Retardos por foto: los de .slideshow valen para todas las variantes y los
// de .slideshow-N solo para la suya. La primera foto arranca sin retardo.
function leerRetardos() {
  const base = {};
  const porVariante = {};
  const patron = /\.slideshow(-\d+)? img:nth-child\((\d+)\)\{animation-delay:([\d.]+)s\}/g;
  for (const [, sufijo, hijo, retardo] of css.matchAll(patron)) {
    const destino = sufijo ? (porVariante[sufijo.slice(1)] ??= {}) : base;
    destino[Number(hijo)] = Number(retardo);
  }
  return { base, porVariante };
}

function opacidadEn(stops, pct) {
  for (let i = 1; i < stops.length; i++) {
    if (pct <= stops[i].pct) {
      const a = stops[i - 1];
      const b = stops[i];
      if (b.pct === a.pct) return b.op;
      return a.op + ((b.op - a.op) * (pct - a.pct)) / (b.pct - a.pct);
    }
  }
  return stops[stops.length - 1].op;
}

const keyframes = leerKeyframes();
const duraciones = leerDuraciones();
const { base, porVariante } = leerRetardos();

test('la hoja define las cinco variantes de rotación', () => {
  assert.deepStrictEqual(
    Object.keys(keyframes).sort(),
    ['rotarFotos', 'rotarFotos3', 'rotarFotos4', 'rotarFotos6', 'rotarFotos9'],
  );
  for (const nombre of Object.keys(keyframes)) {
    assert.ok(duraciones[nombre], `no se encontró la duración de ${nombre}`);
  }
});

for (const [nombre, stops] of Object.entries(keyframes)) {
  // La variante sin sufijo es la de cinco fotos.
  const sufijo = nombre.replace('rotarFotos', '');
  const fotos = Number(sufijo || 5);

  test(`${nombre}: siempre hay una foto en opacidad plena`, () => {
    const dur = duraciones[nombre];
    const retardos = [];
    for (let foto = 1; foto <= fotos; foto++) {
      const retardo = foto === 1 ? 0 : (porVariante[sufijo]?.[foto] ?? base[foto]);
      assert.ok(retardo !== undefined, `falta el animation-delay de la foto ${foto} de ${nombre}`);
      retardos.push(retardo);
    }

    // Régimen: un ciclo entero después de que la última foto ya arrancó,
    // muestreado cada 10 ms (la carga inicial, con todas en cero, no cuenta).
    const paso = 0.01;
    for (let t = dur; t < 2 * dur; t += paso) {
      let maxima = 0;
      for (const retardo of retardos) {
        const fase = (((t - retardo) % dur) / dur) * 100;
        maxima = Math.max(maxima, opacidadEn(stops, fase));
      }
      assert.ok(maxima >= 0.999,
        `en t=${t.toFixed(2)}s de ${nombre} la foto más visible queda en ${maxima.toFixed(3)}: se ve el fondo`);
    }
  });
}
