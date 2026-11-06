/* Galería de fotos que maneja el visitante (fase 1 de fotos, 05/11/2026).

   Diseño: web/imagenes-2026-11-05/3b-diseno-sitio.md §2.2; textos: 4-textos.md
   §2.3. Sin librerías. Sin JavaScript la galería es una tira de <figure> que
   se desliza con el dedo (scroll-snap); este archivo le suma, y recién ahí se
   ven, los controles: miniaturas, anterior/siguiente, contador, «Ampliar» y
   el <dialog> nativo con la foto grande. Así no queda ningún control muerto.

   Lo que no se negocia:
   - Nada se mueve solo: ni temporizadores ni rotación. Una tira que solo
     ambienta podría rotar a futuro, pero con pausa visible, 5–7 s, freno con
     el mouse y el foco, sin rotar en teléfonos ni con movimiento reducido;
     tests/galeria.test.js corta cualquier movimiento sin ese control.
   - Las fotos están en el HTML (las indexa Google); acá solo se clonan.
   - La foto ampliada se muestra, como mucho, a su ancho real: nunca se estira.

   Marcado que espera (lo vigila tests/galeria.test.js):
     <section class="galeria" aria-roledescription="galería" aria-label="Fotos de …">
       <div class="galeria-pista" tabindex="0" aria-live="polite">
         <figure role="group" aria-roledescription="foto" aria-label="1 de 3"
                 data-miniatura="de costado"><picture>…</picture><figcaption>…</figcaption></figure>
         …
   Medición: evento GA4 `galeria` con `accion` (miniatura, anterior,
   siguiente, ampliar) y la sección y el tipo de la página. */
(function () {
  'use strict';

  var TEXTOS = {
    es: { ant: 'Foto anterior', sig: 'Foto siguiente', de: 'de', foto: 'Foto', ampliar: 'Ampliar',
          ampliarFoto: 'Ampliar la foto', cerrar: 'Cerrar', ampliada: 'Foto ampliada' },
    en: { ant: 'Previous photo', sig: 'Next photo', de: 'of', foto: 'Photo', ampliar: 'Enlarge',
          ampliarFoto: 'Enlarge photo', cerrar: 'Close', ampliada: 'Enlarged photo' },
    pt: { ant: 'Foto anterior', sig: 'Próxima foto', de: 'de', foto: 'Foto', ampliar: 'Ampliar',
          ampliarFoto: 'Ampliar a foto', cerrar: 'Fechar', ampliada: 'Foto ampliada' }
  };
  var idioma = String(document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
  var T = TEXTOS[idioma] || TEXTOS.es;
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function medir(accion) {
    if (typeof window.gtag !== 'function') return;
    var b = document.body;
    var p = { accion: accion };
    if (b.getAttribute('data-seccion')) p.seccion = b.getAttribute('data-seccion');
    if (b.getAttribute('data-tipo')) p.tipo = b.getAttribute('data-tipo');
    window.gtag('event', 'galeria', p);
  }

  function el(etiqueta, clase, texto) {
    var n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto) n.textContent = texto;
    return n;
  }

  function boton(clase, etiqueta, glifo) {
    var b = el('button', clase);
    b.type = 'button';
    b.setAttribute('aria-label', etiqueta);
    var s = el('span', '', glifo);
    s.setAttribute('aria-hidden', 'true');
    b.appendChild(s);
    return b;
  }

  // Copia del <picture> de un cuadro para otro tamaño. `ancho` = sizes nuevo;
  // sin ancho, la copia pide solo el archivo más grande (descriptor 1x), así
  // el navegador la mide a su ancho real y la CSS nunca la estira.
  function copiaDe(picture, ancho) {
    var c = picture.cloneNode(true);
    [].forEach.call(c.querySelectorAll('source, img'), function (n) {
      if (ancho) {
        n.setAttribute('sizes', ancho);
      } else {
        var partes = (n.getAttribute('srcset') || '').split(',');
        var mayor = partes[partes.length - 1].trim().split(/\s+/)[0];
        if (mayor) n.setAttribute('srcset', mayor);
        n.removeAttribute('sizes');
      }
    });
    var img = c.querySelector('img');
    img.removeAttribute('fetchpriority');
    img.setAttribute('loading', ancho ? 'lazy' : 'eager');
    if (ancho) img.setAttribute('alt', '');
    return c;
  }

  /* ---- el diálogo, uno por página ---- */
  var dialogo = null;
  var activa = null; // la galería que lo abrió

  function armarDialogo() {
    dialogo = el('dialog', 'galeria-dialogo');
    dialogo.setAttribute('aria-labelledby', 'galeria-dialogo-pie');
    var barra = el('div', 'galeria-dialogo-barra');
    var contador = el('p', 'galeria-dialogo-contador');
    var cerrar = el('button', 'galeria-cerrar', T.cerrar);
    cerrar.type = 'button';
    barra.appendChild(contador);
    barra.appendChild(cerrar);
    var figura = el('figure', 'galeria-dialogo-foto');
    var pie = el('figcaption');
    pie.id = 'galeria-dialogo-pie';
    figura.appendChild(pie);
    var ant = boton('galeria-ant', T.ant, '‹');
    var sig = boton('galeria-sig', T.sig, '›');
    dialogo.appendChild(barra);
    dialogo.appendChild(figura);
    dialogo.appendChild(ant);
    dialogo.appendChild(sig);
    document.body.appendChild(dialogo);

    cerrar.addEventListener('click', function () { dialogo.close(); });
    ant.addEventListener('click', function () { activa.ir(activa.indice() - 1, 'anterior'); });
    sig.addEventListener('click', function () { activa.ir(activa.indice() + 1, 'siguiente'); });
    // Un clic en el fondo oscuro (fuera de la foto) también cierra.
    dialogo.addEventListener('click', function (e) { if (e.target === dialogo) dialogo.close(); });
    dialogo.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { activa.ir(activa.indice() + 1, 'siguiente'); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { activa.ir(activa.indice() - 1, 'anterior'); e.preventDefault(); }
    });
    // El foco vuelve a lo que abrió el diálogo (Esc, «Cerrar» o el fondo).
    dialogo.addEventListener('close', function () { if (activa && activa.origen) activa.origen.focus(); });
  }

  function mostrarEnDialogo(g) {
    var cuadro = g.cuadros[g.indice()];
    var figura = dialogo.querySelector('.galeria-dialogo-foto');
    var vieja = figura.querySelector('picture');
    var nueva = copiaDe(cuadro.querySelector('picture'), null);
    if (vieja) figura.replaceChild(nueva, vieja); else figura.insertBefore(nueva, figura.firstChild);
    var pie = cuadro.querySelector('figcaption');
    dialogo.querySelector('#galeria-dialogo-pie').textContent = pie ? pie.textContent : '';
    var total = g.cuadros.length;
    var contador = dialogo.querySelector('.galeria-dialogo-contador');
    contador.textContent = total > 1 ? T.foto + ' ' + (g.indice() + 1) + ' ' + T.de + ' ' + total : '';
    dialogo.classList.toggle('es-unica', total < 2);
  }

  /* ---- cada galería ---- */
  function armar(seccion) {
    var pista = seccion.querySelector('.galeria-pista');
    var cuadros = [].slice.call(pista.querySelectorAll(':scope > figure'));
    if (!cuadros.length) return;
    var total = cuadros.length;
    var i = 0;

    var control = el('div', 'galeria-control');
    var ant = boton('galeria-ant', T.ant, '‹');
    var lista = el('ol', 'galeria-miniaturas');
    var sig = boton('galeria-sig', T.sig, '›');
    var contador = el('span', 'galeria-contador');
    contador.setAttribute('aria-hidden', 'true');
    var ampliar = el('button', 'galeria-ampliar', T.ampliar);
    ampliar.type = 'button';

    var miniaturas = cuadros.map(function (cuadro, k) {
      var li = el('li');
      var b = el('button');
      b.type = 'button';
      var etiqueta = cuadro.getAttribute('data-miniatura');
      b.setAttribute('aria-label', T.foto + ' ' + (k + 1) + (etiqueta ? ': ' + etiqueta : ''));
      b.appendChild(copiaDe(cuadro.querySelector('picture'), '120px'));
      b.addEventListener('click', function () { g.ir(k, 'miniatura'); });
      li.appendChild(b);
      lista.appendChild(li);
      return b;
    });

    control.appendChild(ant);
    control.appendChild(lista);
    control.appendChild(sig);
    control.appendChild(contador);
    control.appendChild(ampliar);
    seccion.appendChild(control);

    function marcar(n) {
      i = n;
      miniaturas.forEach(function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      contador.textContent = (i + 1) + ' ' + T.de + ' ' + total;
      ampliar.setAttribute('aria-label', T.ampliarFoto + ' ' + (i + 1) + ' ' + T.de + ' ' + total);
    }

    var g = {
      cuadros: cuadros,
      origen: null,
      indice: function () { return i; },
      ir: function (n, accion) {
        var destino = ((n % total) + total) % total;
        marcar(destino);
        pista.scrollTo({ left: cuadros[destino].offsetLeft - pista.offsetLeft,
                         behavior: quieto && quieto.matches ? 'auto' : 'smooth' });
        if (dialogo && dialogo.open && activa === g) mostrarEnDialogo(g);
        if (accion) medir(accion);
      }
    };

    function abrir(origen) {
      if (!dialogo) armarDialogo();
      activa = g;
      g.origen = origen;
      mostrarEnDialogo(g);
      dialogo.showModal();
      medir('ampliar');
    }

    ant.addEventListener('click', function () { g.ir(i - 1, 'anterior'); });
    sig.addEventListener('click', function () { g.ir(i + 1, 'siguiente'); });
    ampliar.addEventListener('click', function () { abrir(ampliar); });
    cuadros.forEach(function (cuadro) {
      cuadro.querySelector('img').addEventListener('click', function () { abrir(ampliar); });
    });

    seccion.addEventListener('keydown', function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: total - 1 }[e.key];
      if (n === undefined || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      g.ir(n, e.key === 'ArrowLeft' ? 'anterior' : 'siguiente');
    });

    // Deslizar con el dedo (o la rueda) también cambia el cuadro marcado.
    var pendiente = false;
    pista.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(function () {
        pendiente = false;
        var ancho = pista.clientWidth;
        if (!ancho) return;
        var n = Math.min(total - 1, Math.max(0, Math.round(pista.scrollLeft / ancho)));
        if (n !== i) marcar(n);
      });
    }, { passive: true });

    marcar(0);
    seccion.classList.add('galeria-lista');
  }

  [].forEach.call(document.querySelectorAll('.galeria'), armar);
})();
