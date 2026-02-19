import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const categoriesSeed = [
  { name: "Zapatillas", position: 0 },
  { name: "Remeras", position: 1 },
  { name: "Accesorios", position: 2 },
];

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@tennisstar.com" },
    update: {},
    create: {
      email: "admin@tennisstar.com",
      password: hashedPassword,
      name: "Armando Admin",
    },
  });

  for (const category of categoriesSeed) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {
        position: category.position,
      },
      create: {
        name: category.name,
        position: category.position,
        parentCategoryId: null,
      },
    });
  }

  const mockProducts = await prisma.product.findMany({
    where: {
      OR: [{ id: { startsWith: "mock-product-" } }, { imageUrl: { startsWith: "/mock-products/" } }],
    },
    select: { id: true },
  });

  const mockProductIds = mockProducts.map((product) => product.id);
  if (mockProductIds.length > 0) {
    await prisma.saleItem.deleteMany({
      where: {
        productId: { in: mockProductIds },
      },
    });

    await prisma.product.deleteMany({
      where: {
        id: { in: mockProductIds },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
