/**
 * Script de un solo uso: convierte a hash (bcrypt) las contraseñas de la
 * colección "Admin" que quedaron guardadas en texto plano.
 *
 * Uso (con Strapi APAGADO, desde la carpeta del proyecto):
 *   node scripts/rehash-admin-passwords.js
 *
 * Hace una copia de seguridad de la base de datos antes de modificar nada.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(process.cwd(), '.tmp', 'data.db');
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$/;

if (!fs.existsSync(DB_PATH)) {
  console.error(`No se encontró la base de datos en: ${DB_PATH}`);
  console.error('Ejecuta este script desde la carpeta del proyecto (donde está package.json).');
  process.exit(1);
}

const backupPath = `${DB_PATH}.backup-${Date.now()}`;
fs.copyFileSync(DB_PATH, backupPath);
console.log(`Copia de seguridad creada: ${backupPath}`);

const db = new Database(DB_PATH);
const rows = db.prepare('SELECT id, email, password FROM admins').all();

if (rows.length === 0) {
  console.log('La tabla "admins" está vacía. Crea un administrador desde el Content Manager.');
  process.exit(0);
}

const update = db.prepare('UPDATE admins SET password = ? WHERE id = ?');
let cambiados = 0;

for (const row of rows) {
  if (!row.password) {
    console.log(`- id ${row.id} (${row.email}): sin contraseña, se omite`);
    continue;
  }
  if (BCRYPT_REGEX.test(row.password)) {
    console.log(`- id ${row.id} (${row.email}): ya estaba hasheada`);
    continue;
  }
  update.run(bcrypt.hashSync(row.password, 10), row.id);
  cambiados++;
  console.log(`- id ${row.id} (${row.email}): contraseña convertida a hash`);
}

console.log(`\nListo. Contraseñas convertidas: ${cambiados}`);
db.close();