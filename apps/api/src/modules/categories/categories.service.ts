import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CategoriesQueryDto } from "./dto/categories-query.dto";
import type { CreateCategoryDto } from "./dto/create-category.dto";
import type { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private normalizeCategoryName(name: string) {
    const normalized = name.trim();
    if (normalized.length < 2) {
      throw new BadRequestException("El nombre de la categoría debe tener al menos 2 caracteres.");
    }
    return normalized;
  }

  private async ensureUniqueCategoryName(name: string, excludeId?: string) {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException("Ya existe una categoría con ese nombre.");
    }
  }

  private rethrowKnownCategoryErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException("Ya existe una categoría con ese nombre.");
    }
    throw error;
  }

  async findAll(query: CategoriesQueryDto) {
    const categories = await this.prisma.category.findMany({
      where: query.search
        ? {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          }
        : undefined,
      include: {
        parentCategory: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      position: category.position,
      parentCategoryId: category.parentCategoryId,
      parentCategoryName: category.parentCategory?.name ?? null,
      subcategoriesCount: category._count.children,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parentCategory: true },
    });

    if (!category) throw new NotFoundException("Categoría no encontrada.");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const name = this.normalizeCategoryName(dto.name);
    await this.ensureUniqueCategoryName(name);

    if (dto.parentCategoryId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentCategoryId } });
      if (!parent) throw new BadRequestException("La categoría padre no existe.");
    }

    try {
      return await this.prisma.category.create({
        data: {
          name,
          position: dto.position,
          parentCategoryId: dto.parentCategoryId ?? null,
        },
      });
    } catch (error) {
      this.rethrowKnownCategoryErrors(error);
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const nextName = dto.name !== undefined ? this.normalizeCategoryName(dto.name) : undefined;
    if (nextName !== undefined) {
      await this.ensureUniqueCategoryName(nextName, id);
    }

    if (dto.parentCategoryId) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException("Una categoría no puede ser su propia categoría padre.");
      }
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentCategoryId } });
      if (!parent) throw new BadRequestException("La categoría padre no existe.");
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(nextName !== undefined ? { name: nextName } : {}),
          ...(dto.position !== undefined ? { position: dto.position } : {}),
          ...(dto.parentCategoryId !== undefined ? { parentCategoryId: dto.parentCategoryId || null } : {}),
        },
      });
    } catch (error) {
      this.rethrowKnownCategoryErrors(error);
    }
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (!category) throw new NotFoundException("Categoría no encontrada.");
    if (category._count.children > 0) {
      throw new BadRequestException("No se puede eliminar una categoría que tiene subcategorías.");
    }
    if (category._count.products > 0) {
      throw new BadRequestException("No se puede eliminar una categoría con productos asociados.");
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
