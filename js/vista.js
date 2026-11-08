/* VISTA DE REVISIÓN (rondas 2026-11-07, v3) — sólo para la revisión local; el
   merge lo borra con las zonas RONDA:VISTA (`node scripts/vista.mjs --quitar`).

   Hace funcionar, sin red y sin la app de reservas, lo que la vitrina y el
   chat van a hacer en lausof.com (Lautaro, 07/11: «yes… the plan is to go live
   with these this week»):
   1. La vitrina real (vista/tienda/js/tienda.js, copia de tienda-v2-0611)
      lee el catálogo de prueba que la copia sirve en
      /api/publico/lausof/catalogo, y «Reservar» abre la compra de muestra
      (/lausof/reservar/). Para eso el sitio de reservas de la configuración
      pasa a ser el origen de esta copia.
   2. Un botón y un panel de chat con el aspecto del botón real (redondo,
      12 px arriba de la barra del teléfono; abajo a la derecha en
      computadora) que abren también con cada [data-asistente-abrir].
   Ningún dato sale de la página. La página lo pide recién con el `load`, como
   la vitrina pide los suyos (tienda.mjs, CARGA): pedido antes, con `defer`,
   corría el LCP simulado de charter-recitales de 3303 a 3453 ms. */
(function () {
  'use strict';
  var SITIO = 'https://reservas.invalid';
  var doc = document;
  var idioma = (doc.documentElement.lang || 'es').slice(0, 2).toLowerCase();
  if (idioma !== 'en' && idioma !== 'pt') idioma = 'es';

  /* Textos del chat: los del chat real (asistente/canon.ts), más el aviso de esta vista. */
  var T = {
    es: { boton: 'Precio y reserva', cabecera: 'Asistente con IA', bienvenida: '¿En qué te puedo ayudar? Cuéntame qué necesitas y te ayudo a encontrar precio u opciones.',
      privacidad: 'Lausof guarda este chat para atender tu pedido. Puedes verlo, corregirlo o borrarlo.', enlace: 'Privacidad', persona: 'Hablar con una persona',
      derivar: 'Esto lo tiene que ver una persona del equipo. ¿A qué correo o WhatsApp te escribimos?', placeholder: 'Escribe tu mensaje', enviar: 'Enviar', cerrar: 'Cerrar',
      escribiendo: 'Escribiendo…', vista: 'Vista de revisión: aquí contesta el chat real.', marca: 'vista de revisión' },
    en: { boton: 'Price and booking', cabecera: 'AI assistant', bienvenida: "How can I help you? Tell me what you need and I'll help you find a price or options.",
      privacidad: 'Lausof keeps this chat to handle your request. You can see, correct or delete it.', enlace: 'Privacy', persona: 'Talk to a person',
      derivar: 'A person on our team needs to look at this. Which email or WhatsApp number should we write to?', placeholder: 'Write your message', enviar: 'Send', cerrar: 'Close',
      escribiendo: 'Typing…', vista: 'Review copy: the live chat answers here.', marca: 'vista de revisión' },
    pt: { boton: 'Preço e reserva', cabecera: 'Assistente com IA', bienvenida: 'Como posso ajudar? Conte o que você precisa e eu ajudo a encontrar preço ou opções.',
      privacidad: 'A Lausof guarda este chat para atender ao seu pedido. Você pode ver, corrigir ou apagar.', enlace: 'Privacidade', persona: 'Falar com uma pessoa',
      derivar: 'Uma pessoa da equipe precisa ver isso. Para qual e-mail ou WhatsApp escrevemos?', placeholder: 'Escreva sua mensagem', enviar: 'Enviar', cerrar: 'Fechar',
      escribiendo: 'Escrevendo…', vista: 'Vista de revisão: aqui responde o chat real.', marca: 'vista de revisión' },
  }[idioma];

  // La hoja de esta vista (marcas, el botón y el panel del chat, el pie con su peso normal).
  var hoja = doc.createElement('link');
  hoja.rel = 'stylesheet';
  hoja.href = '/vista/vista.css';
  doc.head.appendChild(hoja);

  /* ---- 1. la vitrina con el catálogo de prueba de esta copia ---- */
  var config = doc.getElementById('tienda-config');
  if (config) {
    try {
      var c = JSON.parse(config.textContent);
      c.sitio = location.origin;
      config.textContent = JSON.stringify(c);
    } catch (e) { config = null; }
  }
  // Los enlaces que el HTML ya trae al sitio de reservas (el pie, la compra sin JavaScript).
  [].forEach.call(doc.querySelectorAll('a[href^="' + SITIO + '/"]'), function (a) {
    a.setAttribute('href', location.origin + a.getAttribute('href').slice(SITIO.length));
  });
  function cargarVitrina() {
    if (!config) return;
    ['/js/precios-host.js', '/vista/tienda/js/tienda.js'].forEach(function (u) {
      var s = doc.createElement('script'); s.src = u; s.async = false; doc.head.appendChild(s);
    });
  }
  if (doc.readyState === 'complete') cargarVitrina(); else addEventListener('load', cargarVitrina);

  /* ---- 2. el botón y el panel del chat ---- */
  var telefono = matchMedia('(max-width:880px)');
  var boton = doc.createElement('button');
  boton.type = 'button';
  boton.className = 'vchat-boton';
  boton.setAttribute('aria-haspopup', 'dialog');
  boton.setAttribute('aria-label', T.boton);
  var ICONO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';

  // La barra que se ve (la de hoy o la de la vitrina) y 12 px arriba de ella.
  function barraVisible() {
    var barras = doc.querySelectorAll('.wa-bar');
    for (var i = 0; i < barras.length; i += 1) if (barras[i].getClientRects().length && getComputedStyle(barras[i]).display !== 'none') return barras[i];
    return null;
  }
  function ubicar() {
    var redonda = telefono.matches;
    boton.classList.toggle('redonda', redonda);
    boton.innerHTML = redonda ? ICONO : '';
    if (!redonda) boton.textContent = T.boton;
    boton.title = redonda ? T.boton : '';
    var barra = redonda ? barraVisible() : null;
    var abajo = barra ? Math.round(barra.getBoundingClientRect().height) + 12 : 16;
    boton.style.bottom = abajo + 'px';
    if (panel) panel.style.bottom = innerWidth < 480 ? '' : abajo + 'px';
  }

  var panel = null;
  var campo = null;
  function burbuja(texto, clase) {
    var d = doc.createElement('div');
    d.className = 'vchat-m ' + clase;
    d.textContent = texto;
    var log = panel.querySelector('.vchat-log');
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  function responder(texto) {
    var espera = burbuja(T.escribiendo, 'vchat-b');
    setTimeout(function () { espera.textContent = texto; }, 600);
  }
  function armarPanel() {
    panel = doc.createElement('div');
    panel.className = 'vchat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Lausof · ' + T.cabecera);
    var priv = doc.querySelector('.legal-enlaces a');
    var hrefPriv = priv ? priv.getAttribute('href') : '/privacidad.html';
    panel.innerHTML = '<div class="vchat-cab"><span class="vchat-logo" aria-hidden="true">L</span>'
      + '<div class="vchat-quien"><b>Lausof</b><span></span><br><i></i></div>'
      + '<button type="button" class="vchat-persona"></button><button type="button" class="vchat-cerrar">×</button></div>'
      + '<div class="vchat-log" role="log" aria-live="polite" aria-relevant="additions"></div>'
      + '<div class="vchat-pie"><div class="vchat-fila"><label class="vchat-oculto" for="vchat-texto"></label>'
      + '<textarea id="vchat-texto" rows="1" maxlength="1000"></textarea>'
      + '<button type="button" class="vchat-enviar"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z"/></svg></button></div>'
      + '<p class="vchat-priv"><span></span> <a target="_blank" rel="noopener"></a></p></div>';
    panel.querySelector('.vchat-quien span').textContent = T.cabecera;
    panel.querySelector('.vchat-quien i').textContent = T.marca;
    panel.querySelector('.vchat-persona').textContent = T.persona;
    panel.querySelector('.vchat-cerrar').setAttribute('aria-label', T.cerrar);
    panel.querySelector('.vchat-oculto').textContent = T.placeholder;
    campo = panel.querySelector('textarea');
    campo.placeholder = T.placeholder;
    panel.querySelector('.vchat-enviar').setAttribute('aria-label', T.enviar);
    panel.querySelector('.vchat-priv span').textContent = T.privacidad;
    var a = panel.querySelector('.vchat-priv a');
    a.textContent = T.enlace;
    a.href = hrefPriv;
    doc.body.appendChild(panel);
    burbuja(T.bienvenida, 'vchat-b');
    function mandar() {
      var t = campo.value.trim();
      if (!t) return;
      campo.value = '';
      burbuja(t, 'vchat-y');
      responder(T.vista);
    }
    panel.querySelector('.vchat-enviar').addEventListener('click', mandar);
    campo.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); mandar(); } });
    panel.querySelector('.vchat-persona').addEventListener('click', function () { burbuja(T.persona, 'vchat-y'); responder(T.derivar); });
    panel.querySelector('.vchat-cerrar').addEventListener('click', cerrar);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  }
  function abrir() {
    if (!panel) armarPanel();
    panel.hidden = false;
    boton.hidden = true;
    ubicar();
    campo.focus();
  }
  function cerrar() {
    if (!panel) return;
    panel.hidden = true;
    boton.hidden = false;
    boton.focus();
  }
  boton.addEventListener('click', abrir);
  // El enganche del chat (R6): cada [data-asistente-abrir] abre el panel en vez de seguir su enlace de respaldo.
  doc.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-asistente-abrir]') : null;
    if (!el) return;
    e.preventDefault();
    abrir();
  });
  var cuadro = 0;
  addEventListener('resize', function () { if (cuadro) return; cuadro = requestAnimationFrame(function () { cuadro = 0; ubicar(); }); });
  function poner() { doc.body.appendChild(boton); ubicar(); }
  if (doc.body) poner(); else doc.addEventListener('DOMContentLoaded', poner);
  // La barra de la vitrina aparece (o se va) cuando carga el catálogo: se vuelve a medir.
  function remedir() { setTimeout(ubicar, 400); setTimeout(ubicar, 1500); }
  if (doc.readyState === 'complete') remedir(); else addEventListener('load', remedir);
})();
