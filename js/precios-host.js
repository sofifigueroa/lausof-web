/* ¿Puede esta página mostrar los precios del catálogo? (cinturón de la vitrina)

   El catálogo de Apacheta dice si sus precios son de prueba ("demo": true).
   Un precio de prueba nunca se muestra en www.lausof.com, y un precio real
   nunca se muestra en la demo. Si el catálogo y el host no coinciden, la
   vitrina no dibuja montos: muestra el camino «a cotizar» y lo deja anotado en
   la consola para QA (3b-diseno-entorno.md §2, G10).

   La vitrina (js/tienda.js) llama a window.LausofPrecios.puedeMostrarPrecios
   antes de dibujar cualquier monto. Los tests lo cargan con require().
   La lista de hosts de producción es la de scripts/entorno.mjs
   (HOSTS_PRODUCCION); tests/entorno.test.js corta si se separan. */
(function (raiz) {
  'use strict';

  var HOSTS_PRODUCCION = ['www.lausof.com', 'lausof.com'];

  function puedeMostrarPrecios(opciones) {
    var host = String((opciones && opciones.host) || '').toLowerCase().replace(/:\d+$/, '');
    var catalogoDemo = opciones && opciones.catalogoDemo;
    if (typeof catalogoDemo !== 'boolean') return false;
    var esProduccion = HOSTS_PRODUCCION.indexOf(host) !== -1;
    return esProduccion ? catalogoDemo === false : catalogoDemo === true;
  }

  var api = { puedeMostrarPrecios: puedeMostrarPrecios, HOSTS_PRODUCCION: HOSTS_PRODUCCION.slice() };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else raiz.LausofPrecios = api;
})(this);
