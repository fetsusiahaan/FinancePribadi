import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";

// Placeholder generic buat item sidebar admin yang belum punya implementasi
// nyata. AppRoutes.jsx merender ini untuk semua ADMIN_FLAT_ROUTES kecuali
// "/admin/users" (satu-satunya halaman admin yang sudah nyata).
export function AdminComingSoon({ title, icon = "construction" }) {
  return (
    <Card>
      <EmptyState icon={icon} title={title} description="Fitur ini akan segera hadir." />
    </Card>
  );
}
