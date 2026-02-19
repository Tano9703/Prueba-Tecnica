"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePlus, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CrudDialog } from "@/components/shared/crud-dialog";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { EntityForm } from "@/components/shared/entity-form";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createThumbnailDataUrl } from "@/lib/image-thumbnail";
import type { Product } from "@/lib/types";
import { categoriesService } from "@/services/categories.service";
import { productsService } from "@/services/products.service";

const optionSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  valuesText: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1),
  brand: z.string().min(1),
  price: z.coerce.number().min(0),
  options: z.array(optionSchema).default([]),
});

type FormValues = z.infer<typeof schema>;

function currency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

export function ProductsClientPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", search],
    queryFn: () => productsService.list({ search }),
    placeholderData: keepPreviousData,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "for-products"],
    queryFn: () => categoriesService.list(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      brand: "",
      price: 0,
      options: [],
    },
  });

  const optionsArray = useFieldArray({
    control: form.control,
    name: "options",
  });

  const appendPresetOption = (name: string, valuesText: string) => {
    const current = form.getValues("options");
    const exists = current.some((option) => option.name.trim().toLowerCase() === name.toLowerCase());
    if (exists) return;
    optionsArray.append({ name, valuesText });
  };

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const name = newCategoryName.trim();
      if (!name) {
        throw new Error("Ingresa un nombre de categoría.");
      }

      const maxPosition = Math.max(-1, ...(categoriesQuery.data ?? []).map((category) => category.position));
      return categoriesService.create({
        name,
        position: maxPosition + 1,
        parentCategoryId: null,
      });
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      form.setValue("categoryId", category.id, { shouldValidate: true });
      setCreatingCategory(false);
      setNewCategoryName("");
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      productsService.create({
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl?.trim() || undefined,
        categoryId: values.categoryId,
        brand: values.brand,
        gender: "General",
        price: values.price,
        options: values.options.map((option) => ({
          name: option.name,
          values:
            option.valuesText
              ?.split(",")
              .map((value) => value.trim())
              .filter(Boolean) ?? [],
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpenForm(false);
      setEditing(null);
      form.reset({
        name: "",
        description: "",
        imageUrl: "",
        categoryId: "",
        brand: "",
        price: 0,
        options: [],
      });
      setCreatingCategory(false);
      setNewCategoryName("");
      setImageError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FormValues }) =>
      productsService.update(id, {
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl?.trim() || undefined,
        categoryId: values.categoryId,
        brand: values.brand,
        price: values.price,
        options: values.options.map((option) => ({
          name: option.name,
          values:
            option.valuesText
              ?.split(",")
              .map((value) => value.trim())
              .filter(Boolean) ?? [],
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpenForm(false);
      setEditing(null);
      setImageError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteTarget(null);
    },
  });

  const columns = useMemo<DataColumn<Product>[]>(
    () => [
      {
        key: "name",
        title: "Nombre",
        render: (item) => (
          <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setSelectedProduct(item)}>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-tertiary/35 bg-tertiary/18">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-tertiary/70" />
              )}
            </div>
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="max-w-[360px] truncate text-xs text-tertiary">{item.description ?? "Sin descripción"}</p>
            </div>
          </button>
        ),
      },
      {
        key: "category",
        title: "Categoría",
        render: (item) => item.categoryName,
      },
      {
        key: "brand",
        title: "Marca",
        render: (item) => item.brand,
      },
      {
        key: "price",
        title: "Precio",
        render: (item) => currency(item.price),
      },
      {
        key: "actions",
        title: "Acciones",
        className: "w-[110px]",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-1 text-tertiary hover:bg-tertiary/18"
              onClick={() => {
                setEditing(item);
                form.reset({
                  name: item.name,
                  description: item.description ?? "",
                  imageUrl: item.imageUrl ?? "",
                  categoryId: item.categoryId,
                  brand: item.brand,
                  price: item.price,
                  options: (item.options ?? []).map((option) => ({
                    name: option.name,
                    valuesText: option.values.join(", "),
                  })),
                });
                setOpenForm(true);
                setCreatingCategory(false);
                setNewCategoryName("");
                setImageError(null);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1 text-quinary hover:bg-quinary/10" onClick={() => setDeleteTarget(item)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [form],
  );

  return (
    <div>
      <PageHeader
        title="Productos"
        breadcrumb="Inicio /Productos"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              form.reset({
                name: "",
                description: "",
                imageUrl: "",
                categoryId: "",
                brand: "",
                price: 0,
                options: [],
              });
              setOpenForm(true);
              setCreatingCategory(false);
              setNewCategoryName("");
              setImageError(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        }
      />

      <div className="rounded-xl border border-tertiary/35 bg-secondary p-4">
        <div className="mb-4 rounded-xl border border-tertiary/35 bg-secondary/80 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <SearchInput value={search} onChange={setSearch} className="w-full flex-1 sm:max-w-4xl" placeholder="Buscar productos por nombre..." />
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tertiary">Mostrando {(productsQuery.data ?? []).length} de {(productsQuery.data ?? []).length} productos</p>
          {productsQuery.isFetching && !productsQuery.isLoading ? <p className="text-xs text-tertiary">Actualizando...</p> : null}
        </div>

        {productsQuery.isLoading ? (
          <LoadingState message="Cargando productos..." />
        ) : productsQuery.isError ? (
          <p className="py-6 text-sm text-quinary">No se pudieron cargar los productos.</p>
        ) : (
          <DataTable columns={columns} data={productsQuery.data ?? []} rowKey={(row) => row.id} emptyMessage="No hay productos." />
        )}
      </div>

      <CrudDialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        title="Detalle del Producto"
        maxWidthClassName="max-w-3xl"
      >
        {selectedProduct ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
              <div className="flex h-[220px] items-center justify-center overflow-hidden rounded-xl border border-tertiary/35 bg-tertiary/18">
                {selectedProduct.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-tertiary/70" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold sm:text-3xl">{selectedProduct.name}</h3>
                <p className="mt-2 text-sm text-tertiary">{selectedProduct.description ?? "Sin descripción"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="info">{selectedProduct.categoryName}</Badge>
                  <Badge variant="dark">{selectedProduct.brand}</Badge>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-tertiary/35 p-3">
                    <p className="text-xs text-tertiary">Precio</p>
                    <p className="text-xl font-bold">{currency(selectedProduct.price)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-tertiary/35 p-4">
              <p className="mb-3 text-sm font-semibold">Atributos</p>
              {selectedProduct.options.length === 0 ? (
                <p className="text-sm text-tertiary">Este producto no tiene atributos cargados.</p>
              ) : (
                <div className="space-y-2">
                  {selectedProduct.options.map((option) => (
                    <div key={option.name} className="rounded-lg border border-tertiary/35 p-2">
                      <p className="text-sm font-semibold">{option.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {option.values.map((value) => (
                          <Badge key={`${option.name}-${value}`} variant="info">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CrudDialog>

      <CrudDialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) {
            setEditing(null);
            setCreatingCategory(false);
            setNewCategoryName("");
            setImageError(null);
          }
        }}
        title={editing ? "Editar Producto" : "Nuevo Producto"}
      >
        <EntityForm
          onSubmit={form.handleSubmit((values) => {
            if (editing) {
              updateMutation.mutate({ id: editing.id, values });
              return;
            }

            createMutation.mutate(values);
          })}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" {...form.register("description")} />
            </div>
            <Controller
              name="imageUrl"
              control={form.control}
              render={({ field }) => {
                const imageValue = field.value ?? "";
                const fromUpload = imageValue.startsWith("data:image");
                return (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="imageUrl">Miniatura del producto</Label>
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-tertiary/35 bg-tertiary/18">
                        {imageValue ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageValue} alt="Miniatura del producto" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-tertiary/70" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="imageUrl"
                          placeholder="https://... (opcional)"
                          value={fromUpload ? "" : imageValue}
                          onChange={(event) => {
                            setImageError(null);
                            field.onChange(event.target.value);
                          }}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (event) => {
                              const input = event.currentTarget;
                              const file = input.files?.[0];
                              if (!file) return;
                              setImageError(null);
                              try {
                                const thumbnail = await createThumbnailDataUrl(file);
                                field.onChange(thumbnail);
                              } catch (error) {
                                setImageError((error as Error).message);
                              }
                              input.value = "";
                            }}
                            className="text-sm text-tertiary file:mr-2 file:rounded-md file:border file:border-tertiary/35 file:bg-secondary file:px-2 file:py-1 file:text-sm"
                          />
                          {imageValue ? (
                            <Button type="button" variant="outline" onClick={() => field.onChange("")}>
                              Quitar imagen
                            </Button>
                          ) : null}
                        </div>
                        {fromUpload ? <p className="text-xs text-tertiary">Imagen cargada desde archivo local.</p> : null}
                        {imageError ? <p className="text-xs text-quinary">{imageError}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" {...form.register("brand")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="categoryId">Categoría</Label>
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        field.onChange("");
                        setCreatingCategory(false);
                        return;
                      }
                      if (value === "__new__") {
                        field.onChange("");
                        setCreatingCategory(true);
                        return;
                      }
                      field.onChange(value);
                      setCreatingCategory(false);
                    }}
                    disabled={categoriesQuery.isLoading}
                  >
                    <SelectTrigger id="categoryId">
                      <SelectValue placeholder={categoriesQuery.isLoading ? "Cargando..." : "Selecciona"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{categoriesQuery.isLoading ? "Cargando..." : "Selecciona"}</SelectItem>
                      <SelectItem value="__new__">+ Crear categoría nueva</SelectItem>
                      {(categoriesQuery.data ?? []).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {creatingCategory ? (
                <div className="mt-2 space-y-2 rounded-lg border border-tertiary/35 p-2">
                  <Input
                    placeholder="Nombre de la nueva categoría"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => setCreatingCategory(false)}>
                      Cancelar
                    </Button>
                    <Button type="button" onClick={() => createCategoryMutation.mutate()} disabled={createCategoryMutation.isPending}>
                      {createCategoryMutation.isPending ? "Creando..." : "Crear y seleccionar"}
                    </Button>
                  </div>
                  {createCategoryMutation.error ? (
                    <p className="text-xs text-quinary">{(createCategoryMutation.error as Error).message}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" type="number" step="0.01" min={0} {...form.register("price")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="mb-0">Atributos (talles, colores, etc.)</Label>
                <Button type="button" variant="outline" onClick={() => appendPresetOption("Talle", "XS, S, M, L, XL")}>
                  + Talle
                </Button>
                <Button type="button" variant="outline" onClick={() => appendPresetOption("Color", "Negro, Blanco, Azul")}>
                  + Color
                </Button>
                <Button type="button" variant="outline" onClick={() => optionsArray.append({ name: "", valuesText: "" })}>
                  <CirclePlus className="mr-2 h-4 w-4" />
                  Agregar atributo
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-tertiary/35 p-3">
                {optionsArray.fields.length === 0 ? (
                  <p className="text-xs text-tertiary">Sin atributos cargados.</p>
                ) : null}
                {optionsArray.fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-tertiary/35 p-2 md:grid-cols-[220px_1fr_40px]">
                    <Input placeholder="Nombre (ej: Talle)" {...form.register(`options.${index}.name`)} />
                    <Input placeholder="Valores separados por coma" {...form.register(`options.${index}.valuesText`)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => optionsArray.remove(index)}>
                      <Trash2 className="h-4 w-4 text-quinary" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear"}
            </Button>
          </div>
          {createMutation.error ? <p className="mt-2 text-sm text-quinary">{(createMutation.error as Error).message}</p> : null}
          {updateMutation.error ? <p className="mt-2 text-sm text-quinary">{(updateMutation.error as Error).message}</p> : null}
        </EntityForm>
      </CrudDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            deleteMutation.reset();
          }
        }}
        title="Eliminar producto"
        description={`¿Seguro que quieres eliminar "${deleteTarget?.name ?? ""}"?`}
        errorMessage={deleteMutation.error ? (deleteMutation.error as Error).message : undefined}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

