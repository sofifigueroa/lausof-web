/* Menú del sitio (lo arma scripts/menu.mjs). Los desplegables y la hoja del
   teléfono son <details>: abren y cierran solos, sin este archivo. Esto sólo
   suma lo que <details> no hace:
   - abrir uno cierra el otro;
   - un toque afuera, o Escape, cierra lo abierto (Escape devuelve el foco a
     su botón);
   - elegir un enlace cierra el menú (si el enlace es un ancla de la misma
     página, como «Contacto», el menú no queda abierto encima);
   - con la hoja del teléfono abierta, la página de atrás no se desplaza.
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
