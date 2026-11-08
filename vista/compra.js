/* Vista de revisión (rondas 2026-11-07, v3): la compra de muestra a la que
   lleva «Reservar» en la copia local. Lee el mismo catálogo de prueba que la
   vitrina e imprime sus montos tal como vienen (nunca calcula uno). Tres
   pasos, como la compra alojada de la app (3c-wireframes/03-compra-390.html):
   tu viaje, tus datos, pago. «Confirmar y pagar» no cobra: muestra el aviso. */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var idioma = ['es', 'en', 'pt'].indexOf(q.get('idioma')) >= 0 ? q.get('idioma') : 'es';
  var T = {
    es: { banda: 'precios de prueba · no se cobra', volver: '← Volver a lausof.com', paso: '{p} de 3', tu_viaje: 'Tu viaje', fecha: 'Fecha', hora: 'Hora de salida', personas: 'Personas',
      buscamos: 'Dónde los buscamos', seguir: 'Seguir', tus_datos: 'Tus datos', nombre: 'Nombre y apellido', correo: 'Correo', pago: 'Pago', mp: 'Pago procesado por Mercado Pago.',
      acepta: 'Al confirmar, aceptas las condiciones de la reserva.', aviso: 'Vista de revisión: aquí se abre Mercado Pago en modo de prueba. No se cobra nada.',
      vehiculo: 'En {v} con chofer.', neto: 'Precio sin impuestos nacionales: {n}', total: 'Total', presupuesto: 'Pedir presupuesto', hoy: 'Total a pagar hoy · {t}', pagar: 'Confirmar y pagar {t}',
      mas: 'Se coordina con más de un vehículo. El pedido sale con las {n} personas y la fecha.', medida: 'Precio a medida del viaje.', sin: 'Elige un viaje desde la página de lausof.com.',
      e_fecha: 'Elige la fecha del viaje.', e_lugar: 'Escribe dónde los buscamos.', e_nombre: 'Escribe tu nombre.', e_correo: 'Escribe un correo válido.', e_wa: 'Escribe tu WhatsApp.', por_dia: ' por día' },
    en: { banda: 'test prices · nothing is charged', volver: '← Back to lausof.com', paso: '{p} of 3', tu_viaje: 'Your trip', fecha: 'Date', hora: 'Departure time', personas: 'People',
      buscamos: 'Where we pick you up', seguir: 'Continue', tus_datos: 'Your details', nombre: 'Full name', correo: 'Email', pago: 'Payment', mp: 'Payment processed by Mercado Pago.',
      acepta: 'By confirming, you accept the booking conditions.', aviso: 'Review copy: Mercado Pago opens here in test mode. Nothing is charged.',
      vehiculo: 'By {v} with a driver.', neto: 'Precio sin impuestos nacionales (excl. Argentine taxes): {n}', total: 'Total', presupuesto: 'Request a quote', hoy: 'Total to pay today · {t}', pagar: 'Confirm and pay {t}',
      mas: 'Arranged with more than one vehicle. The request goes out with the {n} people and the date.', medida: 'Priced for each trip.', sin: 'Choose a trip on lausof.com.',
      e_fecha: 'Choose the date of the trip.', e_lugar: 'Write where we pick you up.', e_nombre: 'Write your name.', e_correo: 'Write a valid email.', e_wa: 'Write your WhatsApp number.', por_dia: ' per day' },
    pt: { banda: 'preços de teste · nada é cobrado', volver: '← Voltar para lausof.com', paso: '{p} de 3', tu_viaje: 'Sua viagem', fecha: 'Data', hora: 'Horário de saída', personas: 'Pessoas',
      buscamos: 'Onde buscamos vocês', seguir: 'Continuar', tus_datos: 'Seus dados', nombre: 'Nome e sobrenome', correo: 'E-mail', pago: 'Pagamento', mp: 'Pagamento processado pelo Mercado Pago.',
      acepta: 'Ao confirmar, você aceita as condições da reserva.', aviso: 'Vista de revisão: aqui abre o Mercado Pago em modo de teste. Nada é cobrado.',
      vehiculo: 'De {v} com motorista.', neto: 'Precio sin impuestos nacionales (sem impostos argentinos): {n}', total: 'Total', presupuesto: 'Pedir orçamento', hoy: 'Total a pagar hoje · {t}', pagar: 'Confirmar e pagar {t}',
      mas: 'Organizado com mais de um veículo. O pedido sai com as {n} pessoas e a data.', medida: 'Preço sob medida para a viagem.', sin: 'Escolha uma viagem em lausof.com.',
      e_fecha: 'Escolha a data da viagem.', e_lugar: 'Escreva onde buscamos vocês.', e_nombre: 'Escreva seu nome.', e_correo: 'Escreva um e-mail válido.', e_wa: 'Escreva seu WhatsApp.', por_dia: ' por dia' },
  }[idioma];
  var t = function (id, v) { return T[id].replace(/\{(\w)\}/g, function (_, k) { return v && k in v ? v[k] : ''; }); };
  var $ = function (id) { return document.getElementById(id); };
  document.documentElement.lang = idioma;
  [].forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.getAttribute('data-t')); });

  // Volver: sólo a una página de este mismo sitio.
  try {
    var vuelta = new URL(q.get('desde') || '/', location.origin);
    if (vuelta.origin === location.origin) $('volver').href = vuelta.pathname + vuelta.hash;
  } catch (e) { /* queda «/» */ }

  for (var h = 6; h <= 20; h += 1) {
    ['00', '30'].forEach(function (m) {
      var o = document.createElement('option'); o.textContent = (h < 10 ? '0' : '') + h + ':' + m; if (h === 8 && m === '00') o.selected = true; $('hora').appendChild(o);
    });
  }
  var hoy = new Date(); $('fecha').min = hoy.toISOString().slice(0, 10);

  var n = parseInt(q.get('pasajeros'), 10);
  if (!(n >= 1 && n <= 99)) n = 2;
  var servicio = null;
  var elegido = null; // el tramo de personas que vale para n, o null

  function mostrar(paso) {
    ['viaje', 'datos', 'pago'].forEach(function (id, i) { $(id).hidden = i !== paso - 1; });
    $('paso').textContent = t('paso', { p: paso });
    window.scrollTo(0, 0);
  }
  function pintar() {
    $('n').value = n;
    var p = servicio && servicio.precio;
    var tramos = (p && p.tramos) || [];
    elegido = null;
    for (var i = 0; i < tramos.length; i += 1) if (n >= tramos[i].pasajeros_min && n <= tramos[i].pasajeros_max) elegido = tramos[i];
    $('info').textContent = elegido ? t('vehiculo', { v: elegido.vehiculo }) : (p ? t('mas', { n: n }) : t('medida'));
    if (elegido) {
      $('total').innerHTML = '';
      var r = document.createElement('span'); r.textContent = t('total');
      var b = document.createElement('b'); b.textContent = elegido.total_texto + (p.unidad === 'dia' ? T.por_dia : '');
      var s = document.createElement('small'); s.textContent = t('neto', { n: elegido.neto_texto });
      $('total').append(r, b, s);
      $('seguir1').textContent = t('seguir');
    } else {
      $('total').textContent = '';
      $('seguir1').textContent = t('presupuesto');
    }
  }
  $('menos').addEventListener('click', function () { if (n > 1) { n -= 1; pintar(); } });
  $('mas').addEventListener('click', function () { if (n < 99) { n += 1; pintar(); } });
  $('n').addEventListener('change', function () { var v = parseInt($('n').value, 10); if (v >= 1 && v <= 99) n = v; pintar(); });

  function falta(idError, campos) {
    for (var i = 0; i < campos.length; i += 1) {
      var c = campos[i];
      if (!c[0]) { $(idError).textContent = t(c[1]); $(idError).hidden = false; return true; }
    }
    $(idError).hidden = true;
    return false;
  }
  $('seguir1').addEventListener('click', function () {
    if (falta('error-viaje', [[$('fecha').value, 'e_fecha'], [$('lugar').value.trim(), 'e_lugar']])) return;
    mostrar(2);
  });
  $('seguir2').addEventListener('click', function () {
    if (falta('error-datos', [[$('nombre').value.trim(), 'e_nombre'], [/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('correo').value.trim()), 'e_correo'], [$('wa').value.trim(), 'e_wa']])) return;
    if (!elegido) { $('aviso').hidden = false; mostrar(3); $('hoy').textContent = ''; $('pagar').hidden = true; return; }
    $('hoy').textContent = t('hoy', { t: elegido.total_texto });
    $('pagar').textContent = t('pagar', { t: elegido.total_texto });
    mostrar(3);
  });
  $('pagar').addEventListener('click', function () { $('aviso').hidden = false; });

  mostrar(1);
  fetch('/api/publico/lausof/catalogo?idioma=' + idioma).then(function (r) { return r.json(); }).then(function (c) {
    var clave = q.get('servicio');
    servicio = (c.servicios || []).filter(function (s) { return s.clave === clave || s.id === clave; })[0] || null;
    $('servicio').textContent = servicio ? servicio.nombre : t('sin');
    pintar();
  }).catch(function () { $('servicio').textContent = t('sin'); });
})();
