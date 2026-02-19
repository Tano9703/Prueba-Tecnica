import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PaymentStatus, SaleStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateSaleDto } from "./dto/create-sale.dto";
import { PaymentSimulationResult, PriceAdjustmentType, type GenerateSaleDto, type GenerateSaleItemDto } from "./dto/generate-sale.dto";
import type { SalesQueryDto } from "./dto/sales-query.dto";
import type { UpdateSaleDto } from "./dto/update-sale.dto";
import type { UpdateSaleStatusDto } from "./dto/update-sale-status.dto";

function randomOrderNumber(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

interface ProductOptionShape {
  name: string;
  values: string[];
}

function normalizeProductOptions(input: unknown): ProductOptionShape[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((option) => {
      if (typeof option !== "object" || option === null) return null;
      const name = "name" in option && typeof option.name === "string" ? option.name.trim() : "";
      const valuesRaw: unknown[] = "values" in option && Array.isArray(option.values) ? option.values : [];
      const values = valuesRaw
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean);

      if (!name) return null;
      return { name, values };
    })
    .filter((option): option is ProductOptionShape => option !== null);
}

function isSizeToken(value: string) {
  const normalized = value.trim().toUpperCase();
  return ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "U", "UNICO", "UNICA", "UNISEX"].includes(normalized) || /^\d{2,3}$/.test(normalized);
}

function isSizeColorOptionName(name: string) {
  const normalized = name.toLowerCase();
  return normalized.includes("talle") && normalized.includes("color");
}

function parseSizeColorSelection(value: string) {
  const [sizeRaw = "", colorRaw = ""] = value.split("|");
  return {
    size: sizeRaw.trim(),
    color: colorRaw.trim(),
  };
}

function parseSizeColorMap(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  const matrixEntries = cleaned.filter((value) => value.includes(":"));

  if (matrixEntries.length > 0) {
    const colorsBySize = matrixEntries.reduce<Record<string, string[]>>((acc, entry) => {
      const [sizeRaw, colorsRaw = ""] = entry.split(":");
      const size = sizeRaw.trim();
      const colors = colorsRaw
        .split("|")
        .map((color) => color.trim())
        .filter(Boolean);
      if (!size) return acc;
      acc[size] = Array.from(new Set(colors));
      return acc;
    }, {});

    return {
      colorsBySize,
      hasMatrix: true,
    };
  }

  const sizeValues = Array.from(new Set(cleaned.filter((value) => isSizeToken(value))));
  const colorValues = Array.from(new Set(cleaned.filter((value) => !isSizeToken(value))));
  const fallbackValues = Array.from(new Set(cleaned));
  const sizes = sizeValues.length > 0 ? sizeValues : fallbackValues;
  const colors = colorValues.length > 0 ? colorValues : fallbackValues;
  const colorsBySize = Object.fromEntries(sizes.map((size) => [size, colors]));

  return {
    colorsBySize,
    hasMatrix: false,
  };
}

@Injectable()
export class SalesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private serializeSale<T extends { total: unknown; items?: Array<{ unitPrice: unknown; subtotal: unknown }> }>(sale: T) {
    return {
      ...sale,
      total: Number(sale.total),
      items: sale.items?.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  private async resolveItems(items?: GenerateSaleItemDto[]) {
    if (!items || items.length === 0) return [];

    const uniqueProductIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
      select: { id: true, name: true, price: true, options: true },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const missingProduct = uniqueProductIds.find((productId) => !productMap.has(productId));
    if (missingProduct) {
      throw new NotFoundException(`No se encontró el producto ${missingProduct}.`);
    }

    return items.map((item) => {
      const product = productMap.get(item.productId)!;
      const productOptions = normalizeProductOptions(product.options);
      const selectedAttributesMap = new Map(
        (item.attributes ?? [])
          .map((attribute) => ({
            name: attribute.name?.trim(),
            value: attribute.value?.trim(),
          }))
          .filter((attribute) => Boolean(attribute.name) && Boolean(attribute.value))
          .map((attribute) => [attribute.name as string, attribute.value as string]),
      );

      const missingOptions = productOptions.filter((option) => {
        const selectedValue = selectedAttributesMap.get(option.name);
        if (!selectedValue) return true;

        if (isSizeColorOptionName(option.name)) {
          const { size, color } = parseSizeColorSelection(selectedValue);
          return !size || !color;
        }

        return false;
      });
      if (missingOptions.length > 0) {
        throw new BadRequestException(`Debes seleccionar ${missingOptions.map((option) => option.name).join(", ")} para ${product.name}.`);
      }

      const invalidAttribute = productOptions.find((option) => {
        const selectedValue = selectedAttributesMap.get(option.name);
        if (!selectedValue) return false;

        if (isSizeColorOptionName(option.name)) {
          const { size, color } = parseSizeColorSelection(selectedValue);
          const sizeColorMap = parseSizeColorMap(option.values);
          const allowedColors = sizeColorMap.colorsBySize[size] ?? [];
          return !allowedColors.includes(color);
        }

        return option.values.length > 0 && !option.values.includes(selectedValue);
      });
      if (invalidAttribute) {
        throw new BadRequestException(`El atributo ${invalidAttribute.name} no coincide con las opciones del producto ${product.name}.`);
      }

      const selectedAttributes = productOptions
        .map((option) => {
          const selectedValue = selectedAttributesMap.get(option.name) ?? "";
          if (isSizeColorOptionName(option.name)) {
            const { size, color } = parseSizeColorSelection(selectedValue);
            return {
              name: option.name,
              value: size && color ? `${size} / ${color}` : selectedValue,
            };
          }

          return { name: option.name, value: selectedValue };
        })
        .filter((attribute) => Boolean(attribute.value));
      const attributesSnapshot =
        selectedAttributes.length > 0
          ? ` | ${selectedAttributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(", ")}`
          : "";
      const unitPrice = Number(product.price);
      const subtotal = roundCurrency(unitPrice * item.quantity);
      return {
        productId: product.id,
        productNameSnapshot: `${product.name}${attributesSnapshot}`,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });
  }

  private resolvePaymentSimulation(simulation?: PaymentSimulationResult): PaymentSimulationResult {
    if (simulation && simulation !== PaymentSimulationResult.RANDOM) {
      return simulation;
    }

    const pool: PaymentSimulationResult[] = [
      PaymentSimulationResult.APPROVED,
      PaymentSimulationResult.DECLINED,
      PaymentSimulationResult.PENDING,
    ];
    return pool[Math.floor(Math.random() * pool.length)] ?? PaymentSimulationResult.PENDING;
  }

  async findAll(query: SalesQueryDto) {
    const sales = await this.prisma.sale.findMany({
      where: query.search
        ? {
            OR: [
              { customerName: { contains: query.search, mode: "insensitive" } },
              { customerEmail: { contains: query.search, mode: "insensitive" } },
              { orderNumber: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    return sales.map((sale) => this.serializeSale(sale));
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sale) throw new NotFoundException("Venta no encontrada.");
    return this.serializeSale(sale);
  }

  async create(dto: CreateSaleDto, changedBy?: string) {
    const created = await this.prisma.sale.create({
      data: {
        ...dto,
        orderNumber: randomOrderNumber(),
      },
    });

    await this.prisma.saleHistory.create({
      data: {
        saleId: created.id,
        status: created.status,
        note: dto.notes ?? "Venta creada",
        changedBy: changedBy ?? "Sistema",
      },
    });

    return this.serializeSale(created);
  }

  async generate(dto: GenerateSaleDto, changedBy?: string) {
    const simulation = this.resolvePaymentSimulation(dto.paymentSimulation);
    const resolvedItems = await this.resolveItems(dto.items);
    if (resolvedItems.length === 0) {
      throw new BadRequestException("Debes agregar al menos un producto disponible para generar la venta.");
    }

    const subtotal = roundCurrency(resolvedItems.reduce((acc, item) => acc + item.subtotal, 0));
    const hasAdjustment = Boolean(dto.adjustmentType && dto.adjustmentPercent && dto.adjustmentPercent > 0);
    const safeAdjustmentPercent = dto.adjustmentPercent ? Math.min(Math.max(dto.adjustmentPercent, 0), 100) : 0;
    const adjustmentAmount = roundCurrency((subtotal * safeAdjustmentPercent) / 100);

    const total =
      hasAdjustment && dto.adjustmentType === PriceAdjustmentType.DISCOUNT
        ? roundCurrency(Math.max(0, subtotal - adjustmentAmount))
        : hasAdjustment && dto.adjustmentType === PriceAdjustmentType.SURCHARGE
          ? roundCurrency(subtotal + adjustmentAmount)
          : subtotal;

    const adjustmentText =
      hasAdjustment && dto.adjustmentType === PriceAdjustmentType.DISCOUNT
        ? `Descuento ${safeAdjustmentPercent}%`
        : hasAdjustment && dto.adjustmentType === PriceAdjustmentType.SURCHARGE
          ? `Recargo ${safeAdjustmentPercent}%`
          : undefined;
    const suffix = Date.now().toString().slice(-6);
    const shippingAddress =
      dto.shippingAddress ??
      "Av. Hacienda de sierra vieja n2 local H31 colonia hacienda de sierra vieja, Cuautitlán izcalli, Estado de mexico 54769";

    let status: SaleStatus = SaleStatus.PREPARING;
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (simulation === PaymentSimulationResult.APPROVED) {
      status = SaleStatus.SENT;
      paymentStatus = PaymentStatus.PAID;
    } else if (simulation === PaymentSimulationResult.DECLINED) {
      status = SaleStatus.CANCELLED;
      paymentStatus = PaymentStatus.FAILED;
    } else if (simulation === PaymentSimulationResult.PENDING) {
      status = SaleStatus.PREPARING;
      paymentStatus = PaymentStatus.PENDING;
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerName: dto.customerName ?? `Cliente ${suffix}`,
          customerEmail: dto.customerEmail ?? `cliente${suffix}@mail.com`,
          total,
          status,
          paymentStatus,
          paymentMethod: dto.paymentMethod ?? "Tarjeta de Crédito",
          shippingAddress,
          trackingNumber: dto.trackingNumber ?? (simulation === PaymentSimulationResult.DECLINED ? undefined : randomOrderNumber(10)),
          notes: dto.notes ?? `Generada desde panel (pago ${simulation})${adjustmentText ? ` | ${adjustmentText}` : ""}`,
          orderNumber: randomOrderNumber(),
          items: { create: resolvedItems },
        },
        include: {
          items: true,
        },
      });

      await tx.saleHistory.create({
        data: {
          saleId: sale.id,
          status: sale.status,
          note: dto.notes ?? `Generada desde panel (pago ${simulation})${adjustmentText ? ` | ${adjustmentText}` : ""}`,
          changedBy: changedBy ?? "Sistema",
        },
      });

      return sale;
    });

    return this.serializeSale(created);
  }

  async update(id: string, dto: UpdateSaleDto, changedBy?: string) {
    const existing = await this.prisma.sale.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Venta no encontrada.");

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        ...(dto.customerName !== undefined ? { customerName: dto.customerName } : {}),
        ...(dto.customerEmail !== undefined ? { customerEmail: dto.customerEmail } : {}),
        ...(dto.total !== undefined ? { total: dto.total } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.paymentStatus !== undefined ? { paymentStatus: dto.paymentStatus } : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod } : {}),
        ...(dto.shippingAddress !== undefined ? { shippingAddress: dto.shippingAddress } : {}),
        ...(dto.trackingNumber !== undefined ? { trackingNumber: dto.trackingNumber } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.prisma.saleHistory.create({
      data: {
        saleId: id,
        status: updated.status,
        note: dto.notes ?? "Venta actualizada desde el panel.",
        changedBy: changedBy ?? "Sistema",
      },
    });

    return this.serializeSale(updated);
  }

  async updateStatus(id: string, dto: UpdateSaleStatusDto, changedBy?: string) {
    const existing = await this.prisma.sale.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Venta no encontrada.");

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.note ?? existing.notes,
      },
    });

    await this.prisma.saleHistory.create({
      data: {
        saleId: id,
        status: dto.status,
        note: dto.note ?? `Cambio de estado a ${dto.status}`,
        changedBy: changedBy ?? "Sistema",
      },
    });

    return this.serializeSale(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.sale.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Venta no encontrada.");
    return this.serializeSale(await this.prisma.sale.delete({ where: { id } }));
  }
}
