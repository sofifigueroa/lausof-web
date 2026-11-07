/* =============================================================================
   FOTOS QUE ESPERAN A ACERCARSE — js/fotos-cerca.js
   -----------------------------------------------------------------------------
   Para fotos fijas debajo del encabezado (hoy, las tarjetas de circuito de los
   hubs de turismo ES/EN/PT). Con `loading="lazy"` solo, Chrome las pide ni
   bien arma la página (su margen llega a 1250–2500 px) y le quitan ancho de
   banda a la foto del encabezado, que es la LCP: con las fotos del lote 2 en
   las tarjetas, la LCP simulada de turismo pasaba de 3,53 s a 3,75 s
   (Lighthouse móvil, 06/11/2026).

   Cada contenedor con `data-fotos-cerca` tiene su <img> en espera
   (display:none en css/turismo.css, así no se pide; la caja guarda su
   proporción y nada se mueve) hasta que este script le pone `.fotos-cerca`,
   300 px antes de que entre en pantalla. Es el mismo criterio que
   `.galeria-cerca` de js/galeria.js. Sin JavaScript (sin `html.js`) las fotos
   cargan como siempre; sin IntersectionObserver se sueltan todas de entrada.
   ============================================================================= */
(function () {
  'use strict';
  var cajas = [].slice.call(document.querySelectorAll('[data-fotos-cerca]'));
  function soltar(caja) { caja.classList.add('fotos-cerca'); }
  if (!('IntersectionObserver' in window)) { cajas.forEach(soltar); return; }
  var vigia = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { soltar(e.target); vigia.unobserve(e.target); }
    });
  }, { rootMargin: '300px 0px' });
  cajas.forEach(function (caja) { vigia.observe(caja); });
})();
