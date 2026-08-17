import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { getMe, updateMe, changePassword, exportMyData, deleteMe } from "../../services/user.service";
import { formatThousands, stripThousands } from "../../utils/format";
import { useCurrency } from "../../contexts/CurrencyContext";

const APP_VERSION = "1.1.0";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

// Placeholder kartu supaya tinggi halaman tidak melompat saat data tiba.
function ProfileSkeleton() {
  return (
    <div className="space-y-md motion-safe:animate-pulse" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 rounded-xl bg-surface-container dark:bg-dark-surface-container" />
      ))}
    </div>
  );
}

// Badge ikon bulat, konsisten dgn header seksi Dashboard/Budget mobile —
// bukan ikon polos di samping judul seperti versi desktop.
function SectionCard({ id, icon, title, children }) {
  return (
    <Card id={id} className="p-0 overflow-hidden scroll-mt-20">
      <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant/40 dark:border-dark-outline-variant/40">
        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {icon}
          </span>
        </span>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <div className="divide-y divide-outline-variant/40 dark:divide-dark-outline-variant/40">{children}</div>
    </Card>
  );
}

function SettingRow({ icon, label, value, action }) {
  return (
    <div className="flex items-center gap-sm px-md py-sm">
      <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-dark-on-surface-variant shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium truncate">{label}</p>
        {value && (
          <p className="text-[12px] text-on-surface-variant dark:text-dark-on-surface-variant truncate">{value}</p>
        )}
      </div>
      {/* shrink-0 supaya tombol aksi (mis. "Menyiapkan...") tidak ikut terjepit
          saat label/value di sebelahnya panjang di layar sempit. */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// aria-disabled, bukan <button disabled> kosong — barisnya sengaja non-interaktif
// dan statusnya diumumkan lewat teks, bukan cuma opacity.
function ComingSoonRow({ icon, label }) {
  return (
    <div aria-disabled="true" className="flex items-center gap-sm px-md py-sm opacity-50">
      <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
        {icon}
      </span>
      <p className="flex-1 min-w-0 text-body-sm font-medium truncate">{label}</p>
      <span className="text-[11px] px-xs py-[1px] rounded bg-warning/15 dark:bg-dark-warning/20 text-warning dark:text-dark-warning whitespace-nowrap">
        Segera hadir
      </span>
    </div>
  );
}

function PasswordField({ id, label, autoComplete, value, onChange, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-xs">
      <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="pr-12"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={show}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {show ? "visibility" : "visibility_off"}
          </span>
        </button>
      </div>
    </div>
  );
}

function FormError({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="flex items-start gap-xs text-body-sm text-danger dark:text-dark-danger">
      <span className="material-symbols-outlined text-[16px] leading-5 shrink-0" aria-hidden="true">
        error
      </span>
      {error}
    </p>
  );
}

function ModalFooter({ onCancel, submitting, submitLabel = "Simpan" }) {
  return (
    <div className="flex gap-sm pt-xs">
      <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
        Batal
      </Button>
      <Button type="submit" className="flex-1" disabled={submitting}>
        {submitting ? "Menyimpan..." : submitLabel}
      </Button>
    </div>
  );
}

function AccountForm({ user, onSubmit, onCancel, submitting, error }) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, phone: phone || null });
      }}
      className="space-y-md"
    >
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="name">
          Nama
        </label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="email">
          Email
        </label>
        <Input id="email" type="email" value={user.email} disabled />
        <p className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Email belum bisa diubah lewat halaman ini.
        </p>
      </div>
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="phone">
          Nomor HP
        </label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <FormError error={error} />
      <ModalFooter onCancel={onCancel} submitting={submitting} />
    </form>
  );
}

function FinanceForm({ user, onSubmit, onCancel, submitting, error }) {
  const [incomeRange, setIncomeRange] = useState(user.income_range ?? "");
  const [profession, setProfession] = useState(user.profession || "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          income_range: incomeRange === "" ? null : Number(incomeRange),
          profession: profession || null,
        });
      }}
      className="space-y-md"
    >
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="income">
          Pendapatan (Rp)
        </label>
        <Input
          id="income"
          type="text"
          inputMode="numeric"
          className="tnum"
          aria-describedby="income-help"
          value={formatThousands(incomeRange)}
          onChange={(e) => setIncomeRange(stripThousands(e.target.value))}
        />
        <p id="income-help" className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">
          Titik ribuan otomatis mengikuti angka yang kamu ketik.
        </p>
      </div>
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="profession">
          Sumber Pendapatan
        </label>
        <Input
          id="profession"
          placeholder="Karyawan, Freelancer, dll."
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
        />
      </div>
      <FormError error={error} />
      <ModalFooter onCancel={onCancel} submitting={submitting} />
    </form>
  );
}

function PasswordForm({ onSubmit, onCancel, submitting, error }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    if (newPassword !== confirmPassword) {
      setLocalError("Konfirmasi password baru tidak sama");
      return;
    }
    onSubmit({ current_password: currentPassword, new_password: newPassword });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-md">
      <PasswordField
        id="current-password"
        label="Password Saat Ini"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <PasswordField
        id="new-password"
        label="Password Baru"
        autoComplete="new-password"
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <PasswordField
        id="confirm-password"
        label="Konfirmasi Password Baru"
        autoComplete="new-password"
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <p className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant">
        Sesi login di perangkat lain tetap aktif sampai kedaluwarsa.
      </p>
      <FormError error={localError || error} />
      <ModalFooter onCancel={onCancel} submitting={submitting} submitLabel="Ganti Password" />
    </form>
  );
}

function DeleteAccountForm({ onSubmit, onCancel, submitting, error }) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const canSubmit = password.length > 0 && confirmText === "HAPUS";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ password });
      }}
      className="space-y-md"
    >
      <p role="alert" className="text-body-sm text-danger dark:text-dark-danger">
        Transaksi, budget, kategori, target, dan utang kamu ikut terhapus permanen dan tidak bisa dikembalikan.
      </p>
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="delete-password">
          Password
        </label>
        <Input
          id="delete-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-xs">
        <label className="text-label-sm text-on-surface-variant dark:text-dark-on-surface-variant" htmlFor="confirm-text">
          Ketik <strong>HAPUS</strong> untuk konfirmasi
        </label>
        <Input id="confirm-text" required value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
      </div>
      <FormError error={error} />
      <div className="flex gap-sm pt-xs">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="danger" className="flex-1" disabled={submitting || !canSubmit}>
          {submitting ? "Menghapus..." : "Hapus Akun"}
        </Button>
      </div>
    </form>
  );
}

export function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logout, replaceToken } = useAuth();
  const { formatMoney, currency, rateLoading, setCurrency, settingCurrency } = useCurrency();
  const [modal, setModal] = useState(null);
  const [formError, setFormError] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);

  const {
    data: user,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({ queryKey: ["me"], queryFn: getMe });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      invalidate();
      setModal(null);
      setFormError(null);
    },
    onError: (err) => setFormError(err.response?.data?.message || "Gagal menyimpan perubahan"),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      replaceToken(data.token);
      setModal(null);
      setFormError(null);
      setPasswordNotice("Password berhasil diganti.");
    },
    onError: (err) => setFormError(err.response?.data?.message || "Gagal mengganti password"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      logout();
      navigate("/login");
    },
    onError: (err) => setFormError(err.response?.data?.message || "Gagal menghapus akun"),
  });

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finora-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!passwordNotice) return undefined;
    const timer = setTimeout(() => setPasswordNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [passwordNotice]);

  function openModal(mode) {
    setFormError(null);
    setModal(mode);
  }

  return (
    <DashboardLayout title="Profil">
      {isLoading && (
        <>
          <p className="sr-only" role="status">
            Memuat data profil
          </p>
          <ProfileSkeleton />
        </>
      )}
      {isError && <ErrorState onRetry={refetch} retrying={isRefetching} />}

      {user && (
        <div className="space-y-md">
          <Card className="p-md flex items-center gap-sm">
            <span
              aria-hidden="true"
              className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold shrink-0"
            >
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-body-sm text-on-surface-variant dark:text-dark-on-surface-variant truncate">
                {user.email}
              </p>
            </div>
          </Card>

          <SectionCard icon="account_circle" title="Akun">
            <SettingRow
              icon="badge"
              label="Nama & Nomor HP"
              value={user.phone || "Belum diisi"}
              action={
                <Button variant="ghost" onClick={() => openModal("account")}>
                  Ubah
                </Button>
              }
            />
            <ComingSoonRow icon="add_a_photo" label="Foto Profil" />
          </SectionCard>

          <SectionCard icon="payments" title="Keuangan">
            <SettingRow
              icon="account_balance_wallet"
              label="Pendapatan & Sumber"
              value={
                user.income_range
                  ? `${formatMoney(user.income_range)}${user.profession ? " · " + user.profession : ""}`
                  : "Belum diisi"
              }
              action={
                <Button variant="ghost" onClick={() => openModal("finance")}>
                  Ubah
                </Button>
              }
            />
            <ComingSoonRow icon="event" label="Tanggal Gajian" />
          </SectionCard>

          <SectionCard icon="flag" title="Target Keuangan">
            <ComingSoonRow icon="target" label="Target Saya" />
            <ComingSoonRow icon="emergency" label="Dana Darurat" />
            <ComingSoonRow icon="savings" label="Tabungan" />
            <ComingSoonRow icon="credit_card_off" label="Pelunasan Utang" />
          </SectionCard>

          <SectionCard icon="smart_toy" title="AI Finance">
            <ComingSoonRow icon="tune" label="Preferensi AI" />
            <ComingSoonRow icon="chat" label="Gaya Komunikasi" />
            <ComingSoonRow icon="lightbulb" label="Rekomendasi AI" />
            <ComingSoonRow icon="insights" label="Analisis Keuangan" />
          </SectionCard>

          <SectionCard id="notifikasi" icon="notifications" title="Notifikasi">
            <ComingSoonRow icon="alarm" label="Pengingat" />
            <ComingSoonRow icon="warning" label="Budget Alert" />
            <ComingSoonRow icon="receipt" label="Tagihan" />
            <ComingSoonRow icon="summarize" label="Laporan" />
          </SectionCard>

          <SectionCard icon="lock" title="Keamanan">
            {passwordNotice && (
              <p role="status" className="px-md py-sm text-body-sm text-success dark:text-dark-success">
                {passwordNotice}
              </p>
            )}
            <SettingRow
              icon="password"
              label="Ganti Password"
              action={
                <Button variant="ghost" onClick={() => openModal("password")}>
                  Ubah
                </Button>
              }
            />
            <ComingSoonRow icon="pin" label="PIN" />
            <ComingSoonRow icon="fingerprint" label="Biometric" />
            <ComingSoonRow icon="verified_user" label="2FA" />
            <ComingSoonRow icon="devices" label="Perangkat Login" />
          </SectionCard>

          <SectionCard icon="shield" title="Privasi & Data">
            <SettingRow
              icon="download"
              label="Export Data"
              value="Unduh seluruh data kamu sebagai JSON"
              action={
                <Button variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? "Menyiapkan..." : "Export"}
                </Button>
              }
            />
            <ComingSoonRow icon="data_usage" label="Data yang Digunakan" />
            <ComingSoonRow icon="delete_sweep" label="Hapus Data" />
            <SettingRow
              icon="person_remove"
              label="Hapus Akun"
              value="Permanen, tidak bisa dikembalikan"
              action={
                <Button variant="danger" onClick={() => openModal("delete")}>
                  Hapus
                </Button>
              }
            />
          </SectionCard>

          <SectionCard icon="settings" title="Pengaturan">
            <SettingRow icon="dark_mode" label="Tema" action={<ThemeToggle />} />
            <ComingSoonRow icon="language" label="Bahasa" />
            <SettingRow
              icon="currency_exchange"
              label="Mata Uang"
              value={rateLoading && currency === "USD" ? "Memuat kurs..." : undefined}
              action={
                <div role="radiogroup" aria-label="Pilih mata uang" className="flex gap-[3px]">
                  {["IDR", "USD"].map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="radio"
                      aria-checked={currency === code}
                      disabled={settingCurrency}
                      onClick={() => setCurrency(code)}
                      className={`min-h-8 px-sm rounded-md text-[12px] font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                        currency === code
                          ? "bg-primary text-on-primary"
                          : "border border-outline-variant dark:border-dark-outline-variant text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container"
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              }
            />
            <SettingRow icon="info" label="Tentang Aplikasi" value={`Finora AI v${APP_VERSION}`} />
            <SettingRow
              icon="logout"
              label="Keluar"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Keluar
                </Button>
              }
            />
          </SectionCard>
        </div>
      )}

      <Modal open={modal === "account"} onClose={() => setModal(null)} title="Ubah Akun">
        {modal === "account" && user && (
          <AccountForm
            user={user}
            onSubmit={(payload) => updateMutation.mutate(payload)}
            onCancel={() => setModal(null)}
            submitting={updateMutation.isPending}
            error={formError}
          />
        )}
      </Modal>

      <Modal open={modal === "finance"} onClose={() => setModal(null)} title="Ubah Keuangan">
        {modal === "finance" && user && (
          <FinanceForm
            user={user}
            onSubmit={(payload) => updateMutation.mutate(payload)}
            onCancel={() => setModal(null)}
            submitting={updateMutation.isPending}
            error={formError}
          />
        )}
      </Modal>

      <Modal open={modal === "password"} onClose={() => setModal(null)} title="Ganti Password">
        {modal === "password" && (
          <PasswordForm
            onSubmit={(payload) => passwordMutation.mutate(payload)}
            onCancel={() => setModal(null)}
            submitting={passwordMutation.isPending}
            error={formError}
          />
        )}
      </Modal>

      <Modal open={modal === "delete"} onClose={() => setModal(null)} title="Hapus Akun">
        {modal === "delete" && (
          <DeleteAccountForm
            onSubmit={(payload) => deleteMutation.mutate(payload)}
            onCancel={() => setModal(null)}
            submitting={deleteMutation.isPending}
            error={formError}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
