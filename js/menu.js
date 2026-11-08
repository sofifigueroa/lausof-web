/* Menú del sitio (lo arma scripts/menu.mjs). Los desplegables y la hoja del
   teléfono son <details>: abren y cierran solos, sin este archivo. Esto sólo
   suma lo que <details> no hace:
   - abrir uno cierra el otro;
   - un toque afuera, o Escape, cierra lo abierto (Escape devuelve el foco a
     su botón);
   - elegir un enlace cierra el menú (si el enlace es un ancla de la misma
     página, como «Contacto», el menú no queda abierto encima);
   - con la hoja del teléfono abierta, la página de atrás no se desplaza.
   Y el botón de WhatsApp de la barra de arriba (.nav-cta), al final.
   No lee ni manda datos. */
(function () {
  'use strict';
  var menus = Array.prototype.slice.call(document.querySelectorAll('nav.main details, details.menu-movil'));
  if (!menus.length) return;

  function cerrar(excepto) {
    menus.forEach(function (d) { if (d !== excepto && d.open) d.open = false; });
  }

  menus.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) cerrar(d);
      if (d.classList.contains('menu-movil')) {
        document.documentElement.classList.toggle('menu-abierto', d.open);
      }
    });
    Array.prototype.forEach.call(d.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { cerrar(null); });
    });
  });

  document.addEventListener('click', function (e) {
    menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (d) {
      if (!d.open) return;
      d.open = false;
      var boton = d.querySelector('summary');
      if (boton) boton.focus();
    });
  });
})();

/* El botón de WhatsApp de la barra de arriba (.nav-cta) aparece cuando el
   encabezado de la página (el hero de la portada o el .page-head de las
   demás) sale de la pantalla: mientras se ve el encabezado, sus propios
   botones ya están a la vista (css/styles.css, body.past-hero). Sin
   encabezado, o sin IntersectionObserver, aparece de entrada.
   Hasta el 08/11/2026 este código estaba copiado en línea al final de 82
   páginas; en un archivo la política de seguridad (CSP) puede dejar de
   aceptar scripts en línea (rondas-2026-11-07/2-estado-actual.md, W8). Va en
   este archivo, que ya cargan todas las páginas con barra, y no en uno
   propio: un pedido más en la carga atrasaba la foto principal. */
(function () {
  'use strict';
  var encabezado = document.querySelector('.hero, .page-head');
  var mostrar = function () { document.body.classList.add('past-hero'); };
  if (!encabezado || !('IntersectionObserver' in window)) { mostrar(); return; }
  new IntersectionObserver(function (entradas) {
    document.body.classList.toggle('past-hero', !entradas[0].isIntersecting);
  }).observe(encabezado);
})();
