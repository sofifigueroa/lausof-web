/* =============================================================================
   FICHA DE LA EMPRESA EN CADA PÁGINA — node scripts/empresa.mjs
   -----------------------------------------------------------------------------
   Todas las páginas referencian la entidad https://www.lausof.com/#empresa por
   su @id (el "provider" de cada Service, el "about" de cada WebPage). Los
   buscadores leen cada página por separado: una referencia a un @id que no
   está definido EN ESA PÁGINA no hereda nada de la portada. Hasta el
   13/10/2026 la ficha completa (teléfono, dirección, CUIT) estaba sólo en
   index.html, y las demás páginas apuntaban a un @id vacío.

   Este script escribe en el <head> de cada página, entre los comentarios
   GENERADO:EMPRESA, un bloque JSON-LD con la ficha de abajo, idéntico en
   todas:

     node scripts/empresa.mjs              escribe el bloque donde falte o haya cambiado
     node scripts/empresa.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide

   La ÚNICA fuente de los datos de la empresa para las páginas es FICHA. La
   portada (index.html) no lleva el bloque generado: su nodo principal es la
   ficha ampliada (descripción, horario, fotos, catálogo), escrita a mano, y
   tests/empresa.test.js exige que cada dato de FICHA figure igual ahí.

   Qué va y qué no (BUILD-BRIEF, política de afirmaciones):
     · Va: razón social, marca, dirección de la base, la línea pública
       387 526-9009, CUIT, y la habilitación CNRT N.º 60284 (verificable en
       consultapme.cnrt.gob.ar), como `identifier` y como `hasCertification`.
     · No va: número de permiso o expediente de AMT, aseguradora, cantidad de
       unidades ni otros teléfonos.

   Por qué hasCertification y no hasCredential: en schema.org el valor de
   hasCredential es el tipo Credential, que sigue en el área "new" (en
   revisión); Certification / hasCertification están publicados y admiten
   Organization (schema.org/hasCertification, schema.org/Credential, leídas el
   13/10/2026). Google documenta legalName, alternateName, taxID, telephone,
   address y logo para Organization, y aclara que alcanza con la portada: que
   esté en todas no molesta y deja resuelta la referencia en cada página
   (developers.google.com/search/docs/appearance/structured-data/organization,
   actualizada el 08/09/2026).
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID_EMPRESA = 'https://www.lausof.com/#empresa';

export const FICHA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': ID_EMPRESA,
  name: 'Lausof SRL',
  legalName: 'LAUSOF S.R.L.',
  alternateName: 'Lausof Transportes',
  brand: { '@type': 'Brand', name: 'Lausof Transportes' },
  url: 'https://www.lausof.com/',
  logo: 'https://www.lausof.com/assets/logo-horizontal-web.png',
  telephone: '+54-9-387-526-9009',
  email: 'contacto@lausof.com',
  taxID: '30-71146774-9',
  foundingDate: '2010',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Junín 1334',
    addressLocality: 'Salta',
    addressRegion: 'Salta',
    postalCode: 'A4400',
    addressCountry: 'AR',
  },
  identifier: {
    '@type': 'PropertyValue',
    propertyID: 'CNRT',
    name: 'Habilitación CNRT',
    value: '60284',
  },
  hasCertification: {
    '@type': 'Certification',
    name: 'Habilitación CNRT N.º 60284',
    certificationIdentification: '60284',
    issuedBy: {
      '@type': 'GovernmentOrganization',
      name: 'Comisión Nacional de Regulación del Transporte (CNRT)',
    },
  },
};

const ABRE = '<!-- GENERADO:EMPRESA — no editar a mano: editar scripts/empresa.mjs y correr `node scripts/empresa.mjs` -->';
const CIERRA = '<!-- /GENERADO:EMPRESA -->';
const ZONA = /[ \t]*<!-- GENERADO:EMPRESA[\s\S]*?<!-- \/GENERADO:EMPRESA -->\n?/;

export const bloque = () =>
  `  ${ABRE}\n  <script type="application/ld+json" id="empresa">${JSON.stringify(FICHA)}</script>\n  ${CIERRA}\n`;

// Páginas que llevan el bloque: todas menos la portada (que tiene la ficha
// ampliada), las 404 (no se indexan y no tienen datos estructurados) y el
// archivo de verificación de Google.
export function paginas() {
  const es = fs.readdirSync(raiz).filter((f) => f.endsWith('.html') && !f.startsWith('google'));
  const en = fs.existsSync(path.join(raiz, 'en'))
    ? fs.readdirSync(path.join(raiz, 'en')).filter((f) => f.endsWith('.html')).map((f) => `en/${f}`)
    : [];
  return [...es, ...en].filter((f) => f !== 'index.html' && !f.endsWith('404.html')).sort();
}

// La página con el bloque al día, justo antes de </head>. Pura e idempotente.
export function conFicha(html) {
  const sin = html.replace(ZONA, '');
  const i = sin.indexOf('</head>');
  if (i < 0) throw new Error('la página no tiene </head>');
  return sin.slice(0, i) + bloque() + sin.slice(i);
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = path.join(raiz, pagina);
    const actual = fs.readFileSync(ruta, 'utf8');
    const nuevo = conFicha(actual);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) fs.writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const p of cambiadas) console.log(`desactualizada ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`empresa: ${cambiadas.length} página(s) reescrita(s).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
