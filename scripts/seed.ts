/**
 * Script de datos de prueba para Velora
 * Ejecutar con: npx tsx scripts/seed.ts
 * 
 * Este script llena la base de datos con:
 * - 5 categorías
 * - 60 productos
 * - 200 clientes
 * - 200 pedidos
 */

const STRAPI_URL = "http://localhost:1337";
const ADMIN_EMAIL = process.env.SEED_EMAIL || "";
const ADMIN_PASSWORD = process.env.SEED_PASSWORD || "";

// ============================================================
// DATOS BASE
// ============================================================

const CATEGORIES = ["Mujer", "Hombre", "Accesorios", "Ofertas", "Nuevo"];

const PRODUCTS_DATA = [
  // MUJER
  { name: "Camiseta Básica Algodón", price: 45000, category: "Mujer", stock: 120 },
  { name: "Vestido Casual Floral", price: 120000, category: "Mujer", stock: 35 },
  { name: "Jeans Skinny Mujer", price: 89000, category: "Mujer", stock: 60 },
  { name: "Blusa Elegante Seda", price: 75000, category: "Mujer", stock: 45 },
  { name: "Falda Midi Plisada", price: 68000, category: "Mujer", stock: 30 },
  { name: "Pantalón Palazzo", price: 95000, category: "Mujer", stock: 25 },
  { name: "Top Crop Básico", price: 35000, category: "Mujer", stock: 80 },
  { name: "Vestido Largo Noche", price: 180000, category: "Mujer", stock: 15 },
  { name: "Chaqueta Denim Oversize", price: 110000, category: "Mujer", stock: 40 },
  { name: "Suéter Punto Grueso", price: 85000, category: "Mujer", stock: 55 },
  { name: "Leggings Deportivos", price: 42000, category: "Mujer", stock: 90 },
  { name: "Cárdigan Largo Lana", price: 130000, category: "Mujer", stock: 20 },
  { name: "Vestido Midi Wrap", price: 140000, category: "Mujer", stock: 18 },
  { name: "Blusa Manga Abullonada", price: 72000, category: "Mujer", stock: 33 },
  { name: "Jean Recto Alto", price: 92000, category: "Mujer", stock: 48 },
  { name: "Top Tirantes Encaje", price: 38000, category: "Mujer", stock: 65 },
  { name: "Falda Tubo Cuero", price: 105000, category: "Mujer", stock: 22 },
  { name: "Conjunto Sport Elegante", price: 160000, category: "Mujer", stock: 12 },
  
  // HOMBRE
  { name: "Camiseta Premium Algodón", price: 55000, category: "Hombre", stock: 100 },
  { name: "Jeans Clásicos Rectos", price: 99000, category: "Hombre", stock: 70 },
  { name: "Sudadera Hoodie Comfort", price: 95000, category: "Hombre", stock: 50 },
  { name: "Camisa Oxford Blanca", price: 78000, category: "Hombre", stock: 40 },
  { name: "Pantalón Chino Beige", price: 85000, category: "Hombre", stock: 35 },
  { name: "Chaqueta Bomber Negra", price: 145000, category: "Hombre", stock: 28 },
  { name: "Polo Pique Clásica", price: 62000, category: "Hombre", stock: 60 },
  { name: "Berlín Lana Gris", price: 115000, category: "Hombre", stock: 30 },
  { name: "Shorts Cargo Verano", price: 58000, category: "Hombre", stock: 45 },
  { name: "Camiseta Estampada Urban", price: 48000, category: "Hombre", stock: 75 },
  { name: "Blazer Slim Fit Azul", price: 175000, category: "Hombre", stock: 18 },
  { name: "Jogger Tappering Negro", price: 68000, category: "Hombre", stock: 55 },
  { name: "Camisa Lino Manga Corta", price: 72000, category: "Hombre", stock: 38 },
  { name: "Gabardina Militar", price: 195000, category: "Hombre", stock: 15 },
  { name: "Suéter Cuello V Lana", price: 88000, category: "Hombre", stock: 42 },
  { name: "Pantalón Vestir Pinstripe", price: 105000, category: "Hombre", stock: 25 },
  { name: "Camiseta Básica 3 Pack", price: 65000, category: "Hombre", stock: 95 },
  { name: "Chaqueta Cuero Vintage", price: 250000, category: "Hombre", stock: 10 },
  { name: "Sudadera Full Zip", price: 98000, category: "Hombre", stock: 33 },
  { name: "Bermudas Dry Fit", price: 45000, category: "Hombre", stock: 50 },
  
  // ACCESORIOS
  { name: "Zapatos Deportivos Urban", price: 150000, category: "Accesorios", stock: 25 },
  { name: "Bolso Tote Cuero", price: 180000, category: "Accesorios", stock: 15 },
  { name: "Gorra Baseball Ajustable", price: 35000, category: "Accesorios", stock: 80 },
  { name: "Cinturón Cuero Marrón", price: 48000, category: "Accesorios", stock: 45 },
  { name: "Gafas de Sol Aviador", price: 120000, category: "Accesorios", stock: 30 },
  { name: "Reloj Minimalista", price: 220000, category: "Accesorios", stock: 12 },
  { name: "Bufanda Lana Merino", price: 65000, category: "Accesorios", stock: 40 },
  { name: "Mochila Urbana Impermeable", price: 135000, category: "Accesorios", stock: 22 },
  { name: "Collar Acero Inoxidable", price: 78000, category: "Accesorios", stock: 35 },
  { name: "Billetera Slim Cuero", price: 55000, category: "Accesorios", stock: 50 },
  { name: "Zapatillas Running Pro", price: 175000, category: "Accesorios", stock: 18 },
  { name: "Pulsera Cuentas Naturales", price: 42000, category: "Accesorios", stock: 60 },
  { name: "Sombrero Panamá Clásico", price: 95000, category: "Accesorios", stock: 20 },
  { name: "Guantes Táctiles Invierno", price: 38000, category: "Accesorios", stock: 55 },
  { name: "Bolso Crossbody Pequeño", price: 88000, category: "Accesorios", stock: 28 },
  { name: "Cinturon Reversible", price: 52000, category: "Accesorios", stock: 42 },
  { name: "Gorra Trucker Mesh", price: 32000, category: "Accesorios", stock: 70 },
  { name: "Gafas Wayfarer Clásicas", price: 110000, category: "Accesorios", stock: 25 },
  { name: "Reloj Digital Sport", price: 165000, category: "Accesorios", stock: 16 },
  { name: "Neceser Toallitas Cuero", price: 45000, category: "Accesorios", stock: 48 },
  
  // OFERTAS
  { name: "Camiseta Oferta 2x1", price: 55000, category: "Ofertas", stock: 100 },
  { name: "Jean Básico Outlet", price: 65000, category: "Ofertas", stock: 40 },
  { name: "Vestido Temporada Anterior", price: 85000, category: "Ofertas", stock: 25 },
  { name: "Zapatillas Clearance", price: 99000, category: "Ofertas", stock: 20 },
  { name: "Chaqueta Outlet Special", price: 120000, category: "Ofertas", stock: 15 },
  { name: "Pack 3 Camisetas Básicas", price: 99000, category: "Ofertas", stock: 60 },
  { name: "Blusa Promo Invierno", price: 48000, category: "Ofertas", stock: 35 },
  { name: "Pantalón Liquidación", price: 58000, category: "Ofertas", stock: 30 },
  { name: "Accesorios Oferta Flash", price: 35000, category: "Ofertas", stock: 50 },
  { name: "Conjunto Promo 2 Piezas", price: 145000, category: "Ofertas", stock: 18 },
  
  // NUEVO
  { name: "Vestido Avant Garde", price: 210000, category: "Nuevo", stock: 12 },
  { name: "Chaqueta Oversize Premium", price: 185000, category: "Nuevo", stock: 15 },
  { name: "Pantalón Wide Leg", price: 115000, category: "Nuevo", stock: 28 },
  { name: "Camisa Estructural", price: 98000, category: "Nuevo", stock: 22 },
  { name: "Falda Asimétrica", price: 135000, category: "Nuevo", stock: 18 },
  { name: "Top Corte Imperior", price: 68000, category: "Nuevo", stock: 35 },
  { name: "Mom Jean High Waist", price: 105000, category: "Nuevo", stock: 25 },
  { name: "Bucket Hat Tendencia", price: 42000, category: "Nuevo", stock: 45 },
  { name: "Bolsos Tote Reciclado", price: 95000, category: "Nuevo", stock: 20 },
  { name: "Sneakers Chunky Platform", price: 165000, category: "Nuevo", stock: 16 },
];

const FIRST_NAMES = [
  "María", "Carlos", "Laura", "Ana", "Pedro", "Carmen", "José", "Isabel",
  "Miguel", "Lucía", "Javier", "Elena", "David", "Sofía", "Andrés", "Paula",
  "Daniel", "Valentina", "Alejandro", "Camila", "Santiago", "Martina", "Diego", "Victoria",
  "Felipe", "Renata", "Gabriel", "Antonella", "Emilio", "Catalina", "Rafael", "Daniela",
  "Tomás", "Francisca", "Maximiliano", "Constanza", "Vicente", "Trinidad", "Javiera", "Florencia",
  "Cristóbal", "Antonella", "Ignacia", "Joaquín", "Monserrat", "Benjamín", "Francisca", "Julián",
  "Consuelo", "Hernán", "Paz", "Gonzalo", "Esperanza", "Matías", "Guadalupe", "Rodrigo", "Inés",
];

const LAST_NAMES = [
  "González", "Rodríguez", "Martínez", "López", "Hernández", "García", "Silva", "Rojas",
  "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
  "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Neumann",
  "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt",
  "Werner", "Schmitz", "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier",
];

const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga",
  "Pereira", "Santa Marta", "Manizales", "Cúcuta", "Ibagué", "Villavicencio",
  "Pasto", "Neiva", "Armenia", "Montería", "Popayán", "Valledupar",
];

const STREETS = [
  "Calle 10 #5-23", "Carrera 15 #45-67", "Avenida 3 #12-34", "Calle 80 #20-15",
  "Carrera 7 #56-78", "Avenida 68 #30-45", "Calle 25 #10-20", "Carrera 11 #89-12",
  "Avenida 19 #67-89", "Calle 50 #33-56", "Carrera 23 #14-67", "Avenida Boyacá #72-34",
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];
  const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return `${cleanFirst}.${cleanLast}@${randomElement(domains)}`;
}

function generatePhone(): string {
  const prefix = ["300", "301", "302", "310", "311", "312", "313", "314", "315", "320"];
  return `${randomElement(prefix)}${randomInt(1000000, 9999999)}`;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toISOString();
}

// ============================================================
// SCRIPT PRINCIPAL
// ============================================================

async function seed() {
  console.log("🚀 Iniciando script de datos de prueba...\n");

  // 1. Autenticación
  console.log("🔐 Autenticación en Strapi...");
  const authRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!authRes.ok) {
    console.error("❌ Error de autenticación. Verifica que Strapi esté corriendo y las credenciales sean correctas.");
    process.exit(1);
  }

  const authData = (await authRes.json()) as { jwt: string };
  const { jwt } = authData;
  console.log("✅ Autenticación exitosa\n");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
  };

  // 2. Crear categorías
  console.log("📁 Creando categorías...");
  const categoryIds: Record<string, number> = {};

  for (const catName of CATEGORIES) {
    const res = await fetch(`${STRAPI_URL}/api/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          name: catName,
          slug: catName.toLowerCase().replace(/\s+/g, "-"),
          description: `Categoría de ${catName}`,
        },
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as { data: { id: number } };
      categoryIds[catName] = json.data.id;
      console.log(`  ✅ ${catName} (ID: ${json.data.id})`);
    } else {
      console.error(`  ❌ Error creando categoría ${catName}`);
    }
  }

  // 3. Crear productos
  console.log("\n👕 Creando productos...");
  const productIds: number[] = [];

  for (const product of PRODUCTS_DATA) {
    const categoryId = categoryIds[product.category];
    if (!categoryId) continue;

    const res = await fetch(`${STRAPI_URL}/api/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          name: product.name,
          slug: product.name.toLowerCase().replace(/\s+/g, "-"),
          description: `${product.name} de alta calidad. Perfecto para cualquier ocasión.`,
          price: product.price,
          originalPrice: Math.random() > 0.5 ? Math.floor(product.price * 1.3) : null,
          stock: product.stock,
          featured: Math.random() > 0.8,
          category: categoryId,
          sizes: JSON.stringify(["XS", "S", "M", "L", "XL"]),
          colors: JSON.stringify(["Negro", "Blanco", "Azul", "Gris"]),
        },
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as { data: { id: number } };
      productIds.push(json.data.id);
      console.log(`  ✅ ${product.name} - $${product.price.toLocaleString("es-CO")}`);
    } else {
      console.error(`  ❌ Error creando producto ${product.name}`);
    }
  }

  console.log(`\n📊 Total productos creados: ${productIds.length}`);

  // 4. Crear clientes y pedidos
  console.log("\n👥 Creando clientes y pedidos...");

  const orderStatuses = ["pending", "paid", "shipped", "delivered"];
  const statusWeights = [0.15, 0.25, 0.30, 0.30]; // Probabilidades

  let orderCount = 0;
  const targetOrders = 200;

  for (let i = 0; i < targetOrders; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = generateEmail(firstName, lastName);
    const city = randomElement(CITIES);
    const street = randomElement(STREETS);
    const phone = generatePhone();

    // Determinar estado del pedido
    const rand = Math.random();
    let status = "delivered";
    if (rand < statusWeights[0]) status = "pending";
    else if (rand < statusWeights[0] + statusWeights[1]) status = "paid";
    else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = "shipped";

    // Generar items del pedido (1-5 productos)
    const itemCount = randomInt(1, 5);
    const items: any[] = [];
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
      const productId = randomElement(productIds);
      const quantity = randomInt(1, 3);
      const product = PRODUCTS_DATA.find((_, idx) => productIds[idx] === productId);
      if (!product) continue;

      const itemTotal = product.price * quantity;
      total += itemTotal;

      items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    // Fecha aleatoria en los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const now = new Date();
    const orderDate = randomDate(sixMonthsAgo, now);

    // Crear pedido
    const orderNumber = `ORD-${String(i + 1).padStart(3, "0")}`;

    const res = await fetch(`${STRAPI_URL}/api/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          orderNumber,
          statusOrder: status,
          total: total,
          customerName: `${firstName} ${lastName}`,
          customerEmail: email,
          shippingAddress: `${street}, ${city}`,
          items: JSON.stringify(items),
        },
      }),
    });

    if (res.ok) {
      orderCount++;
      if (orderCount % 20 === 0) {
        console.log(`  📦 Pedidos creados: ${orderCount}/${targetOrders}`);
      }
    } else {
      const errText = await res.text().catch(() => "Error desconocido");
      console.error(`  ❌ Error creando pedido ${orderNumber}: ${errText}`);
    }
  }

  console.log(`\n✅ Pedidos creados exitosamente: ${orderCount}`);

  // 5. Resumen final
  console.log("\n" + "=".repeat(50));
  console.log("🎉 RESUMEN DE DATOS DE PRUEBA");
  console.log("=".repeat(50));
  console.log(`📁 Categorías: ${CATEGORIES.length}`);
  console.log(`👕 Productos: ${productIds.length}`);
  console.log(`📦 Pedidos: ${orderCount}`);
  console.log(`👥 Clientes únicos: ~${orderCount}`);
  console.log("\n✅ Datos de prueba generados exitosamente!");
  console.log("🌐 Revisa tu portal admin en: http://localhost:3001");
}

seed().catch(console.error);
