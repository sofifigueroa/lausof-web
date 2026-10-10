// Puertas de contenido: lo que el sitio NO puede decir y lo que no puede
// dejar de decir. Si un cambio de redacción borra un dato verificado o
// mete un tema vedado, estos tests lo frenan antes de publicar.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas: crudas, sinComentarios } = require('./util.js');

// Se evalúa lo que el visitante ve: los comentarios HTML quedan afuera,
// porque ahí sí se nombran los temas vedados (son las notas del dueño).
// Cubre TODAS las páginas de la raíz: una página nueva entra sola.
const paginas = Object.fromEntries(
  Object.entries(crudas).map(([nombre, html]) => [nombre, sinComentarios(html)]),
);

// Temas vedados en todo el sitio (decisión del dueño, no se negocia acá).
const vedados = [
  ['prenda', /\bprendas?\b/i],
  ['financiación', /financiaci/i],
  ['mudanzas', /\bmudanzas?\b/i],
  ['VTV (acá es RTO)', /\bVTV\b/i],
  ['Posco', /\bposco\b/i],
];

for (const [nombre, contenido] of Object.entries(paginas)) {
  test(`${nombre}: sin palabras vedadas`, () => {
    for (const [etiqueta, patron] of vedados) {
      assert.ok(!patron.test(contenido), `"${etiqueta}" aparece en ${nombre}`);
    }
  });

  // Datos internos que no se publican: cuántos teléfonos satelitales hay
  // ni ningún número que dimensione la flota o el personal. Los patrones
  // van atados a los sustantivos vedados para no pisar especificaciones
  // legítimas como "19+1 plazas" o "7,5 toneladas".
  test(`${nombre}: sin cantidades de teléfonos satelitales ni de flota o personal`, () => {
    assert.ok(
      !/\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+tel[eé]fonos?\s+satelitales?/i.test(contenido),
      `se publica la cantidad de teléfonos satelitales en ${nombre}`,
    );
    const dimension = /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|\d+)\s+(unidades|veh[ií]culos|camiones|camionetas|combis|minib[uú]s(?:es)?|autoelevadores|gr[uú]as|choferes|conductores|mec[aá]nicos|empleados)\b/i;
    const m = contenido.match(dimension);
    assert.ok(!m, `se dimensiona la flota o el personal en ${nombre}: "${m && m[0]}"`);
  });

  test(`${nombre}: sin restos de borrador`, () => {
    assert.ok(!/\[completar\]/i.test(contenido), `queda un [completar] en ${nombre}`);
    assert.ok(!/prototipo/i.test(contenido), `queda un "prototipo" en ${nombre}`);
  });
}

// Google Imágenes solo indexa el alt de cada <img>: los slides ocultos de los
// slideshows lo llevan descriptivo (con role="img" en el contenedor no les
// cuesta nada de accesibilidad). Los únicos alt="" permitidos son los del
// logo decorativo de cierre de página (uno por página que lo lleva).
test('toda imagen lleva alt descriptivo salvo los logos decorativos', () => {
  let decorativos = 0;
  for (const [nombre, contenido] of Object.entries(paginas)) {
    for (const [etiqueta] of contenido.matchAll(/<img [^>]*>/g)) {
      const alt = etiqueta.match(/alt="([^"]*)"/);
      assert.ok(alt, `imagen sin atributo alt en ${nombre}: ${etiqueta.slice(0, 80)}`);
      if (alt[1] === '') {
        assert.match(etiqueta, /logo-insignia-web/,
          `alt vacío en una imagen que no es el logo decorativo (${nombre}): ${etiqueta.slice(0, 80)}`);
        decorativos++;
      }
    }
  }
  // Hoy lo llevan 27 páginas: las 15 en español (portada, flota, las 4 de
  // servicios, las 8 de la ola del 26/08 y autoelevadores del 27/08) y las 8
  // gemelas inglesas del 31/08, que cierran igual que su gemela, y las cuatro
  // páginas de ruta del 10/10. La 404 de
  // cada idioma no lo lleva. Si una página lo suma o lo pierde, este número
  // se actualiza a conciencia.
  assert.strictEqual(decorativos, 27, `se esperaban 27 logos decorativos con alt="", hay ${decorativos}`);
});

// Afirmaciones verificadas que la portada tiene que conservar, se redacte
// como se redacte.
const requeridas = [
  ['habilitación CNRT', /CNRT/],
  ['habilitación AMT', /AMT/],
  ['capacidad de carga de 7,5 toneladas', /capacidad de carga de 7,5 toneladas/],
  ['registro de temperatura', /registro de temperatura/i],
  ['agencia de turismo habilitada', /agencia de turismo habilitada/i],
  ['más de una década en la Puna', /Más de una década trabajando en la Puna/],
  ['psicofísico al día', /psicof[ií]sico/i],
  ['ART al día', /\bART\b/],
  ['teléfono satelital en altura', /tel[eé]fono satelital/i],
  ['fletes y cargas generales por el NOA', /fletes y cargas generales por Salta y el NOA/],
  ['CUIT', /30-71146774-9/],
  // "alquiler de combis" es el vocabulario con el que busca el cliente y el
  // sitio viejo lo explotaba; la mención vive en la tarjeta de personal.
  ['alquiler de combis con chofer', /alquiler de combis con chofer/i],
  // Línea de tiempo confirmada por el dueño (25/08): pasajeros desde 2010,
  // remolques/auxilio/cargas desde 2017.
  ['empezamos en 2010', /Empezamos en 2010 con el transporte de pasajeros/],
  ['grúa y cargas desde 2017', /en 2017 sumamos remolques, auxilio mecánico y cargas generales/],
];

// La habilitación AMT se publica como afirmación general ("Habilitación AMT",
// "habilitaciones CNRT y AMT vigentes"), pero NUNCA con su número de permiso
// ni de expediente (política de Lautaro, BUILD-BRIEF 10/10/2026). El único
// número de habilitación publicable es el CNRT 60284. Los comentarios quedan
// afuera porque ahí se explica la regla.
test('ninguna página publica el número de permiso o expediente AMT', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const conNumero = html.match(/\bAMT\b[^<>]{0,40}?(?:N\.?\s*[º°o]|No\.?|#|n[uú]mero|expediente|exp\.|file)\s*:?\s*\d[\d./-]*/i)
      || html.match(/(?:expediente|exp\.)\s*(?:N\.?\s*[º°o]\s*)?\d{2,}-\d+/i)
      || html.match(/238-74749/);
    assert.ok(!conNumero, `${nombre} publica un número AMT: "${conNumero && conNumero[0].trim()}"`);
  }
});

test('las páginas que nombran la habilitación citan la CNRT 60284', () => {
  for (const nombre of ['index.html', 'logistica-minera.html', 'transporte-de-personal.html',
    'turismo.html', 'en/index.html', 'en/mining-logistics.html',
    'en/personnel-transport.html', 'en/tours-and-transfers.html']) {
    assert.match(paginas[nombre], /CNRT/, `${nombre} perdió la habilitación CNRT`);
  }
});

// Afirmaciones que la familia confirmó el 10/10/2026 (BUILD-BRIEF) y que el
// cliente busca para reservar: guardia de auxilio las 24 hs, agencia de
// turismo habilitada y viajes al exterior. Antes se sacaban "por no estar en
// los papeles"; la política ahora es que se quedan. Se miran en el texto
// visible (sin etiquetas) de cada página donde viven, en los dos idiomas.
const confirmadas = {
  'index.html': [/Auxilio en ruta 24 hs/, /Urgencias 24 hs/, /las 24 hs, todos los días/,
    /Agencia de turismo habilitada/, /Viajes al exterior[^.]{0,40}Chile[^.]{0,40}Bolivia/],
  'turismo.html': [/Agencia de turismo habilitada/, /Somos agencia de turismo habilitada/,
    /Viajes al exterior[^.]{0,60}Chile[^.]{0,40}Bolivia/],
  'viajes-de-estudio.html': [/Agencia de turismo habilitada/],
  'en/index.html': [/24-hour roadside assistance/, /24-hour on-call/, /On call 24 hours a day/,
    /Licensed travel agency/, /Trips abroad[^.]{0,40}Chile[^.]{0,40}Bolivia/],
  'en/tours-and-transfers.html': [/Licensed travel agency/, /We are a licensed travel agency/,
    /Trips abroad[^.]{0,60}Chile[^.]{0,40}Bolivia/, /Do you go to Chile or Bolivia\?/],
};

test('las afirmaciones confirmadas por la familia siguen publicadas', () => {
  for (const [nombre, patrones] of Object.entries(confirmadas)) {
    const plano = paginas[nombre].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const patron of patrones) {
      assert.match(plano, patron, `${nombre} perdió una afirmación confirmada: ${patron}`);
    }
  }
});

test('index.html: las afirmaciones verificadas siguen presentes', () => {
  for (const [etiqueta, patron] of requeridas) {
    assert.ok(patron.test(paginas['index.html']), `falta "${etiqueta}" en index.html`);
  }
});

// Las 7,5 toneladas son la carga del camión plancha, no la capacidad de
// izaje de la plancha. Está comentado en el HTML y acá queda vigilado.
test('index.html: las 7,5 toneladas nunca se reescriben como izaje', () => {
  assert.ok(!/izaje/i.test(paginas['index.html']), 'apareció "izaje" en index.html');
});

// La tarjeta de cargas refrigeradas tiene que seguir diciendo, en cualquier
// redacción, que el depósito tiene cámara frigorífica y que está en Salta
// capital: son los dos datos que hacen cotizable el servicio.
test('index.html: la tarjeta de depósito conserva la cámara y la ubicación', () => {
  const desde = paginas['index.html'].indexOf('<h3>Cargas refrigeradas y depósito</h3>');
  assert.ok(desde > -1, 'no está la tarjeta de cargas refrigeradas');
  const hasta = paginas['index.html'].indexOf('</article>', desde);
  const tarjeta = paginas['index.html'].slice(desde, hasta);
  assert.match(tarjeta, /c[aá]mara frigor[ií]fica/i, 'la tarjeta perdió la cámara frigorífica');
  assert.match(tarjeta, /Salta capital/i, 'la tarjeta perdió la ubicación en Salta capital');
});

// El GPS se afirma solo para las unidades en servicio (las paradas o en
// venta no tienen por qué tenerlo): toda mención visible de GPS tiene que
// llevar ese alcance, letra por letra.
test('index.html: el GPS siempre queda acotado a las unidades en servicio', () => {
  const visibles = paginas['index.html'].match(/GPS/g) || [];
  const acotadas = paginas['index.html'].match(/GPS en las unidades en servicio/g) || [];
  assert.ok(visibles.length > 0, 'desapareció la mención del GPS');
  assert.strictEqual(visibles.length, acotadas.length,
    'hay una mención de GPS sin el alcance "en las unidades en servicio"');
});
