export const formatIDR = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const formatCompactIDR = (n) => {
  const value = Number(n) || 0;
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
  return `Rp${value}`;
};

export const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatMonthLabel = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

export const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const todayValue = () => new Date().toISOString().slice(0, 10);
