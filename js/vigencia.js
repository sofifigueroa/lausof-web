/* Fechas con vencimiento: esconde lo que ya pasó.

   Una fila con fecha (un recital, un evento) lleva su último día en
   data-hasta="AAAA-MM-DD". Desde el día siguiente, la fila se oculta: el
   sitio nunca ofrece un viaje a una fecha que ya pasó, aunque nadie haya
   editado la página todavía.

     <ol data-vigencia>
       <li data-hasta="2026-10-24">…</li>
     </ol>
     <p data-sin-proximos hidden>Mensaje para cuando no queda ninguna fila.</p>

   - "Hoy" es el día calendario en Salta (America/Argentina/Salta), no el del
     visitante: una fila del 24/10 se ve todo el 24/10 hora argentina.
   - Cada lista [data-vigencia] cuenta sus filas vigentes. Si no queda
     ninguna, muestra el [data-sin-proximos] de su misma sección.
   - Sin JavaScript se ve la lista completa: por eso las filas vencidas se
     sacan del HTML en la revisión mensual (tests/recitales.test.js avisa).

   Sin dependencias. Cualquier página puede cargarlo con
   <script defer src="/js/vigencia.js?v=1"></script>. */
(function () {
  'use strict';

  var FECHA = /^\d{4}-\d{2}-\d{2}$/;

  function dosCifras(n) { return (n < 10 ? '0' : '') + n; }

  // AAAA-MM-DD de hoy en Salta. Si el navegador no sabe de zonas horarias,
  // usa la fecha local del visitante.
  function hoyEnSalta() {
    var ahora = new Date();
    try {
      var texto = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Salta' });
      if (FECHA.test(texto)) return texto;
    } catch (e) { /* sigue con la fecha local */ }
    return ahora.getFullYear() + '-' + dosCifras(ahora.getMonth() + 1) + '-' + dosCifras(ahora.getDate());
  }

  var hoy = hoyEnSalta();
  var listas = document.querySelectorAll('[data-vigencia]');

  for (var i = 0; i < listas.length; i++) {
    var filas = listas[i].querySelectorAll('[data-hasta]');
    var vigentes = 0;
    for (var j = 0; j < filas.length; j++) {
      var hasta = filas[j].getAttribute('data-hasta');
      // Una fecha mal escrita no esconde nada: mejor una fila de más que
      // perder una vigente por un error de tipeo.
      if (FECHA.test(hasta) && hasta < hoy) {
        filas[j].hidden = true;
      } else {
        vigentes++;
      }
    }
    if (vigentes === 0) {
      var seccion = listas[i].closest('section') || document;
      var aviso = seccion.querySelector('[data-sin-proximos]');
      if (aviso) aviso.hidden = false;
    }
  }
})();
