const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

console.log('=== TABLE STRUCTURE admin_permissions ===');
const schema = db.prepare("PRAGMA table_info(admin_permissions)");
const columns = schema.all();
console.log(columns);

console.log('\n=== ADMIN PERMISSIONS DATA ===');
const perms = db.prepare("SELECT * FROM admin_permissions").all();
try {
  console.log(perms);
} catch(e) {
  console.log('Error:', e.message);
}

// Alternative: get all columns names
console.log('\n=== TRY DIFFERENT COLUMNS ===');
try {
  const perms2 = db.prepare("SELECT id, code FROM admin_permissions").all();
  console.log("id, code:", perms2);
} catch(e) {
  console.log('Error2:', e.message);
}

try {
  const perms3 = db.prepare("SELECT * FROM admin_permissions LIMIT 1").all();
  console.log("first row:", perms3);
} catch(e) {
  console.log('Error3:', e.message);
}