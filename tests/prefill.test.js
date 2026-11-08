// Mensajes pre-armados de WhatsApp y de correo (auditoría D del 03/11/2026,
// §3.2): cada wa.me y cada mailto lleva los datos para cotizar como renglones
// para completar. Los arma scripts/prefill.mjs a partir de la primera línea
// escrita en el HTML y del tipo de la página; este test vigila que todas las
// páginas estén al día y que cada tipo pida lo que hace falta para cotizar.
// Página nueva: agregarla en PAGINAS de scripts/prefill.mjs y correr
// `node scripts/prefill.mjs`.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { paginas } = require('./util.js');

const guion = import('../scripts/prefill.mjs');

// Lo que cada tipo tiene que pedir, escrito acá aparte del script: si alguien
// recorta los renglones de un tipo, este cuadro lo frena. Cada entrada es un
// patrón que tiene que aparecer en algún renglón, en castellano | inglés |
// portugués (páginas de /pt/, 03/11/2026).
const PASAJEROS = [/^(Fecha|Date|Data)$/, /^(Pasajeros|Passengers|Passageiros)$/,
  /^(Lugar de salida|Pickup place|Local de saída)$/, /^(Solo ida o ida y vuelta|One way or return|Só ida ou ida e volta)$/];
const IDA = /^(Solo ida o ida y vuelta|One way or return|Só ida ou ida e volta)$/;
const REQUISITOS = {
  pasajeros: PASAJEROS,
  turismo: [/^(Destino|Destination)/, ...PASAJEROS],
  internacional: [/^(Destino|Destination)$/, ...PASAJEROS],
  aeropuerto: [/vuelo$|^Flight number$|^Número do voo$/i, /^(Fecha|Flight date|Data e horário do voo)/, /^(Pasajeros|Passengers|Passageiros)/, /^(Hotel)/, IDA],
  'combi-dia': [/^(Fecha|Date|Data)$/, /días|days|dias/, /^(Pasajeros|Passengers|Passageiros)$/, /^(Lugar de salida|Pickup place|Local de saída)$/],
  camioneta: [/^(Fecha|Date|Data)$/, /días|days|dias/, /^(Pasajeros|Passengers|Passageiros)$/, /^(Recorrido|Route|Roteiro)$/, /^(Viajero o empresa|Traveler or company|Viajante ou empresa)$/],
  personal: [/^(Fecha|Date|Data)/, /^(Personas|People|Pessoas)$/, /^(Origen|From|Origem)$/, /^(Destino|To)$/, IDA],
  auxilio: [/^(Ubicación|Location|Localização)$/, /^(Vehículo|Vehicle|Veículo)$/, /^(Qué pasó|What happened|O que aconteceu)$/],
  taller: [/^(Vehículo|Vehicle|Veículo)$/],
  carga: [/^(Carga|Cargo)$/, /^(Origen|From|Origem)$/, /^(Destino|To)$/, /^(Fecha|Date|Data)$/],
  refrigerado: [/^(Carga|Tipo de carga|Cargo|Cargo type)$/, /^Temperat/, /^(Origen|From|Origin|Origem)$/, /^(Destino|To|Destination)$/,
    /^(Fechas|Dates|Fechas de carga y entrega|Pickup and delivery dates|Datas|Datas de coleta e entrega)$/],
  deposito: [/^(Mercadería|Goods|Mercadoria)$/, /^(Espacio|Space|Espaço)/],
  autoelevador: [/^(Fecha|Date|Data)$/, /días|days|dias/, /^(Lugar|Location|Local)$/],
  mineria: [/^(Servicio|Service|Serviço)/, /^(Mina o campamento|Mine or camp|Mina ou acampamento)$/, /^(Fecha|Date|Data)$/],
  produccion: [/^(Fechas del rodaje|Shoot dates|Datas da filmagem)$/, /^(Locaciones|Locations|Locações)$/],
  agencia: [/^(Agencia|Agency|Agência)$/],
  'agencia-hotel': [/^(Agencia u hotel|Tour operator or hotel|Agência ou hotel)$/],
  general: [/^(Servicio|Service|Serviço)$/, /^(Fecha|Date|Data)$/, /^(Origen y destino|From and to|Origem e destino)$/],
  flota: [/^(Unidad|Vehicle|Veículo)$/],
  // Hub «Empresas y minería» (4-textos.md §4, 05/11/2026).
  empresa: [/^(Empresa|Company)$/, /^(Servicio|Service|Serviço) \(/, /^(Mina, origen o destino|Mine, origin or destination|Mina, origem ou destino)$/,
    /^(Fecha o frecuencia|Date or frequency|Data ou frequência)$/, /^(Personas o carga|People or cargo|Pessoas ou carga)$/],
  proveedor: [/^(Empresa|Company)$/, /^(Documentación que necesitan|Documents you need|Documentos de que precisam)$/],
  // Servicio «Documentación de ingreso» (servicio-documentacion-2026-11-05/
  // 4-textos.md §1.9, D6B): quién, cuántos vehículos y personas (el abono
  // depende de eso) y en qué mineras o portales.
  'documentacion-flota': [/^(Empresa|Company)$/, /^(Cantidad de vehículos|Number of vehicles|Quantidade de veículos)$/,
    /^(Cantidad de personas|Number of people|Quantidade de pessoas)$/, /^(Mineras o portales|Mines or portals|Mineradoras ou portais)$/],
};

const etiquetas = (texto, separador) => texto.split(separador).slice(1)
  .map((r) => r.replace(/:\s*$/, '').trim()).filter(Boolean);

test('el cuadro de requisitos cubre todos los tipos del script', async () => {
  const { TIPOS } = await guion;
  assert.deepStrictEqual(Object.keys(TIPOS).sort(), Object.keys(REQUISITOS).sort());
});

test('toda página con WhatsApp o correo tiene tipo y está al día (correr node scripts/prefill.mjs)', async () => {
  const { problemasDe, prefillHtml } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(prefillHtml(html, nombre) === html, `${nombre}: los mensajes no están al día`);
  }
});

// Los enlaces de los bloques que escribe scripts/bloques.mjs (cierre, pie,
// barra) son zonas GENERADO que prefill no toca; bloques.mjs los arma con las
// funciones de prefill. Se revisan igual que el resto, con el tipo de la página.
const deBloques = (html, nombre, PAGINAS) => [...html.matchAll(/<!-- GENERADO:(CIERRE|CONTACTO|BARRA) [\s\S]*?<!-- \/GENERADO:\1 -->/g)]
  .flatMap((z) => [...z[0].matchAll(/href="((?:https:\/\/wa\.me\/|mailto:)[^"]*)"/g)])
  .map((m) => ({ tipo: PAGINAS[nombre], url: m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') }));

test('cada wa.me lleva texto: primera línea con el servicio y los renglones de su tipo', async () => {
  const { enlacesDe, leerWa, PAGINAS } = await guion;
  let total = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const { tipo, url } of [...enlacesDe(html, nombre), ...deBloques(html, nombre, PAGINAS)].filter((e) => e.url.startsWith('https://wa.me/'))) {
      total++;
      const wa = leerWa(url);
      assert.ok(wa, `${nombre}: wa.me con otro formato: ${url}`);
      const [apertura] = wa.texto.split('\n');
      assert.match(apertura, /^(Hola|Hello|Olá) Lausof, .{10,}/, `${nombre}: primera línea vacía o genérica: "${apertura}"`);
      const renglones = etiquetas(wa.texto, '\n');
      for (const patron of REQUISITOS[tipo]) {
        assert.ok(renglones.some((r) => patron.test(r)), `${nombre} (${tipo}): falta ${patron} en "${wa.texto}"`);
      }
      assert.ok(wa.texto.length <= 300, `${nombre}: mensaje demasiado largo (${wa.texto.length})`);
      // Codificado entero: nada que corte el atributo ni la URL.
      assert.doesNotMatch(url.split('?text=')[1], /[\s"<>&#\n]/, `${nombre}: texto mal codificado`);
    }
  }
  assert.ok(total > 300, `se esperaban los ~380 wa.me del sitio, hay ${total}`);
});

test('el wa.me del pie de cada página lleva texto', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const sinTexto = [...html.matchAll(/(?:href|data-enlace)="https:\/\/wa\.me\/\d+"/g)];
    assert.strictEqual(sinTexto.length, 0, `${nombre}: ${sinTexto.length} wa.me sin texto`);
  }
});

test('cada mailto va a transporte@, sin copia, con asunto y con los renglones de su tipo', async () => {
  const { enlacesDe, leerMailto, PAGINAS } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const { tipo, url } of [...enlacesDe(html, nombre), ...deBloques(html, nombre, PAGINAS)].filter((e) => e.url.startsWith('mailto:'))) {
      const { destino, params } = leerMailto(url);
      const p = Object.fromEntries(params);
      assert.strictEqual(destino, 'transporte@lausof.com', `${nombre}: ${url}`);
      assert.ok(!params.some(([k]) => k.toLowerCase() === 'cc'), `${nombre}: mailto con copia: ${url}`);
      assert.ok(p.subject, `${nombre}: mailto sin asunto: ${url}`);
      assert.ok(p.body, `${nombre}: mailto sin cuerpo: ${url}`);
      const cuerpo = decodeURIComponent(p.body);
      const renglones = cuerpo.split('\r\n').map((r) => r.replace(/:\s*$/, '').trim()).filter(Boolean);
      for (const patron of REQUISITOS[tipo]) {
        assert.ok(renglones.some((r) => patron.test(r)), `${nombre} (${tipo}): el cuerpo no pide ${patron}`);
      }
    }
  }
});

test('el tipo de un enlace se puede pisar con data-prefill y el texto de la primera línea no se toca', async () => {
  const { prefillHtml } = await guion;
  const html = '<a href="https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20cotizar%20un%20servicio">a</a>'
    + '<a data-prefill="auxilio" href="https://wa.me/5493875269009?text=Hola%20Lausof%2C%20necesito%20auxilio.">b</a>'
    + '<li>WhatsApp <a href="https://wa.me/5493875269009">387 526-9009</a></li>'
    + '<a href="mailto:contacto@lausof.com?cc=transporte@lausof.com">c</a>'
    + '<a href="mailto:transporte@lausof.com?subject=Pedido%20de%20cotizaci%C3%B3n">d</a>';
  const listo = prefillHtml(html, 'index.html');
  const textos = [...listo.matchAll(/text=([^"]*)"/g)].map((m) => decodeURIComponent(m[1]));
  assert.deepStrictEqual(textos, [
    'Hola Lausof, quiero cotizar un servicio\nServicio: \nFecha: \nOrigen y destino: \nPasajeros o carga: ',
    'Hola Lausof, necesito auxilio.\nUbicación: \nVehículo: \nQué pasó: ',
    'Hola Lausof, quiero cotizar un servicio\nServicio: \nFecha: \nOrigen y destino: \nPasajeros o carga: ',
  ]);
  // El correo sin asunto toma el de la página; el destinatario pasa a ser
  // transporte@ y la copia se va (decisión del 03/11/2026).
  const correos = [...listo.matchAll(/href="(mailto:[^"]*)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(correos, [
    'mailto:transporte@lausof.com?subject=Pedido%20de%20cotizaci%C3%B3n&amp;body=Servicio%3A%0D%0AFecha%3A%0D%0AOrigen%20y%20destino%3A%0D%0APasajeros%20o%20carga%3A%0D%0A',
    'mailto:transporte@lausof.com?subject=Pedido%20de%20cotizaci%C3%B3n&amp;body=Servicio%3A%0D%0AFecha%3A%0D%0AOrigen%20y%20destino%3A%0D%0APasajeros%20o%20carga%3A%0D%0A',
  ]);
  assert.strictEqual(prefillHtml(listo, 'index.html'), listo, 'correrlo dos veces cambia el resultado');
});

test('el texto con contacto@ pasa a transporte@ y el pie no repite el correo', async () => {
  const { prefillHtml } = await guion;
  const html = '<a href="https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20cotizar%20un%20servicio">a</a>'
    + '<a class="btn" href="mailto:contacto@lausof.com?cc=transporte@lausof.com&amp;subject=Consulta">Escribir a contacto@lausof.com</a>'
    + '<ul>\n        <li><a href="mailto:contacto@lausof.com?cc=transporte@lausof.com&amp;subject=Consulta">contacto@lausof.com</a></li>\n'
    + '        <li><a href="mailto:transporte@lausof.com?subject=Consulta">transporte@lausof.com</a></li>\n      </ul>';
  const listo = prefillHtml(html, 'index.html');
  assert.doesNotMatch(listo, /contacto@|cc=/);
  assert.match(listo, />Escribir a transporte@lausof\.com</);
  assert.strictEqual((listo.match(/<li>/g) || []).length, 1, 'el pie quedó con el correo repetido');
  assert.strictEqual(prefillHtml(listo, 'index.html'), listo, 'correrlo dos veces cambia el resultado');
});

test('una página nueva sin tipo se avisa y no se toca', async () => {
  const { problemasDe, prefillHtml } = await guion;
  const html = '<a href="https://wa.me/5493875269009?text=Hola%20Lausof%2C%20quiero%20cotizar%20una%20gr%C3%BAa">a</a>';
  assert.match(problemasDe(html, 'pagina-nueva.html').join(), /sin tipo en PAGINAS/);
  assert.strictEqual(prefillHtml(html, 'pagina-nueva.html'), html);
  assert.match(problemasDe(html.replace('<a ', '<a data-prefill="inventado" '), 'index.html').join(), /tipo desconocido/);
});

test('las zonas GENERADO de otro script (tarjetas de la flota) no se tocan', async () => {
  const { prefillHtml } = await guion;
  const zona = '<!-- GENERADO:UNIDADES — x -->\n<a href="https://wa.me/5493875092489?text=Hola%20Lausof%2C%20quiero%20consultar%20por%20la%20unidad%20X">a</a>\n<!-- /GENERADO:UNIDADES -->';
  const html = '<a href="https://wa.me/5493875092489?text=Hola%20Lausof%2C%20quiero%20consultar%20por%20una%20unidad">b</a>' + zona;
  assert.ok(prefillHtml(html, 'flota-en-venta.html').endsWith(zona));
});

// GA4: los enlaces reales, ya con renglones, siguen mandando su evento por
// canal y sin el mensaje (js/contacto.js mide por el href).
test('los enlaces pre-armados reales mandan contact_whatsapp y contact_email sin el texto', () => {
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'js', 'contacto.js'), 'utf8');
  const html = paginas['traslado-salta-cafayate.html'];
  const wa = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)[1];
  const mail = html.match(/href="(mailto:transporte@[^"]+)"/)[1].replace(/&amp;/g, '&');
  const eventos = [];
  let escucha;
  const window = { location: { pathname: '/traslado-salta-cafayate.html' }, gtag: (...a) => eventos.push(a) };
  const document = { documentElement: { lang: 'es-AR' }, addEventListener: (t, fn) => { escucha = fn; } };
  vm.runInNewContext(codigo, { window, document });
  for (const href of [wa, mail]) {
    const a = { textContent: 'Cotizar', getAttribute: (n) => (n === 'href' ? href : null), closest: (s) => (s === 'a[href]' ? a : s === '.wa-bar' ? {} : null) };
    escucha({ target: a });
  }
  assert.deepStrictEqual(eventos.map((e) => e[1]), ['contact_whatsapp', 'contact_email']);
  for (const [, , params] of eventos) {
    assert.deepStrictEqual(Object.keys(params).sort(), ['contact_channel', 'contact_page_path', 'link_position', 'link_text', 'page_language']);
    assert.doesNotMatch(JSON.stringify(params), /Fecha|Pasajeros|Cafayate|@/);
  }
});

test('todas las páginas con WhatsApp o correo cargan js/contacto.js', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (!/href="(https:\/\/wa\.me\/|mailto:)/.test(html)) continue;
    assert.match(html, /<script defer src="\/js\/contacto\.js\?v=[0-9a-f]+"><\/script>/, `${nombre} no mide los contactos`);
  }
});
