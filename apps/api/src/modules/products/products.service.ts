import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateProductDto } from "./dto/create-product.dto";
import type { ProductsQueryDto } from "./dto/products-query.dto";
import type { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(query: ProductsQueryDto) {
    const products = await this.prisma.product.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { brand: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      categoryName: product.category.name,
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException("Producto no encontrado.");
    return {
      ...product,
      price: Number(product.price),
      categoryName: product.category.name,
    };
  }

  async create(dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new BadRequestException("La categoría no existe.");
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        brand: dto.brand,
        gender: dto.gender,
        imageUrl: dto.imageUrl,
        price: dto.price,
        options: (dto.options ?? []) as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new BadRequestException("La categoría no existe.");
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.categoryId !== undefined ? { category: { connect: { id: dto.categoryId } } } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.options !== undefined ? { options: dto.options as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new BadRequestException("No se puede eliminar este producto porque ya está vinculado a una venta.");
      }
      throw error;
    }
  }
}
