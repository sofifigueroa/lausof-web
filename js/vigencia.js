/* Fechas con vencimiento: separa lo que ya pasó, nunca lo esconde.

   Regla (Lautaro, 10/10/2026; ~/lausof/web/growth-2026-10/BUILD-BRIEF.md,
   "Past events"): un evento o una fecha que ya pasó NO se saca, no se
   redirige ni se esconde. La fila queda pública para buscadores y asistentes
   de IA, porque muestra a qué eventos lleva gente Lausof; sólo cambia de
   lugar y de etiqueta.

   Una fila con fecha lleva su último día en data-hasta="AAAA-MM-DD":

     <section>
       <ol data-vigencia>
         <li data-hasta="2026-10-24">… <a class="walink" href="…">Cotizar →</a></li>
       </ol>
       <div data-anteriores data-enlace="https://wa.me/…" data-etiqueta="Consultar →" hidden>
         <h3>Fechas anteriores</h3>
         <ol></ol>
       </div>
       <p data-sin-proximos hidden>Mensaje cuando no queda ninguna fecha próxima.</p>
     </section>
     <aside data-edicion-pasada hidden>Esta edición ya pasó…</aside>

   - Desde el día siguiente a data-hasta, la fila pasa al <ol> de su
     [data-anteriores] (en el mismo orden), recibe la clase "fila-pasada" y su
     enlace de cotizar se cambia por el de data-enlace / data-etiqueta: ya no
     se cotiza una fecha que pasó, se consulta por la próxima.
   - Si en una lista no queda ninguna fecha próxima, se muestra el
     [data-sin-proximos] de su sección (si lo tiene).
   - Si en TODA la página no queda ninguna fecha próxima, se muestra el
     [data-edicion-pasada] (la nota de arriba de las páginas de evento).
   - "Hoy" es el día calendario en Salta (America/Argentina/Salta), no el del
     visitante: una fila del 24/10 sigue entre las próximas todo el 24/10.
   - Sin JavaScript se ven todas las filas en la lista principal: el HTML
     servido siempre las tiene todas. El script sólo reordena y etiqueta;
     nunca pone hidden ni display:none a una fila.

   Sin dependencias. Cualquier página puede cargarlo con
   <script defer src="/js/vigencia.js?v=2"></script>. */
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

  // La fila pasada ya no cotiza su fecha: su enlace lleva a consultar por la
  // próxima edición o por un viaje similar.
  function reetiquetar(fila, bloque) {
    if (!bloque) return;
    var enlace = fila.querySelector('a.walink');
    var href = bloque.getAttribute('data-enlace');
    var etiqueta = bloque.getAttribute('data-etiqueta');
    if (!enlace) return;
    if (href) enlace.setAttribute('href', href);
    if (etiqueta) enlace.textContent = etiqueta;
  }

  var hoy = hoyEnSalta();
  var listas = document.querySelectorAll('[data-vigencia]');
  var paginaSinProximas = listas.length > 0;

  for (var i = 0; i < listas.length; i++) {
    var seccion = listas[i].closest('section') || document;
    var bloque = seccion.querySelector('[data-anteriores]');
    var destino = bloque ? bloque.querySelector('ol') : null;
    var filas = listas[i].querySelectorAll('[data-hasta]');
    var proximas = 0;
    var pasadas = 0;

    for (var j = 0; j < filas.length; j++) {
      var hasta = filas[j].getAttribute('data-hasta');
      // Una fecha mal escrita cuenta como próxima: mejor una fila de más
      // entre las próximas que mandar una vigente a "anteriores".
      if (FECHA.test(hasta) && hasta < hoy) {
        pasadas++;
        filas[j].classList.add('fila-pasada');
        reetiquetar(filas[j], bloque);
        if (destino) destino.appendChild(filas[j]);
      } else {
        proximas++;
      }
    }

    if (pasadas > 0 && bloque) bloque.hidden = false;
    if (proximas === 0) {
      var aviso = seccion.querySelector('[data-sin-proximos]');
      if (aviso) aviso.hidden = false;
    } else {
      paginaSinProximas = false;
    }
  }

  if (paginaSinProximas) {
    var nota = document.querySelector('[data-edicion-pasada]');
    if (nota) nota.hidden = false;
  }
})();
