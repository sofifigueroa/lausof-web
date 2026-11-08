/* El botón de WhatsApp de la barra de arriba (.nav-cta) aparece cuando el
   encabezado de la página (el hero de la portada o el .page-head de las
   demás) sale de la pantalla: mientras se ve el encabezado, sus propios
   botones ya están a la vista (css/styles.css, body.past-hero). Sin
   encabezado, o sin IntersectionObserver, aparece de entrada.
   Hasta el 08/11/2026 este código estaba copiado en línea al final de 82
   páginas; en un archivo propio la política de seguridad (CSP) puede dejar
   de aceptar scripts en línea (rondas-2026-11-07/2-estado-actual.md, W8).
   No lee ni manda datos. */
(function () {
  'use strict';
  var encabezado = document.querySelector('.hero, .page-head');
  var mostrar = function () { document.body.classList.add('past-hero'); };
  if (!encabezado || !('IntersectionObserver' in window)) { mostrar(); return; }
  new IntersectionObserver(function (entradas) {
    document.body.classList.toggle('past-hero', !entradas[0].isIntersecting);
  }).observe(encabezado);
})();
