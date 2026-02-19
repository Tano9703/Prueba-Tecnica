"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Calendar, CheckCircle2, Eye, IdCard, ImageIcon, Mail, MapPin, Pencil, Percent, Phone, Plus, RotateCcw, Trash2, Truck, UserRound, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentStatus, Product, Sale, SaleStatus } from "@/lib/types";
import { productsService } from "@/services/products.service";
import type { GenerateSalePayload } from "@/services/sales.service";
import { salesService } from "@/services/sales.service";

const saleItemAttributeSchema = z.object({
  name: z.string().min(1),
  value: z.string().optional(),
});

const saleItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto."),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0."),
  attributes: z.array(saleItemAttributeSchema).default([]),
});

const generateSaleSchema = z.object({
  customerName: z.string().min(2, "Ingresa un nombre válido."),
  customerEmail: z.string().email("Ingresa un email válido."),
  items: z.array(saleItemSchema).min(1, "Agrega al menos un producto."),
  adjustmentType: z.enum(["NONE", "DISCOUNT", "SURCHARGE"]),
  adjustmentPercent: z.coerce.number().min(0, "El porcentaje no puede ser menor a 0.").max(100, "Máximo 100%."),
  paymentMethod: z.enum(["Efectivo", "Debito", "Credito", "Transferencia"]),
  shippingAddress: z.string().min(6, "Ingresa una dirección válida."),
  paymentSimulation: z.enum(["APPROVED", "DECLINED", "PENDING", "RANDOM"]),
  notes: z.string().optional(),
});

type GenerateSaleFormValues = z.infer<typeof generateSaleSchema>;

const editSaleSchema = z.object({
  customerName: z.string().min(2, "Ingresa un nombre válido."),
  customerEmail: z.string().email("Ingresa un email válido."),
  status: z.enum(["SENT", "PREPARING", "CANCELLED", "COMPLETED"]),
  paymentStatus: z.enum(["PAID", "FAILED", "PENDING"]),
  paymentMethod: z.string().min(2, "Ingresa un método válido."),
  shippingAddress: z.string().min(6, "Ingresa una dirección válida."),
  notes: z.string().optional(),
});

type EditSaleFormValues = z.infer<typeof editSaleSchema>;

function currency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function encodeSizeColorSelection(size: string, color: string) {
  return `${size.trim()}|${color.trim()}`;
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
      sizes: Object.keys(colorsBySize),
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
    sizes,
    colorsBySize,
    hasMatrix: false,
  };
}

function normalizeQuantity(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return 0;
  return numericValue;
}

export function SalesClientPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const generateForm = useForm<GenerateSaleFormValues>({
    resolver: zodResolver(generateSaleSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      items: [{ productId: "", quantity: 1, attributes: [] }],
      adjustmentType: "NONE",
      adjustmentPercent: 0,
      paymentMethod: "Credito",
      shippingAddress: "Av. Hacienda de sierra vieja n2 local H31 colonia hacienda de sierra vieja, Cuautitlán izcalli",
      paymentSimulation: "RANDOM",
      notes: "",
    },
  });

  const generateItemsFieldArray = useFieldArray({
    control: generateForm.control,
    name: "items",
  });

  const editForm = useForm<EditSaleFormValues>({
    resolver: zodResolver(editSaleSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      status: "PREPARING",
      paymentStatus: "PENDING",
      paymentMethod: "Credito",
      shippingAddress: "",
      notes: "",
    },
  });

  const salesQuery = useQuery({
    queryKey: ["sales", search],
    queryFn: () => salesService.list(search),
    placeholderData: keepPreviousData,
  });

  const saleDetailQuery = useQuery({
    queryKey: ["sale", selectedSaleId],
    queryFn: () => salesService.getById(selectedSaleId as string),
    enabled: Boolean(selectedSaleId),
  });

  const productsQuery = useQuery({
    queryKey: ["products-for-sales-generate"],
    queryFn: () => productsService.list(),
  });

  const watchedItems = useWatch({ control: generateForm.control, name: "items" }) ?? [];
  const watchedAdjustmentType = useWatch({ control: generateForm.control, name: "adjustmentType" });
  const watchedAdjustmentPercent = useWatch({ control: generateForm.control, name: "adjustmentPercent" });
  const selectedProductsMap = useMemo(() => {
    const map = new Map<string, Product>();
    (productsQuery.data ?? []).forEach((product) => map.set(product.id, product));
    return map;
  }, [productsQuery.data]);
  const hasAvailableProducts = (productsQuery.data?.length ?? 0) > 0;
  const canGenerateSales = !productsQuery.isLoading && !productsQuery.isError && hasAvailableProducts;

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale);
    editForm.reset({
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      status: sale.status,
      paymentStatus: sale.paymentStatus,
      paymentMethod: sale.paymentMethod,
      shippingAddress: sale.shippingAddress,
      notes: sale.notes ?? "",
    });
    setEditOpen(true);
  };

  const getProductAttributesTemplate = (productId: string) => {
    const product = selectedProductsMap.get(productId);
    if (!product) return [];
    return (product.options ?? []).map((option) => ({
      name: option.name,
      value: "",
    }));
  };

  const validateItemsAttributes = (values: GenerateSaleFormValues) => {
    let hasErrors = false;

    values.items.forEach((item, index) => {
      const product = selectedProductsMap.get(item.productId);
      if (!product) return;

      const requiredOptions = (product.options ?? []).filter((option) => option.values.length > 0);
      if (requiredOptions.length === 0) return;

      const selectedAttributesMap = new Map((item.attributes ?? []).map((attribute) => [attribute.name, attribute.value?.trim() ?? ""]));
      const missingOptions = requiredOptions.filter((option) => {
        const selectedValue = selectedAttributesMap.get(option.name);
        if (!selectedValue) return true;

        if (isSizeColorOptionName(option.name)) {
          const { size, color } = parseSizeColorSelection(selectedValue);
          return !size || !color;
        }

        return false;
      });

      if (missingOptions.length > 0) {
        hasErrors = true;
        generateForm.setError(`items.${index}.attributes`, {
          type: "manual",
          message: `Completa los atributos: ${missingOptions.map((option) => option.name).join(", ")}.`,
        });
        return;
      }

      const invalidSizeColorOption = requiredOptions.find((option) => {
        if (!isSizeColorOptionName(option.name)) return false;
        const selectedValue = selectedAttributesMap.get(option.name);
        if (!selectedValue) return false;

        const { size, color } = parseSizeColorSelection(selectedValue);
        const sizeColorMap = parseSizeColorMap(option.values);
        const allowedColors = sizeColorMap.colorsBySize[size] ?? [];

        return !allowedColors.includes(color);
      });

      if (invalidSizeColorOption) {
        hasErrors = true;
        generateForm.setError(`items.${index}.attributes`, {
          type: "manual",
          message: `La combinación de ${invalidSizeColorOption.name} no está disponible para este producto.`,
        });
      }
    });

    return !hasErrors;
  };

  const subtotal = useMemo(
    () =>
      watchedItems.reduce((acc, item) => {
        const product = selectedProductsMap.get(item.productId);
        if (!product) return acc;
        return acc + product.price * normalizeQuantity(item.quantity);
      }, 0),
    [selectedProductsMap, watchedItems],
  );

  const safeAdjustmentPercent = useMemo(() => {
    if (Number.isNaN(watchedAdjustmentPercent)) return 0;
    return Math.min(Math.max(watchedAdjustmentPercent ?? 0, 0), 100);
  }, [watchedAdjustmentPercent]);

  const adjustmentAmount = useMemo(() => {
    if (watchedAdjustmentType === "NONE") return 0;
    return (subtotal * safeAdjustmentPercent) / 100;
  }, [safeAdjustmentPercent, subtotal, watchedAdjustmentType]);

  const computedTotal = useMemo(() => {
    if (watchedAdjustmentType === "DISCOUNT") return Math.max(0, subtotal - adjustmentAmount);
    if (watchedAdjustmentType === "SURCHARGE") return subtotal + adjustmentAmount;
    return subtotal;
  }, [adjustmentAmount, subtotal, watchedAdjustmentType]);

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateSalePayload) => salesService.generate(payload),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setGenerateOpen(false);
      generateForm.reset();
      setSelectedSaleId(sale.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EditSaleFormValues }) =>
      salesService.update(id, {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        status: values.status as SaleStatus,
        paymentStatus: values.paymentStatus as PaymentStatus,
        paymentMethod: values.paymentMethod,
        shippingAddress: values.shippingAddress,
        notes: values.notes,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", variables.id] });
      setEditOpen(false);
      setEditingSale(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesService.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      if (selectedSaleId === id) {
        setSelectedSaleId(null);
      }
      setDeleteTarget(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => salesService.updateStatus(id, "COMPLETED", notes || "Pedido completado"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", selectedSaleId] });
    },
  });

  const columns = useMemo<DataColumn<Sale>[]>(
    () => [
      {
        key: "client",
        title: "Cliente",
        render: (item) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {item.customerName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold">{item.customerName}</p>
              <p className="text-xs text-muted">{item.customerEmail}</p>
            </div>
          </div>
        ),
      },
      {
        key: "order",
        title: "Número de Orden",
        render: (item) => (
          <div>
            <p className="font-semibold">{item.orderNumber}</p>
            <p className="text-xs text-muted">{formatDate(item.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "status",
        title: "Estado",
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: "total",
        title: "Total",
        render: (item) => <p className="font-bold">{currency(item.total)}</p>,
      },
      {
        key: "payment",
        title: "Pago",
        render: (item) => (
          <div className="space-y-1">
            <StatusBadge status={item.paymentStatus} />
            <p className="text-xs text-muted">{item.paymentMethod}</p>
          </div>
        ),
      },
      {
        key: "actions",
        title: "Acciones",
        className: "w-[120px]",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button className="rounded-md p-1 text-slate-600 hover:bg-slate-100" onClick={() => setSelectedSaleId(item.id)}>
              <Eye className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1 text-slate-600 hover:bg-slate-100" onClick={() => openEditDialog(item)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1 text-[#B42318] hover:bg-red-50" onClick={() => setDeleteTarget(item)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [openEditDialog],
  );

  const selectedSale = saleDetailQuery.data;

  return (
    <div>
      <PageHeader
        title="Ventas"
        breadcrumb="Inicio /Ventas"
        actions={
          <Button
            onClick={() => setGenerateOpen(true)}
            disabled={generateMutation.isPending || !canGenerateSales}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generar Venta
          </Button>
        }
      />
      {productsQuery.isError ? (
        <p className="mb-4 text-sm text-[#B42318]">No se pudieron cargar los productos disponibles para ventas.</p>
      ) : !productsQuery.isLoading && !hasAvailableProducts ? (
        <p className="mb-4 text-sm text-[#B42318]">No hay productos disponibles. Carga productos para poder generar ventas.</p>
      ) : null}

      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="mb-3 text-3xl font-bold">Listado de Ventas</h2>
        <div className="mb-2 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} className="max-w-md" />
          {salesQuery.isFetching && !salesQuery.isLoading ? <p className="text-xs text-muted">Actualizando...</p> : null}
        </div>
        {salesQuery.isLoading ? (
          <LoadingState message="Cargando ventas..." />
        ) : salesQuery.isError ? (
          <p className="py-6 text-sm text-[#B42318]">No se pudieron cargar las ventas.</p>
        ) : (
          <DataTable columns={columns} data={salesQuery.data ?? []} rowKey={(row) => row.id} emptyMessage="No hay ventas registradas." />
        )}
      </div>

      <CrudDialog
        open={generateOpen}
        onOpenChange={(open) => {
          setGenerateOpen(open);
          if (!open) generateForm.reset();
        }}
        title="Generar Venta"
        maxWidthClassName="max-w-2xl"
      >
        <form
          className="space-y-4"
          onSubmit={generateForm.handleSubmit((values) => {
            if (!canGenerateSales) {
              generateForm.setError("items", {
                type: "manual",
                message: productsQuery.isError
                  ? "No se pudieron cargar los productos disponibles."
                  : "No hay productos disponibles para generar una venta.",
              });
              return;
            }

            generateForm.clearErrors("items");
            if (!validateItemsAttributes(values)) {
              return;
            }

            generateMutation.mutate({
              ...values,
              total: computedTotal,
              items: values.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                attributes: (item.attributes ?? [])
                  .map((attribute) => ({ name: attribute.name, value: attribute.value?.trim() ?? "" }))
                  .filter((attribute) => Boolean(attribute.value)),
              })),
              adjustmentType: values.adjustmentType === "NONE" ? undefined : values.adjustmentType,
              adjustmentPercent: values.adjustmentType === "NONE" ? undefined : values.adjustmentPercent,
            });
          })}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="customerName">Nombre del cliente</Label>
              <Input id="customerName" {...generateForm.register("customerName")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customerEmail">Email</Label>
              <Input id="customerEmail" {...generateForm.register("customerEmail")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentMethod">Método de pago</Label>
              <Controller
                name="paymentMethod"
                control={generateForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Debito">Debito</SelectItem>
                      <SelectItem value="Credito">Credito</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="shippingAddress">Dirección de envío</Label>
              <Input id="shippingAddress" {...generateForm.register("shippingAddress")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentSimulation">Simulación de pago</Label>
              <Controller
                name="paymentSimulation"
                control={generateForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="paymentSimulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RANDOM">Aleatorio</SelectItem>
                      <SelectItem value="APPROVED">Aprobado</SelectItem>
                      <SelectItem value="DECLINED">Fallido</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Productos vendidos</Label>
              <div className="space-y-2 rounded-lg border border-border p-3">
                {productsQuery.isError ? (
                  <p className="text-sm text-[#B42318]">No se pudieron cargar los productos para esta venta.</p>
                ) : !hasAvailableProducts ? (
                  <p className="text-sm text-[#B42318]">No hay productos disponibles para seleccionar.</p>
                ) : null}
                {generateItemsFieldArray.fields.map((field, index) => {
                  const itemValues = watchedItems?.[index];
                  const selectedProduct = itemValues ? selectedProductsMap.get(itemValues.productId) : undefined;
                  const itemSubtotal = selectedProduct ? selectedProduct.price * normalizeQuantity(itemValues?.quantity) : 0;
                  const selectedAttributes = itemValues?.attributes ?? [];

                  return (
                    <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-2 md:grid-cols-[1fr_120px_120px_40px]">
                      <div className="space-y-2">
                        <Controller
                          name={`items.${index}.productId`}
                          control={generateForm.control}
                          render={({ field: selectField }) => (
                            <Select
                              value={selectField.value || undefined}
                              onValueChange={(value) => {
                                selectField.onChange(value);
                                generateForm.clearErrors(`items.${index}.attributes`);
                                generateForm.setValue(`items.${index}.attributes`, getProductAttributesTemplate(value), {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                              </SelectTrigger>
                              <SelectContent>
                                {(productsQuery.data ?? []).map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({currency(product.price)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {selectedProduct ? (
                          <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                              {selectedProduct.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <p className="truncate text-xs text-muted">{selectedProduct.name}</p>
                          </div>
                        ) : null}
                        {selectedProduct && selectedAttributes.length > 0 ? (
                          <div className="space-y-2 rounded-md border border-border p-2">
                            <p className="text-xs font-semibold text-muted">Atributos</p>
                            {selectedAttributes.map((attribute, attributeIndex) => {
                              const optionValues = selectedProduct.options.find((option) => option.name === attribute.name)?.values ?? [];
                              const isSizeColorOption = isSizeColorOptionName(attribute.name);
                              const sizeColorMap = isSizeColorOption ? parseSizeColorMap(optionValues) : null;
                              const selectedSizeColor = isSizeColorOption ? parseSizeColorSelection(attribute.value ?? "") : null;
                              const selectedSize = selectedSizeColor?.size ?? "";
                              const selectedColor = selectedSizeColor?.color ?? "";
                              const availableColors = selectedSize ? sizeColorMap?.colorsBySize[selectedSize] ?? [] : [];

                              return (
                                <div key={`${field.id}-${attribute.name}`} className="space-y-1">
                                  <Label className="text-xs">{attribute.name}</Label>
                                  {isSizeColorOption && sizeColorMap ? (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                      <Select
                                        value={selectedSize || undefined}
                                        onValueChange={(sizeValue) => {
                                          generateForm.clearErrors(`items.${index}.attributes`);
                                          const nextAllowedColors = sizeColorMap.colorsBySize[sizeValue] ?? [];
                                          const nextColor = nextAllowedColors.includes(selectedColor) ? selectedColor : "";
                                          generateForm.setValue(
                                            `items.${index}.attributes.${attributeIndex}.value`,
                                            encodeSizeColorSelection(sizeValue, nextColor),
                                            { shouldDirty: true, shouldValidate: true },
                                          );
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecciona talle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {sizeColorMap.sizes.map((sizeValue) => (
                                            <SelectItem key={`${attribute.name}-size-${sizeValue}`} value={sizeValue}>
                                              {sizeValue}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={selectedColor || undefined}
                                        onValueChange={(colorValue) => {
                                          generateForm.clearErrors(`items.${index}.attributes`);
                                          generateForm.setValue(
                                            `items.${index}.attributes.${attributeIndex}.value`,
                                            encodeSizeColorSelection(selectedSize, colorValue),
                                            { shouldDirty: true, shouldValidate: true },
                                          );
                                        }}
                                        disabled={!selectedSize}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder={selectedSize ? "Selecciona color" : "Selecciona talle primero"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableColors.map((colorValue) => (
                                            <SelectItem key={`${attribute.name}-color-${selectedSize}-${colorValue}`} value={colorValue}>
                                              {colorValue}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : optionValues.length > 0 ? (
                                    <Controller
                                      name={`items.${index}.attributes.${attributeIndex}.value`}
                                      control={generateForm.control}
                                      render={({ field: attributeField }) => (
                                        <Select
                                          value={attributeField.value || undefined}
                                          onValueChange={(value) => {
                                            generateForm.clearErrors(`items.${index}.attributes`);
                                            attributeField.onChange(value);
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder={`Selecciona ${attribute.name.toLowerCase()}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {optionValues.map((value) => (
                                              <SelectItem key={`${attribute.name}-${value}`} value={value}>
                                                {value}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    />
                                  ) : (
                                    <Input
                                      placeholder={`Escribe ${attribute.name.toLowerCase()}`}
                                      {...generateForm.register(`items.${index}.attributes.${attributeIndex}.value`)}
                                    />
                                  )}
                                  {isSizeColorOption && sizeColorMap && !sizeColorMap.hasMatrix ? (
                                    <p className="text-[11px] text-muted">
                                      Tip: para restringir colores por talle, carga este atributo como `S:rojo|verde, L:azul|naranja`.
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                        {generateForm.formState.errors.items?.[index]?.attributes?.message ? (
                          <p className="text-xs text-[#B42318]">{generateForm.formState.errors.items[index]?.attributes?.message}</p>
                        ) : null}
                      </div>
                      <Input type="number" min={1} {...generateForm.register(`items.${index}.quantity`)} />
                      <Input value={currency(itemSubtotal)} disabled />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => generateItemsFieldArray.remove(index)}
                        disabled={generateItemsFieldArray.fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-[#B42318]" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateItemsFieldArray.append({ productId: "", quantity: 1, attributes: [] })}
                  disabled={!canGenerateSales}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar producto
                </Button>
              </div>
              {generateForm.formState.errors.items?.message ? (
                <p className="text-sm text-[#B42318]">{generateForm.formState.errors.items.message}</p>
              ) : null}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="generateNotes">Notas (opcional)</Label>
              <Textarea id="generateNotes" {...generateForm.register("notes")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adjustmentType">Ajuste (opcional)</Label>
              <Controller
                name="adjustmentType"
                control={generateForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="adjustmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin ajuste</SelectItem>
                      <SelectItem value="DISCOUNT">Descuento</SelectItem>
                      <SelectItem value="SURCHARGE">Recargo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adjustmentPercent">Porcentaje</Label>
              <Controller
                name="adjustmentPercent"
                control={generateForm.control}
                render={({ field }) => {
                  const isPristineZero = !generateForm.formState.dirtyFields.adjustmentPercent && Number(field.value ?? 0) === 0;

                  return (
                    <div className="relative">
                      <Input
                        id="adjustmentPercent"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        inputMode="decimal"
                        disabled={watchedAdjustmentType === "NONE"}
                        value={isPristineZero ? "" : (field.value ?? "")}
                        onChange={field.onChange}
                        className="pr-9"
                      />
                      <Percent className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    </div>
                  );
                }}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Total calculado</Label>
              <Input value={currency(computedTotal)} disabled />
              <p className="text-xs text-muted">
                Subtotal: {currency(subtotal)}
                {watchedAdjustmentType !== "NONE"
                  ? ` | ${watchedAdjustmentType === "DISCOUNT" ? "Descuento" : "Recargo"}: ${safeAdjustmentPercent}% (${watchedAdjustmentType === "DISCOUNT" ? "-" : "+"}${currency(adjustmentAmount)})`
                  : ""}
              </p>
            </div>
          </div>

          {generateMutation.error ? (
            <p className="text-sm text-[#B42318]">{(generateMutation.error as Error).message}</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={generateMutation.isPending || !canGenerateSales}>
              {generateMutation.isPending ? "Generando..." : "Confirmar Venta"}
            </Button>
          </div>
        </form>
      </CrudDialog>

      <CrudDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingSale(null);
            editForm.reset();
          }
        }}
        title="Editar Venta"
        maxWidthClassName="max-w-2xl"
      >
        <form
          className="space-y-4"
          onSubmit={editForm.handleSubmit((values) => {
            if (!editingSale) return;
            updateMutation.mutate({ id: editingSale.id, values });
          })}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="editCustomerName">Nombre del cliente</Label>
              <Input id="editCustomerName" {...editForm.register("customerName")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editCustomerEmail">Email</Label>
              <Input id="editCustomerEmail" {...editForm.register("customerEmail")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editStatus">Estado</Label>
              <Controller
                name="status"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="editStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PREPARING">Preparando</SelectItem>
                      <SelectItem value="SENT">Enviado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="COMPLETED">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editPaymentStatus">Estado de pago</Label>
              <Controller
                name="paymentStatus"
                control={editForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="editPaymentStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="PAID">Pagado</SelectItem>
                      <SelectItem value="FAILED">Fallido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editPaymentMethod">Método de pago</Label>
              <Input id="editPaymentMethod" {...editForm.register("paymentMethod")} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="editShippingAddress">Dirección de envío</Label>
              <Input id="editShippingAddress" {...editForm.register("shippingAddress")} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="editNotes">Notas</Label>
              <Textarea id="editNotes" {...editForm.register("notes")} />
            </div>
          </div>

          {updateMutation.error ? (
            <p className="text-sm text-[#B42318]">{(updateMutation.error as Error).message}</p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CrudDialog>

      <CrudDialog
        open={Boolean(selectedSaleId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSaleId(null);
            setNotes("");
          }
        }}
        title="Gestionar Orden"
        maxWidthClassName="max-w-5xl"
      >
        {saleDetailQuery.isLoading ? (
          <LoadingState message="Cargando detalle de la venta..." className="min-h-60" />
        ) : saleDetailQuery.isError || !selectedSale ? (
          <p className="text-sm text-[#B42318]">No se pudo cargar el detalle de la venta.</p>
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <Truck className="h-5 w-5" />
                Estado Actual
              </h4>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedSale.status} />
                <div className="flex items-center gap-1 text-muted">
                  <Calendar className="h-4 w-4" />
                  Orden #{selectedSale.orderNumber}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                  <UserRound className="h-5 w-5" />
                  Información del Cliente
                </h4>
                <p className="mb-2 font-semibold">{selectedSale.customerName}</p>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Mail className="h-4 w-4" />
                  {selectedSale.customerEmail}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <Phone className="h-4 w-4" />
                  5521232104
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <IdCard className="h-4 w-4" />
                  ID: {selectedSale.id}
                </p>
              </section>

              <section className="rounded-xl border border-border p-4">
                <h4 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                  <Wallet className="h-5 w-5" />
                  Información de Pago
                </h4>
                <p className="flex justify-between">
                  <span className="text-muted">Método:</span>
                  <span className="font-semibold">{selectedSale.paymentMethod}</span>
                </p>
                <p className="mt-2 flex items-center justify-between">
                  <span className="text-muted">Estado:</span>
                  <StatusBadge status={selectedSale.paymentStatus} />
                </p>
                <p className="mt-2 flex justify-between">
                  <span className="text-muted">Total:</span>
                  <span className="text-3xl font-bold">{currency(selectedSale.total)}</span>
                </p>
              </section>
            </div>

            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                <MapPin className="h-5 w-5" />
                Información de Envío
              </h4>
              <p className="text-sm font-semibold text-muted">Dirección de Envío:</p>
              <p className="text-slate-600">{selectedSale.shippingAddress}</p>
              <p className="mt-3 flex items-center gap-2">
                <Box className="h-4 w-4 text-muted" />
                <span className="font-semibold">Tracking:</span> {selectedSale.trackingNumber ?? "Sin tracking"}
              </p>
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-3 text-2xl font-bold">Productos de la Venta</h4>
              {selectedSale.items?.length ? (
                <div className="space-y-2">
                  {selectedSale.items.map((item) => {
                    const saleProduct = selectedProductsMap.get(item.productId);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                            {saleProduct?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={saleProduct.imageUrl} alt={item.productNameSnapshot} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{item.productNameSnapshot}</p>
                            <p className="text-xs text-muted">
                              {item.quantity} x {currency(item.unitPrice)}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">{currency(item.subtotal)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">Esta venta no tiene productos asociados.</p>
              )}
            </section>

            <section className="rounded-xl border border-border p-4">
              <h4 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                <RotateCcw className="h-5 w-5" />
                Historial de Modificaciones
              </h4>
              <div className="space-y-3">
                {(selectedSale.histories ?? []).map((history) => (
                  <div key={history.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <StatusBadge status={history.status} />
                        <span className="text-sm text-muted">{formatDate(history.createdAt)}</span>
                      </div>
                      <p>{history.note ?? "Sin nota."}</p>
                      <p className="text-sm text-muted">Por: {history.changedBy ?? "Sistema"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div>
              <p className="mb-1 font-medium">Notas para el cambio de estado (opcional)</p>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Agregar notas sobre el cambio de estado..." />
            </div>

            <section className="border-t border-border pt-4">
              <p className="mb-2 font-medium">Acciones Disponibles</p>
              <Button
                className="w-full"
                disabled={completeMutation.isPending || selectedSale.status === "COMPLETED"}
                onClick={() => completeMutation.mutate(selectedSale.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {selectedSale.status === "COMPLETED"
                  ? "Pedido Completado"
                  : completeMutation.isPending
                    ? "Completando..."
                    : "Completar Pedido"}
              </Button>
            </section>
          </div>
        )}
      </CrudDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar venta"
        description={`¿Seguro que quieres eliminar la orden "${deleteTarget?.orderNumber ?? ""}"?`}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
