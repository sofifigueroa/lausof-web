/* Medición de contactos (Google Analytics 4).

   Cada clic en un enlace de WhatsApp, de teléfono o de mail manda su propio
   evento, para poder contar los contactos por canal, página, idioma y país:

     contact_whatsapp   enlaces a wa.me / api.whatsapp.com
     contact_phone      enlaces tel:
     contact_email      enlaces mailto:

   Un solo listener delegado en el documento cubre todas las páginas y
   cualquier enlace que se agregue después; no hay nada que tocar por página.

   Tres cosas que no se negocian:
   - No frena ni cambia la navegación: no hay preventDefault ni esperas. El
     enlace se abre igual aunque la medición falle o esté bloqueada.
   - Si gtag no está (bloqueador, sin red), no pasa nada y no hay error.
   - No viaja ningún dato personal: ni el número, ni la casilla, ni el mensaje
     pre-armado. Si el texto visible del enlace es un teléfono o un mail, se
     manda el nombre del canal en su lugar.

   Nombres, parámetros y cómo probarlo: README, sección "Medición de contactos". */
(function () {
  'use strict';

  var CANALES = [
    { canal: 'whatsapp', patron: /^(https?:\/\/((api|web|chat)\.whatsapp\.com|wa\.me)\/|whatsapp:)/i },
    { canal: 'phone',    patron: /^tel:/i },
    { canal: 'email',    patron: /^mailto:/i }
  ];

  // Zonas del sitio, de la más específica a la más general. Los nombres son
  // los mismos en español y en inglés para que los informes no se partan.
  var ZONAS = [
    ['.wa-bar', 'quick_bar'],
    ['header, nav', 'header'],
    ['footer.site', 'footer'],
    ['.hero, .page-head', 'hero'],
    ['.cta-final', 'cta_final']
  ];

  // Límite de GA4 para el valor de un parámetro.
  var MAXIMO = 100;

  function canalDe(href) {
    for (var i = 0; i < CANALES.length; i++) {
      if (CANALES[i].patron.test(href)) return CANALES[i].canal;
    }
    return null;
  }

  function posicionDe(enlace) {
    for (var i = 0; i < ZONAS.length; i++) {
      if (enlace.closest(ZONAS[i][0])) return ZONAS[i][1];
    }
    var conId = enlace.closest('[id]');
    return conId && conId.id ? String(conId.id).slice(0, MAXIMO) : 'body';
  }

  // El texto visible del enlace ("Cotizar por WhatsApp"). Cuando el texto es
  // el propio número o la casilla, va el nombre del canal.
  function textoDe(enlace, canal) {
    var texto = String(enlace.textContent || '').replace(/\s+/g, ' ').trim();
    if (!texto || texto.indexOf('@') !== -1 || /\d[\d\s().+-]{5,}/.test(texto)) return canal;
    return texto.slice(0, MAXIMO);
  }

  function idiomaDe() {
    var lang = (document.documentElement && document.documentElement.lang) || '';
    return String(lang).slice(0, 2).toLowerCase() || 'es';
  }

  function alClic(evento) {
    try {
      var origen = evento && evento.target;
      if (!origen || typeof origen.closest !== 'function') return;
      var enlace = origen.closest('a[href]');
      if (!enlace) return;
      var canal = canalDe(String(enlace.getAttribute('href') || '').trim());
      if (!canal) return;
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'contact_' + canal, {
        contact_channel: canal,
        page_language: idiomaDe(),
        contact_page_path: String(window.location.pathname || '/').slice(0, MAXIMO),
        link_position: posicionDe(enlace),
        link_text: textoDe(enlace, canal)
      });
    } catch (error) {
      // La medición nunca rompe el clic.
    }
  }

  // En captura: se cuenta aunque otro script corte la propagación.
  document.addEventListener('click', alClic, true);
})();
