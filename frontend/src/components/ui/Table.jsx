export function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead className="bg-surface-container dark:bg-dark-surface-container">
          <tr className="text-left text-on-surface-variant dark:text-dark-on-surface-variant">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-md py-sm font-medium ${col.align === "right" ? "text-right" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}
