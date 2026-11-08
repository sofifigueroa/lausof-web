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
       <div class="galeria-pista" tabindex="0">
         <figure role="group" aria-roledescription="foto" aria-label="1 de 3"
                 data-miniatura="de costado"><picture>…</picture><figcaption>…</figcaption></figure>
         …
   Anuncio (WCAG 4.1.3): la pista se desplaza sin cambiar el DOM, así que no
   puede anunciar nada. Lo que avisa el cambio de foto es el contador: una
   región aria-live="polite" con la parte visible («2 de 3») oculta al lector
   y una parte solo para el lector («Foto 2 de 3: pie»). Esa parte arranca
   vacía y se llena recién después de un gesto del visitante, para que la
   página no anuncie cada galería al cargar. Con la foto ampliada anuncia el
   contador del diálogo y el de la página se calla.
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

  // Contador que también es la región que anuncia el cambio de foto.
  function contadorVivo(etiqueta, clase) {
    var c = el(etiqueta, clase);
    c.setAttribute('aria-live', 'polite');
    c.setAttribute('aria-atomic', 'true');
    var visto = el('span', 'galeria-contador-visto');
    visto.setAttribute('aria-hidden', 'true');
    c.appendChild(visto);
    c.appendChild(el('span', 'galeria-anuncio'));
    return c;
  }
  // `oido` vacío = cambia lo que se ve sin anunciar nada.
  function contar(c, visto, oido) {
    c.querySelector('.galeria-contador-visto').textContent = visto;
    c.querySelector('.galeria-anuncio').textContent = oido;
  }
  function anuncioDe(cuadro, n, total) {
    var pie = cuadro.querySelector('figcaption');
    var texto = pie ? pie.textContent.replace(/\s+/g, ' ').trim() : '';
    return T.foto + ' ' + n + ' ' + T.de + ' ' + total + (texto ? ': ' + texto : '');
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

  // Las miniaturas piden su foto recién cuando la galería se acerca a la
  // pantalla. Con `loading="lazy"` solo, Chrome las baja ni bien carga la
  // página (su margen llega a 2500 px) y compiten con la foto del encabezado:
  // en cargas refrigeradas la LCP pasaba de 1,95 s a 2,40 s (Lighthouse móvil,
  // 06/11/2026). Sin IntersectionObserver se piden enseguida.
  function enEspera(picture) {
    [].forEach.call(picture.querySelectorAll('source, img'), function (n) {
      ['srcset', 'src'].forEach(function (a) {
        if (n.hasAttribute(a)) { n.setAttribute('data-' + a, n.getAttribute(a)); n.removeAttribute(a); }
      });
    });
    return picture;
  }
  // Las fotos de la pista llevan loading="lazy": con un deslizamiento rápido
  // el cuadro 3 aparecía vacío, porque Chrome recién lo pedía al entrar en la
  // pista (auditoría de fotos, N4). Con la galería cerca se piden ya el cuadro
  // que se ve y sus vecinos (el anterior y los dos siguientes, con la vuelta),
  // y cada cambio de cuadro adelanta los suyos. Nada de esto corre antes de
  // .galeria-cerca, así no le compite a la foto del encabezado.
  function adelantar(seccion, n) {
    if (!seccion.classList.contains('galeria-cerca')) return;
    var fotos = seccion.querySelectorAll('.galeria-pista > figure img');
    var total = fotos.length;
    [-1, 0, 1, 2].forEach(function (d) {
      var img = fotos[((n + d) % total + total) % total];
      if (img && img.loading !== 'eager') img.loading = 'eager';
    });
  }

  // `pedir` suelta también las fotos de la pista: css/galeria-componente.css
  // las tiene en espera (display:none) hasta que la sección lleve .galeria-cerca.
  function pedir(seccion) {
    seccion.classList.add('galeria-cerca');
    adelantar(seccion, seccion.galeriaIndice ? seccion.galeriaIndice() : 0);
    [].forEach.call(seccion.querySelectorAll('.galeria-miniaturas [data-srcset], .galeria-miniaturas [data-src]'), function (n) {
      ['srcset', 'src'].forEach(function (a) {
        if (n.hasAttribute('data-' + a)) { n.setAttribute(a, n.getAttribute('data-' + a)); n.removeAttribute('data-' + a); }
      });
    });
  }
  var vigia = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { pedir(e.target); vigia.unobserve(e.target); }
    });
  }, { rootMargin: '300px 0px' }) : null;

  /* ---- el diálogo, uno por página ---- */
  var dialogo = null;
  var activa = null; // la galería que lo abrió

  function armarDialogo() {
    dialogo = el('dialog', 'galeria-dialogo');
    dialogo.setAttribute('aria-labelledby', 'galeria-dialogo-pie');
    var barra = el('div', 'galeria-dialogo-barra');
    var contador = contadorVivo('p', 'galeria-dialogo-contador');
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

  // `anunciar`: falso al abrir (el lector ya lee el diálogo por su nombre).
  function mostrarEnDialogo(g, anunciar) {
    var cuadro = g.cuadros[g.indice()];
    var figura = dialogo.querySelector('.galeria-dialogo-foto');
    var vieja = figura.querySelector('picture');
    var nueva = copiaDe(cuadro.querySelector('picture'), null);
    if (vieja) figura.replaceChild(nueva, vieja); else figura.insertBefore(nueva, figura.firstChild);
    var pie = cuadro.querySelector('figcaption');
    dialogo.querySelector('#galeria-dialogo-pie').textContent = pie ? pie.textContent : '';
    var total = g.cuadros.length;
    var contador = dialogo.querySelector('.galeria-dialogo-contador');
    var n = g.indice() + 1;
    contar(contador, total > 1 ? T.foto + ' ' + n + ' ' + T.de + ' ' + total : '',
      anunciar && total > 1 ? anuncioDe(cuadro, n, total) : '');
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
    var contador = contadorVivo('span', 'galeria-contador');
    var ampliar = el('button', 'galeria-ampliar', T.ampliar);
    ampliar.type = 'button';

    var miniaturas = cuadros.map(function (cuadro, k) {
      var li = el('li');
      var b = el('button');
      b.type = 'button';
      var etiqueta = cuadro.getAttribute('data-miniatura');
      b.setAttribute('aria-label', T.foto + ' ' + (k + 1) + (etiqueta ? ': ' + etiqueta : ''));
      b.appendChild(enEspera(copiaDe(cuadro.querySelector('picture'), '120px')));
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

    // `anunciar`: sólo tras un gesto del visitante, y nunca con el diálogo
    // abierto sobre esta galería (ahí anuncia el diálogo).
    function marcar(n, anunciar) {
      i = n;
      adelantar(seccion, i);
      miniaturas.forEach(function (b, k) {
        if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      var callar = !anunciar || (dialogo && dialogo.open && activa === g);
      contar(contador, (i + 1) + ' ' + T.de + ' ' + total, callar ? '' : anuncioDe(cuadros[i], i + 1, total));
      ampliar.setAttribute('aria-label', T.ampliarFoto + ' ' + (i + 1) + ' ' + T.de + ' ' + total);
    }

    seccion.galeriaIndice = function () { return i; };
    var g = {
      cuadros: cuadros,
      origen: null,
      indice: function () { return i; },
      ir: function (n, accion) {
        var destino = ((n % total) + total) % total;
        marcar(destino, true);
        // Mientras la pista viaja al destino, el scroll no remarca los
        // cuadros por los que pasa (no se anuncian fotos intermedias).
        if (pista.clientWidth && Math.round(pista.scrollLeft / pista.clientWidth) !== destino) objetivo = destino;
        pista.scrollTo({ left: cuadros[destino].offsetLeft - pista.offsetLeft,
                         behavior: quieto && quieto.matches ? 'auto' : 'smooth' });
        if (dialogo && dialogo.open && activa === g) mostrarEnDialogo(g, true);
        if (accion) medir(accion);
      }
    };

    function abrir(origen) {
      if (!dialogo) armarDialogo();
      activa = g;
      g.origen = origen;
      mostrarEnDialogo(g, false);
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

    // Deslizar con el dedo (o la rueda) también cambia el cuadro marcado, y
    // eso sí se anuncia. Si el visitante toma la pista a mitad de un viaje,
    // manda él.
    var pendiente = false;
    var objetivo = null;
    ['pointerdown', 'wheel', 'touchstart'].forEach(function (tipo) {
      pista.addEventListener(tipo, function () { objetivo = null; }, { passive: true });
    });
    pista.addEventListener('scrollend', function () { objetivo = null; });
    pista.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(function () {
        pendiente = false;
        var ancho = pista.clientWidth;
        if (!ancho) return;
        var n = Math.min(total - 1, Math.max(0, Math.round(pista.scrollLeft / ancho)));
        if (objetivo !== null) { if (n === objetivo) objetivo = null; return; }
        if (n !== i) marcar(n, true);
      });
    }, { passive: true });

    marcar(0, false);
    seccion.classList.add('galeria-lista');
  }

  // Las fotos de la pista y las miniaturas se sueltan sólo cuando la galería
  // se acerca a la pantalla (`pedir`, 300 px antes). Hasta el lote 1 también
  // se soltaban todas al `load`: en la medición simulada de Lighthouse eso
  // las ponía a competir con la foto del encabezado (lote 2, 06/11/2026: la
  // galería nueva de la flota llevó la LCP de 1,73 s a 1,88 s). Se observa
  // antes de armar (el aviso llega en otro cuadro, con la galería ya armada):
  // si algo fallara al armar, las fotos igual aparecen al acercarse.
  var galerias = [].slice.call(document.querySelectorAll('.galeria'));
  if (vigia) galerias.forEach(function (seccion) { vigia.observe(seccion); });
  galerias.forEach(function (seccion) {
    armar(seccion);
    if (!vigia) pedir(seccion);
  });
})();
