"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import type { Category } from "@/lib/types";
import { categoriesService, type CategoryPayload } from "@/services/categories.service";

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  position: z.coerce.number().int().min(0),
  parentCategoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CategoriesClientPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories", search],
    queryFn: () => categoriesService.list(search),
    placeholderData: keepPreviousData,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      position: 0,
      parentCategoryId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpenForm(false);
      setEditing(null);
      form.reset({ name: "", position: 0, parentCategoryId: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) => categoriesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpenForm(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
  });

  const columns = useMemo<DataColumn<Category>[]>(
    () => [
      {
        key: "position",
        title: "Posición",
        render: (item) => item.position,
      },
      {
        key: "name",
        title: "Nombre",
        render: (item) => <span className="font-semibold">{item.name}</span>,
      },
      {
        key: "subcategories",
        title: "Subcategorías",
        render: (item) => <Badge>{item.subcategoriesCount} subcategorías</Badge>,
      },
      {
        key: "parent",
        title: "Categoría Padre",
        render: (item) =>
          item.parentCategoryName ? <Badge variant="info">{item.parentCategoryName}</Badge> : <Badge variant="success">Principal</Badge>,
      },
      {
        key: "actions",
        title: "Acciones",
        className: "w-[120px]",
        render: (item) => (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setEditing(item);
                createMutation.reset();
                updateMutation.reset();
                form.clearErrors();
                form.reset({
                  name: item.name,
                  position: item.position,
                  parentCategoryId: item.parentCategoryId ?? "",
                });
                setOpenForm(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1 text-[#B42318] hover:bg-red-50" onClick={() => setDeleteTarget(item)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [form],
  );

  const categories = categoriesQuery.data ?? [];
  const nextPosition = Math.max(-1, ...categories.map((category) => category.position)) + 1;
  const normalizeName = (value: string) => value.trim().toLowerCase();

  return (
    <div>
      <PageHeader
        title="Categorias"
        breadcrumb="Inicio /Categorias"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              createMutation.reset();
              updateMutation.reset();
              form.clearErrors();
              form.reset({ name: "", position: nextPosition, parentCategoryId: "" });
              setOpenForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} className="max-w-md" />
          {categoriesQuery.isFetching && !categoriesQuery.isLoading ? <p className="text-xs text-muted">Actualizando...</p> : null}
        </div>

        {categoriesQuery.isLoading ? (
          <LoadingState message="Cargando categorías..." />
        ) : categoriesQuery.isError ? (
          <p className="py-6 text-sm text-[#B42318]">No se pudieron cargar las categorías.</p>
        ) : (
          <DataTable columns={columns} data={categories} rowKey={(row) => row.id} emptyMessage="No hay categorías registradas." />
        )}
      </div>

      <CrudDialog
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) {
            setEditing(null);
            createMutation.reset();
            updateMutation.reset();
            form.clearErrors();
          }
        }}
        title={editing ? "Editar Categoría" : "Nueva Categoría"}
        maxWidthClassName="max-w-xl"
      >
        <EntityForm
          onSubmit={form.handleSubmit((values) => {
            createMutation.reset();
            updateMutation.reset();
            form.clearErrors("name");

            const targetName = normalizeName(values.name);
            const alreadyExists = categories.some(
              (category) => normalizeName(category.name) === targetName && category.id !== editing?.id,
            );
            if (alreadyExists) {
              form.setError("name", {
                type: "manual",
                message: "Ya existe una categoría con ese nombre.",
              });
              return;
            }

            const payload = {
              name: values.name.trim(),
              position: values.position,
              parentCategoryId: values.parentCategoryId || null,
            };

            if (editing) {
              updateMutation.mutate({ id: editing.id, payload });
            } else {
              createMutation.mutate(payload);
            }
          })}
        >
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? <p className="text-xs text-[#B42318]">{form.formState.errors.name.message}</p> : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="parent">Categoría Padre</Label>
            <Controller
              name="parentCategoryId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="Principal (sin padre)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Principal (sin padre)</SelectItem>
                    {categories
                      .filter((category) => category.id !== editing?.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="position">Posición</Label>
            <Input id="position" type="number" {...form.register("position")} />
            {form.formState.errors.position ? <p className="text-xs text-[#B42318]">{form.formState.errors.position.message}</p> : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}
            </Button>
          </div>
          {createMutation.error ? <p className="text-sm text-[#B42318]">{(createMutation.error as Error).message}</p> : null}
          {updateMutation.error ? <p className="text-sm text-[#B42318]">{(updateMutation.error as Error).message}</p> : null}
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
        title="Eliminar categoría"
        description={`¿Seguro que quieres eliminar "${deleteTarget?.name ?? ""}"?`}
        errorMessage={deleteMutation.error ? (deleteMutation.error as Error).message : undefined}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
