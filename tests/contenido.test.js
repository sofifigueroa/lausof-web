// Puertas de contenido: lo que el sitio NO puede decir y lo que no puede
// dejar de decir. Si un cambio de redacción borra un dato verificado o
// mete un tema vedado, estos tests lo frenan antes de publicar.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas: crudas, sinComentarios, PROMESA_DE_RESPUESTA } = require('./util.js');

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
  // legítimas como "19+1 plazas".
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

// Google Imágenes solo indexa el alt de cada <img>: toda foto lo lleva
// descriptivo, también los cuadros de las galerías (las miniaturas las arma
// js/galeria.js y no están en el HTML). Los únicos alt="" permitidos son los del
// logo decorativo de cierre de página (uno por página que lo lleva) y la
// foto de fondo del hero/encabezado.
// Páginas que cierran sin el logo decorativo, por diseño. El aviso de
// privacidad es texto legal, sin cierre de página.
const sinLogoDecorativo = ['galeria.html', 'golf-torneos.html', 'privacidad.html', 'en/privacy.html', 'pt/privacidade.html'];
test('toda imagen lleva alt descriptivo salvo los logos decorativos', () => {
  let decorativos = 0;
  for (const [nombre, contenido] of Object.entries(paginas)) {
    for (const [etiqueta] of contenido.matchAll(/<img [^>]*>/g)) {
      const alt = etiqueta.match(/alt="([^"]*)"/);
      assert.ok(alt, `imagen sin atributo alt en ${nombre}: ${etiqueta.slice(0, 80)}`);
      // La foto de fondo del hero/encabezado es decorativa (el contenedor es
      // role="presentation" y el texto va encima): alt vacío, se reconoce por
      // fetchpriority="high", que sólo lleva esa foto (tests/imagenes.test.js).
      if (alt[1] === '' && /fetchpriority="high"/.test(etiqueta)) continue;
      if (alt[1] === '') {
        assert.match(etiqueta, /logo-insignia-web/,
          `alt vacío en una imagen que no es el logo decorativo (${nombre}): ${etiqueta.slice(0, 80)}`);
        decorativos++;
      }
    }
  }
  // El total esperado se deriva de las páginas: lo lleva cada página del sitio salvo las
  // dos 404 y las que cierran sin él (`sinLogoDecorativo`). Así una página
  // nueva no obliga a tocar un número fijo, y una que lo pierde falla igual.
  const esperados = Object.keys(paginas)
    .filter((n) => !/(^|\/)404\.html$/.test(n) && !sinLogoDecorativo.includes(n)).length;
  assert.strictEqual(decorativos, esperados, `se esperaban ${esperados} logos decorativos con alt="", hay ${decorativos}`);
});

// Afirmaciones verificadas que la portada tiene que conservar, se redacte
// como se redacte.
const requeridas = [
  ['habilitación CNRT', /CNRT/],
  ['habilitación AMT', /AMT/],
  ['agencia de turismo habilitada', /agencia de turismo habilitada/i],
  ['psicofísico al día', /psicof[ií]sico/i],
  ['ART al día', /\bART\b/],
  ['teléfono satelital en altura', /tel[eé]fono satelital/i],
  ['CUIT', /30-71146774-9/],
  // Línea de tiempo confirmada por el dueño (25/08): pasajeros desde 2010,
  // cargas desde 2017 (los remolques de ese año salieron con la grúa,
  // vendida en noviembre de 2026).
  ['empezamos en 2010', /Empezamos en 2010 con el transporte de pasajeros/],
  ['cargas desde 2017', /en 2017 sumamos las cargas generales/],
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
// cliente busca para reservar: agencia de turismo habilitada y viajes al
// exterior. Antes se sacaban "por no estar en los papeles"; la política ahora
// es que se quedan. Se miran en el texto visible (sin etiquetas) de cada
// página donde viven, en los dos idiomas. La línea del pie «Atendemos las
// 24 hs» venía de la guardia de auxilio y Lautaro la sacó el 05/11/2026
// (la vigila la guardia del pie, más abajo).
const confirmadas = {
  // La portada lo dice en la barra de afirmaciones y en la puerta de turismo
  // (05/11/2026, 4-textos.md §1.2-§1.3).
  'index.html': [/Agencia de turismo habilitada/, /Viajes internacionales/, /viajes a Chile y Bolivia/],
  'turismo.html': [/Agencia de turismo habilitada/, /Somos agencia de turismo habilitada/,
    /Viajes al exterior[^.]{0,60}Chile[^.]{0,40}Bolivia/],
  'viajes-de-estudio.html': [/Agencia de turismo habilitada/],
  'en/index.html': [/Licensed tourism agency/, /International trips/, /Chile and Bolivia/],
  'en/tours-and-transfers.html': [/Licensed tourism agency/, /We are a licensed tourism agency/,
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

// El pie de ninguna página, en ningún idioma, promete atención las 24 horas
// (Lautaro, 05/11/2026: la línea era de la guardia de auxilio, que ya no
// está). Se mira el texto visible del <footer>.
test('ningún pie dice que se atiende las 24 horas', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const pie = (sinComentarios(html).match(/<footer class="site"[^>]*>[\s\S]*?<\/footer>/) || [''])[0];
    const texto = pie.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.doesNotMatch(texto, /\b24 ?(hs|h|horas|hours)\b|24\/7/i, `${nombre}: el pie promete atención las 24 horas`);
  }
});

// Decisiones de Lautaro del 05/11/2026 sobre propuesta-decisiones-sitio.html
// (textos en web/revision-sitio-2026-11-05/3-decisiones-consolidadas.md).
// Se mira todo el HTML sin comentarios: texto, metas y JSON-LD.
//   2A: se ofrecen viajes a cualquier hora; nadie promete atención 24 h.
//   5A: alcohol cero y sin drogas al volante, unidades libres de humo; sin la
//       desvinculación directa por tabaco (LCT arts. 242 y 67).
//   9A: «asistencia en ruta» y «Field Support» pasan a asistencia mecánica, y
//       el inglés no dice «recoveries» (palabra del oficio de la grúa).
//   11A: la vuelta del trail se acuerda por horarios, no con un chofer que
//       espera al último corredor.
const PROMESAS_RETIRADAS_0511 = [
  ['2A atención 24 h', /atenci[oó]n las 24|atendemos las 24|servicio las 24 horas|servi[cç]o 24 horas|available 24 hours|service around the clock|24\/7|<span>24 h<\/span>/i],
  ['5A desvinculación por tabaco', /desvinculaci[oó]n|grounds for (?:immediate )?dismissal|tabaco a bordo|tobacco on board/i],
  ['9A asistencia en ruta', /asistencia en ruta en la Puna|assist[eê]ncia na estrada|field support|\brecover(?:y|ies)\b/i],
  ['11A el chofer espera al último', /espera hasta que llega el último|waits for the last runner/i],
];

test('ninguna página vuelve a las promesas retiradas el 05/11 (2A, 5A, 9A, 11A)', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const [etiqueta, patron] of PROMESAS_RETIRADAS_0511) {
      const m = html.match(patron);
      assert.ok(!m, `${nombre}: volvió «${etiqueta}»: «${m && html.slice(Math.max(0, m.index - 60), m.index + 60)}»`);
    }
  }
});

// Lo que esas decisiones mantienen (y la familia hace verdad): la tolerancia
// cero con su texto nuevo, el libro de a bordo y el reporte de incidentes en
// las cuatro páginas; las dos líneas de «rescate» que Lautaro eligió el 29/08
// en logistica-minera; y la vuelta del trail con su texto nuevo.
const MANTENIDAS_0511 = {
  'index.html': ['Alcohol cero y sin drogas al volante. Unidades libres de humo.', 'Libro de a bordo por unidad', 'Reporte de incidentes firmado por el chofer'],
  'empresas-y-mineria.html': ['Alcohol cero y sin drogas al volante. Unidades libres de humo.', 'Libro de a bordo por unidad', 'Reporte de incidentes firmado por el chofer'],
  'en/index.html': ['Zero alcohol and no drugs at the wheel. Smoke-free vehicles.', 'On-board trip log per unit', 'Incident reports signed by the driver'],
  'en/business-and-mining.html': ['Zero alcohol and no drugs at the wheel. Smoke-free vehicles.', 'On-board trip log per unit', 'Incident reports signed by the driver'],
  'logistica-minera.html': [
    'Una unidad parada en la Puna no puede esperar a que alguien improvise el rescate: nuestros mecánicos van hasta el vehículo con soldadora y grupo electrógeno propios, y si hay que moverlo, coordinamos el traslado.',
    'Soldadora y grupo electrógeno propios para rescates lejos de todo',
  ],
  'en/mining-logistics.html': ['Our own welding rig and generator, so our mechanics can get a stopped unit going far from anywhere'],
  'traslados-trail-jujuy-utmb.html': ['y los horarios de vuelta según los tiempos de cada corredor; si terminan a horas muy distintas, se cotiza más de un viaje.'],
  'en/jujuy-utmb-trail-race-transfers.html': ["on return times based on each runner's pace; if runners finish hours apart, we quote more than one trip."],
};

test('las líneas que las decisiones del 05/11 mantienen siguen publicadas', () => {
  for (const [nombre, lineas] of Object.entries(MANTENIDAS_0511)) {
    for (const linea of lineas) assert.ok(paginas[nombre].includes(linea), `${nombre} perdió «${linea}»`);
  }
});

test('index.html: las afirmaciones verificadas siguen presentes', () => {
  for (const [etiqueta, patron] of requeridas) {
    assert.ok(patron.test(paginas['index.html']), `falta "${etiqueta}" en index.html`);
  }
});

// Desde el 05/11/2026 las cinco tarjetas de la portada son tres puertas
// (estructura aprobada, opción A: web/estructura-sitio-2026-11-05/). Estas
// afirmaciones vivían en las tarjetas y siguen publicadas en la página de su
// servicio, que es adonde lleva cada puerta.
const enSuPagina = [
  ['registro de temperatura', 'cargas-refrigeradas.html', /registro de temperatura/i],
  ['más de una década en la Puna', 'logistica-minera.html', /Más de una década trabajando en la Puna/],
  ['fletes y cargas generales', 'cargas-refrigeradas.html', /fletes y cargas generales/i],
  // "alquiler de combis" es el vocabulario con el que busca el cliente.
  ['alquiler de combis con chofer', 'transporte-de-personal.html', /alquiler de combis con chofer/i],
];

test('las afirmaciones que salieron de la portada siguen en la página de su servicio', () => {
  for (const [etiqueta, pagina, patron] of enSuPagina) {
    assert.ok(patron.test(paginas[pagina]), `falta "${etiqueta}" en ${pagina}`);
  }
});

// La portada no habla de izaje: la grúa se vendió (04/11/2026) y ninguna
// capacidad de carga o de izaje de remolque puede volver.
test('index.html: no habla de izaje', () => {
  assert.ok(!/izaje/i.test(paginas['index.html']), 'apareció "izaje" en index.html');
});

// La puerta de cargas y la tabla de flota tienen que seguir diciendo, en
// cualquier redacción, que el depósito tiene cámara de frío y que está en
// Salta capital: son los dos datos que hacen cotizable el servicio. Hasta el
// 05/11/2026 los decía la tarjeta de cargas, que reemplazó la puerta.
test('index.html: la portada conserva la cámara de frío del depósito y su ubicación', () => {
  const html = paginas['index.html'];
  const puertas = html.slice(html.indexOf('class="puertas"'), html.indexOf('class="certs prueba"'));
  assert.match(puertas, /dep[oó]sito con c[aá]mara de fr[ií]o/i, 'la puerta de cargas perdió el depósito con cámara de frío');
  const flota = html.slice(html.indexOf('id="flota"'), html.indexOf('id="nosotros"'));
  assert.match(flota, /c[aá]mara frigor[ií]fica/i, 'la tabla de flota perdió la cámara frigorífica');
  assert.match(flota, /Salta capital/i, 'la tabla de flota perdió la ubicación en Salta capital');
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

// Junín 1334 no recibe clientes (decisión de Lautaro del 03/11/2026): la
// dirección queda como domicilio de la empresa en el pie y en el JSON-LD,
// pero ninguna página invita a pasar, ni da un horario de atención al
// público. La guardia de 24 hs es telefónica y sí se publica.
const SIN_VISITAS = [
  /vis[ií]t[ae]nos/i, /vis[ií]tenos/i, /\bvenga a\b/i, /\bven[ií] a (la|nuestra)/i,
  /\bpas[aeá] por (la|nuestra|nuestras) (oficina|base|sede)/i, /\bacerc[aá]te\b|\bacérquese\b/i,
  /nuestra oficina/i, /horario de atenci[oó]n/i, /atenci[oó]n al p[uú]blico/i,
  /\bvisit us\b/i, /\bcome (by|visit|to our)\b/i, /\bdrop by\b/i, /\bwalk-?ins?\b/i,
  /\bour office\b/i, /\bopening hours\b(?! and closures)/i, /\bopen to the public\b/i,
];
test('ninguna página invita a visitar la base de Junín 1334', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const plano = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const patron of SIN_VISITAS) {
      assert.doesNotMatch(plano, patron, `${nombre} invita a pasar por la oficina (${patron})`);
    }
  }
});

// Renglones que Lautaro marcó en el sitio publicado (05/11/2026,
// web/revision-sitio-2026-11-05/LAUTARO-2026-11-05-noche.md, filas 6 y 8 a 11),
// en los tres idiomas. Lausof es quien opera el viaje: no se habla de «la
// empresa que pone la unidad»; no se promete una visita; la pregunta por la
// excursión guiada no se contesta con «No», porque un guía habilitado se
// coordina si el grupo lo pide; y el idioma no se responde con «la página
// tiene su versión en inglés».
const RENGLONES_0511 = [
  ['visita prometida', /coordinamos una visita|combinamos uma visita/i],
  ['otra empresa pone la unidad', /empresa que pone la unidad|empresa dona do ve[ií]culo|company that (runs|operates) (it|the vehicle)/i],
  ['eslogan del respaldo', /respaldo de una? empresa habilitada|a licensed company behind the trip/i],
  ['«no es una excursión guiada»', /no es una excursi[oó]n guiada|not a guided tour|n[aã]o [eé] um passeio guiado/i],
  ['la página en otro idioma como respuesta', /tiene su versi[oó]n en ingl[eé]s|tamb[eé]m tem vers[aã]o em/i],
];
test('ninguna página repite los renglones marcados el 05/11/2026', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const plano = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const [etiqueta, patron] of RENGLONES_0511) {
      assert.doesNotMatch(plano, patron, `${nombre}: ${etiqueta}`);
    }
  }
});

const PREGUNTA_GUIADA = /<summary>(?:¿Es una excursión guiada\?|Is this a guided tour\?|É um passeio guiado\?)<\/summary>\s*<p>([^<]*)/g;
test('la pregunta por la excursión guiada no cierra la venta: el guía se coordina', () => {
  let vistas = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const [, respuesta] of html.matchAll(PREGUNTA_GUIADA)) {
      vistas += 1;
      assert.doesNotMatch(respuesta, /^\s*(No|Não)\b/, `${nombre} contesta «No»`);
      assert.match(respuesta, /lo coordinamos|we can arrange one|nós providenciamos/, `${nombre} no ofrece coordinar el guía`);
    }
  }
  assert.ok(vistas >= 7, `se esperaban al menos 7 respuestas, hay ${vistas}`);
});

// Auditoría de copia del 05/11/2026 (páginas de empresas e institucionales,
// web/revision-sitio-2026-11-05/auditoria-es-empresas.md, FIX-5 a FIX-35):
// jerga, frases de venta y promesas absolutas que salieron y no vuelven.
const GRUPO_EMPRESAS_0511 = ['index.html', 'empresas-y-mineria.html', 'transporte-de-personal.html',
  'transporte-de-personal-obras-de-litio.html', 'logistica-minera.html', 'traslados-empresas.html',
  'producciones.html', 'cargas-refrigeradas.html', 'deposito-galpon.html', 'alquiler-autoelevadores.html',
  '404.html', 'flota-en-venta.html', 'galeria.html'];
const RENGLONES_EMPRESAS_0511 = [
  ['«interjurisdiccional» (se dice «viajes entre provincias»)', /interjurisdiccional/i],
  ['«Facturamos A» (se dice «Factura A»)', /Facturamos A\b/],
  ['IVA fijo del 21 % (pasajeros va al 10,5 %)', /IVA 21/],
  ['eslogan de la seguridad', /no es un adicional/i],
  // «Su tranquilidad viaja con nosotros» salió con esta auditoría (FIX-9) y
  // volvió en la ronda 4 (08/11/2026): Lautaro la eligió el 29/08 («Keep
  // this», seo-audit/feedback-lautaro-copy-2026-08-29.txt:9) y sus líneas
  // elegidas se mantienen palabra por palabra (rondas-2026-11-07 BRIEF, L28).
  ['jerga de depósito', /staging|posiciones fr[ií]as/i],
  ['letra de contrato', /M[ií]nimos y plazos a convenir/i],
  ['«la más pedida» sin datos', /opci[oó]n m[aá]s pedida/i],
  ['«inmovilizar capital»', /inmovilizar capital/i],
  ['«vouchers»', /vouchers/i],
  ['«Años operando»', /A[nñ]os operando/i],
  ['«horarios comprometidos»', /horarios comprometidos/i],
  ['«la barrera» (se dice «el control de ingreso a la mina»)', /la barrera\b/i],
  ['cadena de frío absoluta', /sin cortes|no se corta en ning[uú]n tramo/i],
];
test('las páginas de empresas e institucionales no repiten los renglones de la auditoría del 05/11', () => {
  for (const nombre of GRUPO_EMPRESAS_0511) {
    const plano = paginas[nombre].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const [etiqueta, patron] of RENGLONES_EMPRESAS_0511) {
      assert.doesNotMatch(plano, patron, `${nombre}: ${etiqueta}`);
    }
  }
});

test('ningún <h1> de empresas e institucionales termina en punto', () => {
  for (const nombre of GRUPO_EMPRESAS_0511) {
    for (const [, h1] of paginas[nombre].matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)) {
      assert.doesNotMatch(h1.replace(/<[^>]+>/g, '').trim(), /\.$/, `${nombre}: el h1 termina en punto`);
    }
  }
});

// FIX-35: la 404 ofrece las dos secciones en el orden de las líneas, no la
// venta de la flota (que queda discreta, sólo en el pie).
test('404.html: las puertas son Turismo y traslados, Empresas y minería y WhatsApp', () => {
  const puertas = paginas['404.html'].match(/<div class="np-enlaces">([\s\S]*?)<\/div>/)[1];
  const hrefs = [...puertas.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(hrefs.slice(0, 2), ['/turismo.html', '/empresas-y-mineria.html']);
  assert.match(hrefs[2], /^https:\/\/wa\.me\/5493875269009/);
  assert.strictEqual(hrefs.length, 3);
});

// Ola de arreglos del 05/11/2026 en las páginas de turismo en español
// (web/revision-sitio-2026-11-05/auditoria-es-turismo.md): las fuentes no
// nombran herramientas que el viajero no conoce, el chofer-guía no se
// contesta con «No», la factura no queda en «solo A» para clubes, colegios
// y viajeros, y no vuelven los renglones que nadie preguntó.
const TURISMO_ES = Object.entries(paginas)
  .filter(([nombre, html]) => !/^(en|pt)\//.test(nombre) && html.includes('data-seccion="turismo"'));
const planoDe = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const RENGLONES_TURISMO_0511 = [
  ['herramienta de rutas', /\bOSRM\b|\bRuta0\b|OpenStreetMap/],
  ['nota de trabajo', /no tiempos medidos|según Perfil \(2020\)|viajeros que la hicieron/],
  ['capacidad «4 a 10»', /grupo de 4 a 10 personas/],
  // «Sin call center» volvió con la decisión 13B del 05/11/2026 (su «No problem
  // with "Sin call center."» del 29/08); lo vigila el test de 13B, más abajo.
  ['frase de venta', /sin costos ocultos|Menos días parados|Menos riesgo de que una rotura|donde tiene que estar, cuando tiene que estar/],
  ['dato que nadie preguntó', /Aguaray|cupos figuraban agotados|no hay cortes de ruta anunciados/],
  ['respuesta que cierra la venta', /No operamos ni vendemos el tren|tiene que resolverlo por su cuenta|El guía lo suma su agencia|se suma aparte/],
];
test('turismo ES: no vuelven los renglones arreglados el 05/11/2026', () => {
  assert.ok(TURISMO_ES.length >= 29, `se esperaban 29 páginas de turismo, hay ${TURISMO_ES.length}`);
  for (const [nombre, html] of TURISMO_ES) {
    const plano = planoDe(html);
    for (const [etiqueta, patron] of RENGLONES_TURISMO_0511) {
      assert.doesNotMatch(plano, patron, `${nombre}: ${etiqueta}`);
    }
  }
});

const PREGUNTA_CHOFER_GUIA = /<summary>¿El chofer hace de guía\?<\/summary>\s*<p>([^<]*)/g;
test('turismo ES: «¿El chofer hace de guía?» no se contesta con «No» y ofrece coordinar el guía', () => {
  let vistas = 0;
  for (const [nombre, html] of TURISMO_ES) {
    for (const [, respuesta] of html.matchAll(PREGUNTA_CHOFER_GUIA)) {
      vistas += 1;
      assert.doesNotMatch(respuesta, /^\s*No\b/, `${nombre} contesta «No»`);
      assert.match(respuesta, /se puede coordinar/i, `${nombre} no ofrece coordinar el guía`);
    }
  }
  assert.ok(vistas >= 3, `se esperaban al menos 3 respuestas, hay ${vistas}`);
});

// Factura A sólo va a Responsables Inscriptos: un club exento, un colegio o un
// viajero reciben B. El pie (bloque de datos de facturación) lo arregla su
// propio carril; acá se mira el cuerpo de las páginas para grupos y viajeros.
const FACTURA_A_O_B = [
  'charter-recitales.html', 'clubes-deportivos.html', 'viajes-de-estudio.html', 'traslado-tren-a-las-nubes.html',
  'traslado-carnaval-quebrada-de-humahuaca.html', 'feriados-fines-de-semana-largos.html', 'traslado-serenata-a-cafayate.html',
  'traslados-trail-jujuy-utmb.html', 'viajes-internacionales.html', 'traslado-salta-san-pedro-de-atacama.html',
  'traslado-san-pedro-de-atacama-salta.html', 'traslado-salta-uyuni.html', 'traslado-uyuni-salta.html',
];
test('turismo ES: a clubes, colegios y viajeros la factura es A o B', () => {
  for (const nombre of FACTURA_A_O_B) {
    const cuerpo = paginas[nombre].replace(/<div class="wrap proveedores">[\s\S]*?<\/div>/, ' ');
    const plano = planoDe(cuerpo) + ' ' + [...cuerpo.matchAll(/\scontent="([^"]*)"/g)].map((m) => m[1]).join(' ');
    assert.doesNotMatch(plano, /factura A(?! o B)/, `${nombre} dice «factura A» sin la B`);
  }
});

// Integración de la ola FIX del 05/11/2026: Salta–Purmamarca es la misma
// distancia en los tres idiomas (la de la página de Purmamarca, 188 km), y la
// nota bajo la tabla de San Pedro de Atacama no nombra herramientas de rutas.
const SAN_PEDRO_3_IDIOMAS = ['traslado-salta-san-pedro-de-atacama.html', 'traslado-san-pedro-de-atacama-salta.html',
  'en/salta-to-san-pedro-de-atacama.html', 'en/san-pedro-de-atacama-to-salta.html', 'pt/traslado-salta-san-pedro-de-atacama.html'];
test('San Pedro de Atacama ES/EN/PT: Salta–Purmamarca son 188 km y las notas no nombran OSRM ni OpenStreetMap', () => {
  for (const nombre of SAN_PEDRO_3_IDIOMAS) {
    const html = paginas[nombre];
    const tramo = html.match(/<tr><th scope="row">(?:Salta – Purmamarca|Purmamarca – Salta|Salta to Purmamarca|Purmamarca to Salta)<\/th><td>([^<]*)/);
    assert.ok(tramo, `${nombre}: falta el tramo Salta–Purmamarca`);
    assert.match(tramo[1], /188 km/, `${nombre}: Salta–Purmamarca no dice 188 km`);
    assert.doesNotMatch(html, /\b180 km\b/, `${nombre}: queda un «180 km»`);
    for (const [, nota] of html.matchAll(/<p class="nota-fuente">([\s\S]*?)<\/p>/g)) {
      assert.doesNotMatch(nota, /OSRM|OpenStreetMap/, `${nombre}: la nota nombra la herramienta de rutas`);
    }
  }
});

// Integración de las decisiones del 05/11/2026: ninguna página, en ningún
// idioma, nombra la herramienta de donde salen las distancias (Ruta0, OSRM,
// OpenStreetMap). Las notas de fuente dicen «aproximados, en auto y sin
// paradas» y la fecha, como las páginas ES. Los comentarios HTML quedan fuera.
test('ninguna página nombra Ruta0, OSRM ni OpenStreetMap en el texto visible', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = sinComentarios(html).match(/Ruta0|OSRM|OpenStreetMap/i);
    assert.ok(!m, `${nombre}: nombra la herramienta de rutas («${m && m[0]}»)`);
  }
});

// Plazo de respuesta (decisión 1A de Lautaro, 05/11/2026,
// web/revision-sitio-2026-11-05/3-decisiones-consolidadas.md, ítem 1): ninguna
// página promete cuándo se responde, en ES, EN ni PT, tampoco en meta, og o
// JSON-LD. Vuelve cuando la primera respuesta a consultas web esté medida y
// baje de un día. Se revisa el HTML entero sin comentarios: así entran los
// atributos content= y los bloques application/ld+json.
test('ninguna página promete un plazo de respuesta (decisión 1A)', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = html.match(PROMESA_DE_RESPUESTA);
    assert.ok(!m, `${nombre}: promete un plazo de respuesta («${m && m[0]}»)`);
  }
});

// Control: el patrón corta las frases que se sacaron el 05/11 y deja pasar las
// del viaje, que también dicen «en el día», «same day» o «no mesmo dia».
test('el patrón del plazo de respuesta distingue la respuesta del viaje', () => {
  const promesas = [
    'Le respondemos con la cotización en el día.',
    'Combi de 19+1 plazas con chofer; cotización en el día.',
    'Tres datos y te cotizamos en el día',
    'Respondemos en el día.',
    'Le respondemos con la cotización normalmente en el mismo día hábil.',
    'Le respondemos en el día con el plan de traslados y la cotización.',
    'Respondemos en 24 horas.',
    'We reply in English, normally the same business day (Argentina time, UTC−3).',
    '19-seat minibus with driver, both ways; same-day quote.',
    'We reply within 2 hours.',
    'Respondemos com o orçamento no mesmo dia.',
    'Com isso respondemos com o preço, normalmente no mesmo dia.',
    'Respondemos normalmente no mesmo dia útil.',
  ];
  for (const frase of promesas) assert.match(frase, PROMESA_DE_RESPUESTA, frase);
  const viajes = [
    'Con esos datos, la cotización se envía por escrito.',
    'Envíenos la fecha, cuántos viajan y si es solo ida a Cachi, ida y vuelta en el día o el circuito completo.',
    '¿Se puede ir y volver en el día?',
    'la combi lleva al equipo, el chofer espera el partido y vuelven en el día. Para torneos largos también cotizamos',
    'Same-day return trips',
    'Private minibus or 4x4 with driver, there and back the same day.',
    'We reply with a written quote.',
    'Passeio privativo de van com motorista, no mesmo dia ou com uma noite.',
    'Respondemos com o orçamento por escrito.',
  ];
  for (const frase of viajes) assert.doesNotMatch(frase, PROMESA_DE_RESPUESTA, frase);
});

// Decisiones de Lautaro del 05/11/2026 (web/revision-sitio-2026-11-05,
// 3-decisiones-consolidadas.md, ítems 8 y 13).
// 8A: la pregunta por el precio dice qué lo define; nunca «No publicamos» ni
// una respuesta que abre con «No». La línea «desde» espera los precios de
// Natalia, así que ninguna respuesta lleva todavía un monto.
const PREGUNTA_PRECIO = /<summary>(?:¿Cuánto cuesta\?|How much does it cost\?|Quanto custa\?)<\/summary>\s*<p>([^<]*)<\/p>/g;
test('8A: el precio se explica, no se niega', () => {
  let vistas = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.doesNotMatch(html, /¿Publican precios\?|Do you publish prices\?|Vocês publicam preços\?/, `${nombre}: vuelve «¿Publican precios?»`);
    assert.doesNotMatch(planoDe(html), /No publicamos precios|do not publish prices|Não publicamos preços/i, `${nombre}: dice que no publica precios`);
    for (const [, respuesta] of html.matchAll(PREGUNTA_PRECIO)) {
      vistas += 1;
      assert.doesNotMatch(respuesta, /^\s*(?:No|Não)\b/, `${nombre}: la respuesta del precio abre con «No»`);
      assert.match(respuesta, /cotiza|precio|cotizamos|priced|quoted|price|orçad|preço/i, `${nombre}: la respuesta no dice qué define el precio`);
      assert.doesNotMatch(respuesta, /\$\s?\d|US\$|USD|R\$/, `${nombre}: la respuesta publica un monto antes de los precios de Natalia`);
    }
  }
  assert.ok(vistas >= 31, `se esperaban al menos 31 respuestas de precio, hay ${vistas}`);
});

// 13B: sin la promesa de una sola persona; quedan «Sin call center» y
// «alguien de la empresa», con sus palabras del 29/08.
const UNA_PERSONA = /misma persona|mismo responsable|sola persona a cargo|solo responsable|un solo contacto de su lado|same person|one person (?:accountable|responsible|coordinating)|one contact on your side|mesmo responsável|só pessoa responsável/i;
test('13B: ninguna página promete una sola persona', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.doesNotMatch(planoDe(html), UNA_PERSONA, `${nombre}: vuelve la promesa de una sola persona`);
  }
});
test('13B: las portadas y las páginas de la promesa dicen «Sin call center» y «alguien de la empresa»', () => {
  assert.match(paginas['index.html'], /<b>Empresa familiar<\/b><p>Sin call center: las consultas las responde la propia empresa\.<\/p>/);
  assert.match(paginas['index.html'], /El teléfono lo atiende alguien de la empresa, no un contestador\./);
  assert.match(paginas['en/index.html'], /<b>A family company<\/b><p>No call center: questions are answered by the company itself\.<\/p>/);
  assert.match(paginas['pt/index.html'], /<b>Empresa familiar<\/b><p>Sem call center: quem atende é alguém da empresa\.<\/p>/);
  for (const nombre of ['charter-recitales.html', 'clubes-deportivos.html', 'peregrinaciones-eventos.html',
    'traslados-fiesta-del-milagro.html', 'traslados-trail-jujuy-utmb.html', 'viajes-de-estudio.html',
    'transporte-de-personal.html', 'traslados-empresas.html', 'cargas-refrigeradas.html', 'deposito-galpon.html']) {
    assert.ok(planoDe(paginas[nombre]).includes('Sin call center: atiende alguien de la empresa.'), `${nombre}: falta «Sin call center: atiende alguien de la empresa.»`);
  }
  for (const nombre of ['en/personnel-transport.html', 'en/refrigerated-freight.html', 'en/warehouse.html']) {
    assert.ok(planoDe(paginas[nombre]).includes('No call center: someone from the company answers.'), `${nombre}: falta «No call center: someone from the company answers.»`);
  }
});
