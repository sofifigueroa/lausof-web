// Cabeceras de seguridad de _headers (auditoría técnica 03/11/2026, M1) y que
// la política de contenido (CSP) cubra todo lo que las páginas cargan de
// afuera. Si una página empieza a pedir un dominio nuevo (una fuente, un
// mapa, un video), este test corta hasta que se lo agregue a la política.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, headers, sinComentarios } = require('./util.js');

// Las cabeceras del bloque /* de _headers, como { nombre: valor }.
const bloqueTodo = () => {
  const m = headers.match(/^\/\*\n((?:[ \t]+\S[^\n]*\n?)+)/m);
  assert.ok(m, '_headers no tiene un bloque /* para todas las páginas');
  const salida = {};
  for (const linea of m[1].split('\n').map((l) => l.trim()).filter(Boolean)) {
    const i = linea.indexOf(':');
    salida[linea.slice(0, i).toLowerCase()] = linea.slice(i + 1).trim();
  }
  return salida;
};

// "script-src 'self' https://x; img-src …" → { 'script-src': ["'self'", 'https://x'], … }
const directivas = (politica) => Object.fromEntries(politica.split(';').map((d) => d.trim()).filter(Boolean)
  .map((d) => { const [nombre, ...valores] = d.split(/\s+/); return [nombre, valores]; }));

test('_headers manda las cabeceras de seguridad en todas las páginas', () => {
  const h = bloqueTodo();
  assert.strictEqual(h['x-content-type-options'], 'nosniff');
  assert.strictEqual(h['referrer-policy'], 'strict-origin-when-cross-origin');
  for (const permiso of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
    assert.match(h['permissions-policy'] || '', new RegExp(`(^|, )${permiso}=\\(\\)`), `Permissions-Policy no niega ${permiso}`);
  }
  // La única directiva que se aplica: nadie enmarca el sitio.
  assert.deepStrictEqual(directivas(h['content-security-policy'] || ''), { 'frame-ancestors': ["'self'"] });
  assert.ok(h['content-security-policy-report-only'], 'falta la política completa en Report-Only');
});

test('la política Report-Only es estricta donde no cuesta nada', () => {
  const d = directivas(bloqueTodo()['content-security-policy-report-only']);
  assert.deepStrictEqual(d['default-src'], ["'self'"]);
  assert.deepStrictEqual(d['object-src'], ["'none'"]);
  assert.deepStrictEqual(d['base-uri'], ["'self'"]);
  assert.deepStrictEqual(d['frame-ancestors'], ["'self'"]);
  // GA4: el script y sus envíos (developers.google.com/tag-platform/security/guides/csp).
  assert.ok(d['script-src'].includes('https://www.googletagmanager.com'));
  assert.ok(d['connect-src'].includes('https://*.google-analytics.com'));
  assert.ok(d['img-src'].includes('https://*.google-analytics.com'));
});

// Origen de una URL contra una lista de fuentes CSP ('self', https://x, https://*.x).
const permitido = (url, fuentes) => {
  if (!/^https?:\/\//.test(url)) return fuentes.includes("'self'") || fuentes.includes('data:') && url.startsWith('data:');
  const { protocol, host } = new URL(url);
  return fuentes.some((f) => {
    const m = f.match(/^(https?:)\/\/(\*\.)?(.+)$/);
    if (!m || m[1] !== protocol) return false;
    return m[2] ? host.endsWith(`.${m[3]}`) : host === m[3];
  });
};

test('la política cubre todo lo que las páginas cargan', () => {
  const d = directivas(bloqueTodo()['content-security-policy-report-only']);
  const de = (nombre) => d[nombre] || d['default-src'];
  for (const [nombre, html] of Object.entries(paginas)) {
    const limpio = sinComentarios(html);
    for (const [, url] of limpio.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.ok(permitido(url, de('script-src')), `${nombre}: script-src no permite ${url}`);
    }
    for (const [, url] of limpio.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)) {
      assert.ok(permitido(url, de('style-src')), `${nombre}: style-src no permite ${url}`);
    }
    for (const [, url] of limpio.matchAll(/<(?:img|source)\b[^>]*\bsrc(?:set)?="([^"\s,]+)/g)) {
      assert.ok(permitido(url, de('img-src')), `${nombre}: img-src no permite ${url}`);
    }
    for (const etiqueta of ['iframe', 'embed', 'object', 'video', 'audio']) {
      assert.ok(!new RegExp(`<${etiqueta}\\b`).test(limpio), `${nombre}: <${etiqueta}> nuevo, la política no lo contempla`);
    }
    assert.ok(!/<form\b[^>]*action="https?:/.test(limpio), `${nombre}: un form que envía afuera choca con form-action 'self'`);
  }
});
