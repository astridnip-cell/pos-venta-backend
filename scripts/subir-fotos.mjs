/**
 * Sube las fotos de la carpeta ../fotos-productos y se las asigna a los
 * productos que todavía no tienen imagen.
 *
 * Cada foto debe llamarse como el "slug" del producto, por ejemplo:
 *   vestido-avant-garde.jpg  ->  producto "Vestido Avant Garde"
 *
 * Uso (con Strapi encendido, desde la carpeta pos-venta-backend):
 *   node scripts/subir-fotos.mjs
 *   node scripts/subir-fotos.mjs --reemplazar    (también cambia fotos existentes)
 *   node scripts/subir-fotos.mjs "C:\otra\carpeta"
 *
 * Pide el correo y la contraseña de un usuario con rol Administrador.
 * La contraseña no se guarda en ningún lado.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const replace = args.includes('--reemplazar');
const folderArg = args.find((a) => !a.startsWith('--'));
const FOLDER = path.resolve(folderArg || path.join(here, '..', '..', 'fotos-productos'));

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Una sola lectura del teclado para todas las preguntas
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let hideTyping = false;
const writeOriginal = rl._writeToOutput.bind(rl);
rl._writeToOutput = (text) => {
  // Mientras se escribe la contraseña no se muestra nada
  if (!hideTyping || text.includes('Contraseña')) writeOriginal(text);
};

// Las respuestas se guardan en orden aunque lleguen antes de la pregunta
const pendingLines = [];
const waiting = [];
rl.on('line', (line) => {
  const clean = line.replace(/^﻿/, '').trim();
  const next = waiting.shift();
  if (next) next(clean);
  else pendingLines.push(clean);
});
rl.on('close', () => {
  while (waiting.length) waiting.shift()('');
});

function ask(question, hidden = false) {
  hideTyping = hidden;
  rl.setPrompt(question);
  rl.prompt();
  return new Promise((resolve) => {
    const done = (answer) => {
      if (hidden) process.stdout.write('\n');
      hideTyping = false;
      resolve(answer);
    };
    if (pendingLines.length) done(pendingLines.shift());
    else waiting.push(done);
  });
}

async function api(pathname, options = {}, jwt) {
  const res = await fetch(`${STRAPI_URL}/api${pathname}`, {
    ...options,
    headers: { ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), ...(options.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// Error esperado: se muestra el mensaje y el script termina sin cerrar a la fuerza
class Stop extends Error {}

async function main() {
  console.log(`\nCarpeta de fotos: ${FOLDER}`);
  if (!fs.existsSync(FOLDER)) {
    throw new Stop('No existe esa carpeta. Crea la carpeta fotos-productos junto a pos-venta-backend.');
  }

  const files = fs
    .readdirSync(FOLDER)
    .filter((f) => MIME[path.extname(f).toLowerCase()]);
  if (files.length === 0) {
    throw new Stop('La carpeta no tiene fotos (.jpg, .jpeg, .png o .webp). Lee LEEME.txt.');
  }
  console.log(`Fotos encontradas: ${files.length}\n`);

  // 1. Iniciar sesión como Administrador
  const email = await ask('Correo del Administrador: ');
  const password = await ask('Contraseña: ', true);
  rl.close();
  const login = await api('/auth/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });
  if (!login.ok) {
    throw new Stop(`No se pudo iniciar sesión: ${login.json?.error?.message || login.status}`);
  }
  const jwt = login.json.jwt;

  const access = await api('/panel-access', {}, jwt);
  if (!access.ok) {
    throw new Stop('Esta cuenta no tiene rol Administrador. Usa la cuenta con la que entras al panel.');
  }

  // 2. Productos y si ya tienen foto
  const list = await api('/products?pagination[pageSize]=100&fields[0]=name&fields[1]=slug&populate[image][fields][0]=url', {}, jwt);
  if (!list.ok) {
    throw new Stop(`No se pudieron leer los productos (${list.status}).`);
  }
  const bySlug = new Map(list.json.data.map((p) => [p.slug, p]));

  // 3. Subir y asignar cada foto
  let done = 0;
  for (const file of files) {
    const slug = path.basename(file, path.extname(file)).toLowerCase();
    const product = bySlug.get(slug);

    if (!product) {
      console.log(`  -  ${file}: no hay ningún producto con el slug "${slug}". Revisa el nombre del archivo.`);
      continue;
    }
    if (product.image && !replace) {
      console.log(`  -  ${file}: "${product.name}" ya tiene foto, se deja igual.`);
      continue;
    }

    const buffer = fs.readFileSync(path.join(FOLDER, file));
    const form = new FormData();
    form.append('files', new Blob([buffer], { type: MIME[path.extname(file).toLowerCase()] }), file);
    const upload = await api('/upload', { method: 'POST', body: form }, jwt);
    if (!upload.ok || !upload.json?.[0]?.id) {
      console.log(`  x  ${file}: no se pudo subir (${upload.json?.error?.message || upload.status}).`);
      continue;
    }

    const update = await api(
      `/products/${product.documentId}?status=published`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { image: upload.json[0].id } }),
      },
      jwt
    );
    if (!update.ok) {
      console.log(`  x  ${file}: se subió, pero no se pudo asignar a "${product.name}" (${update.json?.error?.message || update.status}).`);
      continue;
    }
    console.log(`  OK ${file} -> "${product.name}"`);
    done++;
  }

  // 4. Resumen
  const after = await api('/products?pagination[pageSize]=100&fields[0]=name&populate[image][fields][0]=url', {}, jwt);
  const missing = (after.json?.data || []).filter((p) => !p.image).map((p) => p.name);
  console.log(`\nListo: ${done} producto(s) con foto nueva.`);
  console.log(missing.length ? `Siguen sin foto: ${missing.join(', ')}` : 'Todos los productos tienen foto.');
}

main()
  .catch((error) => {
    if (error instanceof Stop) {
      console.error(`\n${error.message}`);
    } else {
      console.error(`\nOcurrió un error: ${error.message}`);
      console.error('¿Está Strapi encendido en http://localhost:1337?');
    }
    process.exitCode = 1;
  })
  .finally(() => rl.close());
