import { Button } from "./Button";

export function Pagination({ page, pageSize, total, onPageChange }) {
  if (total <= pageSize) return null;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between px-md py-sm border-t border-outline-variant/40 dark:border-dark-outline-variant/40">
      <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
        Halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-xs">
        <Button variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Sebelumnya
        </Button>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
