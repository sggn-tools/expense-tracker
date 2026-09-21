/**
 * prisma/seed.ts
 * Datos iniciales para desarrollo.
 * Ejecutar: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Usuario de prueba
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@expensetracker.com" },
    update: {},
    create: {
      email: "demo@expensetracker.com",
      name: "Demo User",
      passwordHash,
    },
  });

  console.log(`✅ Usuario creado: ${user.email}`);

  // Tarjetas de ejemplo
  const visaAgricola = await prisma.card.upsert({
    where: {
      userId_bankName_lastFour: {
        userId: user.id,
        bankName: "Banco Agrícola",
        lastFour: "4321",
      },
    },
    update: {},
    create: {
      userId: user.id,
      bankName: "Banco Agrícola",
      cardType: "VISA",
      lastFour: "4321",
      alias: "Visa Agrícola personal",
    },
  });

  const mastercardSiman = await prisma.card.upsert({
    where: {
      userId_bankName_lastFour: {
        userId: user.id,
        bankName: "Tarjeta Simán",
        lastFour: "1784",
      },
    },
    update: {},
    create: {
      userId: user.id,
      bankName: "Tarjeta Simán",
      cardType: "VISA",
      lastFour: "1784",
      alias: "Credisiman Visa Gold",
    },
  });

  console.log(`✅ Tarjetas creadas: ${visaAgricola.alias}, ${mastercardSiman.alias}`);

  // Transacciones de ejemplo
  const sampleTransactions = [
    {
      cardId: visaAgricola.id,
      emailMessageId: "<seed-001@banco-agricola.com.sv>",
      amount: 38.5,
      merchant: "Super Selectos",
      category: "Supermercado",
      transactedAt: new Date("2025-05-14T10:30:00-06:00"),
    },
    {
      cardId: mastercardSiman.id,
      emailMessageId: "<seed-002@siman.com.sv>",
      amount: 62.0,
      merchant: "Restaurante Señor Peces",
      category: "Restaurante",
      transactedAt: new Date("2025-05-13T13:15:00-06:00"),
    },
    {
      cardId: visaAgricola.id,
      emailMessageId: "<seed-003@banco-agricola.com.sv>",
      amount: 45.0,
      merchant: "Shell Gasolina",
      category: "Gasolina",
      transactedAt: new Date("2025-05-12T08:00:00-06:00"),
    },
    {
      cardId: mastercardSiman.id,
      emailMessageId: "<seed-004@siman.com.sv>",
      amount: 15.99,
      merchant: "Netflix",
      category: "Entretenimiento",
      transactedAt: new Date("2025-05-11T00:00:00-06:00"),
    },
  ];

  for (const tx of sampleTransactions) {
    await prisma.transaction.upsert({
      where: { emailMessageId: tx.emailMessageId },
      update: {},
      create: tx,
    });
  }

  console.log(`✅ ${sampleTransactions.length} transacciones de ejemplo creadas`);
  console.log("\n🎉 Seed completado!");
  console.log("   Email: demo@expensetracker.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });