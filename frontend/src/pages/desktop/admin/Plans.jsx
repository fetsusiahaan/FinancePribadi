import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Table } from "../../../components/ui/Table";
import { Pagination } from "../../../components/ui/Pagination";
import { TierBadge } from "../../../components/ui/TierBadge";
import { formatDate, formatThousands } from "../../../utils/format";
import { listPlans } from "../../../services/admin.service";

/**
 * Subscription > Plans.
 *
 * Namanya menyiratkan katalog paket yang bisa diedit -- harga, limit, fitur.
 * Halaman ini BUKAN itu, dan sengaja: harga belum ada di mana pun dalam sistem,
 * dan TIER_LIMITS di backend masih kosong menunggu angka diputuskan. Layar
 * pengaturan paket yang isinya field kosong hanya akan terlihat seperti fitur
 * yang rusak.
 *
 * Yang ditampilkan adalah yang benar-benar ada datanya: siapa berlangganan apa,
 * sampai kapan, dan berapa jumlahnya per tier. Pengubahannya tetap di
 * /admin/users -- satu jalan tulis saja, supaya tidak ada dua tempat berbeda
 * yang bisa memberi tier dengan aturan yang perlahan berbeda.
 */

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "PREMIUM", label: "Premium" },
  { value: "LIFETIME", label: "Lifetime" },
  { value: "FREE", label: "Dicabut" },
];

function StatCard({ label, value, icon }) {
  return (
    <Card className="p-md">
      <div className="flex items-center gap-sm mb-xs text-on-surface-variant dark:text-dark-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {icon}
        </span>
        <p className="text-body-sm">{label}</p>
      </div>
      <p className="tnum text-xl font-semibold">{formatThousands(value)}</p>
    </Card>
  );
}

// Selisih hari ke tanggal habis, dalam kalender bukan jam: dua tanggal berbeda
// harus terbaca beda hari walau jaraknya cuma beberapa jam.
function daysUntil(iso) {
  const target = new Date(iso.slice(0, 10));
  const today = new Date(new Date().toISOString().slice(0, 10));
  return Math.round((target - today) / 86400000);
}

function ExpiryCell({ row }) {
  if (row.tier === "LIFETIME") {
    return <span className="text-on-surface-variant dark:text-dark-on-surface-variant">Selamanya</span>;
  }
  if (!row.expires_at) {
    return <span className="text-on-surface-variant dark:text-dark-on-surface-variant">—</span>;
  }

  const days = daysUntil(row.expires_at);
  const date = formatDate(row.expires_at.slice(0, 10));

  // Baris yang tersimpan PREMIUM tapi efektifnya FREE adalah yang sudah lewat
  // tanggal. Itulah kolom yang paling dicari di halaman ini -- siapa yang perlu
  // ditagih perpanjangan -- jadi keadaannya dieja, bukan cuma tanggal mentah.
  if (row.effective_tier === "FREE" && row.tier === "PREMIUM") {
    return (
      <span className="text-danger dark:text-dark-danger">
        Habis {date} ({Math.abs(days)} hari lalu)
      </span>
    );
  }
  return (
    <span className={days <= 7 ? "text-warning dark:text-dark-warning" : ""}>
      {date} ({days} hari lagi)
    </span>
  );
}

export function AdminPlans() {
  const [page, setPage] = useState(1);
  const [tier, setTier] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-plans", { page, tier }],
    queryFn: () => listPlans({ page, page_size: 20, tier: tier || undefined }),
  });

  if (isLoading) {
    return (
      <Card>
        <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Memuat paket...</p>
      </Card>
    );
  }
  if (isError) return <ErrorState onRetry={refetch} retrying={isFetching} />;

  const { summary } = data;

  return (
    <div className="space-y-md">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard label="Free" value={summary.free} icon="person" />
        <StatCard label="Premium aktif" value={summary.premium} icon="workspace_premium" />
        <StatCard label="Lifetime" value={summary.lifetime} icon="all_inclusive" />
        <StatCard label="Total berbayar" value={summary.paying} icon="payments" />
      </div>

      <Card className="p-md">
        <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Harga dan batas tiap paket belum ditetapkan, jadi belum ada yang bisa diatur di sini.
          Halaman ini menampilkan akun yang pernah diberi tier. Pemberian dan pencabutan tier
          dilakukan lewat tombol <strong>Ubah Tier</strong> di halaman Users.
        </p>
      </Card>

      <div className="flex items-center gap-xs flex-wrap">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={tier === f.value ? "primary" : "outline"}
            className="min-h-8 px-3 py-1 text-[12px]"
            onClick={() => {
              setPage(1);
              setTier(f.value);
            }}
          >
            {f.label}
          </Button>
        ))}
        {isFetching && (
          <span className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant">Memuat...</span>
        )}
      </div>

      {data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon="workspace_premium"
            title="Belum ada akun berbayar"
            description="Akun yang diberi Premium atau Lifetime lewat halaman Users akan muncul di sini."
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            columns={[
              { key: "name", label: "Nama" },
              { key: "email", label: "Email" },
              { key: "tier", label: "Tier" },
              { key: "expiry", label: "Masa Berlaku" },
              { key: "since", label: "Sejak" },
            ]}
          >
            {data.items.map((row) => (
              <tr key={row.user_id} className="hover:bg-surface-container/60 dark:hover:bg-dark-surface-container/60">
                <td className="px-md py-sm font-medium">
                  {row.name}
                  {row.is_suspended && (
                    <span className="ml-xs text-[11px] font-semibold uppercase text-danger dark:text-dark-danger">
                      suspended
                    </span>
                  )}
                </td>
                <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">{row.email}</td>
                <td className="px-md py-sm">
                  {/* Yang ditampilkan tier EFEKTIF, bukan yang tersimpan: baris
                      PREMIUM lewat tanggal sudah Free bagi user, dan badge
                      Premium di sini akan berbohong soal apa yang ia dapat. */}
                  <TierBadge tier={row.effective_tier} />
                </td>
                <td className="px-md py-sm">
                  <ExpiryCell row={row} />
                </td>
                <td className="px-md py-sm text-on-surface-variant dark:text-dark-on-surface-variant">
                  {formatDate(row.starts_at.slice(0, 10))}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
