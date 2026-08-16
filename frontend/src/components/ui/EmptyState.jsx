export function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-xl px-md">
      <span
        className="material-symbols-outlined text-outline dark:text-dark-outline"
        style={{ fontSize: "48px" }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-sm font-medium text-on-background dark:text-dark-on-background">{title}</p>
      {description && (
        <p className="mt-xs text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-md">{action}</div>}
    </div>
  );
}
