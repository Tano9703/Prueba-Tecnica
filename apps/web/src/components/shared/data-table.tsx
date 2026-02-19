import { ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  title: string;
  className?: string;
  showSortIcon?: boolean;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  rowKey: (item: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, data, rowKey, emptyMessage = "No hay datos para mostrar." }: DataTableProps<T>) {
  const emptyState = (
    <div className="py-10 text-center text-sm text-tertiary">
      {emptyMessage}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-tertiary/35 bg-secondary">
      <div className="space-y-3 p-3 md:hidden">
        {data.length === 0 ? (
          emptyState
        ) : (
          data.map((item) => (
            <article key={rowKey(item)} className="rounded-lg border border-tertiary/35 p-3">
              {columns.map((column) =>
                column.key === "actions" ? (
                  <div key={column.key} className="mt-3 border-t border-tertiary/35 pt-3">
                    <div className="flex justify-end">{column.render(item)}</div>
                  </div>
                ) : (
                  <div key={column.key} className="mb-3 last:mb-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">{column.title}</p>
                    <div className={cn("mt-1 text-sm text-primary", column.className)}>{column.render(item)}</div>
                  </div>
                ),
              )}
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={cn(column.className)}>
                  <span className="inline-flex items-center gap-2">
                    {column.title}
                    {column.showSortIcon === false || column.key === "actions" ? null : <ArrowUpDown className="h-3.5 w-3.5 text-tertiary/70" />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-tertiary">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={rowKey(item)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

