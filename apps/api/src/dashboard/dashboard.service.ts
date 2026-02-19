import { Inject, Injectable } from "@nestjs/common";
import { SaleStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    const inventoryProducts = await this.prisma.product.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
      take: 10,
    });

    const inventoryCount = await this.prisma.product.count();
    const inventoryValueAgg = await this.prisma.product.aggregate({
      _sum: {
        price: true,
      },
    });

    const recentSales = await this.prisma.sale.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const topProductTotals = await this.prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        sale: {
          status: {
            not: SaleStatus.CANCELLED,
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topProductIds = topProductTotals.map((item) => item.productId);
    const topProductsRaw =
      topProductIds.length > 0
        ? await this.prisma.product.findMany({
            where: {
              id: {
                in: topProductIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];
    const topProductsById = new Map(topProductsRaw.map((product) => [product.id, product]));

    return {
      inventory: {
        totalProducts: inventoryCount,
        totalValue: Number(inventoryValueAgg._sum.price ?? 0),
        products: inventoryProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
        })),
      },
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        customerName: sale.customerName,
        total: Number(sale.total),
        orderNumber: sale.orderNumber,
        status: sale.status,
        createdAt: sale.createdAt,
      })),
      topProducts: topProductTotals
        .map((item) => {
          const product = topProductsById.get(item.productId);
          return {
            id: item.productId,
            name: product?.name ?? "Producto eliminado",
            sold: item._sum.quantity ?? 0,
          };
        })
        .filter((item) => item.sold > 0),
    };
  }
}
